---
version: 1.0.0
last-reviewed: 2026-04-17
status: active
---

# 01 — TypeScript (universal)

> Оглавление: [`../README.md`](../README.md). Профиль стека: [`../PROFILE.md`](../PROFILE.md).

Правила универсальны для любого современного React+TS проекта (TS ≥ 5.0). Отдельные фичи отмечены минимальной версией.

---

## 1. Конфигурация `tsconfig.json`

### Обязательные флаги

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "isolatedModules": true
  }
}
```

- `strict: true` — **MUST** во всех проектах.
- `noUncheckedIndexedAccess: true` — **SHOULD**. Делает `arr[i]` типом `T | undefined`.
- `isolatedModules: true` — **MUST**, если используется Vite / esbuild / SWC / любой single-file транспилер.

### Рекомендуемые для новых проектов

- `exactOptionalPropertyTypes: true` (TS 5.0+) — ловит `undefined` vs «ключ отсутствует».
- `verbatimModuleSyntax: true` (TS 5.0+) — требует явных `import type`, проще tree-shaking.
- `noImplicitOverride: true`, `noFallthroughCasesInSwitch: true`, `noImplicitReturns: true`.
- `skipLibCheck: true` — ускоряет сборку, скрывает ошибки в node_modules.

### Опциональные

- `noPropertyAccessFromIndexSignature: true` — заставляет `obj["foo"]` для ключей из index signature.
- `erasableSyntaxOnly: true` (TS 5.8+) — запрещает runtime-only TS-фичи (enums, namespaces, parameter properties).

---

## 2. Типы vs интерфейсы

- **Props компонентов и контракты публичных модулей — `interface`.**
- **Union-типы, Mapped-типы, Conditional-типы, `&`-композиция — `type`.**

✓ Корректно:
```ts
interface UserCardProps {
  user: User;
  onClick?: (id: User["id"]) => void;
}

type UserRole = "admin" | "editor" | "viewer";
```

✗ Некорректно:
```ts
type UserCardProps = { user: User; onClick?: ... };   // ✗ props — через interface
```

---

## 3. Избегание `any`

- `any` **MUST NOT** использоваться. Где тип неизвестен — `unknown` + сужение.
- На границах взаимодействия с нетипизированными библиотеками **MAY** временно стоять `any` с комментарием `// TODO(types): <ссылка на задачу>`.

✓ Корректно:
```ts
function parseJson(input: string): unknown {
  return JSON.parse(input);
}

const data = parseJson(raw);
if (typeof data === "object" && data !== null && "id" in data) {
  // narrowed access
}
```

### Runtime-валидация через Zod/Valibot

Для внешних данных (API, localStorage, URL params) **SHOULD** использовать Zod или Valibot — они дают runtime-валидацию + вывод типа:

```ts
import { z } from "zod";

const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(["admin", "editor", "viewer"]),
});

type User = z.infer<typeof UserSchema>;

function parseUser(raw: unknown): User {
  return UserSchema.parse(raw);
}
```

---

## 4. Типизация props

- Props — `interface` с явными именованными полями.
- **Никаких `React.FC`** — используйте явный тип props.
- **`children` типизируется точно** — `React.ReactNode` только когда принимается действительно любой рендерируемый контент.

✓ Корректно:
```tsx
interface CardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function Card({ title, description, children }: CardProps) {
  return (
    <article>
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
      {children}
    </article>
  );
}
```

### Discriminated unions для взаимоисключающих props

```ts
interface LinkButtonProps {
  as: "link";
  href: string;
  children: React.ReactNode;
}

interface ActionButtonProps {
  as: "button";
  onClick: () => void;
  children: React.ReactNode;
}

type ButtonProps = LinkButtonProps | ActionButtonProps;
```

---

## 5. Утилитные типы

### Стандартные

`Partial<T>`, `Required<T>`, `Pick<T, K>`, `Omit<T, K>`, `Readonly<T>`, `Record<K, V>`, `ReturnType<F>`, `Parameters<F>`, `Awaited<P>`, `NonNullable<T>`.

