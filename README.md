# project-documentations

[![Docs Lint](https://github.com/Aluway/project-documentations/actions/workflows/docs-lint.yml/badge.svg)](https://github.com/Aluway/project-documentations/actions/workflows/docs-lint.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen.svg)](package.json)
[![Template](https://img.shields.io/badge/repo-template-orange.svg)](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-repository-from-a-template)

Documentation standards template for AI-agent-assisted frontend projects. This repository ships architectural, stylistic, and process conventions that a concrete project forks and customizes via [`docs/code-style/PROFILE.md`](docs/code-style/PROFILE.md) and per-project ADRs.

**The entry point for AI agents is [`AGENTS.md`](AGENTS.md).** Humans are encouraged to start there too.

---

## What's inside

```
AGENTS.md                         # hub — start here
docs/
  architecture/                   # Feature-Sliced Design 2.1 (pages-first)
  code-style/                     # React + TypeScript
    universal/                    # stack-agnostic rules (always active)
    variants/                     # tool-specific rules (activated via PROFILE.md)
    PROFILE.md                    # stack profile — fill on fork
  workflow/                       # git, PR, code review, releases
  decisions/                      # ADRs — the "why" behind rules
  _meta/                          # templates, style guide, governance, linter spec
scripts/
  lint-docs.mjs                   # zero-dep documentation linter
.github/workflows/docs-lint.yml   # CI job running the linter on PRs
```

Every `.md` under `docs/**` (plus the root `AGENTS.md`) carries a YAML frontmatter with `version`, `last-reviewed`, `status` — see [`docs/_meta/frontmatter.md`](docs/_meta/frontmatter.md).

---

## Using this template

### One-command install (recommended)

From the target project root:

```bash
# Brand-new project:
mkdir my-project && cd my-project && git init -b main
npx github:Aluway/project-documentations

# Add into an existing project:
cd my-existing-project
npx github:Aluway/project-documentations
```

The installer:
- Copies `docs/`, `scripts/`, `.github/`, `AGENTS.md`, `CONTRIBUTING.md`, `SECURITY.md`, `.env.example`, `.gitattributes` — **only if not already present**.
- **Smart-merges `package.json`**: your values always win; template adds missing scripts (`lint`, `lint:docs`) and dev-tooling scaffolds.
- **Never overwrites** existing `README.md`, `CHANGELOG.md`, `LICENSE`, `.gitignore` — these are project-specific.
- Prints a summary of what was copied, merged, and skipped.

Flags: `--dry-run`, `--force`, `--target=PATH`. See [`scripts/install.mjs`](scripts/install.mjs) header for details.

### GitHub "Use this template" button

Alternatively, for a brand-new GitHub repo: click **Use this template** on this page → **Create a new repository**. Then clone and continue with the onboarding below.

### After install — day-1 checklist

**Start here:** [`docs/onboarding/01-first-fork.md`](docs/onboarding/01-first-fork.md) — ~15-step checklist from clone to first green-linter commit, plus branches for monorepo / fullstack / SSR / Expo / solo.

1. Fill [`docs/code-style/PROFILE.md`](docs/code-style/PROFILE.md) with your actual stack.
2. Review [ADRs](docs/decisions/) — any decision not matching your project is overridden by a new ADR with `supersedes: <id>`.
3. Run `npm run lint` before every docs commit. The linter validates frontmatter, internal links, and ADR chain integrity.
4. The GitHub Actions workflow at [`.github/workflows/docs-lint.yml`](.github/workflows/docs-lint.yml) runs the linter on every PR touching docs.

---

## Quick commands

```bash
# Install (no runtime dependencies; Node 20+ required)
npm install

# Lint all documentation
npm run lint

# Equivalent direct call
node scripts/lint-docs.mjs
```

The linter spec lives in [`docs/_meta/ci-linter.md`](docs/_meta/ci-linter.md). It exits `0` on success, `1` on violations, `2` on internal errors.

---

## Conventions in one screen

- **Language:** code, identifiers, commit messages, and this README are in English; chapters in `docs/<category>/**` are in Russian. See [ADR 0006](docs/decisions/0006-language-policy.md).
- **Rule keywords:** RFC 2119 (`MUST`, `SHOULD`, `MAY`, `MUST NOT`, `SHOULD NOT`), always uppercase and bold. See [ADR 0004](docs/decisions/0004-rfc-2119-keywords.md).
- **Rule authority:** chapters are authoritative; category `AGENTS.md` files are navigation + invariant summaries. See [ADR 0001](docs/decisions/0001-agents-hub-navigation.md).
- **Style vs architecture:** where the code lives — [`docs/architecture/`](docs/architecture/AGENTS.md). How the code is written — [`docs/code-style/`](docs/code-style/AGENTS.md).
- **Process:** git, PR, review, releases — [`docs/workflow/`](docs/workflow/AGENTS.md).
- **Typography:** long dash `—`, Russian quotes `«»`, no `§` (use «раздел N»). See [`docs/_meta/style-guide.md`](docs/_meta/style-guide.md).

---

## Contributing

Open a PR following [`docs/workflow/02-pull-requests.md`](docs/workflow/02-pull-requests.md). Review protocol: [`docs/workflow/03-code-review.md`](docs/workflow/03-code-review.md). Structural changes (new category, schema change) require an ADR — see [`docs/_meta/governance.md`](docs/_meta/governance.md) раздел 4 and [`docs/_meta/templates/ADR.md`](docs/_meta/templates/ADR.md).

## License

This template is released under the **MIT License** — see [`LICENSE`](LICENSE). Forks may keep MIT, switch to another OSS license, or go proprietary; see [`docs/onboarding/01-first-fork.md`](docs/onboarding/01-first-fork.md) step 6 for guidance.

The generic patterns this template references (Feature-Sliced Design, RFC 2119, Keep a Changelog, Semver) have their own sources and are out of scope of this license — see category `README.md` files for attribution.
