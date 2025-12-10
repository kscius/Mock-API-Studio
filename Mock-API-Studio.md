Perfecto, este proyecto está muy bueno y da para hacerlo “en serio”, con buenas prácticas desde el día 1. Voy a proponerte una arquitectura completa y luego te dejo un `docker-compose.yml` base y estructura de carpetas para que empieces a codear.

---

## 1. Visión general de Mock-API-Studio

**Objetivo:**
Sistema que permita definir, ejecutar y gestionar APIs mock mediante JSON, con:

* **Backend**: NodeJS + TypeScript (te propongo NestJS o Express bien estructurado).
* **Frontend**: React + Vite + TypeScript.
* **DB**: PostgreSQL (con JSONB para flexibilidad) o MongoDB. Voy a asumir **PostgreSQL**.
* **Cache**: Redis (para respuestas de mocks y para configuración cargada).
* **Infra**: Docker + Docker Compose con 4 servicios:

  * `api` (backend)
  * `web` (frontend)
  * `db` (Postgres)
  * `redis` (Redis)
* Puertos expuestos al host: **solo** `web` y `api`.

---

## 2. Arquitectura por servicios

### 2.1. Backend (NodeJS + TS)

Stack sugerido:

* **Framework**: NestJS (muy bueno para proyectos “serios”: módulos, DI, testing, etc.).
* **ORM**: Prisma (simple, typesafe, soporta JSONB).
* **Validador**: Zod o `class-validator` (Nest).
* **Redis client**: `ioredis` o `redis`.

Capas principales:

1. **Módulo de APIs (Admin)**

   * CRUD de definiciones de APIs.
   * CRUD de endpoints.
   * Import/Export de definiciones en JSON.
   * Semillas de “APIs conocidas” (ej: GitHub-like, Stripe-like, JSONPlaceholder-like).

2. **Módulo de Mock Runtime**

   * Endpoint “catch-all” que resuelve:

     * API mock objetivo (por slug/basePath).
     * Endpoint (method + path + parámetros).
   * Aplica lógica de:

     * Selección de response (status, headers, body).
     * Delay configurado.
     * Posible templating simple (Handlebars / Mustache) a futuro.

3. **Módulo de Cache (Redis)**

   * Cachear en Redis:

     * Definición de API (`api:{slug}`).
     * Endpoints de una API (`api:{slug}:endpoints`).
   * Invalidar cache cuando se edita/crea/elimina algo desde el admin.

4. **Módulo de Seeds**

   * Script que al levantar el servicio:

     * Corre migraciones de Prisma.
     * Inserta APIs de ejemplo si la DB está vacía.

---

### 2.2. Frontend (React + Vite + TS)

Stack sugerido:

* **React + Vite + TypeScript**
* UI: Material UI, Chakra UI o Tailwind + algún headless UI.
* Router: `react-router-dom`.
* State: `React Query` + Zustand/Redux si lo ves necesario.

Pantallas principales:

1. **Dashboard de APIs**

   * Lista de APIs mock.
   * Botón “Crear nueva API”.
   * Acción “Importar JSON” / “Exportar JSON”.
   * Estado: habilitada / deshabilitada.

2. **Detalle de API**

   * Información básica (name, slug, basePath, descripción, tags).
   * Lista de endpoints:

     * Método, path, status por defecto, delay, habilitado.
   * Botón “Nuevo endpoint”.

3. **Editor de endpoint**

   * **Config general**:

     * Método (GET, POST, PUT, PATCH, DELETE, …).
     * Path template (`/users/:id`, `/orders/{orderId}`).
     * Delay (ms).
   * **Request definition**:

     * Query params (JSONSchema-like).
     * Headers esperados.
     * Body (JSONSchema-like).
   * **Responses**:

     * Lista de posibles respuestas:

       * Status code (200, 400, 404, 500…).
       * Headers.
       * Body de ejemplo (JSON).
       * Flag “default”.
   * Botón “Probar” que haga llamada al backend (mock runtime) con un payload de ejemplo.

4. **Vista de APIs predefinidas**

   * Una sección tipo “Playground” donde el usuario puede activar una API de demo y ver cómo funcionan los endpoints.

---

### 2.3. Base de datos (PostgreSQL)

Tablas sugeridas (modelo simplificado):

```text
api_definitions
  - id (uuid, pk)
  - name (string)
  - slug (string, único)
  - version (string)
  - base_path (string)        -- ej: /github, /stripe
  - description (text)
  - is_active (boolean)
  - tags (text[])
  - created_at, updated_at

api_endpoints
  - id (uuid, pk)
  - api_id (fk -> api_definitions)
  - method (string)           -- 'GET' | 'POST' | ...
  - path (string)             -- '/users/:id'
  - summary (string)
  - request_schema (jsonb)    -- JSONSchema-like
  - responses (jsonb)         -- lista de responses posible
  - delay_ms (int)
  - enabled (boolean)
  - created_at, updated_at
```

Ejemplo de `responses` (jsonb):

```json
[
  {
    "status": 200,
    "headers": {
      "Content-Type": "application/json"
    },
    "body": {
      "id": "{{request.params.id}}",
      "name": "John Doe"
    },
    "isDefault": true
  },
  {
    "status": 404,
    "body": {
      "error": "User not found"
    }
  }
]
```

Luego puedes ir ampliando con cosas como:

* Prioridades.
* Condiciones (ej: “si query param `?error=1` usa el response 500”).
* Scripts (si te animas a sandboxear JS).

---

### 2.4. Redis (cache)

Casos de uso:

* Cachear definiciones para que el runtime no pegue a DB en cada request.
* Cachear respuestas mock si tienes endpoints pesados en lógica.
* Manejar “escenarios” (ej: un mock de carrito de compras con estado de sesión).

Claves ejemplo:

* `mock:api:{slug}` → JSON con definición de API.
* `mock:api:{slug}:endpoints` → array de endpoints.

---

## 3. Flujo de ejecución del Mock Runtime

1. Request llega a `api` (backend) en `/mock/:apiSlug/*`.
2. Middleware:

   * Busca `apiSlug`.
   * Carga definición de API desde Redis o DB.
3. Resolver de endpoint:

   * Parsea `req.method` + `req.path` y matchea contra `path` template.
   * Si no encuentra endpoint → 404 configurable.
4. Resolver de response:

   * Por defecto el response `isDefault === true`.
   * (Opcional) lee headers/query/body para seleccionar otra respuesta.
5. Delay:

   * Si `delay_ms` > 0, aplica `setTimeout` antes de enviar.
6. Responde con status, headers y body según definición.

---

## 4. Ejemplos de APIs predefinidas

Puedes incluir en el seed:

* **JSONPlaceholder-like**:

  * `/posts`, `/posts/:id`, `/comments`, etc.
* **GitHub-like**:

  * `/users/:username/repos`, `/repos/:owner/:repo/issues`, etc.
* **Stripe-like (simplificado)**:

  * `/customers`, `/charges`, etc.

Eso ayuda a que el usuario entienda el modelo y tenga algo listo para jugar.

---

## 5. Docker Compose y estructura de carpetas

Te dejo una propuesta de estructura de repo monorepo:

```text
mock-api-studio/
  backend/
    src/
      main.ts
      app.module.ts
      api/
      mock-runtime/
      common/
      ...
    prisma/
      schema.prisma
      seed.ts
    package.json
    tsconfig.json
    Dockerfile
  frontend/
    src/
      main.tsx
      App.tsx
      pages/
      components/
      api/
    index.html
    package.json
    tsconfig.json
    vite.config.ts
    Dockerfile
  docker-compose.yml
  README.md
```

### 5.1. `docker-compose.yml` base

```yaml
version: "3.8"

services:
  db:
    image: postgres:16-alpine
    container_name: mockapi-db
    environment:
      POSTGRES_USER: mockapi
      POSTGRES_PASSWORD: mockapi
      POSTGRES_DB: mockapi
    volumes:
      - db_data:/var/lib/postgresql/data
    networks:
      - mockapi-network

  redis:
    image: redis:7-alpine
    container_name: mockapi-redis
    networks:
      - mockapi-network

  api:
    build: ./backend
    container_name: mockapi-backend
    depends_on:
      - db
      - redis
    env_file:
      - ./backend/.env
    environment:
      DATABASE_URL: postgres://mockapi:mockapi@db:5432/mockapi
      REDIS_HOST: redis
      REDIS_PORT: 6379
      PORT: 3000
    ports:
      - "3000:3000"   # expuesto
    networks:
      - mockapi-network

  web:
    build: ./frontend
    container_name: mockapi-frontend
    depends_on:
      - api
    env_file:
      - ./frontend/.env
    environment:
      VITE_API_BASE_URL: http://api:3000
    ports:
      - "8080:80"     # expuesto
    networks:
      - mockapi-network

networks:
  mockapi-network:

volumes:
  db_data:
```

### 5.2. `backend/Dockerfile` (ejemplo NestJS)

```Dockerfile
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist
COPY prisma ./prisma

ENV NODE_ENV=production
CMD ["node", "dist/main.js"]
```

### 5.3. `frontend/Dockerfile` (Vite + Nginx)

```Dockerfile
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
```

---

## 6. Siguientes pasos recomendados

1. Inicializa el monorepo y los proyectos:

   * `backend`: NestJS + Prisma + Redis client.
   * `frontend`: Vite + React + TS + tu UI lib favorita.
2. Define el **JSON schema** de API y endpoint (el contrato de import/export).
3. Implementa:

   * CRUD de APIs y endpoints en backend.
   * Listado y editores en frontend.
4. Implementa el **mock runtime** con:

   * Matching de rutas.
   * Selección de response.
   * Delay.
5. Agrega semillas de APIs predefinidas.
6. Pulir DX:

   * Scripts de `npm run dev`, `npm run docker:up`, etc.

---

## Bloque listo para copiar/pegar

Te dejo un bloque con comandos + archivos mínimos para arrancar el repo:

```bash
# 1. Crear monorepo
mkdir mock-api-studio && cd mock-api-studio

# 2. Backend (NestJS)
npm install -g @nestjs/cli
nest new backend
cd backend
npm install --save @nestjs/config @nestjs/axios
npm install --save-dev prisma
npm install @prisma/client
npm install ioredis
npx prisma init
cd ..

# 3. Frontend (Vite + React + TS)
npm create vite@latest frontend -- --template react-ts

# 4. Crear docker-compose.yml en raíz (pega el que te di)
# 5. Crear Dockerfile en backend y frontend (pega los ejemplos)
```

Perfecto, vamos a bajar esto a **estructura concreta de proyecto** para que puedas empezar a codear sin pensarlo demasiado.

Te voy a dar:

1. Estructura de carpetas del monorepo.
2. Backend (NestJS + Prisma + Redis) – módulos y archivos clave.
3. Frontend (React + Vite + TS) – páginas y organización.
4. Docker (Dockerfiles + docker-compose).

Puedes ir creando los archivos tal cual están aquí.

---

## 1. Estructura general del proyecto

```text
mock-api-studio/
  docker-compose.yml
  README.md

  backend/
    Dockerfile
    package.json
    tsconfig.json
    prisma/
      schema.prisma
      seed.ts
    src/
      main.ts
      app.module.ts
      config/
        config.module.ts
        config.service.ts
      common/
        prisma/
          prisma.module.ts
          prisma.service.ts
        redis/
          redis.module.ts
          redis.service.ts
      api-definitions/
        api-definitions.module.ts
        api-definitions.controller.ts
        api-definitions.service.ts
        dto/
          create-api-definition.dto.ts
          update-api-definition.dto.ts
          create-endpoint.dto.ts
          update-endpoint.dto.ts
      mock-runtime/
        mock-runtime.module.ts
        mock-runtime.controller.ts
        mock-runtime.service.ts
      shared/
        types/
          api-definition.ts
        utils/
          path-matcher.ts

  frontend/
    Dockerfile
    nginx.conf
    index.html
    tsconfig.json
    vite.config.ts
    package.json
    src/
      main.tsx
      App.tsx
      router/
        index.tsx
      api/
        client.ts
        api-definitions.ts
      components/
        layout/
          AppLayout.tsx
        api/
          ApiList.tsx
          ApiCard.tsx
          EndpointList.tsx
          EndpointForm.tsx
      pages/
        DashboardPage.tsx
        ApiDetailPage.tsx
        EndpointEditorPage.tsx
        NotFoundPage.tsx
```

---

## 2. Backend – NestJS + Prisma + Redis

### 2.1 `prisma/schema.prisma`

```prisma
// backend/prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model ApiDefinition {
  id          String        @id @default(uuid())
  name        String
  slug        String        @unique
  version     String        @default("1.0.0")
  basePath    String        @default("/")
  description String?
  isActive    Boolean       @default(true)
  tags        String[]
  endpoints   ApiEndpoint[]
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
}

model ApiEndpoint {
  id            String        @id @default(uuid())
  apiId         String
  api           ApiDefinition @relation(fields: [apiId], references: [id], onDelete: Cascade)
  method        String
  path          String
  summary       String?
  requestSchema Json?
  responses     Json          // array de posibles responses
  delayMs       Int           @default(0)
  enabled       Boolean       @default(true)
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
}
```

### 2.2 `src/main.ts`

```ts
// backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*', // puedes afinar esto luego
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Backend running on http://localhost:${port}`);
}
bootstrap();
```

### 2.3 `src/app.module.ts`

```ts
// backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { RedisModule } from './common/redis/redis.module';
import { ApiDefinitionsModule } from './api-definitions/api-definitions.module';
import { MockRuntimeModule } from './mock-runtime/mock-runtime.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    RedisModule,
    ApiDefinitionsModule,
    MockRuntimeModule,
  ],
})
export class AppModule {}
```

### 2.4 Configuración simple

```ts
// backend/src/config/config.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { ConfigService } from './config.service';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
```

```ts
// backend/src/config/config.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class ConfigService {
  constructor(private readonly config: NestConfigService) {}

  get databaseUrl(): string {
    return this.config.get<string>('DATABASE_URL');
  }

  get redisHost(): string {
    return this.config.get<string>('REDIS_HOST', 'redis');
  }

  get redisPort(): number {
    return Number(this.config.get<number>('REDIS_PORT', 6379));
  }
}
```

### 2.5 Prisma module

```ts
// backend/src/common/prisma/prisma.module.ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

```ts
// backend/src/common/prisma/prisma.service.ts
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

### 2.6 Redis module

```ts
// backend/src/common/redis/redis.module.ts
import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';

@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
```

```ts
// backend/src/common/redis/redis.service.ts
import { Injectable } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import { ConfigService } from '../../config/config.service';

@Injectable()
export class RedisService {
  private client: RedisClientType;

