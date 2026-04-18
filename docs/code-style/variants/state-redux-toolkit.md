---
version: 1.0.0
last-reviewed: 2026-04-17
status: active
requires:
  profile:
    global-client-state: redux-toolkit
---

# 06 — State: Redux Toolkit (variant)

> Оглавление: [`../README.md`](../README.md). Профиль стека: [`../PROFILE.md`](../PROFILE.md).
> **Активен, если в `PROFILE.md` Global client state = Redux Toolkit**, либо если в проекте используется RTK Query для серверного state'а.

Правила работы с [Redux Toolkit](https://redux-toolkit.js.org/) (RTK) и RTK Query.

---

## 1. Главные правила

- В новых проектах — **MUST** использовать **Redux Toolkit**, не «голый» Redux.
- Classic boilerplate (action creators, switch-case reducers) **MUST NOT** писаться вручную — только через `createSlice` / `createAsyncThunk` / `createApi`.
- Один `configureStore` на приложение; стор — **не singleton** в тестах (фабрика).

---

## 2. Размещение

По FSD:
- Стор и корневой редьюсер — `app/store.ts` (или `shared/lib/store/`).
- Slice'ы — `entities/<name>/model/` или `features/<name>/model/`.
- RTK Query endpoint'ы — `entities/<name>/api/` или `features/<name>/api/`.

---

## 3. `configureStore`

```ts
// app/store.ts
import { configureStore } from "@reduxjs/toolkit";
import { userReducer } from "@/entities/user";
import { apiSlice } from "@/shared/api/api-slice";

export const store = configureStore({
  reducer: {
    user: userReducer,
    [apiSlice.reducerPath]: apiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(apiSlice.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

- **MUST** использовать typed hooks (не `useDispatch`/`useSelector` напрямую):

```ts
// shared/lib/hooks.ts
import { useDispatch, useSelector, type TypedUseSelectorHook } from "react-redux";
import type { RootState, AppDispatch } from "@/app/store";

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

---

## 4. `createSlice`

```ts
// entities/user/model/user-slice.ts
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface UserState {
  current: User | null;
  theme: "light" | "dark";
}

const initialState: UserState = { current: null, theme: "light" };

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setCurrent: (state, action: PayloadAction<User | null>) => {
      state.current = action.payload;
    },
    toggleTheme: (state) => {
      state.theme = state.theme === "light" ? "dark" : "light";
    },
  },
});

export const { setCurrent, toggleTheme } = userSlice.actions;
export const userReducer = userSlice.reducer;
```

- Внутри reducer'ов **MAY** мутировать state напрямую — RTK использует Immer.
- Action creators генерируются автоматически из `reducers`.

---

## 5. Selectors

- Простые — через `useAppSelector((s) => s.user.current)`.
- Сложные/производные — через `createSelector` (reselect) для мемоизации:

```ts
import { createSelector } from "@reduxjs/toolkit";

export const selectCurrentUser = (state: RootState) => state.user.current;
export const selectIsAdmin = createSelector(
  selectCurrentUser,
  (user) => user?.role === "admin",
);
```

- **SHOULD** экспортировать селекторы из slice-модуля. Потребители импортируют их, а не лезут в структуру state'а напрямую.

---

## 6. `createAsyncThunk`

Для async-действий **без** серверного state'а (типа редких операций, которые не требуют кеширования):

```ts
export const logout = createAsyncThunk("user/logout", async () => {
  await fetch("/api/logout", { method: "POST" });
});
```

Для **серверных данных с кешированием** — используйте **RTK Query**, не thunks.

---

## 7. RTK Query

```ts
// shared/api/api-slice.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["User", "Post"],
  endpoints: (builder) => ({
    getUser: builder.query<User, string>({
      query: (id) => `/users/${id}`,
      providesTags: (result, _error, id) => [{ type: "User", id }],
    }),
    updateUser: builder.mutation<User, Partial<User> & { id: string }>({
      query: ({ id, ...patch }) => ({ url: `/users/${id}`, method: "PATCH", body: patch }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "User", id }],
    }),
  }),
});

export const { useGetUserQuery, useUpdateUserMutation } = apiSlice.endpoints;
```

- Tag-based инвалидация — **MUST** использоваться для связывания mutations ↔ queries.
- Хуки генерируются автоматически: `useXxxQuery` / `useXxxMutation`.

---

## 8. Тесты

Стор в тестах — через фабрику, не импорт singleton'а:

```ts
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";

function renderWithStore(ui: React.ReactElement, preloadedState?: Partial<RootState>) {
  const store = configureStore({
    reducer: { user: userReducer, [apiSlice.reducerPath]: apiSlice.reducer },
    preloadedState,
    middleware: (getDefault) => getDefault().concat(apiSlice.middleware),
  });
  return render(<Provider store={store}>{ui}</Provider>);
}
```

---

## 9. Антипаттерны

- **Classic Redux** (manual actions + switch reducers) — **MUST NOT** в новом коде.
- **Мутация state вне reducer'а** — **MUST NOT** (Immer работает только внутри slice reducer'ов).
- **`useDispatch`/`useSelector` без типов** — **MUST NOT** (используйте `useAppDispatch`/`useAppSelector`).
- **Серверные данные через `createAsyncThunk` вместо RTK Query** — **SHOULD NOT**. RTK Query — для серверного state; thunks — для разовых действий.
- **Глубокая вложенность state'а** — **SHOULD NOT**. Нормализуйте (ключи по id) для списков.
- **Дублирование selectors в компонентах** — **SHOULD NOT**. Один selector — один файл/экспорт.
- **Импорт singleton-стора в тестах** — **MUST NOT**.

---

## 10. Когда используется вместе с Zustand

Если в [`../PROFILE.md`](../PROFILE.md) оба варианта активны — определите границу ответственности:
- RTK — существующий legacy-state; миграционный план.
- Zustand — новые фичи.

Документируйте границу в ADR (`docs/decisions/`).
