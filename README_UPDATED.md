# 🎭 Mock API Studio

A complete enterprise-grade solution for designing, managing, and serving mock APIs with multi-tenancy, webhooks, GraphQL support, and comprehensive testing.

## 🚀 Features

### Core Features
- **Multi-Tenancy**: Workspace-based API organization with complete isolation
- **Full CRUD Management**: Create, read, update, and delete API definitions and endpoints
- **Mock Runtime**: Serve mock responses with configurable delays and multiple response scenarios
- **Import/Export**: JSON-based API definitions for easy sharing and version control
- **Redis Caching**: Fast response times with automatic cache invalidation
- **Path Parameters**: Support for dynamic routes like `/users/:id`
- **Multiple Responses**: Define multiple responses per endpoint with conditional matching
- **Web UI**: Modern React-based interface for managing your mocks
- **Docker Ready**: Complete Docker Compose setup for easy deployment

### Advanced Features ⭐
- **🔐 Authentication**: JWT-based auth + API Keys for programmatic access
- **✅ JSON Schema Validation**: Validate requests against OpenAPI-style schemas
- **🎨 Handlebars Templating**: Dynamic responses with `{{params.id}}`, `{{query.name}}`, etc.
- **📄 OpenAPI Import**: Drag & drop Swagger/OpenAPI 3.0 specs to auto-generate mocks
- **🪝 Webhooks**: Fire HTTP notifications when mock requests occur
- **🔷 GraphQL Support**: Mock GraphQL queries and mutations
- **📊 Analytics**: Request tracking, metrics, and performance stats
- **🔒 Security**: Helmet, rate limiting, CORS protection
- **⚡ Conditional Responses**: Match responses based on query params, headers, or body
- **🧪 Comprehensive Testing**: Jest, Vitest, and Playwright test suites

## 📋 Tech Stack

### Backend
- **NestJS** - Progressive Node.js framework
- **Prisma** - Next-generation ORM
- **PostgreSQL** - Robust relational database with JSONB
- **Redis** - In-memory caching and session storage
- **TypeScript** - Type-safe development
- **Jest** - Unit and integration testing
- **Handlebars** - Template engine for dynamic responses
- **AJV** - JSON Schema validation

### Frontend
- **React 18** - UI library with hooks
- **Vite** - Lightning-fast build tool
- **React Router** - Client-side routing
- **TypeScript** - Type-safe development
- **Axios** - HTTP client
- **Recharts** - Analytics visualization
- **Vitest** - Unit testing for React components

### Infrastructure
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Nginx** - Web server for frontend
- **Playwright** - End-to-end testing

## 🏗️ Project Structure

```
mock-api-studio/
├── backend/                    # NestJS API
│   ├── src/
│   │   ├── api-definitions/    # API CRUD module
│   │   ├── mock-runtime/       # REST mock serving
│   │   ├── graphql-runtime/    # GraphQL mock serving
│   │   ├── workspaces/         # Multi-tenancy
│   │   ├── webhooks/           # Webhook subscriptions
│   │   ├── analytics/          # Usage tracking
│   │   ├── auth/               # JWT + API Keys
│   │   ├── openapi/            # OpenAPI parser
│   │   ├── common/             # Shared modules (Prisma, Redis)
│   │   └── shared/             # Utilities
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema
│   │   ├── migrations/         # DB migrations
│   │   └── seed.ts             # Seed data
│   ├── test/                   # E2E tests
│   └── Dockerfile
├── frontend/                   # React UI
│   ├── src/
│   │   ├── api/                # API client
│   │   ├── components/         # React components
│   │   ├── contexts/           # React contexts (Auth, Workspace)
│   │   ├── pages/              # Page components
│   │   └── test/               # Vitest tests
│   ├── nginx.conf
│   └── Dockerfile
├── e2e/                        # Playwright E2E tests
├── docker-compose.yml          # Multi-service setup
├── playwright.config.ts        # E2E config
└── package.json                # Monorepo scripts
```

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local development)
- (Optional) npm/pnpm for monorepo scripts

