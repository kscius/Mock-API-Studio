# 🎭 Mock API Studio

A complete solution for designing, managing, and serving mock APIs with a modern web interface.

## 🚀 Features

### Core Features
- **Full CRUD Management**: Create, read, update, and delete API definitions and endpoints
- **Mock Runtime**: Serve mock responses with configurable delays and multiple response scenarios
- **Import/Export**: JSON-based API definitions for easy sharing and version control
- **Redis Caching**: Fast response times with automatic cache invalidation
- **Path Parameters**: Support for dynamic routes like `/users/:id`
- **Multiple Responses**: Define multiple responses per endpoint with default selection
- **Web UI**: Modern React-based interface for managing your mocks
- **Docker Ready**: Complete Docker Compose setup for easy deployment

### Advanced Features ⭐ NEW
- **🔐 Authentication**: JWT-based auth + API Keys for programmatic access
- **✅ JSON Schema Validation**: Validate requests against OpenAPI-style schemas
- **🎨 Handlebars Templating**: Dynamic responses with `{{params.id}}`, `{{query.name}}`, etc.
- **📄 OpenAPI Import**: Import from Swagger/OpenAPI 3.0 specs
- **📊 Analytics**: Request tracking, metrics, and performance stats
- **🔒 Security**: Helmet, rate limiting, CORS protection
- **⚡ Conditional Responses**: Match responses based on query params, headers, or body

## 📋 Tech Stack

### Backend
- **NestJS** - Progressive Node.js framework
- **Prisma** - Next-generation ORM
- **PostgreSQL** - Robust relational database
- **Redis** - In-memory caching
- **TypeScript** - Type-safe development

### Frontend
- **React** - UI library
- **Vite** - Fast build tool
- **React Router** - Client-side routing
- **TypeScript** - Type-safe development
- **Axios** - HTTP client

### Infrastructure
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Nginx** - Web server for frontend

## 🏗️ Project Structure

```
mock-api-studio/
├── backend/                 # NestJS API
│   ├── src/
│   │   ├── api-definitions/ # API CRUD module
│   │   ├── mock-runtime/    # Mock serving module
│   │   ├── common/          # Shared modules (Prisma, Redis)
│   │   ├── config/          # Configuration module
│   │   └── shared/          # Utilities
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema
│   │   └── seed.ts          # Seed data
│   └── Dockerfile
├── frontend/                # React UI
│   ├── src/
│   │   ├── api/             # API client
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   └── App.tsx
│   ├── nginx.conf
│   └── Dockerfile
└── docker-compose.yml       # Multi-service setup
```

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local development)

### Using Docker (Recommended)

1. **Clone the repository**
```bash
git clone <repository-url>
cd mock-api-studio
```

2. **Start all services**
```bash
docker compose up --build
```

3. **Access the application**
- Frontend: http://localhost:8080
- Backend API: http://localhost:3000
- Mock Runtime: http://localhost:3000/mock/:apiSlug/*

The database will be automatically migrated and seeded with example APIs on first run.

### Local Development

#### Backend

```bash
cd backend

# Install dependencies
npm install

# Set up environment
cp .env.example .env

# Start PostgreSQL and Redis (using Docker)
docker compose up db redis -d

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database
npx prisma db seed

# Start development server
npm run start:dev
```

Backend will run on http://localhost:3000

#### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will run on http://localhost:5173

## 📖 Usage

### 1. Create a New API

1. Go to the Dashboard
2. Click **"Create API"**
3. Fill in:
   - Name: e.g., "My API"
   - Slug: e.g., "my-api" (used in URLs)
   - Version: e.g., "1.0.0"
   - Base Path: e.g., "/" or "/v1"
   - Description (optional)

### 2. Add Endpoints

