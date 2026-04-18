---
version: 1.0.0
last-reviewed: 2026-04-17
status: active
requires:
  profile:
    global-client-state: zustand
---

# 05 — State: Zustand (variant)

> Оглавление: [`../README.md`](../README.md). Профиль стека: [`../PROFILE.md`](../PROFILE.md).
> **Активен, если в `PROFILE.md` Global client state = Zustand.**

Правила работы с глобальным клиентским состоянием через [Zustand](https://zustand.docs.pmnd.rs/). Применимо к любой версии React 18+.

---

## 1. Главные правила

- Для глобального клиентского state'а (не зависящего от бэкенда) **MUST** использовать Zustand.
- **MUST NOT** зеркалировать серверные данные в Zustand — для этого менеджер серверного state.
- **MUST NOT** использовать Context для часто меняющегося state'а — Zustand подписывает только нужные потребители.
- Селекторы — **обязательны** для читающих компонентов.

---

## 2. Размещение

- По FSD — в `shared/lib/store/` (для общих сторов) или в `model/` соответствующего слайса (для локальных для домена).
- Один стор на файл; имя файла = имя стора в kebab-case (`ui-store.ts`).

---

## 3. Определение стора

```ts
// shared/lib/store/ui-store.ts
import { create } from "zustand";

interface UIState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebar: (open: boolean) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  sidebarOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebar: (open) => set({ sidebarOpen: open }),
}));
```

- **Синтаксис `create<T>()(fn)`** (две пары скобок) — **MUST** в Zustand v5 для типизированного стора. Первая пара вызывает фабрику curried-create, вторая принимает state creator. Одна пара скобок (`create<T>(fn)`) сломает type inference при использовании middleware.
- Actions (мутации) — **в самом сторе**, а не снаружи. Это часть публичного API стора.

---

## 4. Использование — с селектором

✓ Корректно (подписка только на нужное):
```tsx
const sidebarOpen = useUIStore((state) => state.sidebarOpen);
const toggleSidebar = useUIStore((state) => state.toggleSidebar);
```

✗ Некорректно (ре-рендер на любое изменение стора):
```tsx
const { sidebarOpen, toggleSidebar } = useUIStore();
```

Для выборки нескольких полей используйте `useShallow`:

```ts
import { useShallow } from "zustand/react/shallow";

const { sidebarOpen, toggleSidebar } = useUIStore(
  useShallow((state) => ({
    sidebarOpen: state.sidebarOpen,
    toggleSidebar: state.toggleSidebar,
  })),
);
```

---

## 5. Middleware

### Persist

```ts
import { persist, createJSONStorage } from "zustand/middleware";

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: false,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebar: (open) => set({ sidebarOpen: open }),
    }),
    {
      name: "ui-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ sidebarOpen: state.sidebarOpen }),
    },
  ),
);
```

- `partialize` **MUST** использоваться, чтобы не сохранять функции/ephemeral state.

### DevTools

```ts
import { devtools } from "zustand/middleware";

export const useUIStore = create<UIState>()(
  devtools(
    (set) => ({
      sidebarOpen: false,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebar: (open) => set({ sidebarOpen: open }),
    }),
    { name: "UIStore" },
  ),
);
```

- **SHOULD** в dev-сборке для отладки.

### Immer

Для сложных вложенных обновлений:

```ts
import { immer } from "zustand/middleware/immer";

export const useUIStore = create<UIState>()(
  immer((set) => ({
    sidebarOpen: false,
    toggleSidebar: () =>
      set((state) => {
        state.sidebarOpen = !state.sidebarOpen;
      }),
    setSidebar: (open) =>
      set((state) => {
        state.sidebarOpen = open;
      }),
  })),
);
```

---

## 6. Использование вне React (вне компонента)

```ts
// Вне компонента — прямой доступ к стору
useUIStore.getState().toggleSidebar();

// Подписка
const unsubscribe = useUIStore.subscribe((state) => console.log(state.sidebarOpen));
```

- **MAY** использоваться в non-React коде (аналитика, event listeners).
- Подписки **MUST** очищаться при ненадобности.

---

## 7. Тесты

Глобальный стор — singleton. Между тестами **MUST** сбрасывать:

```ts
afterEach(() => {
  useUIStore.setState({ sidebarOpen: false }, true);
});
```

(Второй аргумент `true` — полная замена state.)

Альтернатива — фабрика стора для тестов:

```ts
export function createUIStore() {
  return create<UIState>()((set) => ({
    sidebarOpen: false,
    toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    setSidebar: (open) => set({ sidebarOpen: open }),
  }));
}
```

---

## 8. Антипаттерны

- **Деструктурирование всего стора без селектора** — **MUST NOT** (ре-рендер при любом изменении).
- **Actions снаружи стора** (отдельные функции, работающие с `useUIStore.getState()`) — **SHOULD NOT**. Помещайте actions в сам стор.
- **Хранение серверных данных в Zustand** — **MUST NOT**. Для этого — менеджер серверного state.
- **Мутация state'а напрямую** (`useUIStore.getState().sidebarOpen = true`) — **MUST NOT**. Только через `set`.
- **Множество мелких сторов, когда связано одно** — **SHOULD NOT**. Один стор per domain обычно удобнее.
- **Один гигантский стор на всё приложение** — **SHOULD NOT**. Делим по доменам (UIStore, AuthStore, и т.п.).
