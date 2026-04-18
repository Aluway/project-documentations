---
version: 1.0.0
last-reviewed: 2026-04-17
status: active
requires:
  profile:
    primary-styling: css-modules
---

# 10 — Styling: CSS Modules (variant)

> Оглавление: [`../README.md`](../README.md). Профиль стека: [`../PROFILE.md`](../PROFILE.md).
> **Активен, если в `PROFILE.md` Primary styling = CSS Modules.**

Правила работы с CSS Modules. Совместимо с Vite, Next.js, webpack (через `css-loader`).

---

## 1. Главные правила

- Один CSS Module на компонент — лежит рядом в kebab-case: `user-card.tsx` ↔ `user-card.module.css`.
- Имена классов **SHOULD** быть в **camelCase** (CSS Modules автоматически маппит на JS).
- Глобальные классы **MUST NOT** использоваться (противоречит идее scoping'а).
- Для темизации и общих токенов — CSS-переменные в `:root` / `[data-theme="..."]`.

---

## 2. Минимальный пример

```css
/* user-card.module.css */
.card {
  padding: 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.title {
  font-weight: 600;
  color: var(--color-fg);
}

.description {
  color: var(--color-muted);
  margin-top: 0.25rem;
}
```

```tsx
// user-card.tsx
import styles from "./user-card.module.css";

interface UserCardProps {
  title: string;
  description?: string;
}

export function UserCard({ title, description }: UserCardProps) {
  return (
    <article className={styles.card}>
      <h3 className={styles.title}>{title}</h3>
      {description ? <p className={styles.description}>{description}</p> : null}
    </article>
  );
}
```

---

## 3. Объединение классов

Используйте `clsx` (или `classnames`) для условных/множественных классов:

```tsx
import { clsx } from "clsx";
import styles from "./button.module.css";

export function Button({ variant = "primary", disabled, className, ...rest }: ButtonProps) {
  return (
    <button
      className={clsx(styles.button, styles[variant], disabled && styles.disabled, className)}
      disabled={disabled}
      {...rest}
    />
  );
}
```

- **MUST** использовать именованный доступ (`styles.button`, `styles[variant]`), не шаблонные строки.

---

## 4. `composes` для переиспользования

```css
/* button.module.css */
.base {
  padding: 0.5rem 1rem;
  border-radius: var(--radius-md);
}

.primary {
  composes: base;
  background: var(--color-brand);
  color: white;
}

.secondary {
  composes: base;
  background: var(--color-neutral-100);
}
```

- `composes` — CSS-Modules-специфичный способ наследования.
- **SHOULD** использоваться вместо дублирования базовых стилей.

---

## 5. CSS-переменные для темизации

Глобальные токены — в корне приложения (например, `app/globals.css`):

```css
:root {
  --color-bg: oklch(99% 0 0);
  --color-fg: oklch(15% 0 0);
  --color-brand: oklch(62% 0.18 258);
  --color-border: oklch(90% 0 0);
  --color-muted: oklch(50% 0 0);
  --radius-md: 0.5rem;
}

[data-theme="dark"] {
  --color-bg: oklch(15% 0.01 258);
  --color-fg: oklch(95% 0 0);
  --color-border: oklch(30% 0.01 258);
  --color-muted: oklch(65% 0 0);
}
```

- В CSS Modules **MUST** ссылаться только на эти переменные, не на прямые значения.

---

## 6. Media-queries и pseudo-classes

```css
.card {
  padding: 0.75rem;
}

.card:hover {
  background: var(--color-neutral-50);
}

@media (min-width: 768px) {
  .card { padding: 1.5rem; }
}

@media (prefers-reduced-motion: reduce) {
  .card { transition: none; }
}
```

- **MUST** уважать `prefers-reduced-motion` для анимаций (см. [`../universal/07-accessibility.md`](../universal/07-accessibility.md) раздел 11).

---

## 7. Вложенность — CSS-nesting

Современный CSS-nesting работает в CSS Modules нативно (без препроцессоров):

```css
.card {
  padding: 1rem;

  & > .title {
    font-weight: 600;
  }

  &:hover {
    background: var(--color-neutral-50);
  }

  @media (min-width: 768px) {
    padding: 1.5rem;
  }
}
```

Если target-браузеры не поддерживают nesting — используйте PostCSS с `postcss-nesting`.

---

## 8. Типизация CSS Modules

Для строгой типизации импорта:

```ts
// global.d.ts
declare module "*.module.css" {
  const classes: Record<string, string>;
  export default classes;
}
```

Альтернатива — `typed-css-modules` генерирует `.d.ts` с точными типами классов.

---

## 9. Антипаттерны

- **Глобальные классы через `:global` без крайней необходимости** — **SHOULD NOT**.
- **Инлайн `style={{...}}` для статичных значений** — **MUST NOT**.
- **Hardcoded цвета/размеры** вместо CSS-переменных — **SHOULD NOT**.
- **`!important`** без обоснования — **SHOULD NOT**.
- **Kebab-case именование классов** (`user-card__title`) — **SHOULD NOT**. Используйте camelCase; CSS Modules автоматически scopes'ит, BEM не нужен.
- **Большой глобальный CSS** с общими селекторами — **MUST NOT**. Только reset/normalize и токены.