1. Click on an API to view details
2. Click **"New Endpoint"**
3. Configure:
   - **Method**: GET, POST, PUT, PATCH, DELETE
   - **Path**: e.g., `/users/:id`
   - **Summary**: Description
   - **Delay**: Response delay in milliseconds
   - **Enabled**: Toggle endpoint on/off
   - **Responses**: Define one or more responses with:
     - Status code
     - Headers (JSON)
     - Body (JSON)
     - Default flag

### 3. Test Your Mock

Once you've created an API and endpoints, test them:

```bash
# Example: JSONPlaceholder API (seeded by default)
curl http://localhost:3000/mock/jsonplaceholder/posts

curl http://localhost:3000/mock/jsonplaceholder/posts/1

curl http://localhost:3000/mock/jsonplaceholder/users
```

### 4. Import/Export APIs

**Export:**
1. Click "Export" on any API card
2. A JSON file will be downloaded

**Import:**
1. Click "Import JSON" on the Dashboard
2. Select a JSON file
3. Choose whether to overwrite existing APIs

### Example API Definition (JSON)

```json
{
  "type": "mock-api-definition",
  "schemaVersion": "1.0.0",
  "api": {
    "name": "My API",
    "slug": "my-api",
    "version": "1.0.0",
    "basePath": "/",
    "description": "Example API",
    "isActive": true,
    "tags": ["example"]
  },
  "endpoints": [
    {
      "method": "GET",
      "path": "/users/:id",
      "summary": "Get user by ID",
      "responses": [
        {
          "status": 200,
          "headers": { "Content-Type": "application/json" },
          "body": { "id": 1, "name": "John Doe" },
          "isDefault": true
        },
        {
          "status": 404,
          "body": { "error": "User not found" },
          "isDefault": false
        }
      ],
      "delayMs": 100,
      "enabled": true
    }
  ]
}
```

## 🔥 Advanced Features Guide

### Authentication

```bash
# Register a new user
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"secret123","name":"John"}'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"secret123"}'

# Create API Key (use JWT from login response)
curl -X POST http://localhost:3000/auth/api-keys \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"My API Key","scope":["*"]}'
```

### Request Validation with JSON Schema

Add `requestSchema` to your endpoint definition:

```json
{
  "requestSchema": {
    "query": {
      "type": "object",
      "properties": {
        "userId": { "type": "integer", "minimum": 1 }
      },
      "required": ["userId"]
    },
    "body": {
      "type": "object",
      "properties": {
        "name": { "type": "string", "minLength": 3 },
        "email": { "type": "string", "format": "email" }
      },
      "required": ["name", "email"]
    }
  }
}
```

Invalid requests will receive a 400 response with detailed errors.

### Templating with Handlebars

Use templates in response bodies for dynamic content:

```json
{
  "status": 200,
  "body": {
    "userId": "{{params.id}}",
    "name": "{{query.name}}",
    "message": "Hello {{body.firstName}}!",
    "fullRequest": "{{{json body}}}"
  },
  "isDefault": true
}
```

Available template variables:
- `{{params.xxx}}` - URL path parameters
- `{{query.xxx}}` - Query string parameters
- `{{body.xxx}}` - Request body fields
- `{{headers.xxx}}` - Request headers
- `{{{json obj}}}` - Serialize object to JSON

### Conditional Responses

Define `match` conditions to return different responses:

```json
{
  "status": 500,
  "body": { "error": "Forced error" },
  "match": {
    "query": { "error": "1" },
    "headers": { "x-force-error": "true" }
  }
}
```

Requests matching all conditions will receive this response instead of the default.

### OpenAPI Import

Import existing OpenAPI 3.0 or Swagger 2.0 specs:

```bash
curl -X POST http://localhost:3000/api-definitions/import/openapi \
  -H "Content-Type: application/json" \
  -d @your-openapi-spec.json
```

This automatically creates:
- API definition from `info` section
- Endpoints from `paths`
- Request schemas from `parameters` and `requestBody`
- Response examples from `responses`

### Analytics

Enable analytics tracking in `.env`:
```env
ANALYTICS_ENABLED=true
```

