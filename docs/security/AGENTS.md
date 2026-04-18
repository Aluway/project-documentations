---
version: 1.0.0
last-reviewed: 2026-04-17
status: active
---

# AGENTS.md — Security (secrets, input handling, dependencies)

> Категорийная точка входа для ИИ-агентов.
> Главы написаны на русском. Покрывают frontend-security: что не коммитить, как обращаться с пользовательским вводом, как добавлять и поддерживать зависимости.

---

## Scope

Эта категория покрывает **стек-агностичный минимум frontend-security**:

- Политика секретов: что не коммитить, различие публичных и секретных env-переменных, процедура при утечке.
- Обращение с пользовательским вводом: XSS, `dangerouslySetInnerHTML`, `eval` / `new Function`, sanitization, URL-построение, CSP, Trusted Types.
- Управление зависимостями: политика добавления, lockfile, audit, supply chain, `postinstall`, deprecated-пакеты.

**Не покрывает**:

- Backend-security (CSRF-токены на стороне сервера, SQL-injection, протоколы auth) — это в отдельной категории проекта-потомка, когда появится backend.
- Инфраструктурная security (DDoS, WAF, firewall) — вне scope'а frontend-репо.
- Legal / compliance (GDPR, HIPAA, DPA) — проект-специфично, решается через ADR в потомке.

---

## When to Read

| Глава | Когда открывать |
|---|---|
| [`README.md`](README.md) | Первый заход: обзор категории, состав глав, принципы. |
| [`01-secrets.md`](01-secrets.md) | Добавляете env-переменную, создаёте `.env.example`, обнаружили утечку, настраиваете предкоммит-скан. |
| [`02-input-handling.md`](02-input-handling.md) | Рендерите user-generated content, используете `dangerouslySetInnerHTML`, строите URL из данных, настраиваете CSP. |
| [`03-dependencies.md`](03-dependencies.md) | Добавляете npm-пакет, обновляете lockfile, настраиваете dependabot / renovate, обрабатываете `npm audit`. |

---

## Working Protocol

Для задачи, затрагивающей security:

1. **Определите область**:
   - работа с env-переменными, secrets, credentials → [`01-secrets.md`](01-secrets.md);
   - рендер / обработка внешних данных → [`02-input-handling.md`](02-input-handling.md);
   - добавление / обновление пакета → [`03-dependencies.md`](03-dependencies.md).
2. **Прочитайте релевантную главу** — инварианты и примеры.
3. **Примените правила** — соблюдая RFC 2119 keywords.
4. **Верификация перед финишем** — Pre-Flight Checklist ниже плюс [Global Pre-Flight](../../AGENTS.md#global-pre-flight).

---

## Hard Invariants

- Секреты (`API_KEY`, tokens, пароли, приватные ключи) **MUST NOT** попадать в git-историю, bundle или клиентский код. См. [`01-secrets.md`](01-secrets.md).
- `.env`, `.env.*.local` и другие файлы с реальными значениями **MUST NOT** коммититься; `.env.example` — **MUST** быть в репо.
- Публичные env-переменные (`NEXT_PUBLIC_*`, `VITE_*`, `PUBLIC_*`) попадают в client bundle — **MUST NOT** содержать секреты.
- При утечке секрета **MUST** выполняться процедура из [`01-secrets.md`](01-secrets.md) раздел 5: немедленная ротация → чистка истории → уведомление → post-mortem.
- `dangerouslySetInnerHTML` **MUST NOT** применяться без явной sanitization через trusted библиотеку (DOMPurify / sanitize-html). См. [`02-input-handling.md`](02-input-handling.md).
- `eval`, `new Function(...)`, `setTimeout(<string>, ...)` — **MUST NOT**.
- Внешние данные **MUST** валидироваться на границе (runtime-валидация через Zod / Valibot / Yup). См. [`../code-style/universal/01-typescript.md`](../code-style/universal/01-typescript.md) раздел 3.
- URL, построенные из user-input **MUST** использовать `URL` / `URLSearchParams`, не конкатенацию строк. См. [`02-input-handling.md`](02-input-handling.md).
- Новая прямая зависимость **MUST** пройти due diligence по чек-листу из [`03-dependencies.md`](03-dependencies.md) раздел 1 перед добавлением.
- Lockfile **MUST** быть в репо; расхождение `package.json` ↔ lockfile **MUST NOT** приниматься в мёрж.
- `npm audit` / `pnpm audit` на уровне high/critical **MUST** быть резолвнут или явно exception'ed с обоснованием перед релизом.

---

## Pre-Flight Checklist

- [ ] Нет новых секретов, `.env`-значений, API-ключей, токенов в diff'е.
- [ ] Если введена новая env-переменная — она задокументирована в [`.env.example`](../../.env.example) с комментарием о происхождении значения.
- [ ] Публичные env-переменные (`NEXT_PUBLIC_*` и т.п.) не содержат того, что не должно быть в bundle.
- [ ] `dangerouslySetInnerHTML` — отсутствует либо обёрнут в sanitization.
- [ ] Нет `eval`, `new Function`, `setTimeout(<string>)`, `setInterval(<string>)`.
- [ ] Внешние данные валидируются на границе (schema-парсер, не ручная проверка).
- [ ] URL и HTML-атрибуты, построенные из данных — через безопасные API (`URL`, `URLSearchParams`, `JSON.stringify`, не конкатенация).
- [ ] Новые зависимости прошли due diligence (см. [`03-dependencies.md`](03-dependencies.md) раздел 1).
- [ ] Lockfile обновлён в том же коммите, что и `package.json`.
- [ ] `npm audit` (или аналог) пройден — high/critical резолвнуты или exception'ed.

---

## If Chapters Disagree with This File

Главы в `docs/security/` — **авторитетны**. Этот файл — навигация. Если правило здесь конфликтует с главой, следуйте главе и явно укажите в выводе несоответствие, чтобы его исправили.
