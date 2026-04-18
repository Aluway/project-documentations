---
version: 1.1.0
last-reviewed: 2026-04-18
status: active
---

# 01 — Первый день после форка

> Оглавление: [`README.md`](README.md).

Пошаговый чек-лист адопции template-репо в новый проект. Цель — пройти за **один рабочий день** от клонирования до первого коммита с зелёным линтером и заполненной конфигурацией.

Предполагается, что вы уже склонировали / форкнули репозиторий и находитесь в его корне. Если ваш проект существенно отличается от дефолта (монорепо / fullstack / Expo / SSR-first / solo без CI), параллельно открыт [`02-common-branches.md`](02-common-branches.md) — там указано, какие шаги изменяются.

---

## 0. Адопция — два способа

Перед чек-листом — определитесь, **как** вы принесли содержимое шаблона в проект.

### 0.1 Один способ: GitHub «Use this template» кнопка

Открыли страницу template-репо на GitHub → **Use this template** → **Create a new repository** → склонировали. Всё содержимое шаблона — в новом репо, с чистой git-историей. Этот путь подходит для **новых** проектов с нуля.

### 0.2 Второй способ: `npx`-инсталлер для существующих проектов

Если у вас уже есть репо с кодом, и вы хотите **поверх** наложить документационную систему — используйте встроенный инсталлер:

```bash
cd my-existing-project
npx github:Aluway/project-documentations
```

Инсталлер:

- Копирует `docs/`, `scripts/`, `.github/`, `AGENTS.md`, `CONTRIBUTING.md`, `SECURITY.md`, `.env.example`, `.gitattributes` — **только если в целевом проекте их ещё нет**.
- **Smart-merge `package.json`**: ваши значения никогда не перезаписываются; шаблон добавляет scripts (`lint`, `lint:docs`) и `engines` только если отсутствуют.
- **Не трогает** `README.md`, `CHANGELOG.md`, `LICENSE`, `.gitignore` — эти файлы всегда специфичны для проекта; посмотрите template-версии вручную, если захотите что-то оттуда взять.
- Печатает summary: сколько файлов скопировано, что пропущено.

После установки — продолжайте с шага 1 этого чек-листа.

**Флаги инсталлера** (если нужны):

- `--dry-run` — показать, что произойдёт, без записи.
- `--force` — перезаписать существующие файлы (DESTRUCTIVE, используется с осторожностью).
- `--target=PATH` — установить в другую директорию вместо текущей.

---

## 1. Ориентация (15 минут)

Перед началом работы:

- [ ] Прочитать корневой [`../../AGENTS.md`](../../AGENTS.md) — языковая политика, precedence-правила, Global Pre-Flight.
- [ ] Прочитать [`README.md`](README.md) текущей категории — принципы онбординга.
- [ ] Запустить линтер: `node scripts/lint-docs.mjs`. Ожидаемый результат — `✓ Checked N file(s). Passed.`. Если красный — значит что-то сломалось при клонировании; **MUST** починить до продолжения.

---

## 2. Заполнение `PROFILE.md`

[`../code-style/PROFILE.md`](../code-style/PROFILE.md) — центральный файл конфигурации проекта. От его заполнения зависит, какие variant-главы применимы.

Откройте файл в редакторе и заполняйте по порядку:

### 2.1 Core

- [ ] `React version` — точная минорная версия (`18.3.1` / `19.1.0` / `20.0.0-beta.x`).
- [ ] `TypeScript version` — точная (`5.7.3`).
- [ ] `Node.js` — LTS-линия (`20 LTS` / `22 LTS`).
- [ ] `Build tool / Framework` — конкретный инструмент и версия (`Next.js 15.1.0` / `Vite 6.0.0` / `Remix 2.14.0` / `Expo 52` / `CRA (legacy)`).
- [ ] `Package manager` — `npm` / `pnpm` / `yarn` с версией (`pnpm 9.15.0`).

### 2.2 Compiler

- [ ] `React Compiler` — `enabled` / `disabled` / `N/A (React < 19)`. Если сомневаетесь и React 19 — начните с `disabled` (консервативный дефолт), включите позже отдельным PR.

### 2.3 State Management

- [ ] `Server state` — выбор серверного state-менеджера или `N/A`.
- [ ] `Global client state` — глобальный клиентский state или `Context only` / `N/A`.

### 2.4 Forms

- [ ] `Forms approach` — подход к формам. Если форм нет (dashboard-only или чисто read-only) — `N/A`.
- [ ] `Validation` — `Zod` / `Valibot` / `Yup` / `manual` / `N/A`.

### 2.5 Styling

- [ ] `Primary styling` — основной инструмент стилизации.
- [ ] `Component primitives` — UI-kit (shadcn/ui / Radix / MUI / custom / none).

### 2.6 Testing

