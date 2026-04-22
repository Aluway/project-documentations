# 03 — Public API

> Оглавление: [`README.md`](README.md).

Каждый слайс (`pages`, `widgets`, `features`, `entities`) **MUST** экспонировать **Public API** — явный контракт, через который внешний код работает со слайсом. Public API реализуется файлом `index.ts` (или `index.tsx`) в корне слайса.

---

## Что даёт хороший Public API

1. **Защищает структуру.** Внутренние файлы можно переименовывать, перемещать, разделять без ломки потребителей.
2. **Кодирует поведенческий контракт.** Значимые поведенческие изменения вынуждают видимо менять Public API.
3. **Минимизирует поверхность.** Наружу попадает только то, что реально нужно.

---

## Правила

### 1. У каждого слайса MUST быть `index.ts`

✓ Корректно:
```
entities/user/
├── index.ts
├── ui/...
├── model/...
└── api/...
```

✗ Некорректно:
```
entities/user/
├── ui/...
├── model/...
└── api/...      ← ✗ нет index.ts, нет Public API
```

### 2. Экспорты MUST быть явными именованными ре-экспортами

✓ Корректно:
```ts
// entities/user/index.ts
export { UserCard } from "./ui/user-card";
export { UserAvatar } from "./ui/user-avatar";
export { userStore } from "./model/store";
export type { User, UserRole } from "./model/types";
```

✗ Некорректно:
```ts
// entities/user/index.ts
export * from "./ui";        // ✗ wildcard
export * from "./model";     // ✗ wildcard
export * from "./api";       // ✗ wildcard
```

Почему wildcards запрещены:
- Они скрывают, что именно торчит наружу — страдает discoverability.
- Они случайно обнажают внутренние хелперы, как только кто-то добавит новый файл в `./ui`.
- Tree-shaking становится менее предсказуемым.

### 3. Потребители MUST импортировать только из корня слайса

✓ Корректно:
```ts
import { UserCard } from "@/entities/user";
import type { User } from "@/entities/user";
```

✗ Некорректно:
```ts
import { UserCard } from "@/entities/user/ui/user-card";   // ✗ в обход Public API
import { userStore } from "@/entities/user/model/store";   // ✗ в обход Public API
```

### 4. Внутри одного слайса — относительные импорты

Внутри слайса файлы **MUST NOT** повторно входить через `index.ts` (это создаёт циклический барел). Используйте прямые относительные пути.

✓ Корректно (в файле `entities/user/ui/user-card.tsx`):
```ts
import { formatUserName } from "../lib/format-user-name";
import type { User } from "../model/types";
```

✗ Некорректно:
```ts
import { formatUserName } from "@/entities/user";   // ✗ повторный вход в свой барел
```

### 5. Между слайсами — абсолютные импорты с алиасами

Настройте алиас пути (например, `@/*` → `src/*`) один раз и используйте его везде для межслайсовых импортов.

✓ Корректно:
```ts
import { Button } from "@/shared/ui/button";
import { UserCard } from "@/entities/user";
```

✗ Некорректно:
```ts
import { Button } from "../../../shared/ui/button";  // ✗ длинный относительный путь между слайсами
```

---

## Public API на уровне сегмента

Правило зависит от слоя:

- **Слои со слайсами** (`pages`, `widgets`, `features`, `entities`): `index.ts` внутри сегмента (`ui/`, `model/`, `api/`) **SHOULD NOT** существовать. Корень слайса уже содержит полный Public API; дополнительный барел внутри сегмента создаёт конкурирующую точку входа и размывает контракт.
- **`shared/ui`**: каждый примитив **SHOULD** лежать в своей папке с `index.ts` — это стандартный паттерн.
- **Другие сегменты `shared`** (`shared/lib`, `shared/api`, `shared/config`): `index.ts` на папку — **MAY**, особенно при группировке связанных утилит (например, `shared/lib/dates/index.ts`). Плоский модульный файл тоже допустим.

✓ Корректный примитив `shared/ui`:
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

Потребитель:
```ts
import { Button } from "@/shared/ui/button";
```

✗ Некорректный сегмент-уровневый барел внутри слайса:
```ts
// entities/user/ui/index.ts   ← ✗ избыточно: барел слайса уже есть в entities/user/index.ts
export { UserCard } from "./user-card";
export { UserAvatar } from "./user-avatar";
```

Что **требуется** везде: у каждого **слайса** есть Public API в его корне (`index.ts` напрямую в папке слайса).

---

## Сводка анти-паттернов

| Анти-паттерн                                      | Почему запрещён                                 |
|---------------------------------------------------|-------------------------------------------------|
| Нет `index.ts` в корне слайса                     | Нет контракта, потребители лезут во внутренности |
| `export * from "./ui"`                             | Скрывает поверхность, случайно утекают внутренности |
| Импорт `@/entities/user/ui/...`                    | Ломает защиту структуры                         |
| Повторный вход в свой слайс через `@/...`          | Риск циклического барела                        |
| Default-экспорт из `index.ts`                      | Хуже для tree-shaking; предпочитайте именованные|

---

## Default-экспорты

Предпочитайте **именованные экспорты** везде. Default-экспорты из `index.ts` затрудняют рефакторинг и поиск.

✓ Корректно:
```ts
// entities/user/index.ts
export { UserCard } from "./ui/user-card";
```

✗ Некорректно:
```ts
// entities/user/index.ts
export { default as UserCard } from "./ui/user-card";   // ✗ default переименован при ре-экспорте
```
