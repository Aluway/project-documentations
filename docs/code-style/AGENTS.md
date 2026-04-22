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
