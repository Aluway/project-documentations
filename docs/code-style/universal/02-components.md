---
version: 1.0.1
last-reviewed: 2026-04-17
status: active
---

# 02 — Компоненты (universal)

> Оглавление: [`../README.md`](../README.md). Профиль стека: [`../PROFILE.md`](../PROFILE.md).

Правила универсальны для любой версии React. Версионно-специфичные фичи (`ref`-as-prop, Server/Client components, React 19-хуки) — в [`variants/react-19-features.md`](../variants/react-19-features.md).

---

## 1. Только function components

- Все компоненты **MUST** быть function components.
- Class components **MUST NOT** использоваться для бизнес-логики.
- Единственное исключение — Error Boundary; для него **SHOULD** использовать библиотеку [`react-error-boundary`](https://github.com/bvaughn/react-error-boundary).

✓ Корректно:
```tsx
export function UserCard({ user }: UserCardProps) {
  return <article>{user.name}</article>;
}
```

✗ Некорректно:
```tsx
export class UserCard extends React.Component<UserCardProps> {   // ✗
  render() { return <article>{this.props.user.name}</article>; }
}
```

---

## 2. Именование и экспорт

- Компонент **MUST** быть именованным экспортом (`export function` / `export const`), не `default`.
- Имя компонента — **PascalCase**.
- Имя файла — **kebab-case** (`user-card.tsx`).
- Один публичный компонент на файл; приватные подкомпоненты — в том же файле, без экспорта.

✓ Корректно:
```tsx
// file: user-card.tsx
export function UserCard({ user }: UserCardProps) {
  return <Header user={user} />;
}

function Header({ user }: { user: User }) {
  return <h3>{user.name}</h3>;
}
```

✗ Некорректно:
```tsx
// file: UserCard.tsx                              // ✗ PascalCase для файла
export default function UserCard(...) {...}        // ✗ default-экспорт
```

---

## 3. Props

- Props — `interface` с явными именованными полями (см. [`01-typescript.md`](01-typescript.md) раздел 4).
- Деструктурируем в сигнатуре.
- Значения по умолчанию — через деструктуризацию, не через `defaultProps`.

✓ Корректно:
```tsx
interface ButtonProps {
  variant?: "primary" | "secondary";
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

export function Button({ variant = "primary", disabled = false, onClick, children }: ButtonProps) {
  return <button type="button" disabled={disabled} onClick={onClick} data-variant={variant}>{children}</button>;
}
```

> Примечание: `defaultProps` на функциональных компонентах deprecated в React 18.3 и удалены в React 19. На всех современных версиях используйте деструктурирующие дефолты.

---

## 4. Композиция через `children`

- Композиция через `children` **SHOULD** предпочитаться render-props и HOC'ам.
- HOC'ы **SHOULD NOT** использоваться в новом коде.

✓ Корректно:
```tsx
<Card>
  <CardHeader>Title</CardHeader>
  <CardBody>Content</CardBody>
</Card>
```

✗ Устаревший HOC:
```tsx
const WithAuth = withAuth(UserPage);   // ✗ предпочитайте хук useAuth()
```

---

## 5. Контролируемые vs неконтролируемые компоненты

- **Неконтролируемые** — дефолт для форм, если инструмент это поддерживает (React 19 Actions, React Hook Form). См. [`05-forms-principles.md`](05-forms-principles.md).
- **Контролируемые** — когда нужна live-валидация, derived state в реальном времени, сложное управление фокусом.

✓ Неконтролируемое:
```tsx
<form>
  <input name="email" type="email" defaultValue="" required />
  <button type="submit">Submit</button>
</form>
```

✓ Контролируемое:
```tsx
function Search() {
  const [query, setQuery] = useState("");
  return <input value={query} onChange={(e) => setQuery(e.target.value)} />;
}
```

---

## 6. Условный рендеринг

- Короткие ветки — тернарный оператор.
- Несколько веток или сложная логика — ранний `return` или вынос в подкомпонент.
- **`&&` с числом или пустой строкой MUST NOT** — React отрендерит `0` или `""`.

✓ Корректно:
```tsx
{items.length > 0 ? <List items={items} /> : <Empty />}

if (status === "loading") return <Spinner />;
if (status === "error") return <ErrorView />;
return <Content />;
```

✗ Некорректно:
```tsx
{items.length && <List items={items} />}   // ✗ отрендерит 0 при items=[]
{name && <Greeting name={name} />}          // ✗ отрендерит "" если name=""
```

---

## 7. Ключи в списках

- `key` **MUST** быть стабильным и уникальным среди соседей.
- Индекс массива **MUST NOT** использоваться как `key`, если порядок меняется или возможны вставки/удаления.
- Для нестабильных данных — генерируйте `id` заранее (на стороне источника или через `crypto.randomUUID()` один раз).

✓ Корректно:
```tsx
{users.map((user) => <UserCard key={user.id} user={user} />)}
```

✗ Некорректно:
```tsx
{users.map((user, i) => <UserCard key={i} user={user} />)}   // ✗ при смене порядка
```

---

## 8. Запрещённые паттерны

- **Мутация props** — **MUST NOT**.
- **Мутация state напрямую** — **MUST NOT**. Только `setState(newValue)` или `setState((prev) => ...)`.
- **Определение подкомпонента внутри другого компонента** — **MUST NOT**: новый тип на каждом рендере → потеря state.

✗ Некорректно:
```tsx
function Parent() {
  function Child() { return <div />; }   // ✗ новая ссылка на каждом рендере
  return <Child />;
}
```

- **Прямой доступ к DOM через `document.getElementById`** внутри компонента — **MUST NOT**. Используйте `ref`.
- **Side effects в рендере** (fetch, setState, `console.log` прод) — **MUST NOT**. Только в обработчиках, эффектах, или серверных компонентах (см. [`variants/react-19-features.md`](../variants/react-19-features.md)).

---

## 9. Server/Client Components (краткая сноска)

Если в проекте используется серверный рендеринг с разделением на server/client components (Next.js App Router, Remix/React Router data, Waku и т.д.):

- Интерактивные компоненты (обработчики, state, эффекты, браузерные API) — **client**, помечаются `"use client"`.
- `"use client"` **SHOULD** ставиться на листьях (на кнопке, форме, модалке), а не на всей странице.
- Детали и React-19-специфика — в [`variants/react-19-features.md`](../variants/react-19-features.md) (разделы Server/Client).

Если проект — SPA без SSR, директива `"use client"` не нужна.

---

## 10. Ref

Для React ≤ 18 — `React.forwardRef`. Для React ≥ 19 — `ref` передаётся как обычный prop; `forwardRef` deprecated. См. [`variants/react-19-features.md`](../variants/react-19-features.md).

Определите версию React в вашем репо через [`../PROFILE.md`](../PROFILE.md) и следуйте соответствующему варианту.
