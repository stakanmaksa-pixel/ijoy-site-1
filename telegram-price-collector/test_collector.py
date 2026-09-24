import sqlite3
import tempfile
import unittest
from pathlib import Path
from unittest.mock import Mock

import collector


class CollectorTests(unittest.TestCase):
    def test_detects_currency_and_plain_integer_price_rows(self):
        self.assertTrue(collector.has_price_lines("iPhone 17 256 Blue - 77.200₽"))
        self.assertTrue(collector.has_price_lines("iPhone 17 Pro 512 Silver 121400"))
        self.assertTrue(collector.has_price_lines("18 Pro 256 Silver (eSim) - 124.000 (НЕАКТИВ)"))
        self.assertTrue(collector.has_price_lines("iPhone 17 256 Blue - 78.100₽🏎️"))
        self.assertTrue(collector.has_price_lines("iPhone 17 256 Blue - 77.200 🚀"))
        self.assertFalse(collector.has_price_lines("Прайс будет позже"))
        self.assertFalse(collector.has_price_lines("📲 iPhone 18 Pro (eSim)"))

    def test_extracts_message_text_and_media_caption(self):
        self.assertEqual(
            collector.message_text({"content": {"@type": "messageText", "text": {"text": "text"}}}),
            "text",
        )
        self.assertEqual(
            collector.message_text({"content": {"@type": "messagePhoto", "caption": {"text": "caption"}}}),
            "caption",
        )

    def test_seen_messages_and_completed_slots_are_persistent(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            db = collector.open_state(Path(temp_dir) / "state.sqlite3")
            collector.save_seen(db, [("123", 1, "hash")], "2026-09-25T11:00@Europe/Moscow")
            self.assertEqual(db.execute("SELECT COUNT(*) FROM seen_messages").fetchone()[0], 1)
            self.assertEqual(db.execute("SELECT COUNT(*) FROM completed_slots").fetchone()[0], 1)
            db.close()

    def test_cartel_inline_full_price_button_is_clicked_once_per_slot(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            db = collector.open_state(Path(temp_dir) / "state.sqlite3")
            button = {
                "text": "📋 Полный прайс лист",
                "type": {"@type": "inlineKeyboardButtonTypeCallback", "data": "AQ=="},
            }
            client = Mock()
            client.request.side_effect = [
                {"messages": [{"id": 42, "reply_markup": {
                    "@type": "replyMarkupInlineKeyboard", "rows": [[button]],
                }}]},
                {"@type": "callbackQueryAnswer", "text": "Готово"},
            ]
            sources = [("@CartelPricesBot", "123", "Cartel Prices Bot")]
            slot = "2026-09-25T11:00@Europe/Moscow"

            self.assertTrue(collector.request_cartel_full_price(db, client, sources, slot))
            self.assertTrue(collector.request_cartel_full_price(db, client, sources, slot))
            self.assertEqual(client.request.call_count, 2)
            call = client.request.call_args.args[0]
            self.assertEqual(call["@type"], "getCallbackQueryAnswer")
            self.assertEqual(call["message_id"], 42)
            self.assertEqual(call["payload"]["data"], "AQ==")
            db.close()

    def test_cartel_reply_keyboard_full_price_button_sends_exact_label(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            db = collector.open_state(Path(temp_dir) / "state.sqlite3")
            client = Mock()
            client.request.side_effect = [
                {"messages": [{"id": 19, "reply_markup": {
                    "@type": "replyMarkupShowKeyboard", "rows": [[{
                        "text": "Полный прайс лист",
                        "type": {"@type": "keyboardButtonTypeText"},
                    }]],
                }}]},
                {"@type": "message", "id": 20},
            ]

            self.assertTrue(collector.request_cartel_full_price(
                db, client, [("@CartelPricesBot", "456", "Cartel Prices Bot")],
                "2026-09-25T14:00@Europe/Moscow",
            ))
            call = client.request.call_args.args[0]
            self.assertEqual(call["@type"], "sendMessage")
            self.assertEqual(call["input_message_content"]["text"]["text"], "Полный прайс лист")
            db.close()

    def test_cartel_button_matching_requires_exact_label(self):
        messages = [{"id": 3, "reply_markup": {
            "@type": "replyMarkupInlineKeyboard", "rows": [[{
                "text": "Открыть прайс",
                "type": {"@type": "inlineKeyboardButtonTypeCallback", "data": "AQ=="},
            }]],
        }}]
        self.assertIsNone(collector.matching_cartel_button(messages))

    def test_cartel_slot_waits_for_a_price_post_after_button_request(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            db = collector.open_state(Path(temp_dir) / "state.sqlite3")
            sources = [("@CartelPricesBot", "456", "Cartel Prices Bot")]
            slot = "2026-09-25T14:00@Europe/Moscow"
            self.assertFalse(collector.cartel_price_received(db, sources, [], slot))
            db.execute(
                "INSERT INTO metadata(key,value) VALUES (?,?)",
                (f"cartel_full_price_requested:456:{slot}", "2026-09-25T10:00:00+00:00"),
            )
            db.commit()
            old_post = [("Cartel Prices Bot", collector.datetime(2026, 9, 25, 9, 59, tzinfo=collector.timezone.utc), "iPhone 18 - 100000")]
            self.assertFalse(collector.cartel_price_received(db, sources, old_post, slot))
            new_post = [("Cartel Prices Bot", collector.datetime(2026, 9, 25, 10, 1, tzinfo=collector.timezone.utc), "iPhone 18 - 100000")]
            self.assertTrue(collector.cartel_price_received(db, sources, new_post, slot))
            db.close()


if __name__ == "__main__":
    unittest.main()
