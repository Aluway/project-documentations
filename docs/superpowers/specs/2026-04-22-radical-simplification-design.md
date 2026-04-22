# Radical Simplification of project-documentations

**Date:** 2026-04-22
**Status:** approved (design)
**Author:** brainstormed with AI assistant

## Problem

The repository has grown into a multi-category documentation system with 73 markdown files, ~7 600 lines, a 312-line installer, a 300-line docs linter, CI workflows, ADR chain, governance, templates, frontmatter spec, and stack-specific style variants. Most of this infrastructure exists to keep the multi-category system coherent. For a solo-maintained template the maintenance cost is disproportionate to the value.

## Goal

Reduce the template to its core content: frontend architecture (Feature-Sliced Design 2.1) and stack-agnostic React + TypeScript code style. Eliminate every piece of infrastructure that exists only to serve the larger multi-category system.

## Non-goals

- Restructuring the surviving chapters (architecture, code-style/universal). Content stays as-is apart from fixing broken cross-references.
- Re-introducing a lighter linter or minimal CI. Removed tooling is not replaced.
- Preserving backwards compatibility with forks of prior versions. This is a breaking reshape; consumers reclone.
- Migrating the removed material elsewhere. Material is left in git history; retrievable if ever needed.

## Scope

### Kept

- `docs/architecture/` — all 9 chapters + category `AGENTS.md` + `README.md` (11 files).
- `docs/code-style/universal/` — 10 chapters + category `AGENTS.md` + `README.md` (12 files).
- `LICENSE` (MIT).
- `.gitattributes` (LF normalization for `*.md` — low-maintenance, useful on Windows).
- `.gitignore` (trimmed if it has references to removed tooling).

### Removed

Content:
- `docs/code-style/variants/` (11 stack-specific files).
- `docs/code-style/PROFILE.md` (stack selector — obsolete without variants).
- `docs/workflow/` (6 files).
- `docs/security/` (5 files).
- `docs/onboarding/` (4 files).
- `docs/decisions/` (13 files: 10 ADRs + `AGENTS.md` + `README.md` + any index).
- `docs/_meta/` (11 files: templates, style-guide, governance, frontmatter spec, ci-linter spec, usage-guide, agent-smoke-tests).

Infrastructure:
- `scripts/install.mjs` and `scripts/lint-docs.mjs` (and the `scripts/` directory itself).
- `.github/` in its entirety (docs-lint workflow, CODEOWNERS, PR template, issue templates, dependabot config).
- `package.json` (no scripts, no deps, no installer entry point to support).

Root meta:
- Root `AGENTS.md` (hub — obsolete with only 2 self-evident categories).
- `CONTRIBUTING.md` (referenced workflow rules that no longer exist).
- `SECURITY.md` (paired with the security category).
- `CHANGELOG.md` (template has no releases).
- `.env.example` (off-topic for a documentation template).

### Transformed

- `README.md` — full rewrite to ~20 lines; see "New README" below.
- Surviving chapters — frontmatter block stripped (without a linter, `version`/`last-reviewed`/`status` would drift and mislead).
- Cross-references in surviving chapters — references to removed directories resolved per the rules below.
- Category-level `AGENTS.md` files (`architecture/AGENTS.md`, `code-style/AGENTS.md`) — purged of references to the root hub, to cross-category pre-flights, and to removed tooling (linter, frontmatter spec).
- Category-level `README.md` files — trimmed to short content descriptions.

## Cross-reference resolution rules

When a surviving chapter references removed material:

| Reference target | Action |
|---|---|
| ADR as rationale for a rule | Remove the citation. If the rule looks arbitrary without it, inline 1–2 sentences of "why". Otherwise drop silently. |
| "See variant X for stack Y" | Delete the paragraph/line. Stack-specific guidance has no home in the stripped template. |
| `docs/workflow/**`, `docs/security/**`, `docs/onboarding/**` | Remove the reference. If the surrounding text depends on it, rewrite to stand alone or delete the paragraph. |
| `docs/_meta/style-guide.md`, `docs/_meta/frontmatter.md`, `docs/_meta/ci-linter.md` | Remove the reference outright. Style guide conventions remain in effect implicitly. |
| `docs/code-style/PROFILE.md` | Remove. Universal rules apply as written, no opt-in toggle. |
| Root `AGENTS.md` | Remove cross-ref. Category `AGENTS.md` becomes its own entry point. |
| `CONTRIBUTING.md`, root `SECURITY.md` | Remove cross-ref. |
| RFC 2119 keywords (MUST / SHOULD / MAY) in rule text | Keep as written. Uppercase convention is self-explanatory; ADR 0004 is not needed to understand it. |
| Language policy (EN code / RU chapters) | Keep one line in new README. ADR 0006 removed. |

