---
version: 1.0.1
last-reviewed: 2026-04-17
status: active
---

# 09 — Принципы производительности (universal)

> Оглавление: [`../README.md`](../README.md). Профиль стека: [`../PROFILE.md`](../PROFILE.md).

Универсальные принципы производительности. Мемоизация зависит от наличия React Compiler: если он включён — [`variants/react-compiler.md`](../variants/react-compiler.md); если нет — [`variants/manual-memoization.md`](../variants/manual-memoization.md).

---

## 1. Главное правило: measure before optimize

- Оптимизация **MUST** основываться на измерениях, не на интуиции.
- Инструменты:
  - **React DevTools Profiler** — показывает ре-рендеры и их время.
  - **Chrome Performance tab** — JS-профайл.
  - **Lighthouse** — runtime-метрики (LCP, CLS, INP).

### Web Vitals-таргеты

- LCP < 2.5 s
- CLS < 0.1
- INP < 200 ms

Бюджет метрик **SHOULD** быть частью CI (Lighthouse CI / WebPageTest).

---

## 2. Rules of React — основа любого перформанса

- Чистота рендера: функция компонента **MUST NOT** иметь побочных эффектов в теле.
- Иммутабельность props и state. `props.items.push(x)` — **MUST NOT**. `state.count++` — **MUST NOT**.
- Хуки только на верхнем уровне (см. [`03-hooks.md`](03-hooks.md) раздел 1).

Нарушение правил делает оптимизации непредсказуемыми. Ни ручная мемоизация, ни React Compiler не спасают от мутаций state.

---

## 3. Мемоизация — по профилю

Поведение `useMemo` / `useCallback` / `React.memo` зависит от [`../PROFILE.md`](../PROFILE.md):

| Compiler | Правило |
|---|---|
| `enabled` | Ручная мемоизация **MUST NOT** без обоснования. См. [`variants/react-compiler.md`](../variants/react-compiler.md). |
| `disabled` / `N/A` | Мемоизация применяется осознанно после профилирования. См. [`variants/manual-memoization.md`](../variants/manual-memoization.md). |
| `TODO` | Уточните у разработчика до изменений, влияющих на мемоизацию. |

---

## 4. Suspense — для async-рендера

- Async-компоненты и чтение промисов (через `use()` или `useSuspenseQuery`) **MUST** оборачиваться в `<Suspense>` с осмысленным `fallback`.
- **MUST NOT** оборачивать всё приложение одним Suspense — один большой skeleton вместо стриминга.
- **SHOULD** ставить Suspense-границы на уровне логических областей (хедер, основной контент, сайдбар).

```tsx
<main>
  <Suspense fallback={<HeaderSkeleton />}>
    <Header />
  </Suspense>
  <Suspense fallback={<ContentSkeleton />}>
    <Content />
  </Suspense>
</main>
```

### Размер границ

- Слишком крупные → пустой экран при загрузке.
- Слишком мелкие → дёрганый UI.
- Ориентир: граница там, где у пользователя естественная пауза контента.

---

## 5. Error Boundary

- Suspense **MUST** сопровождаться Error Boundary **снаружи**. Иначе брошенная ошибка уйдёт вверх без graceful UI.
- **SHOULD** использовать библиотеку [`react-error-boundary`](https://github.com/bvaughn/react-error-boundary) — хук-совместимый API поверх классового boundary.
- **MUST NOT** писать собственный класс-boundary, если библиотеки достаточно.

```tsx
import { ErrorBoundary } from "react-error-boundary";

<ErrorBoundary FallbackComponent={ErrorFallback} onReset={resetState}>
  <Suspense fallback={<Loading />}>
    <Dashboard />
  </Suspense>
</ErrorBoundary>
```

### Порядок вложенности

```
<ErrorBoundary>
  <Suspense>
    <AsyncComponent />
  </Suspense>
</ErrorBoundary>
```

Ошибки ловит boundary, promises — Suspense.

---

## 6. Code splitting

- `lazy()` + `Suspense` для тяжёлых независимых разделов: маршруты, редакторы, редко открываемые модалки, большие графики.
- **MUST NOT** code-split'ить каждый мелкий компонент — сетевой оверхед перевешивает.

```tsx
import { lazy, Suspense } from "react";

const RichTextEditor = lazy(() => import("./rich-text-editor"));

<Suspense fallback={<EditorSkeleton />}>
  <RichTextEditor />
</Suspense>
```

- На уровне роутинга **SHOULD** применять lazy-routes (любой SPA-роутер поддерживает).

---

## 7. Списки и виртуализация

- Списки до ~200 элементов обычно не требуют виртуализации.
- > 200–500 элементов, либо ~50+ сложных карточек — **SHOULD** виртуализировать.
- Рекомендуемые либы: **TanStack Virtual** (универсальный), **react-window** (легковесный).

---

## 8. Изображения и ресурсы

- `<img>` **MUST** иметь `width` и `height` (предотвращает CLS).
- Адаптивные изображения — `srcset` + `sizes` или `<picture>`.
- `loading="lazy"` для изображений вне первого viewport'а.
- Иконки — SVG инлайн (компонент) для малого набора, `sprite.svg` + `<use>` для большой коллекции.
- Шрифты — с `font-display: swap` и preload только критичных.

---

## 9. Запросы и кеширование

Серверное состояние **MUST** проходить через специализированный менеджер (см. `variants/state-*.md`). Ручные `fetch + useEffect + setState` **MUST NOT** использоваться в прикладном коде.

- Cache-first подходы снижают LCP.
- Параллельные запросы **SHOULD** использоваться вместо каскадных (каскады увеличивают TTFB линейно от глубины цепочки).
- Prefetch на hover / route-intent **MAY** использоваться для ускорения perceived performance.

---

## 10. Бандл и зависимости

- Следите за bundle size. `rollup-plugin-visualizer` / `webpack-bundle-analyzer` / Next.js bundle analyzer — в CI.
- Лимит бандла **SHOULD** быть зафиксирован в CI (напр. `size-limit`).
- Тяжёлые либы (moment, lodash целиком) — **MUST NOT**. Используйте tree-shakeable альтернативы (date-fns, es-toolkit, нативные методы).

---

## 11. Запрещённые паттерны

- Один огромный Suspense на всё приложение — **MUST NOT**.
- Suspense без Error Boundary — **MUST NOT**.
- `useEffect` для синхронизации props → state — **MUST NOT** (см. [`03-hooks.md`](03-hooks.md) раздел 4).
- Lazy-loading каждого мелкого компонента — **SHOULD NOT**.
- Преждевременная виртуализация списка (до ~200 элементов) — **SHOULD NOT**.
- Ручные мемоизации, когда профиль говорит «Compiler enabled» — **MUST NOT** (см. `variants/react-compiler.md`).
