---
version: 1.3.1
last-reviewed: 2026-04-17
status: active
---

# AGENTS.md — Documentation Hub

> Entry point for AI coding agents working in this repository.
> This file is **navigation only**. Each documentation category has its own `AGENTS.md` that tells you how to use it.
>
> **Repository role: template.** This repo ships documentation standards (FSD 2.1, React/TS code style, meta/governance, ADRs). When adopted by a concrete project, [`docs/code-style/PROFILE.md`](docs/code-style/PROFILE.md) **MUST** be filled in the first PR. Until then, `TODO` fields are expected and the fallback strategy in `PROFILE.md` applies.

---

## Language Policy

- **Code, identifiers, commits, user-facing strings, and this root `AGENTS.md`:** English.
- **Documentation chapters inside `docs/<category>/`:** Russian (unless a category's `AGENTS.md` states otherwise).

LLM agents read both languages. Apply rules from the chapters as-is.

---

## Document Map

Each category is self-contained: its own `AGENTS.md` with scope, navigation, working protocol, and invariants. Open the category matching your task and follow its entry point.

**Not sure which category applies?** [`docs/_meta/usage-guide.md`](docs/_meta/usage-guide.md) is a task-to-chapter router for all audiences (AI agent, new developer joining a project, daily developer, reviewer, template maintainer, documentation editor). Start there if this Document Map alone doesn't give you a direct answer.

| Category | When to open | Entry point |
|---|---|---|
| **Onboarding (start here for new forks)** | Just cloned the template? Open this first. Day-1 checklist from clone to first green-linter commit; branches for monorepo / fullstack / SSR / Expo / solo | [`docs/onboarding/AGENTS.md`](docs/onboarding/AGENTS.md) |
| Architecture (FSD 2.1) | Placing or refactoring frontend code, deciding on layer/slice/segment, defining a Public API, handling cross-imports | [`docs/architecture/AGENTS.md`](docs/architecture/AGENTS.md) |
| Code style (React + TypeScript) | Writing React components, hooks, typing, forms, state, styles, tests, or configuring lint/format | [`docs/code-style/AGENTS.md`](docs/code-style/AGENTS.md) |
| Workflow (git, PR, review, releases) | Branching, commit convention, PR size/template, code review, semver, changelog, tagging, hotfix | [`docs/workflow/AGENTS.md`](docs/workflow/AGENTS.md) |
| Security (secrets, input, deps) | Handling `.env` and secrets, XSS / input validation / CSP, adding and auditing npm packages | [`docs/security/AGENTS.md`](docs/security/AGENTS.md) |
| Decisions (ADR) | Looking up the **why** behind a rule, proposing a structural change, superseding a previous decision | [`docs/decisions/AGENTS.md`](docs/decisions/AGENTS.md) |
| Meta (docs about docs) | Editing a chapter or creating a new one — templates, style guide, frontmatter spec, governance | [`docs/_meta/AGENTS.md`](docs/_meta/AGENTS.md) |

Additional categories (product, libraries, operations) will follow the same pattern and appear in this table as they are added.

---

## Precedence Rule

When a category-level `AGENTS.md` and this root file appear to conflict:

- **Root wins** for repo-wide concerns: language policy, git commit style, global pre-flight, and cross-category navigation.
- **Category wins** for anything scoped to its folder: architectural rules, code-style rules, naming, tooling specific to that domain.

If a category has no `AGENTS.md` yet, fall back to the category's `README.md`.

---

## Working Protocol

For any code change:

1. **Identify the category** — which `docs/<category>/` covers the task. If the task spans multiple categories, open all relevant ones.
2. **Read that category's `AGENTS.md`** — it lists which chapter to open for the specific sub-task.
3. **Apply the chapter rules** — respect MUST/SHOULD/MAY keywords per RFC 2119.
4. **Run the category's pre-flight before finishing** — each category's `AGENTS.md` documents its own verification steps. See "Global Pre-Flight" below for the minimal set that applies repo-wide.

### Cross-category example

Task: "Move all `User` types into `entities/user/model/types.ts`".

1. Open both [`docs/architecture/AGENTS.md`](docs/architecture/AGENTS.md) and [`docs/code-style/AGENTS.md`](docs/code-style/AGENTS.md).
2. Architecture decides **where** the code lives: consult [`docs/architecture/05-pages-first.md`](docs/architecture/05-pages-first.md) and [`docs/architecture/04-cross-imports.md`](docs/architecture/04-cross-imports.md) — this is a refactor inside `entities/*`; if `User` is referenced from another entity (e.g. `post`), a `@x` facade is required.
3. Code style decides **how** the code is written: consult [`docs/code-style/universal/01-typescript.md`](docs/code-style/universal/01-typescript.md) — `interface` for public contracts, `import type` for type-only imports, strict flags.
4. Run **both** pre-flights: architecture checklist F (refactor) + code-style pre-flight. If both pass, the task is complete.

Order of resolution when one file seems to contradict another:
- Architecture wins on placement / boundaries / public API shape.
- Code style wins on syntax / typing / imports / naming within a file.
- If still conflicting — see Precedence Rule below.

---

## Global Pre-Flight

Before marking any task complete, verify these repo-wide items:

- [ ] Category-level pre-flights passed for every category the change touched (architecture / code-style / workflow / security / …).
- [ ] Commit message follows `<type>(<scope>): <subject>` convention — full rules in [`docs/workflow/01-git.md`](docs/workflow/01-git.md) раздел 2.
- [ ] Code, commit messages, and user-facing strings — in English.
- [ ] No secrets, `.env`, or credentials added to the commit — full policy in [`docs/security/01-secrets.md`](docs/security/01-secrets.md).
- [ ] If the change is cross-category (e.g., code restructuring + style), both category protocols were followed.
- [ ] If any `docs/**/*.md` or root `AGENTS.md` was touched — `node scripts/lint-docs.mjs` passes (see [`docs/_meta/ci-linter.md`](docs/_meta/ci-linter.md)).

Category-specific pre-flights:
- **Architecture:** [`docs/architecture/AGENTS.md`](docs/architecture/AGENTS.md) Pre-Flight Checklist + [`docs/architecture/07-checklists.md` — раздел H](docs/architecture/07-checklists.md#h-архитектурный-pre-flight-на-каждый-коммит).
- **Code style:** [`docs/code-style/AGENTS.md`](docs/code-style/AGENTS.md) Pre-Flight Checklist.
- **Workflow:** [`docs/workflow/AGENTS.md`](docs/workflow/AGENTS.md) Pre-Flight Checklist (applies to any PR — branches, commits, PR format, review).
- **Security:** [`docs/security/AGENTS.md`](docs/security/AGENTS.md) Pre-Flight Checklist (applies when the change touches env vars, user input handling, or dependencies).
- **Decisions:** [`docs/decisions/AGENTS.md`](docs/decisions/AGENTS.md) Pre-Flight Checklist (applies only when a PR adds/changes ADRs).
- **Meta:** [`docs/_meta/AGENTS.md`](docs/_meta/AGENTS.md) Pre-Flight Checklist (applies when editing any chapter's frontmatter, templates, style guide, or governance).
