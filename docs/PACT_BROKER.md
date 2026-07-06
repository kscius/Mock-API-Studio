# Pact Broker Integration

Mock API Studio can import and publish Pact contracts through a [Pact Broker](https://docs.pact.io/pact_broker).

## Configuration

Add to `backend/.env`:

```env
PACT_BROKER_BASE_URL=https://your-broker.example.com
PACT_BROKER_TOKEN=your-bearer-token
# Or basic auth:
# PACT_BROKER_USERNAME=
# PACT_BROKER_PASSWORD=
```

Restart the backend after changing environment variables.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/admin/contract-testing/broker/status` | Check if broker is configured |
| `GET` | `/admin/contract-testing/broker/pacts?provider={name}` | List pacts for a provider |
| `POST` | `/admin/contract-testing/broker/import` | Import pact from broker into local store |
| `POST` | `/admin/contract-testing/broker/publish` | Publish local contract to broker |

### Import body

```json
{
  "apiId": "uuid",
  "consumer": "my-frontend",
  "provider": "my-api",
  "version": "1.0.0"
}
```

`version` is optional; when omitted, the latest pact for the consumer/provider pair is used.

### Publish body

```json
{
  "contractId": "consumer-provider-timestamp",
  "version": "1.0.0"
}
```

## UI

Open **Contract Testing** in the admin UI. The **Pact Broker** section supports:

- Listing remote pacts by provider name
- Importing into the selected API
- Publishing a selected local contract with a version tag

## CI usage

```bash
# Import latest consumer contract before validation
curl -X POST "$API_URL/admin/contract-testing/broker/import" \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{"apiId":"...","consumer":"web-app","provider":"products-api"}'
```
