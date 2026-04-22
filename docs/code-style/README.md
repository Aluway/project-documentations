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
