---
version: 1.0.0
last-reviewed: 2026-04-17
status: active
requires:
  profile:
    forms-approach: react-hook-form
---

# 08 — Forms: React Hook Form (variant)

> Оглавление: [`../README.md`](../README.md). Профиль стека: [`../PROFILE.md`](../PROFILE.md).
> **Активен, если в `PROFILE.md` Forms approach = React Hook Form.**

Правила работы с [React Hook Form](https://react-hook-form.com/) (RHF). Совместим с любой версией React 17+.

---

## 1. Главные правила

- RHF **MUST** использоваться вместе с **резолвером Zod/Valibot/Yup** — источник правды типа и валидации.
- Тип формы **MUST** выводиться из схемы (`z.infer` / `v.InferOutput`), не писаться отдельно.
- Неконтролируемый режим (`register`) — **default choice**.
- `Controller` — только для сторонних компонентов, которые не умеют нативных input'ов.

---

## 2. Минимальный пример

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const SignUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type SignUpValues = z.infer<typeof SignUpSchema>;

export function SignUpForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpValues>({
    resolver: zodResolver(SignUpSchema),
  });

  async function onSubmit(values: SignUpValues) {
    await fetch("/api/sign-up", { method: "POST", body: JSON.stringify(values) });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <label htmlFor="email">Email</label>
      <input id="email" type="email" autoComplete="email"
             {...register("email")}
             aria-invalid={!!errors.email}
             aria-describedby={errors.email ? "email-error" : undefined} />
      {errors.email ? <p id="email-error" role="alert">{errors.email.message}</p> : null}

      <label htmlFor="password">Password</label>
      <input id="password" type="password" autoComplete="new-password"
             {...register("password")}
             aria-invalid={!!errors.password}
             aria-describedby={errors.password ? "password-error" : undefined} />
      {errors.password ? <p id="password-error" role="alert">{errors.password.message}</p> : null}

      <label htmlFor="confirm">Confirm password</label>
      <input id="confirm" type="password"
             {...register("confirmPassword")}
             aria-invalid={!!errors.confirmPassword}
             aria-describedby={errors.confirmPassword ? "confirm-error" : undefined} />
      {errors.confirmPassword ? <p id="confirm-error" role="alert">{errors.confirmPassword.message}</p> : null}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating…" : "Sign up"}
      </button>
    </form>
  );
}
```

---

## 3. Default values

- Для известных значений **SHOULD** передавать `defaultValues` в `useForm`:

```ts
useForm<SignUpValues>({
  defaultValues: { email: "", password: "", confirmPassword: "" },
  resolver: zodResolver(SignUpSchema),
});
```

- **MUST** использовать `defaultValues` при загрузке серверных данных через TanStack Query — `reset(data)` в `useEffect`/`onSuccess`.

---

## 4. Динамические поля

Для массивов полей — `useFieldArray`:

```tsx
const { fields, append, remove } = useFieldArray({ control, name: "items" });

{fields.map((field, index) => (
  <input key={field.id} {...register(`items.${index}.value`)} />
))}
```

`field.id` из `useFieldArray` **MUST** использоваться как `key`, а не индекс.

---

## 5. Controller (для сторонних компонентов)

Если компонент не работает с нативным `ref` (например, кастомный Select из Ant Design):

```tsx
<Controller
  control={control}
  name="role"
  render={({ field }) => <Select value={field.value} onChange={field.onChange} />}
/>
```

- **SHOULD** избегать `Controller`, если можно `register`. Каждое `Controller` поле добавляет ре-рендеры.

---

## 6. Validation mode

```ts
useForm({
  mode: "onBlur",       // валидация при потере фокуса
  reValidateMode: "onChange",  // после первой валидации — на каждый change
});
```

- Default (`onSubmit`) — **SHOULD** для простых форм.
- `onBlur` + `onChange` — **SHOULD** для форм с live-валидацией.
- `onChange` с первого символа — **SHOULD NOT**, создаёт тревожный UX.

---

## 7. Доступность

Все правила из [`../universal/07-accessibility.md`](../universal/07-accessibility.md) раздел 5 применимы.

Ключевое для RHF:
- `register` сам не ставит `aria-invalid` — **MUST** делать вручную на основе `errors`.
- `aria-describedby` на ошибку — **MUST**.
- После неудачного submit'а — **SHOULD** возвращать фокус на первое поле с ошибкой через `setFocus`.

```ts
const firstErrorField = Object.keys(errors)[0];
if (firstErrorField) setFocus(firstErrorField as keyof SignUpValues);
```

---

## 8. Тесты

```tsx
it("submits valid data", async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn();
  render(<SignUpForm onSubmit={onSubmit} />);

  await user.type(screen.getByLabelText(/email/i), "user@example.com");
  await user.type(screen.getByLabelText(/password/i), "secret123");
  await user.type(screen.getByLabelText(/confirm/i), "secret123");
  await user.click(screen.getByRole("button", { name: /sign up/i }));

  await waitFor(() => {
    expect(onSubmit).toHaveBeenCalledWith({
      email: "user@example.com",
      password: "secret123",
      confirmPassword: "secret123",
    });
  });
});
```

- **SHOULD** использовать `userEvent` (не `fireEvent`) — RHF реагирует на последовательность событий.

---

## 9. Антипаттерны

- **Отдельный тип формы, не выведенный из схемы** — **MUST NOT**. Используйте `z.infer`.
- **Ручной `useState` для полей формы параллельно с RHF** — **MUST NOT**.
- **`Controller` вокруг нативных input'ов** — **SHOULD NOT**. Используйте `register`.
- **Валидация только на клиенте** — **MUST NOT**. Серверная — обязательна.
- **Индекс массива как `key` в `useFieldArray`** — **MUST NOT**. Используйте `field.id`.
- **Игнорирование `aria-invalid` / `aria-describedby`** — **MUST NOT**.
