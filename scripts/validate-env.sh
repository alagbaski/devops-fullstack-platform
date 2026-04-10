#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ -f "$ROOT_DIR/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT_DIR/.env"
  set +a
fi

required_vars=(
  POSTGRES_DB
  POSTGRES_USER
  POSTGRES_PASSWORD
  RABBITMQ_DEFAULT_USER
  RABBITMQ_DEFAULT_PASS
  RABBITMQ_ERLANG_COOKIE
  RABBITMQ_URL
  JWT_SECRET
  ADMIN_EMAIL
  ADMIN_USERNAME
  ADMIN_PASSWORD
)

missing_vars=()
placeholder_vars=()

for var_name in "${required_vars[@]}"; do
  value="${!var_name-}"
  trimmed_value="$(printf '%s' "$value" | xargs)"

  if [[ -z "$trimmed_value" ]]; then
    missing_vars+=("$var_name")
    continue
  fi

  if [[ "$trimmed_value" =~ ^\$\{[A-Z0-9_]+\}$ ]]; then
    placeholder_vars+=("$var_name")
  fi
done

if (( ${#missing_vars[@]} > 0 || ${#placeholder_vars[@]} > 0 )); then
  echo "Environment validation failed."

  if (( ${#missing_vars[@]} > 0 )); then
    echo
    echo "Missing required values:"
    printf '  - %s\n' "${missing_vars[@]}"
  fi

  if (( ${#placeholder_vars[@]} > 0 )); then
    echo
    echo "Placeholder values still need to be replaced in .env or injected by the runtime:"
    printf '  - %s\n' "${placeholder_vars[@]}"
  fi

  echo
  echo "Use .env.example as a reference only. Populate a real .env locally, or provide"
  echo "the same variables through your cloud/deployment environment before startup."
  exit 1
fi

echo "Environment validation passed."
