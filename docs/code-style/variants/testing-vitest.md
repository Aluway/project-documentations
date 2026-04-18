---
version: 1.0.0
last-reviewed: 2026-04-17
status: active
requires:
  profile:
    test-runner: vitest
---

# 11 — Testing: Vitest (variant)

> Оглавление: [`../README.md`](../README.md). Профиль стека: [`../PROFILE.md`](../PROFILE.md).
> **Активен, если в `PROFILE.md` Test runner = Vitest.**

Правила настройки и использования [Vitest](https://vitest.dev/) + React Testing Library. Универсальные принципы тестирования — в [`../universal/08-testing-principles.md`](../universal/08-testing-principles.md).

---

## 1. Установка

```bash
npm install --save-dev \
  vitest \
  @vitejs/plugin-react \
  @testing-library/react \
  @testing-library/user-event \
  @testing-library/jest-dom \
  jsdom
```

Опционально (для HTTP мокинга):
```bash
npm install --save-dev msw
```

---

## 2. `vitest.config.ts`

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    css: true,
    clearMocks: true,
  },
  resolve: {
    alias: { "@": "/src" },
  },
});
```

- `globals: true` — `describe/it/expect` без импортов.
- `environment: "jsdom"` — для компонент-тестов.
- `clearMocks: true` — автосброс `vi.fn()` между тестами.

---

## 3. `vitest.setup.ts`

```ts
import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});
```

---

## 4. `tsconfig.json` для тестов

```json
{
  "compilerOptions": {
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  }
}
```

---

## 5. Базовый шаблон теста

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { Counter } from "./counter";

describe("Counter", () => {
  it("increments when user clicks the button", async () => {
    const user = userEvent.setup();
    render(<Counter initial={0} />);

    await user.click(screen.getByRole("button", { name: /increment/i }));

    expect(screen.getByText(/count: 1/i)).toBeInTheDocument();
  });
});
```

---

## 6. MSW (HTTP-мокинг)

### `test/msw-server.ts`

```ts
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";

export const server = setupServer(
  http.get("/api/users/:id", ({ params }) =>
    HttpResponse.json({ id: params.id, name: "Test User" }),
  ),
);
```

### В `vitest.setup.ts`

```ts
import "@testing-library/jest-dom/vitest";
import { beforeAll, afterAll, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import { server } from "./test/msw-server";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
});
afterAll(() => server.close());
```

- `onUnhandledRequest: "error"` — тест упадёт на неожиданном запросе.

---

## 7. TanStack Query в тестах

```tsx
// test/render-with-query.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderOptions } from "@testing-library/react";

export function renderWithQuery(ui: React.ReactElement, options?: RenderOptions) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });

  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>, options);
}
```

- **MUST** выключать `retry` — иначе async ретраи замедляют тест.

---

## 8. Моки модулей

```ts
import { vi } from "vitest";

vi.mock("@/shared/api/analytics", () => ({
  trackEvent: vi.fn(),
}));
```

- **MUST** сбрасываться через `clearMocks: true` (в конфиге) или вручную `vi.clearAllMocks()`.

---

## 9. Таймеры

```ts
import { vi } from "vitest";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

it("debounces", () => {
  // ...
  vi.advanceTimersByTime(500);
  // ...
});
```

- **MUST** восстанавливать реальные таймеры в `afterEach`.

---

## 10. Coverage

```bash
npm install --save-dev @vitest/coverage-v8
```

```ts
// vitest.config.ts
test: {
  coverage: {
    provider: "v8",
    reporter: ["text", "html", "lcov"],
    exclude: ["**/*.config.*", "**/*.d.ts", "**/test/**"],
  },
},
```

Запуск: `vitest run --coverage`.

---

## 11. `package.json` scripts

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui"
  }
}
```

---

## 12. Best practices (Vitest-специфичные)

- `describe` **SHOULD** отражать имя компонента/модуля.
- `it` **SHOULD** начинаться с глагола и описывать observable behavior (`"increments when user clicks the button"`, а не `"works correctly"`).
- Snapshot-файлы лежат рядом как `*.snap` — коммитить в репо.
- `vi.useFakeTimers({ shouldAdvanceTime: true })` — для автопродвижения времени при async-операциях.

---

## 13. Антипаттерны

- **`jest.*` API вместо `vi.*`** — **MUST NOT** (исправить импорты при миграции с Jest).
- **Несброшенные моки** — **MUST NOT**. Используйте `clearMocks: true`.
- **`setTimeout` в тестах** вместо `vi.useFakeTimers()` — **SHOULD NOT**.
- **`waitFor` вокруг `getBy*`** — **SHOULD NOT**. Используйте `findBy*` (см. [`../universal/08-testing-principles.md`](../universal/08-testing-principles.md) раздел 4).
- **`screen.debug()`** в коммитах — **SHOULD NOT** (только для локальной отладки).
