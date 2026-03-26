#!/usr/bin/env bash

set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:8000}"
EMAIL="${SMOKE_TEST_EMAIL:-phase1-smoke@example.com}"
PASSWORD="${SMOKE_TEST_PASSWORD:-phase1-smoke-pass}"
ITEM_NAME="${SMOKE_TEST_ITEM:-phase1-smoke-item}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@example.com}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-change-me-too}"
PRODUCT_SLUG="${SMOKE_TEST_PRODUCT_SLUG:-phase-smoke-product-$(date +%s)}"

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

expect_status() {
  local method="$1"
  local url="$2"
  local expected_status="$3"
  local body_file="$4"
  shift 4

  local status
  status="$(curl -sS -o "$body_file" -w "%{http_code}" -X "$method" "$url" "$@")"

  if [[ "$status" != "$expected_status" ]]; then
    echo "Request failed: $method $url"
    echo "Expected status: $expected_status"
    echo "Actual status:   $status"
    echo "Response body:"
    cat "$body_file"
    exit 1
  fi
}

echo "Checking health endpoint..."
expect_status "GET" "$BASE_URL/health" "200" "$TMP_DIR/health.json"

echo "Checking API v1 root..."
expect_status "GET" "$BASE_URL/api/v1" "200" "$TMP_DIR/api_v1.json"

echo "Creating smoke-test user..."
signup_status="$(curl -sS -o "$TMP_DIR/signup.json" -w "%{http_code}" \
  -X POST "$BASE_URL/api/v1/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")"

if [[ "$signup_status" != "201" && "$signup_status" != "400" ]]; then
  echo "Signup failed unexpectedly"
  echo "Status: $signup_status"
  cat "$TMP_DIR/signup.json"
  exit 1
fi

echo "Logging in smoke-test user..."
expect_status "POST" "$BASE_URL/api/v1/auth/login" "200" "$TMP_DIR/login.json" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}"

TOKEN="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["access_token"])' "$TMP_DIR/login.json")"

if [[ -z "$TOKEN" ]]; then
  echo "Login did not return an access token"
  exit 1
fi

echo "Checking authenticated profile endpoint..."
expect_status "GET" "$BASE_URL/api/v1/auth/me" "200" "$TMP_DIR/me.json" \
  -H "Authorization: Bearer $TOKEN"

echo "Logging in admin user..."
expect_status "POST" "$BASE_URL/api/v1/auth/login" "200" "$TMP_DIR/admin-login.json" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}"

ADMIN_TOKEN="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["access_token"])' "$TMP_DIR/admin-login.json")"

echo "Creating a smoke-test product..."
expect_status "POST" "$BASE_URL/api/v1/products" "201" "$TMP_DIR/product-create.json" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"name\":\"Phase 1 Product\",\"slug\":\"$PRODUCT_SLUG\",\"description\":\"Smoke-test catalog product for the local verification flow.\",\"price\":\"19.99\",\"currency\":\"USD\",\"inventory_count\":5,\"is_active\":true}"

echo "Checking product listing endpoint..."
expect_status "GET" "$BASE_URL/api/v1/products" "200" "$TMP_DIR/products.json"

echo "Checking legacy items endpoint..."
expect_status "GET" "$BASE_URL/items" "200" "$TMP_DIR/items.json"

echo "Creating a legacy smoke-test item..."
expect_status "POST" "$BASE_URL/items" "200" "$TMP_DIR/item_create.json" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"$ITEM_NAME\"}"

echo "Phase 1/2 smoke test passed."
