#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────
# trivy-scan.sh — Local Trivy security scanner for devops-fullstack-platform
# ──────────────────────────────────────────────────────────────────────
#
# Usage:
#   ./scripts/trivy-scan.sh              # Run all scans
#   ./scripts/trivy-scan.sh fs           # Dependency scan only
#   ./scripts/trivy-scan.sh iac          # IaC misconfiguration scan only
#   ./scripts/trivy-scan.sh image        # Docker image scan only (builds first)
#   ./scripts/trivy-scan.sh secret       # Secret scan only
#
# Prerequisites:
#   - Trivy installed: https://aquasecurity.github.io/trivy/latest/getting-started/installation/
#   - Docker (for image scanning)
# ──────────────────────────────────────────────────────────────────────
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SEVERITY="CRITICAL,HIGH,MEDIUM"
TRIVYIGNORE="${REPO_ROOT}/.trivyignore"
SCAN_TYPE="${1:-all}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

header() {
  echo ""
  echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
  echo -e "${CYAN}  $1${NC}"
  echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
  echo ""
}

# ── Check Trivy is installed ────────────────────────────────────────
if ! command -v trivy &>/dev/null; then
  echo -e "${RED}Error: Trivy is not installed.${NC}"
  echo ""
  echo "Install it via:"
  echo "  curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin"
  echo ""
  echo "Or see: https://aquasecurity.github.io/trivy/latest/getting-started/installation/"
  exit 1
fi

echo -e "${GREEN}Trivy version: $(trivy --version | head -1)${NC}"

# ── Filesystem / Dependency Scan ────────────────────────────────────
run_fs_scan() {
  header "Filesystem & Dependency Scan"
  trivy fs \
    --severity "${SEVERITY}" \
    --ignorefile "${TRIVYIGNORE}" \
    --exit-code 0 \
    "${REPO_ROOT}"
}

# ── IaC Misconfiguration Scan ──────────────────────────────────────
run_iac_scan() {
  header "IaC Misconfiguration Scan (Dockerfiles + Compose)"
  trivy config \
    --severity "${SEVERITY}" \
    --ignorefile "${TRIVYIGNORE}" \
    --exit-code 0 \
    "${REPO_ROOT}"
}

# ── Secret Scan ─────────────────────────────────────────────────────
run_secret_scan() {
  header "Secret Scan"
  trivy fs \
    --scanners secret \
    --ignorefile "${TRIVYIGNORE}" \
    --exit-code 0 \
    "${REPO_ROOT}"
}

# ── Docker Image Scan ───────────────────────────────────────────────
run_image_scan() {
  header "Docker Image Scan"

  if ! command -v docker &>/dev/null; then
    echo -e "${YELLOW}Warning: Docker not found — skipping image scan.${NC}"
    return 0
  fi

  echo -e "${YELLOW}Building images with docker compose...${NC}"
  docker compose -f "${REPO_ROOT}/docker-compose.yml" build

  local images=(
    "devops-fullstack-platform-backend"
    "devops-fullstack-platform-frontend"
    "devops-fullstack-platform-worker"
  )

  for img in "${images[@]}"; do
    echo ""
    echo -e "${CYAN}── Scanning image: ${img} ──${NC}"
    trivy image \
      --severity "${SEVERITY}" \
      --ignorefile "${TRIVYIGNORE}" \
      --exit-code 0 \
      "${img}" || true
  done
}

# ── Dispatcher ──────────────────────────────────────────────────────
case "${SCAN_TYPE}" in
  fs)
    run_fs_scan
    ;;
  iac)
    run_iac_scan
    ;;
  secret)
    run_secret_scan
    ;;
  image)
    run_image_scan
    ;;
  all)
    run_fs_scan
    run_iac_scan
    run_secret_scan
    run_image_scan
    ;;
  *)
    echo -e "${RED}Unknown scan type: ${SCAN_TYPE}${NC}"
    echo "Usage: $0 [fs|iac|secret|image|all]"
    exit 1
    ;;
esac

echo ""
echo -e "${GREEN}✓ Trivy scan complete.${NC}"
echo -e "${YELLOW}Note: Running in warn-only mode. No pipeline will be blocked.${NC}"
