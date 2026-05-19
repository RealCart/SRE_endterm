#!/usr/bin/env bash
set -euo pipefail

services=(
  "auth-service:8001"
  "product-service:8002"
  "order-service:8003"
  "payment-service:8004"
  "notification-service:8005"
  "profile-service:8006"
)

wait_for_url() {
  local url="$1"
  local name="$2"
  local max_attempts=40

  for attempt in $(seq 1 "$max_attempts"); do
    if curl -fsS "$url" >/dev/null; then
      echo "OK: $name is ready"
      return 0
    fi
    echo "Waiting for $name ($attempt/$max_attempts)..."
    sleep 3
  done

  echo "ERROR: $name did not become ready: $url"
  return 1
}

for item in "${services[@]}"; do
  name="${item%%:*}"
  port="${item##*:}"
  wait_for_url "http://localhost:${port}/health" "$name health endpoint"
  wait_for_url "http://localhost:${port}/ready" "$name readiness endpoint"
  wait_for_url "http://localhost:${port}/metrics" "$name metrics endpoint"
done

wait_for_url "http://localhost:8080/" "frontend"
wait_for_url "http://localhost:9090/-/ready" "Prometheus"
wait_for_url "http://localhost:3000/api/health" "Grafana"

echo "Smoke test passed."
