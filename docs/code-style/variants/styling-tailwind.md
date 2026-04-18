---
version: 1.0.1
last-reviewed: 2026-04-17
status: active
requires:
  profile:
    primary-styling: tailwind
---

# 09 — Styling: Tailwind CSS (variant)

> Оглавление: [`../README.md`](../README.md). Профиль стека: [`../PROFILE.md`](../PROFILE.md).
> **Активен, если в `PROFILE.md` Primary styling = Tailwind 3 или Tailwind 4.**

Правила работы с [Tailwind CSS](https://tailwindcss.com/). Различия v3 ↔ v4 помечены явно.

---

## 1. Главные правила

- Tailwind-first: утилитами покрывается 80-90 % стилей.
- Переиспользуемый стиль — **React-компонент** с предзаписанными классами, **не** `@apply`.
- Порядок классов — через `prettier-plugin-tailwindcss` (ручная сортировка запрещена).
- Объединение классов — через `clsx` + `tailwind-merge` (обёртка `cn`).
- Для сложных вариаций — **class-variance-authority (CVA)**.
- UI-примитивы — **shadcn/ui** (копируются в `shared/ui/`).

---

## 2. Установка

### v4 (современный способ)

```bash
npm install tailwindcss @tailwindcss/vite
# or for PostCSS:
npm install tailwindcss @tailwindcss/postcss
```

```css
/* app/globals.css */
@import "tailwindcss";
```

**Ключевое отличие v4 от v3:** `tailwind.config.js` больше **не требуется**. Вся кастомизация теперь живёт в CSS:
- Токены темы (цвета, шрифты, радиусы, breakpoints) — через директиву `@theme { --color-...; }`.
- Пути контента (`content: [...]`) определяются автоматически бандлером — без конфига.
- Кастомные варианты — через `@custom-variant`.

Файл `tailwind.config.js` в v4 **MAY** быть, только если нужен legacy-плагин, требующий JS-конфига; в новых проектах не создаём.

### v3

```bash
npm install tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Конфиг — `tailwind.config.js` с массивом `content` и `theme.extend`:

```js
// tailwind.config.js (v3 only)
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: { brand: "oklch(62% 0.18 258)" },
    },
  },
};
```

В v3 `tailwind.config.js` **MUST** быть.

### Как определить версию

Проверьте через [`../PROFILE.md`](../PROFILE.md) поле `Primary styling`. Если `TODO` — посмотрите в `package.json`: `"tailwindcss": "^4.0.0"` и выше = v4, `"^3.x"` = v3.

---

## 3. Кастомизация — `@theme` (v4) или `tailwind.config` (v3)

**v4:**
```css
@import "tailwindcss";

@theme {
  --color-brand: oklch(62% 0.18 258);
  --font-sans: "Inter", system-ui, sans-serif;
  --radius-md: 0.5rem;
}
```

**v3:**
```js
// tailwind.config.js
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: { brand: "oklch(62% 0.18 258)" },
      fontFamily: { sans: ["Inter", "system-ui", "sans-serif"] },
      borderRadius: { md: "0.5rem" },
    },
  },
};
```

---

## 4. Порядок классов

- **MUST** использовать `prettier-plugin-tailwindcss` — автосортировка.
- Ручная сортировка — источник merge-конфликтов.

Порядок от плагина: layout → spacing → sizing → typography → visual → interactivity → modifiers.

---

## 5. Переиспользование — через компоненты, не `@apply`

- **`@apply` MUST NOT** в прикладном коде. Создаёт параллельную систему именования и ломает утилиты.
- Переиспользуемый стиль → React-компонент в `shared/ui/`.

✓ Корректно:
```tsx
// shared/ui/button/button.tsx
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/shared/lib/cn";

interface ButtonProps extends ComponentPropsWithoutRef<"button"> {
  variant?: "primary" | "secondary";
}

export function Button({ variant = "primary", className, ...rest }: ButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center rounded-md px-4 py-2 font-medium transition",
        "focus-visible:outline-2 focus-visible:outline-offset-2",
        variant === "primary" && "bg-brand text-white hover:bg-brand/90",
        variant === "secondary" && "bg-neutral-100 text-neutral-900 hover:bg-neutral-200",
        className,
      )}
      {...rest}
    />
  );
}
```

---

## 6. `cn` — объединение классов

```ts
// shared/lib/cn.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...classes: ClassValue[]): string {
  return twMerge(clsx(classes));
}
```

- **MUST** использовать `cn` (или эквивалент) для условных классов и переопределений.
- Ручная конкатенация через шаблонные строки — **SHOULD NOT**.

---

## 7. Variants — CVA

Для сложных компонентов с несколькими осями вариаций — **class-variance-authority**:

```ts
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md font-medium transition",
  {
    variants: {
      variant: {
        primary: "bg-brand text-white hover:bg-brand/90",
        secondary: "bg-neutral-100 text-neutral-900 hover:bg-neutral-200",
        ghost: "hover:bg-neutral-100",
      },
      size: {
        sm: "px-3 py-1.5 text-sm",
        md: "px-4 py-2",
        lg: "px-6 py-3 text-lg",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

interface ButtonProps
  extends ComponentPropsWithoutRef<"button">,
    VariantProps<typeof buttonVariants> {}

export function Button({ variant, size, className, ...rest }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...rest} />;
}
```

---

## 8. shadcn/ui

- Для стандартных UI-примитивов (Dialog, Dropdown, Select, Checkbox, Tooltip) **SHOULD** использовать [shadcn/ui](https://ui.shadcn.com/).
- Компоненты **копируются в репозиторий** (`shared/ui/`), не ставятся как dependency.
- Поверх Radix UI — accessibility из коробки.

---

## 9. Темизация (light/dark)

**v4:**
```css
@import "tailwindcss";

@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));

@theme {
  --color-bg: oklch(99% 0 0);
  --color-fg: oklch(15% 0 0);
}

[data-theme="dark"] {
  --color-bg: oklch(15% 0.01 258);
  --color-fg: oklch(95% 0 0);
}
```

**v3:**
```js
// tailwind.config.js
export default {
  darkMode: ["class", '[data-theme="dark"]'],
  // ...
};
```

Использование:
```tsx
<div className="bg-background text-foreground">...</div>
<div className="dark:bg-neutral-900">...</div>
```

- Тема **MUST** инициализироваться до первого paint'а (см. [`../universal/06-styling-principles.md`](../universal/06-styling-principles.md) раздел 3).

---

## 10. Антипаттерны

- **`@apply`** в прикладном коде — **MUST NOT**.
- **Ручная конкатенация классов** через template literals без `cn` — **SHOULD NOT**.
- **Inline-style `style={{...}}`** для статичных значений — **MUST NOT**.
- **Mixing Tailwind + runtime CSS-in-JS** — **MUST NOT**.
- **Произвольные классы arbitrary values без причины** (`w-[473px]`) — **SHOULD NOT**. Используйте масштаб темы.
- **Глобальные `.container`, `.btn`, `.card`** — **MUST NOT**.
- **`!important` (`!`)** — **SHOULD NOT** без крайней необходимости.
