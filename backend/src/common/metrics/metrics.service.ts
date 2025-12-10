import { Injectable, OnModuleInit } from '@nestjs/common';
import { register, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
  // HTTP Metrics
  public readonly httpRequestsTotal: Counter;
  public readonly httpRequestDuration: Histogram;
  public readonly httpRequestsInProgress: Gauge;

  // Webhook Metrics
  public readonly webhookDeliveriesTotal: Counter;
  public readonly webhookDeliveryDuration: Histogram;

  // Mock Runtime Metrics
  public readonly mockRequestsTotal: Counter;
  public readonly mockResponseDuration: Histogram;

  // Cache Metrics
  public readonly cacheHitsTotal: Counter;
  public readonly cacheMissesTotal: Counter;

  constructor() {
    // Initialize HTTP metrics
    this.httpRequestsTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code', 'workspace_id'],
    });

    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request latency in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
    });

    this.httpRequestsInProgress = new Gauge({
      name: 'http_requests_in_progress',
      help: 'Number of HTTP requests currently in progress',
      labelNames: ['method', 'route'],
    });

    // Webhook metrics
    this.webhookDeliveriesTotal = new Counter({
      name: 'webhook_deliveries_total',
      help: 'Total number of webhook deliveries',
      labelNames: ['event_type', 'status'],
    });

    this.webhookDeliveryDuration = new Histogram({
      name: 'webhook_delivery_duration_seconds',
      help: 'Webhook delivery latency in seconds',
      labelNames: ['event_type'],
      buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
    });

    // Mock runtime metrics
    this.mockRequestsTotal = new Counter({
      name: 'mock_requests_total',
      help: 'Total number of mock API requests',
      labelNames: ['api_slug', 'method', 'endpoint', 'status_code', 'workspace_id'],
    });

    this.mockResponseDuration = new Histogram({
      name: 'mock_response_duration_seconds',
      help: 'Mock API response latency in seconds',
      labelNames: ['api_slug', 'method'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
    });

    // Cache metrics
    this.cacheHitsTotal = new Counter({
      name: 'cache_hits_total',
      help: 'Total number of cache hits',
      labelNames: ['cache_key_type'],
    });

    this.cacheMissesTotal = new Counter({
      name: 'cache_misses_total',
      help: 'Total number of cache misses',
      labelNames: ['cache_key_type'],
    });
  }

  onModuleInit() {
    // Collect default Node.js metrics (CPU, memory, event loop, etc.)
    collectDefaultMetrics({
      register,
      prefix: 'mock_api_studio_',
    });
  }

  /**
   * Get all metrics in Prometheus format
   */
  async getMetrics(): Promise<string> {
    return register.metrics();
  }

  /**
   * Get content type for Prometheus metrics
   */
  getContentType(): string {
    return register.contentType;
  }
}

