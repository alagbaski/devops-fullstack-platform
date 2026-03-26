#!/bin/sh

set -eu

LOCKFILE_HASH_FILE="node_modules/.package-lock.hash"
CURRENT_HASH="$(sha256sum package-lock.json | awk '{print $1}')"
INSTALLED_HASH=""

if [ -f "$LOCKFILE_HASH_FILE" ]; then
  INSTALLED_HASH="$(cat "$LOCKFILE_HASH_FILE")"
fi

if [ ! -d node_modules/react ] || [ "$CURRENT_HASH" != "$INSTALLED_HASH" ]; then
  npm ci
  printf "%s" "$CURRENT_HASH" > "$LOCKFILE_HASH_FILE"
fi

exec npm run dev -- --host 0.0.0.0 --port 3000
