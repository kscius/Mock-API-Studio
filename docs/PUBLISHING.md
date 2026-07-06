# Publishing Guide

This document describes how to publish Mock API Studio artifacts for the v1.0.0 public release.

## Prerequisites

| Artifact | Secret / account | Notes |
|----------|------------------|-------|
| npm CLI (`@mock-api-studio/cli`) | `NPM_TOKEN` | npm account with publish access |
| Docker images | `DOCKER_USERNAME`, `DOCKER_PASSWORD` | Docker Hub or compatible registry |
| VS Code extension | `VSCE_PAT` | Azure DevOps PAT with Marketplace **Manage** scope |
| Terraform provider | GPG key + `HASHICORP_REGISTRY_TOKEN` | Optional; see HashiCorp Registry docs |

Configure repository secrets under **Settings → Secrets and variables → Actions**.

## Release flow (automated)

Pushing a semver tag (`v*.*.*`) triggers [`.github/workflows/release.yml`](../.github/workflows/release.yml):

1. GitHub Release with generated notes
2. `npm publish` for `@mock-api-studio/cli`
3. Docker images for backend and frontend
4. VS Code extension publish (when `VSCE_PAT` is set)

```bash
git tag v1.0.0
git push origin v1.0.0
```

## npm CLI (`@mock-api-studio/cli`)

Manual publish (dry run):

```bash
cd cli
npm ci
npm run build
npm pack
# Inspect the tarball, then:
npm publish --access public
```

The release workflow publishes automatically on tag push when `NPM_TOKEN` is configured.

## Docker images

Images are built on `main` (CI) and on release tags. Tags:

- `{DOCKER_USERNAME}/mock-api-studio-backend:latest`
- `{DOCKER_USERNAME}/mock-api-studio-frontend:latest`

See [docs/DOCKER.md](./DOCKER.md) for local usage.

## VS Code extension

Publisher ID: `mock-api-studio` (create at [marketplace.visualstudio.com/manage](https://marketplace.visualstudio.com/manage)).

Local package:

```bash
cd vscode-extension
npm install
npm run compile
npx vsce package
```

Publish manually:

```bash
npx vsce publish -p $VSCE_PAT
```

Requirements:

- `images/icon.png` (128×128 recommended)
- Compiled `dist/extension.js` (`npm run compile`)

## Terraform provider

The provider lives in [`terraform-provider-mock-api-studio/`](../terraform-provider-mock-api-studio/).

Local install for testing:

```bash
cd terraform-provider-mock-api-studio
go build -o terraform-provider-mock-api-studio
```

Registry publishing follows HashiCorp’s [Provider Publishing](https://developer.hashicorp.com/terraform/registry/providers/publishing) process:

1. Build for multiple platforms (`goreleaser` recommended)
2. Sign release with GPG
3. Submit provider namespace on the Terraform Registry

## GitHub Discussions

Enable **Discussions** in repository settings (**General → Features**). Templates are in [`.github/DISCUSSION_TEMPLATE/`](../.github/DISCUSSION_TEMPLATE/).

Suggested categories:

- **General** — announcements and broad topics
- **Q&A** — community support
- **Ideas** — feature requests (link to Issues for actionable items)

## Pre-release checklist

- [ ] All CI jobs green on `main`
- [ ] `CHANGELOG` or release notes reviewed
- [ ] Secrets configured (`NPM_TOKEN`, Docker, `VSCE_PAT`)
- [ ] Version bumped in `cli/package.json`, `vscode-extension/package.json`, root `package.json` if needed
- [ ] Tag `v1.0.0` created and pushed
- [ ] Verify GitHub Release artifacts and registry listings
