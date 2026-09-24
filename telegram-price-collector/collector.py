"""Schedule read-only Telegram collection through the official TDLib JSON API."""

from __future__ import annotations

import ctypes
import ctypes.util
import getpass
import hashlib
import json
import logging
import os
import re
import sqlite3
import sys
import time
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import Request, urlopen
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError


LOG = logging.getLogger("telegram-price-collector")
PRICE_HINT = re.compile(
    r"(?:₽|руб\.?|р\.?)\s*(?:\([^\n)]*\))?\s*(?:🏎️?|🚀|✈️?)?\s*$"
    r"|[-–—]\s*\d[\d.,\s\u00a0]*(?:₽|руб\.?|р\.?)?\s*(?:\([^\n)]*\))?\s*(?:🏎️?|🚀|✈️?)?\s*$"
    r"|\s\d{4,}\s*(?:\([^\n)]*\))?\s*(?:🏎️?|🚀|✈️?)?\s*$",
    re.I,
)
DEFAULT_SCHEDULE = "11:00,14:00,17:30"
DEFAULT_LOOKBACK_HOURS = 24
HISTORY_PAGE_SIZE = 100
HISTORY_MAX_PAGES = 20
CARTEL_FULL_PRICE_BUTTON = "полный прайс лист"


def config() -> dict:
    try:
        api_id = int(os.environ["TELEGRAM_API_ID"])
    except (KeyError, ValueError) as exc:
        raise RuntimeError("Задайте TELEGRAM_API_ID из my.telegram.org") from exc
    api_hash = os.environ.get("TELEGRAM_API_HASH", "").strip()
    encryption_key = os.environ.get("TELEGRAM_DB_ENCRYPTION_KEY", "").strip()
    if not api_hash:
        raise RuntimeError("Задайте TELEGRAM_API_HASH из my.telegram.org")
    if not encryption_key:
        raise RuntimeError("Задайте TELEGRAM_DB_ENCRYPTION_KEY; сгенерируйте его командой openssl rand -base64 32")

    try:
        tz = ZoneInfo(os.environ.get("TELEGRAM_TIMEZONE", "Europe/Moscow"))
    except ZoneInfoNotFoundError as exc:
        raise RuntimeError("Неизвестная временная зона TELEGRAM_TIMEZONE") from exc

    schedule = []
    for item in os.environ.get("TELEGRAM_SCHEDULE", DEFAULT_SCHEDULE).split(","):
        item = item.strip()
        if not re.fullmatch(r"(?:[01]\d|2[0-3]):[0-5]\d", item):
            raise RuntimeError(f"Неверное время в TELEGRAM_SCHEDULE: {item!r}; используйте ЧЧ:ММ")
        schedule.append(item)
    if not schedule or len(set(schedule)) != len(schedule):
        raise RuntimeError("TELEGRAM_SCHEDULE пуст или содержит повторяющееся время")

    api_url = os.environ.get("SITE_API_URL", "").rstrip("/")
    api_token = os.environ.get("SITE_API_TOKEN", "")
    channels = [item.strip() for item in os.environ.get("TELEGRAM_SOURCE_CHANNELS", "").split(",") if item.strip()]
    database = Path(os.environ.get("TELEGRAM_DATABASE", "/data/tdlib-database"))
    state_path = Path(os.environ.get("COLLECTOR_STATE_DB", "/data/collector-state.sqlite3"))
    interval = max(10, int(os.environ.get("POLL_INTERVAL_SECONDS", "30")))
    lookback = max(1, int(os.environ.get("TELEGRAM_INITIAL_LOOKBACK_HOURS", str(DEFAULT_LOOKBACK_HOURS))))
    quiet_minutes = max(0, int(os.environ.get("TELEGRAM_QUIET_MINUTES", "5")))
    grace_minutes = max(5, int(os.environ.get("TELEGRAM_SLOT_GRACE_MINUTES", "30")))
    return {
        "api_id": api_id,
        "api_hash": api_hash,
        "encryption_key": encryption_key,
        "timezone": tz,
        "schedule": sorted(schedule),
        "api_url": api_url,
        "api_token": api_token,
        "channels": channels,
        "database": database,
        "state_path": state_path,
        "interval": interval,
        "lookback_hours": lookback,
        "quiet_minutes": quiet_minutes,
        "grace_minutes": grace_minutes,
    }


