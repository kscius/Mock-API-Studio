# Cursor Automation Setup — Daily Improvements

This guide explains how to configure the **Daily Improvements** Cursor Automation for Mock API Studio.

## Overview

The automation runs every day at **00:00 MST** and:

1. Identifies a small, safe improvement in the codebase
2. Implements it on a new branch
3. Runs lint/tests locally
4. Opens a pull request
5. Waits for GitHub CI to pass
6. Merges the PR via GitHub MCP

## Prerequisites

- Cursor Pro/Business plan with Cloud Agents enabled
- GitHub integration connected in Cursor settings
- Read/write access to `kscius/Mock-API-Studio` for the automations service account
- A GitHub Personal Access Token (or GitHub App) with `repo` and `workflow` scopes for the GitHub MCP

## Step 1: Environment (already in repo)

This repository includes cloud agent environment configuration:

| File | Purpose |
|------|---------|
| `.cursor/environment.json` | Install command, Docker services, dev terminals |
| `.cursor/Dockerfile` | Base image with Node 20, Docker, PostgreSQL client |

Cursor resolves this automatically when the automation targets this repo. No manual environment setup is needed unless you want to create a snapshot from the [Cloud Agents dashboard](https://cursor.com/dashboard/cloud-agents#environments).

## Step 2: Create the Automation

### Option A — Cursor Dashboard (recommended)

1. Go to [cursor.com/automations/new](https://cursor.com/automations/new)
2. Configure the settings from the table below
3. Copy the agent prompt from [`.cursor/automations/daily-improvements.md`](../.cursor/automations/daily-improvements.md)
4. Save and activate

### Option B — `/automate` skill in Cursor Desktop

1. Open Cursor Desktop → Agents Window
2. Type `/automate` and describe:

   > Create a scheduled automation for kscius/Mock-API-Studio that runs daily at 00:00 MST, makes one small code improvement, opens a PR, waits for CI, and merges via GitHub MCP. Use the spec in .cursor/automations/daily-improvements.md

3. Review and confirm the generated configuration

## Configuration Reference

| Setting | Value |
|---------|-------|
| **Name** | Daily Improvements — Mock API Studio |
| **Trigger** | Scheduled |
| **Cron** | `CRON_TZ=America/Phoenix 0 0 * * *` |
| **Repository** | `kscius/Mock-API-Studio` (single repo, branch `main`) |
| **Model** | Composer 2 or latest available |
| **Permissions** | Team Owned (recommended) |

### Tools

| Tool | Enable |
|------|--------|
| Pull request creation | Yes |
| MCP server | Yes |
| Memories | Yes |
| Comment on pull request | Optional |
| Send to Slack | Optional (for notifications) |

### MCP Servers

| MCP | Purpose | How to add |
|-----|---------|------------|
| **GitHub** | `merge_pull_request`, check CI status | stdio: `npx -y @modelcontextprotocol/server-github` with `GITHUB_PERSONAL_ACCESS_TOKEN` |
| **Semgrep** | Security scanning before merge | Enable Semgrep plugin in Cursor team settings |
| **Context7** | Library documentation for refactors | Enable Context7 plugin in Cursor team settings |

> For **Team Owned** automations, configure MCP OAuth/credentials for the **team automations service account**, not your personal account.

## Schedule Timezone

| Timezone | Cron expression | Notes |
|----------|----------------|-------|
| MST (no DST) | `CRON_TZ=America/Phoenix 0 0 * * *` | Arizona — stays on MST year-round |
| MDT/MST (with DST) | `CRON_TZ=America/Denver 0 0 * * *` | Colorado — observes daylight saving |

The spec uses `America/Phoenix` for consistent 00:00 MST.

## How Auto-Merge Works

Cursor Automations do not have a native "merge PR" button. This automation uses the **GitHub MCP** `merge_pull_request` tool as documented in the [Cursor community forum](https://forum.cursor.com/t/how-to-create-auto-merge-pr-automation/156080).

Alternative approaches:

1. **GitHub native auto-merge** — enable on the repo + a second automation that approves PRs on `pull_request opened`
2. **Push directly to main** — disable PR creation tool (not recommended for this project)

## Existing Automations in This Repo

This repository does **not** contain other Cursor Automations. Related automation in the project:

| System | Schedule | Purpose |
|--------|----------|---------|
| GitHub Actions `ci.yml` | On push/PR | Lint, test, build, E2E |
| GitHub Actions `codeql.yml` | Mondays 06:00 UTC | Security analysis |
| GitHub Actions `trivy.yml` | Mondays 06:00 UTC | Container scanning |
| Dependabot | Weekly | Dependency updates |
| NestJS cron jobs | Daily 02:00 | Analytics cleanup, audit log retention |

The daily Cursor automation complements (not replaces) Dependabot and CI.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Automation runs without repo | Explicitly select `kscius/Mock-API-Studio` in repository settings (cron defaults to no repo) |
| PR created but not merged | Check GitHub MCP token has `repo` scope; verify CI checks passed |
| CI fails | PR stays open for manual review (by design) |
| Duplicate improvements | Check Memories tool is enabled; agent tracks prior runs |
| Environment install fails | Verify `.cursor/environment.json` install command; check Cloud Agents dashboard logs |

## Related Documentation

- [Cursor Automations docs](https://cursor.com/docs/cloud-agent/automations)
- [Cloud environment setup](https://cursor.com/docs/cloud-agent/setup)
- [Automation spec (prompt + MCP config)](../.cursor/automations/daily-improvements.md)
- [Contributing guide](../CONTRIBUTING.md)
