# Kubernetes Deployment Guide

This directory contains Kubernetes manifests for deploying Mock-API-Studio to a Kubernetes cluster.

## Prerequisites

- Kubernetes cluster (v1.24+)
- `kubectl` configured to access your cluster
- Nginx Ingress Controller installed
- PostgreSQL and Redis (managed services recommended)
- Container registry for Docker images

## Files

- `configmap.yaml` - Non-sensitive configuration
- `secret.yaml.template` - Template for sensitive configuration (database URL, JWT secret)
- `backend-deployment.yaml` - Backend deployment and service
- `frontend-deployment.yaml` - Frontend deployment and service
- `ingress.yaml` - Ingress configuration for routing

## Setup Instructions

### 1. Create Secrets

Copy the secret template and fill in base64-encoded values:

```bash
cp secret.yaml.template secret.yaml

# Encode your values
echo -n "postgresql://user:pass@host:5432/db" | base64
echo -n "your-jwt-secret" | base64

# Edit secret.yaml and paste the base64 values
vi secret.yaml
```

### 2. Update Configuration

Edit `configmap.yaml` and adjust values as needed:
- Cache TTL
- Rate limits
- Analytics retention
- Webhook settings

### 3. Update Image References

Edit `backend-deployment.yaml` and `frontend-deployment.yaml`:

Replace `your-registry/mock-api-studio-backend:latest` with your actual image URL.

### 4. Configure Ingress

Edit `ingress.yaml`:

Replace `mock-api-studio.yourdomain.com` with your actual domain.

### 5. Deploy to Kubernetes

```bash
# Create namespace (optional)
kubectl create namespace mock-api-studio

# Apply manifests
kubectl apply -f configmap.yaml
kubectl apply -f secret.yaml
kubectl apply -f backend-deployment.yaml
kubectl apply -f frontend-deployment.yaml
kubectl apply -f ingress.yaml
```

### 6. Verify Deployment

```bash
# Check pod status
kubectl get pods -n default

# Check services
kubectl get svc -n default

# Check ingress
kubectl get ingress -n default

# View logs
kubectl logs -f deployment/mock-api-studio-backend
kubectl logs -f deployment/mock-api-studio-frontend
```

## Database and Redis

This configuration assumes PostgreSQL and Redis are available as managed services or deployed separately. Update the connection details in:

- `secret.yaml` - DATABASE_URL
- `configmap.yaml` - REDIS_HOST, REDIS_PORT

If you need to deploy PostgreSQL and Redis in Kubernetes, consider using Helm charts:

```bash
# Install PostgreSQL
helm install postgres bitnami/postgresql \
  --set auth.username=mockapi \
  --set auth.password=mockapi \
  --set auth.database=mockapi

# Install Redis
helm install redis bitnami/redis \
  --set auth.enabled=false
```

## Scaling

Scale deployments as needed:

```bash
# Scale backend
kubectl scale deployment mock-api-studio-backend --replicas=3

# Scale frontend
kubectl scale deployment mock-api-studio-frontend --replicas=3
```

## Monitoring

Access Prometheus metrics:

```bash
kubectl port-forward svc/backend-service 3000:3000
curl http://localhost:3000/metrics
```

## Troubleshooting

View pod logs:

```bash
kubectl logs -f deployment/mock-api-studio-backend
```

Describe pod for events:

```bash
kubectl describe pod <pod-name>
```

Execute into pod:

```bash
kubectl exec -it <pod-name> -- /bin/sh
```

## Cleanup

Remove all resources:

```bash
kubectl delete -f .
```

