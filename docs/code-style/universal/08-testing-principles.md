---
version: 1.0.0
last-reviewed: 2026-04-17
status: active
---

# 08 — Принципы тестирования (universal)

> Оглавление: [`../README.md`](../README.md). Профиль стека: [`../PROFILE.md`](../PROFILE.md).

Универсальные принципы тестирования React-компонентов. Конкретный setup (Vitest / Jest) — в `variants/testing-vitest.md` (или аналоге для Jest).

---

## 1. Главный принцип

> **Тестируем поведение, не реализацию.**

Тест описывает, что пользователь может сделать с компонентом и что он увидит — а не какие именно хуки / вычисления происходят внутри.

---

## 2. Библиотека для компонент-тестов

- **React Testing Library** — стандарт. Ориентируется на доступность и поведение.
- Enzyme — **MUST NOT** в новом коде (устарел, не совместим с React 18+).

---

## 3. Приоритет queries

Используйте в порядке убывания:

1. `getByRole` (с `{ name: ... }`) — **default choice**.
2. `getByLabelText` — для форм.
3. `getByPlaceholderText` — если лейбла нет.
4. `getByText` — для не-интерактивного текста.
5. `getByDisplayValue` — для значения input'а.
6. `getByAltText` — для изображений.
7. `getByTitle` — крайний случай.
8. `getByTestId` — когда всё остальное невозможно.

`getByTestId` **SHOULD NOT** быть первым выбором. Это запасной вариант.

---

## 4. Async queries

- `findBy*` — асинхронные, с автоматическим ожиданием. Для элементов, появляющихся после async-действия.
- `queryBy*` — возвращают `null`; для проверки отсутствия.
- `getBy*` — бросают ошибку, если не найдено; для элементов, которые **должны** быть немедленно.

✓ Правильно:
```tsx
expect(await screen.findByText(/success/i)).toBeInTheDocument();
```

✗ Избыточно:
```tsx
await waitFor(() => {
  expect(screen.getByText(/success/i)).toBeInTheDocument();
});
```

---

## 5. User interactions — `user-event`

- `user-event` **MUST** использоваться для действий пользователя вместо `fireEvent`.
- `userEvent.setup()` — один раз перед `render`, переиспользуется в тесте.

```tsx
const user = userEvent.setup();
render(<ContactForm onSubmit={onSubmit} />);
await user.type(screen.getByLabelText(/email/i), "user@example.com");
await user.click(screen.getByRole("button", { name: /send/i }));
```

`fireEvent` — только для событий без user-counterpart (scroll, resize, и т.п.).

---

## 6. AAA-паттерн (Arrange-Act-Assert)

```tsx
it("increments when user clicks the button", async () => {
  // Arrange
  const user = userEvent.setup();
  render(<Counter initial={0} />);

  // Act
  await user.click(screen.getByRole("button", { name: /increment/i }));

  // Assert
  expect(screen.getByText(/count: 1/i)).toBeInTheDocument();
});
```

Каждый тест — одна причина фейлиться.

---

## 7. Co-location

Тест лежит **рядом с тестируемым кодом**: `counter.tsx` ↔ `counter.test.tsx`. Подробнее — в [`docs/architecture/06-import-rules.md`](../../architecture/06-import-rules.md).

---

## 8. Моки

### Принципы

- Мокаем на **границах**: HTTP, таймеры, браузерные API.
- **MUST NOT** мокать собственные модули того же слайса — это сигнал плохой декомпозиции.
- Для HTTP — **SHOULD** использовать MSW (Mock Service Worker).

### MSW (принцип)

```ts
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";

export const server = setupServer(
  http.get("/api/users/:id", ({ params }) =>
    HttpResponse.json({ id: params.id, name: "Test User" }),
  ),
);
```

В setup'е тестов: `server.listen()` / `server.resetHandlers()` / `server.close()`. Детали — в `variants/testing-vitest.md`.

### Сброс моков

- **MUST** сбрасывать моки между тестами (`vi.clearAllMocks()` / `jest.clearAllMocks()`, или `clearMocks: true` в конфиге).

---

## 9. Изоляция

- Каждый `it` — изолированный.
- Глобальный state (сторы, singleton'ы) **MUST** сбрасываться в `afterEach`.
- Никакого shared state между тестами.

---

## 10. Таймеры

- Fake timers — **SHOULD** для debounce / throttle / timeout-логики.
- **MUST** восстанавливать реальные таймеры в `afterEach`.

---

## 11. Snapshot-тесты

- Snapshot'ы **SHOULD NOT** заменять функциональные тесты.
- **MAY** применяться для стабильного сериализуемого output'а (AST, конфиг-объект, сгенерированная строка).
- Для JSX — предпочитайте behavior-тесты над `toMatchSnapshot()`.

---

## 12. Покрытие

- Целевой охват по бизнес-критичным модулям: **70-85 %**.
- **MUST NOT** гнаться за 100 % — это ведёт к тестам ради покрытия, а не полезности.

---

## 13. Антипаттерны

- `getByTestId` как дефолт — **MUST NOT**.
- Проверка внутреннего state компонента (`expect(component.state.count)`) — **MUST NOT**.
- Мокинг React internals / `useEffect` — **MUST NOT**.
- Shared state между тестами — **MUST NOT**.
- `console.log` в тестах на коммите — **SHOULD NOT**. Для отладки — `screen.debug()`.
- Тестирование библиотек (TanStack Query, Zustand и т.п.) — **MUST NOT**: их авторы уже покрыли. Тестируйте **ваш** код, использующий их.
- Крашить тесты на warning'и React — **SHOULD** (через `console.error` → throw в setup). Warning в проде — сигнал проблемы.
