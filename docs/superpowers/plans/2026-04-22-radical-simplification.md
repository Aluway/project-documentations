# Radical Simplification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce the `project-documentations` template to two surviving categories (`docs/architecture/` and `docs/code-style/universal/`), eliminating all supporting infrastructure (installer, docs linter, CI, ADRs, meta, workflow/security/onboarding categories, stack-specific variants, GitHub meta, root meta files) and producing a clean, minimal markdown-only template.

**Architecture:** Eight atomic commits on `main` (solo fast-forward flow matches repo convention). Order is chosen so that verification tooling is removed first (so the docs may be temporarily inconsistent during mid-flight commits), large bulk deletions happen next, then surgical content edits, then root cleanup, then a full README rewrite. Intermediate states between commits 3–6 have broken links — this is acceptable because the linter is already gone in commit 1.

**Tech Stack:** Markdown, git. No code, no tests, no runtime. Verification is grep-based.

**Design spec:** [`docs/superpowers/specs/2026-04-22-radical-simplification-design.md`](../specs/2026-04-22-radical-simplification-design.md).

---

## Global execution notes

- All commits use the Conventional Commits format `<type>(<scope>): <subject>` per repo convention, with `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>` footer.
- Commit directly to `main` — the repo uses solo fast-forward flow (see recent commit history).
- Never use `git add -A`. Stage exactly the files each task touches.
- If a step's verification fails, STOP and investigate — do not proceed to the next task.
- Line numbers in this plan refer to state **before** Task 5 (frontmatter strip). After Task 5, line numbers shift by ~5. Task 6 therefore specifies edits by exact string match, not by line number.

---

## Task 1: Remove installer and docs linter

**Files:**
- Delete: `scripts/install.mjs`
- Delete: `scripts/lint-docs.mjs`
- Delete: `scripts/` (directory — becomes empty)
- Delete: `.github/workflows/docs-lint.yml`
- Delete: `.github/workflows/` (directory — becomes empty)
- Modify: `package.json` (remove `lint` and `lint:docs` scripts)

- [ ] **Step 1: Inspect current package.json scripts**

Run: `cat package.json`
Expected: contains `"lint"` and `"lint:docs"` entries under `"scripts"`.

- [ ] **Step 2: Delete scripts directory**

```bash
rm -rf scripts
```

Verify:
```bash
ls scripts 2>&1 | head -1
```
Expected: `ls: cannot access 'scripts': No such file or directory`

- [ ] **Step 3: Delete .github/workflows**

```bash
rm -rf .github/workflows
```

Verify:
```bash
ls .github/workflows 2>&1 | head -1
```
Expected: `ls: cannot access '.github/workflows': No such file or directory`

- [ ] **Step 4: Edit package.json — remove lint scripts**

Open `package.json`. Remove the `lint` and `lint:docs` entries from the `"scripts"` object. If `"scripts"` becomes empty, leave an empty object `"scripts": {}` — the whole file is deleted in Task 7 regardless.

Verify:
```bash
grep -E '"lint"|"lint:docs"' package.json
```
Expected: no output (exit code 1).

- [ ] **Step 5: Commit**

```bash
git add -- package.json scripts .github/workflows
git commit -m "$(cat <<'EOF'
chore: remove installer and docs linter

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Verify: `git log -1 --oneline` shows the commit.

---

## Task 2: Remove remaining GitHub meta

**Files:**
- Delete: `.github/CODEOWNERS`
- Delete: `.github/PULL_REQUEST_TEMPLATE.md`
- Delete: `.github/ISSUE_TEMPLATE/bug_report.md`
- Delete: `.github/ISSUE_TEMPLATE/feature_request.md`
- Delete: `.github/ISSUE_TEMPLATE/` (directory)
- Delete: `.github/dependabot.yml`
- Delete: `.github/` (directory — becomes empty)

- [ ] **Step 1: Verify what's left in .github**

Run: `ls -R .github`
Expected: CODEOWNERS, PULL_REQUEST_TEMPLATE.md, dependabot.yml, ISSUE_TEMPLATE/bug_report.md, ISSUE_TEMPLATE/feature_request.md. No `workflows/` (deleted in Task 1).

- [ ] **Step 2: Delete the entire .github directory**

```bash
rm -rf .github
```

Verify:
```bash
ls -a | grep -c "^\.github$"
```
Expected: `0`

- [ ] **Step 3: Commit**

```bash
git add -- .github
git commit -m "$(cat <<'EOF'
chore: remove github meta

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Verify: `git log -1 --oneline` shows the commit.

---

## Task 3: Remove docs categories (workflow, security, onboarding, decisions, _meta)

**Files:**
- Delete: `docs/workflow/` (6 files: AGENTS.md, README.md, 01-git.md, 02-pull-requests.md, 03-code-review.md, 04-releases.md)
- Delete: `docs/security/` (5 files: AGENTS.md, README.md, 01-secrets.md, 02-input-handling.md, 03-dependencies.md)
- Delete: `docs/onboarding/` (4 files: AGENTS.md, README.md, 01-first-fork.md, 02-common-branches.md)
- Delete: `docs/decisions/` (13 files: AGENTS.md, README.md, 0001-agents-hub-navigation.md, 0002-universal-variants-split.md, 0003-fsd-2.1-pages-first.md, 0004-rfc-2119-keywords.md, 0005-frontmatter-for-chapters.md, 0006-language-policy.md, 0007-introduce-workflow-category.md, 0008-introduce-security-category.md, 0009-exclude-i18n-from-template.md, 0010-introduce-onboarding-category.md; plus any index file if present)
- Delete: `docs/_meta/` (11 files: AGENTS.md, agent-smoke-tests.md, ci-linter.md, frontmatter.md, governance.md, style-guide.md, usage-guide.md, templates/ADR.md, templates/AGENTS-category.md, templates/chapter-universal.md, templates/chapter-variant.md)

