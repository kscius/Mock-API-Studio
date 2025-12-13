# Architecture Overview - Mock API Studio

## System Architecture

Mock API Studio is a full-stack application designed with a clean separation between the backend API, frontend UI, and supporting services.

```
┌─────────────────────────────────────────────────────────┐
│                       Client Browser                     │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP
                     ▼
┌─────────────────────────────────────────────────────────┐
│                  Frontend (React + Nginx)                │
│  - React SPA                                             │
│  - React Router (client-side routing)                    │
│  - Axios (HTTP client)                                   │
└────────────────────┬────────────────────────────────────┘
                     │ REST API
                     ▼
┌─────────────────────────────────────────────────────────┐
│                 Backend (NestJS + Node.js)               │
│  ┌──────────────────────────────────────────────────┐   │
│  │         API Definitions Module                   │   │
│  │  - CRUD for APIs and Endpoints                   │   │
│  │  - Import/Export JSON                            │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │         Mock Runtime Module                      │   │
│  │  - Catch-all route handler                       │   │
│  │  - Path matching (path-to-regexp)                │   │
│  │  - Response selection                            │   │
│  │  - Delay simulation                              │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │         Common Modules                           │   │
│  │  - PrismaService (ORM)                           │   │
│  │  - RedisService (Cache)                          │   │
│  │  - ConfigService (Environment)                   │   │
│  └──────────────────────────────────────────────────┘   │
└────────┬───────────────────────────────────┬────────────┘
         │                                   │
         ▼                                   ▼
┌─────────────────────┐          ┌────────────────────────┐
│   PostgreSQL DB     │          │     Redis Cache        │
│  - API Definitions  │          │  - API Cache           │
│  - Endpoints        │          │  - TTL: 5 minutes      │
└─────────────────────┘          └────────────────────────┘
```

## Database Schema

### ApiDefinition
Stores metadata about mock APIs.

| Field       | Type     | Description                    |
|-------------|----------|--------------------------------|
| id          | UUID     | Primary key                    |
| name        | String   | Human-readable name            |
| slug        | String   | URL-safe identifier (unique)   |
| version     | String   | API version (e.g., "1.0.0")    |
| basePath    | String   | Base URL path                  |
| description | String?  | Optional description           |
| isActive    | Boolean  | Enable/disable API             |
| tags        | String[] | Categorization tags            |
| createdAt   | DateTime | Creation timestamp             |
| updatedAt   | DateTime | Last update timestamp          |

### ApiEndpoint
Stores individual endpoint definitions.

| Field         | Type    | Description                       |
|---------------|---------|-----------------------------------|
| id            | UUID    | Primary key                       |
| apiId         | UUID    | Foreign key to ApiDefinition      |
| method        | String  | HTTP method (GET, POST, etc.)     |
| path          | String  | URL path with params (/users/:id) |
| summary       | String? | Optional description              |
| requestSchema | JSONB?  | Request validation schema         |
| responses     | JSONB   | Array of possible responses       |
| delayMs       | Integer | Artificial delay in milliseconds  |
| enabled       | Boolean | Enable/disable endpoint           |
| createdAt     | DateTime| Creation timestamp                |
| updatedAt     | DateTime| Last update timestamp             |

**Unique Constraint:** `(apiId, method, path)` ensures no duplicate endpoints per API.

## Response Format (JSONB)

Each endpoint stores an array of potential responses:

```typescript
interface MockResponse {
  status: number;              // HTTP status code
  headers?: Record<string, string>;  // Response headers
  body?: any;                  // Response body (any JSON)
  isDefault?: boolean;         // Flag for default response
}
```

Example:
```json
[
  {
    "status": 200,
    "headers": { "Content-Type": "application/json" },
    "body": { "id": 1, "name": "John" },
    "isDefault": true
  },
  {
    "status": 404,
    "body": { "error": "Not found" }
  }
]
```

## Mock Runtime Flow

When a request hits `/mock/:apiSlug/*`:

1. **Load API Definition**
   - Check Redis cache: `mock:api:{slug}`
   - If not cached, load from PostgreSQL
   - Cache result for 5 minutes

2. **Validate API**
   - Check if API exists
   - Check if API is active

3. **Match Endpoint**
   - Extract method and path from request
   - Normalize paths (remove trailing slashes)
   - Match against endpoint templates using `path-to-regexp`
   - Support dynamic parameters (e.g., `:id`)

