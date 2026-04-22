# 03 — Хуки (universal)

> Оглавление: [`../README.md`](../README.md). Профиль стека: [`../PROFILE.md`](../PROFILE.md).

Универсальные правила для хуков, доступных во всех современных версиях React (18+). Хуки React 19 (`use`, `useActionState`, `useOptimistic`, `useFormStatus`) — в [`variants/react-19-features.md`](../variants/react-19-features.md).

---

## 1. Rules of Hooks

- Хуки **MUST** вызываться только на верхнем уровне функционального компонента или другого хука.
- Хуки **MUST NOT** вызываться условно, в циклах, во вложенных функциях, `try/catch`.
- `eslint-plugin-react-hooks` **MUST** быть включён в линтинг (см. [`10-tooling.md`](10-tooling.md)).

> Исключение есть только для хука `use()` в React 19 — его можно вызывать условно. См. [`variants/react-19-features.md`](../variants/react-19-features.md).

✓ Корректно:
```tsx
function Profile({ userId }: { userId: string }) {
  const user = useUser(userId);
  const [isOpen, setIsOpen] = useState(false);
}
```

✗ Некорректно:
```tsx
if (userId) {
  const user = useUser(userId);   // ✗ условный вызов
}
```

---

## 2. `useState`

- Для **независимых** единиц локального состояния.
- Если несколько единиц меняются вместе или следующее значение зависит от предыдущего → предпочтителен `useReducer`.
- Инициализатор как функция — **MUST** для дорогих вычислений.

✓ Корректно:
```tsx
const [count, setCount] = useState(0);
const [heavy] = useState(() => computeHeavyInitial());
```

✗ Некорректно:
```tsx
const [heavy] = useState(computeHeavyInitial());   // ✗ вызов на каждом рендере
```

### Обновление на основе предыдущего

```tsx
setCount((prev) => prev + 1);   // ✓
setCount(count + 1);            // ✗ риск stale closure
```

---

## 3. `useReducer`

Когда использовать:
- Множественные поля state с переходами (мастер, многостадийная форма).
- Логика state'а явно диспетчерская (actions + switch).
- Нужна чистая функция редьюсера для изолированного тестирования.

```ts
type State = { status: "idle" | "loading" | "success" | "error"; data?: User };
type Action =
  | { type: "fetch_start" }
  | { type: "fetch_success"; payload: User }
  | { type: "fetch_error" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "fetch_start":   return { ...state, status: "loading" };
    case "fetch_success": return { status: "success", data: action.payload };
    case "fetch_error":   return { status: "error" };
  }
}
```

---

## 4. `useEffect`

- Для синхронизации компонента с **внешней системой** (подписки, браузерные API, сторонние либы).
- **MUST NOT** использовать `useEffect` для:
  - Трансформации данных для рендера — считайте прямо в теле.
  - Запросов к API — это работа серверного-state инструмента (`variants/state-*`).
  - Синхронизации нескольких `useState` — объедините state или используйте `useReducer`.
- Dependency array **MUST** быть точным. `react-hooks/exhaustive-deps` — **MUST** включено.

✓ Правомерный эффект:
```tsx
useEffect(() => {
  const controller = new AbortController();
  window.addEventListener("resize", handleResize, { signal: controller.signal });
  return () => controller.abort();
}, []);
```

✗ Антипаттерн — производное состояние:
```tsx
useEffect(() => { setCount(items.length); }, [items]);   // ✗
// ✓ Правильно:
const count = items.length;
```

✗ Антипаттерн — запросы без менеджера:
```tsx
useEffect(() => {
  fetch(`/api/users/${id}`).then(...);   // ✗ используйте TanStack Query / SWR / и т.п.
}, [id]);
```

### `useLayoutEffect`

Только когда нужно синхронно измерить DOM до paint'а. В остальных случаях — `useEffect`.

### `useInsertionEffect`

Только для авторов CSS-in-JS библиотек. В прикладном коде **MUST NOT**.

---

## 5. `useMemo` / `useCallback`

Правило применяется в зависимости от наличия React Compiler в проекте:

- **Compiler **включён** (`React Compiler = enabled` в [`../PROFILE.md`](../PROFILE.md))** — ручные `useMemo`/`useCallback` **MUST NOT** писаться без обоснования. См. [`variants/react-compiler.md`](../variants/react-compiler.md).
- **Compiler **выключен/недоступен** (`disabled` / `N/A`)** — мемоизация применяется осознанно после профилирования. См. [`variants/manual-memoization.md`](../variants/manual-memoization.md).
- **Поле `React Compiler = TODO`** — агент **MUST** действовать по fallback-стратегии из `PROFILE.md`: попытаться уточнить; если нельзя — применять правила `manual-memoization.md` (консервативный дефолт: не мемоизировать профилактически) и пометить вывод как требующий ревью.

---

## 6. `useRef`

Для мутируемых ссылок, не вызывающих ре-рендер:
- DOM-ссылки.
- Хранение значений между рендерами без подписки (таймеры, ID интервалов, флаги).
- Latest-value паттерн с `useEffect`.

