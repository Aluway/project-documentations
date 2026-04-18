---
version: 1.0.1
last-reviewed: 2026-04-17
status: active
---

# 02 — Обработка пользовательского ввода

> Оглавление: [`README.md`](README.md).

Правила защиты от XSS, code-injection и сопутствующих атак на клиентский код: `dangerouslySetInnerHTML`, `eval`, sanitization, URL-построение, Content Security Policy, Trusted Types.

---

## 1. Где начинается «ввод»

«Внешние данные» — всё, что не создано вашим кодом на этом же рантайме. В frontend-контексте:

- User input: формы, URL-параметры, search-query.
- API-ответы — даже от «своего» backend'а (backend может быть скомпрометирован).
- `localStorage`, `sessionStorage`, cookies, IndexedDB — могут быть изменены расширениями или другим JS.
- `postMessage`-сообщения из iframe или других окон.
- `WebSocket`-сообщения.
- File upload (имя файла, содержимое, metadata).
- Query-string и hash URL'а.
- Referrer-заголовок (если используется в приложении).
- Drag-and-drop данные.

**MUST** — валидировать внешние данные на границе приёма, прежде чем они попадают в бизнес-логику и рендер. Валидация — schema-based (Zod / Valibot / Yup), не ручная. См. [`../code-style/universal/01-typescript.md`](../code-style/universal/01-typescript.md) раздел 3.

---

## 2. XSS и рендер

React by default ескейпит значения в JSX (`{userInput}` — безопасно). XSS возникает, когда этот ескейпинг обходится.

### Основные вектора XSS в React-приложении

1. **`dangerouslySetInnerHTML={{ __html: userInput }}`** — прямой bypass.
2. **`href={userInput}`** с protocol'ом `javascript:` — клик исполняет код.
3. **Inline event-handlers из данных** (`onClick={new Function(data.code)}`) — `eval` в обёртке.
4. **`<script>`-тег, встроенный в данные и рендерящийся через `innerHTML`** — через неправильную библиотеку rich-text.
5. **CSS-injection** (`style={{ background: userInput }}` с `url(javascript:...)` в старых браузерах) — реже, но существует.

### `dangerouslySetInnerHTML`

