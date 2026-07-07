# gRPC Mocking

Mock API Studio supports gRPC mocks through:

1. **JSON gateway** (HTTP) — quick tests and scripts
2. **Native wire server** (TCP/protobuf) — real gRPC clients (`grpcurl`, generated stubs)

## Concepts

| Field | gRPC endpoint mapping |
|-------|------------------------|
| `type` | `GRPC` |
| `path` | Service name (e.g. `users.UserService`) |
| `method` | RPC method name (e.g. `GetUser`) |
| `operationType` | `unary` (default) or `server_streaming` |
| `responses[].body` | Mock response message (object or array for streaming) |

## Invoke mock (runtime)

```http
POST /mock-grpc/{apiSlug}?workspaceId={workspaceId}
Content-Type: application/json

{
  "service": "users.UserService",
  "method": "GetUser",
  "input": { "id": "1" }
}
```

Response:

```json
{
  "service": "users.UserService",
  "method": "GetUser",
  "message": { "id": "1", "name": "Ada Lovelace" }
}
```

For `server_streaming`, `message` is an array of response objects.

## List methods

Public (no auth):

```http
GET /mock-grpc/{apiSlug}/methods?workspaceId={workspaceId}
```

Admin:

```http
GET /admin/grpc/apis/{apiId}/methods
Authorization: Bearer {jwt}
```

## Create via API

```http
POST /api-definitions/{apiId}/endpoints
Authorization: Bearer {jwt}

{
  "type": "GRPC",
  "path": "users.UserService",
  "method": "GetUser",
  "operationType": "unary",
  "summary": "Get user by id",
  "responses": [
    {
      "status": 0,
      "isDefault": true,
      "body": { "id": "1", "name": "Ada Lovelace" }
    }
  ]
}
```

## UI

Open **gRPC Mocks** in the admin UI to:

- Create mock methods for an API
- Invoke mocks against the JSON gateway
- View configured service/method pairs

## Native wire server (protobuf)

Enable in `backend/.env`:

```env
GRPC_ENABLED=true
GRPC_PORT=50051
GRPC_PROTO_STORAGE_DIR=./data/grpc-protos
```

### Import a `.proto` file (admin)

```http
POST /admin/grpc/apis/{apiId}/proto/import
Authorization: Bearer {jwt}
Content-Type: application/json

{
  "filename": "user.proto",
  "content": "syntax = \"proto3\"; ...",
  "autoCreateEndpoints": true
}
```

Enable wire mocks for the API:

```http
POST /admin/grpc/apis/{apiId}/wire/enable
{ "enabled": true }
```

### Client metadata

| Metadata key | Purpose |
|--------------|---------|
| `x-mock-api-slug` | API slug (required unless `GRPC_DEFAULT_API_SLUG` is set) |
| `x-workspace-id` | Workspace scope |

### grpcurl example

```bash
grpcurl -plaintext \
  -H "x-mock-api-slug: users-api" \
  -H "x-workspace-id: {workspaceId}" \
  -import-path ./protos -proto user.proto \
  -d '{"id":"1"}' \
  localhost:50051 users.v1.UserService/GetUser
```

### Server status

```http
GET /admin/grpc/server/status
POST /admin/grpc/server/reload
```

## Client integration

Use the JSON gateway from tests when you do not need protobuf on the wire. For native clients, import protos via admin, enable wire mode, and call the TCP server on `GRPC_PORT`.

## Related

- [GraphQL tester](../frontend/src/pages/GraphQLTesterPage.tsx) — similar pattern for GraphQL
- [PACT_BROKER.md](./PACT_BROKER.md) — contract testing
