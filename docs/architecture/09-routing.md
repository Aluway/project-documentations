# 09 — Роутинг

> Оглавление: [`README.md`](README.md).

Архитектурные правила роутинга в FSD 2.1: как `pages/*` слайсы связаны с роутером, кто владеет композицией маршрутов, как обращаться с параметрами. Глава стек-агностична — правила применяются к React Router, Next.js App Router, TanStack Router, Remix, Expo Router и другим современным роутерам. Библиотеко-специфика (сигнатуры `loader` / `action`, middleware, file-based conventions) — задача форка; она добавляется отдельной главой через ADR в проекте-потомке.

---

## 1. Ownership: кто владеет чем

Разделение ответственности между `app/` и `pages/*`:

- **`app/` MUST** владеть **композицией** маршрутов: сборка списка роутов, подключение роутер-провайдера, layout-обёртки, глобальные ошибки / not-found, redirect-логика верхнего уровня.
- **`pages/<page-name>/` MUST** экспортировать через `index.ts` собственное **определение маршрута**: путь, компонент, опционально loader / metadata / search-schema. Форма экспорта — стек-специфична (объект, функция-регистратор, default-export страницы для file-based роутеров); правило — экспорт **MUST** быть явным и документированным контрактом.
- **`app/` MUST NOT** импортировать UI страницы через внутренние пути (`@/pages/profile/ui/profile-page`). Только через корень слайса (`@/pages/profile`), в соответствии с [03-public-api](03-public-api.md).
- **`pages/<page>` MUST NOT** импортировать другие `pages/*` для композиции маршрутов; перекрёстная навигация — через `<Link>` / `navigate()`, не через прямой импорт.

Правило одной строкой: **`app/` собирает, `pages/*` регистрируются**.

---

## 2. Public API страницы для роутинга

Контракт `index.ts` страницы — расширение общего Public API ([03-public-api](03-public-api.md)). Минимум **MUST** включать:

- **Компонент страницы** — named export.
- **Определение маршрута** — путь и метаданные, либо через `route`-объект, либо через регистратор-функцию (зависит от роутера).

### Пример (router-agnostic)

```ts
// pages/profile/index.ts
export { ProfilePage } from "./ui/profile-page";
export { profileRoute } from "./model/route";
```

```ts
// pages/profile/model/route.ts
export const profileRoute = {
  path: "/profile",
  // component, loader, metadata — shape зависит от роутера:
} as const;
```

### Правила

- Определение маршрута **MUST** лежать в сегменте `model/` страницы (для data) или `config/` (для статической конфигурации). **MUST NOT** — в `ui/`.
- Metadata (title, description, og-tags) **MAY** экспортироваться через `index.ts` рядом с маршрутом. Единая точка — проще для `app/` читать.
- Для file-based роутеров (Next.js App Router, Remix, Expo Router) конвенции фреймворка часто **противоречат** явному `index.ts`-экспорту. В этом случае **MUST** документировать в форке: какие файлы — единственный источник определения маршрута (`page.tsx`, `route.tsx`), и какие экспорты они дают. Такой форк открывает собственный ADR о конвенциях.

---

## 3. Нестинг и композиция

Nested routes — маршруты внутри маршрутов с общим layout'ом (`/dashboard/users`, `/dashboard/billing`).

- **Общий layout** (shell / outlet) — **MUST** жить в `app/` как provider-компонент, либо в выделенном слайсе `pages/dashboard/` если layout — это сама страница с outlet'ом для nested-контента.
- **Nested страницы** (`/dashboard/users`) — **MAY** быть **отдельными слайсами** (`pages/dashboard-users/`), если страница полноценная по pages-first критериям. **MAY** быть **сегментами родителя** (`pages/dashboard/ui/users-tab.tsx`), если это всего лишь таб / вкладка без собственной URL-identity.
- **Правило решения**: если у сущности есть **собственный URL** и состояние, на которое бывают deep-links, — это отдельный слайс. Если это состояние UI внутри одной страницы — сегмент родителя.

### Антипаттерн

```
pages/
  dashboard/
    users/          # ✗ не слайс и не сегмент; неоднозначное место
      index.ts
      UsersTab.tsx
```

Правильно — один из двух:

