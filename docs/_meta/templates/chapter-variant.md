---
version: 1.0.3
last-reviewed: 2026-04-17
status: active
---

# Template — variant-глава

> Оглавление: [`../AGENTS.md`](../AGENTS.md). Стиль: [`../style-guide.md`](../style-guide.md). Метаданные: [`../frontmatter.md`](../frontmatter.md).

Шаблон для главы, применяющейся **условно** — только когда соответствующее поле в `PROFILE.md` активировано. Используется в `docs/code-style/variants/*` и в будущих variant-главах других категорий.

Скопируйте блок между `--- 8< ---`, поместите в `docs/<category>/variants/<имя>.md`, заполните плейсхолдеры.

---

--- 8< ---

```markdown
---
version: 1.0.0
last-reviewed: <YYYY-MM-DD>
status: active
requires:
  profile:
    <profile-field>: <profile-value>
  min:
    <dependency>: "<semver>"
---

# <NN — Тема>: <Инструмент> (variant)

> Оглавление: [`../README.md`](../README.md). Профиль стека: [`../PROFILE.md`](../PROFILE.md).
> **Активен, если в `PROFILE.md` <поле> = <значение>.**

<Одно-два предложения о том, какую область покрывает этот variant и в каких границах.>

---

## 1. Главные правила

- <Ключевое правило 1 с RFC 2119 keyword>.
- <Ключевое правило 2>.
- <Ключевое правило 3>.

---

## 2. Базовый setup

<Минимальный setup-пример, конфиг провайдера / клиента / рантайма.>

```ts
// пример инициализации
```

---

## 3. <Следующий раздел>

...

---

## Совместимость

- **Несовместим** с: <перечисление variant'ов, которые не могут быть активны одновременно>.
- **Требует**: <перечисление variant'ов, которые **MUST** быть активны дополнительно>, если такие есть.
- **Минимальные версии**: <ссылка на `requires.min` frontmatter'а>.

---

## N. Антипаттерны

- **<Паттерн>** — **MUST NOT**. <Почему.>
- **<Паттерн>** — **SHOULD NOT**. <Почему.>
```

--- 8< ---

---

## Правила заполнения

### Frontmatter — обязательно `requires`

Variant без `requires` **MUST NOT** существовать. Формат см. [`../frontmatter.md`](../frontmatter.md) раздел 3.

- `requires.profile.<field>` — поле из `PROFILE.md` в kebab-case (`server-state`, `forms-approach`, `primary-styling`, `test-runner` и т.п.).
- `requires.profile.<field>` — значение в kebab-case (`tanstack-query`, `react-hook-form`, `tailwind-4`, `vitest`).
- `requires.min` — минимальные версии runtime-зависимостей (не обязательно).

Каждому полю и значению в `requires.profile` **MUST** соответствовать реальное поле и опция в [`../../code-style/PROFILE.md`](../../code-style/PROFILE.md). Если таких ещё нет — добавьте их в `PROFILE.md` **в том же PR**.

### Имя файла

- Kebab-case, без номера (в `variants/` нумерация не используется — порядок условен, активация определяется profile).
- Формат: `<тема>-<инструмент>.md`: `state-tanstack-query.md`, `forms-react-hook-form.md`, `styling-tailwind.md`.
- Расширение — `.md`.

### Заголовок

- Формат: `# NN — <Тема>: <Инструмент> (variant)`. `NN` — порядковый в пределах темы (`04 — State: TanStack Query`, `04 — State: Zustand` — номер одинаковый, различие в названии инструмента).
- Маркер `(variant)` — **MUST**.

### Блок активации

Под заголовком и блоком навигации — **MUST** быть явное указание условия активации:

> **Активен, если в `PROFILE.md` <поле> = <значение>.**

Это дублирует `requires.profile` frontmatter'а для человеческого чтения.

### Контент

- Структура: Главные правила → Setup → Конкретные области (query-ключи, мутации, провайдеры и т.п.) → Совместимость → Антипаттерны.
- Примеры кода — только для покрываемого инструмента. Примеры из universal-главы **MUST NOT** копироваться сюда.
- Ссылки на universal-правила, которые применяются поверх variant'а — через markdown-ссылки на конкретные главы и разделы.

### Что не должно появляться в variant-главе

- **MUST NOT** — правила, применяющиеся независимо от инструмента (это universal).
- **MUST NOT** — упоминания других variant'ов как «используйте вместо этого» без explicit-ADR и `superseded-by`.
- **SHOULD NOT** — дублирование setup-кода из официальной документации инструмента. Вместо этого — ссылка на официальные docs + специфические **для этого репо** правила поверх.

---

## После создания

1. Обновите [`../../code-style/PROFILE.md`](../../code-style/PROFILE.md):
   - Добавьте опцию в соответствующее поле, если её не было.
   - Добавьте чекбокс в «Active Variant Modules» со ссылкой на новую главу.
2. Обновите [`../../code-style/AGENTS.md`](../../code-style/AGENTS.md):
   - Секция When to Read — Variants: добавьте строку в таблицу с условием активации.
   - Compatibility Matrix: если variant вводит новый конфликт — добавьте строку.
3. Если variant покрывает **новый домен** (не заменяет существующий) — откройте ADR в [`../../decisions/`](../../decisions/AGENTS.md).
4. Прогоните Pre-Flight из [`../AGENTS.md`](../AGENTS.md).
