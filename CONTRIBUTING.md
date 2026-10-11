# Contributing to ai-review-railway

感谢你愿意为「铁轨冶金层」添砖加瓦。本项目本身的开发也遵循它自己的理念：**给人类 review 做承载层，也给 AI review 承载力做贡献** —— 你提交的 PR 也会被它自己预审一遍。

## 参与方式

- **修 bug / 加功能**：先开 issue 说明意图，再提 PR。
- **补文档 / 翻译**：直接提 PR，说明改动动机即可。
- **报 bug**：使用 issue 模板，附复现步骤与期望行为。
- **分享用例**：把你接入后遇到的真实场景写进 [docs/cases.md](docs/cases.md)。

## 开发约定

- **零依赖是硬约束**：核心脚本 `dist/index.js` / `src/index.js` 只允许使用 Node 内置模块（`fs`、`path`、`os`）与全局 `fetch`（Node 18+）。不要引入第三方依赖。
- **两份文件同步**：`src/index.js` 与 `dist/index.js` 必须保持一致；改完 `src` 后执行 `cp src/index.js dist/index.js`。
- **YAML 解析器是子集**：`parseYaml` 只支持嵌套 map、块/流列表、引号、注释、标量。新增配置字段时，确保它在该子集内，并补充单元测试。
- **先测试后提交**：`node --test tests/` 必须全绿；`node --check dist/index.js` 必须通过。
- **安全红线**：不得让动作 checkout / 执行 PR 代码；不得在 `observe` 模式外擅自关闭 / 合并 PR。

## 提交规范

- 使用 conventional commits：`feat:` / `fix:` / `docs:` / `test:` / `chore:`。
- 一个 PR 只做一件事，diff 保持干净（不要夹带无关格式化改动）。
- commit 信息讲清「为什么」，PR 描述讲清「根因 + 改动 + 验证」。

## PR 流程

1. Fork 本仓库，切一个扁平命名的分支（避免 `feature/xxx` 这种带斜杠的分支名，见本仓库 CI 坑点）。
2. 修改 `src/index.js`，同步 `dist/index.js`，补测试。
3. 跑 `node --test tests/` 与 `node --check dist/index.js`。
4. 提 PR，填写 AI 生成声明，等待预审报告与维护者 review。

## Code of Conduct

所有参与者须遵守 [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)。
