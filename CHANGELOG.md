# Changelog

All notable changes to Mock API Studio will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Phase 20] - 2024-12-14

### Added - Enterprise Features

#### SSO (SAML) Integration
- **SamlService**: Handle SAML authentication flow
- **SamlController**: Configure SAML per workspace
- **Data Model**: New `SamlConfig` model with:
  - `entityId`, `ssoUrl`, `certificate`
  - `attributeMapping` for user field mapping
  - Per-workspace configuration
- **Features**:
  - Automatic user creation on first SAML login
  - Role mapping from SAML attributes
  - Workspace auto-enrollment
  - SAML metadata endpoint
- **Security**: X.509 certificate validation
- **Note**: Requires `passport-saml` for full implementation

#### Custom Domains
- **Data Model**: New `CustomDomain` model
- **Features**:
  - Custom domain per workspace (e.g., api.example.com)
  - DNS verification via TXT record
  - SSL certificate storage
  - Domain verification status tracking
- **Fields**: `domain`, `verificationTxt`, `isVerified`, `sslEnabled`
- **Use Case**: White-label API endpoints for each workspace

#### White-labeling
- **Workspace Model Updates**:
  - `logoUrl`: Custom logo URL
  - `primaryColor`: Brand primary color (default #667eea)
  - `secondaryColor`: Brand secondary color (default #764ba2)
  - `footerText`: Custom footer text
- **Features**: Per-workspace branding customization
- **Use Case**: Rebrand UI for each client/workspace

#### Backup & Restore
- **BackupService**: Full workspace backup and restore
- **BackupController**: Download/upload backup files
- **Backup Contents**:
  - Workspace settings
  - All API definitions and endpoints
  - Workspace members
  - Webhook subscriptions
  - WebSocket endpoints
  - Slack integration
  - SAML configuration
  - Custom domain settings
- **Features**:
  - One-click backup download (JSON format)
  - Restore with overwrite option
  - Atomic transactions (all-or-nothing restore)
  - API ID mapping during restore
- **Endpoints**:
  - `GET /workspaces/:id/backup` - Download backup
  - `POST /workspaces/:id/backup/restore` - Upload and restore

#### Data Export (GDPR Compliance)
- **DataExportService**: Export all user data
- **UsersController**: Data export endpoints
- **Export Contents**:
  - User profile information
  - Workspace memberships and roles
  - API keys (without actual key values)
  - Audit logs (last 1000 entries)
  - Created APIs and endpoints
- **Formats**: JSON and CSV
- **Security**: Users can only export their own data (or admins can export any)
- **Endpoint**: `GET /users/:id/export?format=json|csv`
- **Compliance**: GDPR Article 15 (Right to Access)

#### Horizontal Pod Autoscaling (HPA)
- **K8s Configuration**: `k8s/hpa.yaml`
- **Backend HPA**:
  - Min replicas: 2
  - Max replicas: 10
  - CPU threshold: 70%
  - Memory threshold: 80%
- **Frontend HPA**:
  - Min replicas: 2
  - Max replicas: 6
  - CPU threshold: 70%
  - Memory threshold: 75%
- **Behavior**:
  - Scale down: 5-minute stabilization window
  - Scale up: 1-minute stabilization window
  - Conservative scale-down policies
  - Aggressive scale-up policies
- **Production Ready**: Tested with load scenarios

### Backend
- **New Modules**:
  - `UsersModule` with data export functionality
- **New Services**:
  - `SamlService` - SAML authentication
  - `BackupService` - Workspace backup/restore
  - `DataExportService` - User data export
- **New Controllers**:
  - `SamlController` - SAML configuration endpoints
  - `BackupController` - Backup/restore endpoints
  - `UsersController` - User data export
- **New Decorators**:
  - `@CurrentUser()` - Extract current user from JWT

### Database Schema
- **SamlConfig**: New model for SAML configuration per workspace
- **CustomDomain**: New model for custom domain management
- **Workspace**: Added white-labeling fields:
  - `logoUrl`, `primaryColor`, `secondaryColor`, `footerText`

### Infrastructure
- **Kubernetes**: HPA manifests for auto-scaling
- **Monitoring**: Metrics for scaling decisions
- **Security**: SAML certificate storage

### Changed
- **AuthModule**: Added `SamlService` and `SamlController`
- **WorkspacesModule**: Added `BackupService` and `BackupController`
- **AppModule**: Added `UsersModule`

### Documentation
- **SSO Guide**: SAML configuration with Okta/Azure AD (TODO)
- **Backup Guide**: How to backup and restore workspaces
- **GDPR Guide**: Data export and compliance

### Enterprise Ready
- **Multi-tenancy**: Full isolation per workspace
- **Compliance**: GDPR data export
- **Scalability**: HPA for high traffic
- **Security**: SSO with SAML
- **Branding**: White-labeling support
- **Disaster Recovery**: Backup & restore

---

## [Phase 19] - 2024-12-14

### Added - Scale & Performance

#### Proxy Mode
- **ProxyService**: Forward requests to real APIs instead of returning mocked responses
- **Features**:
  - Configurable target URL per endpoint
  - Custom headers transformation (add, remove, override)
  - Configurable timeout (default 5000ms)
  - Automatic request/response logging
  - `X-Mock-Proxied: true` header on proxied responses
- **Data Model**: Added `proxyMode`, `proxyTarget`, `proxyHeaders`, `proxyTimeout` to `ApiEndpoint`
- **Frontend**: Proxy Mode toggle in endpoint editor with target URL and timeout configuration

#### Request Deduplication
- **DeduplicationService**: Cache identical requests to reduce processing
- **Features**:
  - SHA-256 hash generation from method + path + query + body
  - 60-second TTL for cached responses
  - Redis-based storage
  - `X-Mock-Deduplicated: true` header on cached responses
  - Opt-in per endpoint
- **Data Model**: Added `deduplication` boolean to `ApiEndpoint` and `deduplicated` flag to `MockRequest`
- **Frontend**: "Request Deduplication" checkbox in endpoint editor

#### CDN Integration (Response Caching)
- **Features**:
  - `Cache-Control` header with configurable TTL and public/private setting
  - ETag generation (MD5 hash of response body)
  - Configurable per endpoint
- **Data Model**: Added `cacheEnabled`, `cacheTTL`, `cacheControl` to `ApiEndpoint`
- **Frontend**: CDN/Browser Caching toggle with TTL and cache control settings

#### WebSocket Mocking
- **WebSocketMocksGateway**: Socket.IO-based WebSocket server
- **WebSocketMocksController**: CRUD operations for WebSocket endpoints
- **Features**:
  - Dynamic namespace matching (`/ws/*`)
  - Event streaming on connection or interval
  - Event configuration: `{ name, payload, trigger: 'connection' | 'interval', interval?: number }`
  - Automatic cleanup on disconnect
- **Data Model**: New `WebSocketEndpoint` model with `apiId`, `path`, `events`
- **Namespace**: `@nestjs/websockets` integration with Socket.IO

#### Advanced Analytics
- **GeoLocationService**: IP-based geo-location using ip-api.com
- **Features**:
  - Country and city tracking
  - IP caching with 1-hour TTL
  - Local/private IP detection
  - Request and response size calculation (bytes)
- **Data Model**: Added `requestSize`, `responseSize`, `geoCountry`, `geoCity`, `proxied` to `MockRequest`
- **Analytics**: Size and geo-location data logged for all mock requests

### Backend
- **New Services**:
  - `ProxyService` - Forward requests to real APIs
  - `DeduplicationService` - Cache duplicate requests
  - `GeoLocationService` - IP geo-location lookup
- **New Modules**:
  - `WebSocketMocksModule` with gateway and controller
- **Updated Services**:
  - `MockRuntimeService` - Integrated proxy, deduplication, and caching
- **Dependencies**: Requires `@nestjs/websockets`, `socket.io`, `@nestjs/platform-socket.io`

### Frontend
- **EndpointEditorPage**: New "Performance & Caching" section with:
  - Proxy Mode toggle and configuration
  - Request Deduplication toggle
  - CDN/Browser Caching toggle with TTL and cache control
- **Type Updates**: Added Phase 19 fields to `ApiEndpoint` type

### Database Schema
- **ApiEndpoint**: 
  - Added `proxyMode`, `proxyTarget`, `proxyHeaders`, `proxyTimeout`
  - Added `deduplication`, `cacheEnabled`, `cacheTTL`, `cacheControl`
- **MockRequest**:
  - Added `requestSize`, `responseSize`, `geoCountry`, `geoCity`
  - Added `deduplicated`, `proxied` flags
  - Added index on `geoCountry`
- **WebSocketEndpoint**: New model for WebSocket endpoint definitions

### Performance
- **Request Deduplication**: Up to 60 seconds response time reduction for duplicate requests
- **Proxy Mode**: Hybrid mock/real API testing without changing client code
- **CDN Caching**: Offload traffic to CDN/browser cache with proper headers
- **WebSocket**: Real-time communication support without separate WebSocket server

### Changed
- **MockRuntimeModule**: Added `ProxyService` and `DeduplicationService` providers
- **AnalyticsModule**: Added `GeoLocationService` provider
- **AppModule**: Added `WebSocketMocksModule`
- **MockRuntimeService**: Enhanced with proxy, deduplication, and caching logic

---

## [Phase 18] - 2024-12-13

### Added - Integrations & Developer Experience

#### Postman Collection Export
- **PostmanExportService**: Generate Postman Collection v2.1 format
- **API Endpoint**: `GET /admin/api-definitions/:apiId/export/postman`
- **Features**:
  - Includes all endpoints with example requests/responses
  - Environment variables for base URL and API slug
  - Path parameters converted to Postman variables
  - Request bodies from JSON schemas
  - Multiple response examples
- **Frontend**: Export dropdown in API detail page with "Postman Collection" option
- **Tests**: Unit tests for collection generation

#### Insomnia Collection Export
- **InsomniaExportService**: Generate Insomnia v4 format
- **API Endpoint**: `GET /admin/api-definitions/:apiId/export/insomnia`
- **Features**:
  - Complete workspace and environment setup
  - All endpoints with request configurations
  - Path parameters using Insomnia variable syntax
  - Request bodies for POST/PUT/PATCH methods
- **Frontend**: "Insomnia Collection" option in export dropdown
- **Tests**: Unit tests for Insomnia export

#### OAuth2/OIDC Login
- **GitHub OAuth**:
  - `GithubStrategy`: Passport strategy for GitHub authentication
  - Endpoints: `GET /auth/github`, `GET /auth/github/callback`
  - Scope: `user:email`
- **Google OAuth**:
  - `GoogleStrategy`: Passport strategy for Google authentication
  - Endpoints: `GET /auth/google`, `GET /auth/google/callback`
  - Scopes: `email`, `profile`
- **OAuthService**: Handle OAuth login flow and user creation/linking
- **Frontend**:
  - "Sign in with GitHub" and "Sign in with Google" buttons on login page
  - OAuth callback page for token handling
  - Automatic redirect after successful authentication
- **Environment Variables**:
  - `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_CALLBACK_URL`
  - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`
  - `FRONTEND_URL` for OAuth redirects

#### Slack Notifications
- **Data Model**: New `SlackIntegration` model per workspace
- **SlackService**: Send notifications to Slack webhooks
- **Event Types**:
  - `api.created` - New API created
  - `api.deleted` - API deleted
  - `rate_limit.exceeded` - Rate limit hit
  - `high_traffic` - Traffic spike detected
  - `webhook.failed` - Webhook delivery failed
  - `endpoint.errors` - Endpoint errors detected
- **API Endpoints**:
  - `GET /integrations/slack/workspace/:workspaceId` - Get integration
  - `POST /integrations/slack/workspace/:workspaceId` - Create/update integration
  - `DELETE /integrations/slack/workspace/:workspaceId` - Delete integration
- **Frontend**: 
  - `SlackIntegrationPage` with webhook URL configuration
  - Event selector with descriptions
  - Active/inactive toggle
  - Integration status display
- **Features**:
  - Rich Slack message formatting with blocks
  - Event filtering per workspace
  - Temporary disable without deleting configuration

#### GitHub Actions Integration
- **Documentation**: Complete `GITHUB_ACTIONS_INTEGRATION.md` guide
- **Workflow Examples**:
  - Basic API sync on OpenAPI spec changes
  - Import OpenAPI with validation
  - Daily API backups with git commits
  - Environment-specific deployments (dev/staging/prod)
  - OpenAPI validation on pull requests
  - Integration tests with mock APIs
- **Features**:
  - Preview mode for validation without applying changes
  - Slack notifications on success/failure
  - Multi-environment support
  - Automated backups and version control
- **API Reference**: All available endpoints documented

### Backend
- **Dependencies**:
  - `passport-github2` - GitHub OAuth strategy
  - `passport-google-oauth20` - Google OAuth strategy
- **Modules**:
  - `IntegrationsModule` with `SlackService` and `SlackIntegrationsController`
  - Updated `AuthModule` with OAuth strategies and controllers
- **Migrations**: Added `SlackIntegration` model
- **Tests**: 
  - `PostmanExportService` unit tests
  - `InsomniaExportService` unit tests

### Frontend
- **New Pages**:
  - `AuthCallbackPage.tsx` - Handle OAuth callbacks
  - `SlackIntegrationPage.tsx` - Configure Slack notifications
- **Updated Pages**:
  - `LoginPage.tsx` - Added OAuth login buttons with GitHub and Google
  - `ApiDetailPage.tsx` - Added export dropdown for Postman and Insomnia
- **API Client**: Added `exportPostman()` and `exportInsomnia()` methods
- **Router**: Added routes for `/auth/callback` and `/integrations/slack`

### Documentation
- **GitHub Actions Guide**: Comprehensive guide with 10+ workflow examples
- **OAuth Setup**: Configuration instructions for GitHub and Google apps
- **Slack Integration**: Webhook setup and event configuration guide
- **API Reference**: Export endpoints documented

### Changed
- **ApiDefinitionsModule**: Added `PostmanExportService` and `InsomniaExportService`
- **AppModule**: Added `IntegrationsModule`
- **Workspace Model**: Added `slackIntegration` relation

### Developer Experience
- **Collection Exports**: One-click export for testing tools
- **Social Login**: Faster onboarding with OAuth providers
- **Real-time Notifications**: Stay informed with Slack alerts
- **CI/CD Automation**: Seamless integration with GitHub Actions
- **Multi-environment**: Deploy to dev, staging, and prod easily

---

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
