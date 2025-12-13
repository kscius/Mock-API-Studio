# Changelog

All notable changes to Mock API Studio will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Phase 17] - 2024-12-13

### Added - Security & Governance

#### RBAC (Role-Based Access Control)
- **Data Model**: New `WorkspaceMember` model with `ADMIN`, `EDITOR`, and `VIEWER` roles
- **RolesGuard**: Custom guard for enforcing workspace-level permissions
- **Decorators**: `@Roles()` and `@WorkspaceIdParam()` for declarative permission control
- **API Endpoints**:
  - `GET /admin/workspaces/:id/members` - List workspace members
  - `POST /admin/workspaces/:id/members` - Invite member with role
  - `PATCH /admin/workspaces/:id/members/:memberId` - Update member role
  - `DELETE /admin/workspaces/:id/members/:memberId` - Remove member
- **Frontend**: Workspace members management UI with role selection and invitations

#### API Key Scopes
- **Enhanced API Key Model**: Added `scopes` array and `workspaceId` fields
- **Scope System**: 14 predefined scopes (read/write/delete for apis, endpoints, workspaces, etc.)
- **ScopesGuard**: Validates API key permissions before allowing access
- **Wildcard Support**: Scopes like `read:*` or `*:apis` for flexible permissions
- **Frontend**: API Keys management page with scope selection UI

#### API Versioning
- **Data Model**: Added `isLatest`, `parentId` fields to `ApiDefinition` for version tracking
- **Service Methods**:
  - `createVersion(apiId, newVersion)` - Create new version copying all endpoints
  - `getVersions(apiId)` - List all versions of an API
- **API Endpoints**:
  - `POST /admin/api-definitions/:apiId/versions` - Create new version
  - `GET /admin/api-definitions/:apiId/versions` - List versions
- **Frontend**: `ApiVersionsPanel` component for version management

#### Two-Factor Authentication (2FA)
- **Data Model**: Added `twoFactorSecret` and `twoFactorEnabled` fields to `User`
- **TwoFactorService**: TOTP generation, QR code creation, token verification
- **API Endpoints**:
  - `POST /auth/2fa/setup` - Generate secret and QR code
  - `POST /auth/2fa/enable` - Enable 2FA after token verification
  - `DELETE /auth/2fa/disable` - Disable 2FA with token verification
  - `GET /auth/2fa/status` - Check 2FA status
- **Login Flow**: Updated to support 2FA token verification
- **Frontend**: Complete 2FA setup/disable UI with QR code display

### Backend
- **Dependencies**: Added `otplib`, `qrcode`, `@types/qrcode` for 2FA
- **Migrations**: 3 new migrations for RBAC, API Key Scopes, Versioning, and 2FA
- **Tests**: Unit tests for `RolesGuard`, `ScopesGuard`, and `TwoFactorService`

### Frontend
- **New Pages**:
  - `WorkspaceMembersPage.tsx` - Manage team members and roles
  - `ApiKeysPage.tsx` - Create and manage API keys with scopes
  - `TwoFactorAuthPage.tsx` - Setup and manage 2FA
- **New Components**:
  - `ApiVersionsPanel.tsx` - Version selector and creator
- **Router**: Added routes for `/workspaces/:id/members`, `/api-keys`, `/2fa`

### Changed
- **WorkspacesController**: Added member management endpoints with RBAC guards
- **AuthService**: Enhanced login method to support 2FA token verification
- **ApiDefinitionsService**: Added versioning methods
- **Unique Constraint**: Changed from `(workspaceId, slug)` to `(workspaceId, slug, version)`

### Security
- **Permission Model**: Hierarchical role system (ADMIN > EDITOR > VIEWER)
- **API Key Security**: Scoped permissions prevent overly permissive keys
- **2FA Protection**: Optional additional security layer for user accounts
- **Audit Trail**: All RBAC changes logged in audit logs

---

## [Phase 16] - 2024-12-12

### Added - Frontend Enhancements

#### Faker.js Integration
- **FakerMethodBrowser Component**: Modal for browsing and inserting Faker.js methods
- **ResponsePreview Component**: Live preview of rendered Faker.js templates
- **Backend Endpoint**: `POST /faker-docs/render` for server-side template rendering

#### Enhanced JSON Editor
- **Monaco Editor Integration**: Replaced `textarea` with VS Code-like editor
- **Features**: Syntax highlighting, bracket matching, auto-formatting, error detection
- **Insert at Cursor**: Support for inserting Faker.js placeholders at cursor position

#### Template Variables Panel
- **Dynamic Panel**: Shows available Handlebars variables based on endpoint path
- **Categories**: Path params, query params, body, headers, special variables
- **Insert & Copy**: Quick insertion and clipboard support

#### Audit Logs UI
- **AuditLogsPage Component**: Full audit log viewer with filters
- **Filters**: Date range, user, action, entity type
- **Expandable Rows**: View full change details including before/after state
- **Pagination & Sorting**: Handle large datasets efficiently

### Changed
- **EndpointEditorPage**: Integrated all new components (Faker Browser, Monaco Editor, Template Vars)
- **Response Body Editor**: Now uses Monaco Editor instead of native `textarea`

---

## [Phase 15] - 2024-12-11

### Added - Developer Experience