**Note:** These 5 directories cross-reference each other. Deleting them piecemeal would leave broken intra-deleted links visible in diff review; deleting together is cleaner.

- [ ] **Step 1: Snapshot file counts before**

Run:
```bash
find docs/workflow docs/security docs/onboarding docs/decisions docs/_meta -type f -name '*.md' | wc -l
```
Expected: ~39 files (6 + 5 + 4 + 13 + 11 = 39).

- [ ] **Step 2: Delete the five directories**

```bash
rm -rf docs/workflow docs/security docs/onboarding docs/decisions docs/_meta
```

Verify:
```bash
ls docs
```
Expected: only `architecture`, `code-style`, `superpowers` (the `superpowers/specs` dir created during brainstorming).

- [ ] **Step 3: Commit**

```bash
git add -- docs/workflow docs/security docs/onboarding docs/decisions docs/_meta
git commit -m "$(cat <<'EOF'
chore: remove workflow, security, onboarding, decisions, _meta docs categories

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Verify: `git log -1 --stat | head -5` shows a deletion commit.

---

## Task 4: Remove stack-specific variants and PROFILE.md

**Files:**
- Delete: `docs/code-style/variants/` (11 files: forms-react-19-actions.md, forms-react-hook-form.md, manual-memoization.md, react-19-features.md, react-compiler.md, state-redux-toolkit.md, state-tanstack-query.md, state-zustand.md, styling-css-modules.md, styling-tailwind.md, testing-vitest.md)
- Delete: `docs/code-style/PROFILE.md`

- [ ] **Step 1: Verify what's inside variants**

Run: `ls docs/code-style/variants`
Expected: 11 `.md` files listed above.

- [ ] **Step 2: Delete variants directory and PROFILE.md**

```bash
rm -rf docs/code-style/variants
rm docs/code-style/PROFILE.md
```

Verify:
```bash
ls docs/code-style
```
Expected: `AGENTS.md`, `README.md`, `universal`. No `variants`, no `PROFILE.md`.

- [ ] **Step 3: Commit**

```bash
git add -- docs/code-style/variants docs/code-style/PROFILE.md
git commit -m "$(cat <<'EOF'
chore: remove stack-specific code-style variants

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Verify: `git log -1 --oneline` shows the commit.

---

## Task 5: Strip frontmatter from all surviving chapters

**Files to modify (23 total):**
- `docs/architecture/AGENTS.md`
- `docs/architecture/README.md`
- `docs/architecture/01-layers.md`
- `docs/architecture/02-slices-segments.md`
- `docs/architecture/03-public-api.md`
- `docs/architecture/04-cross-imports.md`
- `docs/architecture/05-pages-first.md`
- `docs/architecture/06-import-rules.md`
- `docs/architecture/07-checklists.md`
- `docs/architecture/08-examples.md`
- `docs/architecture/09-routing.md`
- `docs/code-style/AGENTS.md`
- `docs/code-style/README.md`
- `docs/code-style/universal/01-typescript.md`
- `docs/code-style/universal/02-components.md`
- `docs/code-style/universal/03-hooks.md`
- `docs/code-style/universal/04-state-model.md`
- `docs/code-style/universal/05-forms-principles.md`
- `docs/code-style/universal/06-styling-principles.md`
- `docs/code-style/universal/07-accessibility.md`
- `docs/code-style/universal/08-testing-principles.md`
- `docs/code-style/universal/09-performance-principles.md`
- `docs/code-style/universal/10-tooling.md`

**Each file starts with:**
```
---
version: X.Y.Z
last-reviewed: YYYY-MM-DD
status: active
---
```
(exactly 5 lines, then an empty line, then the H1 title on line 7).

Expected result: those 5 lines plus the following blank line removed. File now starts with the H1 title on line 1.

- [ ] **Step 1: Verify all 23 files have frontmatter**

Run:
```bash
for f in docs/architecture/*.md docs/code-style/AGENTS.md docs/code-style/README.md docs/code-style/universal/*.md; do
  head -1 "$f" | grep -q '^---$' || echo "NO FRONTMATTER: $f"
done
```
Expected: no output. If any file is listed, investigate before proceeding.

- [ ] **Step 2: Strip frontmatter from all 23 files**

Use a loop that removes the first frontmatter block (lines from `---` to the next `---`) plus the following blank line:

```bash
for f in docs/architecture/*.md docs/code-style/AGENTS.md docs/code-style/README.md docs/code-style/universal/*.md; do
  # Use awk to skip lines until after the second '---', then skip exactly one blank line.
  awk 'BEGIN{fm=0; skipped_blank=0}
       /^---$/ && fm < 2 {fm++; next}
       fm==2 && skipped_blank==0 && /^$/ {skipped_blank=1; next}
       {print}' "$f" > "$f.tmp" && mv "$f.tmp" "$f"
done
```

- [ ] **Step 3: Verify no frontmatter remains**

Run:
```bash
for f in docs/architecture/*.md docs/code-style/AGENTS.md docs/code-style/README.md docs/code-style/universal/*.md; do
  head -1 "$f" | grep -q '^---$' && echo "STILL HAS FRONTMATTER: $f"
done
```
Expected: no output.

- [ ] **Step 4: Spot-check two files start with H1**

Run:
```bash
head -1 docs/architecture/AGENTS.md
head -1 docs/code-style/universal/01-typescript.md
```
Expected: both lines start with `# `.

- [ ] **Step 5: Commit**