```
pages/
  dashboard/
    ui/
      users-tab.tsx     # ✓ таб внутри одной страницы
  dashboard-users/      # ✓ отдельная страница с deep-link
    index.ts
    ui/users-page.tsx
```

---

## 4. Code-splitting

- Каждая страница **SHOULD** загружаться **лениво** (lazy): начальный bundle содержит только `app/`, shared-провайдеры и первую страницу точки входа.
- Лень реализуется через:
  - `React.lazy(() => import("@/pages/profile"))` — классический React Router;
  - роутер-native API (Next.js делает это автоматически через file-based конвенции, TanStack Router — через `createLazyRoute`).
- **Исключения** (eager load): критические маршруты точки входа — landing, login, 404. **MAY** включаться в начальный bundle, если их отсутствие при первом рендере ломает UX.
- Лень **MUST** сопровождаться Suspense-границей и ErrorBoundary на уровне `app/` или layout-страницы — см. [`../code-style/universal/09-performance-principles.md`](../code-style/universal/09-performance-principles.md) разделы 4–5.

### Preload на intent

- Prefetch при hover / focus / route-intent — **MAY** использоваться для ускорения perceived performance.

---

## 5. Route params и search params

URL-параметры (`/users/:id`) и query-string (`?page=2&sort=name`) — **внешние данные** с точки зрения приложения: пользователь **MAY** ввести их вручную, вставить из чужого URL, подменить в devtools.

- **MUST** — валидировать все параметры schema-парсером (Zod / Valibot / Yup) на границе использования в странице. Напрямую в JSX / логике — **MUST NOT** без валидации.
- **MUST** — типизировать результат валидации явно. `useParams()` без runtime-проверки возвращает `Record<string, string | undefined>` — это не защита.
- **MUST NOT** — передавать непровалидированные параметры в:
  - `fetch` / `axios` URL (внешние URL **MUST** валидироваться по allowlist доменов, чтобы не было open redirect / SSRF);
  - `dangerouslySetInnerHTML`, `href`, `src`;
  - SQL-подобные query-параметры в backend-запросах без двойной валидации на сервере.
- **SHOULD** — держать схемы параметров в `pages/<page>/model/params.ts` рядом с определением маршрута.

### Пример

```ts
// pages/user-profile/model/params.ts
import { z } from "zod";

export const UserProfileParamsSchema = z.object({
  id: z.string().uuid(),
});

export const UserProfileSearchSchema = z.object({
  tab: z.enum(["overview", "posts", "friends"]).default("overview"),
  page: z.coerce.number().int().positive().default(1),
});

export type UserProfileParams = z.infer<typeof UserProfileParamsSchema>;
export type UserProfileSearch = z.infer<typeof UserProfileSearchSchema>;
```

```tsx
// pages/user-profile/ui/user-profile-page.tsx
import { useParams, useSearchParams } from "<router>";
import { UserProfileParamsSchema, UserProfileSearchSchema } from "../model/params";

export function UserProfilePage() {
  const rawParams = useParams();
  const params = UserProfileParamsSchema.parse(rawParams);   // throws on invalid → ErrorBoundary
  // ...
}
```

Роутеры с built-in typed params (TanStack Router, Next.js 15+ type-safe routes) **MAY** заменять runtime-валидацию на compile-time гарантию; если выбранный роутер даёт такую гарантию, она **MUST** быть использована, а Zod-валидация опускается.

---

## 6. Navigation: декларативная vs программная

