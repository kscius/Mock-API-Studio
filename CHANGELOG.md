# Changelog

All notable changes to Mock API Studio will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2024-12-12

### Added - Phase 16 (Frontend Enhancements)
- **Audit Logs UI**:
  - Complete audit logs page (`/admin/audit-logs`)
  - Table with pagination (20 entries per page)
  - Advanced filters (action, entity type, date range)
  - Expandable rows for detailed view
  - Export functionality (CSV + JSON)
  - Colored action badges (create, update, delete, duplicate)
  - IP address and user agent tracking
  - Dark mode support

- **Faker.js Method Browser**:
  - Modal interface with real-time search
  - Module sidebar with method counts
  - Method list with syntax preview
  - Insert at cursor functionality
  - Copy to clipboard feature
  - Integration in endpoint editor
  - Searchable across all modules and methods

- **Faker.js Live Preview**:
  - `ResponsePreview` component
  - Side-by-side template vs output comparison
  - Backend `/faker-docs/render` endpoint
  - Generate/Regenerate functionality
  - Copy rendered output
  - Error handling for templates

- **Enhanced JSON Editor (Monaco Editor)**:
  - VS Code-like editing experience
  - Syntax highlighting for JSON
  - Bracket pair colorization
  - Format on paste/type
  - Line numbers
  - Autocomplete for Faker.js placeholders
  - Dark mode support
  - Insert text at cursor position

- **Template Variables Panel**:
  - Collapsible panel with 5 variable groups
  - Dynamic path parameter extraction
  - Query parameters examples
  - Request body variables
  - Request headers
  - Special variables (timestamp, uuid, etc.)
  - Insert and copy functionality
  - Examples for each variable type

### Changed
- `EndpointEditorPage` now uses Monaco Editor instead of textarea
- Improved response body editing experience
- Better dark mode support across all new components

### Testing
- Added 4 new test suites with 60+ tests:
  - `FakerMethodBrowser.test.tsx` (16 tests)
  - `ResponsePreview.test.tsx` (14 tests)
  - `TemplateVariablesPanel.test.tsx` (12 tests)
  - `AuditLogsPage.test.tsx` (14 tests)

### Dependencies
- Added `@monaco-editor/react` for enhanced code editing

## [1.2.0] - 2024-12-11

### Added - Phase 15 (Developer Experience)
- **CLI Tool (`@mock-api-studio/cli`)**:
  - Complete command-line interface for managing Mock API Studio
  - Commands: `login`, `logout`, `config`, `workspace`, `api`, `import`
  - Interactive prompts with `inquirer`
  - Colored terminal output with `chalk`
  - Loading spinners with `ora`
  - Table formatting with `cli-table3`
  - JWT and API key authentication
  - Config storage in `~/.mock-api/config.json`
  - Workspace context management
  - OpenAPI import from CLI
  - Comprehensive CLI documentation

- **Faker.js Templating**:
  - Dynamic data generation in mock responses
  - Support for `{{faker.module.method}}` syntax
  - Custom Handlebars helper for Faker.js
  - Recursive processing for nested objects and arrays
  - `/faker-docs/methods` endpoint for available methods
  - `FakerTemplatingService` with `render()` and `hasFakerPlaceholders()`
  - Comprehensive Faker usage documentation (`FAKER_USAGE.md`)

- **Endpoint Duplication**:
  - `POST /api-definitions/endpoints/:endpointId/duplicate`
  - Copy all endpoint properties (responses, schema, delay, etc.)
  - Auto-increment path with `-copy-{timestamp}`
  - Frontend modal for path/summary customization
  - Duplicate button in endpoint editor

- **Swagger UI Integration**:
  - `GET /admin/api-definitions/:apiId/openapi.json` endpoint
  - Generate OpenAPI 3.0 spec from stored endpoints
  - Interactive Swagger UI in frontend
  - "API Docs" tab in API detail page
  - Execute requests directly from Swagger UI

- **Audit Logs**:
  - `AuditLog` model with user, action, entity tracking
  - `AuditLogInterceptor` for automatic logging
  - `@AuditLog` decorator for declarative logging
  - Track: create, update, delete, duplicate actions
  - IP address and user-agent capture
  - JWT-based user identification
  - `GET /admin/audit-logs` with filters (workspace, user, action, date)
  - Daily cleanup cron job (90-day retention)
  - Pagination and sorting support

### Changed
- Updated root `package.json` with CLI scripts (`dev:cli`, `build:cli`, `test:cli`)
- Enhanced `README.md` with CLI usage section
- Updated project structure documentation
- Jest configuration to support ES modules (`@faker-js/faker`)

### Fixed
- TypeScript type issues with Prisma `JsonValue` in endpoint duplication
- Handlebars escaping issues with Faker.js placeholders

## [1.1.0] - 2024-01-15

### Added - Phases 11-14 (Production Hardening)
- Dark mode with system preference detection
- Prometheus metrics for monitoring
- CI/CD pipeline with GitHub Actions
- Kubernetes deployment manifests
- Configurable cache TTL and rate limiting
- Webhook retry logic with exponential backoff
- Analytics data retention cleanup
- Toast notifications with `react-hot-toast`

### Added - Phases 6-10
- Comprehensive testing (Jest, Vitest, Playwright)
- OpenAPI upload UI (drag & drop)
- Multi-tenancy (Workspaces)
- Webhooks with retry logic
- GraphQL mock support

## [1.0.0] - 2024-01-01

### Added
- Initial release of Mock API Studio
- **Backend Features:**
  - NestJS-based REST API
  - Prisma ORM with PostgreSQL
  - Redis caching for API definitions
  - Full CRUD for API definitions and endpoints
  - Import/Export API definitions as JSON
  - Mock runtime with catch-all route handler
  - Path parameter support (e.g., `/users/:id`)
  - Multiple response configurations per endpoint
  - Configurable response delays
  - Enable/disable endpoints individually
  - Automatic database migrations
  - Seed data with example APIs (JSONPlaceholder, GitHub Mock)

- **Frontend Features:**
  - React + Vite + TypeScript SPA
  - Dashboard for managing APIs
  - API detail page with endpoint management
  - Endpoint editor with multi-response support
  - Import/Export UI functionality
  - Responsive design
  - Clean, modern UI

- **Infrastructure:**
  - Docker Compose setup with 4 services
  - Multi-stage Docker builds for optimization
  - Nginx reverse proxy for frontend
  - PostgreSQL database with persistent volumes
  - Redis cache with health checks
  - Development and production configurations

- **Documentation:**
  - Comprehensive README with quick start guide
  - Architecture documentation
  - Contributing guidelines
  - Example API definitions
  - Development scripts

### Technical Details
- **Backend Stack:** NestJS, TypeScript, Prisma, PostgreSQL, Redis, path-to-regexp
- **Frontend Stack:** React, TypeScript, Vite, React Router, Axios
- **DevOps:** Docker, Docker Compose, Nginx

### Known Limitations
- No authentication/authorization
- CORS enabled for all origins (development mode)
- No rate limiting
- No request validation against schemas
- No response templating

## [Unreleased]

### Planned Features
- [ ] User authentication and API keys
- [ ] OpenAPI/Swagger import
- [ ] Response templating (Handlebars)
- [ ] Request validation based on JSON Schema
- [ ] Rate limiting
- [ ] API analytics and usage metrics
- [ ] Webhook support
- [ ] Dark mode
- [ ] Export to Postman collections

---

[1.0.0]: https://github.com/username/mock-api-studio/releases/tag/v1.0.0