4. **Select Response**
   - Find response with `isDefault: true`
   - Fallback to first response if no default

5. **Apply Delay**
   - If `delayMs > 0`, wait before responding
   - Simulates network latency or slow APIs

6. **Send Response**
   - Set HTTP status code
   - Apply headers
   - Return JSON body

## Cache Strategy

### Cache Keys
- **API with Endpoints:** `mock:api:{slug}`

### Cache Invalidation
Cache is invalidated (deleted) when:
- API is created, updated, or deleted
- Endpoint is created, updated, or deleted

### TTL
- Default: 300 seconds (5 minutes)

## Module Breakdown

### Backend Modules

1. **ConfigModule** (Global)
   - Loads environment variables
   - Provides ConfigService to other modules

2. **PrismaModule** (Global)
   - Database connection management
   - Exposes PrismaService for queries

3. **RedisModule** (Global)
   - Redis connection management
   - Exposes RedisService for caching

4. **ApiDefinitionsModule**
   - Controllers: REST endpoints for CRUD
   - Services: Business logic for API/endpoint management
   - DTOs: Validation schemas

5. **MockRuntimeModule**
   - Controllers: Catch-all route handler
   - Services: Path matching, response selection, delay

### Frontend Structure

```
src/
├── api/                  # API client layer
│   ├── client.ts         # Axios instance
│   ├── types.ts          # TypeScript interfaces
│   └── api-definitions.ts# API functions
├── components/           # Reusable components
│   ├── ApiCard.tsx
│   └── EndpointCard.tsx
├── pages/                # Route pages
│   ├── DashboardPage.tsx
│   ├── ApiDetailPage.tsx
│   └── EndpointEditorPage.tsx
├── App.tsx               # Root component
└── main.tsx              # Entry point
```

## Data Flow

### Create API Flow
```
User → UI Form → apiDefinitionsApi.create() → POST /api-definitions
    → ApiDefinitionsController → ApiDefinitionsService
    → Prisma.create() → PostgreSQL
    → Invalidate Redis cache
    → Return created API → UI updates
```

### Serve Mock Response Flow
```
Client → GET /mock/jsonplaceholder/posts/1
    → MockRuntimeController
    → Load API (Redis or DB)
    → Match endpoint (path-to-regexp)
    → Select response (isDefault)
    → Apply delay (setTimeout)
    → Return response
```

## Security & Authorization

### Authentication
Mock API Studio supports two authentication methods:

#### 1. JWT (JSON Web Tokens)
- **Used for**: Web UI user sessions
- **Login**: `POST /auth/login` with email/password
- **Registration**: `POST /auth/register`
- **Token Expiry**: 7 days (configurable via JWT_SECRET)
- **2FA Support**: Optional TOTP-based two-factor authentication
  - `POST /auth/2fa/setup` - Generate QR code
  - `POST /auth/2fa/enable` - Enable with token verification
  - `DELETE /auth/2fa/disable` - Disable with token verification

#### 2. API Keys
- **Used for**: CLI and programmatic access
- **Creation**: `POST /auth/api-keys` (requires JWT)
- **Scopes**: Fine-grained permissions (read/write/delete per resource)
- **Header**: `X-API-Key: mas_...` in requests
- **Scoped Permissions**:
  - `read:apis`, `write:apis`, `delete:apis`
  - `read:endpoints`, `write:endpoints`, `delete:endpoints`
  - `read:workspaces`, `write:workspaces`, `admin:workspace`
  - `read:analytics`, `read:webhooks`, `write:webhooks`
  - `*` (all permissions)

### Authorization (RBAC)

#### Workspace-Level Roles
Mock API Studio implements role-based access control at the workspace level:

| Role | Permissions |
|------|-------------|
| **ADMIN** | Full access: create, read, update, delete APIs/endpoints, manage workspace settings and members |
| **EDITOR** | Create, read, update APIs and endpoints (cannot delete workspace or manage members) |
| **VIEWER** | Read-only access to APIs, endpoints, and analytics |

#### Permission Hierarchy
- Roles are hierarchical: `ADMIN` > `EDITOR` > `VIEWER`
- Higher roles inherit permissions from lower roles
- Example: An `ADMIN` can perform all `EDITOR` and `VIEWER` actions