View stats:
```bash
curl http://localhost:3000/analytics/stats

# Filter by API
curl http://localhost:3000/analytics/stats?apiSlug=myapi

# Filter by date range
curl "http://localhost:3000/analytics/stats?from=2025-01-01&to=2025-01-31"
```

Response includes:
- Total requests
- Average duration
- Success rate
- Error rate
- Top APIs and endpoints
- Requests per day

Clean old logs:
```bash
curl http://localhost:3000/analytics/clean?days=30
```

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://mockapi:mockapi@localhost:5432/mockapi

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Server
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=your-super-secret-key

# CORS
CORS_ORIGIN=*

# Analytics
ANALYTICS_ENABLED=true
```

## 🧪 Testing

### Manual Test Flows

#### Test 1: Create and Test a Custom API

1. Create a new API via the UI
2. Add an endpoint: `GET /test/:id`
3. Configure a response with status 200 and body `{"message": "Hello"}`
4. Test: `curl http://localhost:3000/mock/your-slug/test/123`

#### Test 2: Use Seeded Data

1. Test JSONPlaceholder API:
```bash
curl http://localhost:3000/mock/jsonplaceholder/posts
curl http://localhost:3000/mock/jsonplaceholder/posts/1
curl http://localhost:3000/mock/jsonplaceholder/users
```

2. Test GitHub Mock API:
```bash
curl http://localhost:3000/mock/github/users/octocat
curl http://localhost:3000/mock/github/repos/octocat/sample-repo
```

#### Test 3: Delay and Multiple Responses

1. Create an endpoint with 2000ms delay
2. Make a request and observe the delay
3. Create an endpoint with multiple responses
4. Toggle the `isDefault` flag and test

## 🔧 API Reference

### Admin API (`/api-definitions`)

- `GET /api-definitions` - List all APIs
- `GET /api-definitions/:id` - Get API by ID
- `POST /api-definitions` - Create new API
- `PATCH /api-definitions/:id` - Update API
- `DELETE /api-definitions/:id` - Delete API
- `POST /api-definitions/:apiId/endpoints` - Create endpoint
- `PATCH /api-definitions/endpoints/:endpointId` - Update endpoint
- `DELETE /api-definitions/endpoints/:endpointId` - Delete endpoint
- `GET /api-definitions/:apiId/export` - Export API as JSON
- `POST /api-definitions/import?overwrite=true` - Import API from JSON

### Mock Runtime (`/mock/:apiSlug/*`)

- `ANY /mock/:apiSlug/*` - Serve mock responses

## 🛠️ Development

### Database Migrations

```bash
# Create migration
npx prisma migrate dev --name migration_name

# Apply migrations (production)
npx prisma migrate deploy

# Reset database
npx prisma migrate reset
```

### Prisma Studio

```bash
npx prisma studio
```

Access at http://localhost:5555

### Environment Variables

**Backend (.env)**
```env
DATABASE_URL=postgresql://mockapi:mockapi@localhost:5432/mockapi
REDIS_HOST=localhost
REDIS_PORT=6379
PORT=3000
NODE_ENV=development
```

**Frontend (.env)**
```env
VITE_API_BASE_URL=http://localhost:3000
```

## 🐛 Troubleshooting

### Docker Issues

**Port conflicts:**
```bash
# Check running containers
docker ps

# Stop all services
docker compose down

# Remove volumes (resets database)
docker compose down -v
```

**Rebuild containers:**
```bash
docker compose up --build --force-recreate
```

### Backend Issues

**Prisma Client not generated:**
```bash
npx prisma generate
```

**Redis connection failed:**
- Ensure Redis is running
- Check REDIS_HOST and REDIS_PORT in .env

### Frontend Issues

**API calls failing:**
- Check VITE_API_BASE_URL in .env
- Ensure backend is running
- Check browser console for CORS errors

## 📝 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For issues and questions, please open an issue on GitHub.

---

**Built with ❤️ using NestJS, React, and Docker**
