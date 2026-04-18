---
version: 1.0.0
last-reviewed: 2026-04-17
status: active
requires:
  min:
    react: "19.0"
---

# 01 — React 19 Features (variant)

> Оглавление: [`../README.md`](../README.md). Профиль стека: [`../PROFILE.md`](../PROFILE.md).
> **Активен, если в `PROFILE.md` React ≥ 19.**

Правила для фич, появившихся в React 19: хук `use()`, `useActionState`, `useOptimistic`, `useFormStatus`, Actions-интеграция с `<form>`, `ref` как обычный prop, Server/Client components.

---

## 1. `ref` как обычный prop

В React 19 для функциональных компонентов `ref` передаётся как обычный prop. `forwardRef` остаётся работающим для обратной совместимости, но **в новом коде SHOULD NOT** использоваться — он помечен как устаревающий паттерн и в будущих мажорных версиях будет удалён.

✓ Корректно (рекомендуемый путь в React 19):
```tsx
interface InputProps {
  ref?: React.Ref<HTMLInputElement>;
  placeholder?: string;
}

export function Input({ ref, placeholder }: InputProps) {
  return <input ref={ref} placeholder={placeholder} />;
}
```

✗ Не пишем в новом коде React 19:
```tsx
export const Input = React.forwardRef<HTMLInputElement, InputProps>(...);   // ✗ устаревший паттерн
```

> Существующий код с `forwardRef` мигрируется постепенно. Новый код — сразу на ref-as-prop.

---

## 2. `use()`

Читает значение из Promise или Context. Единственный хук, который **MAY** вызываться условно / в цикле.

```tsx
function UserName({ userPromise }: { userPromise: Promise<User> }) {
  const user = use(userPromise);   // Suspense поймает промис
  return <span>{user.name}</span>;
}
```

- **MUST** использоваться внутри Suspense-границы для async-данных.
- **SHOULD** предпочитаться `useEffect + useState` для чтения Promise в новых компонентах.

---

## 3. `useActionState`

Управляет состоянием формы-с-action (pending, error, результат). Замена `useFormState`.

```tsx
type State = { error: string | null };

async function loginAction(_prev: State, formData: FormData): Promise<State> {
  const email = formData.get("email");
  const password = formData.get("password");
  // ...валидация, запрос...
  return { error: null };
}

export function LoginForm() {
  const [state, action, isPending] = useActionState(loginAction, { error: null });

  return (
    <form action={action}>
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      {state.error ? <p role="alert">{state.error}</p> : null}
      <button type="submit" disabled={isPending}>{isPending ? "Signing in…" : "Sign in"}</button>
    </form>
  );
}
```

- **MUST** использоваться вместо `useState + useEffect` для форм в React 19 (если форма активна в [`variants/forms-react-19-actions.md`](forms-react-19-actions.md)).
- Подробнее — в [`forms-react-19-actions.md`](forms-react-19-actions.md).

---

## 4. `useOptimistic`

Оптимистичные обновления UI во время async-мутации.

```tsx
function Likes({ count }: { count: number }) {
  const [optimisticCount, addOptimistic] = useOptimistic(count, (prev, delta: number) => prev + delta);

  async function handleLike() {
    addOptimistic(1);
    await likePost();
  }

  return <button onClick={handleLike}>{optimisticCount} likes</button>;
}
```

- **SHOULD** использоваться для действий, где задержка сервера > 100 мс и UX выигрывает от мгновенного отклика.

---

## 5. `useFormStatus`

Даёт дочерним элементам формы информацию о её состоянии — без пробрасывания `isPending` пропом.

```tsx
function SubmitButton() {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending}>{pending ? "Saving…" : "Save"}</button>;
}

function Form() {
  return (
    <form action={saveAction}>
      <input name="title" />
      <SubmitButton />
    </form>
  );
}
```

- **SHOULD** использоваться в design-system компонентах кнопок/индикаторов, живущих внутри `<form>`.

---

## 6. `<form action>` интеграция

В React 19 `action` prop у `<form>` (а также `formAction` у `<button>` и `<input type="submit">`) **MAY** принимать функцию.

```tsx
async function saveAction(formData: FormData) {
  "use server"; // если используется RSC; иначе просто обычная async функция
  await saveData(formData);
}

<form action={saveAction}>...</form>
```

- Успешный action автоматически сбрасывает **неконтролируемые** поля формы.
- Если форма контролируемая — сброс делайте явно.

---

## 7. Server / Client Components

Применимо, если в проекте используется разделение на Server и Client components (Next.js App Router, Remix data, Waku, Expo Router RSC и т.д.).

### Server component (по умолчанию)

- Рендерится на сервере; клиент получает HTML + минимум JS.
- **MUST NOT** использовать: `useState`, `useEffect`, `useReducer`, обработчики событий, браузерные API.
- **MAY** использовать: `async/await` на верхнем уровне, прямой доступ к БД/файлам (если среда поддерживает).

### Client component

- Помечается `"use client"` **первой строкой файла**.
- Запускается в браузере (плюс SSR для первого рендера).
- Обязателен для интерактивности, state, эффектов, браузерных API.

### Правила разделения

- **`"use client"` MUST быть на листьях.** Layout/контейнер — server; интерактивный островок (кнопка, форма, модалка) — client.
- **Client-компонент MAY принимать server-компонент через `children`.** Стандартный способ вставить серверный контент внутрь клиентского.

✓ Пример:
```tsx
// button.tsx — client
"use client";

export function Button({ onClick, children }: ButtonProps) {
  return <button type="button" onClick={onClick}>{children}</button>;
}
```

```tsx
// dashboard.tsx — server
import { Button } from "./button";

export async function Dashboard() {
  const data = await fetchDashboardData();
  return (
    <section>
      <h1>{data.title}</h1>
      <Panel>
        <ServerContent data={data} />
      </Panel>
      <Button onClick={() => console.log("click")}>Action</Button>
    </section>
  );
}
```

### Если проект — SPA без SSR

- Директива `"use client"` не нужна.
- Но правило «держать интерактивные островки изолированными» всё равно полезно для tree-shaking и code-splitting.

---

## 8. Миграция с React 18

- `useFormState` → `useActionState` (API почти идентичен; добавлен `isPending`).
- `ReactDOM.render` → `createRoot` (если ещё не).
- `forwardRef` → `ref` как prop.
- `defaultProps` на функциональных компонентах → деструктурирующие дефолты.

---

## 9. Запрещённые паттерны (React 19)

- `forwardRef` в новом коде — **SHOULD NOT** (работает, но устарел; используйте ref-as-prop).
- `defaultProps` — **MUST NOT**.
- `useFormState` в новом коде — **MUST NOT** (используйте `useActionState`).
- `"use client"` на всей странице / layout'е — **SHOULD NOT**. Пушите на листья.
- Браузерные API в server-компоненте — **MUST NOT**.
