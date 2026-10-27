#!/usr/bin/env bash
# Compatibility for the command already sent to the owner: use the superseding feed.
set -euo pipefail
echo 'Прайс 04.10 заменён согласованным прайсом 27.10.2026.'
exec bash "$(dirname "$0")/deploy-owner-prices-2026-10-27.sh" "$@"
