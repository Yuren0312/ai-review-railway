# Security Policy

## Our commitment

`ai-review-railway` is itself a *review-carrying* tool, designed to run in a trusted repository context. We treat security seriously and follow these principles.

## The tool's own security boundaries

1. **Default `observe` mode**: it never closes, merges, or pushes anything.
2. **Never executes PR code**: the action does not checkout, install dependencies, or run anything that comes from a PR. It reads everything (PR description, diff stats, commit messages, check-runs) through the GitHub REST API.
3. **`pull_request_target` recommended**: this event runs in the trusted base-branch context and, combined with the no-checkout strategy, prevents malicious code from forked PRs from being executed.
4. **Least privilege**: the example workflow only requests `contents: read`, `pull-requests: write`, `issues: write`, `checks: read`, `statuses: read`.

## What to watch for when integrating

- If you switch `mode` to `enforce`, understand its "advisory blocking" semantics yourself and verify it in a private repo / sandbox branch before rolling it out.
- Do not pass a high-privilege token (e.g. one that can write to the repo or read org secrets) into the `token` input; prefer `${{ github.token }}` (scoped read-only by default).
- This tool does not store or exfiltrate credentials.

## Reporting a vulnerability

If you find a vulnerability in this tool (for example a path that leads to arbitrary code execution, privilege escalation, or bypassing repo rules), please do **not** open a public issue. Report it through a private channel to the maintainers, or describe only the impact in an issue without exploitable details. We will fix it as soon as possible and publish an advisory.

## Supported versions

| Version | Support status |
| --- | --- |
| Latest `main` branch | Actively maintained |
| Historical tags | Fix suggestions only for critical vulnerabilities |
