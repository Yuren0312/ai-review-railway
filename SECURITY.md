# Security Policy

## 安全承诺

`ai-review-railway` 本身是一个**审阅承载工具**，它被设计为在受信任的仓库上下文中运行。我们对安全问题的处理原则如下。

## 本工具自身的安全边界

1. **默认 observe 模式**：不关闭、不合并、不推送任何 PR。
2. **不执行 PR 代码**：动作不 checkout、不安装依赖、不运行来自 PR 的任何内容，全程通过 GitHub REST API 读取元数据（PR 描述、diff 统计、commit 信息、check-runs）。
3. **推荐 `pull_request_target`**：该事件在基础分支（受信任）的上下文中运行，且配合「不 checkout」策略，可避免来自 fork 的恶意 PR 代码被执行。
4. **最小权限**：示例 workflow 仅申请 `contents: read`、`pull-requests: write`、`issues: write`、`checks: read`、`statuses: read`。

## 你接入时应注意

- 如果你把 `mode` 改为 `enforce`，请自行理解其「阻断提示」语义，并在发布前于私有仓库 / 沙盒分支验证。
- 不要把高权限 token（如可写仓库、可读组织 secrets 的 PAT）传入 `token` 输入；建议始终使用 `${{ github.token }}`（默认只读，且随 workflow 作用域自动裁剪）。
- 本工具不存储、不外传任何凭据。

## 报告漏洞

如果你在本工具中发现安全漏洞（例如导致执行任意代码、权限提升、绕过仓库规则的路径），请**不要**开公开 issue，而是发送到维护者的私密渠道，或在 issue 中仅描述影响而不给出可利用细节。我们会在确认后尽快修复并发布公告。

## 受支持版本

| 版本 | 支持状态 |
| --- | --- |
| 最新 `main` 分支 | 主动维护 |
| 历史 tag | 仅在发现严重漏洞时提供修复建议 |
