---
version: 1.0.0
last-reviewed: 2026-04-17
status: active
---

# Frontmatter — спецификация метаданных главы

> Оглавление: [`AGENTS.md`](AGENTS.md).

Каждая глава документации **MUST** начинаться с YAML-frontmatter — набора машино-читаемых метаданных. Они позволяют агенту (и CI-линтерам) оценивать актуальность, совместимость и статус главы без чтения всего текста.

---

## 1. Общая форма

```yaml
---
version: <semver>
last-reviewed: <YYYY-MM-DD>
status: active | draft | deprecated
---
```

Frontmatter идёт **первыми строками файла**, до `#`-заголовка. Разделители — `---` до и после.

---

## 2. Обязательные поля

### `version`

- Формат — [semver](https://semver.org/): `MAJOR.MINOR.PATCH`.
- **MAJOR** (`1.0.0` → `2.0.0`) — изменение, меняющее обязательное правило (например, `MUST` → `SHOULD` или наоборот; перенос правила в другую главу).
- **MINOR** (`1.0.0` → `1.1.0`) — добавление нового правила или нового раздела.
- **PATCH** (`1.0.0` → `1.0.1`) — правка формулировки, примера, опечатки.

Начальная версия новой главы — `1.0.0`.

### `last-reviewed`

- Формат — `YYYY-MM-DD` (ISO 8601).
- **MUST** обновляться при любой правке содержимого. Даже если это опечатка — дата меняется.
- **MUST** обновляться при плановом ревью (см. [`governance.md`](governance.md)), даже если содержимое не менялось — это сигнал «главу прочитали, она актуальна».

Агент, встретив главу с `last-reviewed` старше 12 месяцев, **SHOULD** пометить в выводе: «глава давно не ревьюилась, применяю с повышенной осторожностью».

### `status`

Одно из значений:

- `active` — глава применяется. Значение по умолчанию.
- `draft` — глава в работе, правила не окончательны. Агент **MAY** применять, но **MUST** пометить вывод как требующий ревью.
- `deprecated` — глава устарела, её правила **MUST NOT** применяться. В теле главы обязательна секция «Superseded by» со ссылкой на замену.

---

## 3. Дополнительные поля для variant-глав

Главы в `docs/code-style/variants/` (и будущие variant-каталоги других категорий) **MUST** содержать секцию `requires` — условия активации.

```yaml
---
version: 1.0.0
last-reviewed: 2026-04-17
status: active
requires:
  profile:
    server-state: tanstack-query
  min:
    react: "18.0"
    typescript: "5.0"
---
```

### `requires.profile`

- Ключ-значение, сверяемые с [`../code-style/PROFILE.md`](../code-style/PROFILE.md).
- Ключ — имя поля profile в kebab-case (например, `server-state`, `forms-approach`, `primary-styling`).
- Значение — ожидаемое содержимое поля profile (например, `tanstack-query`, `react-hook-form`, `tailwind-4`).
- Глава применяется, **только если все** пары `profile` совпадают.

### `requires.min`

- Минимальные версии зависимостей.
- Значения — строки в semver-нотации; сравниваются как semver-ranges.
- Ключи — имена зависимостей (react, typescript, node, next, vite и т.п.).

Если версия в `PROFILE.md` ниже `requires.min` — глава **MUST NOT** применяться к этому коду.

---

## 4. Дополнительные поля для ADR

Главы в `docs/decisions/` дополняются полями, характеризующими статус решения.

```yaml
---
version: 1.0.0
last-reviewed: 2026-04-17
status: accepted
id: 0003
date: 2026-04-17
supersedes: null
superseded-by: null
---
```

- `status`: `proposed` | `accepted` | `rejected` | `superseded` | `deprecated`.
- `id` — четырёхзначный номер, соответствующий имени файла (`0003-...md`).
- `date` — дата принятия (не последней правки — та в `last-reviewed`).
- `supersedes` — ID ADR, который заменяется этим (или `null`).
- `superseded-by` — ID ADR, который заменяет этот (или `null`).

---

## 5. Необязательные, но полезные поля

Для любой главы **MAY** добавляться:

- `owner` — отвечающая команда или роль (например, `frontend-platform`). Если нет владельца — опустить.
- `tags` — список меток для поиска (`[typescript, types, strict]`).
- `depends-on` — список относительных путей к главам, знание которых предполагается (например, `- ../universal/01-typescript.md`).

**MUST NOT** добавлять поля, не описанные в этом файле, без обновления [`governance.md`](governance.md).

---

## 6. Примеры

### Universal-глава

```yaml
---
version: 1.3.0
last-reviewed: 2026-04-17
status: active
---
```

### Variant-глава

```yaml
---
version: 1.0.0
last-reviewed: 2026-04-17
status: active
requires:
  profile:
    server-state: tanstack-query
  min:
    react: "18.0"
---
```

### Deprecated-глава

```yaml
---
version: 2.0.0
last-reviewed: 2026-04-17
status: deprecated
superseded-by: 0007
---
```

### ADR

```yaml
---
version: 1.0.0
last-reviewed: 2026-04-17
status: accepted
id: 0003
date: 2026-04-17
supersedes: null
superseded-by: null
---
```

---

## 7. Валидация

Эти требования **SHOULD** проверяться CI-линтером (когда появится):

- Frontmatter присутствует и парсится как валидный YAML.
- Обязательные поля — `version`, `last-reviewed`, `status` — заполнены.
- `version` — валидный semver.
- `last-reviewed` — валидная ISO-дата, не в будущем.
- `status` — одно из разрешённых значений.
- Для variant-глав — `requires.profile` ссылается на существующее поле в [`../code-style/PROFILE.md`](../code-style/PROFILE.md).
- Для ADR — `id` совпадает с префиксом имени файла; `supersedes` / `superseded-by` указывают на существующие ADR.

До появления автоматизации ответственность — на авторе правки и ревьюере.
