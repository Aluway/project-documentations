---
version: 1.0.0
last-reviewed: 2026-04-17
status: active
requires:
  profile:
    server-state: tanstack-query
  min:
    react: "18.0"
---

# 04 — State: TanStack Query (variant)

> Оглавление: [`../README.md`](../README.md). Профиль стека: [`../PROFILE.md`](../PROFILE.md).
> **Активен, если в `PROFILE.md` Server state = TanStack Query.**

Правила работы с серверным состоянием через [TanStack Query](https://tanstack.com/query/latest). Применимо к любой версии React от 18+ (совместимость отслеживается в самом TanStack Query).

---

## 1. Главные правила

- Любые данные, источник истины которых — бэкенд, **MUST** проходить через TanStack Query.
- **MUST NOT** писать ручные `useEffect + fetch + setState` в прикладном коде.
- Query-ключи — **иерархичные массивы** (`["users", userId, "posts"]`), не строки.
- Мутации — через `useMutation` с явной инвалидацией/`setQueryData` в `onSuccess`.

---

## 2. Базовый setup

```ts
// shared/api/query-client.ts
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

```tsx
// app/providers/query-provider.tsx
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/shared/api/query-client";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
```

(Если React ≥ 19 и используются Server Components — провайдер помечается `"use client"`; см. [`react-19-features.md`](react-19-features.md).)

---

## 3. Query-хуки — в слайсе

По FSD — в `entities/<name>/api/` или `features/<name>/api/`.

```ts
// entities/user/api/use-user.ts
import { useQuery } from "@tanstack/react-query";
import { httpClient } from "@/shared/api/http-client";
import type { User } from "../model/types";

export function useUser(userId: string) {
  return useQuery({
    queryKey: ["users", userId],
    queryFn: ({ signal }) => httpClient.get<User>(`/users/${userId}`, { signal }),
  });
}
```

- `signal` из queryFn-контекста **SHOULD** пробрасываться в `fetch`/`axios` для отмены при размонтировании.

### Как пробросить signal в низкоуровневый транспорт

`signal` — стандартный `AbortSignal` из браузерного API. Передаётся напрямую в `fetch`/`axios`:

```ts
// shared/api/http-client.ts (пример с fetch)
export const httpClient = {
  async get<T>(url: string, init?: RequestInit): Promise<T> {
    const res = await fetch(url, { ...init, method: "GET" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json() as Promise<T>;
  },
};

// Использование внутри queryFn:
queryFn: ({ signal }) => httpClient.get<User>(`/users/${userId}`, { signal }),
// fetch получает { signal } и сам прервёт запрос, когда TanStack Query отменит Query.
```

С axios:
```ts
import axios from "axios";

queryFn: ({ signal }) =>
  axios.get<User>(`/users/${userId}`, { signal }).then((res) => res.data),
```

**MUST NOT** игнорировать `signal` — без него отменённые Query продолжат занимать сеть и процессор.

---

## 4. Query keys

- **MUST** использовать массивы; порядок — от общего к частному.
- **MUST** фиксировать схему ключей в модуле (query-key factory):

```ts
export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (filters: Filters) => [...userKeys.lists(), filters] as const,
  details: () => [...userKeys.all, "detail"] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};
```

- Ключи **MUST** быть сериализуемыми (без функций, классов, Date-объектов без строкового представления).

---

## 5. Мутации

```ts
// features/update-profile/api/use-update-profile.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: Partial<User>) => httpClient.patch("/profile", updates),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["users", updatedUser.id], updatedUser);
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}
```

- После успешной мутации — **MUST** либо обновить кеш вручную (`setQueryData`), либо инвалидировать связанные запросы.
- Оба подхода допустимы; `setQueryData` быстрее (без повторного запроса), инвалидация безопаснее.

### Optimistic updates

Рекомендуется для мутаций с задержкой > 100 мс:

```ts
return useMutation({
  mutationFn: updateTodo,
  onMutate: async (newTodo) => {
    await queryClient.cancelQueries({ queryKey: ["todos"] });
    const previous = queryClient.getQueryData<Todo[]>(["todos"]);
    queryClient.setQueryData<Todo[]>(["todos"], (old) => [...(old ?? []), newTodo]);
    return { previous };
  },
  onError: (_err, _newTodo, context) => {
    if (context?.previous) queryClient.setQueryData(["todos"], context.previous);
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ["todos"] });
  },
});
```

---

## 6. Suspense-режим

`useSuspenseQuery` делает компонент ожидающим через Suspense (см. [`../universal/09-performance-principles.md`](../universal/09-performance-principles.md) раздел 4):

```tsx
const { data: user } = useSuspenseQuery({
  queryKey: ["users", userId],
  queryFn: () => fetchUser(userId),
});
// data гарантированно определён; компонент «подвешивается» до готовности
```

- **MAY** использоваться для компонентов, где данные обязаны быть перед рендером.
- **MUST** сопровождаться Error Boundary (см. [`../universal/09-performance-principles.md`](../universal/09-performance-principles.md) раздел 5).

---

## 7. Prefetch

Для улучшения perceived performance — **SHOULD** prefetch'ить данные при hover / route-intent:

```ts
function UserLink({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  return (
    <a
      href={`/users/${userId}`}
      onMouseEnter={() => {
        queryClient.prefetchQuery({
          queryKey: ["users", userId],
          queryFn: () => fetchUser(userId),
        });
      }}
    >
      View
    </a>
  );
}
```

---

## 8. Антипаттерны

- **`useEffect + fetch + setState` для серверных данных** — **MUST NOT**.
- **Строковые query-ключи** (`"users"`) — **MUST NOT**. Только массивы.
- **Query-ключи, не описанные в key factory** — **SHOULD NOT**.
- **Зеркалирование серверного state в Zustand/Redux** — **MUST NOT**. Источник истины — TanStack Query.
- **Глобальный Context поверх query-данных** — **MUST NOT**. TanStack Query уже глобально-доступен.
- **Ручное кеширование** (`localStorage` + кастомная логика) — **SHOULD NOT** без крайней необходимости. Вместо этого — `persistQueryClient` plugin.
- **Инвалидация «всего»** (`invalidateQueries()` без ключа) — **SHOULD NOT**. Всегда таргетированно.
