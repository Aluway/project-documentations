# 08 — Примеры

> Оглавление: [`README.md`](README.md).

Сквозные структурные примеры, объединяющие все правила предыдущих разделов.

---

## 1. Минимальное дерево проекта

```
src/
├── app/
│   ├── index.ts
│   ├── providers/
│   │   └── root-provider.tsx
│   ├── routes/
│   │   └── app-routes.tsx
│   └── styles/
│       └── global.css
│
├── pages/
│   ├── dashboard/
│   │   ├── index.ts
│   │   ├── ui/
│   │   │   └── dashboard-page.tsx
│   │   └── model/
│   │       └── use-dashboard-data.ts
│   └── profile/
│       ├── index.ts
│       └── ui/
│           └── profile-page.tsx
│
├── widgets/
│   └── site-header/
│       ├── index.ts
│       └── ui/
│           └── site-header.tsx
│
├── features/
│   └── sign-out/
│       ├── index.ts
│       ├── ui/
│       │   └── sign-out-button.tsx
│       └── api/
│           └── sign-out.ts
│
├── entities/
│   ├── user/
│   │   ├── index.ts
│   │   ├── ui/
│   │   │   └── user-card.tsx
│   │   ├── model/
│   │   │   ├── types.ts
│   │   │   └── store.ts
│   │   ├── api/
│   │   │   └── user-api.ts
│   │   └── @x/
│   │       └── post.ts
│   └── post/
│       ├── index.ts
│       ├── ui/
│       │   └── post-card.tsx
│       └── model/
│           └── types.ts
│
└── shared/
    ├── ui/
    │   ├── button/
    │   │   ├── index.ts
    │   │   └── button.tsx
    │   └── input/
    │       ├── index.ts
    │       └── input.tsx
    ├── api/
    │   └── http-client.ts
    ├── lib/
    │   └── dates/
    │       └── format.ts
    └── config/
        ├── env.ts
        └── routes.ts
```

---

## 2. Page-local блок (v2.1 — не извлекаем)

Ситуация: у страницы dashboard сложный график выручки, используемый **только** dashboard, планов на переиспользование нет.

✓ Корректно:
```
pages/dashboard/
├── index.ts
├── ui/
│   ├── dashboard-page.tsx
│   └── revenue-chart.tsx        ← остаётся здесь, локальный
└── model/
    ├── use-dashboard-data.ts
    └── use-revenue-chart.ts     ← локальная логика
```

✗ Некорректно (преждевременное извлечение):
```
widgets/revenue-chart/           ← ✗ переиспользование не доказано
└── ...
```

### Public API страницы

```ts
// pages/dashboard/index.ts
export { DashboardPage } from "./ui/dashboard-page";
```

`revenue-chart.tsx` намеренно **не** ре-экспортируется — это внутренняя деталь страницы.

---

## 3. Миграция вниз (page-local → переиспользуемый виджет)

Триггер: теперь и странице profile нужна та же лента активности, что была только в dashboard.

### До

```
pages/dashboard/ui/activity-feed.tsx
pages/dashboard/model/use-activity-feed.ts
```

### После

```
widgets/activity-feed/
├── index.ts
├── ui/
│   └── activity-feed.tsx
└── model/
    └── use-activity-feed.ts

pages/dashboard/ui/dashboard-page.tsx   → import { ActivityFeed } from "@/widgets/activity-feed"
pages/profile/ui/profile-page.tsx       → import { ActivityFeed } from "@/widgets/activity-feed"
```

### `index.ts` после миграции

```ts
// widgets/activity-feed/index.ts
export { ActivityFeed } from "./ui/activity-feed";
export { useActivityFeed } from "./model/use-activity-feed";
```

---

## 4. Кросс-ссылка между entities через `@x`

Ситуация: у `Post` есть `author: User`.

### Фасад экспортёра

```ts
// entities/user/@x/post.ts
export type { User } from "../model/types";
```

### Потребитель

```ts
// entities/post/model/types.ts
import type { User } from "@/entities/user/@x/post";

export interface Post {
  id: string;
  title: string;
  body: string;
  author: User;
}
```

### Что использует остальное приложение

```ts
// features/like-post/api/like-post.ts
import type { Post } from "@/entities/post";
import { httpClient } from "@/shared/api/http-client";

export async function likePost(postId: Post["id"]): Promise<void> {
  await httpClient.post(`/posts/${postId}/like`);
}
```

Остальное приложение импортирует `User` из `@/entities/user`, а `Post` — из `@/entities/post`. Только сама сущность `post` внутри использует `@x/post`, чтобы увидеть `User`. Discoverability: `grep` по `@x/post` находит всех потребителей, для которых `post` — «другая сторона».

---

## 5. Public API: корректно vs некорректно

### ✓ Корректный `index.ts` слайса

```ts
// entities/user/index.ts
export { UserCard } from "./ui/user-card";
export { UserAvatar } from "./ui/user-avatar";
export { userStore } from "./model/store";
export { formatUserName } from "./lib/format-user-name";
export type { User, UserRole } from "./model/types";
```

### ✗ Некорректный `index.ts` слайса

```ts
// entities/user/index.ts
export * from "./ui";        // ✗ wildcard
export * from "./model";     // ✗ wildcard
export * from "./api";       // ✗ wildcard
```

### ✓ Корректный потребитель

```ts
import { UserCard } from "@/entities/user";
import type { User } from "@/entities/user";
```

### ✗ Некорректный потребитель

```ts
import { UserCard } from "@/entities/user/ui/user-card";
import { userStore } from "@/entities/user/model/store";
```

### ✓ Корректные относительные импорты внутри слайса

```ts
// entities/user/ui/user-card.tsx
import type { User } from "../model/types";
import { formatUserName } from "../lib/format-user-name";
```

### ✗ Повторный вход в свой барел

```ts
// entities/user/ui/user-card.tsx
import type { User } from "@/entities/user";   // ✗ вход в свой барел
```

---

## 6. Shared UI-примитив

```
shared/ui/button/
├── index.ts
├── button.tsx
└── button.module.css
```

```ts
// shared/ui/button/index.ts
export { Button } from "./button";
export type { ButtonProps } from "./button";
```

Используется отовсюду:

```ts
import { Button } from "@/shared/ui/button";
```

---

## 7. Фича со своим API и состоянием

```
features/sign-out/
├── index.ts
├── ui/
│   └── sign-out-button.tsx
├── api/
│   └── sign-out.ts
└── model/
    └── use-sign-out.ts
```

```ts
// features/sign-out/api/sign-out.ts
import { httpClient } from "@/shared/api/http-client";

export async function signOut(): Promise<void> {
  await httpClient.post("/auth/sign-out");
}
```

```ts
// features/sign-out/model/use-sign-out.ts
import { userStore } from "@/entities/user";
import { signOut as signOutRequest } from "../api/sign-out";

export function useSignOut() {
  return async () => {
    await signOutRequest();
    userStore.clear();
  };
}
```

```ts
// features/sign-out/ui/sign-out-button.tsx
import { Button } from "@/shared/ui/button";
import { useSignOut } from "../model/use-sign-out";

export function SignOutButton() {
  const signOut = useSignOut();
  return <Button onClick={signOut}>Sign out</Button>;
}
```

```ts
// features/sign-out/index.ts
export { SignOutButton } from "./ui/sign-out-button";
export { useSignOut } from "./model/use-sign-out";
```

Замечания:
- `features/sign-out` использует `@/shared/ui/button` (нижний слой ✓) и `@/entities/user` (нижний слой ✓).
- Наружу торчит только то, что нужно вызывающим; внутренности api и model — за Public API.
