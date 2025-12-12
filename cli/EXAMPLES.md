# Mock API Studio CLI - Examples

This document provides practical examples for using the Mock API Studio CLI in real-world scenarios.

## 🎯 Common Workflows

### 1. First Time Setup

```bash
# Install CLI globally
npm install -g @mock-api-studio/cli

# Or install from source
cd cli
npm install
npm run build
npm link

# Login to your Mock API Studio instance
mock-api login --email admin@example.com --password yourpassword

# List available workspaces
mock-api workspace list

# Select your workspace
mock-api workspace select production
```

### 2. Create a New API from Scratch

```bash
# Create a workspace
mock-api workspace create --name "My Team" --slug my-team

# Select the workspace
mock-api workspace select my-team

# Create an API
mock-api api create \
  --name "Users API" \
  --slug users-api \
  --version 1.0.0 \
  --description "User management endpoints"

# Your mock API is now available at:
# http://localhost:3000/mock/users-api
```

### 3. Import Existing OpenAPI Specification

```bash
# From a local file
mock-api import ./swagger.json

# From a YAML file
mock-api import ./openapi.yaml

# With specific workspace
mock-api import ./petstore.json --workspace prod-workspace

# Dry run (preview without creating)
mock-api import ./spec.yaml --dry-run
```

### 4. List and Manage APIs

```bash
# List all APIs in current workspace
mock-api api list

# List APIs in a specific workspace
mock-api api list --workspace workspace-id-123

# Delete an API
mock-api api delete api-id-456
```

## 🔧 CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy Mock API

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install CLI
        run: npm install -g @mock-api-studio/cli
      
      - name: Login to Mock API Studio
        run: mock-api login --api-key ${{ secrets.MOCK_API_KEY }}
      
      - name: Select Workspace
        run: mock-api workspace select staging
      
      - name: Import API Specification
        run: mock-api import ./openapi.yaml
      
      - name: List APIs
        run: mock-api api list
```

### GitLab CI Example

```yaml
deploy-mock:
  stage: deploy
  image: node:18
  script:
    - npm install -g @mock-api-studio/cli
    - mock-api login --api-key $MOCK_API_KEY
    - mock-api workspace select $CI_ENVIRONMENT_NAME
    - mock-api import ./api-spec.json
  only:
    - main
```

### Jenkins Pipeline Example

```groovy
pipeline {
    agent any
    
    stages {
        stage('Deploy Mock API') {
            steps {
                sh '''
                    npm install -g @mock-api-studio/cli
                    mock-api login --api-key ${MOCK_API_KEY}
                    mock-api workspace select production
                    mock-api import ./swagger.json
                '''
            }
        }
    }
}
```

## 🐳 Docker Integration

### Dockerfile for CLI Automation

```dockerfile
FROM node:18-alpine

# Install CLI
RUN npm install -g @mock-api-studio/cli

# Copy API specs
COPY ./specs /app/specs

WORKDIR /app

# Run import script
CMD ["sh", "-c", "mock-api login --api-key $API_KEY && mock-api import /app/specs/openapi.yaml"]
```

### Docker Compose with CLI

```yaml
version: '3.8'

services:
  mock-api-importer:
    image: node:18-alpine
    command: >
      sh -c "
        npm install -g @mock-api-studio/cli &&
        mock-api login --api-key $$API_KEY &&
        mock-api workspace select $$WORKSPACE &&
        mock-api import /specs/openapi.yaml
      "
    environment:
      - API_KEY=${MOCK_API_KEY}
      - WORKSPACE=production
    volumes:
      - ./specs:/specs
```

## 📦 Bulk Operations

### Import Multiple API Specs

```bash
#!/bin/bash