- **`<Link>` / `<NavLink>` / роутер-native компонент** — **SHOULD** использоваться по умолчанию для любой навигации, инициированной пользователем (клик по ссылке, кнопке-навигации).
- **Программная навигация** (`navigate(...)` / `router.push(...)`) — **MAY** использоваться только как **побочный эффект**:
  - После успешной мутации (redirect после submit'а формы);
  - В guard'ах / redirect-логике при проверке доступа;
  - В ответ на внешнее событие (WebSocket, postMessage).
Декларативная навигация **SHOULD** использоваться вместо программной, потому что:

- Поддерживает правый клик → «Открыть в новой вкладке», средний клик, ctrl-click — из коробки;
- Доступна для скринридеров как ссылка;
- Работает с prefetch / preload автоматически в большинстве роутеров;
- Тестируется проще (клик по ссылке — `getByRole('link')`).

### Антипаттерны

- **`<button onClick={() => navigate('/foo')}>Go</button>`** — **SHOULD NOT**. Это ссылка, замаскированная под кнопку; теряется semantics и горячие клавиши браузера. Используйте `<Link to="/foo">` стилизованный под кнопку.
- **`<a href="/foo" onClick={...preventDefault()}>` + programmatic navigate** — **MUST NOT**. Это `<Link>` на коленке, но без его преимуществ.

---

## 7. Redirects, guards, not-found

- **Redirects** — **MUST** обрабатываться на уровне роутера или server-side (Next.js `redirect()`, React Router `<Navigate>`), не через `useEffect(() => { location.href = ... })`. Последний ломает history и accessibility.
- **Guards / protected routes** (проверка авторизации перед показом страницы) — **MUST** жить в `app/` как обёртка над маршрутами или в router-native механизме (loaders, middleware). **MUST NOT** — в ui-компоненте страницы: `if (!user) return <Navigate to="/login" />` в начале страницы — симптом неправильного размещения.
- **404 / not-found** — **MUST** обрабатываться роутером как catch-all маршрут, привязанный из `app/`. Компонент 404-страницы **MAY** лежать в `pages/not-found/` (если достаточно content'а) или в `shared/ui/error/` (если это минимальный UI без доменной логики).
- **Access-denied (403)** — отдельная страница либо shared-компонент, подключаемый из guard'а.

---

## 8. Связь с другими правилами

Правила других категорий, применяемые к роутингу:

- [`03-public-api.md`](03-public-api.md) — `index.ts` страницы **MUST** иметь явные именованные экспорты, включая определение маршрута.
- [`05-pages-first.md`](05-pages-first.md) — решение «страница или сегмент» для nested-маршрутов принимается по pages-first.
- [`06-import-rules.md`](06-import-rules.md) — направление импортов: `app → pages → …`, без обратного.
- [`../code-style/universal/01-typescript.md`](../code-style/universal/01-typescript.md) раздел 3 — runtime-валидация параметров через schema-парсер.
- [`../code-style/universal/09-performance-principles.md`](../code-style/universal/09-performance-principles.md) раздел 4 — Suspense + ErrorBoundary для lazy-loaded страниц.
- [`../code-style/universal/07-accessibility.md`](../code-style/universal/07-accessibility.md) — focus management при смене маршрута: `MUST` возвращать фокус на осмысленный элемент (h1 страницы, main region).

---

## 9. Запрещённые паттерны

- **Определение маршрута в `app/`**, дублирующее или заменяющее `index.ts` страницы — **MUST NOT**. `app/` только **собирает** экспорты страниц, не описывает их.
- **Импорт UI страницы из `app/` через внутренние пути** (`@/pages/profile/ui/profile-page`) — **MUST NOT**. Только через корень слайса.
- **Перекрёстный импорт между `pages/*`** для композиции роутов — **MUST NOT**. Страницы не знают друг о друге; навигация — через URL, не через имя модуля.
- **Роутер как глобальный singleton вне `app/`** (прямой `import { router } from ...` в `features/*`, `entities/*`) — **MUST NOT**. Роутер — инфраструктура `app/`; побочные эффекты с навигацией пробрасываются через колбэки / context'ы на границе `app/`.
- **`useParams()` без валидации** — **MUST NOT** для параметров, которые используются в API-запросах, рендере или security-чувствительном коде.
- **Redirect через `location.href = ...`** — **MUST NOT**. Ломает SPA-историю, теряет состояние, провоцирует full reload.
- **Guard-логика в UI-компоненте страницы** — **SHOULD NOT**. Страница, отрендеренная для неавторизованного пользователя, — уже провал: нужно было не рендерить. Guard — в `app/` или в router-native механизме.
- **Lazy-load без Suspense-границы** — **MUST NOT**. React упадёт с необработанной promise-ошибкой.
- **Глобальный `navigate` из любого места** без пробрасывания через колбэк / event-hub — **SHOULD NOT**. Делает код зависимым от инициализированного роутера, усложняет тесты.
- **`<a href>` + `onClick={navigate}`** — **MUST NOT**. Либо `<Link>`, либо чистая кнопка с programmatic navigation.
