# Mock API Studio CLI

Command-line interface for [Mock API Studio](../README.md).

## 📦 Installation

### Global Installation (npm)

```bash
npm install -g @mock-api-studio/cli
```

### From Source

```bash
cd cli
npm install
npm run build
npm link
```

## 🚀 Quick Start

### 1. Login

```bash
# Interactive login
mock-api login

# With credentials
mock-api login --email user@example.com --password yourpassword

# Using API key
mock-api login --api-key your-api-key
```

### 2. Select Workspace

```bash
# List workspaces
mock-api workspace list

# Select a workspace
mock-api workspace select my-workspace
```

### 3. Create an API

```bash
# Interactive creation
mock-api api create

# With options
mock-api api create --name "My API" --slug my-api --version 1.0.0
```

### 4. Import OpenAPI Spec

```bash
mock-api import ./swagger.json
mock-api import ./openapi.yaml --workspace workspace-id
```

## 📚 Commands

### Authentication

```bash
# Login
mock-api login [--email EMAIL] [--password PASSWORD] [--api-key KEY]

# Logout
mock-api logout

# Show config
mock-api config
```

### Workspaces

```bash
# List workspaces
mock-api workspace list

# Create workspace
mock-api workspace create [--name NAME] [--slug SLUG]

# Select workspace
mock-api workspace select <slug>
```

### APIs

```bash
# List APIs
mock-api api list [--workspace WORKSPACE_ID]

# Create API
mock-api api create [--name NAME] [--slug SLUG] [--workspace WORKSPACE_ID]

# Delete API
mock-api api delete <api-id>
```

### Import

```bash
# Import OpenAPI specification
mock-api import <file> [--workspace WORKSPACE_ID] [--dry-run]
```

## ⚙️ Configuration

The CLI stores configuration in `~/.mock-api/config.json`:

```json
{
  "apiUrl": "http://localhost:3000",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "currentWorkspace": "workspace-id-123"
}
```

### Environment Variables

- `MOCK_API_URL` - Override API base URL
- `MOCK_API_TOKEN` - Set JWT token
- `MOCK_API_KEY` - Set API key

## 🔧 Development

### Build

```bash
npm run build
```

### Run Locally

```bash
npm run dev -- login
npm run dev -- workspace list
```

### Test

```bash
npm test
```

## 📖 Examples

### Example 1: Create Complete API

```bash
# Login
mock-api login --email admin@example.com --password admin123

# Select workspace
mock-api workspace select production

# Create API
mock-api api create --name "Users API" --slug users-api

# The API is now available at:
# http://localhost:3000/mock/users-api
```

### Example 2: Import Swagger Spec

```bash
# Import OpenAPI spec
mock-api import ./petstore.json --workspace prod-workspace

# View imported APIs
mock-api api list
```

### Example 3: Quick Setup Script

```bash
#!/bin/bash

# Setup script for CI/CD
mock-api login --api-key $MOCK_API_KEY
mock-api workspace select staging
mock-api import ./api-spec.yaml
```

## 🐛 Troubleshooting

### Authentication Issues

If you get authentication errors:

```bash
# Check config
mock-api config

# Try logging in again
mock-api logout
mock-api login
```

### Connection Issues

Verify the API URL:

```bash
# Check current config
mock-api config

# Set custom API URL (if needed)
export MOCK_API_URL=https://your-mock-api.com
```

## 📄 License

MIT

## 🔗 Links

- [Main Documentation](../README.md)
- [API Reference](../backend/README.md)
- [GitHub Repository](https://github.com/your-org/mock-api-studio)

