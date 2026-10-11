# 架构（Architecture）

## 设计哲学：铁轨冶金

`ai-review-railway` 不试图实现一套「完美的 AI PR 审查体系」，而是提供一层**轻量、可先试跑**的承载层。它站在两个前提上：

1. **维护者的 review 承载力是有限的**（铁轨的强度与产能有限）。
2. **AI Agent 生成 PR 的速度可以远超承载力**（蒸汽机轰然驶来）。

因此，它的职责是「把毁灭性断裂转成可控磨损」，而非「替人类做决定」。

## 运行模型：纯 API 驱动，零 checkout

```
 GitHub 事件 (pull_request_target / issue_comment)
        │
        ▼
┌───────────────────────────────┐
│  dist/index.js  (Node 20)     │
│  零依赖、单文件               │
│                               │
│  1. 读取 .ai-review-railway.yml│
│  2. 读取 PR 元数据 / diff      │
│  3. 识别 AI PR                │
│  4. 限流检查                  │
│  5. 风险分级                  │
│  6. 担保人检查                │
│  7. 沙盒白名单                │
│  8. 打标签 + 评论             │
│  9. 度量输出                  │
└───────────────┬───────────────┘
                │ 走 GitHub REST API（只读元数据）
                ▼
   评论 + 标签 + step summary + metrics artifact
```

**关键安全决策**：动作**不 checkout**、**不安装依赖**、**不执行 PR 里的任何代码**。所有信息（PR 标题/正文、变更文件、增删行数、commit 信息、check-runs）都通过 GitHub REST API 获取。配合 `pull_request_target` 事件，可避免执行来自 fork 的恶意 PR 代码。

## 模块划分（单文件内逻辑分层）

| 模块 | 函数 | 职责 |
| --- | --- | --- |
| YAML 解析 | `parseYaml` / `parseScalar` / `parseKeyValue` | 零依赖 YAML 子集解析 |
| glob | `globToRegExp` / `matchAny` | 敏感路径匹配（支持 `*`、`**`） |
| 配置 | `deepMerge` + `DEFAULT_CONFIG` | 用户配置覆盖默认值 |
| API 客户端 | `class Gh` | 封装 `fetch` + token，返回 `{status, ok, json}` |
| 上下文 | `loadContext` | 从事件 JSON + API 组装 PR 上下文 |
| AI 识别 | `detectAiPr` | 六类信号融合，返回 `{isAi, signals, agent}` |
| 限流 | `checkRateLimit` | 按仓库/作者/agent、天/小时计数 |
| 分级 | `classifyRisk` | 敏感路径 + 规模 + 测试 + CI → low/medium/high |
| 担保 | `checkGuarantor` | 标签 or `/guarantee` 评论 |
| 沙盒 | `sandboxCheck` | 仓库/分支/路径白名单 |
| 评论 | `buildComment` | 生成 Markdown 预审报告 |
| 度量 | `computeAggregateMetrics` | 接受率/回滚率/平均时长/负担 |
| 动作 | `addLabel` / `addComment` / `setOutput` | 副作用落地 |

## 可测试性

所有纯函数通过 `module.exports` 导出，`tests/railway.test.js` 用 Node 内置 `node:test` + `assert` 零依赖测试。`main()` 仅在 `require.main === module` 时执行，避免测试时触发副作用。

## 扩展点

- **新增识别信号**：在 `detectAiPr` 加一个 `signals.push({type, detail})`。
- **新增分级规则**：在 `classifyRisk` 加判断分支。
- **新增度量口径**：在 `computeAggregateMetrics` 加字段。
- **接入其他平台**：`class Gh` 已抽象 `api` 与 `route`，可指向 GitHub Enterprise（`GITHUB_API_URL`）。

## 权衡与限制

- **YAML 是子集**：不支持的 YAML 特性（锚点、多行 block scalar、复杂引号）会被当作普通字符串或报错，见 `parseYaml`。
- **限流依赖 PR 列表 API**：每页最多 100 条，超出窗口的计数可能不精确（对 MVP 足够）。
- **单文件体积**：约 700 行，但逻辑分层清晰，见上述模块表。
