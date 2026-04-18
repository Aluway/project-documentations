---
version: 1.0.2
last-reviewed: 2026-04-17
status: active
requires:
  profile:
    react-compiler: enabled
---

# 02 — React Compiler (variant)

> Оглавление: [`../README.md`](../README.md). Профиль стека: [`../PROFILE.md`](../PROFILE.md).
> **Активен, если в `PROFILE.md` React Compiler = enabled.**

React Compiler 1.0 (stable с октября 2025) — build-time инструмент, автоматически вставляющий мемоизацию. При его использовании ручная мемоизация **не применяется**.

---

## 1. Главный принцип

> **Пишите чистый код. Компилятор сделает остальное.**

При соблюдении Rules of React разработчик **не пишет** `useMemo` / `useCallback` / `React.memo` вручную.

---

## 2. Установка

```bash
# Exact pin (MUST, if test coverage is weak)
npm install --save-dev --save-exact babel-plugin-react-compiler@1.0.3

# Latest minor (allowed with good coverage and a regular CI)
npm install --save-dev babel-plugin-react-compiler@^1
```

- `--save-exact` (+ точная версия, без `@latest` и без `^`) **MUST** использоваться, если покрытие тестами слабое. Конкретную версию смотрите в npm (`npm view babel-plugin-react-compiler version`) и коммитьте в lockfile.
- `@latest` в команде установки **SHOULD NOT** — это непредсказуемая версия; для воспроизводимости используйте конкретный номер.

### Babel конфиг

```js
// babel.config.js
module.exports = {
  plugins: [
    ["babel-plugin-react-compiler", {
      // sources: (filename) => filename.includes("src/"),   // опционально ограничить scope
    }],
  ],
};
```

### Фреймворки

- **Next.js 16+** — поддержка **стабильна**, флаг `experimental.reactCompiler` **удалён**. Активируется опцией `reactCompiler: true` в `next.config.js`, либо автоматически включён при создании проекта из compiler-шаблона через `create-next-app`:
  ```js
  // next.config.js
  export default {
    reactCompiler: true,
  };
  ```
- **Next.js 15** — поддержка **experimental**. Активируется через `experimental.reactCompiler: true` в `next.config.js`. При апгрейде на 16 — убрать `experimental.` префикс.
- **Vite** — через `@vitejs/plugin-react` + Babel plugin в `babel.plugins`. Пример:
  ```ts
  // vite.config.ts
  import react from "@vitejs/plugin-react";
  export default defineConfig({
    plugins: [
      react({ babel: { plugins: ["babel-plugin-react-compiler"] } }),
    ],
  });
  ```
- **Expo SDK 54+** — включено из коробки, ничего настраивать не нужно.

Точный рецепт активации зависит от фреймворка и его версии из [`../PROFILE.md`](../PROFILE.md). При несовпадении версий (Next.js 14 или ниже, Vite < 5) — **MUST** проверить документацию соответствующего фреймворка на этот момент, compiler может не поддерживаться.

---

## 3. Rules of React (компилятор полагается на это)

Компилятор безопасен только если код следует правилам:

- **Чистота рендера.** Тело функции компонента **MUST NOT** иметь побочных эффектов: никаких `fetch`, `setState` соседнего, `document.*`, `Math.random()` напрямую в рендере.
- **Иммутабельность props и state.** `props.items.push(x)` — **MUST NOT**. `state.count++` — **MUST NOT**.
- **Хуки только на верхнем уровне.** См. [`../universal/03-hooks.md`](../universal/03-hooks.md).
- **JSX не модифицирует родительские значения.** Элемент — описание, не действие.
- **Ref-мутации только в эффектах/обработчиках**, не в рендере.

Нарушения пометит `eslint-plugin-react-compiler`.

---

## 4. ESLint-плагин

```bash
npm install --save-dev eslint-plugin-react-compiler
```

В `eslint.config.js`:
```js
import reactCompiler from "eslint-plugin-react-compiler";

export default [
  { plugins: { "react-compiler": reactCompiler } },
  { rules: { "react-compiler/react-compiler": "error" } },
];
```

- **MUST** быть включён при `React Compiler = enabled`.
- Warning'и плагина — сигнал о нарушении Rules of React.

---

## 5. Ручная мемоизация — только в исключительных случаях

`useMemo` / `useCallback` **MAY** использоваться вручную даже при включённом компиляторе в случаях:

1. **Стабильная ссылка для внешней системы** — значение передаётся в non-React-код (`useSyncExternalStore`, DOM-события, сторонние либы с референсным равенством).
2. **Очень дорогое вычисление** (> 1 мс в профилировании).
3. **Интеграция со старым кодом**, который уже не переписать.

В остальных случаях — **MUST NOT** писать вручную.

### `React.memo`

- В новых компонентах **MUST NOT** — компилятор решает.
- В legacy-коде **MAY** удаляться при миграции, если нет специфичной причины.

---

## 6. Пинование версии

Если покрытие тестами слабое, версию компилятора **SHOULD** пинить точечно:

```json
{
  "devDependencies": {
    "babel-plugin-react-compiler": "1.0.3"
  }
}
```

Без `^`. Обновление — через явный PR с полным CI прогоном.

---

## 7. Постепенная миграция

Если репо большое и Rules of React нарушаются местами:

1. Включить `eslint-plugin-react-compiler`.
2. Пофиксить warning'и по модулям.
3. Включить компилятор только на определённых путях (`sources` option).
4. Постепенно расширить до всего кода.

---

## 8. Антипаттерны при включённом компиляторе

- **Ручные `useMemo`/`useCallback`/`React.memo`** без обоснования — **MUST NOT**.
- **Мутации props/state** — **MUST NOT** (и так, и с компилятором; но здесь это особенно критично, потому что мемоизация компилятора рассчитывает на иммутабельность).
- **Side effects в рендере** — **MUST NOT**.
- **Игнорирование warning'ов `eslint-plugin-react-compiler`** — **MUST NOT**. Каждое предупреждение — потенциальная некорректная мемоизация.

---

## 9. Когда Compiler **не** включён — ссылка

Если в [`../PROFILE.md`](../PROFILE.md) `React Compiler = disabled` или `N/A` — применяйте [`manual-memoization.md`](manual-memoization.md).
