# Contributing to ai-review-railway

Thanks for wanting to add to the "railway-metallurgy layer". This project's own development follows its own philosophy: **carry the load for human review, and contribute to AI-review capacity** — the PR you submit will be pre-reviewed by the very tool it changes.

## Ways to contribute

- **Fix a bug / add a feature**: open an issue describing your intent first, then open a PR.
- **Improve docs / translations**: open a PR directly, with a note on your motivation.
- **Report a bug**: use the issue template, with reproduction steps and expected behavior.
- **Share a case study**: add a real scenario to [docs/cases.md](docs/cases.md).

## Development conventions

- **Zero dependencies is a hard constraint**: the core script `dist/index.js` / `src/index.js` may only use Node built-ins (`fs`, `path`, `os`) and global `fetch` (Node 18+). Do not introduce third-party dependencies.
- **Keep the two files in sync**: `src/index.js` and `dist/index.js` must stay identical; after editing `src`, run `cp src/index.js dist/index.js`.
- **The YAML parser is a subset**: `parseYaml` supports nested maps, block/flow lists, quotes, comments, and scalars. When adding config fields, keep them within that subset and add unit tests.
- **Test before submitting**: `node --test tests/` must be green; `node --check dist/index.js` must pass.
- **Safety red lines**: the action must never checkout / execute PR code, and must never close / merge PRs outside `observe` mode.

## Commit conventions

- Use conventional commits: `feat:` / `fix:` / `docs:` / `test:` / `chore:`.
- One PR does one thing; keep the diff clean (no unrelated formatting churn).
- Commit messages explain "why"; PR descriptions explain "root cause + change + verification".

## PR workflow

1. Fork this repo and create a flat-named branch (avoid slashes like `feature/xxx` — see the CI quirks in this repo).
2. Edit `src/index.js`, sync `dist/index.js`, and add tests.
3. Run `node --test tests/` and `node --check dist/index.js`.
4. Open the PR, fill in the AI-declaration checkbox, and wait for the pre-review report and maintainer review.

## Code of Conduct

All participants must follow [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
