---
version: 1.0.0
last-reviewed: 2026-04-17
status: active
---

# 05 — Принципы работы с формами (universal)

> Оглавление: [`../README.md`](../README.md). Профиль стека: [`../PROFILE.md`](../PROFILE.md).

Универсальные принципы форм, независимые от выбранного инструмента. Конкретные инструменты — в `variants/forms-react-19-actions.md`, `variants/forms-react-hook-form.md`.

---

## 1. Выбор инструмента

Определяется через [`../PROFILE.md`](../PROFILE.md):

| Поле `Forms approach` | Активный вариант |
|---|---|
| React 19 Actions | [`variants/forms-react-19-actions.md`](../variants/forms-react-19-actions.md) |
| React Hook Form | [`variants/forms-react-hook-form.md`](../variants/forms-react-hook-form.md) |
| native | только этот файл (базовые правила) |
| Formik (legacy) | правила этого файла + отдельный миграционный план |

---

## 2. Controlled vs uncontrolled

- **По умолчанию — неконтролируемые** (`defaultValue`, чтение через `FormData`/native). Это меньше повторных рендеров и проще для SSR.
- **Контролируемые** — когда нужны:
  - Live-валидация каждого символа.
  - Derived state в реальном времени (счётчик символов, форматирование ввода).
  - Сложная координация между полями.

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

## 3. Валидация — стратегия

Три уровня, не взаимоисключающие:

1. **Native HTML валидация** — `required`, `type="email"`, `pattern`, `minLength`. **SHOULD** использоваться всегда как первый барьер.
2. **Клиентская валидация через схему** — Zod / Valibot / Yup. Источник правды формы. **SHOULD** быть в любом проекте, работающем со структурированными данными.
3. **Серверная валидация** — обязательна для безопасности. Никогда не полагайтесь только на клиент.

✓ Минимальная схема (Zod):
```ts
const SignUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
type SignUpValues = z.infer<typeof SignUpSchema>;
```

- Схема **MUST** быть источником и валидации, и типа (`z.infer`).
- Ошибки **MUST** иметь человеко-понятные сообщения; для i18n — кастомные messages в схеме.

---

## 4. Доступность форм (подробности в [`07-accessibility.md`](07-accessibility.md))

Напоминание ключевого:

- Каждое поле **MUST** иметь `<label>` (через `htmlFor={id}` + `useId()` или оборачиванием).
- `placeholder` **MUST NOT** заменять label.
- Ошибки **MUST** связываться через `aria-describedby` и иметь `role="alert"`.
- Обязательные поля — `required` (нативный), **MAY** дублировать визуально.
- `aria-invalid="true"` при ошибочном состоянии.
- `autoComplete` — с корректным значением (`email`, `new-password`, `current-password`, и т.д.).

✓ Корректное поле:
```tsx
function EmailField({ error }: { error?: string }) {
  const id = useId();
  const errorId = useId();
  return (
    <div>
      <label htmlFor={id}>Email</label>
      <input
        id={id}
        type="email"
        required
        autoComplete="email"
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
      />
      {error ? <p id={errorId} role="alert">{error}</p> : null}
    </div>
  );
}
```

---

## 5. Состояния формы

Минимальный набор состояний, о которых компонент **MUST** уметь сообщать:

- `idle` — форма не трогалась.
- `submitting` — идёт отправка.
- `error` — произошла ошибка (отображается).
- `success` — отправка успешна (после этого либо сброс, либо редирект, либо показ сообщения).

Реализация зависит от инструмента:
- React 19 Actions → `useActionState` + `useFormStatus`.
- React Hook Form → `formState.isSubmitting`, `formState.errors`.
- Native → `useState` для ручного отслеживания.

---

## 6. Поведение после submit

- При **успехе** — **MUST** либо сбросить форму, либо перейти на следующий экран, либо показать явное сообщение. Пустая форма без обратной связи — антипаттерн.
- При **ошибке** — **MUST** сохранить введённые значения, показать сообщение у соответствующего поля или над формой, вернуть фокус на первое ошибочное поле.

---

## 7. Submit button

- **MUST** иметь `type="submit"` внутри `<form>`.
- **MUST** быть `disabled` во время `submitting`, иначе возможны дубль-сабмиты.
- Текст кнопки **SHOULD** меняться: `Submit` → `Submitting…`.

---

## 8. Антипаттерны

- **Контролируемые поля «на всякий случай»** без реальной необходимости — **SHOULD NOT**. Лишние рендеры, больше кода.
- **Ручная обработка pending/error через `useState`**, когда инструмент формы это делает — **MUST NOT**.
- **`placeholder` вместо `<label>`** — **MUST NOT**.
- **Валидация только на клиенте** — **MUST NOT**. Клиент = UX, сервер = безопасность.
- **Разные источники типа формы и схемы валидации** — **MUST NOT**. Выводите тип из схемы через `z.infer`/`v.InferOutput`.
- **Submit через `<button>` без `type`** вне `<form>` — **SHOULD NOT**: по умолчанию тип `submit`, что ломает неформочные кнопки.
