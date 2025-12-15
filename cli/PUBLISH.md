# Publishing CLI to npm

This guide explains how to publish `@mock-api-studio/cli` to npm.

## Prerequisites

1. **npm Account**: You need an npm account. Create one at https://www.npmjs.com/signup
2. **npm Login**: Log in to npm from your terminal:
   ```bash
   npm login
   ```

## Pre-publish Checklist

### 1. Update Version

Update the version in [`package.json`](package.json) following semantic versioning:

```bash
cd cli
npm version patch  # for bug fixes (1.0.0 -> 1.0.1)
npm version minor  # for new features (1.0.0 -> 1.1.0)
npm version major  # for breaking changes (1.0.0 -> 2.0.0)
```

### 2. Run Tests

Ensure all tests pass:

```bash
npm test
```

Expected output:
```
Test Suites: 1 passed, 1 total
Tests:       8 passed, 8 total
```

### 3. Build the Package

Compile TypeScript to JavaScript:

```bash
npm run build
```

This creates the `dist/` directory with compiled code.

### 4. Test Installation Locally

Test the CLI locally before publishing:

```bash
npm link
```

Then try running:

```bash
mock-api --version
mock-api --help
```

Unlink when done testing:

```bash
npm unlink -g @mock-api-studio/cli
```

### 5. Verify Package Contents

Check what will be published:

```bash
npm pack --dry-run
```

Ensure the following are included:
- `dist/` directory
- `package.json`
- `README.md`
- `LICENSE`

Ensure the following are **excluded** (via `.npmignore`):
- `src/` directory (TypeScript source)
- `node_modules/`
- `*.spec.ts` test files
- `.git` directory

## Publishing

### 1. Publish to npm

```bash
npm publish --access public
```

> **Note**: `--access public` is required for scoped packages like `@mock-api-studio/cli`.

### 2. Verify Publication

Check that the package is live:

```bash
npm view @mock-api-studio/cli
```

### 3. Test Installation from npm

Install globally from npm:

```bash
npm install -g @mock-api-studio/cli
```

Test the installed CLI:

```bash
mock-api --version
mock-api login --help
```

## Post-publish Tasks

### 1. Create Git Tag

Tag the release in Git:

```bash
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

### 2. Update Documentation

Update the main [`README.md`](../README.md) with installation instructions:

```markdown
## CLI Installation

\`\`\`bash
npm install -g @mock-api-studio/cli
\`\`\`

## Quick Start

\`\`\`bash
mock-api login
mock-api workspace list
mock-api api create
\`\`\`
```

### 3. Create GitHub Release

Create a release on GitHub with:
- Release notes from [`CHANGELOG.md`](../CHANGELOG.md)
- Binary assets (optional)
- Link to npm package

## Troubleshooting

### Error: "Package name already exists"

If the package name is taken, you need to:
1. Change the name in `package.json` to something unique
2. Update all references in documentation
3. Retry publishing

### Error: "You must be logged in to publish packages"

Run `npm login` and authenticate.

### Error: "You do not have permission to publish"

Ensure you have publishing rights to the `@mock-api-studio` scope or use a different scope.

## Automated Publishing (CI/CD)

For automated publishing via GitHub Actions:

1. Generate npm token:
   ```bash
   npm token create
   ```

2. Add token to GitHub Secrets as `NPM_TOKEN`

3. Create workflow `.github/workflows/publish-cli.yml`:

```yaml
name: Publish CLI

on:
  release:
    types: [published]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20.x'
          registry-url: 'https://registry.npmjs.org'
      
      - name: Install dependencies
        run: cd cli && npm ci
      
      - name: Run tests
        run: cd cli && npm test
      
      - name: Build
        run: cd cli && npm run build
      
      - name: Publish to npm
        run: cd cli && npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## Support

For issues with publishing:
- npm support: https://docs.npmjs.com/
- GitHub issues: https://github.com/your-org/mock-api-studio/issues

