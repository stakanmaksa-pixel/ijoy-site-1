#!/usr/bin/env bash
# Run from the repository root after git pull. Each data step keeps its own backup.
set -euo pipefail
if [[ $# != 0 || ! -f prisma/data/owner-price-2026-10-04.txt || ! -f .env.docker ]]; then
  echo 'Запустите без аргументов из /opt/ijoy, где есть .env.docker.' >&2
  exit 1
fi

docker compose --env-file .env.docker build app migrate
docker compose --env-file .env.docker run --rm migrate
docker compose --env-file .env.docker up -d --no-deps --wait --wait-timeout 120 app
docker compose --env-file .env.docker run --rm migrate npx tsx prisma/scripts/finalize-owner-price-2026-10-04.ts --apply

# Ask for compression like a browser, and read the entire response to catch stalls.
docker compose --env-file .env.docker exec -T app node --input-type=module <<'NODE'
for (const [slug, name] of [
  ['ipad-mini-a20-pro', 'A20 Pro'],
  ['iphone-18-pro-max', 'iPhone 18 Pro Max'],
  ['apple-watch-series-12', 'Apple Watch Series 12'],
]) {
  const started = Date.now();
  const response = await fetch(`http://127.0.0.1:3000/product/${slug}`, {
    headers: { 'Accept-Encoding': 'gzip, deflate, br' }, signal: AbortSignal.timeout(15000),
  });
  const body = await response.text();
  if (response.status !== 200 || !body.includes(name)) throw Error(`${slug}: неверный или неполный ответ (${response.status})`);
  console.log(`OK HTTP ${slug}: ${response.status}, ${Date.now() - started} ms, ${body.length} characters`);
}
NODE
echo 'ГОТОВО: приложение обновлено, согласованные цены и SIM проверены, большие страницы отвечают.'
