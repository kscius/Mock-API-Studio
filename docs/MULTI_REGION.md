# Multi-Region Deployment Guide

This guide describes how to run Mock API Studio across multiple regions for lower latency and higher availability.

## Architecture overview

```text
                    ┌─────────────────┐
                    │  Global DNS /   │
                    │  CDN (optional) │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
   ┌───────────┐       ┌───────────┐       ┌───────────┐
   │ Region A  │       │ Region B  │       │ Region C  │
   │ K8s cluster│      │ K8s cluster│      │ K8s cluster│
   │ backend   │       │ backend   │       │ backend   │
   │ frontend  │       │ frontend  │       │ frontend  │
   │ Redis     │       │ Redis     │       │ Redis     │
   └─────┬─────┘       └─────┬─────┘       └─────┬─────┘
         │                   │                   │
         └───────────────────┼───────────────────┘
                             ▼
                    ┌─────────────────┐
                    │ PostgreSQL      │
                    │ (primary +      │
                    │  read replicas) │
                    └─────────────────┘
```

## Recommended topology

| Component | Multi-region strategy |
|-----------|----------------------|
| **PostgreSQL** | Single primary region with read replicas in other regions, or managed multi-region DB (e.g. Aurora Global, CockroachDB) |
| **Redis** | Regional Redis per cluster; cache is ephemeral — do not rely on cross-region cache consistency |
| **Backend** | Stateless pods in each region; same `DATABASE_URL` (writer) or regional read URL for read-heavy paths |
| **Frontend** | Static assets on CDN; `VITE_API_URL` points to regional API gateway |
| **Mock traffic** | Route clients to nearest region via geo-DNS or anycast |

## Environment per region

Each regional backend deployment should set:

```env
MOCK_BASE_URL=https://api.eu.example.com
CORS_ORIGIN=https://app.eu.example.com
FRONTEND_URL=https://app.eu.example.com
DATABASE_URL=postgresql://...  # primary or regional replica
REDIS_HOST=redis.eu.svc.cluster.local
```

Keep `JWT_SECRET` and encryption keys **identical** across regions if users authenticate against any regional endpoint.

## Kubernetes

1. Deploy using manifests in `k8s/` per cluster/region.
2. Use the same container image tags in all regions (pin by digest in production).
3. Configure **PodDisruptionBudgets** and **HorizontalPodAutoscaler** per region based on local traffic.
4. Use **external-dns** or cloud load balancers for regional hostnames.

## Data consistency notes

- Mock definitions are stored in PostgreSQL; writes should go to the primary.
- Analytics and audit logs can be region-local or centralized — choose based on compliance needs.
- Webhook delivery retries are regional; configure idempotent consumers.

## Failover

1. Health check: `GET /health` on each regional backend.
2. DNS failover: remove unhealthy region from geo-DNS pool.
3. Database: promote read replica or use managed failover (RTO/RPO per your DB vendor).

## Observability

- Scrape `/metrics` per region in Prometheus with `region` label.
- Aggregate dashboards in Grafana; alert on regional error rate divergence.

## Related docs

- [DOCKER.md](./DOCKER.md) — local and compose setup
- [PUBLISHING.md](./PUBLISHING.md) — release and image publishing
- `k8s/` — Kubernetes manifests in the repository root
