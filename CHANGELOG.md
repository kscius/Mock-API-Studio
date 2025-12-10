# Changelog

All notable changes to Mock API Studio will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

