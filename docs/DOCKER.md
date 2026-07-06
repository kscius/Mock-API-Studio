# Docker Deployment

## Quick Start (local development)

```bash
docker compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:8080 |
| Backend API | http://localhost:3000 |
| Mock runtime | http://localhost:3000/mock/:apiSlug/* |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |

## Pre-built Images (after release)

Replace `YOUR_DOCKER_USER` with the published Docker Hub username:

```bash
docker pull YOUR_DOCKER_USER/mock-api-studio-backend:latest
docker pull YOUR_DOCKER_USER/mock-api-studio-frontend:latest
```

## Environment

Copy `backend/.env.example` to `backend/.env` and configure before running.

Required for production:
- `JWT_SECRET` — strong random string
- `DATABASE_URL` — PostgreSQL connection string
- `CORS_ORIGIN` — your frontend URL

## Production Notes

- Use external managed PostgreSQL and Redis for production
- Run migrations: `cd backend && npx prisma migrate deploy`
- Enable HTTPS via reverse proxy (nginx, Traefik, or Kubernetes Ingress)
- See [k8s/README.md](../k8s/README.md) for Kubernetes deployment

## Health Checks

- Backend: `GET /health` — returns `{ "status": "ok" }`
- Metrics: `GET /metrics` — Prometheus format
