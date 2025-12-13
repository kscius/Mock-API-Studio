# GitHub Actions Integration Guide

This guide shows you how to automate your Mock API Studio workflows using GitHub Actions.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Basic Workflow Example](#basic-workflow-example)
- [Import OpenAPI Spec](#import-openapi-spec)
- [Export and Backup APIs](#export-and-backup-apis)
- [Environment-Specific Deployments](#environment-specific-deployments)
- [Advanced Examples](#advanced-examples)

## Overview

Mock API Studio provides REST APIs that can be integrated into your CI/CD pipelines. You can:

- **Import OpenAPI specifications** automatically when they change
- **Update mock endpoints** as part of your deployment process
- **Run integration tests** against mock APIs
- **Backup and version** your API definitions
- **Deploy to multiple environments** (dev, staging, prod)

## Prerequisites

1. **API Token**: Generate an API key from Mock API Studio
   - Go to **Settings** → **API Keys**
   - Create a new key with appropriate scopes (e.g., `write:apis`, `read:endpoints`)
   - Copy the key value

2. **GitHub Secret**: Store your API token securely
   - Go to your repository → **Settings** → **Secrets and variables** → **Actions**
   - Click **New repository secret**
   - Name: `MOCK_API_TOKEN`
   - Value: Your API key

3. **Base URL**: Note your Mock API Studio instance URL
   - Local: `http://localhost:3000`
   - Production: `https://your-mock-api-studio.com`

## Basic Workflow Example

Create `.github/workflows/mock-api-sync.yml`:

```yaml
name: Sync Mock API

on:
  push:
    branches: [main]
    paths:
      - 'api-spec/**'

jobs:
  sync-api:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Import OpenAPI to Mock API Studio
        run: |
          curl -X POST ${{ secrets.MOCK_API_URL }}/admin/api-definitions/import/openapi \
            -H "Authorization: Bearer ${{ secrets.MOCK_API_TOKEN }}" \
            -H "Content-Type: multipart/form-data" \
            -F "file=@./api-spec/openapi.yaml" \
            -F "workspaceId=${{ secrets.WORKSPACE_ID }}"
```

## Import OpenAPI Spec

### Workflow: Import on Spec Change

```yaml
name: Import OpenAPI Spec

on:
  push:
    paths:
      - 'openapi.yaml'
      - 'openapi.json'

jobs:
  import-spec:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Upload OpenAPI Spec
        run: |
          curl -X POST ${{ secrets.MOCK_API_URL }}/admin/api-definitions/import/openapi?workspaceId=${{ secrets.WORKSPACE_ID }} \
            -H "Authorization: Bearer ${{ secrets.MOCK_API_TOKEN }}" \
            -F "file=@./openapi.yaml"
        env:
          MOCK_API_URL: ${{ secrets.MOCK_API_URL }}
          MOCK_API_TOKEN: ${{ secrets.MOCK_API_TOKEN }}
          WORKSPACE_ID: ${{ secrets.WORKSPACE_ID }}

      - name: Notify Slack on Success
        if: success()
        run: |
          curl -X POST ${{ secrets.SLACK_WEBHOOK_URL }} \
            -H 'Content-Type: application/json' \
            -d '{"text":"✅ Mock API updated successfully from OpenAPI spec!"}'

      - name: Notify Slack on Failure
        if: failure()
        run: |
          curl -X POST ${{ secrets.SLACK_WEBHOOK_URL }} \
            -H 'Content-Type: application/json' \
            -d '{"text":"❌ Failed to update Mock API from OpenAPI spec"}'
```

## Export and Backup APIs

### Workflow: Daily Backup

```yaml
name: Backup Mock APIs

on:
  schedule:
    - cron: '0 2 * * *' # Run daily at 2 AM UTC
  workflow_dispatch: # Allow manual trigger

jobs:
  backup-apis:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Export All APIs
        run: |
          # Get list of APIs
          APIS=$(curl -s -H "Authorization: Bearer ${{ secrets.MOCK_API_TOKEN }}" \
            ${{ secrets.MOCK_API_URL }}/admin/api-definitions | jq -r '.data[].id')
          
          mkdir -p backups
          
          # Export each API
          for API_ID in $APIS; do
            curl -s -H "Authorization: Bearer ${{ secrets.MOCK_API_TOKEN }}" \
              ${{ secrets.MOCK_API_URL }}/admin/api-definitions/$API_ID/export \
              > backups/api-$API_ID.json
          done

      - name: Commit Backups
        run: |
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git add backups/
          git commit -m "Automated backup: $(date +'%Y-%m-%d')" || echo "No changes"
          git push
```

## Environment-Specific Deployments

### Workflow: Deploy to Multiple Environments

```yaml
name: Deploy Mock APIs

on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Target environment'
        required: true
        type: choice
        options:
          - dev
          - staging
          - prod

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: ${{ github.event.inputs.environment }}
    steps:
      - uses: actions/checkout@v3

      - name: Set Environment Variables
        run: |
          case ${{ github.event.inputs.environment }} in
            dev)
              echo "MOCK_API_URL=${{ secrets.DEV_MOCK_API_URL }}" >> $GITHUB_ENV
              echo "WORKSPACE_ID=${{ secrets.DEV_WORKSPACE_ID }}" >> $GITHUB_ENV
              ;;
            staging)
              echo "MOCK_API_URL=${{ secrets.STAGING_MOCK_API_URL }}" >> $GITHUB_ENV
              echo "WORKSPACE_ID=${{ secrets.STAGING_WORKSPACE_ID }}" >> $GITHUB_ENV
              ;;
            prod)
              echo "MOCK_API_URL=${{ secrets.PROD_MOCK_API_URL }}" >> $GITHUB_ENV
              echo "WORKSPACE_ID=${{ secrets.PROD_WORKSPACE_ID }}" >> $GITHUB_ENV
              ;;
          esac

      - name: Import API Spec
        run: |
          curl -X POST $MOCK_API_URL/admin/api-definitions/import/openapi?workspaceId=$WORKSPACE_ID \
            -H "Authorization: Bearer ${{ secrets.MOCK_API_TOKEN }}" \
            -F "file=@./api-specs/${{ github.event.inputs.environment }}.yaml"

      - name: Run Smoke Tests
        run: |
          # Test that the API is responding
          STATUS=$(curl -s -o /dev/null -w "%{http_code}" $MOCK_API_URL/health)
          if [ $STATUS -ne 200 ]; then
            echo "Health check failed"
            exit 1
          fi
```

## Advanced Examples

### Workflow: Validate OpenAPI Before Merge

```yaml
name: Validate OpenAPI

on:
  pull_request:
    paths:
      - 'openapi.yaml'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Validate OpenAPI Spec
        run: |
          RESPONSE=$(curl -X POST ${{ secrets.MOCK_API_URL }}/admin/api-definitions/import/openapi?workspaceId=${{ secrets.WORKSPACE_ID }}&preview=true \
            -H "Authorization: Bearer ${{ secrets.MOCK_API_TOKEN }}" \
            -F "file=@./openapi.yaml")
          
          # Check for errors
          if echo "$RESPONSE" | jq -e '.success == false' > /dev/null; then
            echo "❌ OpenAPI validation failed:"
            echo "$RESPONSE" | jq '.message'
            exit 1
          fi
          
          echo "✅ OpenAPI spec is valid"
          echo "$RESPONSE" | jq '.preview'

      - name: Comment on PR
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '✅ OpenAPI spec validated successfully!'
            })
```

### Workflow: Integration Tests with Mock API

```yaml
name: Integration Tests

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install Dependencies
        run: npm ci

      - name: Update Mock API
        run: |
          curl -X POST ${{ secrets.MOCK_API_URL }}/admin/api-definitions/import/openapi?workspaceId=${{ secrets.WORKSPACE_ID }} \
            -H "Authorization: Bearer ${{ secrets.MOCK_API_TOKEN }}" \
            -F "file=@./openapi.yaml"

      - name: Run Integration Tests
        env:
          API_BASE_URL: ${{ secrets.MOCK_API_URL }}/mock/my-api
        run: npm run test:integration

      - name: Publish Test Results
        uses: dorny/test-reporter@v1
        if: always()
        with:
          name: Integration Test Results
          path: test-results/**/*.xml
          reporter: jest-junit
```

## Available API Endpoints

### Import/Export

- `POST /admin/api-definitions/import/openapi` - Import OpenAPI spec
- `GET /admin/api-definitions/:id/export` - Export API definition
- `GET /admin/api-definitions/:id/export/postman` - Export Postman collection
- `GET /admin/api-definitions/:id/export/insomnia` - Export Insomnia collection

### Management

- `GET /admin/api-definitions` - List all APIs
- `POST /admin/api-definitions` - Create API
- `PATCH /admin/api-definitions/:id` - Update API
- `DELETE /admin/api-definitions/:id` - Delete API

### Endpoints

- `GET /admin/api-definitions/:apiId/endpoints` - List endpoints
- `POST /admin/api-definitions/:apiId/endpoints` - Create endpoint
- `PATCH /admin/endpoints/:id` - Update endpoint
- `DELETE /admin/endpoints/:id` - Delete endpoint

## Tips and Best Practices

1. **Use Preview Mode**: Add `?preview=true` to test imports without applying changes
2. **Workspace Isolation**: Use different workspaces for dev, staging, and prod
3. **Version Control**: Keep OpenAPI specs in version control alongside code
4. **Error Handling**: Always check response status and handle errors gracefully
5. **Rate Limiting**: Be mindful of API rate limits in automated workflows
6. **Secrets Management**: Never commit API tokens; always use GitHub Secrets
7. **Notifications**: Set up Slack/email notifications for important events
8. **Testing**: Run validation checks before deploying to production

## Troubleshooting

### Authentication Errors

If you get 401 Unauthorized:
- Verify your API token is correct
- Check that the token has the required scopes
- Ensure the token hasn't expired

### Import Failures

If OpenAPI import fails:
- Validate your OpenAPI spec locally first
- Use preview mode to see detailed error messages
- Check that the workspace ID is correct

### Network Issues

If requests timeout:
- Verify the Mock API Studio URL is accessible from GitHub Actions
- Check for firewall rules blocking GitHub Actions IPs
- Consider using a self-hosted runner if behind a firewall

## Support

For more information:
- **Documentation**: [Mock API Studio Docs](../README.md)
- **API Reference**: See OpenAPI spec at `/api-docs`
- **GitHub Issues**: Report bugs or request features

---

**Happy Automating! 🚀**

