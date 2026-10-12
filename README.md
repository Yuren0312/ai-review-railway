# 🚂 AI Review Railway — the railway-metallurgy layer

> **What it is:** `ai-review-railway` is a lightweight, zero-dependency GitHub Action that acts as a *carrying layer* for maintainer review when AI agents flood a repository with pull requests. It does **not** replace human review — it rate-limits, classifies risk, requires human guarantors for risky changes, sandboxes trial runs, and emits metrics, so that the "railway metallurgy" (maintainer review capacity) bends instead of breaking.

## In one sentence

When **AI agents (steam engines)** generate PRs in bulk, a maintainer's review capacity is the **railway metallurgy**. This project doesn't wait for a perfect review system — it runs **lightweight rules first**: rate-limiting, risk classification, allow-listing, human guarantors, sandboxing, and metrics — turning the catastrophic fracture of a PR flood into controllable everyday wear.

## The metaphor

| Real world | Railway metaphor |
| --- | --- |
| AI agents generating PRs in bulk | Steam engines thundering down the line |
| Maintainer review capacity | Railway metallurgy (the strength and throughput of the rails) |
| PR flood exceeding capacity | Rails crushed, derailment |
| Rate-limiting / classification | Distributing the load, routing heavy trains onto separate tracks |
| Sandbox / allow-list | Trial runs in a private quarry first |
| Human guarantor | A human throws the switch at critical junctions |
| AI pre-review + human final review | Steam and horses running in parallel |

## What it does

Any open-source repo can add **one GitHub Actions workflow and one config file** to get "AI-PR pre-review and capacity protection" in one go. It does not replace human review — it:

- **carries the load for human review** — every AI PR passes a lightweight gate first;
- **contributes to AI-review capacity** — it emits metrics so maintainers can see how much "rail" they have left.

## Core capabilities (MVP, shipped and tested)

| Capability | Description |
| --- | --- |
| 🔍 **Detect AI PRs** | Labels, author (Bot), commit trailers, PR-template checkboxes, keywords, generative traces |
| ⏱️ **Rate limiting** | Per repo / author / agent, per day / hour; over-limit triggers a comment + `needs-guarantor` label — **never closes** |
| 🎚️ **Risk classification** | Files changed, +/- lines, sensitive paths, dependency/workflow/permission changes, test evidence, CI status → `railway:low / medium / high` |
| 📝 **Auto pre-review comment** | Change summary, risk level, impact surface, test evidence, rollback plan, suggested review order, blockers, guarantor status |
| 🤝 **Human guarantor** | Medium/high-risk PRs must bind a human guarantor; via `/guarantee` comment or `ai-guarantor-approved` label |
| 🧪 **Sandbox / allow-list** | Only allow specific repos, branches, or paths first, e.g. `ai-sandbox/*` |
| 🐎 **Parallel fallback** | AI auto-pre-review + human final review; high risk requires human confirmation |
| 📊 **Metrics** | Review load, acceptance rate, rollback rate, avg review time, maintainer burden → artifact + step summary |
| 🛡️ **Safety principles** | Default `observe` mode; **no checkout, no executing PR code**; no bypassing repo rules; no spam |

## Quick start (30 seconds)

1. Add a config file `.ai-review-railway.yml` to your repo root (copy the [default config](./.ai-review-railway.yml)):

```yaml
enabled: true
mode: observe          # observe | enforce
limits:
  per_agent_per_day: 3
  per_repo_per_day: 10
  max_files: 20
  max_additions: 500
risk:
  high_paths:
    - ".github/workflows/**"
    - "package.json"
    - "requirements.txt"
    - "pyproject.toml"
    - "**/auth/**"
  require_tests_for: [medium, high]
guarantor:
  required_for: [medium, high]
  approved_label: "ai-guarantor-approved"
sandbox:
  allow_repos: []
  allow_branches: ["ai-sandbox/*"]
review:
  comment: true
  checklist: true
  metrics: true
```

2. Add a workflow ([example](./.github/workflows/ai-review-railway.yml)) — the key is to trigger on `pull_request_target`:

```yaml
name: AI Review Railway
on:
  pull_request_target:
    types: [opened, synchronize, reopened, labeled, unlabeled]

permissions:
  pull-requests: write
  issues: write

jobs:
  railway:
    runs-on: ubuntu-latest
    steps:
      - uses: Yuren0312/ai-review-railway@main
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
```

3. Done. Every PR now receives a "pre-review report" comment and gets a `railway:*` risk label.

> ⚠️ Note: this project **does not checkout by default**. The action reads PR metadata, diff, commits, and check-runs entirely through the GitHub REST API. Use `pull_request_target` (not `pull_request`) so code from forked PRs is never executed.

## Repository layout

```
ai-review-railway/
├── action.yml                          # Action definition (node20, entry dist/index.js)
├── dist/index.js                       # Core script (zero deps, committed ready-to-run)
├── src/index.js                        # Same source (for reading and hacking)
├── .ai-review-railway.yml              # Default config
├── .github/
│   ├── workflows/ai-review-railway.yml # Usage example
│   ├── pull_request_template.md        # PR template (with AI declaration checkbox)
│   └── ISSUE_TEMPLATE/                 # bug / feature / config / false-positive appeal
├── docs/                               # architecture, rules, metrics, roadmap, cases
├── tests/                              # zero-dependency unit tests (node:test)
└── examples/                           # config example + review-report example
```

## Local run & test

```bash
# pure-function unit tests (zero deps)
node --test tests/railway.test.js

# dry-run with a local event JSON
node dist/index.js --config .ai-review-railway.yml --local tests/fixtures/example-pr-event.json
```

## Safety commitments

- **Default `observe`**: only comment + label — never close / merge / push.
- **Never executes PR code**: no checkout, no dependency install, nothing from the PR is run.
- **Never bypasses repo rules**: it layers on top of your existing CI / branch protection.
- **No spam**: at most one comment per PR event, and it can be disabled.
- **Risk is yours to assess**: the integrating repo owns the false-positive risk; see [LICENSE](./LICENSE).

## Contributing

Welcome! Read [CONTRIBUTING.md](./CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) first. This project is itself a testbed for "carrying the load of AI PRs" — your PR will be pre-reviewed by the very tool it changes 🚂.

## License

[MIT](./LICENSE)
