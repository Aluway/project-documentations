# Security Policy

## Scope

This is a **documentation template**. It contains no runtime application code, no user-facing services, and no data stores. The security surface is:

1. The linter script at [`scripts/lint-docs.mjs`](scripts/lint-docs.mjs) (Node.js, zero dependencies).
2. The CI workflow at [`.github/workflows/docs-lint.yml`](.github/workflows/docs-lint.yml).
3. Documentation content that prescribes security practices — if a rule in [`docs/security/`](docs/security/) contains an unsafe recommendation, that's a security issue with this repository.

Application-level security is **out of scope** — forks are responsible for their own application security, guided by the rules at [`docs/security/`](docs/security/).

## Reporting a vulnerability

If you discover a security issue in the linter script, the CI workflow, or believe a rule in [`docs/security/`](docs/security/) is dangerous:

1. **Do NOT open a public issue.**
2. Use GitHub's private security advisory — on the repository page: *Security* → *Advisories* → *Report a vulnerability*. This opens a private discussion only visible to maintainers.
3. Include:
   - Affected file(s) and line numbers.
   - Description of the issue and its impact.
   - Suggested fix if you have one.
   - Whether you want credit in the advisory after disclosure.

## What to expect

- **Acknowledgement**: within 3 business days.
- **Assessment**: within 7 business days — maintainers confirm whether the issue is a security vulnerability or another class of defect.
- **Fix**: for confirmed vulnerabilities in the linter / CI — patch release within 14 days. For documentation-rule issues — ADR + rule update, timeline varies by scope.
- **Disclosure**: coordinated through GitHub's advisory workflow. Public disclosure follows the fix.

## Not a vulnerability

The following are **not** handled as security issues; open a regular issue instead:

- Suggestions to add new security rules not yet covered.
- Typos, formatting, or linting noise.
- Disagreements about the strength of a rule (`MUST` vs `SHOULD`) — propose through a regular PR or ADR per [`CONTRIBUTING.md`](CONTRIBUTING.md).
- Issues with secrets in **forked** projects — that's the fork's responsibility; see [`docs/security/01-secrets.md`](docs/security/01-secrets.md) section 5 for the rotation procedure.

## Secrets in this repository

This template ships with no real secrets. The [`.env.example`](.env.example) file is intentionally empty of values. If you spot something that looks like a committed secret, report it via the private security advisory — do not post the suspected secret in a public issue or PR comment.
