## 🚂 AI 审查铁路 · 预审报告

> **模式**：`observe` · **风险等级**：`railway:high` 🔴

本报告由 `ai-review-railway` 自动生成，**不替代人类 review**，只是给人类 review 做承载层。

### 变更摘要

- **PR**：#123 `chore: bump dependencies and tweak ci`
- **作者**：@gpt-bot（Bot）
- **Agent 身份**：`claude-3`
- **改动规模**：4 个文件 · +312 / −18
- **CI 状态**：`pending`

### 识别结果

⚠️ 判定为 **AI 生成 PR**，命中信号：
- `author`：作者是 Bot（gpt-bot）
- `trailer`：Generated-by: claude-3（来自 commit）
- `generative_trace`：结构化小节 3 个，符合生成式模板特征

### 风险分级

等级：**`railway:high`**
- 依赖变更：package.json, package-lock.json
- Workflow 变更：.github/workflows/ci.yml
- 该风险级别要求测试证据，但未检测到测试文件

### 影响面

```
package.json
package-lock.json
.github/workflows/ci.yml
src/auth/login.ts
```

### 测试证据

❌ 未检测到测试证据。

### 回滚方案

- 常规回滚：`git revert <merge-commit>` 或直接关闭本 PR 即可回到基线。
- 高风险：建议先在私有矿区（sandbox 分支）跑通，再逐步放量。

### 建议审查顺序

- 1. 先看 workflow / 依赖 / 权限类文件（最高风险面）
- 2. 再看核心逻辑改动
- 3. 确认测试与 CI 结果
- 4. 人类担保人签字后合入

### 阻断项

- ⛔ 缺少测试证据
- ⛔ 缺少人类担保人

### 人类担保人状态

❌ 尚未绑定人类担保人。请由人类维护者评论 `/guarantee` 或打标签 `ai-guarantor-approved` 完成担保。

### 本 PR 承载力度量

- review 负载（文件数）：`4`
- diff 体积：`+312 / −18`
- 风险等级：`railway:high`

---
<sub>这是「蒸汽机（AI Agent）」与「马匹（人类 reviewer）」并行时代的铁轨冶金层。若判断有误，人类维护者可直接关闭或纠正本 PR，本工具不会擅自关闭。</sub>
