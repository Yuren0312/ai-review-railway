# Cases

Real / illustrative integration scenarios for `ai-review-railway`, showing how it turns "fracture" into "wear".

## Case 1: an AI flood hits a small team

**Situation**: a 2-maintainer library gets 12 PRs overnight from one AI agent, none with tests.

**Config**: `per_agent_per_day: 3`, `per_repo_per_day: 10`, `require_tests_for: [medium, high]`.

**Outcome**:
- The first 3 PRs pass pre-review; the 4th onward hits rate limiting, gets `needs-guarantor`, and a comment saying "this agent reached today's limit".
- Medium/high-risk PRs missing tests are flagged as blocked, awaiting a human guarantor.
- Maintainers follow the "suggested review order" to focus on high-risk PRs first; the rest queue up.

**Benefit**: maintainers are no longer drowned; capacity is concentrated on the most important PRs.

## Case 2: protecting sensitive paths from an accidental touch

**Situation**: a PR wants to tweak `.github/workflows/ci.yml` and bump a version in `package.json`.

**Outcome**: it matches `high_paths` and the dependency list, is classified `high`, and the comment explicitly lists "workflow change + dependency change" and requires a human guarantor. Merging remains a human action.

**Benefit**: the "heavy train that could crush the rails" is routed onto a separate track and a human throws the switch.

## Case 3: trial runs in a private quarry (sandbox)

**Situation**: a team wants AI to auto-fix issues, but only on `ai-sandbox/*` branches first.

**Config**: `sandbox.allow_branches: ["ai-sandbox/*"]`, `sandbox.enforce: true`.

**Outcome**: PRs from `ai-sandbox/feat-x` pass pre-review; a PR from `feature/y` is blocked by the sandbox, with a comment "please trial-run in the sandbox first".

**Benefit**: AI output is confined to a reversible, low-risk area; the cost of mistakes is controlled.

## Case 4: a false-positive appeal loop

**Situation**: a human's large change is mis-flagged as `medium` and requires a guarantor.

**Handling**: the author comments `/guarantee` (or a maintainer applies `ai-guarantor-approved`), and the guarantee is satisfied; if the rule itself is wrong, they open a "false-positive appeal" issue to improve the detection rules.

**Benefit**: false positives are correctable, and the rules keep evolving instead of being one-size-fits-all.

## Contribute a case

If you have a real integration story, submit a PR to this file or open an issue.