```tsx
function Editor() {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); }, []);
  return <input ref={inputRef} />;
}
```

---

## 7. `useContext`

- Для глобальных значений, которые **редко меняются** (тема, локаль, user, feature flags).
- **MUST NOT** использовать Context для часто меняющегося state'а — ре-рендер всех потребителей.
- Хелпер-хук над `useContext` **SHOULD** бросать осмысленную ошибку, если провайдер отсутствует.

```tsx
const ThemeContext = React.createContext<"light" | "dark" | null>(null);

export function useTheme() {
  const value = useContext(ThemeContext);
  if (value === null) throw new Error("useTheme must be used within ThemeProvider");
  return value;
}
```

---

## 8. `useTransition` / `useDeferredValue`

- `useTransition` — пометить обновление как «низкоприоритетное», чтобы не блокировать реакцию на ввод (фильтрация большого списка).
- `useDeferredValue` — получить «отложенную» версию значения; полезно для дорогой производной отрисовки.

```tsx
const [isPending, startTransition] = useTransition();

function handleSearch(query: string) {
  startTransition(() => {
    setResults(expensiveSearch(query));
  });
}
```

---

## 9. `useId`

Для стабильных уникальных ID (формы, aria-атрибуты), синхронизированных между сервером и клиентом.

```tsx
function Field({ label }: { label: string }) {
  const id = useId();
  return (
    <>
      <label htmlFor={id}>{label}</label>
      <input id={id} />
    </>
  );
}
```

**MUST** использоваться для связки `label ↔ input`, если нет естественного уникального id.

---

## 10. `useSyncExternalStore`

Для интеграции с внешним store'ом, который не предоставляет React-хука:
- Подписка на `window.matchMedia`.
- Интеграция с не-React либой, имеющей observable API.
- Основа для кастомных store'ов (Zustand, Valtio строят на нём).

Для прикладного кода редко нужен напрямую — используйте готовый стор-менеджер.

---

## 11. Кастомные хуки

- Имя **MUST** начинаться с `use`.
- Кастомный хук — обычная функция, которая вызывает другие хуки; никакой магии.
- Хорошие кастомные хуки инкапсулируют **логику**, не просто группируют вызовы.

✓ Корректно:
```ts
function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}
```

### Организация

- Переиспользуемые кастомные хуки живут в `shared/lib/` (по FSD) или в `model/` соответствующего слайса.
- Один хук на файл; имя файла = имя хука в kebab-case (`use-debounced-value.ts`).

---

## 12. Запрещённые паттерны

Сводка нарушений, рассеянных по разделам выше. Перед коммитом — **MUST** убедиться, что ни один не применён.

- **Хук в условии, цикле, вложенной функции, `try/catch`** — **MUST NOT**. Rules of Hooks: хуки только на верхнем уровне. См. раздел 1.
- **`useEffect` для производного состояния** (`useEffect(() => setDerived(compute(a, b)), [a, b])`) — **MUST NOT**. Вычисляйте при рендере либо через `useMemo`. См. раздел 4.
- **`useEffect` для синхронизации props → state** — **MUST NOT**. Используйте `key` для сброса или вычисление при рендере. См. раздел 4.
- **`useEffect` для преобразования событий в state без реального side-эффекта** — **MUST NOT**. Event-handler пишет в state напрямую.
- **Ручные `useMemo` / `useCallback` / `React.memo` при включённом React Compiler** — **MUST NOT** без обоснования. Компилятор решает сам. См. раздел 5 и [`../variants/react-compiler.md`](../variants/react-compiler.md).
- **`useContext` для часто меняющегося state'а** — **MUST NOT**. Ре-рендерит всех потребителей; используйте стейт-менеджер. См. раздел 7.
- **`useSyncExternalStore` в прикладном коде** — **MUST NOT**. Хук для авторов библиотек; в приложении используется менеджер, построенный поверх. См. раздел 10.
- **Mutating ref mid-render** (`ref.current = value` в теле компонента) — **MUST NOT**. Пишите в `useEffect` / event-handler. См. раздел 6.
- **Кастомный хук без реальной инкапсуляции логики** (просто группировка нескольких `useState`) — **SHOULD NOT**. Хук добавляет indirection; он оправдан, если переиспользуется либо инкапсулирует связанную логику. См. раздел 11.

---

## 13. React 19-хуки (указатель)

Если в репо React ≥ 19 и в [`../PROFILE.md`](../PROFILE.md) активен `variants/react-19-features.md` — применяйте оттуда правила для:

- `use()` — чтение промисов и контекста.
- `useActionState` — управление формами-с-actions.
- `useOptimistic` — оптимистичные обновления.
- `useFormStatus` — состояние формы для дочерних кнопок.

Если React 18 — эти хуки недоступны; используйте `useEffect` + `useState` или соответствующую библиотеку (см. `variants/forms-react-hook-form.md`).
