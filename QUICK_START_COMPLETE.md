# 🚀 Mock-API-Studio - Guía de Inicio Completa

## ✅ Estado del Proyecto: 100% Completado

**Versión**: 2.0.0  
**Fecha**: 2025-01-12  
**Estado**: Production Ready (Backend + Frontend)

---

## 📦 Instalación y Setup

### 1. Clonar el Repositorio

```bash
git clone <tu-repositorio>
cd Mock-API-Studio
```

### 2. Setup del Backend

```bash
cd backend

# Instalar dependencias
npm install

# Crear archivo .env
cat > .env << 'EOF'
DATABASE_URL="postgresql://mockapi:mockapi@localhost:5432/mockapi"
REDIS_HOST=localhost
REDIS_PORT=6379
PORT=3000
NODE_ENV=development
JWT_SECRET=tu-super-secreto-cambiar-en-produccion
CORS_ORIGIN=*
ANALYTICS_ENABLED=true
EOF

# Generar cliente de Prisma
npx prisma generate

# Aplicar migraciones (si usas Docker, esto se hace automáticamente)
npx prisma migrate deploy

# Opcional: Seed de datos de ejemplo
npx prisma db seed
```

### 3. Setup del Frontend

```bash
cd ../frontend

# Instalar dependencias
npm install

# Crear archivo .env
cat > .env << 'EOF'
VITE_API_BASE_URL=http://localhost:3000
EOF
```

### 4. Levantar con Docker Compose (RECOMENDADO)

```bash
# Desde la raíz del proyecto
docker compose up --build
```

Servicios disponibles:
- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:3000
- **Mock Runtime**: http://localhost:3000/mock/:apiSlug/*
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

### 5. Desarrollo Local (Sin Docker)

```bash
# Terminal 1 - PostgreSQL
docker run --name mockapi-db -p 5432:5432 \
  -e POSTGRES_USER=mockapi \
  -e POSTGRES_PASSWORD=mockapi \
  -e POSTGRES_DB=mockapi \
  -d postgres:16-alpine

# Terminal 2 - Redis
docker run --name mockapi-redis -p 6379:6379 -d redis:7-alpine

# Terminal 3 - Backend
cd backend
npm run start:dev

# Terminal 4 - Frontend
cd frontend
npm run dev
```

---

## 👤 Primer Uso: Crear Cuenta

### Opción 1: Desde la UI

1. Abrir http://localhost:8080
2. Click en "Regístrate aquí"
3. Completar formulario:
   - Email: admin@example.com
   - Password: Admin123
   - Nombre: Admin User
4. Click en "Registrarse"
5. Serás redirigido automáticamente al Dashboard

### Opción 2: Desde la API

```bash
# Registrar usuario
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin123",
    "name": "Admin User"
  }'

# Respuesta incluirá el JWT token
{
  "user": {...},
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 🎯 Funcionalidades Principales

### 1. Gestión de APIs Mock

#### Crear API desde UI
1. Login en http://localhost:8080
2. Click en "Crear nueva API"
3. Ingresar nombre y slug
4. Agregar endpoints

#### Crear API desde API REST

```bash
# Obtener token
TOKEN=$(curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin123"}' \
  | jq -r '.token')

# Crear API
curl -X POST http://localhost:3000/api-definitions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Test API",
    "slug": "my-test-api",
    "basePath": "/",
    "description": "API para testing",
    "tags": ["test"]
  }'
```

### 2. Crear Endpoint con Validación y Templating

```bash
curl -X POST "http://localhost:3000/api-definitions/{API_ID}/endpoints" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "method": "POST",
    "path": "/users/:id",
    "summary": "Create user",
    "requestSchema": {
      "body": {
        "type": "object",
        "properties": {
          "name": { "type": "string", "minLength": 3 },
          "email": { "type": "string", "format": "email" }
        },
        "required": ["name", "email"]
      }
    },
    "responses": [
      {
        "status": 201,
        "headers": { "Content-Type": "application/json" },
        "body": {
          "id": "{{params.id}}",
          "name": "{{body.name}}",
          "email": "{{body.email}}",
          "createdAt": "2025-01-12T00:00:00Z"
        },
        "isDefault": true
      },
      {
        "status": 400,
        "body": { "error": "Invalid data" },
        "match": {
          "query": { "force_error": "1" }
        }
      }
    ],
    "delayMs": 100,
    "enabled": true
  }'
