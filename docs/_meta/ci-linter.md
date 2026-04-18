---
version: 1.0.1
last-reviewed: 2026-04-17
status: active
---

# CI Linter — валидация документации

> Оглавление: [`AGENTS.md`](AGENTS.md). Скрипт: [`../../scripts/lint-docs.mjs`](../../scripts/lint-docs.mjs).

Минимальный линтер, который проверяет структурную целостность документации: frontmatter, внутренние ссылки, консистентность ADR. Zero-dep, запускается одной командой.

---

## 1. Запуск

```bash
node scripts/lint-docs.mjs
```

Или через npm-скрипт из корня:

```bash
npm run lint
```

Возвращает:

- `0` — проверки прошли, linter печатает `✓ Checked N file(s). Passed.`;
- `1` — найдены нарушения; linter печатает список ошибок и, при наличии, предупреждения;
- `2` — внутренний сбой линтера (сообщение об ошибке — в stderr).

Требования: **Node.js 20+**, без внешних зависимостей.

---

## 2. Что проверяется

### Frontmatter — обязательно для каждой `docs/**/*.md` и корневого `AGENTS.md`

| Поле | Правило | Ошибка при нарушении |
|---|---|---|
| `version` | Формат semver (`\d+\.\d+\.\d+`) | `frontmatter: \`version\` must be semver` |
| `last-reviewed` | ISO-дата `YYYY-MM-DD`, не в будущем | `frontmatter: \`last-reviewed\` must match YYYY-MM-DD` / `in the future` |
| `status` | Для глав: `active` / `draft` / `deprecated`. Для ADR: `proposed` / `accepted` / `rejected` / `superseded` / `deprecated` | `frontmatter: invalid \`status\`` |
| Сам frontmatter | Присутствует и парсится | `missing frontmatter` / `YAML parse error` |

### Variant-главы (`docs/*/variants/*.md`)

- **MUST** содержать поле `requires`.
- `requires` **MUST** содержать хотя бы одну из секций: `profile` или `min`.

### ADR (`docs/decisions/NNNN-*.md`)

- Поле `id` — обязательно, 4 цифры, совпадает с префиксом имени файла.
- Для `status: accepted` — обязательно поле `date`.
- Для `status: superseded` — обязательно поле `superseded-by`.
- `supersedes` и `superseded-by` — взаимно согласованы: если ADR A указывает `supersedes: B`, то ADR B **MUST** иметь `superseded-by: A`.
- Каждый ADR-файл **MUST** быть упомянут по имени в [`../decisions/README.md`](../decisions/README.md) (секция Index).

### Внутренние ссылки

- Каждая markdown-ссылка вида `[text](path)`, где `path` не начинается с `http://`, `https://`, `mailto:`, `tel:` или `#`, **MUST** резолвиться в существующий файл или директорию.
- Ссылки **игнорируются** внутри fenced-кода (` ``` ... ``` `) и inline-кода (`` `...` ``). Такие ссылки — иллюстративные, не навигационные.
- Якоря (`#section-name`) не валидируются (нет единого правила slug'ификации русских заголовков между рендерами).

### Предупреждения (не блокируют)

- `last-reviewed` старше 24 месяцев — предупреждение, не ошибка. Сигнал для планового ревью (см. [`governance.md`](governance.md) раздел 2).

---

## 3. Что НЕ проверяется (пока)

Эти вещи **SHOULD** проверяться в будущих версиях линтера; пока — ответственность автора и ревьюера:

- Соответствие `requires.profile` в variant-главе реальному полю/опции в [`../code-style/PROFILE.md`](../code-style/PROFILE.md).
- Сверка `requires.min.react` и подобных с минимальными версиями в `PROFILE.md`.
- Наличие обязательных секций в категорийном `AGENTS.md` (Scope / When to Read / Working Protocol / Hard Invariants / Pre-Flight / «If Chapters Disagree»).
- Использование RFC 2119 keywords в текстах правил (сейчас — только через ручной ревью).
- Запрещённые слова-паразиты из [`style-guide.md`](style-guide.md) раздел 2.
- Якоря внутри markdown-ссылок.

Расширение линтера **SHOULD** оформляться ADR (если добавляет проверку `MUST`) или PR без ADR (если добавляет только предупреждения).

---

## 4. Интеграция в CI

### GitHub Actions (пример)

```yaml
name: Docs Lint
on:
  pull_request:
    paths: ["docs/**", "AGENTS.md", "scripts/lint-docs.mjs"]
  push:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
      - run: node scripts/lint-docs.mjs
```

### Pre-commit hook (опционально)

Можно добавить в husky/pre-commit:

```bash
node scripts/lint-docs.mjs
```

Локально прогон быстрый (< 1 сек на ~50 файлов), без внешних зависимостей — подходит для commit-hook без установки node_modules.

---

## 5. Архитектура скрипта

Файл [`../../scripts/lint-docs.mjs`](../../scripts/lint-docs.mjs) — один self-contained ES-модуль. Основные блоки:

- **File discovery** (`walk`): обход `docs/**` + корневой `AGENTS.md`, игнорирует `node_modules` и скрытые директории.
- **YAML-парсер** (`parseYaml`): минимальный, поддерживает только грамматику нашего frontmatter (плоские key-value + вложенные объекты через 2-space indent). **Не** поддерживает массивы, multi-line strings, якоря YAML. Этого достаточно; при необходимости расширения — рассмотреть `js-yaml` как dep.
- **Per-file validation** (`validateFrontmatter`): обязательные поля, типы, ADR- и variant-специфика.
- **Link validation** (`checkLinks`): strip fenced/inline code → regex `[text](path)` → `existsSync`.
- **Cross-file checks**: `checkAdrIndex` (ADR → README), `checkSupersedes` (взаимная согласованность ADR).

---

## 6. Когда менять линтер

- **Добавить правило, которое блокирует мёрж (`error`)** — ADR + обновление этой главы + тесты (вручную прогнать на известных нарушениях).
- **Добавить предупреждение (`warn`)** — без ADR, но обновить эту главу.
- **Смена frontmatter-схемы** — см. [`governance.md`](governance.md) раздел 4, миграция всех файлов в том же PR.

### Чего делать **MUST NOT**

- Писать правила прямо в скрипт без обновления этой главы — автор PR должен видеть, что проверяется.
- Отключать проверки для «сложных» файлов через inline-директивы. Если файл не подходит под текущую схему — либо меняется схема (через ADR), либо меняется файл.