#### Workspace Membership
- Users can be members of multiple workspaces with different roles
- Global admins (user.role = 'admin') bypass workspace-level checks
- Workspace members are managed via:
  - `POST /admin/workspaces/:id/members` - Invite user with role
  - `PATCH /admin/workspaces/:id/members/:memberId` - Update role
  - `DELETE /admin/workspaces/:id/members/:memberId` - Remove member

### Guards & Decorators

#### RolesGuard
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.EDITOR)
async updateEndpoint(@Param('id') id: string, @Body() dto: UpdateEndpointDto) {
  // Only ADMIN or EDITOR can access this
}
```

#### ScopesGuard (for API Keys)
```typescript
@UseGuards(ApiKeyGuard, ScopesGuard)
@RequireScopes(ApiScope.WRITE_APIS)
async createApi(@Body() dto: CreateApiDto) {
  // API key must have 'write:apis' scope
}
```

### API Versioning
- **Data Model**: `ApiDefinition.version`, `ApiDefinition.parentId`
- **Unique Constraint**: `(workspaceId, slug, version)`
- **Create Version**: `POST /admin/api-definitions/:apiId/versions`
  - Copies all endpoints from current version
  - Marks new version as `isLatest`
  - Previous version remains accessible
- **List Versions**: `GET /admin/api-definitions/:apiId/versions`

### Audit Logging
All mutations (create, update, delete) are automatically logged:
- **Logged Information**: User ID, IP address, user agent, action, entity type, entity ID, changes (before/after)
- **Decorator**: `@AuditLog({ action: 'create', entityType: 'api', ... })`
- **Query Logs**: `GET /admin/audit-logs` with filters (workspace, user, action, date range)
- **Retention**: Automatic cleanup of logs older than 90 days (configurable)

### Security Best Practices
- **CORS**: Restricted to specific origins in production
- **Helmet**: Security headers enabled
- **Rate Limiting**: Per-workspace throttling on mock runtime
- **Input Validation**: class-validator on all DTOs
- **Password Hashing**: bcrypt with salt rounds = 10
- **2FA**: TOTP-based additional security layer
- **API Key Storage**: Hashed with bcrypt, raw key shown only once
- **Connection Pooling**: PostgreSQL and Redis connection limits

## Scalability

### Horizontal Scaling
- Backend is stateless (can run multiple instances)
- Redis can be clustered
- PostgreSQL can use read replicas

### Performance Optimization
- Redis caching reduces DB queries
- Prisma connection pooling
- Nginx serves static frontend assets
- Docker multi-stage builds minimize image size

## Development Workflow

1. **Database Changes**
   - Modify `prisma/schema.prisma`
   - Run `npx prisma migrate dev --name description`
   - Update seed.ts if needed

2. **Backend Changes**
   - Modify NestJS modules/services/controllers
   - Run `npm run start:dev` for hot reload

3. **Frontend Changes**
   - Modify React components
   - Run `npm run dev` for hot reload (Vite)

4. **Docker Build**
   - `docker compose up --build`
   - Rebuilds all services

## Testing Strategy

### Unit Tests
- Backend: Jest for services and controllers
- Frontend: React Testing Library

### Integration Tests
- API endpoint tests using Supertest
- Database queries using in-memory PostgreSQL

### E2E Tests
- Playwright or Cypress for full user flows

## Deployment Options

### Docker Compose (Recommended for Development)
- All services in one command
- Persistent volumes for database
- Network isolation

### Kubernetes (Production)
- Separate deployments for each service
- Horizontal Pod Autoscaling
- Persistent Volume Claims for database
- Redis Sentinel for HA

### Cloud Services
- **Backend:** AWS ECS, Google Cloud Run, Azure Container Instances
- **Database:** AWS RDS, Google Cloud SQL, Azure Database
- **Cache:** AWS ElastiCache, Google Memorystore, Azure Cache
- **Frontend:** AWS S3 + CloudFront, Vercel, Netlify

## Monitoring & Observability

### Logs
- Backend: Console logs (can integrate Winston, Pino)
- Frontend: Browser console

### Metrics (Future)
- API request count, latency
- Mock runtime hit rate
- Cache hit/miss ratio

### Tracing (Future)
- OpenTelemetry integration
- Distributed tracing for complex flows

---

**Last Updated:** 2024