### Using Docker (Recommended)

1. **Clone and start**
```bash
git clone <repository-url>
cd mock-api-studio
docker compose up --build
```

2. **Access the application**
- Frontend: http://localhost:8080
- Backend API: http://localhost:3000
- REST Mock Runtime: `http://localhost:3000/mock/:apiSlug/*`
- GraphQL Mock Runtime: `http://localhost:3000/mock-graphql/:apiSlug`

3. **Default credentials**
- Register a new user at http://localhost:8080/register
- Or use seeded data (check `backend/prisma/seed.ts`)

The database will be automatically migrated and seeded with:
- 2 workspaces (Default, Team Sandbox)
- 2 example APIs (JSONPlaceholder, GitHub Mock)
- Multiple endpoints with responses

### Local Development

```bash
# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Start PostgreSQL and Redis
docker compose up db redis -d

# Backend (Terminal 1)
cd backend
cp .env.example .env
npm run prisma:migrate
npm run prisma:seed
npm run start:dev

# Frontend (Terminal 2)
cd frontend
cp .env.example .env
npm run dev
```

## 🎯 Usage Examples

### 1. Multi-Tenancy with Workspaces

```bash
# Create a workspace
curl -X POST http://localhost:3000/admin/workspaces \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production Team",
    "slug": "prod-team",
    "description": "Production API mocks"
  }'

# List APIs in a workspace
curl http://localhost:3000/api-definitions?workspaceId=<workspace-id> \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 2. OpenAPI Import

```bash
# Upload OpenAPI spec (UI: /import-openapi)
# Or via API:
curl -X POST http://localhost:3000/api-definitions/import/openapi/upload?workspaceId=<ws-id> \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@swagger.json"
```

### 3. Webhooks

```bash
# Create a webhook subscription
curl -X POST http://localhost:3000/admin/webhooks \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workspaceId": "<workspace-id>",
    "targetUrl": "https://your-server.com/webhook",
    "eventType": "mock.request.received",
    "secret": "my-secret-key"
  }'
```

When a mock request is made, your webhook will receive:
```json
{
  "event": "mock.request.received",
  "timestamp": "2024-01-15T10:30:00Z",
  "workspaceId": "ws-123",
  "apiSlug": "my-api",
  "endpoint": { "id": "ep-1", "method": "GET", "path": "/users" },
  "request": { "method": "GET", "path": "/users", "query": {} },
  "response": { "statusCode": 200, "body": {...} }
}
```

### 4. GraphQL Mocking

```graphql
# Create a GraphQL endpoint in UI or API
# Then query it:
POST http://localhost:3000/mock-graphql/my-graphql-api?workspaceId=<ws-id>
Content-Type: application/json

{
  "query": "query GetUser { user(id: 1) { id name email } }",
  "operationName": "GetUser"
}
```

### 5. Dynamic Responses with Handlebars

```json
{
  "status": 200,
  "body": {
    "userId": "{{params.id}}",
    "search": "{{query.q}}",
    "timestamp": "{{timestamp}}",
    "custom": "Hello {{body.name}}"
  }
}
```

### 6. Conditional Response Matching

```json
{
  "responses": [
    {
      "status": 200,
      "body": { "premium": true },
      "match": {
        "query": { "tier": "premium" }
      }
    },
    {
      "status": 200,
      "body": { "premium": false },
      "isDefault": true
    }
  ]
}
```

## 🧪 Testing

### Run All Tests
```bash
# From root
npm run test:all        # Backend + Frontend
npm run test:e2e        # Playwright E2E

