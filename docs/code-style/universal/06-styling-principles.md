---
version: 1.0.0
last-reviewed: 2026-04-17
status: active
---

# 06 — Принципы стилизации (universal)

> Оглавление: [`../README.md`](../README.md). Профиль стека: [`../PROFILE.md`](../PROFILE.md).

Универсальные принципы стилизации, независимые от инструмента. Конкретные инструменты — в `variants/styling-tailwind.md`, `variants/styling-css-modules.md`.

---

## 1. Выбор инструмента

Определяется через [`../PROFILE.md`](../PROFILE.md), поле `Primary styling`.

| Значение | Активный вариант |
|---|---|
| Tailwind 3/4 | [`variants/styling-tailwind.md`](../variants/styling-tailwind.md) |
| CSS Modules | [`variants/styling-css-modules.md`](../variants/styling-css-modules.md) |
| styled-components / Emotion (legacy) | только этот файл + план миграции |
| vanilla-extract | отдельный вариант (создать по необходимости) |
| other | описать в `variants/` или в команде |

---

## 2. Scope стилей

- Стили компонента **MUST** быть scoped к нему. Глобальные классы с общими именами (`.card`, `.btn`, `.container`) **MUST NOT** использоваться.
- Способ scoping'а — инструмент зависит от профиля (Tailwind utility, CSS Modules, scoped selector от фреймворка).

---

## 3. Темизация

- Токены темы (цвета, радиусы, отступы, тени, типографика) **MUST** храниться в одном месте как CSS-переменные или эквивалент инструмента.
- Переключение light/dark **MUST** работать без FOUC: тема инициализируется до первого paint'а (блокирующий script в `<head>` или аналог).
- Тема **MUST** сохраняться между сессиями (localStorage, cookies).

✓ Базовая модель через CSS-переменные:
```css
:root {
  --color-bg: oklch(99% 0 0);
  --color-fg: oklch(15% 0 0);
}
[data-theme="dark"] {
  --color-bg: oklch(15% 0.01 258);
  --color-fg: oklch(95% 0 0);
}
```

---

## 4. Что лежит глобально

✓ Разрешено:
- Reset / normalize.
- CSS-переменные темы.
- `@font-face`.
- `html`/`body`-уровневые настройки (`color-scheme`, базовый font).

✗ Не лежит глобально:
- Стили компонентов.
- Классы с общими именами вроде `.container`, `.card`, `.btn`.

---

## 5. Анимации

- CSS-transitions и `@keyframes` для простых случаев.
- Сторонние либы (motion, react-spring) — для сложной оркестрации или физики.
- Все анимации **MUST** уважать `prefers-reduced-motion`: либо отключаться, либо смягчаться.

```css
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

---

## 6. Цвет и контраст

- Контраст текста **MUST** соответствовать WCAG AA: **4.5:1** для обычного, **3:1** для крупного (см. [`07-accessibility.md`](07-accessibility.md)).
- Цвет **MUST NOT** быть единственным каналом передачи информации: всегда плюс иконка/текст.
- Предпочитайте цветовые пространства `oklch` / `lch` над `hsl` — они perceptually uniform, проще генерировать палитры и избежать конфликтов контраста.

---

## 7. Inline-style

- `style={{...}}` **MUST NOT** использоваться для статических значений (для них — классы).
- **MAY** использоваться для **действительно динамических значений**, которые нельзя выразить в классах (позиционирование по координатам, динамический цвет от data).

```tsx
<div style={{ transform: `translateX(${x}px)` }} />
```

---

## 8. Запрещённые паттерны

- **Runtime CSS-in-JS** (styled-components, Emotion с runtime) в новых проектах — **MUST NOT**. Производительность и bundle size хуже scoped-альтернатив.
- **Глобальные `.card` / `.btn` / `.container` классы** — **MUST NOT**.
- **`!important`** без крайней необходимости — **SHOULD NOT**. Обычно указывает на проблему специфичности.
- **Смешивание CSS Modules и inline-style в одном компоненте** без необходимости — **SHOULD NOT**.
- **Полагаться на каскад между компонентами** — **MUST NOT**. Каждый компонент изолирован.
- **Цвет как единственный канал статуса** (красное/зелёное без текста) — **MUST NOT**.

---

## 9. Zero-runtime приоритет

Для прод-сборки **SHOULD** выбирать zero-runtime подходы:
- Tailwind (CSS генерируется build-time).
- CSS Modules.
- vanilla-extract.

Они дают меньшие бандлы и лучшее first-paint.
