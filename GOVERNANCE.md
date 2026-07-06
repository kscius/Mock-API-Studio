# Governance

## Project Leadership

Mock API Studio is maintained by the core team listed in [CODEOWNERS](.github/CODEOWNERS).

## Decision Making

- **Routine changes** (bug fixes, docs, tests): any contributor via pull request
- **Feature additions**: discussed in GitHub Issues/Discussions; approved by a code owner
- **Breaking changes**: require a major version bump and migration guide in CHANGELOG
- **Security issues**: handled privately per [SECURITY.md](SECURITY.md)

## Release Process

1. Changes land on `main` via reviewed PRs
2. Maintainers tag releases with semver (`v1.0.0`)
3. GitHub Release workflow publishes artifacts (CLI npm, Docker images)
4. CHANGELOG updated with release notes

## Becoming a Maintainer

Contributors who demonstrate sustained, high-quality contributions may be invited to join the maintainer team. There is no formal application process — consistency and community respect matter most.
