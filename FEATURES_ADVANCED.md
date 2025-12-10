# Mock-API-Studio - Funcionalidades Avanzadas

## ✅ Implementadas (Backend)

### 1. 🔐 Autenticación (JWT + API Keys)

**Ubicación**: `backend/src/auth/`

#### Características:
- **JWT Authentication** para usuarios del sistema
- **API Keys** para acceso programático
- **Guards** de NestJS para proteger rutas
- **Roles** de usuario (user, admin)

#### Modelos de Base de Datos:
```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String   // bcrypt hash
  name      String?
  role      String   @default("user")
  isActive  Boolean  @default(true)
  apiKeys   ApiKey[]
}

model ApiKey {
  id          String   @id @default(uuid())
  key         String   @unique
  name        String
  userId      String
  scope       String[]
  isActive    Boolean  @default(true)
  lastUsedAt  DateTime?
  expiresAt   DateTime?
}
```

#### Endpoints:
- `POST /auth/register` - Registrar usuario
- `POST /auth/login` - Login (retorna JWT)
- `GET /auth/me` - Perfil del usuario autenticado
- `POST /auth/api-keys` - Crear API key
- `GET /auth/api-keys` - Listar API keys
- `DELETE /auth/api-keys/:id` - Revocar API key

#### Uso:
```bash
# Registro
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"secret123","name":"Admin"}'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"secret123"}'

# Crear API Key
curl -X POST http://localhost:3000/auth/api-keys \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"My API Key","scope":["*"]}'
```

---

### 2. ✅ Validación con JSON Schema

**Ubicación**: `backend/src/shared/services/validation.service.ts`

#### Características:
- Validación de **query params**, **body**, **headers** usando **ajv**
- Integración automática en el mock runtime
- Retorna errores claros y específicos (400 Bad Request)

#### Ejemplo de requestSchema:
```json
{
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
```

#### Comportamiento:
- Si un endpoint tiene `requestSchema` definido, se valida automáticamente
- Si falla la validación, retorna `400` con detalles del error
- Si no hay `requestSchema`, no se valida (mock flexible)

---

### 3. 🎨 Templating con Handlebars

**Ubicación**: `backend/src/shared/utils/template-engine.ts`

#### Características:
- **Handlebars** para generar responses dinámicos
- Variables disponibles: `{{params.xxx}}`, `{{query.xxx}}`, `{{body.xxx}}`, `{{headers.xxx}}`
- Helper `{{{json body}}}` para serializar objetos

#### Ejemplo de response con templates:
```json
{
  "status": 200,
  "headers": { "Content-Type": "application/json" },
  "body": {
    "userId": "{{params.id}}",
    "userName": "{{query.name}}",
    "message": "Hello {{body.firstName}}!",
    "requestData": "{{{json body}}}"
  },
  "isDefault": true
}
```

#### Request:
```
GET /mock/myapi/users/123?name=John
Body: {"firstName": "Jane"}
```

#### Response Renderizada:
```json
{
  "userId": "123",
  "userName": "John",
  "message": "Hello Jane!",
  "requestData": "{\"firstName\":\"Jane\"}"
}
```

---

### 4. 📄 OpenAPI Import

**Ubicación**: `backend/src/openapi/`

#### Características:
- Parser de **OpenAPI 3.0** y **Swagger 2.0**
- Conversión automática a formato Mock-API-Studio
- Genera requestSchema y responses desde el spec
- Ejemplos automáticos desde schemas

#### Endpoint:
```
POST /api-definitions/import/openapi
Content-Type: application/json

Body: (OpenAPI spec completo)
```

#### Uso:
```bash
# Importar desde archivo OpenAPI
curl -X POST http://localhost:3000/api-definitions/import/openapi \
  -H "Content-Type: application/json" \
  -d @openapi.json
```

#### Mapeo:
- `info.title` → API name
- `info.version` → API version
- `paths` → endpoints
- `parameters` → requestSchema.query
- `requestBody` → requestSchema.body
- `responses` → response array

---

### 5. 📊 Analytics & Métricas

**Ubicación**: `backend/src/analytics/`

#### Características:
- **Tracking automático** de requests al mock runtime
- Almacenamiento en PostgreSQL (`mock_requests` table)
- **Interceptor global** configurable
- Métricas agregadas: total requests, avg duration, success rate, error rate

#### Modelo:
```prisma
model MockRequest {
  id           String   @id @default(uuid())
  apiSlug      String
  endpointId   String?
  method       String
  path         String
  statusCode   Int
  durationMs   Int
  userAgent    String?
  ip           String?
  error        String?
  createdAt    DateTime @default(now())
}
```

#### Endpoints:
- `GET /analytics/stats?from=2025-01-01&to=2025-01-31&apiSlug=myapi`
- `GET /analytics/clean?days=30`

#### Respuesta de /analytics/stats:
```json
{
  "totalRequests": 1234,
  "avgDurationMs": 45,
  "successRate": 95,
  "errorRate": 5,
  "topApis": [
    { "apiSlug": "jsonplaceholder", "count": 500 },
    { "apiSlug": "github", "count": 400 }
  ],
  "topEndpoints": [
    { "method": "GET", "path": "/posts", "count": 200 }
  ],
  "requestsByDay": [
    { "date": "2025-01-10", "count": 100 }
  ]
}
```