```

### 3. Usar el Mock Runtime

```bash
# Request normal (retorna 201 con templating)
curl -X POST http://localhost:3000/mock/my-test-api/users/123 \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com"}'

# Response:
{
  "id": "123",
  "name": "John Doe",
  "email": "john@example.com",
  "createdAt": "2025-01-12T00:00:00Z"
}

# Request con error forzado (retorna 400)
curl -X POST "http://localhost:3000/mock/my-test-api/users/123?force_error=1" \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@example.com"}'

# Response:
{
  "error": "Invalid data"
}

# Request con validación fallida (retorna 400)
curl -X POST http://localhost:3000/mock/my-test-api/users/123 \
  -H "Content-Type: application/json" \
  -d '{"name":"Jo","email":"not-an-email"}'

# Response:
{
  "message": "Request validation failed",
  "errors": [
    "body/name: must NOT have fewer than 3 characters",
    "body/email: must match format \"email\""
  ]
}
```

### 4. Importar desde OpenAPI

```bash
# Descargar spec de ejemplo
curl https://petstore3.swagger.io/api/v3/openapi.json -o petstore.json

# Importar
curl -X POST http://localhost:3000/api-definitions/import/openapi \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d @petstore.json

# La API se creará automáticamente con todos los endpoints
```

### 5. Crear API Keys para Acceso Programático

#### Desde la UI
1. Login → Click en "Perfil"
2. Sección "API Keys"
3. Ingresar nombre → "Crear API Key"
4. **IMPORTANTE**: Copiar la clave mostrada (solo se muestra una vez)

#### Desde la API

```bash
curl -X POST http://localhost:3000/auth/api-keys \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production Key",
    "scope": ["*"]
  }'

# Response:
{
  "apiKey": {...},
  "rawKey": "mas_a1b2c3d4e5f6..."  # ⚠️ Guardar esta clave
}

# Usar la API Key
curl http://localhost:3000/mock/my-test-api/users/123 \
  -H "X-API-Key: mas_a1b2c3d4e5f6..."
```

### 6. Ver Analytics

#### Desde la UI
1. Login → Click en "Analytics"
2. Filtrar por API o período
3. Ver gráficas y métricas

#### Desde la API

```bash
# Stats generales
curl "http://localhost:3000/analytics/stats" \
  -H "Authorization: Bearer $TOKEN"

# Stats de API específica
curl "http://localhost:3000/analytics/stats?apiSlug=my-test-api" \
  -H "Authorization: Bearer $TOKEN"

# Stats por rango de fechas
curl "http://localhost:3000/analytics/stats?from=2025-01-01&to=2025-01-31" \
  -H "Authorization: Bearer $TOKEN"

# Response:
{
  "totalRequests": 1234,
  "avgDurationMs": 45,
  "successRate": 95,
  "errorRate": 5,
  "topApis": [...],
  "topEndpoints": [...],
  "requestsByDay": [...]
}
```

---

## 📊 Ejemplos de Uso Completos

### Ejemplo 1: API de Usuarios con Todo Incluido

```bash
# 1. Crear API
API_ID=$(curl -X POST http://localhost:3000/api-definitions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Users API",
    "slug": "users-api",
    "description": "Complete users API with validation"
  }' | jq -r '.id')

# 2. Crear endpoint GET /users (lista)
curl -X POST "http://localhost:3000/api-definitions/$API_ID/endpoints" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "method": "GET",
    "path": "/users",
    "responses": [{
      "status": 200,
      "body": [
        {"id": 1, "name": "Alice", "email": "alice@example.com"},
        {"id": 2, "name": "Bob", "email": "bob@example.com"}
      ],
      "isDefault": true
    }]
  }'

# 3. Crear endpoint GET /users/:id (detalle con templating)
curl -X POST "http://localhost:3000/api-definitions/$API_ID/endpoints" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "method": "GET",
    "path": "/users/:id",
    "responses": [
      {
        "status": 200,
        "body": {
          "id": "{{params.id}}",
          "name": "User {{params.id}}",
          "email": "user{{params.id}}@example.com"
        },
        "isDefault": true
      },
      {
        "status": 404,
        "body": {"error": "User not found"},
        "match": {"query": {"not_found": "1"}}
      }
    ]
  }'

