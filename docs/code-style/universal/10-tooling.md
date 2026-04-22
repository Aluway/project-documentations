# 10 — Инструменты (universal)

> Оглавление: [`../README.md`](../README.md).

Универсальные принципы конфигурации линтинга, форматирования, pre-commit и CI.

---

## 1. ESLint

### Версионная развилка

- **ESLint ≥ 9 (flat config)** — **MUST** для новых проектов. Конфиг — `eslint.config.js`. `.eslintrc*` и `.eslintignore` **MUST NOT** использоваться.
- **ESLint 8 (legacy)** — допустимо в существующих репо; при обновлении стека репо **SHOULD** переходить на 9.


### Минимальные зависимости

```bash
npm install --save-dev \
  eslint \
  typescript-eslint \
  eslint-plugin-react \
  eslint-plugin-react-hooks \
  eslint-plugin-jsx-a11y \
  eslint-plugin-import \
  eslint-config-prettier \
  globals
```

Дополнительно (по условиям проекта):
- `eslint-plugin-react-compiler` — если включён React Compiler.

### Базовый `eslint.config.js` (ESLint 9)

```js
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";
import importPlugin from "eslint-plugin-import";
import prettierConfig from "eslint-config-prettier";
import globals from "globals";

export default [
  { ignores: ["dist/**", "build/**", "coverage/**", "node_modules/**", ".next/**"] },

  js.configs.recommended,

  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  {
    files: ["**/*.{ts,tsx}"],
    plugins: { react },
    languageOptions: { globals: { ...globals.browser } },
    settings: { react: { version: "detect" } },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs["jsx-runtime"].rules,
      "react/prop-types": "off",
      "react/react-in-jsx-scope": "off",
    },
  },

  {
    files: ["**/*.{ts,tsx}"],
    plugins: { "react-hooks": reactHooks },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },

  {
    files: ["**/*.{ts,tsx}"],
    plugins: { "jsx-a11y": jsxA11y },
    rules: { ...jsxA11y.flatConfigs.recommended.rules },
  },

  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    plugins: { import: importPlugin },
    settings: { "import/resolver": { typescript: { alwaysTryTypes: true } } },
    rules: {
      "import/order": ["error", {
        groups: ["builtin", "external", ["internal", "parent", "sibling", "index"], "type"],
        "newlines-between": "always",
        alphabetize: { order: "asc", caseInsensitive: true },
      }],
      "import/no-default-export": "error",
    },
  },

  {
    rules: {
      "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports" }],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },

  prettierConfig,
];
```

### Локальные override'ы

Фреймворки, требующие default-экспорт в определённых файлах (Next.js pages, роутеры с lazy-routes):

```js
{
  files: ["src/pages/**/*.tsx", "src/routes/**/*.tsx"],
  rules: { "import/no-default-export": "off" },
}
```

### Опция: React Compiler

Если в проекте включён React Compiler — **MUST** добавить `eslint-plugin-react-compiler`.

```bash
npm install --save-dev eslint-plugin-react-compiler
```

Добавить блок в `eslint.config.js` (обычно перед блоком `prettierConfig`):

```js
import reactCompiler from "eslint-plugin-react-compiler";

export default [
  // ...другие блоки...

  {
    files: ["**/*.{ts,tsx}"],
    plugins: { "react-compiler": reactCompiler },
    rules: { "react-compiler/react-compiler": "error" },
  },

  prettierConfig,
];
```

Все warning'и плагина обрабатываем как `error` — это сигнал, что код нарушает Rules of React и Compiler не сможет корректно мемоизировать.

---

## 2. Prettier

### Правило

- Prettier ≥ 3 — **MUST**. Один конфиг на репо.
- `prettier-plugin-tailwindcss` — **MUST**, если в репо используется Tailwind.

### `.prettierrc.json`

```json
{
  "semi": true,
  "singleQuote": false,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "bracketSpacing": true,
  "bracketSameLine": false,
  "endOfLine": "lf",
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

### `.prettierignore`

```
dist
build
coverage
node_modules
.next
*.generated.ts
```

---

## 3. `package.json` scripts

Стандартный набор:

```json
{
  "scripts": {
    "dev": "...",
    "build": "...",
    "typecheck": "tsc --noEmit",
    "lint": "eslint . --max-warnings=0",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "check": "npm run typecheck && npm run lint && npm run format:check && npm run test"
  }
}
```

Конкретный `test` зависит от раннера проекта — замените на `jest` если нужно.

---

## 4. Husky + lint-staged

- **SHOULD** использоваться для pre-commit проверки.
- Pre-commit: только быстрые проверки изменённых файлов.
- Полный test-run — в CI, не в хуках.

```bash
npm install --save-dev husky lint-staged
npx husky init
```

`.husky/pre-commit`:
```bash
npx lint-staged
```

`package.json`:
```json
{
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": ["eslint --fix --max-warnings=0", "prettier --write"],
    "*.{json,md,css}": ["prettier --write"]
  }
}
```

---

## 5. CI-минимум

Для PR **MUST** проверяется:

1. `npm run typecheck`
2. `npm run lint`
3. `npm run format:check`
4. `npm run test`
5. `npm run build`

Пример GitHub Actions:

```yaml
name: CI
on: [push, pull_request]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "22", cache: "npm" }
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm run format:check
      - run: npm run test
      - run: npm run build
```

---

## 6. `.editorconfig`

**SHOULD** быть в корне — фиксирует базу независимо от IDE.

```ini
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true
indent_style = space
indent_size = 2

[*.md]
trim_trailing_whitespace = false
```

---

## 7. VS Code settings (опционально)

`.vscode/settings.json` для консистентного DX:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.organizeImports": "never"
  },
  "eslint.useFlatConfig": true,
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

`.vscode/extensions.json`:
```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode"
  ]
}
```

(добавьте `bradlc.vscode-tailwindcss`, если в репо Tailwind.)

---

## 8. Dependency updates

- **SHOULD** настраиваться Renovate или Dependabot (Renovate — более гибкий по конфигурации, Dependabot — проще и нативен для GitHub).
- Patch/minor — пакетно, раз в неделю.
- Major обновления React / TypeScript / ESLint — отдельным PR с прогоном полного CI.

---

## 9. Запрещённые паттерны

- `.eslintrc*` в новом репо — **MUST NOT**.
- `.eslintignore` — **MUST NOT**. Игноры в конфиге.
- Отключение правил глобально без комментария — **MUST NOT**.
- Prettier плагины, конфликтующие с ESLint, без `eslint-config-prettier` — **MUST NOT**.
- Полные тесты в pre-commit — **SHOULD NOT**.
- Коммит без прохождения `npm run check` — **MUST NOT**.
