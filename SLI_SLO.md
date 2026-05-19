# SLI and SLO Design

| SLI | Measurement | SLO |
|---|---|---|
| Availability | successful health checks / total checks | >= 99% |
| Latency | p95 request duration | <= 200 ms |
| Error Rate | 5xx requests / total requests | <= 1% |
| Request Success Rate | 2xx + 3xx requests / total requests | >= 99% |

Prometheus queries:
- Availability: avg_over_time(service_up[5m])
- p95 latency: histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, service))
- Error rate: sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))
