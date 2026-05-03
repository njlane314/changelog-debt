# Changelog Debt

Detect customer-visible changes before they become changelog debt.

A pre-merge guard for customer-visible changes without release notes. It runs locally by default, emits deterministic JSON and Markdown, writes a GitHub Step Summary when used as an action, and can update one stable PR comment when requested.

## Install

```bash
pnpm add -D changelog-debt
```

Run locally:

```bash
pnpm changelog-debt scan --base origin/main --head HEAD --config .github/changelog-debt.yml --format markdown
pnpm changelog-debt scan --base origin/main --head HEAD --format json
```

## GitHub Actions

Use `actions/checkout` with full history so git comparisons are available.

```yaml
name: Changelog Debt

on:
  pull_request:

jobs:
  changelog_debt:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: pnpm/action-setup@v4
        with:
          version: 10.33.0
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - uses: njlane314/changelog-debt@v1
        with:
          mode: warn
          comment: true
```

Use `mode: fail` when findings should block the check. In `warn` mode, findings are reported but the action exits successfully unless a runtime error occurs.

## Config

Create `.github/changelog-debt.yml`:

```yaml
changelog_debt:
  visible_change_paths:
    - "openapi/**"
    - "schema.graphql"
    - "src/cli/**"
    - "src/api/public/**"
    - "src/billing/**"
    - "db/migrations/**"
    - "packages/sdk/**"
    - "app/routes/**"
  release_note_paths:
    - "CHANGELOG.md"
    - "docs/releases/**"
    - "docs/changelog/**"
    - ".changeset/**"
  docs_paths:
    - "docs/**"
    - "README.md"
  satisfy_with_labels:
    - "release-note-added"
    - "docs-updated"
  waiver_labels:
    - "no-release-note-needed"
  waiver_body_patterns:
    - "Release note waiver:"
```

## Example JSON

```json
{
  "tool": "changelog-debt",
  "version": "0.1.0",
  "base": "origin/main",
  "head": "HEAD",
  "mode": "warn",
  "summary": {
    "findings": 1,
    "errors": 1,
    "warnings": 0
  },
  "findings": [
    {
      "id": "changelog-debt:example",
      "severity": "error",
      "title": "Example finding",
      "message": "src/api/public/customers.ts is configured as customer-visible, but no changelog, docs update, release note label, or waiver was found.",
      "evidence": {},
      "recommendation": "Add a changelog/docs update or apply an approved waiver label."
    }
  ]
}
```

## Example Markdown

```markdown
Changelog Debt found 1 finding.

1. src/api/public/customers.ts is configured as customer-visible, but no changelog, docs update, release note label, or waiver was found.
   Evidence: see JSON output for matched paths and labels.
   Recommendation: Add a changelog/docs update or apply an approved waiver label.
```

## Notes

- No telemetry.
- No LLM calls.
- No source-code upload.
- No external network calls except GitHub API calls for optional PR comments.
- The hidden PR comment marker is `<!-- changelog-debt-report -->`.

## Development

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm build
pnpm build:action
```

The action bundle is written to `dist/index.js` with `@vercel/ncc`.
