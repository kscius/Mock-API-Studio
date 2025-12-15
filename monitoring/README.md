# Monitoring & Observability

This directory contains monitoring and observability configurations for Mock API Studio.

## 📊 Grafana Dashboard

### Overview

The [`grafana-dashboard.json`](grafana-dashboard.json) provides a comprehensive production monitoring dashboard for Mock API Studio with 8 key panels:

1. **HTTP Request Rate (5m)** - All HTTP requests by method, route, and status
2. **Request Latency (P95/P99)** - Response time percentiles in milliseconds
3. **Mock API Request Rate** - Mock requests by API slug, method, and endpoint
4. **Cache Hit Rate** - Redis cache performance (target: >90%)
5. **Webhook Delivery Status** - Success/failure rates by event type
6. **Node.js CPU Usage** - Backend CPU utilization percentage
7. **Node.js Memory Usage** - Backend memory consumption in MB
8. **Mock Requests by Workspace (Hourly)** - Traffic distribution across workspaces

### Installation

#### 1. Prerequisites

- Grafana 9.0+ installed
- Prometheus datasource configured in Grafana
- Mock API Studio backend exposing metrics at `/metrics`

#### 2. Import Dashboard

**Option A: Via Grafana UI**

1. Open Grafana web interface
2. Navigate to **Dashboards** → **Import**
3. Click **Upload JSON file**
4. Select `grafana-dashboard.json`
5. Choose your Prometheus datasource
6. Click **Import**

**Option B: Via API**

```bash
curl -X POST http://localhost:3000/api/dashboards/db \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_GRAFANA_API_KEY" \
  -d @grafana-dashboard.json
```

**Option C: Via Provisioning**

1. Copy `grafana-dashboard.json` to Grafana's provisioning directory:
   ```bash
   cp grafana-dashboard.json /etc/grafana/provisioning/dashboards/
   ```

2. Create provisioning config `/etc/grafana/provisioning/dashboards/dashboards.yaml`:
   ```yaml
   apiVersion: 1
   
   providers:
     - name: 'Mock API Studio'
       orgId: 1
       folder: ''
       type: file
       disableDeletion: false
       updateIntervalSeconds: 10
       allowUiUpdates: true
       options:
         path: /etc/grafana/provisioning/dashboards
   ```

3. Restart Grafana:
   ```bash
   systemctl restart grafana-server
   ```

### Configuration

#### Prometheus Scrape Configuration

Ensure Prometheus is scraping metrics from Mock API Studio:

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'mock-api-studio'
    scrape_interval: 15s
    static_configs:
      - targets: ['localhost:3000']
        labels:
          service: 'mock-api-studio-backend'
```

#### Dashboard Variables (Optional)

You can add template variables for filtering:

1. Edit dashboard
2. **Settings** → **Variables** → **Add variable**
3. Example: Workspace filter
   ```
   Name: workspace
   Type: Query
   Query: label_values(mock_requests_total, workspace_id)
   ```

### Metrics Reference

Mock API Studio exposes the following custom metrics:

| Metric Name | Type | Labels | Description |
|-------------|------|--------|-------------|
| `http_requests_total` | Counter | method, route, status, workspace | Total HTTP requests |
| `http_request_duration_seconds` | Histogram | method, route | Request duration in seconds |
| `mock_requests_total` | Counter | api_slug, method, endpoint, workspace_id | Mock API requests |
| `webhook_deliveries_total` | Counter | event_type, status | Webhook delivery attempts |
| `cache_hits_total` | Counter | - | Redis cache hits |
| `cache_misses_total` | Counter | - | Redis cache misses |

#### Node.js Metrics (default)

- `process_cpu_user_seconds_total` - CPU time in user mode
- `process_cpu_system_seconds_total` - CPU time in system mode
- `process_resident_memory_bytes` - Memory usage in bytes
- `nodejs_eventloop_lag_seconds` - Event loop lag

### Alerting

#### Recommended Alerts

Create alerts in Grafana for critical conditions:

**1. High Error Rate**
```promql
rate(http_requests_total{status=~"5.."}[5m]) > 10
```
Alert if 5xx errors exceed 10 requests/sec for 5 minutes.

**2. High Latency**
```promql
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
```
Alert if P95 latency exceeds 1 second.

**3. Low Cache Hit Rate**
```promql
rate(cache_hits_total[5m]) / (rate(cache_hits_total[5m]) + rate(cache_misses_total[5m])) < 0.7
```
Alert if cache hit rate drops below 70%.

**4. Webhook Failures**
```promql
rate(webhook_deliveries_total{status="failed"}[5m]) > 5
```
Alert if webhook failures exceed 5/sec.

**5. High CPU Usage**
```promql
rate(process_cpu_seconds_total[1m]) > 0.8
```
Alert if CPU usage exceeds 80% for 1 minute.

**6. High Memory Usage**
```promql
process_resident_memory_bytes > 1073741824
```
Alert if memory usage exceeds 1GB.

### Customization

#### Adding New Panels

1. Click **Add panel** in dashboard
2. Configure query using PromQL
3. Choose visualization type (Time series, Gauge, Stat, etc.)
4. Set thresholds and colors
5. Save dashboard

#### Example: Top 10 Endpoints by Traffic

```promql
topk(10, sum by(endpoint, method) (rate(mock_requests_total[5m])))
```

### Troubleshooting

#### No Data Showing

**Check Prometheus connection:**
```bash
curl http://localhost:3000/metrics
```

Should return Prometheus-formatted metrics.

**Check Prometheus targets:**

Navigate to Prometheus UI → **Status** → **Targets**

Ensure `mock-api-studio` target is **UP**.

**Check time range:**

Dashboard default: Last 6 hours. Adjust if no recent data.

#### Metrics Not Updating

**Restart backend:**
```bash
docker-compose restart api
```

**Check logs:**
```bash
docker-compose logs -f api | grep metrics
```

#### Performance Issues

If dashboard is slow:

1. Reduce query interval (default: 15s → 30s)
2. Limit time range (6h → 1h)
3. Use recording rules in Prometheus for expensive queries

### Production Best Practices

1. **Enable Authentication**: Secure Grafana with OAuth or LDAP
2. **Set Alerts**: Configure notification channels (Slack, PagerDuty, email)
3. **Backup Dashboards**: Export JSON regularly or use version control
4. **Monitor Prometheus**: Ensure Prometheus itself is monitored
5. **Set Retention**: Configure appropriate data retention in Prometheus

### Related Documentation

- [Prometheus Metrics](../backend/src/common/metrics/metrics.service.ts)
- [Architecture - Monitoring](../ARCHITECTURE.md#monitoring--observability)
- [Production Deployment](../k8s/README.md)

## 🔗 Additional Monitoring Tools

### Sentry (Error Tracking)

```typescript
// backend/src/main.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

### APM Integration

- **Datadog**: Use `dd-trace` for distributed tracing
- **New Relic**: Use `newrelic` agent
- **Elastic APM**: Use `elastic-apm-node`

### Log Aggregation

- **ELK Stack**: Elasticsearch + Logstash + Kibana
- **Loki**: Lightweight log aggregation with Grafana
- **CloudWatch Logs**: For AWS deployments

## 📞 Support

For monitoring issues:
- Grafana docs: https://grafana.com/docs/
- Prometheus docs: https://prometheus.io/docs/
- GitHub issues: https://github.com/your-org/mock-api-studio/issues