- [ ] `Test runner` — `Vitest` / `Jest` / `none`.
- [ ] `Component testing` — `React Testing Library` / `Enzyme (legacy)` / `none`.
- [ ] `HTTP mocking` — `MSW` / `fetch-mock` / `manual` / `none`.

### 2.7 Tooling

- [ ] `ESLint` — версия. Для новых проектов — `9 (flat config)`.
- [ ] `Prettier` — `yes` / `no`.

### 2.8 Active Variant Modules

После заполнения выше:

- [ ] Проставьте `[x]` напротив **каждой** variant-главы, активной для вашего стека. Неактивные — оставить `[ ]`.
- [ ] Для variant-глав, неактивных из-за legacy-значения (например, `Forms = Formik (legacy)`), **MUST NOT** ставить `[x]` — legacy-код работает только по `universal/*` минимуму.

### 2.9 Compatibility Matrix

- [ ] Проверьте все комбинации из секции Compatibility Matrix в `PROFILE.md`. Если обнаружен конфликт — **остановитесь**, разрешите его до продолжения. Обычно это означает обновление одной из сторон конфликта (например, миграция ESLint 8 → 9, включение Prettier при Tailwind).

---

## 3. Правка корневого `README.md`

Template-версия [`../../README.md`](../../README.md) описывает сам шаблон. В форке **MUST** быть заменена описанием вашего проекта.

- [ ] Заменить первый абзац: «Documentation standards template...» → одно-два предложения о **вашем** продукте.
- [ ] В секции «What's inside» — оставить references на `docs/` структуру (большинство применимо), **удалить** упоминания template-специфики.
- [ ] В секции «Using this template» — заменить на «Getting started» для новых контрибьюторов проекта: клон, `npm install`, `npm run dev`.
- [ ] В секции «Quick commands» — добавить команды вашего проекта (`npm run dev`, `npm test`, `npm run build`).
- [ ] В секции «Conventions in one screen» — оставить; это ссылки на категории, они продолжают работать.
- [ ] В секции «Contributing» — оставить; `docs/workflow/` применима.
- [ ] В секции «License» — заменить `TBD per fork` на выбранную лицензию (см. шаг 6 ниже).

---

## 4. Очистка `CHANGELOG.md`

Template `CHANGELOG.md` содержит запись о scaffolding. В форке — неуместна.

- [ ] Удалить содержимое секции `## [Unreleased]`, оставив пустые подсекции `### Added`, `### Changed`, `### Fixed`.
- [ ] Первая запись в `## [Unreleased]` добавится при первом функциональном PR вашего проекта.
- [ ] Альтернатива: удалить `CHANGELOG.md` целиком до первого релиза (вернуть при тегировании `v0.1.0`). Допустимо для early-stage проектов.

---

## 5. Настройка `.github/`

- [ ] [`../../.github/workflows/docs-lint.yml`](../../.github/workflows/docs-lint.yml) — оставить; будет прогонять линтер на каждый PR. Если ваш CI — не GitHub Actions (GitLab / Jenkins / circleci) — перенести логику в соответствующий файл и удалить этот.
- [ ] [`../../.github/PULL_REQUEST_TEMPLATE.md`](../../.github/PULL_REQUEST_TEMPLATE.md) — оставить; шаблон описания PR совпадает с [`../workflow/02-pull-requests.md`](../workflow/02-pull-requests.md) раздел 3.
- [ ] [`../../.github/ISSUE_TEMPLATE/`](../../.github/ISSUE_TEMPLATE/) — оставить; общие bug/feature шаблоны.
- [ ] [`../../.github/CODEOWNERS`](../../.github/CODEOWNERS) — **MUST** быть заполнен или удалён:
  - Solo-репо: удалить файл.
  - Команда ≥ 2 человек: заполнить реальными GitHub-handles владельцев категорий (см. [`../_meta/governance.md`](../_meta/governance.md) раздел 1).

---

## 6. LICENSE

Template-репо шипится с **MIT** лицензией по умолчанию. Это работает для большинства open-source форков без правок.