```bash
git add -- docs/architecture docs/code-style/AGENTS.md docs/code-style/README.md docs/code-style/universal
git commit -m "$(cat <<'EOF'
chore: strip frontmatter from remaining chapters

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Verify: `git log -1 --stat | tail -5` shows 23 files changed.

---

## Task 6: Fix cross-references in surviving content

**Files to modify:**
- `docs/architecture/07-checklists.md`
- `docs/architecture/09-routing.md`
- `docs/architecture/AGENTS.md`
- `docs/architecture/README.md`
- `docs/code-style/AGENTS.md` (significant rewrite — half the content is about PROFILE.md/variants)
- `docs/code-style/README.md` (significant rewrite)
- `docs/code-style/universal/02-components.md`
- `docs/code-style/universal/03-hooks.md`
- `docs/code-style/universal/04-state-model.md`
- `docs/code-style/universal/05-forms-principles.md`
- `docs/code-style/universal/06-styling-principles.md`
- `docs/code-style/universal/08-testing-principles.md`
- `docs/code-style/universal/09-performance-principles.md`
- `docs/code-style/universal/10-tooling.md`
- `docs/code-style/universal/01-typescript.md` (only line 9 change)
- `docs/code-style/universal/07-accessibility.md` (only line 9 change)

Edits are specified by **exact string match**, not line number (line numbers shift after Task 5). Use the Edit tool with `old_string` matching the full line verbatim.

### 6.1 Universal chapters — strip the "Профиль стека" lead line

All 10 universal chapters have an identical line near the top:

```
> Оглавление: [`../README.md`](../README.md). Профиль стека: [`../PROFILE.md`](../PROFILE.md).
```

Replace with:

```
> Оглавление: [`../README.md`](../README.md).
```

- [ ] **Step 1: For each universal chapter 01–10, replace the lead line**

For each of `docs/code-style/universal/01-typescript.md` through `10-tooling.md`:

Edit — `old_string`:
```
> Оглавление: [`../README.md`](../README.md). Профиль стека: [`../PROFILE.md`](../PROFILE.md).
```
`new_string`:
```
> Оглавление: [`../README.md`](../README.md).
```

Verify after all 10 done:
```bash
grep -l "Профиль стека" docs/code-style/universal/*.md
```
Expected: no output.

### 6.2 `02-components.md` — remove 4 references to variants and PROFILE

- [ ] **Step 2: Edit `docs/code-style/universal/02-components.md`**

Edit 1 — `old_string`:
```
Правила универсальны для любой версии React. Версионно-специфичные фичи (`ref`-as-prop, Server/Client components, React 19-хуки) — в [`variants/react-19-features.md`](../variants/react-19-features.md).
```
`new_string`:
```
Правила универсальны для любой версии React.
```

Edit 2 — `old_string`:
```
- **Side effects в рендере** (fetch, setState, `console.log` прод) — **MUST NOT**. Только в обработчиках, эффектах, или серверных компонентах (см. [`variants/react-19-features.md`](../variants/react-19-features.md)).
```
`new_string`:
```
- **Side effects в рендере** (fetch, setState, `console.log` прод) — **MUST NOT**. Только в обработчиках, эффектах, или серверных компонентах.
```

Edit 3 — `old_string`:
```
- Детали и React-19-специфика — в [`variants/react-19-features.md`](../variants/react-19-features.md) (разделы Server/Client).
```
`new_string` (delete the whole bullet — replace with empty line):
```

```

Edit 4 — `old_string`:
```
Для React ≤ 18 — `React.forwardRef`. Для React ≥ 19 — `ref` передаётся как обычный prop; `forwardRef` deprecated. См. [`variants/react-19-features.md`](../variants/react-19-features.md).
```
`new_string`:
```
Для React ≤ 18 — `React.forwardRef`. Для React ≥ 19 — `ref` передаётся как обычный prop; `forwardRef` deprecated.
```

Edit 5 — `old_string`:
```
Определите версию React в вашем репо через [`../PROFILE.md`](../PROFILE.md) и следуйте соответствующему варианту.
```
`new_string` (delete — replace with empty):
```

```

After all edits in this file, verify:
```bash
grep -E "PROFILE\.md|variants/" docs/code-style/universal/02-components.md
```
Expected: no output.

### 6.3 `03-hooks.md` — remove 9 references

- [ ] **Step 3: Edit `docs/code-style/universal/03-hooks.md`**

Edit 1 — `old_string`:
```
Универсальные правила для хуков, доступных во всех современных версиях React (18+). Хуки React 19 (`use`, `useActionState`, `useOptimistic`, `useFormStatus`) — в [`variants/react-19-features.md`](../variants/react-19-features.md).
```
`new_string`:
```
Универсальные правила для хуков, доступных во всех современных версиях React (18+).
```

Edit 2 — `old_string`:
```
> Исключение есть только для хука `use()` в React 19 — его можно вызывать условно. См. [`variants/react-19-features.md`](../variants/react-19-features.md).
```
`new_string`:
```
> Исключение есть только для хука `use()` в React 19 — его можно вызывать условно.
```

Edit 3 — `old_string`:
```
  - Запросов к API — это работа серверного-state инструмента (`variants/state-*`).
```
`new_string`:
```
  - Запросов к API — это работа серверного-state инструмента.
```

Edit 4 — `old_string` (whole 3-line block defining Compiler flow):
```
- **Compiler **включён** (`React Compiler = enabled` в [`../PROFILE.md`](../PROFILE.md))** — ручные `useMemo`/`useCallback` **MUST NOT** писаться без обоснования. См. [`variants/react-compiler.md`](../variants/react-compiler.md).
- **Compiler **выключен/недоступен** (`disabled` / `N/A`)** — мемоизация применяется осознанно после профилирования. См. [`variants/manual-memoization.md`](../variants/manual-memoization.md).
- **Поле `React Compiler = TODO`** — агент **MUST** действовать по fallback-стратегии из `PROFILE.md`: попытаться уточнить; если нельзя — применять правила `manual-memoization.md` (консервативный дефолт: не мемоизировать профилактически) и пометить вывод как требующий ревью.
```
`new_string` (replace with a single compacted rule — inline "why"):
```
- **С React Compiler** (включён в сборке) ручные `useMemo` / `useCallback` **MUST NOT** писаться без обоснования — компилятор мемоизирует сам.
- **Без React Compiler** мемоизация применяется осознанно после профилирования, а не профилактически.
```

Edit 5 — `old_string`:
```
- **Ручные `useMemo` / `useCallback` / `React.memo` при включённом React Compiler** — **MUST NOT** без обоснования. Компилятор решает сам. См. раздел 5 и [`../variants/react-compiler.md`](../variants/react-compiler.md).
```
`new_string`:
```
- **Ручные `useMemo` / `useCallback` / `React.memo` при включённом React Compiler** — **MUST NOT** без обоснования. Компилятор решает сам. См. раздел 5.
```

Edit 6 — `old_string`:
```
Если в репо React ≥ 19 и в [`../PROFILE.md`](../PROFILE.md) активен `variants/react-19-features.md` — применяйте оттуда правила для:
```
`new_string`:
```
Если в репо React ≥ 19 — применяйте правила React 19 для:
```

Edit 7 — `old_string`:
```
Если React 18 — эти хуки недоступны; используйте `useEffect` + `useState` или соответствующую библиотеку (см. `variants/forms-react-hook-form.md`).
```
`new_string`:
```
Если React 18 — эти хуки недоступны; используйте `useEffect` + `useState` или соответствующую библиотеку (например, React Hook Form).
```

After all edits, verify:
```bash
grep -E "PROFILE\.md|variants/" docs/code-style/universal/03-hooks.md
```
Expected: no output.

### 6.4 `04-state-model.md` — remove 6 references

- [ ] **Step 4: Edit `docs/code-style/universal/04-state-model.md`**

Edit 1 — `old_string`:
```
Универсальная ментальная модель распределения состояния по слоям. Конкретные инструменты (TanStack Query, Zustand, Redux Toolkit и др.) — в соответствующих `variants/state-*.md`.
```
`new_string`:
```
Универсальная ментальная модель распределения состояния по слоям. Конкретные инструменты (TanStack Query, Zustand, Redux Toolkit и др.) выбираются под проект.
```

Edit 2 — `old_string`:
```
| **1. Server state** | Данные, источник истины которых — бэкенд: списки, сущности, пагинация, кеш | Специализированный менеджер серверного state (см. `variants/state-*.md` под свой инструмент) |
```
`new_string`:
```
| **1. Server state** | Данные, источник истины которых — бэкенд: списки, сущности, пагинация, кеш | Специализированный менеджер серверного state (TanStack Query, RTK Query и т.п.) |
```

Edit 3 — `old_string`:
```
| **2. Global client state** | UI-состояние, не зависящее от сервера: тема, локаль, сессия, открытость сайдбара | Zustand / Redux Toolkit / Jotai / Context (см. `variants/state-*.md`) |
```
`new_string`:
```
| **2. Global client state** | UI-состояние, не зависящее от сервера: тема, локаль, сессия, открытость сайдбара | Zustand / Redux Toolkit / Jotai / Context |
```

Edit 4 — `old_string`:
```
| **4. Form state** | Поля формы, валидация, submit-флаги | Инструмент согласно `PROFILE.md`: React 19 Actions / React Hook Form / native |
```
`new_string`:
```
| **4. Form state** | Поля формы, валидация, submit-флаги | Инструмент по выбору: React 19 Actions / React Hook Form / native |
```

Edit 5 — `old_string`:
```
4. **Это поля формы?** → слой 4, инструмент форм из `PROFILE.md`.
```
`new_string`:
```
4. **Это поля формы?** → слой 4, инструмент форм по выбору проекта.
```

Edit 6 — `old_string`:
```
Если у команды есть специфичные слои (например, собственная feature-flags система, observable storage) — вынесите в отдельный модуль в `variants/` и опишите правила для него. Не мешайте с базовыми пятью слоями.
```
`new_string`:
```
Если у команды есть специфичные слои (например, собственная feature-flags система, observable storage) — опишите их правилами отдельного модуля. Не мешайте с базовыми пятью слоями.
```

After all edits, verify:
```bash
grep -E "PROFILE\.md|variants/" docs/code-style/universal/04-state-model.md
```
Expected: no output.

### 6.5 `05-forms-principles.md` — remove section about choosing forms tool

- [ ] **Step 5: Edit `docs/code-style/universal/05-forms-principles.md`**

Edit 1 — `old_string`:
```
Универсальные принципы форм, независимые от выбранного инструмента. Конкретные инструменты — в `variants/forms-react-19-actions.md`, `variants/forms-react-hook-form.md`.
```
`new_string`:
```
Универсальные принципы форм, независимые от выбранного инструмента.
```

Edit 2 — delete the whole tool-selection block. `old_string`:
```
Определяется через [`../PROFILE.md`](../PROFILE.md):

| Значение | Вариант |
|---|---|
| React 19 Actions | [`variants/forms-react-19-actions.md`](../variants/forms-react-19-actions.md) |
| React Hook Form | [`variants/forms-react-hook-form.md`](../variants/forms-react-hook-form.md) |
```

`new_string`:
```
Выбирается под проект: React 19 Actions (современные React 19 приложения) или React Hook Form (классика для сложных форм). Универсальные принципы ниже применимы к любому выбору.
```

After all edits, verify:
```bash
grep -E "PROFILE\.md|variants/" docs/code-style/universal/05-forms-principles.md
```
Expected: no output.

### 6.6 `06-styling-principles.md` — remove section about choosing styling tool

- [ ] **Step 6: Edit `docs/code-style/universal/06-styling-principles.md`**

Edit 1 — `old_string`:
```
Универсальные принципы стилизации, независимые от инструмента. Конкретные инструменты — в `variants/styling-tailwind.md`, `variants/styling-css-modules.md`.
```
`new_string`:
```
Универсальные принципы стилизации, независимые от инструмента.
```

Edit 2 — delete the tool-selection block. `old_string`:
```
Определяется через [`../PROFILE.md`](../PROFILE.md), поле `Primary styling`.

| Значение | Вариант |
|---|---|
| Tailwind 3/4 | [`variants/styling-tailwind.md`](../variants/styling-tailwind.md) |
| CSS Modules | [`variants/styling-css-modules.md`](../variants/styling-css-modules.md) |
| mixed | оба варианта |
| other | описать в `variants/` или в команде |
```
`new_string`:
```
Выбирается под проект: Tailwind (3 или 4), CSS Modules, или их комбинация. Универсальные принципы ниже применимы к любому выбору.
```

After all edits, verify:
```bash
grep -E "PROFILE\.md|variants/" docs/code-style/universal/06-styling-principles.md
```
Expected: no output.

### 6.7 `08-testing-principles.md` — remove 2 references

- [ ] **Step 7: Edit `docs/code-style/universal/08-testing-principles.md`**

Edit 1 — `old_string`:
```
Универсальные принципы тестирования React-компонентов. Конкретный setup (Vitest / Jest) — в `variants/testing-vitest.md` (или аналоге для Jest).
```
`new_string`:
```
Универсальные принципы тестирования React-компонентов.
```

Edit 2 — `old_string`:
```
В setup'е тестов: `server.listen()` / `server.resetHandlers()` / `server.close()`. Детали — в `variants/testing-vitest.md`.
```
`new_string`:
```
В setup'е тестов: `server.listen()` / `server.resetHandlers()` / `server.close()`.
```

After all edits, verify:
```bash
grep -E "PROFILE\.md|variants/" docs/code-style/universal/08-testing-principles.md
```
Expected: no output.

### 6.8 `09-performance-principles.md` — remove 6 references

- [ ] **Step 8: Edit `docs/code-style/universal/09-performance-principles.md`**

Edit 1 — `old_string`:
```
Универсальные принципы производительности. Мемоизация зависит от наличия React Compiler: если он включён — [`variants/react-compiler.md`](../variants/react-compiler.md); если нет — [`variants/manual-memoization.md`](../variants/manual-memoization.md).
```
`new_string`:
```
Универсальные принципы производительности. Мемоизация зависит от наличия React Compiler — правила ниже учитывают оба случая.
```

Edit 2 — delete the whole PROFILE-driven table. `old_string`:
```
Поведение `useMemo` / `useCallback` / `React.memo` зависит от [`../PROFILE.md`](../PROFILE.md):

| Значение | Правило |
|---|---|
| `enabled` | Ручная мемоизация **MUST NOT** без обоснования. См. [`variants/react-compiler.md`](../variants/react-compiler.md). |
| `disabled` / `N/A` | Мемоизация применяется осознанно после профилирования. См. [`variants/manual-memoization.md`](../variants/manual-memoization.md). |
```
`new_string`:
```
Поведение `useMemo` / `useCallback` / `React.memo` зависит от React Compiler:

- **С React Compiler (enabled):** ручная мемоизация **MUST NOT** писаться без обоснования.
- **Без React Compiler (disabled / N/A):** мемоизация применяется осознанно после профилирования.
```

Edit 3 — `old_string`:
```
Серверное состояние **MUST** проходить через специализированный менеджер (см. `variants/state-*.md`). Ручные `fetch + useEffect + setState` **MUST NOT** использоваться в прикладном коде.
```
`new_string`:
```
Серверное состояние **MUST** проходить через специализированный менеджер (TanStack Query, RTK Query и т.п.). Ручные `fetch + useEffect + setState` **MUST NOT** использоваться в прикладном коде.
```

Edit 4 — `old_string`:
```
- Ручные мемоизации, когда профиль говорит «Compiler enabled» — **MUST NOT** (см. `variants/react-compiler.md`).
```
`new_string`:
```
- Ручные мемоизации при включённом React Compiler — **MUST NOT**.
```

After all edits, verify:
```bash
grep -E "PROFILE\.md|variants/" docs/code-style/universal/09-performance-principles.md
```
Expected: no output.

### 6.9 `10-tooling.md` — remove 7 references

- [ ] **Step 9: Edit `docs/code-style/universal/10-tooling.md`**

Edit 1 — `old_string`:
```
Универсальные принципы конфигурации линтинга, форматирования, pre-commit и CI. Конкретные версии — в [`../PROFILE.md`](../PROFILE.md).
```
`new_string`:
```
Универсальные принципы конфигурации линтинга, форматирования, pre-commit и CI.
```

Edit 2 — `old_string`:
```
Какой у вас — фиксируется в [`../PROFILE.md`](../PROFILE.md), поле `ESLint`.
```
`new_string` (delete — replace with empty):
```

```

Edit 3 — `old_string`:
```
Дополнительно (по условиям `PROFILE.md`):
```
`new_string`:
```
Дополнительно (по условиям проекта):
```

Edit 4 — `old_string`:
```
Если в [`../PROFILE.md`](../PROFILE.md) `React Compiler = enabled` — **MUST** добавить `eslint-plugin-react-compiler`. Подробные правила — в [`variants/react-compiler.md`](../variants/react-compiler.md).
```
`new_string`:
```
Если в проекте включён React Compiler — **MUST** добавить `eslint-plugin-react-compiler`.
```

Edit 5 — `old_string`:
```
Конкретный `test` зависит от раннера в [`../PROFILE.md`](../PROFILE.md) — замените на `jest` если нужно.
```
`new_string`:
```
Конкретный `test` зависит от раннера проекта — замените на `jest` если нужно.
```

Edit 6 — `old_string`:
```
- Major обновления React / TypeScript / ESLint — отдельным PR с прогоном полного CI и обновлением [`../PROFILE.md`](../PROFILE.md).
```
`new_string`:
```
- Major обновления React / TypeScript / ESLint — отдельным PR с прогоном полного CI.
```

After all edits, verify:
```bash
grep -E "PROFILE\.md|variants/" docs/code-style/universal/10-tooling.md
```
Expected: no output.

### 6.10 Universal chapters — final sanity grep

- [ ] **Step 10: Verify no universal chapter references removed material**

Run:
```bash
grep -rE "PROFILE\.md|variants/|docs/workflow|docs/security|docs/onboarding|docs/decisions|docs/_meta" docs/code-style/universal
```
Expected: no output.

### 6.11 Architecture chapters — fix 3 broken refs

- [ ] **Step 11: Edit `docs/architecture/07-checklists.md`**

Edit — `old_string`:
```
Короткий архитектурный чек-лист перед коммитом. Повторяет ключевые инварианты в одном месте; репо-wide pre-flight (коммит-формат, секреты, язык) — в корневом [`../../AGENTS.md`](../../AGENTS.md) Global Pre-Flight, git-правила — в [`../workflow/AGENTS.md`](../workflow/AGENTS.md).
```
`new_string`:
```
Короткий архитектурный чек-лист перед коммитом. Повторяет ключевые инварианты в одном месте.
```

- [ ] **Step 12: Edit `docs/architecture/09-routing.md` — remove TanStack Query reference**

Edit — `old_string`:
```
- Prefetch при hover / focus / route-intent — **MAY** использоваться для ускорения perceived performance. См. примеры в [TanStack Query variant](../code-style/variants/state-tanstack-query.md) раздел 7.
```
`new_string`:
```
- Prefetch при hover / focus / route-intent — **MAY** использоваться для ускорения perceived performance.
```

- [ ] **Step 13: Edit `docs/architecture/09-routing.md` — remove security reference (inline)**

Edit — `old_string`:
```
  - `fetch` / `axios` URL (см. [`../security/02-input-handling.md`](../security/02-input-handling.md) раздел 4);
```
`new_string`:
```
  - `fetch` / `axios` URL (внешние URL **MUST** валидироваться по allowlist доменов, чтобы не было open redirect / SSRF);
```

- [ ] **Step 14: Edit `docs/architecture/09-routing.md` — remove security reference (bullet)**

Edit — `old_string`:
```
- [`../security/02-input-handling.md`](../security/02-input-handling.md) раздел 4 — open redirect: `returnTo` в query-string **MUST** проходить allowlist доменов.
```
`new_string` (delete the whole bullet — replace with empty line):
```

```

After all architecture chapter edits, verify:
```bash
grep -rE "\.\./\.\./AGENTS\.md|\.\./workflow|\.\./security|\.\./onboarding|\.\./decisions|\.\./_meta|\.\./code-style/variants" docs/architecture
```
Expected: no output.

### 6.12 Architecture AGENTS.md — remove root-hub reference

- [ ] **Step 15: Edit `docs/architecture/AGENTS.md`**

Edit — `old_string`:
```
Всё остальное (стиль кода, React-паттерны, тестирование, стили) — вне scope'а; см. другие категории в [корневом AGENTS.md](../../AGENTS.md).
```
`new_string`:
```
Всё остальное (стиль кода, React-паттерны, тестирование, стили) — вне scope'а; см. [`../code-style/AGENTS.md`](../code-style/AGENTS.md).
```

### 6.13 Architecture README — remove root-hub reference

- [ ] **Step 16: Edit `docs/architecture/README.md`**

Edit — `old_string`:
```
> Расширенный справочник по архитектуре фронтенда в этом репозитории.
> Точка входа для агента уровнем выше: [`AGENTS.md`](../../AGENTS.md).
```
`new_string`:
```
> Расширенный справочник по архитектуре фронтенда в этом репозитории.
> Точка входа для агента: [`AGENTS.md`](AGENTS.md).
```

### 6.14 Code-style AGENTS.md — significant rewrite (variants/PROFILE removed)

The current file dedicates ~60% of its content to PROFILE.md and variants. Overwrite the whole file.

- [ ] **Step 17: Rewrite `docs/code-style/AGENTS.md` entirely**

Use the Write tool (full overwrite — the file has already been `Read` earlier in this session). New content:

```markdown
# AGENTS.md — Code Style (React + TypeScript)

> Категорийная точка входа для ИИ-агентов.
> Главы написаны на русском и покрывают стек-агностичный набор правил для React + TypeScript проектов.

---

## Scope

- Стиль кода и best practices для **React + TypeScript** в стек-агностичном виде.
- Детали TypeScript, компонентов, хуков, форм, состояния, стилей, тестов, accessibility, производительности, инструментов.

**Не покрывает** архитектуру размещения кода — это в [`../architecture/AGENTS.md`](../architecture/AGENTS.md).

---

## Working Protocol

Для любой задачи с React/TS кодом:

1. **Применяйте все главы из `universal/`** — они действуют всегда.
2. **Решите, где код лежит** — юрисдикция [`../architecture/AGENTS.md`](../architecture/AGENTS.md).
3. **Перед финишем** — пройдите pre-flight ниже.

---

## When to Read

| Глава | Когда открывать |
|---|---|
| [`universal/01-typescript.md`](universal/01-typescript.md) | Правите `tsconfig.json`, типизируете данные, нужны утилитные типы |
| [`universal/02-components.md`](universal/02-components.md) | Пишете React-компонент: props, композиция, именование, экспорт |
| [`universal/03-hooks.md`](universal/03-hooks.md) | Используете стандартные хуки (useState, useEffect, useReducer и т.д.) |
| [`universal/04-state-model.md`](universal/04-state-model.md) | Выбираете, где держать состояние (серверное / глобальное / локальное / форма / URL) |
| [`universal/05-forms-principles.md`](universal/05-forms-principles.md) | Работаете с формами: controlled/uncontrolled, a11y-ошибки, валидация-стратегия |
| [`universal/06-styling-principles.md`](universal/06-styling-principles.md) | Добавляете стили: scope, семантика, темизация |
| [`universal/07-accessibility.md`](universal/07-accessibility.md) | Делаете интерактивный UI: клавиатура, ARIA, focus |
| [`universal/08-testing-principles.md`](universal/08-testing-principles.md) | Пишете тест: behavior-first, query-приоритет, изоляция |
| [`universal/09-performance-principles.md`](universal/09-performance-principles.md) | Оптимизация: Suspense, Error Boundary, виртуализация, Web Vitals |
| [`universal/10-tooling.md`](universal/10-tooling.md) | Настраиваете ESLint, Prettier, pre-commit, CI |

---

## Hard Invariants

Эти правила действуют в **любом** React+TS репо:

- TypeScript `strict: true` — **MUST**.
- `any` запрещён вне узких границ — **MUST NOT** (см. [`universal/01-typescript.md`](universal/01-typescript.md)).
- Компоненты — только functional, с named-export, в kebab-case файлах — **MUST**.
- Rules of Hooks соблюдаются — **MUST**.
- Интерактивные элементы доступны с клавиатуры, semantic HTML предпочтителен ARIA — **MUST**.
- Тесты проверяют поведение, не реализацию; queries в приоритете `getByRole` → `getByLabelText` → … → `getByTestId` (последнее) — **MUST**.
- ESLint + Prettier настроены и прогоняются в CI — **MUST**.

---

## Pre-Flight Checklist

- [ ] `tsc --noEmit` проходит.
- [ ] ESLint без ошибок (`--max-warnings=0`).
- [ ] Prettier применён.
- [ ] Все новые публичные функции/компоненты типизированы, `any` только с обоснованием.
- [ ] Интерактивные элементы доступны с клавиатуры, ARIA/aria-labels проставлены где нужно.
- [ ] Добавлены/обновлены тесты на поведение.

---

## If Chapters Disagree with This File

Главы — **авторитетны**. Этот файл — навигация. Конфликт → следуйте главе, флагните несоответствие в выводе.
```

Verify:
```bash
grep -E "PROFILE|variants|\.\./\.\./AGENTS\.md" docs/code-style/AGENTS.md
```
Expected: no output.

### 6.15 Code-style README — significant rewrite

- [ ] **Step 18: Rewrite `docs/code-style/README.md` entirely**

Use the Write tool. New content:

```markdown
# Code Style Guide — React + TypeScript

> Расширенный справочник по стилю кода и best practices.
> Точка входа для агента: [`AGENTS.md`](AGENTS.md).

---

## Модель документации

Стек-агностичные правила, применимые к любому React + TypeScript проекту независимо от версии React (18+), выбранного стейт-менеджера, инструмента стилизации, тест-раннера и других инструментов.

Сюда входят принципы типизации, композиции компонентов, Rules of Hooks, доступность, семантика тестов, принципы производительности, ESLint/Prettier-контракт.

---

## Содержание

1. [`universal/01-typescript.md`](universal/01-typescript.md) — `tsconfig`, строгие флаги, типизация, утилитные типы, generics, `import type`.
2. [`universal/02-components.md`](universal/02-components.md) — function components, именование, props, композиция, условный рендер, ключи.
3. [`universal/03-hooks.md`](universal/03-hooks.md) — Rules of Hooks, useState/useEffect/useReducer/useRef/useContext/useTransition/useId, кастомные хуки.
4. [`universal/04-state-model.md`](universal/04-state-model.md) — пять слоёв состояния (server / global / local / form / URL).
5. [`universal/05-forms-principles.md`](universal/05-forms-principles.md) — контролируемые vs неконтролируемые, стратегия валидации, доступность форм.
6. [`universal/06-styling-principles.md`](universal/06-styling-principles.md) — scope, именование, темизация, анти-паттерны.
7. [`universal/07-accessibility.md`](universal/07-accessibility.md) — semantic HTML, ARIA, клавиатура, focus, motion.
8. [`universal/08-testing-principles.md`](universal/08-testing-principles.md) — behavior-first, приоритет queries, AAA, изоляция.
9. [`universal/09-performance-principles.md`](universal/09-performance-principles.md) — измерения, Suspense + Error Boundary, code-splitting, виртуализация, ресурсы.
10. [`universal/10-tooling.md`](universal/10-tooling.md) — ESLint, Prettier, husky + lint-staged, CI.

---

## Принципы, пронизывающие весь справочник

- **Typed by default** — TypeScript `strict`.
- **Behavior > implementation** — в тестах, API, типизации.
- **Server-first mindset** — серверный код по умолчанию, client при необходимости.
- **Semantic over ARIA** — нативный HTML побеждает кастомные роли.
- **Utility over bespoke** — переиспользуемые утилиты/компоненты вместо повторяющегося кода.
- **Measure before optimize** — перформанс-правила оправдываются профилем.
```

Verify:
```bash
grep -E "PROFILE|variants|\.\./\.\./AGENTS\.md" docs/code-style/README.md
```
Expected: no output.

### 6.16 Final global grep for broken refs

- [ ] **Step 19: Global broken-reference check**

Run:
```bash
grep -rE "\.\./\.\./AGENTS\.md|\.\./workflow|\.\./security|\.\./onboarding|\.\./decisions|\.\./_meta|\.\./PROFILE\.md|/variants/|CONTRIBUTING\.md|\.\./SECURITY\.md" docs/architecture docs/code-style
```
Expected: no output.

### 6.17 Commit

- [ ] **Step 20: Commit Task 6**

```bash
git add -- docs/architecture docs/code-style/AGENTS.md docs/code-style/README.md docs/code-style/universal
git commit -m "$(cat <<'EOF'
refactor(docs): fix cross-references after category removal

Removed references to deleted categories (workflow, security, onboarding,
decisions, _meta) and to deleted stack variants/PROFILE.md. Rewrote
code-style AGENTS.md and README.md to drop the universal/variants split.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Verify: `git log -1 --stat | head -3` shows the commit.

---

## Task 7: Remove root meta files

**Files:**
- Delete: `AGENTS.md` (root)
- Delete: `CONTRIBUTING.md`
- Delete: `SECURITY.md`
- Delete: `CHANGELOG.md`
- Delete: `.env.example`
- Delete: `package.json`

- [ ] **Step 1: Verify these files exist at root**

Run: `ls -1 AGENTS.md CONTRIBUTING.md SECURITY.md CHANGELOG.md .env.example package.json`
Expected: all 6 files listed.

- [ ] **Step 2: Delete all six files**

```bash
rm AGENTS.md CONTRIBUTING.md SECURITY.md CHANGELOG.md .env.example package.json
```

Verify:
```bash
ls AGENTS.md CONTRIBUTING.md SECURITY.md CHANGELOG.md .env.example package.json 2>&1
```
Expected: six "No such file or directory" errors.

- [ ] **Step 3: Commit**

```bash
git add -- AGENTS.md CONTRIBUTING.md SECURITY.md CHANGELOG.md .env.example package.json
git commit -m "$(cat <<'EOF'
chore: remove root meta files

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Verify: `git log -1 --stat | head -10` shows 6 file deletions.

---

## Task 8: Rewrite README.md

**Files:**
- Modify: `README.md` (full overwrite)

- [ ] **Step 1: Read current README (to satisfy Write-after-Read requirement)**

Use the Read tool on `README.md` once.

- [ ] **Step 2: Overwrite README.md**

Use the Write tool with this exact content:

```markdown
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

- [ ] **Step 3: Verify README length**

Run: `wc -l README.md`
Expected: around 22–25 lines.

- [ ] **Step 4: Commit**

```bash
git add -- README.md
git commit -m "$(cat <<'EOF'
docs: rewrite README for minimal scope

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Verify: `git log -1 --oneline` shows the commit.

---

## Final verification (after all 8 tasks)

- [ ] **Step 1: Repo root inventory**

Run: `ls -1 -A`
Expected:
```
.git
.gitattributes
.gitignore
.remember
LICENSE
README.md
docs
```
(plus `.claude` if the dev environment has it — that's fine).

Must NOT contain: `AGENTS.md`, `CHANGELOG.md`, `CONTRIBUTING.md`, `SECURITY.md`, `.env.example`, `package.json`, `scripts`, `.github`.

- [ ] **Step 2: docs/ inventory**

Run: `ls -1 docs`
Expected: `architecture`, `code-style`, `superpowers`.

Run: `ls -1 docs/code-style`
Expected: `AGENTS.md`, `README.md`, `universal`.

- [ ] **Step 3: Removed paths not mentioned anywhere in surviving docs**

Run:
```bash
grep -rE "docs/workflow|docs/security|docs/onboarding|docs/decisions|docs/_meta|/variants/|PROFILE\.md|CONTRIBUTING\.md|\.\./\.\./AGENTS\.md|\.\./SECURITY\.md" docs/architecture docs/code-style
```
Expected: no output.

Note: `docs/superpowers/specs/` and `docs/superpowers/plans/` are intentionally excluded from this grep because they document the simplification itself and may reference removed paths.

- [ ] **Step 4: No frontmatter remains in surviving chapters**

Run:
```bash
for f in docs/architecture/*.md docs/code-style/AGENTS.md docs/code-style/README.md docs/code-style/universal/*.md; do
  head -1 "$f" | grep -q '^---$' && echo "STILL HAS FRONTMATTER: $f"
done
```
Expected: no output.

- [ ] **Step 5: Commit count**

Run: `git log --oneline -8`
Expected: 8 new commits from this plan (one per task), newest first:
```
docs: rewrite README for minimal scope
chore: remove root meta files
refactor(docs): fix cross-references after category removal
chore: strip frontmatter from remaining chapters
chore: remove stack-specific code-style variants
chore: remove workflow, security, onboarding, decisions, _meta docs categories
chore: remove github meta
chore: remove installer and docs linter
```

---

## Done

The template is now:
- `README.md` (minimal) + `LICENSE` + `.gitattributes` + `.gitignore` at root
- `docs/architecture/` (11 files) + `docs/code-style/AGENTS.md` + `docs/code-style/README.md` + `docs/code-style/universal/` (10 chapters + their category entry points)
- `docs/superpowers/` (design + plan docs for this simplification)

All surviving markdown has no frontmatter, no references to deleted material, and stands on its own as a two-category stack-agnostic frontend documentation template.