- **MUST NOT** использоваться без sanitization.
- **MUST** — sanitization через доверенную библиотеку ([DOMPurify](https://github.com/cure53/DOMPurify) или [sanitize-html](https://github.com/apostrophecms/sanitize-html)), **не** собственная regex-функция.
- **MUST** — allowlist тегов и атрибутов минимален и оправдан задачей. По умолчанию — только `b`, `i`, `em`, `strong`, `p`, `br`, `a[href]` (с валидацией protocol'а).

✓ Корректно:
```tsx
import DOMPurify from "dompurify";

interface RichTextProps {
  html: string;
}

export function RichText({ html }: RichTextProps) {
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "p", "br", "a"],
    ALLOWED_ATTR: ["href"],
    ALLOWED_URI_REGEXP: /^(?:https?|mailto|tel):/i,
  });
  return <div dangerouslySetInnerHTML={{ __html: clean }} />;
}
```

✗ Некорректно:
```tsx
<div dangerouslySetInnerHTML={{ __html: article.body }} />    // ✗ no sanitization
<div dangerouslySetInnerHTML={{ __html: userInput.replace(/<script>/g, "") }} />  // ✗ regex filter is bypassable
```

### URL в атрибутах

- **MUST** — валидировать `href`, `src`, `action`, `formaction` на разрешённый protocol.
- **MUST NOT** — `href={userInput}` без проверки: `javascript:alert(1)` исполнится на клике.
- **SHOULD** — использовать helper:

```ts
const SAFE_PROTOCOLS = /^(https?|mailto|tel):/i;

export function safeUrl(url: string, fallback = "#"): string {
  try {
    const parsed = new URL(url, window.location.origin);
    return SAFE_PROTOCOLS.test(parsed.protocol) ? parsed.toString() : fallback;
  } catch {
    return fallback;
  }
}
```

### CSS-переменные и inline-стили

- **MAY** передавать user-input в CSS-переменные через `style={{ "--color": userColor }}` — safer чем прямой CSS.
- **MUST** — валидировать CSS-значения: color — через regex `/^#[0-9a-f]{3,8}$|^rgb/`, dimension — `/^\d+(\.\d+)?(px|em|rem|%)$/`.
- **MUST NOT** — брать сырой `userInput` в `style={{ background: userInput }}`: CSS-injection через `url(javascript:...)` работает в legacy-браузерах, `expression(...)` — в очень старом IE.

---

## 3. Runtime code execution — запрещённые API

Эти API выполняют строку как код. При любой утечке недоверенных данных в них — RCE в клиенте.

### Запрещены полностью

- **`eval(...)`** — **MUST NOT**. Нет случая, где это правильное решение в 2026.
- **`new Function(...)`** — **MUST NOT**. То же самое, что `eval`, в обёртке.
- **`setTimeout(string, ...)`, `setInterval(string, ...)`** с string-аргументом — **MUST NOT**. Используйте function-аргумент.
- **`document.write(...)`** — **MUST NOT**. Legacy, ломает страницу и потенциально XSS.

### Запрещены кроме специфичных случаев

- **`Function(...)`-constructor в sandbox'ах** (Web Worker, sandboxed iframe) **MAY** в case'ах типа пользовательских формул в spreadsheet-подобных UI. **MUST** быть обоснованно в коде, изолированно, с input-валидацией.
- **`innerHTML` на DOM-nodes** — **SHOULD NOT**; используйте React JSX или `textContent` для строк.
- **`insertAdjacentHTML`** — то же что `innerHTML`; используйте `insertAdjacentElement` или JSX.

### ESLint-правила

- **MUST** — включить `no-eval`, `no-implied-eval`, `no-new-func`, `no-script-url` в ESLint-конфиге.
- **SHOULD** — `react/no-danger` (warn, не error — `dangerouslySetInnerHTML` разрешён под sanitization).

---

## 4. URL-построение

User-input в URL — через безопасные API.

### `URL` и `URLSearchParams`

✓ Корректно:
```ts
const url = new URL("/api/search", window.location.origin);
url.searchParams.set("q", userQuery);
url.searchParams.set("page", String(pageNumber));
fetch(url);
```

✗ Некорректно:
```ts
fetch(`/api/search?q=${userQuery}&page=${pageNumber}`);   // ✗ query-injection via &, #
fetch("/api/search?q=" + encodeURIComponent(userQuery));  // ✓ works, but manual escaping is error-prone
```

### Open redirect

- **MUST NOT** — редирект на URL из query-string без проверки:

```ts
// ✗ Open redirect — attacker uses your domain to redirect the victim to theirs.
window.location.href = new URLSearchParams(location.search).get("returnTo")!;
```

- **MUST** — allowlist доменов или путей:

```ts
const SAFE_ORIGINS = new Set([window.location.origin]);

export function safeRedirect(returnTo: string | null): string {
  if (!returnTo) return "/";
  try {
    const url = new URL(returnTo, window.location.origin);
    return SAFE_ORIGINS.has(url.origin) ? url.pathname + url.search : "/";
  } catch {
    return "/";
  }
}
```

---

## 5. postMessage и cross-frame

Если приложение общается через `window.postMessage` (iframes, popup'ы, WebViews):

- **MUST** — проверять `event.origin` на allowlist на **каждое** сообщение.
- **MUST NOT** — `event.origin === "*"` ни при отправке, ни при приёме.
- **MUST** — валидировать `event.data` schema-парсером.

```ts
const TRUSTED_ORIGINS = new Set(["https://parent.example.com"]);

window.addEventListener("message", (event) => {
  if (!TRUSTED_ORIGINS.has(event.origin)) return;
  const result = MessageSchema.safeParse(event.data);
  if (!result.success) return;
  handle(result.data);
});
```

---

## 6. Content Security Policy (CSP)

CSP — заголовок, ограничивающий, откуда страница **MAY** загружать ресурсы и исполнять код. Это второй слой защиты поверх sanitization.

### Минимальная политика для frontend SPA

- **MUST** — `default-src 'self'` как база.
- **MUST** — `script-src` без `'unsafe-inline'` и `'unsafe-eval'` — они нейтрализуют CSP.
- **SHOULD** — nonce-based CSP для inline-скриптов, если они нужны (server-side): `script-src 'self' 'nonce-<random>'`.
- **MUST** — `object-src 'none'` — отключает устаревшие плагины (Flash, Java applet).
- **MUST** — `base-uri 'self'` — не даёт атакующему подменить `<base href>` через XSS.
- **SHOULD** — `frame-ancestors 'none'` или список доверенных — защита от clickjacking.
- **SHOULD** — `report-to` / `report-uri` с endpoint'ом для мониторинга нарушений.

Политика **MUST** тестироваться в `Content-Security-Policy-Report-Only` перед enforcement — ошибочный CSP ломает страницу.

### Связь с frontend-кодом

- Inline-скрипты (`<script>...</script>`) — **SHOULD NOT** без nonce / hash; CSP их блокирует.
- Inline event-handlers (`onclick="..."` в HTML) — CSP блокирует; используйте `addEventListener` или React JSX.
- CSS-in-JS — **MAY** требовать `style-src 'unsafe-inline'` либо nonce-based inject; библиотеки типа styled-components / Emotion поддерживают nonces.

Детальная настройка CSP — frameworks-специфична; в шаблонном репо заложен принцип, проект-потомок добавляет главу при включении SSR / CDN / edge-middleware.

---

## 7. Trusted Types (опционально)

Trusted Types — browser-API, запрещающий присваивание строк в sink-свойства (`innerHTML`, `outerHTML`, `script.src`) кроме как через политику-transformer. Включается через CSP: `require-trusted-types-for 'script'`.

- **MAY** — включить в projects с высоким security-требованием (e.g. финансы, health).
- **SHOULD** — если включено, sanitization-библиотека DOMPurify уже совместима (`returnTrustedType: true`).
- **MUST NOT** — применять хаки вроде `(x as unknown as TrustedHTML)` для обхода Trusted Types. Это возвращает уязвимость.

---

## 8. File upload

- **MUST** — валидировать MIME-type и размер файла **на сервере**. Клиентская валидация — удобство для пользователя, не защита.
- **MUST NOT** — доверять `File.type`. Его можно подделать. Сервер **MUST** проверять фактический content через magic-bytes.
- **SHOULD** — генерировать новое имя файла на сервере (UUID), не сохранять user-provided имя в storage-пути — это защищает от path-traversal через `../../`.
- **MUST NOT** — рендерить user-uploaded SVG напрямую: SVG может содержать `<script>`. Либо санитайз как HTML (DOMPurify поддерживает SVG), либо рендерить через `<img>` / `<object>` с CSP `sandbox`.

---

## 9. Запрещённые паттерны

- **`dangerouslySetInnerHTML` без sanitization** — **MUST NOT**.
- **`eval`, `new Function`, `setTimeout(<string>)`, `setInterval(<string>)`, `document.write`** — **MUST NOT**.
- **`innerHTML = userInput`, `insertAdjacentHTML`, `$(...).html(userInput)` с jQuery** — **MUST NOT** без sanitization.
- **`href={userInput}` или `src={userInput}` без проверки protocol'а** — **MUST NOT**.
- **Query-string конкатенация без `URL` / `URLSearchParams`** — **MUST NOT**.
- **Redirect на URL из `location.search` без allowlist** — **MUST NOT**.
- **`event.origin === "*"` в postMessage** — **MUST NOT**.
- **Рендер user-uploaded SVG без sanitization** — **MUST NOT**.
- **CSP с `'unsafe-inline'` + `'unsafe-eval'` одновременно** — **MUST NOT**; это означает, что CSP по факту отключён.
- **Кастомный sanitizer на regex** — **MUST NOT**. Используйте DOMPurify / sanitize-html.
- **Сохранение user-provided имени файла как path** — **SHOULD NOT**.