  constructor(private readonly config: ConfigService) {
    this.client = createClient({
      socket: {
        host: this.config.redisHost,
        port: this.config.redisPort,
      },
    });
    this.client.connect().catch(console.error);
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number) {
    if (ttlSeconds) {
      await this.client.set(key, value, { EX: ttlSeconds });
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string) {
    await this.client.del(key);
  }
}
```

---

### 2.7 Tipos compartidos

```ts
// backend/src/shared/types/api-definition.ts
export type MockResponse = {
  status: number;
  headers?: Record<string, string>;
  body: any;
  isDefault?: boolean;
};

export interface ApiEndpointDefinition {
  id: string;
  method: string;
  path: string;
  summary?: string;
  requestSchema?: any;
  responses: MockResponse[];
  delayMs?: number;
  enabled: boolean;
}

export interface ApiDefinition {
  id: string;
  name: string;
  slug: string;
  version: string;
  basePath: string;
  description?: string;
  isActive: boolean;
  tags: string[];
  endpoints: ApiEndpointDefinition[];
}
```

---

### 2.8 Utils – matcher de rutas simple

```ts
// backend/src/shared/utils/path-matcher.ts
import { pathToRegexp, Key } from 'path-to-regexp';

export function matchPath(
  endpointPath: string,
  requestPath: string,
): { matched: boolean; params: Record<string, string> } {
  const keys: Key[] = [];
  const regexp = pathToRegexp(endpointPath, keys);
  const match = regexp.exec(requestPath);

  if (!match) return { matched: false, params: {} };

  const params: Record<string, string> = {};
  keys.forEach((key, index) => {
    params[key.name] = match[index + 1];
  });

  return { matched: true, params };
}
```

> Nota: necesitas instalar `path-to-regexp` en el backend.

---

### 2.9 Módulo de definiciones de API (admin)

#### DTOs

```ts
// backend/src/api-definitions/dto/create-api-definition.dto.ts
import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateApiDefinitionDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  version?: string;

  @IsOptional()
  @IsString()
  basePath?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
```

```ts
// backend/src/api-definitions/dto/update-api-definition.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateApiDefinitionDto } from './create-api-definition.dto';

export class UpdateApiDefinitionDto extends PartialType(CreateApiDefinitionDto) {}
```

```ts
// backend/src/api-definitions/dto/create-endpoint.dto.ts
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsArray,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class CreateMockResponseDto {
  @IsInt()
  status: number;

  @IsOptional()
  @IsObject()
  headers?: Record<string, string>;

  @IsOptional()
  body?: any;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class CreateEndpointDto {
  @IsString()
  method: string;

  @IsString()
  path: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  requestSchema?: any;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMockResponseDto)
  responses: CreateMockResponseDto[];

  @IsOptional()
  @IsInt()
  delayMs?: number;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
```

```ts
// backend/src/api-definitions/dto/update-endpoint.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateEndpointDto } from './create-endpoint.dto';

export class UpdateEndpointDto extends PartialType(CreateEndpointDto) {}
```

#### Módulo / Servicio / Controlador

```ts
// backend/src/api-definitions/api-definitions.module.ts
import { Module } from '@nestjs/common';
import { ApiDefinitionsService } from './api-definitions.service';
import { ApiDefinitionsController } from './api-definitions.controller';

@Module({
  providers: [ApiDefinitionsService],
  controllers: [ApiDefinitionsController],
  exports: [ApiDefinitionsService],
})
export class ApiDefinitionsModule {}
```

```ts
// backend/src/api-definitions/api-definitions.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateApiDefinitionDto } from './dto/create-api-definition.dto';
import { UpdateApiDefinitionDto } from './dto/update-api-definition.dto';
import { CreateEndpointDto } from './dto/create-endpoint.dto';
import { UpdateEndpointDto } from './dto/update-endpoint.dto';

@Injectable()
export class ApiDefinitionsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.apiDefinition.findMany({
      include: { endpoints: true },
    });
  }

  findOneBySlug(slug: string) {
    return this.prisma.apiDefinition.findUnique({
      where: { slug },
      include: { endpoints: true },
    });
  }

  async create(dto: CreateApiDefinitionDto) {
    return this.prisma.apiDefinition.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        version: dto.version ?? '1.0.0',
        basePath: dto.basePath ?? '/',
        description: dto.description,
        isActive: dto.isActive ?? true,
        tags: dto.tags ?? [],
      },
    });
  }

  async update(id: string, dto: UpdateApiDefinitionDto) {
    return this.prisma.apiDefinition.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    return this.prisma.apiDefinition.delete({ where: { id } });
  }

  // --- endpoints ---
  async createEndpoint(apiId: string, dto: CreateEndpointDto) {
    return this.prisma.apiEndpoint.create({
      data: {
        apiId,
        method: dto.method,
        path: dto.path,
        summary: dto.summary,
        requestSchema: dto.requestSchema ?? null,
        responses: dto.responses as any,
        delayMs: dto.delayMs ?? 0,
        enabled: dto.enabled ?? true,
      },
    });
  }

  async updateEndpoint(endpointId: string, dto: UpdateEndpointDto) {
    return this.prisma.apiEndpoint.update({
      where: { id: endpointId },
      data: dto,
    });
  }

  async removeEndpoint(endpointId: string) {
    return this.prisma.apiEndpoint.delete({ where: { id: endpointId } });
  }
}
```

```ts
// backend/src/api-definitions/api-definitions.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiDefinitionsService } from './api-definitions.service';
import { CreateApiDefinitionDto } from './dto/create-api-definition.dto';
import { UpdateApiDefinitionDto } from './dto/update-api-definition.dto';
import { CreateEndpointDto } from './dto/create-endpoint.dto';
import { UpdateEndpointDto } from './dto/update-endpoint.dto';