#### Response Templating with Faker.js
- **FakerTemplatingService**: Backend service for processing `{{faker.module.method}}` placeholders
- **Handlebars Helper**: `{{faker "path.to.method"}}` syntax support
- **Available Methods Endpoint**: `GET /faker-docs` lists all available Faker.js modules
- **Documentation**: `FAKER_USAGE.md` with examples

#### Endpoint Duplication
- **Backend**: `POST /api-definitions/endpoints/:endpointId/duplicate`
- **Auto-increment Path**: Adds `-copy` suffix or custom path
- **Frontend**: "Duplicate" button with editable fields modal

#### Interactive Swagger UI
- **OpenAPI Spec Generation**: `GET /admin/api-definitions/:apiId/openapi.json`
- **Swagger UI Integration**: Embedded in API detail page
- **Live Execution**: Execute requests directly from Swagger UI

#### CLI Tool
- **Package**: `@mock-api-studio/cli` with `mock-api` binary
- **Commands**:
  - `login/logout` - Authentication
  - `workspace list/create/select` - Workspace management
  - `api list/create/delete` - API management
  - `import <file>` - OpenAPI import
  - `config` - Show configuration
- **Authentication**: JWT or API Key support
- **Config Storage**: `~/.mock-api/config.json`

#### Audit Logs
- **AuditLog Model**: Tracks create/update/delete actions
- **AuditLogInterceptor**: Automatic logging via `@AuditLog` decorator
- **Endpoints**: `GET /admin/audit-logs` with filters and pagination
- **Cleanup Job**: Auto-delete logs older than 90 days

---

## [Phases 11-14] - 2024-12-10

### Added - Production Hardening

#### Dark Mode
- **ThemeContext**: React context for theme management
- **CSS Variables**: Dynamic theming support
- **System Preference**: Auto-detect OS theme
- **Toggle Component**: In-app theme switcher

#### Toast Notifications
- **react-hot-toast**: Centralized notification system
- **Axios Interceptor**: Automatic error notifications
- **Custom Styling**: Theme-aware toast appearance

#### Prometheus Metrics
- **MetricsService**: HTTP, webhook, cache, runtime metrics
- **Endpoint**: `GET /metrics` in Prometheus format
- **Grafana Dashboard**: Pre-configured dashboard JSON

#### CI/CD Pipeline
- **GitHub Actions**: `.github/workflows/ci-cd.yml`
- **Jobs**: Linting, testing, Docker build/push
- **Automatic**: Triggers on push to `main` and pull requests

#### Kubernetes Deployment
- **Manifests**: Complete K8s YAML files
- **Components**: Backend, Frontend, PostgreSQL, Redis deployments
- **Features**: Health probes, auto-scaling, ConfigMaps, Secrets

### Changed
- **Configurable Settings**: Cache TTL, rate limits, analytics retention via env vars
- **Error Handling**: Improved user-facing error messages
- **Test Coverage**: Increased to 80%+

---

## [Phases 6-10] - 2024-12-09

### Added

#### Testing (Phase 6)
- **Backend**: Jest unit and integration tests (coverage: 80%+)
- **Frontend**: Vitest tests for React components
- **E2E**: Playwright tests for critical user flows

#### OpenAPI Upload UI (Phase 7)
- **Drag & Drop**: File upload component
- **Dry Run Mode**: Preview imports without persisting
- **Backend**: `POST /admin/openapi/import/upload`

#### Multi-tenancy (Phase 8)
- **Workspace Model**: Logical isolation for teams
- **Workspace-aware Endpoints**: All APIs scoped to workspaces
- **Frontend**: Workspace selector and management UI

#### Webhooks (Phase 9)
- **WebhookSubscription Model**: Event-based notifications
- **Retry Logic**: Exponential backoff for failed deliveries
- **Frontend**: Webhook management UI

#### GraphQL Support (Phase 10)
- **GraphQL Mock Endpoints**: Support for queries and mutations
- **Frontend**: GraphQL tester UI

---

## [Initial Release] - 2024-12-08

### Added

#### Core Features
- **NestJS Backend**: RESTful API with Prisma ORM
- **React Frontend**: Modern UI with React Router
- **PostgreSQL Database**: Reliable data storage
- **Redis Caching**: Fast response times
- **Docker Setup**: Complete containerization

#### API Management
- **CRUD Operations**: Create, read, update, delete APIs and endpoints
- **Dynamic Routing**: Path parameters support (`/users/:id`)
- **Multiple Responses**: Conditional response matching
- **JSON Schema Validation**: Request validation with AJV

#### Mock Runtime
- **Mock Serving**: HTTP endpoint for serving mocks
- **Handlebars Templating**: Dynamic response generation
- **Configurable Delays**: Simulate network latency
- **Response Scenarios**: Multiple responses per endpoint

#### Authentication
- **JWT Authentication**: Secure user login
- **API Keys**: Programmatic access
- **User Management**: Registration and profile

#### Analytics
- **Request Tracking**: Log all mock requests
- **Performance Metrics**: Response times and success rates
- **Visualization**: Charts and graphs with Recharts

#### Security
- **Helmet**: Security headers
- **Rate Limiting**: Per-workspace throttling
- **CORS**: Cross-origin protection

---

## Future Roadmap

See [ROADMAP.md](./ROADMAP.md) for upcoming features in Phases 18-20.
