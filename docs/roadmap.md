# 路线图（Roadmap）

## 已完成（MVP，v0.1.0）

- [x] 零依赖单文件核心脚本（Node 20，仅内置模块 + fetch）
- [x] AI PR 识别：标签 / 作者 / trailer / 模板勾选 / 关键词 / 生成式痕迹
- [x] 限流：按仓库 / 作者 / agent，天 / 小时，超限评论 + 标签、不关闭
- [x] 风险分级：敏感路径 / 依赖 / workflow / 权限 / 规模 / 测试 / CI → `railway:*`
- [x] 自动预审评论：摘要、等级、影响面、测试、回滚、审查顺序、阻断项、担保状态
- [x] 人类担保：`/guarantee` 评论 or `ai-guarantor-approved` 标签
- [x] 沙盒 / 白名单：仓库 / 分支 / 路径
- [x] 兜底并行 + 高风险必须人类确认
- [x] 度量：单 PR 快照 + 仓库聚合，step summary + artifact
- [x] 安全原则：默认 observe、不 checkout、不执行 PR 代码、不 spam

## 短期（v0.2）

- [ ] 月度承载力报告：`schedule` 触发，自动开 issue 汇总度量
- [ ] 多语言识别信号（中文 AI 生成关键词与句式）
- [ ] 更细的担保人绑定：指定 `guarantor.allow_users`
- [ ] `enforce` 模式的可选「请求变更」（request changes）语义
- [ ] 配置文件 schema 校验与错误提示

## 中期（v0.3+）

- [ ] 持久化限流状态（GitHub Issue 作为 KV，避免依赖 PR 列表近似计数）
- [ ] 基于 diff 内容的更细粒度风险（如检测可疑正则 / eval / 网络外联）
- [ ] 支持 GitLab / Gitee / GitCode 等平台的适配层
- [ ] 与 `github/codeql` / `dependabot` 等既有工具的协同（消费它们的输出）

## 长期愿景

- [ ] 一个「承载力面板」：可视化仓库的 review 负载曲线与维护者负担趋势
- [ ] 可插拔的「规则市场」：社区共享针对不同技术栈的规则集
- [ ] 让「铁轨冶金」成为开源社区应对 AI PR 洪水的通用底座

## 欢迎参与

任何一项都可以认领。详见 [CONTRIBUTING.md](../CONTRIBUTING.md)。
