# Terraform Provider for Mock API Studio

Infrastructure as Code for your Mock APIs.

## Requirements

- Terraform 1.0+
- Go 1.19+ (for building from source)
- Mock API Studio instance running

## Installation

### Terraform Registry (Recommended)

```hcl
terraform {
  required_providers {
    mock_api_studio = {
      source  = "mock-api-studio/mock-api-studio"
      version = "~> 1.0"
    }
  }
}
```

### Manual Installation

1. Download the provider binary from releases
2. Place in `~/.terraform.d/plugins/` directory
3. Run `terraform init`

## Usage

```hcl
provider "mock_api_studio" {
  api_url   = "http://localhost:3000"
  api_token = var.api_token
}

resource "mock_api_studio_workspace" "dev" {
  name        = "Development"
  slug        = "dev"
  description = "Development workspace"
}

resource "mock_api_studio_api" "products" {
  workspace_id = mock_api_studio_workspace.dev.id
  name         = "Products API"
  slug         = "products"
  version      = "1.0.0"
}

resource "mock_api_studio_endpoint" "list_products" {
  api_id  = mock_api_studio_api.products.id
  method  = "GET"
  path    = "/products"
  summary = "List products"
  
  response_status = 200
  response_body   = jsonencode({
    products = "{{faker.datatype.json}}"
  })
}
```

## Resources

### `mock_api_studio_workspace`

Creates and manages a workspace.

**Arguments:**
- `name` - (Required) Workspace name
- `slug` - (Required) Unique slug
- `description` - (Optional) Workspace description

**Attributes:**
- `id` - Workspace ID

### `mock_api_studio_api`

Creates and manages an API definition.

**Arguments:**
- `workspace_id` - (Required) Workspace ID
- `name` - (Required) API name
- `slug` - (Required) Unique slug within workspace
- `version` - (Optional) API version (default: "1.0.0")
- `description` - (Optional) API description

**Attributes:**
- `id` - API ID

### `mock_api_studio_endpoint`

Creates and manages an API endpoint.

**Arguments:**
- `api_id` - (Required) API ID
- `method` - (Required) HTTP method (GET, POST, PUT, DELETE, PATCH)
- `path` - (Required) Endpoint path
- `summary` - (Optional) Endpoint description
- `response_status` - (Optional) Response status code (default: 200)
- `response_body` - (Optional) Response body as JSON string (default: "{}")

**Attributes:**
- `id` - Endpoint ID

## Data Sources

### `mock_api_studio_workspace`

Lookup workspace by slug.

```hcl
data "mock_api_studio_workspace" "prod" {
  slug = "production"
}
```

### `mock_api_studio_api`

Lookup API by slug.

```hcl
data "mock_api_studio_api" "users" {
  slug = "users-api"
}
```

## Environment Variables

- `MOCK_API_STUDIO_URL` - Default API URL
- `MOCK_API_STUDIO_TOKEN` - API authentication token

## Examples

See [`examples/`](examples/) directory for complete examples.

## Development

### Building

```bash
go build -o terraform-provider-mock-api-studio
```

### Testing

```bash
go test ./...
```

### Installing Locally

```bash
make install
```

## License

MIT

