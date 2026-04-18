---
version: 1.0.0
last-reviewed: 2026-04-17
status: active
---

# Code Style Guide — React + TypeScript

> Расширенный справочник по стилю кода и best practices.
> Точка входа для агента: [`AGENTS.md`](AGENTS.md). Профиль стека конкретного репо: [`PROFILE.md`](PROFILE.md).

---

## Модель документации

Справочник разделён на две части:

### 1. `universal/` — действует всегда

Правила, применимые к любому React + TypeScript проекту независимо от:
- версии React (18, 19, 20);
- выбранного стейт-менеджера;
- инструмента стилизации;
- тест-раннера и других инструментов.

Сюда входят принципы типизации, композиции компонентов, Rules of Hooks, доступность, семантика тестов, принципы производительности, ESLint/Prettier-контракт.

### 2. `variants/` — применимы условно

Модули, покрывающие конкретные инструменты и версии. Активируются согласно [`PROFILE.md`](PROFILE.md) в конкретном репозитории.

Пример: `variants/state-tanstack-query.md` применяется **только** если в репо действительно используется TanStack Query. Если в репо Redux Toolkit — этот модуль не читается, вместо него берётся `variants/state-redux-toolkit.md`.

### 3. `PROFILE.md` — ключ к variants

В каждом репо этот файл заполняется под его реальный стек: версия React, выбор стейт-менеджера, CSS-подход, тест-раннер и т.д. Агент читает `PROFILE.md` первым и узнаёт, какие модули `variants/` активны.

До заполнения (`TODO` в полях) агент применяет только `universal/` и уточняет у разработчика, когда упирается в вариативное правило.

---

## Содержание

### Universal (всегда активно)

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

### Variants (условно активные)

**React / Compiler:**
- [`variants/react-19-features.md`](variants/react-19-features.md)
- [`variants/react-compiler.md`](variants/react-compiler.md)
- [`variants/manual-memoization.md`](variants/manual-memoization.md)

**State:**
- [`variants/state-tanstack-query.md`](variants/state-tanstack-query.md)
- [`variants/state-zustand.md`](variants/state-zustand.md)
- [`variants/state-redux-toolkit.md`](variants/state-redux-toolkit.md)

**Forms:**
- [`variants/forms-react-19-actions.md`](variants/forms-react-19-actions.md)
- [`variants/forms-react-hook-form.md`](variants/forms-react-hook-form.md)

**Styling:**
- [`variants/styling-tailwind.md`](variants/styling-tailwind.md)
- [`variants/styling-css-modules.md`](variants/styling-css-modules.md)

**Testing:**
- [`variants/testing-vitest.md`](variants/testing-vitest.md)

---

## Расширение

Когда в команде появляется новый инструмент (например, MobX или Jest) — создаётся новый модуль в `variants/` с таким же шаблоном (Scope / Правила / Примеры / Анти-паттерны), и добавляется чекбокс в [`PROFILE.md`](PROFILE.md). Изменения в universal-главах делаются редко и только по согласованию, потому что они влияют на все репо.

---

## Принципы, пронизывающие весь справочник

- **Typed by default** — TypeScript `strict`.
- **Behavior > implementation** — в тестах, API, типизации.
- **Server-first mindset** — серверный код по умолчанию, client при необходимости.
- **Semantic over ARIA** — нативный HTML побеждает кастомные роли.
- **Utility over bespoke** — переиспользуемые утилиты/компоненты вместо повторяющегося кода.
- **Measure before optimize** — перформанс-правила оправдываются профилем.