## New README

```
# project-documentations

Documentation template for AI-agent-assisted frontend projects:
Feature-Sliced Design 2.1 architecture rules and React + TypeScript
code style (stack-agnostic).

## Usage

Copy `docs/` into your project. Rules are authoritative as written;
override a specific rule by editing the chapter or adding a note in
your project's own docs.

## Structure

- `docs/architecture/` — FSD 2.1, pages-first. Entry: `architecture/AGENTS.md`.
- `docs/code-style/universal/` — React + TypeScript. Entry: `code-style/AGENTS.md`.

## Language

Code, identifiers and commits — English. Documentation chapters — Russian.

## License

MIT — see `LICENSE`.
```

No CI badges, no "Use this template" button, no installer command, no quick-command block.

## Execution order

Eight atomic commits on `main` (solo fast-forward flow). The docs are temporarily inconsistent between commits 3 and 6; this is acceptable because the linter is already gone after commit 1.

1. `chore: remove installer and docs linter` — `scripts/install.mjs`, `scripts/lint-docs.mjs`, `.github/workflows/docs-lint.yml`, `lint`/`lint:docs` entries in `package.json`.
2. `chore: remove github meta` — the rest of `.github/` (CODEOWNERS, PR template, issue templates, dependabot).
3. `chore: remove docs categories` — `docs/workflow/`, `docs/security/`, `docs/onboarding/`, `docs/decisions/`, `docs/_meta/` in one commit (they cross-reference each other).
4. `chore: remove stack-specific code-style variants` — `docs/code-style/variants/`, `docs/code-style/PROFILE.md`.
5. `chore: strip frontmatter from remaining chapters` — automated pass over surviving `.md` files; remove leading `---…---` block.
6. `refactor(docs): fix cross-references after category removal` — manual edits per the cross-reference resolution table; clean category `AGENTS.md` files.
7. `chore: remove root meta files` — root `AGENTS.md`, `CONTRIBUTING.md`, `SECURITY.md`, `CHANGELOG.md`, `.env.example`, `package.json`.
8. `docs: rewrite README for minimal scope`.

## Verification

After commit 8:

- `git ls-files 'docs/**'` lists only files under `docs/architecture/` and `docs/code-style/universal/`, plus the two category `AGENTS.md` and `README.md` files. No `_meta`, no `decisions`, no `variants`, no `workflow`, no `security`, no `onboarding`.
- Grep across all surviving `.md` (including the new `README.md`) for removed path fragments (`docs/workflow`, `docs/security`, `docs/onboarding`, `docs/decisions`, `docs/_meta`, `variants/`, `PROFILE`, `CONTRIBUTING.md`, `SECURITY.md`, root `AGENTS.md`) returns zero hits. The new `README.md` references only the two surviving directories.
- Grep across surviving `.md` for a leading frontmatter block (`^---$` on line 1) returns zero hits.
- Repo root contains only: `README.md`, `LICENSE`, `.gitattributes`, `.gitignore`, `docs/`.

## Risks and tradeoffs

- **Lost "why" behind rules.** ADRs are gone. For most FSD and React/TS rules the rationale is external (FSD docs, React community conventions); for rules that look arbitrary without context we inline a sentence of justification. Accepted tradeoff of option A.
- **No guarantee of internal consistency going forward.** Without the linter, frontmatter drift, broken links, and ADR chain integrity are no longer machine-checked. Mitigated by the small surviving surface (~22 files) and by verification step at commit 8.
- **Breaking change for any fork.** Consumers that forked the full template and pulled updates lose workflow/security/onboarding/variants. Accepted — the simplification is the point.
- **If stack variance becomes a need again.** Full history of variants is in git; recoverable via `git show`/`git checkout` on pre-simplification commits. Not planning for this future explicitly.
