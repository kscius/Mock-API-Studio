# Open Source Release Checklist

This document tracks Mock API Studio readiness for public open source adoption.

## Completed

- [x] MIT LICENSE
- [x] CONTRIBUTING.md, CODE_OF_CONDUCT.md, SECURITY.md, GOVERNANCE.md
- [x] GitHub issue/PR templates
- [x] Dependabot + CodeQL workflows
- [x] Release workflow (semver tags → GitHub Release + npm CLI)
- [x] `.env.example` for backend and frontend
- [x] Health endpoint (`GET /health`)
- [x] Advanced mocking: stateful, sequence, chaos injection
- [x] Enterprise UI: organizations, contract testing, WebSockets, backup, AI mocks
- [x] AI mock generation scaffold (`POST /admin/ai/generate-mocks`)
- [x] SDK generator endpoint (`GET /admin/sdk/:apiId/:language`)

## Before v1.0.0 public release

See [PUBLISHING.md](./PUBLISHING.md) for step-by-step instructions.

- [ ] Publish `@mock-api-studio/cli` to npm (set `NPM_TOKEN` secret)
- [ ] Configure `DOCKER_USERNAME` / `DOCKER_PASSWORD` for image publishing
- [x] Add VS Code extension PNG icon (`vscode-extension/images/icon.png`)
- [ ] Publish VS Code extension to Marketplace (set `VSCE_PAT`; release workflow ready)
- [ ] Publish Terraform provider to Registry
- [x] GitHub Discussions templates (enable Discussions in repo settings)

- [x] ESLint configuration for backend and frontend
- [x] Container scanning workflow (Trivy)
- [x] Pact Broker integration (import/publish)
- [x] AI providers: OpenAI, Ollama, Anthropic + auto-documentation
- [x] Multi-region deployment guide (`docs/MULTI_REGION.md`)

## Future

- gRPC mocking
- Desktop offline app (Tauri/Electron)