- [ ] **Если форк остаётся под MIT** — заменить `<TEMPLATE-OWNER>` в файле `LICENSE` на имя владельца форка (организация или человек) и обновить copyright year.
- [ ] **Если форк меняет лицензию на Apache-2.0 / BSD / и т.п.** — заменить содержимое `LICENSE` целиком (шаблоны на [choosealicense.com](https://choosealicense.com/)), отразить выбор в `package.json` поле `license`.
- [ ] **Если форк closed-source / proprietary** — удалить `LICENSE`, в `package.json` выставить `"license": "UNLICENSED"` и `"private": true`, в корневом `README.md` явно зафиксировать ограничения использования.
- [ ] Обновить корневой `README.md` секцию «License».

---

## 7. `.env.example`

- [ ] Открыть [`../../.env.example`](../../.env.example).
- [ ] Удалить template-заглушку; заменить на реальные env-переменные проекта.
- [ ] Каждую переменную сопроводить комментарием: что это, публичная или секретная, где получить реальное значение. Формат — [`../security/01-secrets.md`](../security/01-secrets.md) раздел 3.

---

## 8. `package.json`

- [ ] `name` — имя проекта (scoped: `@org/project-name` или плоское).
- [ ] `version` — начать с `0.1.0` (pre-1.0).
- [ ] `description` — одно предложение о продукте.
- [ ] `repository` — URL репозитория.
- [ ] `author` — команда или организация.
- [ ] `license` — выбранная лицензия (совпадает с LICENSE-файлом).
- [ ] `private: true` — если репо не публикуется в npm.
- [ ] `scripts` — оставить `lint` и `lint:docs` (документационный линтер), добавить ваши команды.
- [ ] `engines.node` — минимальная версия Node, совпадающая с `PROFILE.md` → `Node.js`.

---

## 9. Прочтение ключевых `AGENTS.md`

Перед первым кодовым коммитом — бегло (по Scope, не вчитываясь) пройти:

- [ ] [`../workflow/AGENTS.md`](../workflow/AGENTS.md) — git и PR-процесс.
- [ ] [`../architecture/AGENTS.md`](../architecture/AGENTS.md) — FSD 2.1 pages-first.
- [ ] [`../code-style/AGENTS.md`](../code-style/AGENTS.md) — React+TS. Working Protocol начинается с «прочитать PROFILE.md» — вы уже его заполнили.
- [ ] [`../security/AGENTS.md`](../security/AGENTS.md) — secrets, input, deps.

Детальное чтение — по ходу первых задач, не сейчас.

---

## 10. Верификация

- [ ] `node scripts/lint-docs.mjs` — зелёный.
- [ ] `npx tsc --noEmit` (если TypeScript уже настроен) — без ошибок.
- [ ] Прогон любого скаффолда проекта (например, `npm run dev`) — успешен.

---

## 11. Первый коммит

- [ ] Ветка: `chore/adopt-template` (по правилам [`../workflow/01-git.md`](../workflow/01-git.md) раздел 1).
- [ ] Коммит-сообщение: `chore(setup): adopt documentation template` или аналогичное.
- [ ] PR следует [`../workflow/02-pull-requests.md`](../workflow/02-pull-requests.md).
- [ ] В описании PR: указать, какие разветвления из [`02-common-branches.md`](02-common-branches.md) применимы, если применимы.

---

## 12. Что дальше

Онбординг пройден. Следующие шаги в жизни проекта:

- Первая задача берётся по обычному флоу: ветка → код → PR → review → merge. См. [`../workflow/`](../workflow/AGENTS.md).
- Решения, отличающиеся от template-дефолтов (другой процесс, другой стек, дополнительная категория), **MUST** оформляться как override-ADR в [`../decisions/`](../decisions/AGENTS.md) с полем `supersedes: <id>` или `supersedes: null` (новое решение).
- Проект-специфичные категории (`docs/product/` — доменная модель; `docs/api/` — API-контракт; `docs/operations/` — setup и deploy) — добавляются по мере необходимости через процедуру из [`../_meta/governance.md`](../_meta/governance.md) раздел 4.
- Первый квартальный прогон [smoke-tests](../_meta/agent-smoke-tests.md) — через 3 месяца или после первого структурного изменения.

---

## 13. Red-flag'и

Остановитесь и обсудите с командой / владельцем template'а, если:

- **Compatibility Matrix в `PROFILE.md` показывает конфликт**, и неочевидно, какую сторону конфликта менять. Конфликт — сигнал о принципиальном несоответствии выбора инструментов; лучше обсудить, чем форсировать.
- **Линтер красный после шагов 1–10**, а причина неясна. Выкладывайте вывод в issue template-репо — это может быть регрессия в шаблоне.
- **Более 3 variant-глав одновременно активны в одной категории** (например, сразу три state-менеджера) — это намёк на нечёткие границы ответственности в проекте; лучше разобрать до начала кодинга.
- **Проект требует категории, которой нет в шаблоне** (observability, performance, accessibility-глубоко, localization) — создание категории через ADR до начала функциональной работы предотвращает «каждый делает по-своему».
- **Template-LICENSE отсутствует, и выбор неочевиден** — это вопрос юриста/owner'а, не разработчика.

---

## 14. Повторный онбординг при втором форке

Для второй и последующих адопций template'а этой же командой:

- Шаги 1, 9, 12 **MAY** пропускаться (команда уже знакома).
- Шаги 2–8, 10, 11 **MUST** проходиться полностью — поля `PROFILE.md`, `README.md` текст, `CHANGELOG` меняются для каждого проекта.
- Шаг 13 (red-flag'и) **SHOULD** проходиться полностью — каждый проект может упереться в свои грабли.
