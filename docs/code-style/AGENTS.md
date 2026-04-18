---
version: 1.0.0
last-reviewed: 2026-04-17
status: active
---

# AGENTS.md — Code Style (React + TypeScript)

> Категорийная точка входа для ИИ-агентов.
> Главы написаны на русском и организованы в **universal** (применимы ко всем React+TS репо) и **variants** (применимы в зависимости от стека конкретного репо). Конкретные версии и выбранные инструменты фиксируются в [`PROFILE.md`](PROFILE.md).

---

## Scope

- Стиль кода и best practices для **React + TypeScript** в стек-агностичном виде.
- Детали TypeScript, компонентов, хуков, форм, состояния, стилей, тестов, accessibility, производительности, инструментов.

**Не покрывает** архитектуру размещения кода — это в [`docs/architecture/`](../architecture/AGENTS.md).

---

## Working Protocol (обязательный порядок)

Для любой задачи с React/TS кодом:

1. **Прочитайте [`PROFILE.md`](PROFILE.md)** — узнайте версии стека и активные варианты.
   - Если `PROFILE.md` не заполнен (`TODO`) — **MUST** явно сообщить в ответе. Дальше действовать по **fallback-стратегии**, описанной в [`PROFILE.md`](PROFILE.md) разделе «Fallback-стратегия для незаполненных полей»: уточнить у разработчика; если нельзя — применять `universal/*` + consensus-дефолты 2026 и пометить вывод как требующий ревью.
2. **Применяйте все главы из `universal/`** — они действуют всегда, независимо от стека.
3. **Применяйте только отмеченные `[x]` модули из `variants/`** согласно `PROFILE.md`.
   - Неактивные варианты **MUST NOT** применяться, даже если правило кажется хорошим.
   - Если задача явно затрагивает область, для которой вариант не отмечен (например, надо писать форму, а поле `Forms approach` = `TODO`), — уточнить с разработчиком.
4. **Решите, где код лежит** — юрисдикция [`docs/architecture/`](../architecture/AGENTS.md).
5. **Перед финишем** — пройдите pre-flight ниже.

---

## When to Read — Universal

Эти главы применяются **всегда**.

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

## When to Read — Variants

Применяются **только если соответствующая строка в [`PROFILE.md`](PROFILE.md) отмечена `[x]`**.

### React / Compiler

| Глава | Условие активации |
|---|---|
| [`variants/react-19-features.md`](variants/react-19-features.md) | React ≥ 19 |
| [`variants/react-compiler.md`](variants/react-compiler.md) | React Compiler включён |
| [`variants/manual-memoization.md`](variants/manual-memoization.md) | React Compiler выключен/недоступен |

### State

| Глава | Условие |
|---|---|
| [`variants/state-tanstack-query.md`](variants/state-tanstack-query.md) | Server state = TanStack Query |
| [`variants/state-zustand.md`](variants/state-zustand.md) | Global client state = Zustand |
| [`variants/state-redux-toolkit.md`](variants/state-redux-toolkit.md) | Redux Toolkit (с RTK Query или без) |

### Forms

| Глава | Условие |
|---|---|
| [`variants/forms-react-19-actions.md`](variants/forms-react-19-actions.md) | Формы = React 19 Actions |
| [`variants/forms-react-hook-form.md`](variants/forms-react-hook-form.md) | Формы = React Hook Form |

### Styling

| Глава | Условие |
|---|---|
| [`variants/styling-tailwind.md`](variants/styling-tailwind.md) | Стили = Tailwind (3 или 4) |
| [`variants/styling-css-modules.md`](variants/styling-css-modules.md) | Стили = CSS Modules |

### Testing

| Глава | Условие |
|---|---|
| [`variants/testing-vitest.md`](variants/testing-vitest.md) | Test runner = Vitest |

---

## Hard Invariants (universal)

Эти правила действуют в **любом** React+TS репо, независимо от стека:

- TypeScript `strict: true` — **MUST**.
- `any` запрещён вне узких границ — **MUST NOT** (см. [`universal/01-typescript.md`](universal/01-typescript.md)).
- Компоненты — только functional, с named-export, в kebab-case файлах — **MUST**.
- Rules of Hooks соблюдаются — **MUST**.
- Интерактивные элементы доступны с клавиатуры, semantic HTML предпочтителен ARIA — **MUST**.
- Тесты проверяют поведение, не реализацию; queries в приоритете `getByRole` → `getByLabelText` → … → `getByTestId` (последнее) — **MUST**.
- ESLint + Prettier настроены и прогоняются в CI — **MUST**.

Правила, зависящие от стека (React Compiler, TanStack Query, Tailwind и т.д.), описаны в соответствующих `variants/`.

---

## Pre-Flight Checklist

- [ ] **`PROFILE.md` прочитан и проверен на согласованность** по [Compatibility Matrix](PROFILE.md#compatibility-matrix). Конфликтов нет, либо они разрешены отдельным PR.
- [ ] Активные варианты учтены, неактивные не применены.
- [ ] Если задача в legacy-области (значение поля помечено `(legacy)`) — применён только universal-минимум; в выводе отмечено «legacy-код, требуется миграция».
- [ ] `tsc --noEmit` проходит.
- [ ] ESLint без ошибок (`--max-warnings=0`).
- [ ] Prettier применён.
- [ ] Все новые публичные функции/компоненты типизированы, `any` только с обоснованием.
- [ ] Интерактивные элементы доступны с клавиатуры, ARIA/aria-labels проставлены где нужно.
- [ ] Добавлены/обновлены тесты на поведение.
- [ ] Правила активных `variants/*` применены; правила неактивных — не применены.

---

## If Chapters Disagree with This File

Главы — **авторитетны**. Этот файл — навигация. Конфликт → следуйте главе, флагните несоответствие в выводе.
