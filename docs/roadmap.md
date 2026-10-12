# Roadmap

## Shipped (MVP, v0.1.0)

- [x] Zero-dependency single-file core (Node 20, built-ins + fetch only)
- [x] AI-PR detection: labels / author / trailers / template checkboxes / keywords / generative traces
- [x] Rate limiting: per repo / author / agent, per day / hour; over-limit → comment + label, no close
- [x] Risk classification: sensitive paths / deps / workflows / permissions / size / tests / CI → `railway:*`
- [x] Auto pre-review comment: summary, level, impact, tests, rollback, review order, blockers, guarantor status
- [x] Human guarantor: `/guarantee` comment or `ai-guarantor-approved` label
- [x] Sandbox / allow-list: repos / branches / paths
- [x] Parallel fallback + high-risk requires human confirmation
- [x] Metrics: per-PR snapshot + repo aggregate, step summary + artifact
- [x] Safety principles: default observe, no checkout, no executing PR code, no spam

## Near term (v0.2)

- [ ] Monthly capacity report: `schedule` trigger that opens an issue summarizing metrics
- [ ] Multi-language detection signals (e.g. Chinese AI-generation keywords and phrasing)
- [ ] Finer guarantor binding: `guarantor.allow_users`
- [ ] Optional "request changes" semantics in `enforce` mode
- [ ] Config schema validation with clear errors

## Mid term (v0.3+)

- [ ] Persistent rate-limit state (a GitHub issue as a KV store, avoiding the PR-list approximation)
- [ ] Finer diff-content risk (detect suspicious regex / eval / outbound network calls)
- [ ] Adapter layer for GitLab / Gitee / GitCode
- [ ] Interop with existing tools (consume outputs from `github/codeql`, `dependabot`, etc.)

## Long term

- [ ] A "capacity dashboard": visualize review-load curves and maintainer-burden trends
- [ ] A pluggable "rules marketplace": community-shared rule sets per stack
- [ ] Make "railway metallurgy" a common foundation for open-source communities facing AI PR floods

## Contribute

Any item is up for grabs — see [CONTRIBUTING.md](../CONTRIBUTING.md).
