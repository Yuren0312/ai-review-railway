# Architecture

## Design philosophy: railway metallurgy

`ai-review-railway` does not try to implement a "perfect AI-PR review system". It provides a **lightweight, trial-ready carrying layer**, built on two premises:

1. **A maintainer's review capacity is finite** (a rail's strength and throughput are finite).
2. **AI agents can generate PRs faster than that capacity** (steam engines thundering down the line).

Its job is therefore to "turn catastrophic fracture into controllable wear", not to "decide for humans".

## Runtime model: fully API-driven, zero checkout

```
 GitHub event (pull_request_target / issue_comment)
        │
        ▼
┌───────────────────────────────┐
│  dist/index.js  (Node 20)     │
│  zero deps, single file       │
│                               │
│  1. read .ai-review-railway.yml
│  2. read PR metadata / diff   │
│  3. detect AI PR              │
│  4. rate-limit check          │
│  5. risk classification       │
│  6. guarantor check           │
│  7. sandbox allow-list        │
│  8. label + comment           │
│  9. metrics output            │
└───────────────┬───────────────┘
                │ via GitHub REST API (read-only metadata)
                ▼
   comment + label + step summary + metrics artifact
```

**Key safety decision**: the action does **not checkout**, **not install dependencies**, and **not execute any code from the PR**. All information (PR title/body, changed files, +/- lines, commit messages, check-runs) is obtained through the GitHub REST API. Combined with `pull_request_target`, this avoids executing malicious code from forked PRs.

## Module layout (logical layering within the single file)

| Module | Functions | Responsibility |
| --- | --- | --- |
| YAML parsing | `parseYaml` / `parseScalar` / `parseKeyValue` | zero-dependency YAML-subset parsing |
| glob | `globToRegExp` / `matchAny` | sensitive-path matching (`*`, `**`) |
| config | `deepMerge` + `DEFAULT_CONFIG` | user config overrides defaults |
| API client | `class Gh` | wraps `fetch` + token, returns `{status, ok, json}` |
| context | `loadContext` | assembles PR context from event JSON + API |
| AI detection | `detectAiPr` | fuses six signal families, returns `{isAi, signals, agent}` |
| rate limiting | `checkRateLimit` | counts per repo/author/agent, per day/hour |
| classification | `classifyRisk` | sensitive paths + size + tests + CI → low/medium/high |
| guarantor | `checkGuarantor` | label or `/guarantee` comment |
| sandbox | `sandboxCheck` | repo/branch/path allow-list |
| comment | `buildComment` | renders the Markdown pre-review report |
| metrics | `computeAggregateMetrics` | acceptance / rollback / avg time / burden |
| actions | `addLabel` / `addComment` / `setOutput` | apply side effects |

## Testability

All pure functions are exported via `module.exports`; `tests/railway.test.js` uses Node's built-in `node:test` + `assert` with zero dependencies. `main()` only runs when `require.main === module`, so tests never trigger side effects.

## Extension points

- **New detection signal**: push a `{type, detail}` into `signals` in `detectAiPr`.
- **New classification rule**: add a branch in `classifyRisk`.
- **New metric**: add a field in `computeAggregateMetrics`.
- **Other platforms**: `class Gh` already abstracts `api` and `route`, so it can point at GitHub Enterprise via `GITHUB_API_URL`.

## Trade-offs and limits

- **YAML is a subset**: unsupported YAML features (anchors, multi-line block scalars, complex quoting) are treated as plain strings or errors — see `parseYaml`.
- **Rate limiting relies on the PR list API**: it pages up to 100 items, so counts beyond that window may be approximate (fine for an MVP).
- **Single-file size**: ~700 lines, but logically layered — see the module table above.
