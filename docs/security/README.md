---
version: 1.0.0
last-reviewed: 2026-04-17
status: active
---

# Security — frontend-минимум

> Точка входа для агента: [`AGENTS.md`](AGENTS.md). Обоснование категории: [ADR 0008](../decisions/0008-introduce-security-category.md).

Категория собирает стек-агностичный минимум frontend-security: что не коммитить, как обращаться с пользовательским вводом, как добавлять и поддерживать зависимости. Применяется ко всем репозиториям-потомкам этого шаблона.

---

## Scope — почему минимум

В шаблонном репо зафиксированы только универсально применимые правила. Проекты-потомки расширяют категорию под свой контекст:

- Next.js с SSR и middleware добавит главу по CSP и security-headers.
- Проект с OAuth-флоу добавит главу по session storage и токен-хранению.
- Продукт, обрабатывающий чувствительные данные (health, finance), добавит compliance-главу с привязкой к PII / PHI.

Расширение — через новые главы и/или новые ADR со `supersedes: <id>` в форке.

---

## Содержание

1. [`01-secrets.md`](01-secrets.md) — Секреты, `.env`-файлы, публичные vs секретные переменные, процедура при утечке, история git как источник утечек.
2. [`02-input-handling.md`](02-input-handling.md) — XSS, `dangerouslySetInnerHTML`, `eval`, sanitization, URL-построение, user-generated content, Content Security Policy, Trusted Types.
3. [`03-dependencies.md`](03-dependencies.md) — Due diligence при добавлении пакета, lockfile-дисциплина, audit, supply chain, `postinstall`, deprecated-пакеты.

---

## Принципы, пронизывающие категорию

- **Защита в глубину.** Один слой обойдётся; их должно быть несколько. Sanitization на рендере **и** CSP **и** Trusted Types — не избыточность, а defense-in-depth.
- **Secrets MUST NOT reach the client.** Всё, что попадает в bundle — публично. `NEXT_PUBLIC_*`, `VITE_*`, любое значение, инлайнящееся на этапе сборки — de facto публичный атрибут приложения.
- **Никогда не доверяй внешним данным.** Внешние — значит не под вашим контролем: user input, API response, URL params, localStorage, cookies, file upload. Валидация — на границе ввода, не «по мере использования».
- **Изолируйте runtime code execution.** `eval`, `new Function`, `setTimeout(<string>)`, `innerHTML` с непроверенным содержимым — каждый из них позволяет выполнить код атакующего в контексте вашего приложения.
- **Supply chain — ваша ответственность.** Каждая transitive-зависимость — чей-то код в вашем bundle. Due diligence при добавлении, lockfile в репо, audit на CI.
- **Скомпрометирован — считай скомпрометированным везде.** Утечка одного секрета означает ротацию всего, что этот секрет видел. Не «поправим позже».

---

## Официальные источники

- OWASP Top 10 Web Application Security Risks: https://owasp.org/www-project-top-ten/
- OWASP Cheat Sheet Series (XSS Prevention, CSP, Secrets Management): https://cheatsheetseries.owasp.org/
- MDN: Content Security Policy: https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
- MDN: Trusted Types: https://developer.mozilla.org/en-US/docs/Web/API/Trusted_Types_API
- DOMPurify: https://github.com/cure53/DOMPurify
- npm security best practices: https://docs.npmjs.com/security-best-practices
- GitHub Supply Chain Security (dependabot / code scanning / secret scanning): https://docs.github.com/en/code-security
