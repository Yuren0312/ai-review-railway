# Metrics

The metrics emitted by `ai-review-railway` exist to let maintainers see how much "rail" they have left. They come in two layers: a **per-PR snapshot** and a **repo aggregate**.

## Per-PR snapshot (`railway-metrics.json`)

Each run writes `railway-metrics.json` into the workspace, with these fields:

```json
{
  "generated_at": "2026-10-12T00:00:00.000Z",
  "repo": "owner/repo",
  "pr": 123,
  "author": "bot-01",
  "agent": "claude-3",
  "is_ai": true,
  "risk_level": "high",
  "risk_reasons": ["dependency change: package.json", "..."],
  "rate_limited": false,
  "rate_counts": { "author_day": 0, "agent_day": 2, "repo_day": 5 },
  "guarantor_required": true,
  "guarantor_satisfied": false,
  "sandbox_allowed": true,
  "files": 3,
  "additions": 120,
  "deletions": 8,
  "ci": "success",
  "aggregate": { "...": "see below" }
}
```

## Repo aggregate (the `aggregate` field)

Computed from the latest 100 PRs:

| Metric | Meaning | How it is computed |
| --- | --- | --- |
| `acceptance_rate` | acceptance rate | merged ÷ closed |
| `rollback_rate` | rollback rate | PRs whose title matches `revert/rollback` ÷ closed |
| `avg_review_minutes` | average review time | mean of `merged_at − created_at` over merged PRs (minutes) |
| `maintainer_burden` | maintainer burden | closed-without-merge ÷ closed (approximates "wasted review") |
| `prs_recent` | sample size | number of PRs used in this aggregation |

> These are **approximate** signals for trend-watching, not precise KPIs. True rollback rate should be reconciled with deployment rollback events — a future version will add that.

## Output channels

1. **Step summary**: written to `$GITHUB_STEP_SUMMARY`, so a summary table shows up on the Actions run page.
2. **Artifact**: `railway-metrics.json` is persisted to disk; archive it with `actions/upload-artifact` in your workflow.
3. **Action outputs**: the `metrics_json` output variable for downstream steps.

## Consuming example

```yaml
- name: Archive metrics
  uses: actions/upload-artifact@v4
  with:
    name: railway-metrics
    path: railway-metrics.json
```

## Monthly issue report (planned)

`docs/roadmap.md` plans a "monthly capacity report": triggered by `workflow_dispatch` / `schedule`, it aggregates that month's metrics and opens an issue summarizing review load, acceptance rate, rollback rate, average review time, and maintainer burden, so maintainers can review "rail wear" monthly.
