# Changelog

All notable changes to this repository are documented in this file.

Format: [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/).
Versioning: [Semantic Versioning 2.0.0](https://semver.org/).

Per-chapter versioning of individual documentation files is tracked in their
YAML frontmatter (`version` field) — this changelog records only repository-level
milestones. See `docs/_meta/frontmatter.md` for the per-chapter scheme.

## [Unreleased]

## [0.1.0] — 2026-04-18

Initial public release of the documentation template.

### Added

- Root `AGENTS.md` as the entry point for AI agents; Document Map routes tasks to categories.
- `docs/architecture/` — Feature-Sliced Design 2.1 (pages-first) — 9 chapters covering layers, slices, public API, cross-imports, pages-first decision tree, import rules, checklists, examples, and routing.
- `docs/code-style/` — React + TypeScript style guide split into `universal/` (10 stack-agnostic chapters) + `variants/` (11 tool-specific chapters), selected via `PROFILE.md`.
- `docs/workflow/` — git, PR, code review, releases (4 chapters).
- `docs/security/` — secrets, input handling, dependencies (3 chapters, stack-agnostic frontend minimum).
- `docs/onboarding/` — first-day fork checklist (`01-first-fork.md`, ~60 checkboxes) and branches for monorepo / fullstack / SSR / Expo / solo scenarios (`02-common-branches.md`).
- `docs/decisions/` — 10 Architecture Decision Records explaining the template's structural choices.
- `docs/_meta/` — templates (AGENTS-category, universal chapter, variant chapter, ADR), style guide, frontmatter spec, governance, CI linter spec, agent smoke tests, and a cross-audience usage guide.
- `scripts/lint-docs.mjs` — zero-dependency Node.js linter validating frontmatter, internal links, and ADR chain integrity across all 74 markdown files.
- `.github/workflows/docs-lint.yml` — CI job running the linter on pull requests.
- `.github/PULL_REQUEST_TEMPLATE.md` — PR description template matching `docs/workflow/02-pull-requests.md`.
- `.github/ISSUE_TEMPLATE/` — bug report and feature request templates aligned with the commit convention.
- `.github/CODEOWNERS` — placeholder with example structure for per-category ownership.
- `README.md`, `CONTRIBUTING.md`, `SECURITY.md`, `LICENSE` (MIT), `.gitignore`, `.env.example`, `CHANGELOG.md`.