### React-специфичные

- `React.ComponentProps<typeof Component>` — тип props чужого компонента.
- `React.ComponentPropsWithoutRef<"button">` — тип props нативного элемента без `ref`.
- `React.ComponentPropsWithRef<"button">` — с `ref`.
- `React.PropsWithChildren<P>` — добавить `children?: ReactNode` к `P`.

```tsx
interface ButtonProps extends React.ComponentPropsWithoutRef<"button"> {
  variant?: "primary" | "secondary";
}

export function Button({ variant = "primary", ...rest }: ButtonProps) {
  return <button data-variant={variant} {...rest} />;
}
```

---

## 6. Generics

- Generics **SHOULD** использоваться для переиспользуемых хуков/компонентов.
- Параметр типа **MUST** называться осмысленно (`TItem`, `TData`), не `T` если их несколько.
- **`const` type parameters** (TS 5.0+) — для inference литералов без `as const`.

```ts
function useList<TItem>(initial: TItem[]) {
  const [items, setItems] = useState<TItem[]>(initial);
  return { items, add: (item: TItem) => setItems((prev) => [...prev, item]) };
}

function createRouter<const TRoutes extends readonly string[]>(routes: TRoutes) {
  return { routes };
}
```

### `NoInfer<T>` (TS 5.4+)

```ts
function pickValue<TValue>(value: TValue, fallback: NoInfer<TValue>): TValue {
  return value ?? fallback;
}
```

---

## 7. `import type`

При включённом `verbatimModuleSyntax` **MUST** использовать явный `import type` для type-only импортов:

```ts
import type { User } from "@/entities/user";
import { userStore, UserCard } from "@/entities/user";
```

Даже без `verbatimModuleSyntax` — **SHOULD** делать так же (лучше tree-shaking, явнее).

---

## 8. `as const` и литеральные типы

- Конфигурационные объекты **MUST** помечаться `as const`.
- Enum'ы **MUST NOT** использоваться — вместо них union + const object.

✓ Union + const:
```ts
const Status = {
  Idle: "idle",
  Loading: "loading",
  Success: "success",
} as const;

type Status = typeof Status[keyof typeof Status];
```

✗ Enum:
```ts
enum Status { Idle = "idle", Loading = "loading" }   // ✗
```

---

## 9. Result-паттерн для ошибок

Для асинхронных операций с детализированными ошибками **MAY** использовать Result-тип:

```ts
type Result<TValue, TError = Error> =
  | { ok: true; value: TValue }
  | { ok: false; error: TError };

async function fetchUser(id: string): Promise<Result<User, "not-found" | "network">> {
  try {
    const res = await fetch(`/api/users/${id}`);
    if (res.status === 404) return { ok: false, error: "not-found" };
    if (!res.ok) return { ok: false, error: "network" };
    return { ok: true, value: await res.json() };
  } catch {
    return { ok: false, error: "network" };
  }
}
```

---

## 10. Типизация событий DOM

- `React.ChangeEvent<HTMLInputElement>` — change на input.
- `React.FormEvent<HTMLFormElement>` — submit на form.
- `React.MouseEvent<HTMLButtonElement>` — click.
- `React.KeyboardEvent<HTMLElement>` — keydown/keyup.
- `React.FocusEvent<HTMLElement>` — focus/blur.

```tsx
function Input() {
  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    console.log(event.target.value);
  }
  return <input onChange={handleChange} />;
}
```

---

## 11. Запрещённые паттерны

- **`Function` как тип** — **MUST NOT**. Используйте точную сигнатуру `(arg: T) => U`.
- **`Object` как тип** — **MUST NOT**. Используйте `Record<string, unknown>` или конкретный `interface`.
- **Non-null assertion (`!`)** без обоснования — **SHOULD NOT**.
- **`as T` cast между несовместимыми типами** — **MUST NOT**. `as unknown as T` — маркер для рефакторинга.
- **`typeof X === "function"` для проверки React-компонента** — **MUST NOT**. Компоненты — `React.ComponentType<Props>`.
