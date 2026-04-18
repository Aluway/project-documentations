---
version: 1.0.0
last-reviewed: 2026-04-17
status: accepted
id: 0008
date: 2026-04-17
supersedes: null
superseded-by: null
---

# ADR 0008: Ввод категории `docs/security/` для secrets, input handling и dependency supply chain

> Оглавление: [`README.md`](README.md).

---

## Status

accepted

---

## Context

Security-правила на момент принятия этого ADR были разрозненно упомянуты в нескольких местах:

- Корневой [`../../AGENTS.md`](../../AGENTS.md) — одна строка в Global Pre-Flight: «No secrets, `.env`, or credentials added to the commit».
- [`../workflow/01-git.md`](../workflow/01-git.md) — раздел 6 описывает обращение с `.env` и процедуру ротации при утечке.
- [`../code-style/universal/01-typescript.md`](../code-style/universal/01-typescript.md) и `02-components.md` — упоминают `dangerouslySetInnerHTML`, `eval`, runtime-валидацию внешних данных, но как побочные пункты.

Это оставляет пробелы:

1. **Нет единого места для security-правил.** Ревьюер, проверяющий PR на безопасность, вынужден помнить список разрозненных пунктов из четырёх разных глав.
2. **Нет политики добавления зависимостей.** Supply chain — один из главных векторов атак в JS-экосистеме (typo-squatting, compromised maintainer, malicious postinstall). Правил нет вообще.
3. **Нет систематики по input handling.** XSS-правила упомянуты вскользь; политика `dangerouslySetInnerHTML`, sanitization-библиотек, Trusted Types, URL-построения — не описана.
4. **Нет документированной процедуры при компрометации.** Ротация секретов коротко упомянута в workflow/01-git, но без response-plan'а.

Нужна отдельная категория, собирающая frontend-security в одном месте: секреты, input handling, dependencies.

---

## Decision

Принято следующее:

- **MUST** создать категорию [`../security/`](../security/AGENTS.md) с тремя главами:
  - `01-secrets.md` — что не коммитить, политика `.env`-файлов, различие публичных и секретных env-переменных, процедура при утечке, git-история как источник утечек.
  - `02-input-handling.md` — XSS, `dangerouslySetInnerHTML`, `eval`/`new Function`, sanitization-стратегии, URL-построение, user-generated content, Content Security Policy, Trusted Types.
  - `03-dependencies.md` — политика добавления пакетов (due diligence), lockfile-дисциплина, `npm audit` / `pnpm audit`, supply chain (dependabot / renovate / snyk), пиннинг версий, `postinstall`-скрипты, deprecated/заброшенные пакеты.
- Категория **MUST** следовать шаблону [`../_meta/templates/AGENTS-category.md`](../_meta/templates/AGENTS-category.md): Scope, When to Read, Working Protocol, Hard Invariants, Pre-Flight Checklist, «If Chapters Disagree with This File».
- Правила категории **MUST** быть стек-агностичны (frontend-focused); специфические детали для конкретного фреймворка (например, middleware-based CSP в Next.js) выносятся в проект-потомок через override-ADR.
- Корневой [`../../AGENTS.md`](../../AGENTS.md) **MUST** делегировать security-правила новой категории (в Document Map и Global Pre-Flight).
- Backend-специфичные темы (CSRF-токены server-side, SQL-injection, auth-протоколы) **MUST NOT** входить в эту категорию — она про frontend. Для них отдельная категория заводится в проекте-потомке при необходимости.

---

## Consequences

### Positive

- Ревьюер, проверяющий PR на безопасность, открывает одну категорию вместо четырёх разрозненных упоминаний.
- Политика зависимостей впервые документирована — раньше каждый автор решал «можно ли добавить пакет» по своему усмотрению.
- Процедура при утечке секрета систематизирована как response-plan, а не одна строка в git-главе.
- Корневой Global Pre-Flight может ссылаться на security-category Pre-Flight Checklist вместо дублирования одной строки.

### Negative

- Добавляется шестая категория — рост когнитивной нагрузки при знакомстве с репо. Смягчается фиксированной формой всех категорийных `AGENTS.md`.
- Часть правил пересекается с code-style (например, `dangerouslySetInnerHTML` — это security-правило, но упомянуто и в `02-components.md`). Дубликат избегается через ссылку: security-категория — единственный источник, code-style ссылается на неё.

### Neutral

- Категория стек-агностична — правила применимы к любому React + TS проекту без зависимости от PROFILE. Variants в категории не вводятся.

---

## Alternatives considered

- **Оставить security размазанным по существующим категориям.** Отклонено: см. Context. Пробелы остаются, ревью не систематизируется, политики deps нет вовсе.
- **Добавить security как `universal/11-security.md` в code-style.** Отклонено: security-правила не о стиле кода, а о границах доверия; смешение темы размывает scope code-style; input handling и dependency policy — явно отдельные области, не принципы компонентов или типизации.
- **Выделить в `docs/security/` с детальной категорией 6+ глав** (auth, session, CSP, CORS, storage, input, deps, secrets). Отклонено для template-репо: часть этих тем зависит от backend-контракта и фреймворка. Минимальная тройка (secrets, input, deps) покрывает универсальный frontend-минимум; остальное — проект-потомок добавит главами через новые ADR.
- **Сделать security частью workflow.** Отклонено: workflow — про процесс разработки (git, PR, release), security — про свойства кода. Смешение размывает scope обеих.

---

## References

- [`../security/AGENTS.md`](../security/AGENTS.md) — категорийная точка входа (создаётся в том же PR).
- [`../_meta/templates/AGENTS-category.md`](../_meta/templates/AGENTS-category.md) — шаблон `AGENTS.md`.
- [`../_meta/governance.md`](../_meta/governance.md) раздел 4 — процесс добавления категории.
- [ADR 0007](0007-introduce-workflow-category.md) — прецедент введения workflow-категории по той же схеме.