# Import multiple OpenAPI specs
for file in ./specs/*.{json,yaml,yml}; do
  if [ -f "$file" ]; then
    echo "Importing $file..."
    mock-api import "$file" --workspace production
  fi
done
```

### Create Multiple Workspaces

```bash
#!/bin/bash

# Create workspaces for different teams
teams=("frontend" "backend" "mobile" "qa")

for team in "${teams[@]}"; do
  echo "Creating workspace for $team..."
  mock-api workspace create \
    --name "${team^} Team" \
    --slug "$team-team" \
    --description "Workspace for $team development"
done
```

## 🔑 Authentication Strategies

### Using JWT Token

```bash
# Interactive login
mock-api login

# With credentials
mock-api login --email user@example.com --password secret123

# Check current config
mock-api config
```

### Using API Key

```bash
# Login with API key
mock-api login --api-key your-api-key-here

# Set via environment variable
export MOCK_API_KEY=your-api-key
mock-api login --api-key $MOCK_API_KEY
```

### Multiple Environments

```bash
# Production
MOCK_API_URL=https://prod-mock-api.com mock-api login --api-key $PROD_KEY

# Staging
MOCK_API_URL=https://staging-mock-api.com mock-api login --api-key $STAGING_KEY

# Development
mock-api login --api-key $DEV_KEY
```

## 🧪 Testing Integration

### Pre-commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

echo "Validating OpenAPI spec..."
mock-api import ./openapi.yaml --dry-run

if [ $? -eq 0 ]; then
  echo "✓ OpenAPI spec is valid"
  exit 0
else
  echo "✗ OpenAPI spec validation failed"
  exit 1
fi
```

### E2E Test Setup

```javascript
// test/setup.js
const { execSync } = require('child_process');

before(async () => {
  // Login and import test API
  execSync('mock-api login --api-key test-key');
  execSync('mock-api workspace select test');
  execSync('mock-api import ./test/fixtures/api.json');
});

after(() => {
  // Cleanup
  execSync('mock-api logout');
});
```

## 📊 Monitoring and Reporting

### Get API Statistics

```bash
#!/bin/bash

echo "=== Mock API Studio Report ==="
echo ""

echo "Workspaces:"
mock-api workspace list

echo ""
echo "APIs in Production:"
mock-api api list --workspace production

echo ""
echo "Configuration:"
mock-api config
```

## 🔄 Migration Scripts

### Migrate from Old System

```bash
#!/bin/bash

# Export from old system (pseudo-code)
old-system export --output old-apis.json

# Transform to OpenAPI format
node transform-to-openapi.js old-apis.json > openapi.yaml

# Import to Mock API Studio
mock-api login --api-key $API_KEY
mock-api workspace create --name "Migrated APIs" --slug migrated
mock-api workspace select migrated
mock-api import openapi.yaml

echo "Migration complete!"
```

## 🎓 Learning Examples

### Example 1: Quick Prototype

```bash
# Create a quick prototype API
mock-api login
mock-api workspace create --name "Prototype" --slug proto
mock-api workspace select proto
mock-api api create --name "Demo API" --slug demo
```

### Example 2: Team Collaboration

```bash
# Setup for team collaboration
mock-api login
mock-api workspace create \
  --name "Team Alpha" \
  --slug team-alpha \
  --description "Collaborative workspace for Team Alpha"

# Share the workspace slug with team members
echo "Team members can now run:"
echo "mock-api workspace select team-alpha"
```

### Example 3: Environment Parity

```bash
# Import same spec to multiple environments
for env in dev staging prod; do
  mock-api workspace select $env
  mock-api import ./api-spec.yaml
  echo "Imported to $env"
done
```

## 🛠️ Troubleshooting

### Debug Mode

```bash
# Enable verbose logging (if implemented)
DEBUG=* mock-api api list

# Check configuration
mock-api config

# Test connectivity
curl http://localhost:3000/health
```

### Reset Configuration

```bash
# Logout and clear config
mock-api logout

# Verify config cleared
mock-api config

# Login again
mock-api login
```

## 📚 Additional Resources

- [CLI README](./README.md)
- [Main Documentation](../README.md)
- [API Reference](../backend/README.md)
- [Contributing Guidelines](../CONTRIBUTING.md)

