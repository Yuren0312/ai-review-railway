# 🚂 AI 审查铁路 · 铁轨冶金层（ai-review-railway）

> **English abstract:** `ai-review-railway` is a lightweight, zero-dependency GitHub Action that acts as a *carrying layer* for maintainer review when AI agents flood a repository with pull requests. It does **not** replace human review — it rate-limits, classifies risk, requires human guarantors for risky changes, sandboxes trial runs, and emits metrics, so that the "railway metallurgy" (maintainer review capacity) bends instead of breaking.

## 一句话

当 **AI Agent（蒸汽机）** 批量生成 PR 时，维护者的 review 承载力就是**铁轨冶金**。这个项目不等待一套完美审查体系，而是用**轻量规则先试跑**：限流、分级、白名单、人类担保、沙盒、度量 —— 把 PR 泛滥带来的毁灭性断裂，转化成可控的日常磨损。

## 隐喻映射

| 现实世界 | 铁路隐喻 |
| --- | --- |
| AI Agent 批量生成 PR | 蒸汽机轰然驶来 |
| 维护者的 review 承载力 | 铁轨冶金（轨道的强度与产能） |
| PR 泛滥、超出承载力 | 压碎轨道、脱轨断裂 |
| 限流 / 分级 | 分散荷载、按重车分轨 |
| 沙盒 / 白名单 | 私有矿区先试跑 |
| 人类担保 | 关键道岔需人工扳道 |
| AI 预审 + 人类终审 | 蒸汽与马匹并行 |

## 它做什么

任何开源仓库，只要**加一个 GitHub Actions workflow 和一份配置文件**，就能「一下完成 AI PR 的预审与承载力保护」。它不替代人类 review，而是：

- 给**人类 review 做承载层** —— 把 AI PR 先过一次轻量闸口；
- 给 **AI review 承载力做贡献** —— 输出度量，让维护者看清自己的「轨道」还剩多少。

## 核心能力（MVP 已落地）

| 能力 | 说明 |
| --- | --- |
| 🔍 **识别 AI PR** | 标签、作者（Bot）、commit trailer、PR 模板勾选、关键词、生成式痕迹 |
| ⏱️ **限流** | 按仓库 / 作者 / AI Agent，每天 / 每小时限制；超限自动评论 + 打 `needs-guarantor`，**不直接关闭** |
| 🎚️ **风险分级** | 综合文件数、增删行数、敏感路径、依赖/workflow/权限变更、测试证据、CI 状态 → `railway:low / medium / high` |
| 📝 **自动预审评论** | 变更摘要、风险等级、影响面、测试证据、回滚方案、建议审查顺序、阻断项、担保人状态 |
| 🤝 **人类担保** | 中高风险 PR 必须绑定人类担保人；支持 `/guarantee` 评论或 `ai-guarantor-approved` 标签 |
| 🧪 **沙盒 / 白名单** | 只允许指定仓库、分支、路径先试跑，例如 `ai-sandbox/*` |
| 🐎 **兜底并行** | AI 自动预审 + 人类最终 review；高风险必须人类确认 |
| 📊 **度量** | review 负载、接受率、回滚率、平均审查时长、维护者负担 → artifact + step summary |
| 🛡️ **安全原则** | 默认 `observe` 模式；**不 checkout、不执行 PR 代码**；不绕过仓库规则；不制造 spam |

## 快速接入（30 秒）

1. 在仓库根目录加一份配置 `.ai-review-railway.yml`（复制 [默认配置](./.ai-review-railway.yml) 即可）：

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

2. 加一个 workflow（[示例](./.github/workflows/ai-review-railway.yml)），核心是用 `pull_request_target` 事件触发：

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

3. 搞定。之后每个 PR 都会收到一份「预审报告」评论，并被打上 `railway:*` 风险标签。

> ⚠️ 注意：本项目**默认不 checkout**，动作全程走 GitHub REST API 读取 PR 元数据、diff、commit、check-runs。请使用 `pull_request_target`（而非 `pull_request`）以避免执行来自 fork 的 PR 代码。

## 仓库结构

```
ai-review-railway/
├── action.yml                          # Action 定义（node20，入口 dist/index.js）
├── dist/index.js                       # 核心脚本（零依赖，提交即用）
├── src/index.js                        # 同一份源码（便于阅读与二次开发）
├── .ai-review-railway.yml              # 默认配置
├── .github/
│   ├── workflows/ai-review-railway.yml # 使用示例
│   ├── pull_request_template.md        # PR 模板（内置 AI 声明勾选）
│   └── ISSUE_TEMPLATE/                 # bug / feature / config / 误判申诉
├── docs/                               # 架构、规则、度量、路线图、案例
├── tests/                              # 零依赖单元测试（node:test）
└── examples/                           # 配置示例 + 预审报告示例
```

## 本地运行与测试

```bash
# 纯函数单元测试（零依赖）
node --test tests/railway.test.js

# 用本地事件 JSON 试跑（不调 API 时只打印，不崩溃）
node dist/index.js --config .ai-review-railway.yml --local tests/fixtures/example-pr-event.json
```

## 安全承诺

- **默认 `observe`**：只评论 + 打标签，绝不关闭 / 合并 / 推送。
- **不执行 PR 代码**：不 checkout、不安装依赖、不运行任何来自 PR 的内容。
- **不绕过仓库规则**：它叠加在仓库既有 CI / 分支保护之上，而不是取代。
- **不制造 spam**：每个 PR 每个事件最多一条评论，且可关闭。
- **试错成本自担**：接入方自行评估误判风险，本项目不承担任何决策责任（见 [LICENSE](./LICENSE)）。

## 贡献

欢迎贡献。请先阅读 [CONTRIBUTING.md](./CONTRIBUTING.md) 与 [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)。本项目本身就是「给 AI PR 做承载层」的试验田 —— 你的 PR 也会被它自己预审一遍 🚂。

## License

[MIT](./LICENSE)
