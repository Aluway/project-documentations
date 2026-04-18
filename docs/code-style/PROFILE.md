---
version: 1.0.1
last-reviewed: 2026-04-17
status: active
---

# PROFILE — Repository Stack

> **Этот репозиторий — шаблон документации.** `TODO` во всех полях — по дизайну: реальный стек фиксируется при форке/копировании в конкретный проект.
> В template-репо `PROFILE.md` **MUST** оставаться незаполненным. В проекте-потомке — **MUST** быть заполнен в первом же PR после копирования; дальше обновляется по [governance, раздел 2](../_meta/governance.md#2-каденс-ревью) при смене стека.
> Пока поле содержит `TODO`, агент **MUST** при первой необходимости применить соответствующее правило либо уточнить у разработчика, либо явно пометить вывод как требующий проверки. Подробности — [Fallback-стратегия](#fallback-стратегия-для-незаполненных-полей) ниже.

---

## Core

- **React version:** TODO <!-- 18.x / 19.x / 20.x -->
- **TypeScript version:** TODO <!-- 5.0+ -->
- **Node.js:** TODO <!-- 20 LTS / 22 LTS / 24 -->
- **Build tool / Framework:** TODO <!-- Next.js 16 / Next.js 15 / Vite 6 / Remix / Expo / CRA (legacy) / custom -->
- **Package manager:** TODO <!-- npm / pnpm / yarn -->

## Compiler

- **React Compiler:** TODO <!-- enabled / disabled / N/A (React < 19) -->

## State Management

- **Server state:** TODO <!-- TanStack Query / SWR / RTK Query / Apollo Client / manual / N/A -->
- **Global client state:** TODO <!-- Zustand / Redux Toolkit / Jotai / Context only / N/A -->

## Forms

- **Forms approach:** TODO <!-- React 19 Actions / React Hook Form / Formik (legacy) / native / mixed -->
- **Validation:** TODO <!-- Zod / Valibot / Yup / manual / N/A -->

## Styling

- **Primary styling:** TODO <!-- Tailwind 4 / Tailwind 3 / CSS Modules / styled-components (legacy) / vanilla-extract / Emotion / other -->
- **Component primitives:** TODO <!-- shadcn/ui / Radix / Headless UI / MUI / Ant Design / custom / none -->

## Testing

- **Test runner:** TODO <!-- Vitest / Jest / none -->
- **Component testing:** TODO <!-- React Testing Library / Enzyme (legacy) / none -->
- **HTTP mocking:** TODO <!-- MSW / fetch-mock / manual / none -->

## Tooling

- **ESLint:** TODO <!-- 9 (flat config) / 8 (legacy) / none -->
- **Prettier:** TODO <!-- yes / no -->

---

## Active Variant Modules

Отметьте `[x]` только те варианты, которые активны в этом репо. Агент **MUST** применять `universal/*` всегда и **только** отмеченные `variants/*`.

### React / Compiler
- [ ] `variants/react-19-features.md` — если React ≥ 19 (use, useActionState, useOptimistic, useFormStatus, Actions, ref-as-prop)
- [ ] `variants/react-compiler.md` — если React Compiler **включён**
- [ ] `variants/manual-memoization.md` — если React Compiler **выключен** или недоступен

### State
- [ ] `variants/state-tanstack-query.md` — если серверный state через TanStack Query
- [ ] `variants/state-zustand.md` — если глобальный клиентский state через Zustand
- [ ] `variants/state-redux-toolkit.md` — если используется Redux Toolkit (с RTK Query или без)

### Forms
- [ ] `variants/forms-react-19-actions.md` — если формы через React 19 Actions
- [ ] `variants/forms-react-hook-form.md` — если формы через React Hook Form

### Styling
- [ ] `variants/styling-tailwind.md` — если стили через Tailwind (3 или 4)
- [ ] `variants/styling-css-modules.md` — если стили через CSS Modules

### Testing
- [ ] `variants/testing-vitest.md` — если test runner — Vitest

---

## Как пользоваться этим файлом

1. При инициализации репо — **заполнить** все `TODO` актуальными значениями.
2. Отметить активные варианты галочками.
3. Закоммитить — `PROFILE.md` становится источником истины для агента.
4. При смене стека (например, миграция React 18 → 19) — обновить `PROFILE.md` в том же PR, где делается миграция.

Если какая-то категория не применима (например, в репо нет форм) — поставьте `N/A` в соответствующем поле и не отмечайте варианты из этой категории.

---

## Fallback-стратегия для незаполненных полей

Если агент получает задачу в области, где профиль не заполнен (`TODO`):

1. **Попытаться уточнить у разработчика** — задать один конкретный вопрос о поле, которое мешает продолжить.
2. **Если уточнить невозможно (автономный режим) — работать по консервативной базовой линии:**
   - Применять **все правила `universal/*`** (они не зависят от стека).
   - Для вариативных областей использовать **consensus-дефолт 2026**: React 19, TS 5.9, React Compiler **отключён** (безопаснее для неизвестного кода), TanStack Query + Zustand, React Hook Form + Zod для сложных форм, Tailwind 4, Vitest + RTL, ESLint 9 flat config.
   - Если в репо обнаруживаются явные признаки другого стека (`package.json` показывает Redux Toolkit, или `tailwind.config.js` v3) — **сначала** обновить `PROFILE.md` в том же PR, **затем** работать по нему.
3. **В выводе задачи MUST пометить:** какие поля `PROFILE.md` были неизвестны, какие дефолты применены, и что требуется ревью перед мёржем.
4. **После успешного ревью** — заполнить `PROFILE.md` реальными значениями в следующем PR (или в текущем, если ревьюер подтвердил).

Этот fallback — временная мера. Корректная работа команды подразумевает заполненный `PROFILE.md` в каждом репо.

---

## Compatibility Matrix

Следующие сочетания значений — **несовместимы**. Агент **MUST** проверить эти пары перед началом задачи и при обнаружении конфликта либо уточнить у разработчика, либо открыть отдельный PR «fix profile inconsistency» перед продолжением работы.

| Поле 1 | Значение | Поле 2 | Требование | Конфликт, если… |
|---|---|---|---|---|
| React version | `< 19` | React Compiler | MUST быть `disabled` или `N/A` | React 18.x + Compiler `enabled` |
| React version | `< 19` | Forms approach | **SHOULD NOT** быть `React 19 Actions` | React 18.x + React 19 Actions |
| Framework | `Next.js 14` или старше | React Compiler | **SHOULD** быть `disabled` (нестабильно) | Next.js 14 + Compiler `enabled` |
| Framework | `Next.js 15` | React Compiler | MAY быть `enabled` через `experimental.reactCompiler` | — (не конфликт, просто experimental) |
| ESLint | `8 (legacy)` | Forms / State / любые активные варианты | **SHOULD** мигрировать на ESLint 9 | — (работоспособно, но документация предполагает 9) |
| Primary styling | любой Tailwind | Prettier | MUST быть `yes` с `prettier-plugin-tailwindcss` | Tailwind активен + Prettier = `no` |
| Test runner | `Jest` | активные `variants/testing-*.md` | Vitest-гайд не применяется; используется универсальный минимум | Vitest-правила к Jest-коду |
| Component testing | `Enzyme (legacy)` | — | **MUST** мигрировать на React Testing Library | — (блокер для новых компонентов) |

**Если обнаружен конфликт:**
1. Остановить работу над текущей задачей.
2. Сообщить в выводе: какие поля конфликтуют, какое правило нарушено.
3. Ждать уточнения от разработчика. В автономном режиме — обновить `PROFILE.md` в том же PR с объяснением в commit-сообщении, либо в новом PR.
4. Только после устранения конфликта возобновить работу.

---

## Правила для legacy-стеков

Если поле `PROFILE.md` содержит значение, помеченное `(legacy)` (`Formik (legacy)`, `styled-components (legacy)`, `Enzyme (legacy)`, `CRA (legacy)`):

- Отдельного `variants/*` модуля для него **нет и не создаётся**.
- Применяется **только** набор `universal/*` — его базового минимума достаточно для большинства правок в legacy-коде.
- **MUST NOT** применять правила variants для поддерживаемого стека к legacy-коду (например, правила React Hook Form к коду на Formik) — это приводит к несогласованности.
- Для любой нетривиальной правки в legacy-области **SHOULD** открыть ADR (`docs/decisions/`) с планом миграции на поддерживаемый инструмент.
- Новые фичи в проекте **SHOULD** писаться уже на поддерживаемом стеке (отдельный PR для миграции + фича).

Агенту при задаче в legacy-области достаточно: применить universal-минимум, явно пометить в выводе «legacy-код, требуется миграция (см. ADR)», не пытаться применять незнакомые правила.
