---
version: 1.0.0
last-reviewed: 2026-04-17
status: active
---

# 02 — Типовые разветвления при форке

> Оглавление: [`README.md`](README.md).

Разветвления базового чек-листа [`01-first-fork.md`](01-first-fork.md) для проектов, которые отличаются от дефолтного предположения (React + TS single-package client-only).

Для каждого сценария — список **override'ов** и **добавлений**. Обычно требуется открыть override-ADR в [`../decisions/`](../decisions/AGENTS.md) с описанием, что именно заменяется и почему.

---

## 1. Монорепо (pnpm workspaces / Turborepo / Nx)

**Признаки**: несколько `package.json` под общим корнем, workspaces в корневом `package.json`, `turbo.json` / `nx.json`.

### Override'ы

- **Lockfile**: один корневой lockfile (`pnpm-lock.yaml` / `package-lock.json`). Per-package lockfile'ы **MUST NOT**.
- **[`../workflow/01-git.md`](../workflow/01-git.md) раздел 5**: правило «один lockfile» сохраняется, но в корне.
- **Commit scope** (workflow/01-git раздел 2): **SHOULD** включать имя пакета — `feat(ui-kit): add button`, `fix(api-client): retry on 503`.
- **[`../architecture/`](../architecture/AGENTS.md)**: FSD 2.1 применяется **per-package**. Каждый пакет — отдельное FSD-дерево. Cross-package импорты — только через объявленные public API пакета (обычно `package.json` main/exports).
- **PR размер**: предел 500 строк (workflow/02-pull-requests раздел 1) применяется per-пакет, не к общему diff'у.

### Добавления

- **ADR**: «Monorepo structure with <tool>» — обоснование выбора (pnpm workspaces vs Turborepo vs Nx), правила workspace-инвариантов.
- **Глава**: `docs/architecture/10-monorepo.md` со специфичными правилами: именование пакетов, публичный API пакета, release-стратегия (per-package vs unified versioning).
- **PROFILE.md**: поле `Monorepo tool` (pnpm-workspaces / turborepo / nx / yarn-workspaces / N/A) — добавляется в форке.

### Red-flag'и

- Версии зависимостей **должны** быть синхронизированы между пакетами (через `syncpack` / Renovate grouping). Рассинхрон — источник трудноотлавливаемых багов.
- Cross-package импорт через относительные пути (`../../../other-package/src/...`) — **MUST NOT**. Только через установленный workspace-протокол (`workspace:*`).

---

## 2. Fullstack (frontend + backend в одном репо)

**Признаки**: есть `backend/` / `server/` / `api/` директория с Node.js / Bun / Deno сервером, не только клиентский код.

### Override'ы

- **Categories scope**: существующие категории (architecture, code-style, security) покрывают **frontend-часть**. Для backend — нужны собственные аналоги.
- **[`../security/`](../security/AGENTS.md)**: frontend-фокус сохраняется; backend-specific (CSRF, SQL-injection, auth-middleware) **MUST** покрываться отдельной главой `docs/security/backend/` или новой категорией.

### Добавления

- **ADR**: «Fullstack repository structure» — почему не разделяем, как изолируем frontend и backend code, shared types.
- **Категория `docs/api/`** — источник контракта (OpenAPI / GraphQL schema / tRPC), клиент-сервер conventions, mocking-стратегия, versioning. Создаётся через [`../_meta/governance.md`](../_meta/governance.md) раздел 4.
- **Категория `docs/product/`** — доменная модель, глоссарий сущностей (часто общие между фронтом и бэком).
- **Глава**: `docs/architecture/10-frontend-backend-boundary.md` — где живут shared-типы, как генерируются из OpenAPI/GraphQL, правила изоляции.

### Red-flag'и

- Backend-код в frontend-слайсах (`pages/*/api/server.ts`) — **MUST NOT**. Строгая изоляция слоёв.
- Shared-типы, определённые дважды (в front и в back) — **MUST NOT**. Один источник истины (обычно генератор из схемы).

---

## 3. Next.js SSR-first / Server Components

**Признаки**: `Framework = Next.js 14+` (App Router), активное использование Server Components.

### Override'ы

- **[`../architecture/AGENTS.md`](../architecture/AGENTS.md)**: правила размещения кода под pages-first работают, но FSD-layer `pages` заменён / дополнен Next.js файловыми конвенциями (`app/*/page.tsx`). Либо:
  - Полностью перейти на Next.js конвенции: `app/` Next.js + `src/shared|entities|features|widgets` для переиспользуемого кода. **MUST** быть задокументировано ADR.
  - Либо сохранить FSD `pages/*`-слайсы и делать их экспорт через `app/*/page.tsx` как прокси. Более сложно, но ближе к шаблону.
- **[`../architecture/09-routing.md`](../architecture/09-routing.md)**: file-based routing противоречит явному `index.ts`-экспорту маршрута. **MUST** документировать в override-ADR, какие файлы (`page.tsx`, `layout.tsx`, `route.ts`) — единственный источник определения маршрута.
- **[`../code-style/variants/react-19-features.md`](../code-style/variants/react-19-features.md)**: применяется с особой аккуратностью к `"use client"` / `"use server"` границам — этот variant уже их покрывает.

### Добавления

- **ADR**: «FSD under Next.js App Router» — как сосуществуют FSD pages и file-based routing.
- **PROFILE.md**: `React Server Components: enabled` — новое поле для форка.
- **Глава**: `docs/architecture/10-server-client-boundary.md` — правила `"use client"` границ, серверные ошибки, hydration, streaming.
- **Глава**: `docs/security/04-csp-security-headers.md` — Next.js middleware для CSP, HSTS, Referrer-Policy.

### Red-flag'и