@Controller('admin/apis')
export class ApiDefinitionsController {
  constructor(private readonly service: ApiDefinitionsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Post()
  create(@Body() dto: CreateApiDefinitionDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateApiDefinitionDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  // endpoints
  @Post(':apiId/endpoints')
  createEndpoint(
    @Param('apiId') apiId: string,
    @Body() dto: CreateEndpointDto,
  ) {
    return this.service.createEndpoint(apiId, dto);
  }

  @Patch('endpoints/:endpointId')
  updateEndpoint(
    @Param('endpointId') endpointId: string,
    @Body() dto: UpdateEndpointDto,
  ) {
    return this.service.updateEndpoint(endpointId, dto);
  }

  @Delete('endpoints/:endpointId')
  removeEndpoint(@Param('endpointId') endpointId: string) {
    return this.service.removeEndpoint(endpointId);
  }
}
```

---

### 2.10 Módulo Mock Runtime

```ts
// backend/src/mock-runtime/mock-runtime.module.ts
import { Module } from '@nestjs/common';
import { MockRuntimeController } from './mock-runtime.controller';
import { MockRuntimeService } from './mock-runtime.service';
import { ApiDefinitionsModule } from '../api-definitions/api-definitions.module';
import { RedisModule } from '../common/redis/redis.module';

@Module({
  imports: [ApiDefinitionsModule, RedisModule],
  controllers: [MockRuntimeController],
  providers: [MockRuntimeService],
})
export class MockRuntimeModule {}
```

```ts
// backend/src/mock-runtime/mock-runtime.controller.ts
import {
  All,
  Body,
  Controller,
  Headers,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { MockRuntimeService } from './mock-runtime.service';

@Controller('mock')
export class MockRuntimeController {
  constructor(private readonly service: MockRuntimeService) {}

  @All(':apiSlug/*')
  async handle(
    @Param('apiSlug') apiSlug: string,
    @Req() req: Request,
    @Body() body: any,
    @Query() query: any,
    @Headers() headers: Record<string, string>,
  ) {
    const path = '/' + req.params[0]; // parte después de :apiSlug/
    return this.service.handleRequest({
      apiSlug,
      method: req.method,
      path,
      body,
      query,
      headers,
    });
  }
}
```

```ts
// backend/src/mock-runtime/mock-runtime.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { RedisService } from '../common/redis/redis.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { matchPath } from '../shared/utils/path-matcher';
import { MockResponse } from '../shared/types/api-definition';

interface RuntimeRequest {
  apiSlug: string;
  method: string;
  path: string;
  body: any;
  query: any;
  headers: Record<string, string>;
}

@Injectable()
export class MockRuntimeService {
  constructor(
    private readonly redis: RedisService,
    private readonly prisma: PrismaService,
  ) {}

  private async getApiFromCacheOrDb(apiSlug: string) {
    const cacheKey = `mock:api:${apiSlug}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const api = await this.prisma.apiDefinition.findUnique({
      where: { slug: apiSlug },
      include: { endpoints: true },
    });

    if (!api || !api.isActive) {
      throw new NotFoundException('API not found or inactive');
    }

    await this.redis.set(cacheKey, JSON.stringify(api), 60);
    return api;
  }

  async handleRequest(req: RuntimeRequest) {
    const api = await this.getApiFromCacheOrDb(req.apiSlug);

    const candidates = api.endpoints.filter(
      (e: any) =>
        e.enabled &&
        e.method.toUpperCase() === req.method.toUpperCase(),
    );

    let matchedEndpoint: any = null;
    let params: Record<string, string> = {};

    for (const endpoint of candidates) {
      const { matched, params: p } = matchPath(endpoint.path, req.path);
      if (matched) {
        matchedEndpoint = endpoint;
        params = p;
        break;
      }
    }

    if (!matchedEndpoint) {
      throw new NotFoundException('Endpoint not found');
    }

    const responses: MockResponse[] = matchedEndpoint.responses ?? [];
    let response = responses.find((r) => r.isDefault) ?? responses[0];

    if (!response) {
      throw new NotFoundException('No mock response defined');
    }

    // delay simulado
    if (matchedEndpoint.delayMs && matchedEndpoint.delayMs > 0) {
      await new Promise((resolve) =>
        setTimeout(resolve, matchedEndpoint.delayMs),
      );
    }

    // TODO: templating de body con params/query/body si quieres
    return {
      statusCode: response.status,
      headers: response.headers ?? { 'Content-Type': 'application/json' },
      body: response.body,
    };
  }
}
```

> Nota: en Nest puedes devolver un objeto y usar interceptores para convertir `statusCode`, `headers`, etc. Si prefieres, puedes usar `@Res()` y manejar `res.status(...).set(...).json(...)`.

---

## 3. Frontend – React + Vite + TS

### 3.1 Cliente HTTP

```ts
// frontend/src/api/client.ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
});
```

### 3.2 API client – definiciones

```ts
// frontend/src/api/api-definitions.ts
import { apiClient } from './client';

export interface MockResponse {
  status: number;
  headers?: Record<string, string>;
  body: any;
  isDefault?: boolean;
}

export interface ApiEndpoint {
  id: string;
  method: string;
  path: string;
  summary?: string;
  responses: MockResponse[];
  delayMs?: number;
  enabled: boolean;
}

export interface ApiDefinition {
  id: string;
  name: string;
  slug: string;
  version: string;
  basePath: string;
  description?: string;
  isActive: boolean;
  tags: string[];
  endpoints?: ApiEndpoint[];
}

export const ApiDefinitionsApi = {
  list: async (): Promise<ApiDefinition[]> => {
    const { data } = await apiClient.get('/admin/apis');
    return data;
  },
  create: async (payload: Partial<ApiDefinition>) => {
    const { data } = await apiClient.post('/admin/apis', payload);
    return data;
  },
  update: async (id: string, payload: Partial<ApiDefinition>) => {
    const { data } = await apiClient.patch(`/admin/apis/${id}`, payload);
    return data;
  },
  delete: async (id: string) => {
    await apiClient.delete(`/admin/apis/${id}`);
  },
  createEndpoint: async (apiId: string, payload: Partial<ApiEndpoint>) => {
    const { data } = await apiClient.post(
      `/admin/apis/${apiId}/endpoints`,
      payload,
    );
    return data;
  },
  updateEndpoint: async (
    endpointId: string,
    payload: Partial<ApiEndpoint>,
  ) => {
    const { data } = await apiClient.patch(
      `/admin/apis/endpoints/${endpointId}`,
      payload,
    );
    return data;
  },
  deleteEndpoint: async (endpointId: string) => {
    await apiClient.delete(`/admin/apis/endpoints/${endpointId}`);
  },
};
```

### 3.3 Router

```tsx
// frontend/src/router/index.tsx
import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { DashboardPage } from '../pages/DashboardPage';
import { ApiDetailPage } from '../pages/ApiDetailPage';
import { EndpointEditorPage } from '../pages/EndpointEditorPage';
import { NotFoundPage } from '../pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'apis/:apiId', element: <ApiDetailPage /> },
      { path: 'apis/:apiId/endpoints/:endpointId', element: <EndpointEditorPage /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
```

### 3.4 `main.tsx` y `App.tsx`

```tsx
// frontend/src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
```

```tsx
// frontend/src/components/layout/AppLayout.tsx
import { Outlet, Link } from 'react-router-dom';

export const AppLayout = () => {
  return (
    <div className="app">
      <header className="app-header">
        <Link to="/">Mock API Studio</Link>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
};
```

### 3.5 Página dashboard

```tsx
// frontend/src/pages/DashboardPage.tsx
import { useEffect, useState } from 'react';
import { ApiDefinitionsApi, ApiDefinition } from '../api/api-definitions';
import { Link } from 'react-router-dom';

export const DashboardPage = () => {
  const [apis, setApis] = useState<ApiDefinition[]>([]);

  useEffect(() => {
    ApiDefinitionsApi.list().then(setApis);
  }, []);

  return (
    <div>
      <h1>APIs Mock</h1>
      <button
        onClick={() => {
          const name = prompt('Nombre de la nueva API');
          const slug = prompt('Slug (ej: github)');
          if (!name || !slug) return;
          ApiDefinitionsApi.create({ name, slug }).then((api) =>
            setApis((prev) => [...prev, api]),
          );
        }}
      >
        Crear nueva API
      </button>

      <ul>
        {apis.map((api) => (
          <li key={api.id}>
            <Link to={`/apis/${api.id}`}>{api.name}</Link> ({api.slug})
          </li>
        ))}
      </ul>
    </div>
  );
};
```

> Las demás páginas (`ApiDetailPage`, `EndpointEditorPage`) pueden ir mostrando y editando los JSON de endpoints con un editor simple de texto al inicio, luego puedes mejorar el UI.

---

## 4. Docker – Compose + Dockerfiles

### 4.1 `docker-compose.yml` (raíz)

```yaml
version: "3.8"

services:
  db:
    image: postgres:16-alpine
    container_name: mockapi-db
    environment:
      POSTGRES_USER: mockapi
      POSTGRES_PASSWORD: mockapi
      POSTGRES_DB: mockapi
    volumes:
      - db_data:/var/lib/postgresql/data
    networks:
      - mockapi-network

  redis:
    image: redis:7-alpine
    container_name: mockapi-redis
    networks:
      - mockapi-network

  api:
    build: ./backend
    container_name: mockapi-backend
    depends_on:
      - db
      - redis
    env_file:
      - ./backend/.env
    environment:
      DATABASE_URL: postgres://mockapi:mockapi@db:5432/mockapi
      REDIS_HOST: redis
      REDIS_PORT: 6379
      PORT: 3000
    ports:
      - "3000:3000"
    networks:
      - mockapi-network

  web:
    build: ./frontend
    container_name: mockapi-frontend
    depends_on:
      - api
    env_file:
      - ./frontend/.env
    environment:
      VITE_API_BASE_URL: http://api:3000
    ports:
      - "8080:80"
    networks:
      - mockapi-network

networks:
  mockapi-network:

volumes:
  db_data:
```

### 4.2 `backend/Dockerfile`

```Dockerfile
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist
COPY prisma ./prisma

ENV NODE_ENV=production
ENV PORT=3000

CMD ["node", "dist/main.js"]
```

### 4.3 `frontend/Dockerfile`

```Dockerfile
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
```

### 4.4 `frontend/nginx.conf`

```nginx
server {
  listen 80;
  server_name _;

  root /usr/share/nginx/html;
  index index.html;

  location / {
    try_files $uri /index.html;
  }
}
```

---

## 5. Bloque listo para copiar/pegar (bootstrap básico)

Este bloque te da los comandos base para crear el proyecto y dejar todo más o menos alineado:

```bash
# Crear monorepo
mkdir mock-api-studio && cd mock-api-studio

# Backend NestJS
npm install -g @nestjs/cli
nest new backend
cd backend
npm install @prisma/client prisma redis path-to-regexp @nestjs/config
npx prisma init
cd ..

# Frontend Vite + React + TS
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install axios react-router-dom
cd ..

# Crear docker-compose.yml en raíz (pega el contenido de arriba)
# Crear Dockerfile en backend y frontend (contenidos de arriba)
# Reemplazar/crear los archivos de backend/src y frontend/src según lo que te pasé.

# Levantar todo
docker compose up --build
```

Con esto tienes **toda la estructura**: backend modularizado, frontend con routing básico, DB + Redis y Docker Compose amarrando todo.


Buenísimo, vamos a dejar **cerrado** el formato JSON oficial y el seed de Prisma con APIs de ejemplo.

Te doy:

1. **Especificación del formato JSON** de import/export.
2. **Ejemplo completo JSONPlaceholder**.
3. **Ejemplo completo GitHub-like**.
4. **Seed de Prisma (`prisma/seed.ts`)** que lee esos JSON y los mete a la DB.
5. Ajuste pequeño al `schema.prisma`.

---

## 1. Formato oficial de JSON para una API mock

Archivo típico: `backend/prisma/seeds/jsonplaceholder.api.json`
(1 archivo = 1 API mock)

```jsonc
{
  "type": "mock-api-definition",
  "schemaVersion": "1.0.0",

  "api": {
    "name": "JSONPlaceholder",
    "slug": "jsonplaceholder",
    "version": "1.0.0",
    "basePath": "/jsonplaceholder",
    "description": "Mock de la API pública JSONPlaceholder para pruebas.",
    "isActive": true,
    "tags": ["example", "jsonplaceholder"]
  },

  "endpoints": [
    {
      "method": "GET",
      "path": "/posts",
      "summary": "Lista todos los posts",
      "requestSchema": {
        "query": {
          "type": "object",
          "properties": {
            "userId": { "type": "integer" }
          },
          "required": []
        }
      },
      "responses": [
        {
          "status": 200,
          "headers": {
            "Content-Type": "application/json"
          },
          "body": [
            {
              "id": 1,
              "userId": 1,
              "title": "sunt aut facere repellat provident occaecati",
              "body": "Lorem ipsum..."
            }
          ],
          "isDefault": true
        }
      ],
      "delayMs": 0,
      "enabled": true
    }
  ]
}
```

### Campos soportados

* **type**: `"mock-api-definition"`
* **schemaVersion**: versión del formato de archivo.
* **api**:

  * `name`: nombre legible.
  * `slug`: identificador único (mapea a `ApiDefinition.slug`).
  * `version`: versión de la API.
  * `basePath`: prefijo raíz (ej: `/jsonplaceholder`, `/github`).
  * `description`: texto.
  * `isActive`: boolean.
  * `tags`: array de strings.
* **endpoints[]**:

  * `method`: `"GET" | "POST" | ..."`
  * `path`: ruta relativa al `basePath` (ej: `/posts/:id`).
  * `summary`: descripción corta.
  * `requestSchema`: objeto libre (lo guardamos en `requestSchema` tal cual).

    * Puedes usar JSON Schema, o tu propio formato (query/body/headers).
  * `responses[]`:

    * `status`: código HTTP.
    * `headers`: mapa de headers.
    * `body`: cualquier JSON.
    * `isDefault`: si es la respuesta por defecto.
  * `delayMs`: retraso en ms.
  * `enabled`: boolean.

> Cuando importes, simplemente copias estos campos a las columnas de Prisma.

---

## 2. Ajuste a `schema.prisma`

Añadimos un índice único por `(apiId, method, path)` para poder hacer upsert por endpoint:

```prisma
model ApiEndpoint {
  id            String        @id @default(uuid())
  apiId         String
  api           ApiDefinition @relation(fields: [apiId], references: [id], onDelete: Cascade)
  method        String
  path          String
  summary       String?
  requestSchema Json?
  responses     Json
  delayMs       Int           @default(0)
  enabled       Boolean       @default(true)
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  @@unique([apiId, method, path])
}
```

---

## 3. Ejemplo JSON – JSONPlaceholder

Guarda esto en `backend/prisma/seeds/jsonplaceholder.api.json`:

```jsonc
{
  "type": "mock-api-definition",
  "schemaVersion": "1.0.0",
  "api": {
    "name": "JSONPlaceholder",
    "slug": "jsonplaceholder",
    "version": "1.0.0",
    "basePath": "/jsonplaceholder",
    "description": "Mock básico de JSONPlaceholder con algunos endpoints comunes.",
    "isActive": true,
    "tags": ["example", "jsonplaceholder"]
  },
  "endpoints": [
    {
      "method": "GET",
      "path": "/posts",
      "summary": "Lista todos los posts",
      "requestSchema": {
        "query": {
          "type": "object",
          "properties": {
            "userId": { "type": "integer" }
          },
          "required": []
        }
      },
      "responses": [
        {
          "status": 200,
          "headers": { "Content-Type": "application/json" },
          "body": [
            {
              "userId": 1,
              "id": 1,
              "title": "sunt aut facere repellat provident occaecati",
              "body": "Lorem ipsum dolor sit amet..."
            },
            {
              "userId": 1,
              "id": 2,
              "title": "qui est esse",
              "body": "Another post..."
            }
          ],
          "isDefault": true
        }
      ],
      "delayMs": 0,
      "enabled": true
    },
    {
      "method": "GET",
      "path": "/posts/:id",
      "summary": "Obtiene un post por id",
      "requestSchema": {
        "params": {
          "type": "object",
          "properties": {
            "id": { "type": "integer" }
          },
          "required": ["id"]
        }
      },
      "responses": [
        {
          "status": 200,
          "headers": { "Content-Type": "application/json" },
          "body": {
            "userId": 1,
            "id": "{{params.id}}",
            "title": "Post {{params.id}}",
            "body": "Contenido del post {{params.id}}"
          },
          "isDefault": true
        },
        {
          "status": 404,
          "headers": { "Content-Type": "application/json" },
          "body": { "error": "Post not found" },
          "isDefault": false
        }
      ],
      "delayMs": 100,
      "enabled": true
    }
  ]
}
```

> Los `{{params.id}}` son placeholders para un templating futuro; por ahora se pueden ignorar o reemplazar a mano en el runtime más adelante.

---

## 4. Ejemplo JSON – GitHub-like

Guarda esto en `backend/prisma/seeds/github.api.json`:

```jsonc
{
  "type": "mock-api-definition",
  "schemaVersion": "1.0.0",
  "api": {
    "name": "GitHub Mock",
    "slug": "github",
    "version": "1.0.0",
    "basePath": "/github",
    "description": "Mock simplificado de la API de GitHub.",
    "isActive": true,
    "tags": ["example", "github"]
  },
  "endpoints": [
    {
      "method": "GET",
      "path": "/users/:username",
      "summary": "Obtiene información de usuario",
      "requestSchema": {
        "params": {
          "type": "object",
          "properties": {
            "username": { "type": "string" }
          },
          "required": ["username"]
        }
      },
      "responses": [
        {
          "status": 200,
          "headers": { "Content-Type": "application/json" },
          "body": {
            "login": "{{params.username}}",
            "id": 1,
            "avatar_url": "https://avatars.githubusercontent.com/u/1?v=4",
            "html_url": "https://github.com/{{params.username}}",
            "name": "Mock User {{params.username}}",
            "company": "Mock Corp",
            "blog": "https://mock-api-studio.dev",
            "location": "Internet",
            "bio": "This is a mocked GitHub user.",
            "public_repos": 10,
            "followers": 5,
            "following": 2
          },
          "isDefault": true
        },
        {
          "status": 404,
          "headers": { "Content-Type": "application/json" },
          "body": { "message": "Not Found" }
        }
      ],
      "delayMs": 50,
      "enabled": true
    },
    {
      "method": "GET",
      "path": "/users/:username/repos",
      "summary": "Lista repos de un usuario",
      "requestSchema": {
        "params": {
          "type": "object",
          "properties": {
            "username": { "type": "string" }
          },
          "required": ["username"]
        }
      },
      "responses": [
        {
          "status": 200,
          "headers": { "Content-Type": "application/json" },
          "body": [
            {
              "id": 1,
              "name": "mock-api-studio",
              "full_name": "{{params.username}}/mock-api-studio",
              "private": false,
              "html_url": "https://github.com/{{params.username}}/mock-api-studio",
              "description": "An awesome mock API studio.",
              "fork": false,
              "stargazers_count": 42,
              "watchers_count": 42,
              "language": "TypeScript"
            },
            {
              "id": 2,
              "name": "awesome-project",
              "full_name": "{{params.username}}/awesome-project",
              "private": false,
              "html_url": "https://github.com/{{params.username}}/awesome-project",
              "description": "Another cool mocked repository.",
              "fork": false,
              "stargazers_count": 7,
              "watchers_count": 7,
              "language": "JavaScript"
            }
          ],
          "isDefault": true
        }
      ],
      "delayMs": 150,
      "enabled": true
    }
  ]
}
```

---

## 5. Seed de Prisma: `prisma/seed.ts`

Este script:

* Lee todos los `.api.json` en `prisma/seeds/`.
* Hace **upsert** de la API por `slug`.
* Hace **upsert** de endpoints por `(apiId, method, path)`.

### 5.1 Estructura de carpetas

```text
backend/
  prisma/
    schema.prisma
    seed.ts
    seeds/
      jsonplaceholder.api.json
      github.api.json
```

### 5.2 `backend/prisma/seed.ts`

```ts
// backend/prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

type SeedMockResponse = {
  status: number;
  headers?: Record<string, string>;
  body: any;
  isDefault?: boolean;
};

type SeedEndpoint = {
  method: string;
  path: string;
  summary?: string;
  requestSchema?: any;
  responses: SeedMockResponse[];
  delayMs?: number;
  enabled?: boolean;
};

type SeedApiFile = {
  type: 'mock-api-definition';
  schemaVersion: string;
  api: {
    name: string;
    slug: string;
    version?: string;
    basePath?: string;
    description?: string;
    isActive?: boolean;
    tags?: string[];
  };
  endpoints: SeedEndpoint[];
};

async function seedFromFile(filePath: string) {
  console.log(`📦 Seeding file: ${path.basename(filePath)}`);
  const raw = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(raw) as SeedApiFile;

  if (data.type !== 'mock-api-definition') {
    console.warn(`Skipping ${filePath} (type != mock-api-definition)`);
    return;
  }

  const apiData = data.api;

  // upsert API por slug
  const api = await prisma.apiDefinition.upsert({
    where: { slug: apiData.slug },
    update: {
      name: apiData.name,
      version: apiData.version ?? '1.0.0',
      basePath: apiData.basePath ?? '/',
      description: apiData.description,
      isActive: apiData.isActive ?? true,
      tags: apiData.tags ?? [],
    },
    create: {
      name: apiData.name,
      slug: apiData.slug,
      version: apiData.version ?? '1.0.0',
      basePath: apiData.basePath ?? '/',
      description: apiData.description,
      isActive: apiData.isActive ?? true,
      tags: apiData.tags ?? [],
    },
  });

  console.log(`  ➜ API: ${api.name} (${api.slug})`);

  for (const endpoint of data.endpoints) {
    const ep = await prisma.apiEndpoint.upsert({
      where: {
        apiId_method_path: {
          apiId: api.id,
          method: endpoint.method.toUpperCase(),
          path: endpoint.path,
        },
      },
      update: {
        summary: endpoint.summary,
        requestSchema: endpoint.requestSchema ?? undefined,
        responses: endpoint.responses as any,
        delayMs: endpoint.delayMs ?? 0,
        enabled: endpoint.enabled ?? true,
      },
      create: {
        apiId: api.id,
        method: endpoint.method.toUpperCase(),
        path: endpoint.path,
        summary: endpoint.summary,
        requestSchema: endpoint.requestSchema ?? null,
        responses: endpoint.responses as any,
        delayMs: endpoint.delayMs ?? 0,
        enabled: endpoint.enabled ?? true,
      },
    });

    console.log(`    - Endpoint: [${ep.method}] ${ep.path}`);
  }
}

async function main() {
  try {
    const seedsDir = path.join(__dirname, 'seeds');
    const files = fs
      .readdirSync(seedsDir)
      .filter((f) => f.endsWith('.api.json'));

    for (const file of files) {
      const fullPath = path.join(seedsDir, file);
      await seedFromFile(fullPath);
    }

    console.log('✅ Seed completado');
  } catch (err) {
    console.error('❌ Error ejecutando seed', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
```

### 5.3 Configurar el seed en `package.json` del backend

```jsonc
// backend/package.json
{
  "scripts": {
    "build": "nest build",
    "start": "node dist/main.js",
    "start:dev": "nest start --watch",
    "prisma:migrate": "prisma migrate dev",
    "prisma:generate": "prisma generate",
    "prisma:seed": "ts-node prisma/seed.ts"
  },
  "devDependencies": {
    "ts-node": "^10.9.2"
  }
}
```

> Asegúrate de tener `ts-node` instalado:
> `npm install -D ts-node`

Y en `prisma` config (opcional, para usar `npx prisma db seed`):

```jsonc
// backend/package.json
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

Luego:

```bash
cd backend
npx prisma migrate dev
npx prisma db seed
```

Listo: tendrás las APIs `jsonplaceholder` y `github` cargadas en la DB.

---

## 6. Bloque final listo para copiar/pegar

Este bloque es el resumen operativo:

```bash
# 1) Ajustar schema.prisma (añadir @@unique a ApiEndpoint)
# (Pega el bloque modificado de ApiEndpoint con @@unique([apiId, method, path]))

# 2) Crear carpeta de seeds
mkdir -p backend/prisma/seeds

# 3) Crear archivos de ejemplos
# backend/prisma/seeds/jsonplaceholder.api.json
# backend/prisma/seeds/github.api.json
# (Pega los JSON que te pasé)

# 4) Crear seed.ts
# backend/prisma/seed.ts
# (Pega el contenido del seed)

# 5) Instalar ts-node y configurar scripts
cd backend
npm install -D ts-node
# Ajusta package.json con "prisma:seed" y "prisma": { "seed": "ts-node prisma/seed.ts" }

# 6) Ejecutar migraciones y seed
npx prisma migrate dev
npx prisma db seed
```

Perfecto, vamos a cerrar el **import/export** en el backend usando el mismo formato JSON que definimos para los seeds.

Voy a darte código listo para pegar en:

* Nuevos **tipos compartidos** del formato de import/export.
* Nuevos métodos en el **service**.
* Nuevos endpoints en el **controller**.

Con esto ya puedes importar/exportar APIs desde el admin web.

---

## 1. Tipos compartidos del JSON de import/export

Crea (o amplía) este archivo:

```ts
// backend/src/shared/types/api-import-export.ts

export type ImportExportMockResponse = {
  status: number;
  headers?: Record<string, string>;
  body: any;
  isDefault?: boolean;
};

export type ImportExportEndpoint = {
  method: string;
  path: string;
  summary?: string;
  requestSchema?: any;
  responses: ImportExportMockResponse[];
  delayMs?: number;
  enabled?: boolean;
};

export type ImportExportApiMeta = {
  name: string;
  slug: string;
  version?: string;
  basePath?: string;
  description?: string;
  isActive?: boolean;
  tags?: string[];
};

export type ImportExportApiFile = {
  type: 'mock-api-definition';
  schemaVersion: string;
  api: ImportExportApiMeta;
  endpoints: ImportExportEndpoint[];
};
```

---

## 2. DTO para importación

```ts
// backend/src/api-definitions/dto/import-api.dto.ts
import { ImportExportApiFile } from '../../shared/types/api-import-export';

// Si quieres validación fuerte puedes usar class-validator,
// pero como el JSON puede ser grande y flexible, lo dejamos tipado por TS.
export class ImportApiDto implements ImportExportApiFile {
  type: 'mock-api-definition';
  schemaVersion: string;
  api: ImportExportApiFile['api'];
  endpoints: ImportExportApiFile['endpoints'];
}
```

---

## 3. Métodos nuevos en `ApiDefinitionsService`

Edita `backend/src/api-definitions/api-definitions.service.ts` y agrega:

```ts
// backend/src/api-definitions/api-definitions.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateApiDefinitionDto } from './dto/create-api-definition.dto';
import { UpdateApiDefinitionDto } from './dto/update-api-definition.dto';
import { CreateEndpointDto } from './dto/create-endpoint.dto';
import { UpdateEndpointDto } from './dto/update-endpoint.dto';
import {
  ImportExportApiFile,
  ImportExportEndpoint,
} from '../shared/types/api-import-export';

@Injectable()
export class ApiDefinitionsService {
  constructor(private readonly prisma: PrismaService) {}

  // ------- CRUD básico existente --------

  findAll() {
    return this.prisma.apiDefinition.findMany({
      include: { endpoints: true },
    });
  }

  findOneBySlug(slug: string) {
    return this.prisma.apiDefinition.findUnique({
      where: { slug },
      include: { endpoints: true },
    });
  }

  findOneById(id: string) {
    return this.prisma.apiDefinition.findUnique({
      where: { id },
      include: { endpoints: true },
    });
  }

  async create(dto: CreateApiDefinitionDto) {
    return this.prisma.apiDefinition.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        version: dto.version ?? '1.0.0',
        basePath: dto.basePath ?? '/',
        description: dto.description,
        isActive: dto.isActive ?? true,
        tags: dto.tags ?? [],
      },
    });
  }

  async update(id: string, dto: UpdateApiDefinitionDto) {
    return this.prisma.apiDefinition.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    return this.prisma.apiDefinition.delete({ where: { id } });
  }

  // --- endpoints ---
  async createEndpoint(apiId: string, dto: CreateEndpointDto) {
    return this.prisma.apiEndpoint.create({
      data: {
        apiId,
        method: dto.method.toUpperCase(),
        path: dto.path,
        summary: dto.summary,
        requestSchema: dto.requestSchema ?? null,
        responses: dto.responses as any,
        delayMs: dto.delayMs ?? 0,
        enabled: dto.enabled ?? true,
      },
    });
  }

  async updateEndpoint(endpointId: string, dto: UpdateEndpointDto) {
    return this.prisma.apiEndpoint.update({
      where: { id: endpointId },
      data: {
        ...dto,
        method: dto.method ? dto.method.toUpperCase() : undefined,
      },
    });
  }

  async removeEndpoint(endpointId: string) {
    return this.prisma.apiEndpoint.delete({ where: { id: endpointId } });
  }

  // ==============================
  //   IMPORT / EXPORT API JSON
  // ==============================

  /**
   * Importa una API y sus endpoints desde un JSON de tipo ImportExportApiFile.
   * - Hace upsert de la API por slug.
   * - Hace upsert de endpoints por (apiId, method, path).
   */
  async importFromJson(file: ImportExportApiFile) {
    if (file.type !== 'mock-api-definition') {
      throw new Error('Invalid file type');
    }

    const apiData = file.api;

    const api = await this.prisma.apiDefinition.upsert({
      where: { slug: apiData.slug },
      update: {
        name: apiData.name,
        version: apiData.version ?? '1.0.0',
        basePath: apiData.basePath ?? '/',
        description: apiData.description,
        isActive: apiData.isActive ?? true,
        tags: apiData.tags ?? [],
      },
      create: {
        name: apiData.name,
        slug: apiData.slug,
        version: apiData.version ?? '1.0.0',
        basePath: apiData.basePath ?? '/',
        description: apiData.description,
        isActive: apiData.isActive ?? true,
        tags: apiData.tags ?? [],
      },
    });

    // upsert de endpoints
    for (const endpoint of file.endpoints) {
      await this.upsertEndpointFromImport(api.id, endpoint);
    }

    return this.findOneById(api.id);
  }

  private async upsertEndpointFromImport(
    apiId: string,
    endpoint: ImportExportEndpoint,
  ) {
    await this.prisma.apiEndpoint.upsert({
      where: {
        apiId_method_path: {
          apiId,
          method: endpoint.method.toUpperCase(),
          path: endpoint.path,
        },
      },
      update: {
        summary: endpoint.summary,
        requestSchema: endpoint.requestSchema ?? undefined,
        responses: endpoint.responses as any,
        delayMs: endpoint.delayMs ?? 0,
        enabled: endpoint.enabled ?? true,
      },
      create: {
        apiId,
        method: endpoint.method.toUpperCase(),
        path: endpoint.path,
        summary: endpoint.summary,
        requestSchema: endpoint.requestSchema ?? null,
        responses: endpoint.responses as any,
        delayMs: endpoint.delayMs ?? 0,
        enabled: endpoint.enabled ?? true,
      },
    });
  }

  /**
   * Exporta una API y sus endpoints al formato ImportExportApiFile.
   */
  async exportToJson(id: string): Promise<ImportExportApiFile> {
    const api = await this.prisma.apiDefinition.findUnique({
      where: { id },
      include: { endpoints: true },
    });

    if (!api) {
      throw new NotFoundException('API not found');
    }

    return {
      type: 'mock-api-definition',
      schemaVersion: '1.0.0',
      api: {
        name: api.name,
        slug: api.slug,
        version: api.version,
        basePath: api.basePath,
        description: api.description ?? undefined,
        isActive: api.isActive,
        tags: api.tags ?? [],
      },
      endpoints: api.endpoints.map((e) => ({
        method: e.method,
        path: e.path,
        summary: e.summary ?? undefined,
        requestSchema: e.requestSchema ?? undefined,
        responses: e.responses as any,
        delayMs: e.delayMs,
        enabled: e.enabled,
      })),
    };
  }
}
```

> Importante: recuerda que en `schema.prisma` añadimos `@@unique([apiId, method, path])` en `ApiEndpoint`.

---

## 4. Nuevos endpoints en `ApiDefinitionsController`

Edita `backend/src/api-definitions/api-definitions.controller.ts`:

```ts
// backend/src/api-definitions/api-definitions.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiDefinitionsService } from './api-definitions.service';
import { CreateApiDefinitionDto } from './dto/create-api-definition.dto';
import { UpdateApiDefinitionDto } from './dto/update-api-definition.dto';
import { CreateEndpointDto } from './dto/create-endpoint.dto';
import { UpdateEndpointDto } from './dto/update-endpoint.dto';
import { ImportApiDto } from './dto/import-api.dto';

@Controller('admin/apis')
export class ApiDefinitionsController {
  constructor(private readonly service: ApiDefinitionsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Post()
  create(@Body() dto: CreateApiDefinitionDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateApiDefinitionDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  // ---------- Endpoints CRUD ----------
  @Post(':apiId/endpoints')
  createEndpoint(
    @Param('apiId') apiId: string,
    @Body() dto: CreateEndpointDto,
  ) {
    return this.service.createEndpoint(apiId, dto);
  }

  @Patch('endpoints/:endpointId')
  updateEndpoint(
    @Param('endpointId') endpointId: string,
    @Body() dto: UpdateEndpointDto,
  ) {
    return this.service.updateEndpoint(endpointId, dto);
  }

  @Delete('endpoints/:endpointId')
  removeEndpoint(@Param('endpointId') endpointId: string) {
    return this.service.removeEndpoint(endpointId);
  }

  // =======================
  //    IMPORT / EXPORT
  // =======================

  /**
   * IMPORT:
   *   POST /admin/apis/import
   * Body: JSON con el formato ImportExportApiFile
   */
  @Post('import')
  import(@Body() dto: ImportApiDto) {
    return this.service.importFromJson(dto);
  }

  /**
   * EXPORT:
   *   GET /admin/apis/:id/export
   * Devuelve un JSON descargable.
   */
  @Get(':id/export')
  async export(@Param('id') id: string, @Res() res: Response) {
    const file = await this.service.exportToJson(id);

    res
      .status(200)
      .setHeader(
        'Content-Type',
        'application/json; charset=utf-8',
      )
      .setHeader(
        'Content-Disposition',
        `attachment; filename="${file.api.slug}.api.json"`,
      )
      .send(JSON.stringify(file, null, 2));
  }
}
```

Con esto ya tienes:

* **Importar** una API mock:
  `POST /admin/apis/import`
  Body: el mismo JSON que usamos para los seeds (por ejemplo `jsonplaceholder.api.json`).

* **Exportar** una API mock:
  `GET /admin/apis/:id/export`
  → Devuelve un archivo `.api.json` listo para guardar o reimportar.

---

## 5. Cómo consumir esto desde el frontend (resumen rápido)

Luego podrás añadir en `frontend/src/api/api-definitions.ts` algo como:

```ts
// Importar
const importApi = async (fileJson: any) => {
  const { data } = await apiClient.post('/admin/apis/import', fileJson);
  return data;
};

// Exportar
const exportApi = async (id: string) => {
  const response = await apiClient.get(`/admin/apis/${id}/export`, {
    responseType: 'blob',
  });
  // luego generas un link de descarga en el front
};
```

---

## 6. Bloque final listo para pegar (resumen operativo)

```bash
# 1) Crear tipos de import/export
# backend/src/shared/types/api-import-export.ts

# 2) Crear DTO import
# backend/src/api-definitions/dto/import-api.dto.ts

# 3) Extender ApiDefinitionsService con:
#  - findOneById
#  - importFromJson
#  - exportToJson
#  - upsertEndpointFromImport

# 4) Extender ApiDefinitionsController con:
#  - POST /admin/apis/import
#  - GET /admin/apis/:id/export

# 5) (Opcional) Agregar funciones en el frontend para llamar a estos endpoints
```

Sigo 😄 Ahora nos enfocamos en el **admin web**: cómo importar/exportar JSON, listar APIs, ver endpoints y editarlos visualmente.

Voy a darte **código de frontend** concreto:

* Extender el cliente de API (`ApiDefinitionsApi`) con `import` y `export`.
* UI para:

  * Dashboard (lista de APIs + crear + importar + exportar).
  * Detalle de API (metadatos + endpoints + crear endpoint).
  * Editor de endpoint (form simple + JSON editor para responses).

Asumo que ya tienes React + Vite + TS + `react-router-dom` + `axios` configurados como te puse antes.

---

## 1. Extender cliente frontend: import / export

### `frontend/src/api/api-definitions.ts`

Reemplaza este archivo por algo así:

```ts
// frontend/src/api/api-definitions.ts
import { apiClient } from './client';

export interface MockResponse {
  status: number;
  headers?: Record<string, string>;
  body: any;
  isDefault?: boolean;
}

export interface ApiEndpoint {
  id: string;
  method: string;
  path: string;
  summary?: string;
  requestSchema?: any;
  responses: MockResponse[];
  delayMs?: number;
  enabled: boolean;
}

export interface ApiDefinition {
  id: string;
  name: string;
  slug: string;
  version: string;
  basePath: string;
  description?: string;
  isActive: boolean;
  tags: string[];
  endpoints?: ApiEndpoint[];
}

export interface ImportExportApiFile {
  type: 'mock-api-definition';
  schemaVersion: string;
  api: {
    name: string;
    slug: string;
    version?: string;
    basePath?: string;
    description?: string;
    isActive?: boolean;
    tags?: string[];
  };
  endpoints: Array<{
    method: string;
    path: string;
    summary?: string;
    requestSchema?: any;
    responses: MockResponse[];
    delayMs?: number;
    enabled?: boolean;
  }>;
}

export const ApiDefinitionsApi = {
  list: async (): Promise<ApiDefinition[]> => {
    const { data } = await apiClient.get('/admin/apis');
    return data;
  },

  create: async (payload: Partial<ApiDefinition>) => {
    const { data } = await apiClient.post('/admin/apis', payload);
    return data;
  },

  update: async (id: string, payload: Partial<ApiDefinition>) => {
    const { data } = await apiClient.patch(`/admin/apis/${id}`, payload);
    return data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/admin/apis/${id}`);
  },

  createEndpoint: async (apiId: string, payload: Partial<ApiEndpoint>) => {
    const { data } = await apiClient.post(
      `/admin/apis/${apiId}/endpoints`,
      payload,
    );
    return data;
  },

  updateEndpoint: async (
    endpointId: string,
    payload: Partial<ApiEndpoint>,
  ) => {
    const { data } = await apiClient.patch(
      `/admin/apis/endpoints/${endpointId}`,
      payload,
    );
    return data;
  },

  deleteEndpoint: async (endpointId: string) => {
    await apiClient.delete(`/admin/apis/endpoints/${endpointId}`);
  },

  // IMPORTAR JSON (el JSON ya parseado)
  importFromJson: async (fileJson: ImportExportApiFile) => {
    const { data } = await apiClient.post('/admin/apis/import', fileJson);
    return data as ApiDefinition;
  },

  // EXPORTAR JSON (devuelve un Blob para descargar)
  exportToJson: async (id: string): Promise<Blob> => {
    const response = await apiClient.get(`/admin/apis/${id}/export`, {
      responseType: 'blob',
    });
    return response.data as Blob;
  },
};
```

---

## 2. Dashboard: listar APIs + crear + importar + exportar

### `frontend/src/pages/DashboardPage.tsx`

Reemplaza el contenido por algo más completo:

```tsx
// frontend/src/pages/DashboardPage.tsx
import { useEffect, useState, ChangeEvent } from 'react';
import {
  ApiDefinitionsApi,
  ApiDefinition,
  ImportExportApiFile,
} from '../api/api-definitions';
import { Link } from 'react-router-dom';

export const DashboardPage = () => {
  const [apis, setApis] = useState<ApiDefinition[]>([]);
  const [loading, setLoading] = useState(false);

  const loadApis = async () => {
    setLoading(true);
    try {
      const data = await ApiDefinitionsApi.list();
      setApis(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApis();
  }, []);

  const handleCreate = async () => {
    const name = prompt('Nombre de la nueva API');
    const slug = prompt('Slug (ej: github, jsonplaceholder)');
    if (!name || !slug) return;
    const api = await ApiDefinitionsApi.create({ name, slug });
    setApis((prev) => [...prev, api]);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta API?')) return;
    await ApiDefinitionsApi.delete(id);
    setApis((prev) => prev.filter((a) => a.id !== id));
  };

  // IMPORTAR JSON
  const handleImportFileChange = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const json = JSON.parse(text) as ImportExportApiFile;
      const imported = await ApiDefinitionsApi.importFromJson(json);
      setApis((prev) => {
        const existingIndex = prev.findIndex((a) => a.id === imported.id);
        if (existingIndex >= 0) {
          const copy = [...prev];
          copy[existingIndex] = imported;
          return copy;
        }
        return [...prev, imported];
      });
      alert(`Importada API: ${imported.name} (${imported.slug})`);
    } catch (e) {
      console.error(e);
      alert('Error importando el archivo JSON');
    } finally {
      // reset input value para poder reimportar el mismo archivo si hace falta
      event.target.value = '';
    }
  };

  // EXPORTAR JSON
  const handleExport = async (api: ApiDefinition) => {
    try {
      const blob = await ApiDefinitionsApi.exportToJson(api.id);
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `${api.slug}.api.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert('Error exportando la API');
    }
  };

  return (
    <div style={{ padding: '1.5rem' }}>
      <h1>Mock API Studio</h1>

      <div style={{ margin: '1rem 0', display: 'flex', gap: '1rem' }}>
        <button onClick={handleCreate}>+ Crear nueva API</button>

        <label
          style={{
            border: '1px solid #ccc',
            padding: '0.5rem 1rem',
            cursor: 'pointer',
          }}
        >
          Importar JSON
          <input
            type="file"
            accept=".json,application/json"
            style={{ display: 'none' }}
            onChange={handleImportFileChange}
          />
        </label>
      </div>

      {loading && <p>Cargando APIs...</p>}

      {!loading && (
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            marginTop: '1rem',
          }}
        >
          <thead>
            <tr>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                Nombre
              </th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                Slug
              </th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                Base Path
              </th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                Estado
              </th>
              <th style={{ borderBottom: '1px solid #ddd' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {apis.map((api) => (
              <tr key={api.id}>
                <td style={{ padding: '0.5rem 0.25rem' }}>
                  <Link to={`/apis/${api.id}`}>{api.name}</Link>
                </td>
                <td style={{ padding: '0.5rem 0.25rem' }}>{api.slug}</td>
                <td style={{ padding: '0.5rem 0.25rem' }}>{api.basePath}</td>
                <td style={{ padding: '0.5rem 0.25rem' }}>
                  {api.isActive ? 'Activo' : 'Inactivo'}
                </td>
                <td
                  style={{
                    padding: '0.5rem 0.25rem',
                    display: 'flex',
                    gap: '0.5rem',
                  }}
                >
                  <button onClick={() => handleExport(api)}>Exportar</button>
                  <button onClick={() => handleDelete(api.id)}>Eliminar</button>
                </td>
              </tr>
            ))}
            {apis.length === 0 && (
              <tr>
                <td colSpan={5} style={{ paddingTop: '1rem' }}>
                  No hay APIs creadas todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};
```

Esto ya te da:

* Botón **Crear nueva API**.
* Botón **Importar JSON** (usa el mismo formato que tus seeds).
* Botón **Exportar** por cada API → descarga un `.api.json`.

---

## 3. Detalle de API: metadatos + lista de endpoints

### `frontend/src/pages/ApiDetailPage.tsx`

Un detalle simple, que cargue la API por `id` (de la URL) y muestre los endpoints:

```tsx
// frontend/src/pages/ApiDetailPage.tsx
import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ApiDefinitionsApi, ApiDefinition, ApiEndpoint } from '../api/api-definitions';

export const ApiDetailPage = () => {
  const { apiId } = useParams<{ apiId: string }>();
  const navigate = useNavigate();
  const [api, setApi] = useState<ApiDefinition | null>(null);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    if (!apiId) return;
    setLoading(true);
    try {
      const apis = await ApiDefinitionsApi.list();
      const current = apis.find((a) => a.id === apiId) || null;
      setApi(current || null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [apiId]);

  const handleToggleActive = async () => {
    if (!api) return;
    const updated = await ApiDefinitionsApi.update(api.id, {
      isActive: !api.isActive,
    });
    setApi(updated);
  };

  const handleCreateEndpoint = async () => {
    if (!api) return;
    const method = prompt('Método (GET, POST, PUT, DELETE...)', 'GET') || 'GET';
    const path = prompt('Path (ej: /users/:id)', '/example') || '/example';

    const endpoint = await ApiDefinitionsApi.createEndpoint(api.id, {
      method,
      path,
      responses: [
        {
          status: 200,
          body: { message: 'OK' },
          isDefault: true,
        },
      ],
      enabled: true,
      delayMs: 0,
    });

    setApi((prev) =>
      prev
        ? { ...prev, endpoints: [...(prev.endpoints || []), endpoint] }
        : prev,
    );
  };

  const handleDeleteEndpoint = async (endpoint: ApiEndpoint) => {
    if (!confirm(`¿Eliminar endpoint [${endpoint.method}] ${endpoint.path}?`))
      return;
    await ApiDefinitionsApi.deleteEndpoint(endpoint.id);
    setApi((prev) =>
      prev
        ? {
            ...prev,
            endpoints: (prev.endpoints || []).filter((e) => e.id !== endpoint.id),
          }
        : prev,
    );
  };

  if (loading) {
    return (
      <div style={{ padding: '1.5rem' }}>
        <p>Cargando API...</p>
      </div>
    );
  }

  if (!api) {
    return (
      <div style={{ padding: '1.5rem' }}>
        <p>API no encontrada.</p>
        <button onClick={() => navigate('/')}>Volver</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem' }}>
      <h1>{api.name}</h1>
      <p>
        <strong>Slug:</strong> {api.slug}
      </p>
      <p>
        <strong>Base path:</strong> {api.basePath}
      </p>
      <p>
        <strong>Versión:</strong> {api.version}
      </p>
      {api.description && <p>{api.description}</p>}

      <button onClick={handleToggleActive}>
        {api.isActive ? 'Desactivar' : 'Activar'}
      </button>

      <hr style={{ margin: '1.5rem 0' }} />

      <div
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <h2>Endpoints</h2>
        <button onClick={handleCreateEndpoint}>+ Crear endpoint</button>
      </div>

      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          marginTop: '1rem',
        }}
      >
        <thead>
          <tr>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
              Método
            </th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
              Path
            </th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
              Respuesta por defecto
            </th>
            <th style={{ borderBottom: '1px solid #ddd' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {(api.endpoints || []).map((endpoint) => {
            const defaultResponse =
              endpoint.responses?.find((r) => r.isDefault) ||
              endpoint.responses?.[0];

            return (
              <tr key={endpoint.id}>
                <td style={{ padding: '0.5rem 0.25rem' }}>
                  <code>{endpoint.method}</code>
                </td>
                <td style={{ padding: '0.5rem 0.25rem' }}>
                  <code>{endpoint.path}</code>
                </td>
                <td style={{ padding: '0.5rem 0.25rem' }}>
                  {defaultResponse
                    ? `${defaultResponse.status} ${
                        defaultResponse.headers?.['Content-Type'] ||
                        'application/json'
                      }`
                    : '—'}
                </td>
                <td
                  style={{
                    padding: '0.5rem 0.25rem',
                    display: 'flex',
                    gap: '0.5rem',
                  }}
                >
                  <Link to={`/apis/${api.id}/endpoints/${endpoint.id}`}>
                    <button>Editar</button>
                  </Link>
                  <button onClick={() => handleDeleteEndpoint(endpoint)}>
                    Eliminar
                  </button>
                </td>
              </tr>
            );
          })}
          {(api.endpoints || []).length === 0 && (
            <tr>
              <td colSpan={4} style={{ paddingTop: '1rem' }}>
                No hay endpoints aún.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
```

---

## 4. Editor de endpoint: form + JSON editor para responses

Vamos con algo simple: editas método, path, summary, delay y el JSON de `responses` en un `<textarea>`. Más adelante puedes reemplazarlo por un editor visual más pro.

### `frontend/src/pages/EndpointEditorPage.tsx`

```tsx
// frontend/src/pages/EndpointEditorPage.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ApiDefinitionsApi,
  ApiDefinition,
  ApiEndpoint,
  MockResponse,
} from '../api/api-definitions';

export const EndpointEditorPage = () => {
  const { apiId, endpointId } = useParams<{
    apiId: string;
    endpointId: string;
  }>();
  const navigate = useNavigate();

  const [api, setApi] = useState<ApiDefinition | null>(null);
  const [endpoint, setEndpoint] = useState<ApiEndpoint | null>(null);
  const [responsesText, setResponsesText] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!apiId || !endpointId) return;

      const apis = await ApiDefinitionsApi.list();
      const current = apis.find((a) => a.id === apiId) || null;
      setApi(current);

      const ep =
        current?.endpoints?.find((e) => e.id === endpointId) || null;
      setEndpoint(ep || null);

      if (ep) {
        setResponsesText(JSON.stringify(ep.responses, null, 2));
      }
    };

    load();
  }, [apiId, endpointId]);

  const handleChangeField = (field: keyof ApiEndpoint, value: any) => {
    setEndpoint((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleSave = async () => {
    if (!endpoint) return;

    setSaving(true);
    try {
      let parsedResponses: MockResponse[];
      try {
        parsedResponses = JSON.parse(responsesText);
        if (!Array.isArray(parsedResponses)) {
          alert('responses debe ser un array de objetos');
          setSaving(false);
          return;
        }
      } catch (e) {
        alert('JSON inválido en responses');
        setSaving(false);
        return;
      }

      const payload: Partial<ApiEndpoint> = {
        method: endpoint.method,
        path: endpoint.path,
        summary: endpoint.summary,
        delayMs: endpoint.delayMs,
        enabled: endpoint.enabled,
        responses: parsedResponses,
      };

      await ApiDefinitionsApi.updateEndpoint(endpoint.id, payload);
      alert('Endpoint guardado');
      navigate(`/apis/${apiId}`);
    } finally {
      setSaving(false);
    }
  };

  if (!api || !endpoint) {
    return (
      <div style={{ padding: '1.5rem' }}>
        <p>Cargando endpoint...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem', maxWidth: 900 }}>
      <h1>
        Editando endpoint: <code>[{endpoint.method}] {endpoint.path}</code>
      </h1>
      <p>
        API:{' '}
        <Link to={`/apis/${api.id}`}>
          {api.name} ({api.slug})
        </Link>
      </p>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: '0.25rem' }}>
            Método
          </label>
          <input
            value={endpoint.method}
            onChange={(e) => handleChangeField('method', e.target.value)}
            style={{ width: '100%', padding: '0.4rem' }}
          />
        </div>
        <div style={{ flex: 3 }}>
          <label style={{ display: 'block', marginBottom: '0.25rem' }}>
            Path
          </label>
          <input
            value={endpoint.path}
            onChange={(e) => handleChangeField('path', e.target.value)}
            style={{ width: '100%', padding: '0.4rem' }}
          />
        </div>
      </div>

      <div style={{ marginTop: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.25rem' }}>
          Summary
        </label>
        <input
          value={endpoint.summary || ''}
          onChange={(e) => handleChangeField('summary', e.target.value)}
          style={{ width: '100%', padding: '0.4rem' }}
        />
      </div>

      <div
        style={{
          marginTop: '1rem',
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
        }}
      >
        <div>
          <label style={{ display: 'block', marginBottom: '0.25rem' }}>
            Delay (ms)
          </label>
          <input
            type="number"
            value={endpoint.delayMs ?? 0}
            onChange={(e) =>
              handleChangeField('delayMs', Number(e.target.value))
            }
            style={{ width: '120px', padding: '0.4rem' }}
          />
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="checkbox"
            checked={endpoint.enabled}
            onChange={(e) => handleChangeField('enabled', e.target.checked)}
          />
          Enabled
        </label>
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.25rem' }}>
          Responses (JSON array)
        </label>
        <textarea
          value={responsesText}
          onChange={(e) => setResponsesText(e.target.value)}
          rows={18}
          style={{
            width: '100%',
            fontFamily: 'monospace',
            fontSize: '0.9rem',
            padding: '0.5rem',
            border: '1px solid #ccc',
          }}
        />
      </div>

      <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
        <button onClick={handleSave} disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
        <button onClick={() => navigate(`/apis/${api.id}`)}>Cancelar</button>
      </div>
    </div>
  );
};
```

---

## 5. Router (por si no lo tenías así todavía)

Solo para asegurarnos de que las rutas están bien conectadas:

```tsx
// frontend/src/router/index.tsx
import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { DashboardPage } from '../pages/DashboardPage';
import { ApiDetailPage } from '../pages/ApiDetailPage';
import { EndpointEditorPage } from '../pages/EndpointEditorPage';
import { NotFoundPage } from '../pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'apis/:apiId', element: <ApiDetailPage /> },
      { path: 'apis/:apiId/endpoints/:endpointId', element: <EndpointEditorPage /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
```

Y un layout simple:

```tsx
// frontend/src/components/layout/AppLayout.tsx
import { Outlet, Link } from 'react-router-dom';

export const AppLayout = () => {
  return (
    <div>
      <header
        style={{
          padding: '0.75rem 1.5rem',
          borderBottom: '1px solid #eee',
          marginBottom: '1rem',
        }}
      >
        <Link to="/" style={{ textDecoration: 'none', fontWeight: 600 }}>
          Mock API Studio
        </Link>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
};
```

---

## 6. Bloque final para copiar/pegar (resumen)

```bash
# FRONTEND

# 1) Actualiza el cliente de API:
#   frontend/src/api/api-definitions.ts
#   (pega el archivo que te di con import/export)

# 2) Implementa/actualiza páginas:
#   - frontend/src/pages/DashboardPage.tsx  (lista APIs + crear + importar + exportar)
#   - frontend/src/pages/ApiDetailPage.tsx  (detalle API + endpoints + crear endpoint)
#   - frontend/src/pages/EndpointEditorPage.tsx (form + JSON editor de responses)

# 3) Asegúrate de que el router está configurado:
#   frontend/src/router/index.tsx
#   frontend/src/components/layout/AppLayout.tsx

# 4) Levanta el stack:
docker compose up --build
# Frontend: http://localhost:8080
# Backend:  http://localhost:3000

# 5) Prueba:
#   - Verás las APIs seeded (jsonplaceholder, github).
#   - Podrás exportarlas, borrarlas, crear nuevas.
#   - Podrás importar los mismos JSONs o nuevos.
```

Con esto ya tienes un **circuito completo**:

* Definición en DB (Prisma).
* Import/export en backend.
* Admin web para gestionar APIs y endpoints.
* Mock runtime ya conectado por `/mock/:apiSlug/*`.

Perfecto, vamos a montar el **Playground de mocks** en el frontend para pegarle al backend `/mock/:apiSlug/*`.

Te doy:

1. Cliente frontend para el runtime de mocks.
2. Página `PlaygroundPage` con selector de API + endpoint + formulario de request.
3. Actualizar router + link en el layout.

Con esto podrás probar tus mocks directo desde el navegador.

---

## 1. Cliente para el runtime de mocks

Crea este archivo:

```ts
// frontend/src/api/mock-runtime.ts
import { apiClient } from './client';

export interface MockRequestOptions {
  apiSlug: string;
  method: string;
  path: string; // debe empezar con "/"
  query?: Record<string, any>;
  headers?: Record<string, string>;
  body?: any;
}

export interface MockResponseData {
  statusCode: number;
  headers: Record<string, string>;
  body: any;
}

export const MockRuntimeApi = {
  async sendRequest(options: MockRequestOptions): Promise<MockResponseData> {
    const { apiSlug, method, path, query, headers, body } = options;

    const urlPath = `/mock/${apiSlug}${path}`;

    const response = await apiClient.request({
      method,
      url: urlPath,
      params: query,
      headers,
      data: body,
      validateStatus: () => true, // queremos ver todos los status
    });

    return {
      statusCode: response.status,
      headers: response.headers as Record<string, string>,
      body: response.data,
    };
  },
};
```

> Nota: aquí usamos el mismo `apiClient` que ya apunta al backend (`VITE_API_BASE_URL`).

---

## 2. Página: `PlaygroundPage`

Nueva ruta `/playground`:

* Selecciona API mock.
* Selecciona endpoint.
* Editas:

  * Path final (ej: `/posts`, `/users/octocat/repos`).
  * Query (JSON).
  * Headers (JSON).
  * Body (JSON).
* Muestra respuesta (status + headers + body formateado).

```tsx
// frontend/src/pages/PlaygroundPage.tsx
import { useEffect, useMemo, useState } from 'react';
import {
  ApiDefinitionsApi,
  ApiDefinition,
  ApiEndpoint,
} from '../api/api-definitions';
import {
  MockRuntimeApi,
  MockResponseData,
} from '../api/mock-runtime';

export const PlaygroundPage = () => {
  const [apis, setApis] = useState<ApiDefinition[]>([]);
  const [selectedApiId, setSelectedApiId] = useState<string>('');
  const [selectedEndpointId, setSelectedEndpointId] = useState<string>('');

  const [path, setPath] = useState<string>('');
  const [queryText, setQueryText] = useState<string>('{}');
  const [headersText, setHeadersText] = useState<string>('{}');
  const [bodyText, setBodyText] = useState<string>('{}');

  const [loadingApis, setLoadingApis] = useState(false);
  const [sending, setSending] = useState(false);
  const [response, setResponse] = useState<MockResponseData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoadingApis(true);
      try {
        const data = await ApiDefinitionsApi.list();
        const active = data.filter((a) => a.isActive);
        setApis(active);
        if (active.length > 0) {
          setSelectedApiId(active[0].id);
        }
      } finally {
        setLoadingApis(false);
      }
    };
    load();
  }, []);

  const selectedApi = useMemo(
    () => apis.find((a) => a.id === selectedApiId) || null,
    [apis, selectedApiId],
  );

  const endpoints = selectedApi?.endpoints || [];

  const selectedEndpoint = useMemo(
    () => endpoints.find((e) => e.id === selectedEndpointId) || null,
    [endpoints, selectedEndpointId],
  );

  // Cuando cambie la API, seleccionamos primer endpoint activo
  useEffect(() => {
    if (!selectedApi) return;
    const first = (selectedApi.endpoints || [])[0];
    if (first) {
      setSelectedEndpointId(first.id);
      setPath(first.path.startsWith('/') ? first.path : `/${first.path}`);
    }
  }, [selectedApi]);

  // Cuando cambie endpoint explícitamente
  useEffect(() => {
    if (!selectedEndpoint) return;
    setPath(
      selectedEndpoint.path.startsWith('/')
        ? selectedEndpoint.path
        : `/${selectedEndpoint.path}`,
    );
  }, [selectedEndpointId]);

  const handleSend = async () => {
    if (!selectedApi || !selectedEndpoint) return;

    setError(null);
    setResponse(null);
    setSending(true);

    try {
      let query: Record<string, any> | undefined;
      let headers: Record<string, string> | undefined;
      let body: any | undefined;

      if (queryText.trim()) {
        query = JSON.parse(queryText || '{}');
      }
      if (headersText.trim()) {
        headers = JSON.parse(headersText || '{}');
      }
      if (bodyText.trim()) {
        body = JSON.parse(bodyText || '{}');
      }

      const result = await MockRuntimeApi.sendRequest({
        apiSlug: selectedApi.slug,
        method: selectedEndpoint.method,
        path,
        query,
        headers,
        body,
      });

      setResponse(result);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || 'Error enviando la solicitud');
    } finally {
      setSending(false);
    }
  };

  const baseUrl =
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
  const fullUrl =
    selectedApi && path
      ? `${baseUrl}/mock/${selectedApi.slug}${path}`
      : '';

  return (
    <div style={{ padding: '1.5rem', maxWidth: 1100, margin: '0 auto' }}>
      <h1>Playground de Mock APIs</h1>
      <p style={{ marginBottom: '1rem' }}>
        Selecciona una API y un endpoint para probarlo contra el runtime
        <code> /mock/:apiSlug/* </code>.
      </p>

      {loadingApis && <p>Cargando APIs...</p>}

      {!loadingApis && (
        <>
          {/* Selección de API y endpoint */}
          <div
            style={{
              display: 'flex',
              gap: '1rem',
              marginBottom: '1rem',
              alignItems: 'flex-end',
            }}
          >
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.25rem' }}>
                API
              </label>
              <select
                value={selectedApiId}
                onChange={(e) => setSelectedApiId(e.target.value)}
                style={{ width: '100%', padding: '0.4rem' }}
              >
                {apis.map((api) => (
                  <option key={api.id} value={api.id}>
                    {api.name} ({api.slug})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.25rem' }}>
                Endpoint
              </label>
              <select
                value={selectedEndpointId}
                onChange={(e) => setSelectedEndpointId(e.target.value)}
                style={{ width: '100%', padding: '0.4rem' }}
              >
                {endpoints.map((ep) => (
                  <option key={ep.id} value={ep.id}>
                    [{ep.method}] {ep.path}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* URL final y método */}
          {selectedApi && selectedEndpoint && (
            <div
              style={{
                border: '1px solid #ddd',
                padding: '0.75rem',
                borderRadius: 4,
                marginBottom: '1rem',
              }}
            >
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <div>
                  <label
                    style={{ display: 'block', marginBottom: '0.25rem' }}
                  >
                    Método
                  </label>
                  <input
                    value={selectedEndpoint.method}
                    readOnly
                    style={{ width: 100, padding: '0.4rem' }}
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <label
                    style={{ display: 'block', marginBottom: '0.25rem' }}
                  >
                    Path relativo (después de <code>/mock/{selectedApi.slug}</code>)
                  </label>
                  <input
                    value={path}
                    onChange={(e) => setPath(e.target.value)}
                    style={{ width: '100%', padding: '0.4rem' }}
                  />
                  <small style={{ color: '#555' }}>
                    Ejemplo: <code>/posts</code>,{' '}
                    <code>/users/octocat/repos</code> (reemplaza los
                    <code>:params</code> a mano).
                  </small>
                </div>
              </div>

              <div style={{ marginTop: '0.5rem' }}>
                <small>
                  URL completa:{' '}
                  <code>{fullUrl || '(selecciona API y endpoint)'}</code>
                </small>
              </div>
            </div>
          )}

          {/* JSON editors */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.25rem' }}>
                Query params (JSON)
              </label>
              <textarea
                rows={6}
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                style={{
                  width: '100%',
                  fontFamily: 'monospace',
                  fontSize: '0.85rem',
                  padding: '0.5rem',
                  border: '1px solid #ccc',
                }}
              />
            </div>

            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.25rem' }}>
                Headers (JSON)
              </label>
              <textarea
                rows={6}
                value={headersText}
                onChange={(e) => setHeadersText(e.target.value)}
                style={{
                  width: '100%',
                  fontFamily: 'monospace',
                  fontSize: '0.85rem',
                  padding: '0.5rem',
                  border: '1px solid #ccc',
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.25rem' }}>
              Body (JSON)
            </label>
            <textarea
              rows={8}
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              style={{
                width: '100%',
                fontFamily: 'monospace',
                fontSize: '0.85rem',
                padding: '0.5rem',
                border: '1px solid #ccc',
              }}
            />
          </div>

          <button onClick={handleSend} disabled={sending || !selectedEndpoint}>
            {sending ? 'Enviando...' : 'Enviar request'}
          </button>

          {error && (
            <div
              style={{
                marginTop: '1rem',
                padding: '0.75rem',
                border: '1px solid #f99',
                background: '#fee',
              }}
            >
              <strong>Error:</strong> {error}
            </div>
          )}

          {response && (
            <div
              style={{
                marginTop: '1rem',
                padding: '0.75rem',
                border: '1px solid #ddd',
                background: '#fafafa',
              }}
            >
              <h2>Respuesta</h2>
              <p>
                <strong>Status:</strong> {response.statusCode}
              </p>

              <details style={{ marginBottom: '0.5rem' }}>
                <summary style={{ cursor: 'pointer' }}>Headers</summary>
                <pre
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '0.85rem',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {JSON.stringify(response.headers, null, 2)}
                </pre>
              </details>

              <div>
                <strong>Body</strong>
                <pre
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '0.9rem',
                    whiteSpace: 'pre-wrap',
                    marginTop: '0.25rem',
                  }}
                >
                  {JSON.stringify(response.body, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
```

---

## 3. Conectar la página al router y al layout

### 3.1. Añadir ruta en el router

```tsx
// frontend/src/router/index.tsx
import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { DashboardPage } from '../pages/DashboardPage';
import { ApiDetailPage } from '../pages/ApiDetailPage';
import { EndpointEditorPage } from '../pages/EndpointEditorPage';
import { PlaygroundPage } from '../pages/PlaygroundPage';
import { NotFoundPage } from '../pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'apis/:apiId', element: <ApiDetailPage /> },
      {
        path: 'apis/:apiId/endpoints/:endpointId',
        element: <EndpointEditorPage />,
      },
      { path: 'playground', element: <PlaygroundPage /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
```

### 3.2. Link al Playground en el layout

```tsx
// frontend/src/components/layout/AppLayout.tsx
import { Outlet, Link, useLocation } from 'react-router-dom';

export const AppLayout = () => {
  const location = useLocation();

  return (
    <div>
      <header
        style={{
          padding: '0.75rem 1.5rem',
          borderBottom: '1px solid #eee',
          marginBottom: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Link to="/" style={{ textDecoration: 'none', fontWeight: 600 }}>
          Mock API Studio
        </Link>

        <nav style={{ display: 'flex', gap: '1rem', fontSize: '0.95rem' }}>
          <Link
            to="/"
            style={{
              textDecoration: 'none',
              fontWeight: location.pathname === '/' ? 600 : 400,
            }}
          >
            Admin
          </Link>
          <Link
            to="/playground"
            style={{
              textDecoration: 'none',
              fontWeight: location.pathname.startsWith('/playground')
                ? 600
                : 400,
            }}
          >
            Playground
          </Link>
        </nav>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  );
};
```

---

## 4. Resumen operativo

```bash
# FRONTEND

# 1) Crear:
#   frontend/src/api/mock-runtime.ts

# 2) Crear:
#   frontend/src/pages/PlaygroundPage.tsx

# 3) Actualizar:
#   frontend/src/router/index.tsx   (añadir ruta /playground)
#   frontend/src/components/layout/AppLayout.tsx (añadir link a Playground)

# 4) Levantar stack:
docker compose up --build

# 5) Navegar:
#   - Admin:      http://localhost:8080/
#   - Playground: http://localhost:8080/playground
#
# En Playground:
#   - Selecciona API "JSONPlaceholder" o "GitHub Mock".
#   - Selecciona endpoint.
#   - Ajusta path: /posts, /users/octocat, /users/octocat/repos...
#   - Envía request y ve la respuesta del mock runtime.
```

Con esto tu proyecto ya tiene:

* Admin para **crear/editar/importar/exportar** APIs mock.
* Runtime en `/mock/:apiSlug/*`.
* Playground web para probar las APIs mock sin salir del sistema.

Genial, vamos a subirle el nivel al runtime 😎

Te propongo estos 2 features:

1. **Templating en responses**: soportar `{{params.id}}`, `{{query.foo}}`, `{{body.bar}}`, etc.
2. **Selección condicional de responses**: elegir la respuesta según query/headers/body (ej: `?error=1` → status 500).

Te dejo todo el código para backend listo para copiar/pegar.

---

## 1. Extender tipos: `match` y templating

### 1.1. `backend/src/shared/types/api-definition.ts`

Actualiza este archivo para incluir `match`:

```ts
// backend/src/shared/types/api-definition.ts

export type ResponseMatchRule = {
  query?: Record<string, string | number | boolean>;
  headers?: Record<string, string>;
  bodyEquals?: any; // si quieres algo más avanzado luego, lo extiendes
};

export type MockResponse = {
  status: number;
  headers?: Record<string, string>;
  body: any;
  isDefault?: boolean;
  match?: ResponseMatchRule; // <- NUEVO
};

export interface ApiEndpointDefinition {
  id: string;
  method: string;
  path: string;
  summary?: string;
  requestSchema?: any;
  responses: MockResponse[];
  delayMs?: number;
  enabled: boolean;
}

export interface ApiDefinition {
  id: string;
  name: string;
  slug: string;
  version: string;
  basePath: string;
  description?: string;
  isActive: boolean;
  tags: string[];
  endpoints: ApiEndpointDefinition[];
}
```

### 1.2. `backend/src/shared/types/api-import-export.ts`

Para que import/export soporte también `match`:

```ts
// backend/src/shared/types/api-import-export.ts

export type ImportExportResponseMatchRule = {
  query?: Record<string, string | number | boolean>;
  headers?: Record<string, string>;
  bodyEquals?: any;
};

export type ImportExportMockResponse = {
  status: number;
  headers?: Record<string, string>;
  body: any;
  isDefault?: boolean;
  match?: ImportExportResponseMatchRule; // <- NUEVO
};

export type ImportExportEndpoint = {
  method: string;
  path: string;
  summary?: string;
  requestSchema?: any;
  responses: ImportExportMockResponse[];
  delayMs?: number;
  enabled?: boolean;
};

export type ImportExportApiMeta = {
  name: string;
  slug: string;
  version?: string;
  basePath?: string;
  description?: string;
  isActive?: boolean;
  tags?: string[];
};

export type ImportExportApiFile = {
  type: 'mock-api-definition';
  schemaVersion: string;
  api: ImportExportApiMeta;
  endpoints: ImportExportEndpoint[];
};
```

> Esto no rompe nada: los JSON viejos siguen siendo válidos (simplemente no tienen `match`).

---

## 2. Motor de templates (Handlebars)

Vamos a usar `handlebars` para poder escribir cosas como:

```json
"body": {
  "id": "{{params.id}}",
  "user": "{{query.user}}",
  "echo": "{{{json body}}}"
}
```

### 2.1. Instalar dependencia

En el backend:

```bash
cd backend
npm install handlebars
```

### 2.2. Utilidad: `template-engine.ts`

Crea este archivo:

```ts
// backend/src/shared/utils/template-engine.ts
import Handlebars from 'handlebars';

Handlebars.registerHelper('json', function (context) {
  return JSON.stringify(context);
});

export interface TemplateContext {
  params: Record<string, any>;
  query: Record<string, any>;
  body: any;
  headers: Record<string, any>;
}

/**
 * Renderiza un valor con Handlebars si es string, si es objeto/array
 * hace un deep-walk y renderiza todos los strings internos.
 */
export function renderWithTemplate<T = any>(
  value: T,
  context: TemplateContext,
): T {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === 'string') {
    const template = Handlebars.compile(value);
    return template(context) as unknown as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => renderWithTemplate(item, context)) as unknown as T;
  }

  if (typeof value === 'object') {
    const result: any = {};
    for (const [k, v] of Object.entries(value)) {
      result[k] = renderWithTemplate(v, context);
    }
    return result;
  }

  // number, boolean, etc
  return value;
}
```

---

## 3. match de responses: helper

Vamos a crear un helper para saber si una response cumple las reglas `match`.

### 3.1. `backend/src/shared/utils/response-matcher.ts`

```ts
// backend/src/shared/utils/response-matcher.ts
import { ResponseMatchRule } from '../types/api-definition';

export interface RuntimeRequestContext {
  query: Record<string, any>;
  headers: Record<string, string>;
  body: any;
}

export function responseMatches(
  rule: ResponseMatchRule | undefined,
  ctx: RuntimeRequestContext,
): boolean {
  if (!rule) return false;

  // Match de query params (igualdad simple)
  if (rule.query) {
    for (const [key, expected] of Object.entries(rule.query)) {
      const actual = ctx.query?.[key];
      if (actual === undefined) return false;
      if (String(actual) !== String(expected)) return false;
    }
  }

  // Match de headers (case-insensitive)
  if (rule.headers) {
    const normHeaders: Record<string, string> = {};
    for (const [k, v] of Object.entries(ctx.headers || {})) {
      normHeaders[k.toLowerCase()] = String(v);
    }

    for (const [key, expected] of Object.entries(rule.headers)) {
      const actual = normHeaders[key.toLowerCase()];
      if (actual === undefined) return false;
      if (actual !== expected) return false;
    }
  }

  // Match de bodyEquals (deep-ish compare muy simple)
  if (rule.bodyEquals !== undefined) {
    const expected = JSON.stringify(rule.bodyEquals);
    const actual = JSON.stringify(ctx.body ?? null);
    if (expected !== actual) return false;
  }

  return true;
}
```

---

## 4. Actualizar `MockRuntimeService` para usar match + templates

### 4.1. `backend/src/mock-runtime/mock-runtime.service.ts`

Modifica este archivo para:

* Usar `responseMatches` para elegir la respuesta.
* Usar `renderWithTemplate` para aplicar templates en el body.

```ts
// backend/src/mock-runtime/mock-runtime.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { RedisService } from '../common/redis/redis.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { matchPath } from '../shared/utils/path-matcher';
import { MockResponse } from '../shared/types/api-definition';
import { renderWithTemplate } from '../shared/utils/template-engine';
import { responseMatches } from '../shared/utils/response-matcher';

interface RuntimeRequest {
  apiSlug: string;
  method: string;
  path: string;
  body: any;
  query: any;
  headers: Record<string, string>;
}

@Injectable()
export class MockRuntimeService {
  constructor(
    private readonly redis: RedisService,
    private readonly prisma: PrismaService,
  ) {}

  private async getApiFromCacheOrDb(apiSlug: string) {
    const cacheKey = `mock:api:${apiSlug}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const api = await this.prisma.apiDefinition.findUnique({
      where: { slug: apiSlug },
      include: { endpoints: true },
    });

    if (!api || !api.isActive) {
      throw new NotFoundException('API not found or inactive');
    }

    await this.redis.set(cacheKey, JSON.stringify(api), 60);
    return api;
  }

  async handleRequest(req: RuntimeRequest) {
    const api = await this.getApiFromCacheOrDb(req.apiSlug);

    const candidates = api.endpoints.filter(
      (e: any) =>
        e.enabled &&
        e.method.toUpperCase() === req.method.toUpperCase(),
    );

    let matchedEndpoint: any = null;
    let params: Record<string, string> = {};

    for (const endpoint of candidates) {
      const { matched, params: p } = matchPath(endpoint.path, req.path);
      if (matched) {
        matchedEndpoint = endpoint;
        params = p;
        break;
      }
    }

    if (!matchedEndpoint) {
      throw new NotFoundException('Endpoint not found');
    }

    const responses: MockResponse[] = matchedEndpoint.responses ?? [];

    // 1) Intentar responses con rule.match
    const ctx = {
      query: req.query || {},
      headers: req.headers || {},
      body: req.body,
    };

    let response =
      responses.find((r) => responseMatches(r.match, ctx)) ??
      // 2) fallback a isDefault
      responses.find((r) => r.isDefault) ??
      // 3) fallback al primero
      responses[0];

    if (!response) {
      throw new NotFoundException('No mock response defined');
    }

    // delay simulado
    if (matchedEndpoint.delayMs && matchedEndpoint.delayMs > 0) {
      await new Promise((resolve) =>
        setTimeout(resolve, matchedEndpoint.delayMs),
      );
    }

    // templating de body
    const renderedBody = renderWithTemplate(response.body, {
      params,
      query: req.query || {},
      body: req.body,
      headers: req.headers || {},
    });

    return {
      statusCode: response.status,
      headers: response.headers ?? { 'Content-Type': 'application/json' },
      body: renderedBody,
    };
  }
}
```

> Con esto:
>
> * si una response tiene `match`, se usa esa si cumple las condiciones.
> * si ninguna `match` cumple, se usa `isDefault`.
> * si tampoco hay default, se usa la primera.

---

## 5. Ejemplo de endpoint con `match` + templates

Ahora puedes definir cosas así en tus JSON de seed o import:

```jsonc
{
  "method": "GET",
  "path": "/users/:id",
  "summary": "Ejemplo con templating y match",
  "responses": [
    {
      "status": 200,
      "headers": { "Content-Type": "application/json" },
      "body": {
        "id": "{{params.id}}",
        "mode": "normal",
        "queryUser": "{{query.user}}",
        "echoBody": "{{{json body}}}"
      },
      "isDefault": true
    },
    {
      "status": 500,
      "headers": { "Content-Type": "application/json" },
      "body": {
        "error": "Forced error with query ?error=1",
        "id": "{{params.id}}"
      },
      "match": {
        "query": {
          "error": 1
        }
      }
    }
  ],
  "delayMs": 100,
  "enabled": true
}
```

Comportamiento:

* `GET /mock/jsonplaceholder/users/123`
  → status 200, body con `id: "123"`.

* `GET /mock/jsonplaceholder/users/123?error=1`
  → `match.query.error = 1` → status 500, body de error.

---

## 6. Cómo se ve desde el Playground

En tu `Playground`:

* Seleccionas este endpoint.
* En **Path** pones: `/users/123`.
* En **Query JSON** pones:

  ```json
  {"error": 1, "user": "juan"}
  ```
* En **Body JSON** pones algo:

  ```json
  {"foo": "bar"}
  ```

La respuesta:

* Con `error=1` → respuesta 500, con templating de `{{params.id}}`.
* Sin `error` → respuesta 200, con campos renderizados.

---

## 7. Bloque final para ejecutar cambios

```bash
# 1) Backend:
#   - Actualiza:
#       backend/src/shared/types/api-definition.ts
#       backend/src/shared/types/api-import-export.ts
#   - Crea:
#       backend/src/shared/utils/template-engine.ts
#       backend/src/shared/utils/response-matcher.ts
#   - Actualiza:
#       backend/src/mock-runtime/mock-runtime.service.ts

# 2) Instala handlebars:
cd backend
npm install handlebars

# 3) (Opcional) Actualiza tus JSON de seeds/import para usar 'match' y templates.

# 4) Reconstruye y levanta:
cd ..
docker compose up --build
```

Con esto ya tienes un Mock-API-Studio **mucho más potente**:

* Decide qué response usar según query/headers/body.
* Rellena dinámicamente el body con params/query/body/headers.

Buenísimo, vamos a convertir ese editor de JSON crudo en un editor visual de respuestas + reglas `match` (por query y headers).

Te doy cambios sólo en **frontend**:

1. Ampliar tipos en `api-definitions.ts` para incluir `match`.
2. Reescribir `EndpointEditorPage.tsx` para usar UI visual de respuestas.

---

## 1. Actualizar tipos en `frontend/src/api/api-definitions.ts`

Asegúrate de que el archivo queda así (o muy parecido), añadiendo `ResponseMatchRule` y `match`:

```ts
// frontend/src/api/api-definitions.ts
import { apiClient } from './client';

export interface ResponseMatchRule {
  query?: Record<string, string | number | boolean>;
  headers?: Record<string, string>;
  // bodyEquals opcional, lo soporta el backend aunque aquí no lo editemos visualmente
  bodyEquals?: any;
}

export interface MockResponse {
  status: number;
  headers?: Record<string, string>;
  body: any;
  isDefault?: boolean;
  match?: ResponseMatchRule;
}

export interface ApiEndpoint {
  id: string;
  method: string;
  path: string;
  summary?: string;
  requestSchema?: any;
  responses: MockResponse[];
  delayMs?: number;
  enabled: boolean;
}

export interface ApiDefinition {
  id: string;
  name: string;
  slug: string;
  version: string;
  basePath: string;
  description?: string;
  isActive: boolean;
  tags: string[];
  endpoints?: ApiEndpoint[];
}

export interface ImportExportApiFile {
  type: 'mock-api-definition';
  schemaVersion: string;
  api: {
    name: string;
    slug: string;
    version?: string;
    basePath?: string;
    description?: string;
    isActive?: boolean;
    tags?: string[];
  };
  endpoints: Array<{
    method: string;
    path: string;
    summary?: string;
    requestSchema?: any;
    responses: MockResponse[];
    delayMs?: number;
    enabled?: boolean;
  }>;
}

export const ApiDefinitionsApi = {
  list: async (): Promise<ApiDefinition[]> => {
    const { data } = await apiClient.get('/admin/apis');
    return data;
  },

  create: async (payload: Partial<ApiDefinition>) => {
    const { data } = await apiClient.post('/admin/apis', payload);
    return data;
  },

  update: async (id: string, payload: Partial<ApiDefinition>) => {
    const { data } = await apiClient.patch(`/admin/apis/${id}`, payload);
    return data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/admin/apis/${id}`);
  },

  createEndpoint: async (apiId: string, payload: Partial<ApiEndpoint>) => {
    const { data } = await apiClient.post(
      `/admin/apis/${apiId}/endpoints`,
      payload,
    );
    return data;
  },

  updateEndpoint: async (
    endpointId: string,
    payload: Partial<ApiEndpoint>,
  ) => {
    const { data } = await apiClient.patch(
      `/admin/apis/endpoints/${endpointId}`,
      payload,
    );
    return data;
  },

  deleteEndpoint: async (endpointId: string) => {
    await apiClient.delete(`/admin/apis/endpoints/${endpointId}`);
  },

  importFromJson: async (fileJson: ImportExportApiFile) => {
    const { data } = await apiClient.post('/admin/apis/import', fileJson);
    return data as ApiDefinition;
  },

  exportToJson: async (id: string): Promise<Blob> => {
    const response = await apiClient.get(`/admin/apis/${id}/export`, {
      responseType: 'blob',
    });
    return response.data as Blob;
  },
};
```

---

## 2. Editor visual de respuestas en `EndpointEditorPage.tsx`

Ahora cambiamos la página del editor para:

* Ver una **lista de respuestas** (cards).
* Editar `status`, `isDefault`, `headers` (JSON), `body` (JSON).
* Editar reglas `match` visualmente:

  * Lista de condiciones de **query** (par clave/valor).
  * Lista de condiciones de **headers** (par clave/valor).
* Agregar / eliminar respuestas.

Reemplaza **todo** el archivo `frontend/src/pages/EndpointEditorPage.tsx` por esto:

```tsx
// frontend/src/pages/EndpointEditorPage.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ApiDefinitionsApi,
  ApiDefinition,
  ApiEndpoint,
  MockResponse,
} from '../api/api-definitions';

type KeyValue = { key: string; value: string };

interface ResponseUiState {
  id: string; // solo para React key (no es ID real del backend)
  base: MockResponse;
  headersText: string; // JSON editable
  bodyText: string; // JSON editable
  queryPairs: KeyValue[]; // para match.query
  headerPairs: KeyValue[]; // para match.headers
}

const createUiStateFromResponse = (
  resp: MockResponse,
  index: number,
): ResponseUiState => {
  const headersText = JSON.stringify(resp.headers ?? {}, null, 2);
  const bodyText = JSON.stringify(resp.body ?? null, null, 2);

  const queryPairs: KeyValue[] = Object.entries(resp.match?.query || {}).map(
    ([key, value]) => ({
      key,
      value: String(value),
    }),
  );

  const headerPairs: KeyValue[] = Object.entries(
    resp.match?.headers || {},
  ).map(([key, value]) => ({
    key,
    value,
  }));

  return {
    id: `${index}`,
    base: resp,
    headersText,
    bodyText,
    queryPairs,
    headerPairs,
  };
};

const buildResponseFromUiState = (ui: ResponseUiState): MockResponse => {
  // headers
  let headers: Record<string, string> | undefined;
  try {
    const parsed = ui.headersText.trim()
      ? JSON.parse(ui.headersText)
      : undefined;
    if (parsed && typeof parsed === 'object') {
      headers = parsed;
    }
  } catch {
    // si hay JSON inválido, dejamos headers como estaban en base
    headers = ui.base.headers;
  }

  // body
  let body: any = ui.base.body;
  try {
    const parsed = ui.bodyText.trim()
      ? JSON.parse(ui.bodyText)
      : undefined;
    if (parsed !== undefined) {
      body = parsed;
    }
  } catch {
    // ignoramos errores, dejamos body base
  }

  // match.query
  const queryEntries = ui.queryPairs.filter((p) => p.key.trim() !== '');
  const matchQuery =
    queryEntries.length > 0
      ? queryEntries.reduce<Record<string, string>>((acc, kv) => {
          acc[kv.key.trim()] = kv.value;
          return acc;
        }, {})
      : undefined;

  // match.headers
  const headerEntries = ui.headerPairs.filter((p) => p.key.trim() !== '');
  const matchHeaders =
    headerEntries.length > 0
      ? headerEntries.reduce<Record<string, string>>((acc, kv) => {
          acc[kv.key.trim().toLowerCase()] = kv.value;
          return acc;
        }, {})
      : undefined;

  const match =
    matchQuery || matchHeaders
      ? {
          ...(matchQuery ? { query: matchQuery } : {}),
          ...(matchHeaders ? { headers: matchHeaders } : {}),
        }
      : undefined;

  return {
    status: ui.base.status,
    headers,
    body,
    isDefault: ui.base.isDefault,
    match,
  };
};

export const EndpointEditorPage = () => {
  const { apiId, endpointId } = useParams<{
    apiId: string;
    endpointId: string;
  }>();
  const navigate = useNavigate();

  const [api, setApi] = useState<ApiDefinition | null>(null);
  const [endpoint, setEndpoint] = useState<ApiEndpoint | null>(null);
  const [responsesUi, setResponsesUi] = useState<ResponseUiState[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!apiId || !endpointId) return;

      const apis = await ApiDefinitionsApi.list();
      const current = apis.find((a) => a.id === apiId) || null;
      setApi(current);

      const ep =
        current?.endpoints?.find((e) => e.id === endpointId) || null;
      setEndpoint(ep || null);

      if (ep) {
        const uiStates =
          ep.responses?.length > 0
            ? ep.responses.map((r, idx) =>
                createUiStateFromResponse(r, idx),
              )
            : [
                createUiStateFromResponse(
                  {
                    status: 200,
                    body: { message: 'OK' },
                    isDefault: true,
                  },
                  0,
                ),
              ];
        setResponsesUi(uiStates);
      }
    };

    load();
  }, [apiId, endpointId]);

  const handleEndpointFieldChange = (
    field: keyof ApiEndpoint,
    value: any,
  ) => {
    setEndpoint((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const updateResponseUi = (
    idx: number,
    updater: (current: ResponseUiState) => ResponseUiState,
  ) => {
    setResponsesUi((prev) =>
      prev.map((r, i) => (i === idx ? updater(r) : r)),
    );
  };

  const handleStatusChange = (idx: number, value: string) => {
    const status = Number(value) || 0;
    updateResponseUi(idx, (r) => ({
      ...r,
      base: { ...r.base, status },
    }));
  };

  const handleHeadersChange = (idx: number, text: string) => {
    updateResponseUi(idx, (r) => ({
      ...r,
      headersText: text,
    }));
  };

  const handleBodyChange = (idx: number, text: string) => {
    updateResponseUi(idx, (r) => ({
      ...r,
      bodyText: text,
    }));
  };

  const handleToggleDefault = (idx: number) => {
    setResponsesUi((prev) =>
      prev.map((r, i) => ({
        ...r,
        base: { ...r.base, isDefault: i === idx },
      })),
    );
  };

  const addResponse = () => {
    setResponsesUi((prev) => [
      ...prev,
      createUiStateFromResponse(
        {
          status: 200,
          body: { message: 'OK' },
          isDefault: prev.length === 0, // primera como default
        },
        prev.length,
      ),
    ]);
  };

  const removeResponse = (idx: number) => {
    setResponsesUi((prev) => {
      if (prev.length <= 1) return prev; // no dejar sin responses
      const newArr = prev.filter((_, i) => i !== idx);

      // si borramos la default, marcamos la primera como default
      if (!newArr.some((r) => r.base.isDefault)) {
        newArr[0] = {
          ...newArr[0],
          base: { ...newArr[0].base, isDefault: true },
        };
      }

      return newArr;
    });
  };

  // match.query KV
  const changeQueryPair = (
    respIdx: number,
    pairIdx: number,
    field: 'key' | 'value',
    value: string,
  ) => {
    updateResponseUi(respIdx, (r) => {
      const newPairs = [...r.queryPairs];
      newPairs[pairIdx] = { ...newPairs[pairIdx], [field]: value };
      return { ...r, queryPairs: newPairs };
    });
  };

  const addQueryPair = (respIdx: number) => {
    updateResponseUi(respIdx, (r) => ({
      ...r,
      queryPairs: [...r.queryPairs, { key: '', value: '' }],
    }));
  };

  const removeQueryPair = (respIdx: number, pairIdx: number) => {
    updateResponseUi(respIdx, (r) => ({
      ...r,
      queryPairs: r.queryPairs.filter((_, i) => i !== pairIdx),
    }));
  };

  // match.headers KV
  const changeHeaderPair = (
    respIdx: number,
    pairIdx: number,
    field: 'key' | 'value',
    value: string,
  ) => {
    updateResponseUi(respIdx, (r) => {
      const newPairs = [...r.headerPairs];
      newPairs[pairIdx] = { ...newPairs[pairIdx], [field]: value };
      return { ...r, headerPairs: newPairs };
    });
  };

  const addHeaderPair = (respIdx: number) => {
    updateResponseUi(respIdx, (r) => ({
      ...r,
      headerPairs: [...r.headerPairs, { key: '', value: '' }],
    }));
  };

  const removeHeaderPair = (respIdx: number, pairIdx: number) => {
    updateResponseUi(respIdx, (r) => ({
      ...r,
      headerPairs: r.headerPairs.filter((_, i) => i !== pairIdx),
    }));
  };

  const handleSave = async () => {
    if (!endpoint) return;

    setSaving(true);
    try {
      // Convertimos el UI state a MockResponse[]
      const responses: MockResponse[] = responsesUi.map((ui) =>
        buildResponseFromUiState(ui),
      );

      const payload: Partial<ApiEndpoint> = {
        method: endpoint.method,
        path: endpoint.path,
        summary: endpoint.summary,
        delayMs: endpoint.delayMs,
        enabled: endpoint.enabled,
        responses,
      };

      await ApiDefinitionsApi.updateEndpoint(endpoint.id, payload);
      alert('Endpoint guardado');
      navigate(`/apis/${apiId}`);
    } finally {
      setSaving(false);
    }
  };

  if (!api || !endpoint) {
    return (
      <div style={{ padding: '1.5rem' }}>
        <p>Cargando endpoint...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem', maxWidth: 1100, margin: '0 auto' }}>
      <h1>
        Editando endpoint:{' '}
        <code>
          [{endpoint.method}] {endpoint.path}
        </code>
      </h1>
      <p>
        API:{' '}
        <Link to={`/apis/${api.id}`}>
          {api.name} ({api.slug})
        </Link>
      </p>

      {/* Campos básicos del endpoint */}
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: '0.25rem' }}>
            Método
          </label>
          <input
            value={endpoint.method}
            onChange={(e) =>
              handleEndpointFieldChange('method', e.target.value)
            }
            style={{ width: '100%', padding: '0.4rem' }}
          />
        </div>
        <div style={{ flex: 3 }}>
          <label style={{ display: 'block', marginBottom: '0.25rem' }}>
            Path
          </label>
          <input
            value={endpoint.path}
            onChange={(e) =>
              handleEndpointFieldChange('path', e.target.value)
            }
            style={{ width: '100%', padding: '0.4rem' }}
          />
        </div>
      </div>

      <div style={{ marginTop: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.25rem' }}>
          Summary
        </label>
        <input
          value={endpoint.summary || ''}
          onChange={(e) =>
            handleEndpointFieldChange('summary', e.target.value)
          }
          style={{ width: '100%', padding: '0.4rem' }}
        />
      </div>

      <div
        style={{
          marginTop: '1rem',
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
        }}
      >
        <div>
          <label style={{ display: 'block', marginBottom: '0.25rem' }}>
            Delay (ms)
          </label>
          <input
            type="number"
            value={endpoint.delayMs ?? 0}
            onChange={(e) =>
              handleEndpointFieldChange('delayMs', Number(e.target.value))
            }
            style={{ width: 120, padding: '0.4rem' }}
          />
        </div>

        <label
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <input
            type="checkbox"
            checked={endpoint.enabled}
            onChange={(e) =>
              handleEndpointFieldChange('enabled', e.target.checked)
            }
          />
          Endpoint enabled
        </label>
      </div>

      {/* Editor visual de respuestas */}
      <hr style={{ margin: '1.5rem 0' }} />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '0.5rem',
        }}
      >
        <h2>Respuestas mock</h2>
        <button onClick={addResponse}>+ Agregar respuesta</button>
      </div>

      {responsesUi.map((resp, idx) => (
        <div
          key={resp.id}
          style={{
            border: '1px solid #ddd',
            borderRadius: 6,
            padding: '0.75rem',
            marginBottom: '1rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '0.5rem',
            }}
          >
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <strong>Respuesta #{idx + 1}</strong>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  fontSize: '0.9rem',
                }}
              >
                <input
                  type="radio"
                  name="defaultResponse"
                  checked={!!resp.base.isDefault}
                  onChange={() => handleToggleDefault(idx)}
                />
                Default
              </label>
            </div>

            <button onClick={() => removeResponse(idx)} disabled={responsesUi.length <= 1}>
              Eliminar
            </button>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div>
              <label
                style={{ display: 'block', marginBottom: '0.25rem' }}
              >
                Status
              </label>
              <input
                type="number"
                value={resp.base.status}
                onChange={(e) => handleStatusChange(idx, e.target.value)}
                style={{ width: 80, padding: '0.3rem' }}
              />
            </div>
          </div>

          <div style={{ marginTop: '0.75rem' }}>
            <label style={{ display: 'block', marginBottom: '0.25rem' }}>
              Headers (JSON)
            </label>
            <textarea
              rows={4}
              value={resp.headersText}
              onChange={(e) => handleHeadersChange(idx, e.target.value)}
              style={{
                width: '100%',
                fontFamily: 'monospace',
                fontSize: '0.85rem',
                padding: '0.5rem',
                border: '1px solid #ccc',
              }}
            />
          </div>

          <div style={{ marginTop: '0.75rem' }}>
            <label style={{ display: 'block', marginBottom: '0.25rem' }}>
              Body (JSON)
            </label>
            <textarea
              rows={8}
              value={resp.bodyText}
              onChange={(e) => handleBodyChange(idx, e.target.value)}
              style={{
                width: '100%',
                fontFamily: 'monospace',
                fontSize: '0.85rem',
                padding: '0.5rem',
                border: '1px solid #ccc',
              }}
            />
          </div>

          {/* Condiciones match */}
          <div
            style={{
              marginTop: '0.75rem',
              paddingTop: '0.75rem',
              borderTop: '1px dashed #ddd',
            }}
          >
            <strong>Condiciones (match)</strong>
            <p style={{ fontSize: '0.85rem', color: '#555' }}>
              Si las condiciones se cumplen, esta respuesta tendrá prioridad
              sobre la default. Se comparan <code>query</code> y{' '}
              <code>headers</code> del request.
            </p>

            {/* query */}
            <div style={{ marginTop: '0.5rem' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.25rem',
                }}
              >
                <span style={{ fontSize: '0.9rem' }}>
                  Query params (ej: <code>?error=1</code>)
                </span>
                <button
                  type="button"
                  onClick={() => addQueryPair(idx)}
                  style={{ fontSize: '0.8rem' }}
                >
                  + condición query
                </button>
              </div>
              {resp.queryPairs.length === 0 && (
                <p style={{ fontSize: '0.8rem', color: '#777' }}>
                  Sin condiciones de query.
                </p>
              )}
              {resp.queryPairs.map((pair, pIdx) => (
                <div
                  key={pIdx}
                  style={{
                    display: 'flex',
                    gap: '0.5rem',
                    marginBottom: '0.25rem',
                  }}
                >
                  <input
                    placeholder="clave (ej: error)"
                    value={pair.key}
                    onChange={(e) =>
                      changeQueryPair(idx, pIdx, 'key', e.target.value)
                    }
                    style={{ flex: 1, padding: '0.3rem' }}
                  />
                  <input
                    placeholder="valor (ej: 1)"
                    value={pair.value}
                    onChange={(e) =>
                      changeQueryPair(idx, pIdx, 'value', e.target.value)
                    }
                    style={{ flex: 1, padding: '0.3rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => removeQueryPair(idx, pIdx)}
                  >
                    x
                  </button>
                </div>
              ))}
            </div>

            {/* headers */}
            <div style={{ marginTop: '0.75rem' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.25rem',
                }}
              >
                <span style={{ fontSize: '0.9rem' }}>
                  Headers (ej: <code>X-Force-Error: 1</code>)
                </span>
                <button
                  type="button"
                  onClick={() => addHeaderPair(idx)}
                  style={{ fontSize: '0.8rem' }}
                >
                  + condición header
                </button>
              </div>
              {resp.headerPairs.length === 0 && (
                <p style={{ fontSize: '0.8rem', color: '#777' }}>
                  Sin condiciones de headers.
                </p>
              )}
              {resp.headerPairs.map((pair, pIdx) => (
                <div
                  key={pIdx}
                  style={{
                    display: 'flex',
                    gap: '0.5rem',
                    marginBottom: '0.25rem',
                  }}
                >
                  <input
                    placeholder="clave (ej: X-Force-Error)"
                    value={pair.key}
                    onChange={(e) =>
                      changeHeaderPair(idx, pIdx, 'key', e.target.value)
                    }
                    style={{ flex: 1, padding: '0.3rem' }}
                  />
                  <input
                    placeholder="valor (ej: 1)"
                    value={pair.value}
                    onChange={(e) =>
                      changeHeaderPair(idx, pIdx, 'value', e.target.value)
                    }
                    style={{ flex: 1, padding: '0.3rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => removeHeaderPair(idx, pIdx)}
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
        <button onClick={handleSave} disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
        <button onClick={() => navigate(`/apis/${api.id}`)}>Cancelar</button>
      </div>
    </div>
  );
};
```

---

## 3. Bloque resumen para aplicar cambios

```bash
# 1) Actualizar tipos de frontend
#   frontend/src/api/api-definitions.ts
#   - añadir ResponseMatchRule
#   - añadir campo match?: ResponseMatchRule en MockResponse

# 2) Reemplazar el editor de endpoint
#   frontend/src/pages/EndpointEditorPage.tsx
#   - pegar el nuevo editor visual de respuestas y match

# 3) Reconstruir frontend
cd frontend
npm run build
cd ..
docker compose up --build
```

Con esto, desde el admin:

* Vas a un endpoint.
* Ves varias tarjetas de respuesta.
* Puedes marcar una como **default**, cambiar el **status**, body/headers,
* y definir **reglas visuales** tipo:

  * `query.error = 1`
  * `header.X-Force-Error = 1`

El runtime ya sabe usar estas reglas (`match`) y el templating que montamos antes, así que todo queda integrado.