#### Activación:
```bash
# .env
ANALYTICS_ENABLED=true
```

#### Limpieza de logs antiguos:
```bash
curl http://localhost:3000/analytics/clean?days=30
```

---

## 🔒 Seguridad

### Implementadas:

1. **Helmet** - Headers de seguridad HTTP
2. **Rate Limiting** - @nestjs/throttler (100 requests / min por default)
3. **CORS** configurable via env var
4. **Password Hashing** - bcrypt con salt rounds
5. **JWT** con expiración (7 días default)
6. **API Keys** hasheadas en DB

### Variables de Entorno:
```env
JWT_SECRET=your-super-secret-jwt-key
CORS_ORIGIN=http://localhost:8080
ANALYTICS_ENABLED=true
```

---

## 🚀 Dependencias Agregadas

### Backend:
```json
{
  "@apidevtools/swagger-parser": "^10.1.0",
  "@nestjs/jwt": "^10.2.0",
  "@nestjs/passport": "^10.0.3",
  "@nestjs/throttler": "^5.1.1",
  "ajv": "^8.12.0",
  "ajv-formats": "^2.1.1",
  "bcrypt": "^5.1.1",
  "handlebars": "^4.7.8",
  "helmet": "^7.1.0",
  "passport": "^0.7.0",
  "passport-jwt": "^4.0.1",
  "redis": "^4.6.12"
}
```

---

## 📋 Migraciones de Base de Datos

### Nueva Migración:
`backend/prisma/migrations/20250112000000_add_auth_and_analytics/migration.sql`

Agrega:
- Tabla `users`
- Tabla `api_keys`
- Tabla `mock_requests`
- Índices para performance

### Aplicar migraciones:
```bash
cd backend
npx prisma migrate deploy
```

---

## 🧪 Testing de Nuevas Features

### 1. Test de Autenticación:
```bash
# Registro
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234","name":"Test User"}'

# Login
TOKEN=$(curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234"}' \
  | jq -r '.token')

# Crear API Key
curl -X POST http://localhost:3000/auth/api-keys \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Key","scope":["*"]}'
```

### 2. Test de Validación:
```bash
# Crear endpoint con validación
curl -X POST http://localhost:3000/api-definitions/{apiId}/endpoints \
  -H "Content-Type: application/json" \
  -d '{
    "method": "POST",
    "path": "/users",
    "requestSchema": {
      "body": {
        "type": "object",
        "properties": {
          "email": {"type": "string", "format": "email"}
        },
        "required": ["email"]
      }
    },
    "responses": [{"status": 201, "body": {"ok": true}, "isDefault": true}]
  }'

# Test con body inválido (retorna 400)
curl -X POST http://localhost:3000/mock/myapi/users \
  -H "Content-Type: application/json" \
  -d '{"email": "not-an-email"}'
```

### 3. Test de Templating:
```bash
# Request con params y query
curl "http://localhost:3000/mock/jsonplaceholder/posts/123?user=john"

# Response con template renderizado
```

### 4. Test de OpenAPI Import:
```bash
# Descargar spec de ejemplo
curl https://petstore3.swagger.io/api/v3/openapi.json -o petstore.json

# Importar
curl -X POST http://localhost:3000/api-definitions/import/openapi \
  -H "Content-Type: application/json" \
  -d @petstore.json
```

### 5. Test de Analytics:
```bash
# Hacer varios requests al mock runtime
for i in {1..10}; do
  curl http://localhost:3000/mock/jsonplaceholder/posts
done

# Ver stats
curl http://localhost:3000/analytics/stats
```

---

## 📝 Próximos Pasos (Frontend)

Pendientes de implementación:
1. **LoginPage** y **AuthContext** en React
2. **Dashboard de Analytics** con gráficas (recharts)
3. **UI de importación OpenAPI**
4. **Gestión de API Keys** en UI
5. **Protección de rutas** con JWT en frontend

---

## 🎯 Resumen de Funcionalidades

| Feature | Status | Descripción |
|---------|--------|-------------|
| ✅ Autenticación JWT | ✅ Backend | Login, registro, guards |
| ✅ API Keys | ✅ Backend | Generación, validación, scope |
| ✅ Validación JSON Schema | ✅ Backend | ajv, requestSchema |
| ✅ Templating Handlebars | ✅ Backend | Dynamic responses |
| ✅ OpenAPI Import | ✅ Backend | Parser de specs |
| ✅ Analytics | ✅ Backend | Tracking, stats, cleanup |
| ✅ Rate Limiting | ✅ Backend | 100 req/min |
| ✅ Helmet | ✅ Backend | Security headers |
| ⏳ Login UI | 🔄 Pendiente | React + AuthContext |
| ⏳ Analytics Dashboard | 🔄 Pendiente | Gráficas con recharts |
| ⏳ OpenAPI Upload UI | 🔄 Pendiente | File upload + preview |

---

## 🔗 Enlaces Útiles

- **Swagger Parser**: https://apitools.dev/swagger-parser/
- **AJV**: https://ajv.js.org/
- **Handlebars**: https://handlebarsjs.com/
- **NestJS Passport**: https://docs.nestjs.com/security/authentication
- **NestJS Throttler**: https://docs.nestjs.com/security/rate-limiting

---

**Autor**: Mock-API-Studio Team  
**Versión**: 2.0.0  
**Fecha**: 2025-01-12