# 4. Crear endpoint POST /users (con validación)
curl -X POST "http://localhost:3000/api-definitions/$API_ID/endpoints" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "method": "POST",
    "path": "/users",
    "requestSchema": {
      "body": {
        "type": "object",
        "properties": {
          "name": {"type": "string", "minLength": 2},
          "email": {"type": "string", "format": "email"}
        },
        "required": ["name", "email"]
      }
    },
    "responses": [{
      "status": 201,
      "body": {
        "id": 999,
        "name": "{{body.name}}",
        "email": "{{body.email}}",
        "createdAt": "2025-01-12T00:00:00Z"
      },
      "isDefault": true
    }]
  }'

# 5. Probar los endpoints
# Lista
curl http://localhost:3000/mock/users-api/users

# Detalle
curl http://localhost:3000/mock/users-api/users/42

# Not found
curl "http://localhost:3000/mock/users-api/users/42?not_found=1"

# Crear (válido)
curl -X POST http://localhost:3000/mock/users-api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Charlie","email":"charlie@example.com"}'

# Crear (inválido, falla validación)
curl -X POST http://localhost:3000/mock/users-api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"C","email":"invalid"}'
```

---

## 🎨 Características Avanzadas

### Conditional Responses

```json
{
  "responses": [
    {
      "status": 200,
      "body": {"mode": "normal"},
      "isDefault": true
    },
    {
      "status": 500,
      "body": {"error": "Server error"},
      "match": {
        "query": {"error": "1"},
        "headers": {"x-force-error": "true"}
      }
    }
  ]
}
```

### Dynamic Templating

Variables disponibles:
- `{{params.xxx}}` - Path parameters
- `{{query.xxx}}` - Query string
- `{{body.xxx}}` - Request body
- `{{headers.xxx}}` - Headers
- `{{{json obj}}}` - JSON serialization

### Request Validation

Soporta JSON Schema completo:
- Types: string, number, integer, boolean, object, array
- Formats: email, uri, date-time, uuid, etc.
- Validations: minLength, maxLength, minimum, maximum, pattern, etc.
- Required fields
- Nested objects

---

## 🔒 Seguridad

### Headers de Seguridad (Helmet)
Automáticamente aplicados:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `X-XSS-Protection: 1; mode=block`
- Y más...

### Rate Limiting
- Límite: 100 requests/minuto por IP
- Configurable en `app.module.ts`

### CORS
Configurable via `CORS_ORIGIN` en `.env`

---

## 📈 Monitoreo

### Logs del Backend

```bash
docker compose logs -f api
```

### Limpiar Logs Antiguos

```bash
# Desde la UI: Click en Analytics → botón "Limpiar logs"

# Desde API
curl "http://localhost:3000/analytics/clean?days=30" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🐛 Troubleshooting

### Backend no inicia

```bash
# Verificar logs
docker compose logs api

# Verificar conexión a DB
docker compose exec db psql -U mockapi -d mockapi -c "SELECT 1"

# Verificar conexión a Redis
docker compose exec redis redis-cli ping
```

### Frontend no conecta con Backend

```bash
# Verificar .env del frontend
cat frontend/.env
# Debe tener: VITE_API_BASE_URL=http://localhost:3000

# Verificar CORS en backend
# Debe permitir origen del frontend
```

### "Invalid credentials" al hacer login

```bash
# Recrear usuario
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test1234"}'
```

---

## 📚 Recursos

- **FEATURES_ADVANCED.md** - Guía completa de funcionalidades
- **IMPLEMENTATION_SUMMARY.md** - Resumen técnico
- **README.md** - Documentación general
- **Swagger/OpenAPI**: (Agregar en futuro)

---

## 🎉 ¡Listo!

Tu instancia de Mock-API-Studio está completamente funcional con:

✅ Autenticación JWT  
✅ API Keys  
✅ Validación JSON Schema  
✅ Templating Handlebars  
✅ OpenAPI Import  
✅ Analytics Dashboard  
✅ Security (Helmet + Rate Limiting)  

**¡Disfruta creando tus mocks!** 🚀