- Использование client-only хуков (`useState`, `useEffect`) в серверном компоненте без `"use client"` — **MUST NOT**.
- Секреты (`process.env.SECRET_KEY`) в клиентском компоненте — **MUST NOT**. См. [`../security/01-secrets.md`](../security/01-secrets.md) раздел 4.

---

## 4. Expo / React Native

**Признаки**: `Framework = Expo`, наличие `app.json` / `app.config.ts`, отсутствие DOM-API.

### Override'ы

- **[`../code-style/universal/02-components.md`](../code-style/universal/02-components.md)**: HTML-элементы (`<div>`, `<button>`) неприменимы; используются `<View>`, `<Pressable>`.
- **[`../code-style/universal/06-styling-principles.md`](../code-style/universal/06-styling-principles.md)**: CSS Modules / Tailwind не применимы в dev-time стиле; есть NativeWind, StyleSheet API, Tamagui.
- **[`../code-style/universal/07-accessibility.md`](../code-style/universal/07-accessibility.md)**: ARIA-атрибуты заменяются на `accessibilityRole` / `accessibilityLabel`. Основные принципы сохраняются.
- **[`../architecture/09-routing.md`](../architecture/09-routing.md)**: Expo Router — file-based; применяется та же логика override, что для Next.js App Router (см. раздел 3).
- **[`../security/02-input-handling.md`](../security/02-input-handling.md)**: XSS-вектора отличаются (нет DOM); фокус смещается на deep links, Linking API, WebView.

### Добавления

- **ADR**: «React Native / Expo adaptation» — список всех override'ов и что сохраняется.
- **Variant**: `variants/styling-nativewind.md` или `variants/styling-stylesheet.md` в зависимости от выбора.
- **Variant**: `variants/state-expo-router.md` если Expo Router выбран для роутинга.

### Red-flag'и

- Прямое использование `document.`, `window.`, DOM-API — **MUST NOT** без явного Platform-guard.
- Копирование шаблонов из web-глав без адаптации — **SHOULD NOT**, приводит к рантайм-ошибкам.

---

## 5. Solo-репо без CI

**Признаки**: один разработчик, нет публичного хостинга (или закрытый приватный), нет команды.

### Override'ы

- **[`.github/workflows/docs-lint.yml`](../../.github/workflows/docs-lint.yml)**: **MAY** удалить, если нет GitHub Actions / аналога. Линтер запускается вручную `npm run lint` перед коммитом.
- **[`../workflow/03-code-review.md`](../workflow/03-code-review.md)** раздел 1: self-review с паузой ≥ 1 часа между открытием и мёржем PR (уже документировано в самой главе). PR можно не открывать формально, но коммит-дисциплина сохраняется.
- **[`.github/CODEOWNERS`](../../.github/CODEOWNERS)**: удалить.
- **[`.github/PULL_REQUEST_TEMPLATE.md`](../../.github/PULL_REQUEST_TEMPLATE.md)** и ISSUE-шаблоны: удалить, если хостинг не GitHub.

### Добавления

Ничего обязательного. Solo-репо — минимальный стартовый сценарий.

### Red-flag'и

- **Отсутствие коммит-дисциплины**: «пушу всё в main одним коммитом в конце дня» — **MUST NOT**. Solo — не оправдание для нарушения [`../workflow/01-git.md`](../workflow/01-git.md). Через 6 месяцев `git log` станет нечитаемым.
- **Отсутствие тегов релизов**: солоer без hardcoded процесса релиза через полгода теряет понимание, какая версия где работает. Теги по semver + CHANGELOG — **SHOULD**.

---

## 6. Только документация (docs-only repo)

**Признаки**: форкнули template просто чтобы задокументировать что-то, без runtime-кода.

### Override'ы

- **[`../code-style/PROFILE.md`](../code-style/PROFILE.md)**: большинство полей — `N/A`. Заполнить только значимые:
  - `TypeScript version: N/A`
  - `React version: N/A`
  - Остальные — `N/A`.
- **Категории `architecture`, `code-style`, `security`**: **MAY** быть удалены из форка, если релевантность = 0. Удаление — через commit `chore: remove inapplicable categories for docs-only fork`, не через deprecation.
- **Линтер**: продолжает работать и полезен — валидирует структуру вашей собственной документации.

### Добавления

- **ADR**: «Docs-only adaptation» — описание удалённых категорий и оставшегося минимума.

### Red-flag'и

- Если оставляете `architecture` / `code-style` «на будущее, может пригодится» — **SHOULD NOT**. Мёртвые категории шумят; лучше удалить и восстановить, когда понадобится.

---

## 7. Что делать, если ваш сценарий не описан

Если ваш проект не вписывается в разветвления 1–6:

1. Пройдите [`01-first-fork.md`](01-first-fork.md) максимально строго по дефолту.
2. В местах, где дефолт неприменим — остановитесь, задокументируйте расхождение в draft-ADR.
3. Откройте issue в template-репо с описанием сценария. Это сигнал, что документация нуждается в обновлении — возможно, появится разветвление 8+ в этой главе.
4. Продолжите работу по draft-ADR; после валидации на практике — переведите в `accepted`.

---

## 8. Комбинации разветвлений

Реальные проекты часто попадают в несколько сценариев одновременно:

- **Fullstack + монорепо** (раздел 1 + раздел 2): добавляется `docs/api/` в одном из packages + monorepo-правила.
- **Next.js SSR + монорепо** (раздел 3 + раздел 1): next.js-пакет как один из workspace'ов.
- **Expo + солo** (раздел 4 + раздел 5): простейший мобильный MVP.

Для каждой комбинации override'ы **MUST** применяться **аддитивно**; противоречия между override'ами — крайне редки, но разрешаются через ADR с явным выбором приоритета.
