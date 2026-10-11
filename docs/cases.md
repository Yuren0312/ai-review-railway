# 案例（Cases）

这里收集 `ai-review-railway` 的真实 / 示意接入场景，帮助理解它在不同情况下如何「把断裂转成磨损」。

## 案例 1：AI 洪流冲击小团队

**背景**：一个 2 人维护的开源库，被某个 AI Agent 一夜之间开了 12 个 PR，全部没有测试。

**配置**：`per_agent_per_day: 3`、`per_repo_per_day: 10`、`require_tests_for: [medium, high]`。

**结果**：
- 前 3 个 PR 正常进入预审，第 4 个起触发限流，被打 `needs-guarantor`，评论提示「同一 agent 今日已达上限」。
- 所有中高风险 PR 因缺测试被标记阻断，等待人类担保。
- 维护者按预审报告里的「建议审查顺序」优先看高风险 PR，其余排队。

**收益**：维护者不再被洪流淹没，承载力得以集中到最关键的 PR 上。

## 案例 2：敏感路径防手滑

**背景**：一个 PR 想顺手改 `.github/workflows/ci.yml`，还带了一个 `package.json` 的版本升级。

**结果**：命中 `high_paths` 与依赖变更，风险判 `high`，评论明确列出「Workflow 变更 + 依赖变更」，并要求人类担保人签字。高风险 PR 的合并仍由人类完成。

**收益**：把「可能压碎轨道的重车」单独分轨，强制人工扳道。

## 案例 3：私有矿区试跑（沙盒）

**背景**：团队想让 AI 自动修 issue，但只想先在 `ai-sandbox/*` 分支试跑。

**配置**：`sandbox.allow_branches: ["ai-sandbox/*"]`、`sandbox.enforce: true`。

**结果**：来自 `ai-sandbox/feat-x` 的 PR 正常预审；来自 `feature/y` 的 PR 被沙盒阻断，评论提示「请先在私有矿区试跑」。

**收益**：AI 的产出被限制在可回滚的低风险区域，试错成本可控。

## 案例 4：误判申诉闭环

**背景**：一位真人的大改动 PR 被误判为 `medium` 且要求担保。

**处理**：作者在 PR 里评论 `/guarantee`（或由维护者打 `ai-guarantor-approved` 标签），担保即就位；若认为规则本身有问题，走「AI PR 误判申诉」issue 模板反馈，改进识别规则。

**收益**：误判可纠正，规则持续进化，而不是一刀切。

## 欢迎补充

如果你有真实接入案例，欢迎提交 PR 补到本文档，或开 issue 分享。
