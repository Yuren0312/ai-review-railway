# 度量（Metrics）

`ai-review-railway` 输出的度量，目的是让维护者看清自己的「轨道」还剩多少承载力。度量分两层：**单 PR 快照** 与 **仓库聚合**。

## 单 PR 快照（`railway-metrics.json`）

每次运行都会在工作区写出 `railway-metrics.json`，字段如下：

```json
{
  "generated_at": "2026-10-12T00:00:00.000Z",
  "repo": "owner/repo",
  "pr": 123,
  "author": "bot-01",
  "agent": "claude-3",
  "is_ai": true,
  "risk_level": "high",
  "risk_reasons": ["依赖变更：package.json", "..."],
  "rate_limited": false,
  "rate_counts": { "author_day": 0, "agent_day": 2, "repo_day": 5 },
  "guarantor_required": true,
  "guarantor_satisfied": false,
  "sandbox_allowed": true,
  "files": 3,
  "additions": 120,
  "deletions": 8,
  "ci": "success",
  "aggregate": { "...": "见下" }
}
```

## 仓库聚合（`aggregate` 字段）

基于最近 100 个 PR 计算，口径如下：

| 指标 | 含义 | 计算方式 |
| --- | --- | --- |
| `acceptance_rate` | 接受率 | 已合并数 ÷ 已关闭数 |
| `rollback_rate` | 回滚率 | 标题含 `revert/rollback/回滚/撤销` 的 PR 数 ÷ 已关闭数 |
| `avg_review_minutes` | 平均审查时长 | 已合并 PR 的 `merged_at − created_at` 均值（分钟） |
| `maintainer_burden` | 维护者负担 | 未合并即被关闭的 PR 数 ÷ 已关闭数（近似「白看」的负担） |
| `prs_recent` | 样本量 | 本次统计的 PR 数量 |

> 这些是**近似口径**，用于趋势观察，不用于精确考核。真正的回滚率应结合部署回滚事件，后续版本会补充。

## 输出通道

1. **Step Summary**：写入 `$GITHUB_STEP_SUMMARY`，在 Actions 运行页直接看到一张汇总表。
2. **Artifact**：`railway-metrics.json` 落盘，可在 workflow 里用 `actions/upload-artifact` 归档。
3. **Action 输出**：`metrics_json` 输出变量，供后续步骤消费。

## 消费示例

```yaml
- name: 归档度量
  uses: actions/upload-artifact@v4
  with:
    name: railway-metrics
    path: railway-metrics.json
```

## 月度 Issue 报告（规划中）

`docs/roadmap.md` 里规划了「月度承载力报告」：由 `workflow_dispatch` / `schedule` 触发，聚合当月度量，自动开一个 issue 汇总 review 负载、接受率、回滚率、平均审查时长与维护者负担，让维护者按月复盘「轨道磨损」。