# Individual
npm run test:backend    # Jest unit + integration
npm run test:frontend   # Vitest
```

### Backend Tests (Jest)
```bash
cd backend
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:cov         # With coverage
```

### Frontend Tests (Vitest)
```bash
cd frontend
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # With coverage
```

### E2E Tests (Playwright)
```bash
# Ensure app is running (or use webServer config)
npx playwright test
npx playwright test --ui    # UI mode
npx playwright show-report  # View results
```

## 📊 Analytics & Monitoring

Access analytics at http://localhost:8080/analytics

- **Request trends**: Requests per day/week/month
- **Top APIs**: Most called mock APIs
- **Top Endpoints**: Most used endpoints
- **Performance**: Average response times
- **Error rates**: Failed requests tracking

## 🔒 Security Features

- **JWT Authentication**: Secure user sessions
- **API Keys**: Programmatic access with scoped permissions
- **Rate Limiting**: Protect against abuse (100 requests/minute)
- **Helmet**: Security headers (CSP, HSTS, etc.)
- **CORS**: Configurable cross-origin policies
- **Request Validation**: JSON Schema enforcement
- **Webhook Secrets**: Sign webhook payloads for verification

## 🐳 Docker Services

```yaml
Services:
- db (PostgreSQL 16)      → localhost:5432
- redis (Redis 7)         → localhost:6379
- api (NestJS backend)    → localhost:3000
- web (Nginx + React)     → localhost:8080
```

### Useful Docker Commands
```bash
docker compose up -d              # Start detached
docker compose logs -f api        # Follow API logs
docker compose exec api npm run prisma:studio  # Prisma Studio
docker compose down -v            # Stop and remove volumes
docker compose restart api        # Restart backend
```

## 📚 API Documentation

### Admin Endpoints (Protected)
```
POST   /auth/register              # Register user
POST   /auth/login                 # Login
GET    /auth/api-keys              # List API keys
POST   /auth/api-keys              # Create API key

GET    /admin/workspaces           # List workspaces
POST   /admin/workspaces           # Create workspace
PUT    /admin/workspaces/:id       # Update workspace
DELETE /admin/workspaces/:id       # Delete workspace

GET    /admin/webhooks             # List webhooks
POST   /admin/webhooks             # Create webhook
PUT    /admin/webhooks/:id         # Update webhook
DELETE /admin/webhooks/:id         # Delete webhook

GET    /admin/analytics/summary    # Analytics overview
GET    /admin/analytics/requests   # Request logs
```

### Mock Runtime (Public)
```
ALL    /mock/:apiSlug/*                    # REST mock
POST   /mock-graphql/:apiSlug              # GraphQL mock
```

Headers:
- `X-Workspace-Id`: Specify workspace (or use `?workspaceId=...`)
- `X-Webhook-Secret`: For webhook verification

## 🛠️ Development

### Database Migrations
```bash
cd backend
npm run prisma:migrate              # Create and apply migration
npm run prisma:migrate:deploy       # Apply in production
npm run prisma:studio               # Visual DB editor
npm run prisma:seed                 # Seed example data
```

### Code Quality
```bash
# Backend
cd backend
npm run lint                        # ESLint
npm run format                      # Prettier

# Frontend
cd frontend
npm run lint                        # ESLint
```

### Environment Variables

**Backend** (`.env`):
```env
DATABASE_URL=postgresql://mockapi:mockapi@localhost:5432/mockapi
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-super-secret-jwt-key
PORT=3000
```

**Frontend** (`.env`):
```env
VITE_API_BASE_URL=http://localhost:3000
```

## 📖 Architecture Highlights

- **Clean Architecture**: Modules organized by domain (workspaces, webhooks, etc.)
- **Dependency Injection**: NestJS DI container for testability
- **SOLID Principles**: Single responsibility, interface segregation
- **Caching Strategy**: Redis for API definitions, automatic invalidation
- **Async Webhooks**: Non-blocking event notifications via `setImmediate`
- **Type Safety**: Full TypeScript coverage (backend + frontend)
- **React Context**: State management for auth and workspace selection
- **Protected Routes**: HOC pattern for authenticated pages

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.

## 📄 License

MIT

## 🙏 Acknowledgments

Built with:
- NestJS, React, Prisma, Docker
- Inspired by Postman, Mockoon, json-server
- Community feedback and contributions

---

**Made with ❤️ for developers who need reliable mock APIs**

