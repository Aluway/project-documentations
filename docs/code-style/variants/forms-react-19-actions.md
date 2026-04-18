---
version: 1.0.0
last-reviewed: 2026-04-17
status: active
requires:
  profile:
    forms-approach: react-19-actions
  min:
    react: "19.0"
---

# 07 — Forms: React 19 Actions (variant)

> Оглавление: [`../README.md`](../README.md). Профиль стека: [`../PROFILE.md`](../PROFILE.md).
> **Активен, если в `PROFILE.md` Forms approach = React 19 Actions**. Требует React ≥ 19.

Правила работы с формами через React 19 Actions + `useActionState` + `useFormStatus`.

---

## 1. Главные правила

- Для большинства форм **MUST** использовать React 19 Actions + `useActionState`.
- `action` prop в `<form>` **MUST** принимать функцию.
- Для полей — **`defaultValue`** + неконтролируемый режим; чтение — через `FormData`.
- Pending state — через `useFormStatus` в дочерних кнопках (не через prop'ы).

---

## 2. Минимальный пример

```tsx
"use client";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

type State = { error: string | null };

async function signUp(_prev: State, formData: FormData): Promise<State> {
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string" || typeof password !== "string") {
    return { error: "Invalid input" };
  }

  const response = await fetch("/api/sign-up", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    return { error: "Sign-up failed" };
  }

  return { error: null };
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending ? "Creating…" : "Sign up"}
    </button>
  );
}

export function SignUpForm() {
  const [state, action] = useActionState(signUp, { error: null });

  return (
    <form action={action}>
      <label>
        Email
        <input name="email" type="email" required autoComplete="email" />
      </label>
      <label>
        Password
        <input name="password" type="password" required autoComplete="new-password" />
      </label>
      {state.error ? <p role="alert">{state.error}</p> : null}
      <SubmitButton />
    </form>
  );
}
```

---

## 3. Валидация

- Клиентская — через схему Zod/Valibot (см. [`../universal/05-forms-principles.md`](../universal/05-forms-principles.md) раздел 3).
- Валидация **SHOULD** происходить в самом action'е (до запроса).
- Ошибки валидации **MUST** возвращаться в `state` и отображаться у соответствующих полей.

```ts
async function createPost(_prev: State, formData: FormData): Promise<State> {
  const result = PostSchema.safeParse(Object.fromEntries(formData));

  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  await savePost(result.data);
  return { errors: null };
}
```

---

## 4. Сохранение введённых значений при ошибке

`useActionState` позволяет вернуть `{ values, errors }`, чтобы после ошибки не терять ввод:

```ts
type State = {
  values: { title: string; body: string };
  errors: Partial<Record<"title" | "body", string[]>> | null;
};

async function createPost(_prev: State, formData: FormData): Promise<State> {
  const values = {
    title: String(formData.get("title") ?? ""),
    body: String(formData.get("body") ?? ""),
  };
  const result = PostSchema.safeParse(values);
  if (!result.success) {
    return { values, errors: result.error.flatten().fieldErrors };
  }
  await savePost(result.data);
  return { values: { title: "", body: "" }, errors: null };
}
```

Потом в JSX — `defaultValue={state.values.title}`.

---

## 5. `useOptimistic` для мгновенного отклика

Используйте `useOptimistic` для действий с видимой задержкой (см. [`react-19-features.md`](react-19-features.md) раздел 4).

---

## 6. Reset формы

- Успешный action **автоматически сбрасывает неконтролируемые поля** формы.
- Для контролируемых — сброс делаем явно через `useRef<HTMLFormElement>` + `form.reset()`, или управляем state'ом.

---

## 7. Pending UI

- **SHOULD** использовать `useFormStatus` внутри дочерних компонентов формы — они получают pending без пробрасывания props.
- Для индикаторов снаружи формы — третий элемент из `useActionState` даёт `isPending`:

```tsx
const [state, action, isPending] = useActionState(...);
```

---

## 8. Антипаттерны

- **Ручная обработка pending/error через `useState`** вместо `useActionState` — **MUST NOT**.
- **Контролируемые поля без причины** — **SHOULD NOT**. Actions отлично работают с неконтролируемыми.
- **Пробрасывание `isPending` как prop в дочернюю кнопку** вместо `useFormStatus` — **SHOULD NOT**.
- **Клиентская-только валидация** — **MUST NOT**. Серверная — обязательна.
- **`useFormState` (старый API)** — **MUST NOT**. Используйте `useActionState`.
- **Рассинхрон схемы Zod и типа `State`** — **SHOULD NOT**. Выводите оба из одной Zod-схемы.

---

## 9. Для сложных форм — связка с React Hook Form

Если форма превышает возможности Actions (многошаговая, с динамическими полями, live-валидация на каждую клавишу) — перейдите на React Hook Form. См. [`forms-react-hook-form.md`](forms-react-hook-form.md).

Часто имеет смысл комбинировать: простые формы через Actions, сложные через RHF; в [`../PROFILE.md`](../PROFILE.md) — `Forms approach = mixed`, и оба варианта активны.
