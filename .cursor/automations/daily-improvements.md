# Daily Improvements Automation

Specification for the Cursor Automation that runs daily at **00:00 MST** on `kscius/Mock-API-Studio`.

> Automations are configured in [cursor.com/automations](https://cursor.com/automations) or via the `/automate` skill in Cursor Desktop. This file is the source-of-truth spec for that automation.

## Trigger

| Setting | Value |
|---------|-------|
| Type | Scheduled (cron) |
| Expression | `CRON_TZ=America/Phoenix 0 0 * * *` |
| Timezone note | `America/Phoenix` = MST year-round (no DST). For Mountain Time with DST, use `America/Denver`. |

## Repository

| Setting | Value |
|---------|-------|
| Scope | Single repository |
| Repository | `kscius/Mock-API-Studio` |
| Branch | `main` |
| Environment | Uses `.cursor/environment.json` from this repo |

## Tools to Enable

| Tool | Required | Purpose |
|------|----------|---------|
| Pull request creation | Yes (default) | Open a PR with daily improvements |
| MCP server | Yes | GitHub merge + optional security/docs MCPs |
| Memories | Yes | Track prior improvements to avoid duplicates |

## MCP Servers

Configure these in the automation's MCP tool settings:

### 1. GitHub MCP (required for auto-merge)

```json
{
  "name": "github",
  "type": "stdio",
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-github"],
  "env": {
    "GITHUB_PERSONAL_ACCESS_TOKEN": "<team-automations-service-account-token>"
  }
}
```

Required scopes: `repo`, `workflow` (to read CI status and merge PRs).

### 2. Semgrep MCP (recommended — security & code quality)

Enable the **Semgrep** plugin MCP if available in your Cursor team. Authenticate the team automations service account in Semgrep settings.

### 3. Context7 MCP (recommended — library docs)

Enable the **Context7** plugin MCP for up-to-date framework documentation when updating dependencies or refactoring.

## Permissions

| Setting | Recommended |
|---------|-------------|
| Scope | Team Owned (runs as `cursor` bot, billed to team pool) |
| GitHub | Read/write access to `kscius/Mock-API-Studio` |

## Agent Prompt

Copy the prompt below into the automation instructions:

---

You are the daily improvements agent for **Mock API Studio**, an enterprise mock API platform (NestJS backend, React frontend, CLI, VS Code extension).

### Goal

Each run, make **one focused, low-risk improvement** to the codebase, open a pull request, wait for CI, and merge it if all checks pass.

### Improvement priorities (pick ONE per run, rotate using Memories)

1. **Code quality** — fix ESLint warnings, remove dead code, improve types, add missing error handling
2. **Tests** — add or improve unit tests for uncovered modules (backend `src/`, frontend `src/`, cli)
3. **Documentation** — fix outdated README sections, add JSDoc to public APIs, improve inline comments
4. **Dependencies** — safe minor/patch updates not already handled by Dependabot (check `package-lock.json` diffs are small)
5. **Performance** — small optimizations (N+1 queries, unnecessary re-renders, caching)
6. **Developer experience** — improve scripts, error messages, or `.env.example` files

Check **Memories** to see what was improved in recent runs. Do NOT repeat the same improvement area two days in a row.

### Constraints

- All code, comments, and docs must be in **English** (project policy)
- Keep changes **small** — aim for < 200 lines changed
- Do NOT change public API contracts without tests
- Do NOT modify `prisma/schema.prisma` unless absolutely necessary
- Do NOT touch secrets, `.env` files, or CI credentials
- Follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages
- Branch name: `cursor/daily-improvement-YYYYMMDD`

### Workflow

1. **Analyze** — scan the repo for the highest-value small improvement (use `git log`, lint output, test coverage gaps)
2. **Implement** — make the change on a new branch from `main`
3. **Verify** — run relevant checks:
   - `cd backend && npm run lint && npm test` (if backend changed)
   - `cd frontend && npm run lint && npm test` (if frontend changed)
   - `cd cli && npm test` (if cli changed)
4. **Commit & push** — push the branch
5. **Open PR** — create a PR targeting `main` with:
   - Title: `chore: daily improvement — <brief description>`
   - Body: what changed, why, and which checks were run
6. **Wait for CI** — poll GitHub checks (lint, test, build) until they complete or timeout after 30 minutes
7. **Merge** — if ALL required CI checks pass:
   - Use the **GitHub MCP** `merge_pull_request` tool to squash-merge the PR
   - Delete the branch after merge
8. **If CI fails** — do NOT merge. Comment on the PR explaining the failure and leave it open for human review
9. **Update Memories** — record what improvement was made today (area, files touched, PR number)

### Quality bar

- Only merge if you are confident the change is correct and CI is green
- When in doubt, open the PR but do NOT merge — leave it for review
- Never force-merge or bypass branch protection

---

## GitHub Repository Settings (prerequisites)

For auto-merge to work reliably, configure on GitHub:

1. **Branch protection on `main`** — require CI checks to pass (the repo already has `ci.yml`)
2. **Optional: Enable auto-merge** on the repo as a fallback if GitHub MCP merge fails
3. **Allow `cursor` bot** to push branches and merge PRs (Team Owned automations push as `cursor`)

## Monitoring

- View runs at [cursor.com/automations](https://cursor.com/automations)
- Cloud agent history: [cursor.com/dashboard/cloud-agents](https://cursor.com/dashboard/cloud-agents)
- Failed merges or CI failures will leave PRs open for manual review
