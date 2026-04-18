---
version: 1.0.1
last-reviewed: 2026-04-17
status: active
---

# 03 — Зависимости и supply chain

> Оглавление: [`README.md`](README.md).

Политика добавления новых пакетов, обращения с lockfile, audit, supply chain, `postinstall`-скриптов, deprecated-пакетов. Каждая transitive-зависимость — чей-то код в вашем bundle; ответственность — ваша.

---

## 1. Due diligence при добавлении пакета

Перед добавлением новой **прямой** зависимости (`dependencies` или `devDependencies` в `package.json`) автор PR **MUST** пройти чек-лист:

### Чек-лист

- [ ] **Функция действительно нужна.** Задача решается ли стандартной библиотекой / встроенным API? (Даты — `Intl.DateTimeFormat`, URL — `URL` / `URLSearchParams`, fetch — `fetch`.) Малые функции-утилиты (debounce, clsx, pick) — **SHOULD** написать inline, не тянуть пакет.
- [ ] **Активность поддержки.** Последний коммит ≤ 12 месяцев. Активный релизный цикл (несколько релизов за последний год).
- [ ] **Размер сообщества.** ≥ 1000 weekly downloads на npm как ориентир (для узкоспециальных пакетов — ниже, но с обоснованием).
- [ ] **Прозрачность maintainer'ов.** Автор / организация идентифицируемы; один-человек-проект с анонимным автором — **SHOULD NOT**.
- [ ] **Bundle size.** Для клиентских пакетов — проверить размер через [bundlephobia.com](https://bundlephobia.com) или [pkg-size.dev](https://pkg-size.dev). Пакеты > 20 KB gzip **SHOULD** обсуждаться (найти меньший / tree-shaking / lazy import).
- [ ] **Transitive-дерево.** `npm ls <pkg>` или `pnpm why <pkg>`. Пакеты, тянущие 50+ transitive-зависимостей — **SHOULD** рассматриваться критически.
- [ ] **TypeScript-типы.** Либо нативные (`pkg.types` в `package.json`), либо `@types/<pkg>` в DefinitelyTyped. Пакет без типов **SHOULD NOT** без обоснования.
- [ ] **Лицензия.** MIT / Apache 2.0 / BSD — OK по умолчанию. GPL / AGPL — **MUST** получить approve legal / owner. Proprietary — то же.
- [ ] **Нет `postinstall` / `preinstall` / `install` скриптов**, либо они прозрачны и документированы. Постустановочные скрипты — главный вектор supply-chain-атак. См. раздел 5 ниже.
- [ ] **Security-history.** Запросить в npm advisory DB, Snyk DB, GitHub Security Advisories — были ли CVE. Критические / не-фикснутые — **MUST NOT**.
- [ ] **Альтернативы рассмотрены.** В PR-описании **SHOULD** быть 1–2 альтернативы, которые были проверены, и причина выбора.

### Оформление в PR

Добавление зависимости **MUST** идти отдельным коммитом с содержательным message:

```
chore(deps): add dompurify for HTML sanitization

- Version: 3.0.6, MIT license, 8M weekly downloads.
- Bundle: 22 KB minified, 6 KB gzipped.
- No postinstall scripts.
- Alternative considered: sanitize-html (larger, slower).
- Usage: features/article/ui/rich-text.tsx.
```

---

## 2. Прямые vs transitive-зависимости

- **`dependencies`** — runtime-код приложения. Попадёт в production bundle (для клиентских) или в production runtime (для серверных).
- **`devDependencies`** — инструменты: тест-раннер, линтер, bundler, type-checker. **MUST NOT** импортироваться из runtime-кода.
- **`peerDependencies`** — контракт для библиотек (пакет ожидает, что у потребителя уже есть X). Для приложений редко нужны.
- **`optionalDependencies`** — **SHOULD NOT** использоваться для security-критичных вещей: если optional dep не установилась, она молча пропускается.

Transitive-зависимости — это «зависимости ваших зависимостей». Вы их не контролируете напрямую, но они выполняются в вашем runtime. Число transitive-зависимостей растёт геометрически с числом прямых — это аргумент за минимизацию прямых deps.

---

## 3. Lockfile

- **MUST** — ровно один lockfile в репо (`package-lock.json` / `pnpm-lock.yaml` / `yarn.lock`), соответствующий выбранному пакетному менеджеру. См. [`../workflow/01-git.md`](../workflow/01-git.md) раздел 5.
- **MUST** — lockfile закоммичен.
- **MUST** — `package.json` и lockfile обновляются атомарно (в одном коммите).
- **MUST** — CI-сборка использует `npm ci` / `pnpm install --frozen-lockfile` / `yarn install --immutable`. Это гарантирует, что lockfile соблюдается и не дрейфует.
- **MUST NOT** — правки lockfile вручную. Изменения — только через пакетный менеджер.
- **SHOULD** — проверка целостности lockfile через хэш-интегритет (npm делает это автоматически через `integrity`-поле; pnpm — через `integrity` checks).

### Обновление пакета

```bash
# Minor / patch update of a package:
npm update <pkg>

# Major update (breaking — requires human review):
npm install <pkg>@latest

# List outdated packages:
npm outdated
```

Обновление **MUST** сопровождаться:
- чтением CHANGELOG пакета;
- прогоном тестов (не только на изменённый путь — зависимости могут задеть что угодно);
- для мажоров — проверкой migration guide в PR-описании.

---

## 4. Audit

- **MUST** — `npm audit` (или `pnpm audit`) запускается в CI на каждый PR.
- **MUST** — уязвимости уровня `high` и `critical` **MUST** быть резолвнуты перед мёржем PR. Либо обновлением пакета, либо overrides в package.json, либо заменой пакета.
- **SHOULD** — уязвимости уровня `moderate` — резолвнуты в течение спринта.
- **MAY** — уязвимости `low` — откладываются, но отслеживаются.

### Overrides / resolutions

Если transitive-уязвимость не фиксится прямым обновлением, используйте overrides:

```json
// package.json (npm 8.3+)
{
  "overrides": {
    "lodash": "^4.17.21"
  }
}
```

```yaml
# pnpm
pnpm.overrides:
  lodash: ^4.17.21
```

- **MUST** — override комментируется в PR: какая CVE, почему не фиксится через прямое обновление, до какого момента override действителен.
- **SHOULD** — override снимается при следующем обновлении прямой зависимости, если транзитивная уязвимость закрыта upstream.

### Exception для не-фиксимых уязвимостей

Иногда уязвимость не имеет фикса (dev-only path, unused code path, upstream не отвечает). Тогда:

- **MUST** — exception документирован в `.snyk` / `audit-ci.json` / аналог с:
  - CVE / advisory ID;
  - причина exception'а;
  - дата пересмотра (не более 90 дней);
  - ответственный.
- **MUST** — exception пересматривается в указанную дату, не продлевается молчанием.

---

## 5. `postinstall` и install-скрипты

Install-скрипты (`preinstall`, `install`, `postinstall`, `prepare`) npm-пакетов выполняются **в вашей машине** (и CI) при установке. Это **главный вектор** supply-chain-атак: malicious maintainer может слить токены / секреты, установить бэкдор.

### Правила

- **MUST** — `npm ci` / `pnpm install --ignore-scripts` в CI и production-build для всех путей, где не требуются скрипты нативной сборки. Большинство frontend-пакетов обходится без них.
- **MUST** — audit list скриптов установки: `npm ls --json | jq '.dependencies | .. | .scripts? | select(.)'` (или аналог). Любой незнакомый скрипт — red flag.
- **MUST NOT** — добавлять зависимость с неизвестным install-скриптом без понимания, что он делает.
- **SHOULD** — для dev-окружения использовать pnpm с `enable-pre-post-scripts=false` по умолчанию, включая явно только для известных пакетов.

### Пакеты, которым скрипты нужны легитимно

- Нативные модули: `sharp`, `better-sqlite3`, `node-sass` (deprecated — **SHOULD** мигрировать на `sass`), `bcrypt`.
- Husky (pre-commit hooks).
- Puppeteer / Playwright (загрузка браузера — **MAY** отключаться через env var и делаться отдельным шагом).

---

## 6. Автоматизация supply chain

### Dependabot / Renovate

- **SHOULD** — один из них настроен на репо, открывает PR на каждое обновление.
- **SHOULD** — конфигурация группирует обновления (все dev-deps в один PR; все patch-версии в один PR), иначе количество PR становится шумом.
- **MUST** — PR от бота проходит те же проверки CI, что и PR от человека. Auto-merge — **MAY** для patch-обновлений с зелёным CI; для minor / major — human review.

### Secret scanning

- **SHOULD** — GitHub Secret Scanning (нативная фича) включён.
- **MAY** — дополнительно Gitleaks / TruffleHog в pre-commit или CI. См. [`01-secrets.md`](01-secrets.md) раздел 4.

### SBOM (Software Bill of Materials)

- **MAY** — генерировать SBOM в формате CycloneDX или SPDX на каждую сборку. Требуется для проектов, продающихся в enterprise / госсектор.
- Командa: `npx @cyclonedx/cyclonedx-npm --output-format JSON > sbom.json`.

---

## 7. Deprecated-пакеты

Пакет помечен `deprecated` в npm, когда maintainer явно указал замену или поддержку закончена.

- **MUST NOT** — добавлять новый `deprecated`-пакет в `dependencies` / `devDependencies`.
- **MUST** — существующие `deprecated`-пакеты тречатся в тех-долге. Для security-критичных — миграция в приоритете.
- **SHOULD** — если deprecated-пакет используется transitive (не ваша прямая зависимость), открыть issue / PR в родительский пакет с просьбой мигрировать.

Проверка:

```bash
npm ls 2>&1 | grep -i deprecated
# or
npm outdated --long | grep -i deprecated
```

---

## 8. Мониторинг после релиза

Добавление пакета в `dependencies` — не одноразовое решение. Пакет **MUST** мониториться:

- Новые CVE — через dependabot / Snyk alerts / GitHub Security Advisories.
- Прекращение поддержки — через `npm outdated`, `is-this-package-alive` или аналоги.
- Смена maintainer'а на подозрительного — вручную, при audit раз в квартал для критичных пакетов.

### Периодический audit

- **SHOULD** — раз в квартал прогонять ревью прямых зависимостей:
  - все ли ещё используются (убрать dead deps);
  - актуальны ли версии;
  - нет ли deprecated;
  - не появилось ли лучших / меньших альтернатив.

---

## 9. Запрещённые паттерны

- **Добавление пакета без due diligence** (раздел 1) — **MUST NOT**.
- **Пакет с анонимным single-maintainer'ом для security-критичной задачи** (auth, crypto, sanitization) — **MUST NOT** без явного approve security-lead'а.
- **Install через URL / git / tarball в production dependencies** (`"pkg": "https://..."` или `"git+..."`) — **MUST NOT** без обоснования. Такие зависимости не audit'ятся публичными DB.
- **`"pkg": "*"` или `"latest"` в `package.json`** — **MUST NOT**. Всегда semver-диапазон или точная версия.
- **Ignore lockfile через `npm install` без `--save`** в production-сборке — **MUST NOT**. Используйте `npm ci`.
- **Замалчивание `high`/`critical` audit-результата через flag** (`npm audit --audit-level=critical && ...`) без exception-записи — **MUST NOT**.
- **Выполнение install-скриптов из untrusted-пакетов в CI с доступом к секретам** — **MUST NOT**. Используйте `--ignore-scripts` или разделяйте шаги.
- **`postinstall`-скрипт в самом проекте, выполняющий сетевые запросы или читающий секреты** — **MUST NOT** для публичных / shared-репо.
- **Коммит `node_modules/`** — **MUST NOT**. Для воспроизводимости используется lockfile, не коммит артефактов.