class TDJson:
    """Small synchronous adapter over TDLib's official asynchronous JSON C API."""

    def __init__(self, library_path: str, cfg: dict):
        path = library_path or ctypes.util.find_library("tdjson")
        if not path:
            raise RuntimeError("Не найдена libtdjson; проверьте Docker-образ TDLib")
        self.lib = ctypes.CDLL(path)
        self.lib.td_json_client_create.restype = ctypes.c_void_p
        self.lib.td_json_client_send.argtypes = [ctypes.c_void_p, ctypes.c_char_p]
        self.lib.td_json_client_receive.argtypes = [ctypes.c_void_p, ctypes.c_double]
        self.lib.td_json_client_receive.restype = ctypes.c_char_p
        self.lib.td_json_client_destroy.argtypes = [ctypes.c_void_p]
        self.client = self.lib.td_json_client_create()
        if not self.client:
            raise RuntimeError("TDLib не смог создать клиент")
        self.cfg = cfg
        self.queued_auth: list[dict] = []

    def send(self, payload: dict):
        data = json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
        self.lib.td_json_client_send(self.client, data)

    def receive(self, timeout: float = 1.0) -> dict | None:
        raw = self.lib.td_json_client_receive(self.client, timeout)
        if not raw:
            return None
        try:
            return json.loads(raw.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            LOG.warning("TDLib прислал некорректный JSON")
            return None

    def request(self, payload: dict, timeout: int = 45) -> dict:
        extra = str(uuid.uuid4())
        self.send({**payload, "@extra": extra})
        deadline = time.monotonic() + timeout
        while time.monotonic() < deadline:
            item = self.receive(min(1.0, max(0.1, deadline - time.monotonic())))
            if not item:
                continue
            if item.get("@extra") == extra:
                if item.get("@type") == "error":
                    raise RuntimeError(f"TDLib: {item.get('message', 'неизвестная ошибка')}")
                return item
            if item.get("@type") == "updateAuthorizationState":
                self.queued_auth.append(item)
            elif item.get("@type") == "error":
                LOG.error("TDLib: %s", item.get("message", "ошибка"))
        raise TimeoutError(f"Истекло время ожидания TDLib для {payload.get('@type')}")

    def destroy(self):
        if self.client:
            self.lib.td_json_client_destroy(self.client)
            self.client = None


def send_tdlib_parameters(client: TDJson, cfg: dict):
    client.cfg["database"].mkdir(parents=True, exist_ok=True)
    client.send({
        "@type": "setTdlibParameters",
        "use_test_dc": False,
        "database_directory": str(cfg["database"]),
        "files_directory": str(cfg["database"] / "files"),
        # TDLib's JSON API represents bytes as base64; keep the key only in env.
        "database_encryption_key": cfg["encryption_key"],
        "use_file_database": True,
        "use_chat_info_database": True,
        "use_message_database": True,
        "use_secret_chats": False,
        "api_id": cfg["api_id"],
        "api_hash": cfg["api_hash"],
        "system_language_code": "ru",
        "device_model": "iJoy price collector",
        "system_version": "Linux",
        "application_version": "1.0",
    })


def authorize(client: TDJson, cfg: dict, interactive: bool):
    LOG.info("Ожидаю состояние авторизации Telegram")
    parameters_sent = False
    key_checked = False
    ready = False
    while not ready:
        if client.queued_auth:
            event = client.queued_auth.pop(0)
        else:
            event = client.receive(1.0)
            if not event:
                continue
            if event.get("@type") == "error":
                raise RuntimeError(f"Telegram авторизация: {event.get('message', 'неизвестная ошибка')}")
            if event.get("@type") != "updateAuthorizationState":
                continue

        state = event.get("authorization_state", {})
        kind = state.get("@type")
        if kind == "authorizationStateWaitTdlibParameters" and not parameters_sent:
            send_tdlib_parameters(client, cfg)
            parameters_sent = True
        elif kind == "authorizationStateWaitEncryptionKey" and not key_checked:
            client.send({"@type": "checkDatabaseEncryptionKey", "encryption_key": cfg["encryption_key"]})
            key_checked = True
        elif kind == "authorizationStateWaitPhoneNumber":
            if not interactive:
                raise RuntimeError("Нет авторизации. Сначала выполните команду login в интерактивном терминале.")
            phone = input("Номер телефона Telegram в международном формате: ").strip()
            if not phone:
                raise RuntimeError("Номер телефона не введён")
            client.send({"@type": "setAuthenticationPhoneNumber", "phone_number": phone})
        elif kind == "authorizationStateWaitCode":
            if not interactive:
                raise RuntimeError("Telegram ожидает код. Повторите login в интерактивном терминале.")
            code = input("Код из Telegram (вводится только здесь, не отправляйте его в чат): ").strip()
            client.send({"@type": "checkAuthenticationCode", "code": code})
        elif kind == "authorizationStateWaitPassword":
            if not interactive:
                raise RuntimeError("Telegram ожидает пароль 2FA. Повторите login в интерактивном терминале.")
            password = getpass.getpass("Пароль двухэтапной проверки Telegram: ")
            client.send({"@type": "checkAuthenticationPassword", "password": password})
        elif kind == "authorizationStateWaitOtherDeviceConfirmation":
            LOG.info("Подтвердите вход по ссылке Telegram: %s", state.get("link", ""))
        elif kind == "authorizationStateReady":
            ready = True
        elif kind == "authorizationStateWaitRegistration":
            raise RuntimeError("Создание нового Telegram-аккаунта из сборщика не поддерживается")
        elif kind in {"authorizationStateWaitEmailAddress", "authorizationStateWaitEmailCode"}:
            raise RuntimeError("Для этого аккаунта Telegram включена email-авторизация; её нужно завершить в официальном клиенте и повторить login")
        elif kind in {"authorizationStateClosed", "authorizationStateLoggingOut"}:
            raise RuntimeError("TDLib закрыл Telegram-сессию")
    LOG.info("Telegram-сессия готова")


def open_state(path: Path) -> sqlite3.Connection:
    path.parent.mkdir(parents=True, exist_ok=True)
    db = sqlite3.connect(path)
    db.execute("PRAGMA journal_mode=WAL")
    db.execute("""CREATE TABLE IF NOT EXISTS seen_messages (
        chat_id TEXT NOT NULL,
        message_id INTEGER NOT NULL,
        content_hash TEXT NOT NULL,
        PRIMARY KEY(chat_id, message_id)
    )""")
    db.execute("CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL)")
    db.execute("""CREATE TABLE IF NOT EXISTS completed_slots (
        slot TEXT PRIMARY KEY,
        completed_at TEXT NOT NULL
    )""")
    db.commit()
    return db


def text_hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def message_text(message: dict) -> str:
    content = message.get("content", {})
    kind = content.get("@type", "")
    value = content.get("text") if kind == "messageText" else content.get("caption")
    return (value or {}).get("text", "").strip()


def has_price_lines(text: str) -> bool:
    return any(PRICE_HINT.search(line.strip()) for line in text.splitlines() if line.strip())


def submit_batch(api_url: str, token: str, text: str, slot: str, channels: list[str]) -> dict:
    payload = json.dumps({
        "text": text,
        "source": f"telegram-channels:{slot}; {', '.join(channels)}",
    }).encode("utf-8")
    request = Request(
        f"{api_url}/api/bot/price-import",
        data=payload,
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urlopen(request, timeout=60) as response:
            return json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")[:500]
        raise RuntimeError(f"Сайт вернул HTTP {exc.code}: {detail}") from exc
    except URLError as exc:
        raise RuntimeError(f"Не удалось связаться с сайтом: {exc.reason}") from exc


def resolve_sources(client: TDJson, names: list[str]) -> list[tuple[str, str, str]]:
    if not names:
        raise RuntimeError("Укажите источники в TELEGRAM_SOURCE_CHANNELS; команда list поможет узнать ID чатов")
    result = []
    for name in names:
        parsed = urlparse(name if "://" in name else f"https://{name.lstrip('@')}")
        path_name = parsed.path.strip("/") if parsed.netloc.lower() in {"t.me", "telegram.me"} else ""
        token = name
        if path_name and not path_name.startswith("+"):
            token = path_name.split("/")[0]
        if re.fullmatch(r"-?\d+", token):
            chat = client.request({"@type": "getChat", "chat_id": int(token)})
        else:
            username = token.removeprefix("@").strip()
            chat = client.request({"@type": "searchPublicChat", "username": username})
        if chat.get("@type") == "error":
            raise RuntimeError(f"Источник {name!r} недоступен: {chat.get('message')}")
        title = chat.get("title") or name
        result.append((name, str(chat["id"]), title))
        LOG.info("Источник настроен: %s (chat_id=%s)", title, chat["id"])
    return result


def list_chats(client: TDJson):
    seen = set()
    for chat_list in ({"@type": "chatListMain"}, {"@type": "chatListArchive"}):
        try:
            client.request({"@type": "loadChats", "chat_list": chat_list, "limit": 1000})
        except RuntimeError as exc:
            if "404" not in str(exc):
                raise
        chats = client.request({"@type": "getChats", "chat_list": chat_list, "limit": 1000})
        for chat_id in chats.get("chat_ids", []):
            if chat_id in seen:
                continue
            seen.add(chat_id)
            chat = client.request({"@type": "getChat", "chat_id": chat_id})
            chat_type = chat.get("type", {}).get("@type", "")
            if chat_type in {"chatTypeSupergroup", "chatTypeBasicGroup"}:
                LOG.info("%s | id=%s | %s", chat.get("title", "?"), chat_id,
                         "канал" if chat.get("type", {}).get("is_channel") else "группа")


def chat_history(client: TDJson, chat_id: str, since: datetime) -> list[dict]:
    collected = []
    from_id = 0
    oldest_seen = None
    scan_complete = False
    for _ in range(HISTORY_MAX_PAGES):
        page = client.request({
            "@type": "getChatHistory",
            "chat_id": int(chat_id),
            "from_message_id": from_id,
            "offset": 0,
            "limit": HISTORY_PAGE_SIZE,
            "only_local": False,
        })
        messages = page.get("messages", [])
        if not messages:
            scan_complete = True
            break
        oldest = min(int(item["id"]) for item in messages)
        if oldest_seen == oldest:
            scan_complete = True
            break
        oldest_seen = oldest
        for message in messages:
            created = datetime.fromtimestamp(int(message.get("date", 0)), timezone.utc)
            # Keep a recent comparison window to detect edits, and catch up all
            # posts since the last successful scheduled pass.
            if created >= since or message.get("edit_date", 0):
                collected.append(message)
        if min(datetime.fromtimestamp(int(item.get("date", 0)), timezone.utc) for item in messages) < since:
            scan_complete = True
            break
        from_id = oldest
    if not scan_complete:
        raise RuntimeError(f"В чате {chat_id} за интервал больше {HISTORY_PAGE_SIZE * HISTORY_MAX_PAGES} сообщений; партию не отправляю частично")
    return collected


def is_cartel_source(source: tuple[str, str, str]) -> bool:
    configured_name, _, title = source
    normalized = configured_name.strip().lower().lstrip("@")
    return normalized in {"cartelpricesbot", "cartel-prices-bot"} or "cartel prices bot" in title.lower()


def normalize_button_text(value: str) -> str:
    # Ignore leading emoji/decoration, but require the actual label to match;
    # never activate a vaguely similar bot action.
    return " ".join(re.findall(r"[\w]+", value.casefold(), flags=re.UNICODE))


def matching_cartel_button(messages: list[dict]) -> tuple[int, dict] | None:
    for message in messages:  # getChatHistory returns newest messages first
        markup = message.get("reply_markup", {})
        markup_type = markup.get("@type")
        if markup_type == "replyMarkupInlineKeyboard":
            rows = markup.get("rows", [])
        elif markup_type == "replyMarkupShowKeyboard":
            rows = markup.get("rows", [])
        else:
            continue
        for row in rows:
            for button in row:
                if normalize_button_text(button.get("text", "")) == CARTEL_FULL_PRICE_BUTTON:
                    return int(message["id"]), button
    return None


def request_cartel_full_price(db: sqlite3.Connection, client: TDJson, sources, slot: str) -> bool:
    """Activate only Cartel's explicitly named full-price button once per slot."""
    for source in sources:
        if not is_cartel_source(source):
            continue
        _, chat_id, title = source
        marker = f"cartel_full_price_requested:{chat_id}:{slot}"
        if db.execute("SELECT 1 FROM metadata WHERE key=?", (marker,)).fetchone():
            return True

        history = client.request({
            "@type": "getChatHistory",
            "chat_id": int(chat_id),
            "from_message_id": 0,
            "offset": 0,
            "limit": 100,
            "only_local": False,
        }).get("messages", [])
        match = matching_cartel_button(history)
        if not match:
            LOG.warning("В чате %s пока не найдена точная кнопка «Полный прайс лист»; жду и повторю проверку", title)
            return False

        message_id, button = match
        button_type = button.get("type", {})
        kind = button_type.get("@type", "")
        button_text = button.get("text", "Полный прайс лист")
        if kind == "inlineKeyboardButtonTypeCallback":
            result = client.request({
                "@type": "getCallbackQueryAnswer",
                "chat_id": int(chat_id),
                "message_id": message_id,
                "payload": {"@type": "callbackQueryPayloadData", "data": button_type.get("data", "")},
            })
            if result.get("@type") == "error":
                raise RuntimeError(f"Не удалось нажать кнопку «{button_text}» в {title}: {result.get('message')}")
        elif kind == "keyboardButtonTypeText":
            result = client.request({
                "@type": "sendMessage",
                "chat_id": int(chat_id),
                "input_message_content": {
                    "@type": "inputMessageText",
                    "text": {"@type": "formattedText", "text": button_text, "entities": []},
                },
            })
            if result.get("@type") == "error":
                raise RuntimeError(f"Не удалось отправить кнопку «{button_text}» в {title}: {result.get('message')}")
        else:
            LOG.warning("Кнопка «%s» найдена в %s, но её тип %s не поддерживается; не нажимаю", button_text, title, kind)
            return False

        db.execute("INSERT OR REPLACE INTO metadata(key,value) VALUES (?,?)", (marker, datetime.now(timezone.utc).isoformat()))
        db.commit()
        LOG.info("В %s запрошена кнопка «%s»; собираю выданный прайс", title, button_text)
        return True
    return True


def cartel_price_received(db: sqlite3.Connection, sources, messages, slot: str) -> bool:
    """Keep the slot open until Cartel has posted price text after the request."""
    for source in sources:
        if not is_cartel_source(source):
            continue
        _, chat_id, title = source
        marker = f"cartel_full_price_requested:{chat_id}:{slot}"
        requested = db.execute("SELECT value FROM metadata WHERE key=?", (marker,)).fetchone()
        if not requested:
            return False
        requested_at = datetime.fromisoformat(requested[0])
        return any(
            message_title == title and post_date >= requested_at and has_price_lines(body)
            for message_title, post_date, body in messages
        )
    return True


def collect_new(db: sqlite3.Connection, client: TDJson, sources, lookback_hours: int):
    now = datetime.now(timezone.utc)
    last = db.execute("SELECT value FROM metadata WHERE key='last_success_at'").fetchone()
    since = datetime.fromisoformat(last[0]) if last else now - timedelta(hours=lookback_hours)
    texts: list[tuple[int, datetime, str, str]] = []
    pending: list[tuple[str, int, str]] = []
    scanned = 0
    for source_index, (_, chat_id, title) in enumerate(sources):
        source_texts: list[tuple[datetime, str]] = []
        known_rows = db.execute("SELECT message_id, content_hash FROM seen_messages WHERE chat_id=?", (chat_id,)).fetchall()
        known = {message_id: digest for message_id, digest in known_rows}
        for message in chat_history(client, chat_id, since):
            scanned += 1
            body = message_text(message)
            message_id = int(message["id"])
            digest = text_hash(body)
            created = datetime.fromtimestamp(int(message.get("date", 0)), timezone.utc)
            was_seen = known.get(message_id)
            pending.append((chat_id, message_id, digest))
            if not body:
                continue
            # New historical messages older than the last completed slot are
            # checkpointed but not applied; changed older posts are imported.
            if was_seen != digest and (created >= since or (was_seen and message.get("edit_date"))):
                if has_price_lines(body):
                    source_texts.append((created, body))
                    LOG.info("Новый/изменённый текстовый пост: %s, message_id=%s", title, message_id)
        source_texts.sort(key=lambda item: item[0])
        if source_texts:
            texts.append((source_index, source_texts[-1][0], title, "\n\n".join(body for _, body in source_texts)))
    texts.sort(key=lambda item: (item[0], item[1]))
    return [(title, latest, body) for _, latest, title, body in texts], pending, scanned


def save_seen(db: sqlite3.Connection, records: list[tuple[str, int, str]], slot: str):
    if records:
        db.executemany(
            "INSERT INTO seen_messages(chat_id, message_id, content_hash) VALUES (?, ?, ?) "
            "ON CONFLICT(chat_id, message_id) DO UPDATE SET content_hash=excluded.content_hash",
            records,
        )
    db.execute("INSERT OR REPLACE INTO metadata(key,value) VALUES ('last_success_at',?)",
               (datetime.now(timezone.utc).isoformat(),))
    db.execute("INSERT OR REPLACE INTO completed_slots(slot,completed_at) VALUES (?,?)",
               (slot, datetime.now(timezone.utc).isoformat()))
    db.execute("""DELETE FROM seen_messages WHERE (chat_id, message_id) IN (
        SELECT chat_id, message_id FROM seen_messages AS old
        WHERE old.chat_id = seen_messages.chat_id
        ORDER BY old.message_id DESC LIMIT -1 OFFSET 2000
    )""")
    db.commit()


def pending_slot(db: sqlite3.Connection, cfg: dict) -> str | None:
    now = datetime.now(cfg["timezone"])
    for clock in cfg["schedule"]:
        hour, minute = map(int, clock.split(":"))
        scheduled = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
        slot = f"{now.date().isoformat()}T{clock}@{cfg['timezone'].key}"
        if timedelta(0) <= now - scheduled <= timedelta(minutes=cfg["grace_minutes"]):
            if not db.execute("SELECT 1 FROM completed_slots WHERE slot=?", (slot,)).fetchone():
                return slot
    return None


def process_slot(db: sqlite3.Connection, client: TDJson, cfg: dict, sources, slot: str):
    if not request_cartel_full_price(db, client, sources, slot):
        return False
    messages, hashes, scanned = collect_new(db, client, sources, cfg["lookback_hours"])
    if not cartel_price_received(db, sources, messages, slot):
        LOG.info("Жду текст полного прайса Cartel после нажатия кнопки; партию пока не отправляю")
        return False
    if messages:
        latest_post = max(post_date for _, post_date, _ in messages)
        quiet_for = datetime.now(timezone.utc) - latest_post
        if quiet_for < timedelta(minutes=cfg["quiet_minutes"]):
            LOG.info("Прайс ещё может дополняться; жду тишины %s мин.", cfg["quiet_minutes"])
            return False
        if not cfg["api_url"] or not cfg["api_token"]:
            raise RuntimeError("Для публикации партии задайте SITE_API_URL и SITE_API_TOKEN")
        result = submit_batch(
            cfg["api_url"], cfg["api_token"],
            "\n\n[[PRICE_SOURCE_BOUNDARY]]\n\n".join(body for _, _, body in messages), slot,
            [source[2] for source in sources],
        )
        save_seen(db, hashes, slot)
        LOG.info(
            "Партия %s создана: %s строк, совпало %s, без совпадения %s, ошибок %s, пропущено %s",
            result.get("batchId"), result.get("total"), result.get("matched"),
            result.get("unmatched"), result.get("errors"), result.get("skipped"),
        )
    else:
        save_seen(db, hashes, slot)
        LOG.info("В %s новых сообщений с ценами нет (проверено %s сообщений)", slot, scanned)
    return True


def run_collector(cfg: dict):
    if not cfg["channels"]:
        raise RuntimeError("Укажите каналы в TELEGRAM_SOURCE_CHANNELS")
    if not cfg["api_url"] or not cfg["api_token"]:
        raise RuntimeError("Для запуска задайте SITE_API_URL и SITE_API_TOKEN")
    db = open_state(cfg["state_path"])
    client = TDJson(os.environ.get("TDLIB_LIBRARY", ""), cfg)
    try:
        authorize(client, cfg, interactive=False)
        sources = resolve_sources(client, cfg["channels"])
        LOG.info("Сборщик запущен; расписание %s (%s)", ", ".join(cfg["schedule"]), cfg["timezone"].key)
        while True:
            slot = pending_slot(db, cfg)
            if slot:
                try:
                    completed = process_slot(db, client, cfg, sources, slot)
                    if not completed:
                        time.sleep(cfg["interval"])
                        continue
                except Exception:
                    LOG.exception("Слот %s не выполнен; попробую повторить, пока он актуален", slot)
                    time.sleep(60)
                    continue
            time.sleep(cfg["interval"])
    finally:
        db.close()
        client.destroy()


def login_or_list(cfg: dict, show_chats: bool):
    client = TDJson(os.environ.get("TDLIB_LIBRARY", ""), cfg)
    try:
        authorize(client, cfg, interactive=True)
        LOG.info("Авторизация успешно сохранена в зашифрованной базе TDLib.")
        if show_chats:
            list_chats(client)
    finally:
        client.destroy()


def main():
    logging.basicConfig(level=os.environ.get("LOG_LEVEL", "INFO"), format="%(asctime)s %(levelname)s %(message)s")
    cfg = config()
    command = sys.argv[1] if len(sys.argv) > 1 else "run"
    if command == "login":
        login_or_list(cfg, show_chats=False)
    elif command == "list":
        login_or_list(cfg, show_chats=True)
    elif command == "run":
        run_collector(cfg)
    else:
        raise RuntimeError("Используйте команды login, list или run")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        LOG.info("Остановлено")
    except Exception as exc:
        logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
        LOG.error("%s", exc)
        raise
