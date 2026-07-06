# gRPC Mocking

Mock API Studio supports gRPC mocks through a **JSON gateway** that maps service/method pairs to stored mock responses.

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

## Client integration

Use the JSON gateway from tests and scripts when you do not need protobuf on the wire. For native gRPC/protobuf clients, generate stubs from your `.proto` files and point integration tests at the gateway via a thin adapter, or use HTTP-based contract tests.

Native protobuf gRPC server support is planned for a future release.

## Related

- [GraphQL tester](../frontend/src/pages/GraphQLTesterPage.tsx) — similar pattern for GraphQL
- [PACT_BROKER.md](./PACT_BROKER.md) — contract testing
