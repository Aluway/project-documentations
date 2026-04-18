---
version: 1.1.0
last-reviewed: 2026-04-17
status: active
---

# AGENTS.md — Decisions (ADR)

> Категорийная точка входа для ИИ-агентов.
> Эта категория содержит Architecture Decision Records — фиксированные решения, объясняющие, **почему** документация и код выглядят так, как выглядят.

---

## Scope

- Фиксация принятых архитектурных, процессных и документационных решений.
- История отвергнутых альтернатив и причин отклонения.
- Сохранение контекста, в котором было принято решение (проблема, ограничения, trade-off'ы).

**Не покрывает** само содержание правил (это в [`../architecture/`](../architecture/AGENTS.md), [`../code-style/`](../code-style/AGENTS.md)). ADR ссылается на главу, реализующую решение.

---

## When to Read

| Ситуация | Что открывать |
|---|---|
| Первый заход в категорию | [`README.md`](README.md) — индекс всех ADR. |
| Правка правила, похожая на смену решения | `grep` по ADR с тем же доменом — если есть accepted ADR, правило **MUST** оставаться в его рамках. |
| Введение новой категории / нового слоя / нового глобального правила | [`../_meta/templates/ADR.md`](../_meta/templates/ADR.md) — создание нового ADR. |
| Замена устаревшего решения | Новый ADR со `supersedes: <id>`. Старый ADR **MUST** быть обновлён: `superseded-by: <новый id>`, `status: superseded`. |

---

## Working Protocol

### Создание нового ADR

1. Определите `id` — это `последний существующий id + 1` (смотрите [`README.md`](README.md)).
2. Создайте файл `NNNN-<kebab-name>.md` по шаблону [`../_meta/templates/ADR.md`](../_meta/templates/ADR.md).
3. Заполните frontmatter (включая `status: proposed`), Context, Decision, Consequences, Alternatives considered.
4. Добавьте строку в [`README.md`](README.md) — секция «Index».
5. Откройте PR с пометкой «ADR: proposed».
6. После согласования владельцем(ами) категорий — смените `status` на `accepted`, установите `date`.
7. Обновите главы, которые реализуют решение, — **в том же PR** или в явно связанном следующем.

### Замена существующего ADR

1. Новый ADR описывает новое решение. `supersedes: <id старого>`.
2. В старом ADR — `superseded-by: <id нового>`, `status: superseded`. Тело старого ADR **MUST NOT** переписываться — остаётся как есть.
3. Обе правки — в одном PR.

### Отклонение предложенного ADR

1. `status: proposed` → `status: rejected`.
2. В теле ADR добавляется секция «Reason for rejection» — одно-два предложения.
3. Файл остаётся в репо (append-only принцип).

---

## Hard Invariants

- Каждое структурное решение, меняющее `_meta/*`, `AGENTS.md` категорий, состав `variants/*` или схему frontmatter, **MUST** фиксироваться ADR.
- `id` ADR **MUST NOT** переиспользоваться. Номер занят навсегда, даже если ADR отклонён.
- ADR со статусом `accepted` **MUST NOT** правиться в части Context / Decision / Alternatives в их **смысловой** части. Только `status`, `last-reviewed`, `superseded-by` — меняются свободно.
- **Исключение**: чисто типографические правки (нормализация символов, опечатки, пробелы, переформатирование markdown) **MAY** применяться к ADR без создания superseding-ADR. Такие правки **MUST NOT** менять смысл решения, обоснование или список альтернатив. `last-reviewed` **MUST** быть обновлён; `version` **MAY** не подниматься для pure-typography batch'а.
- При замене решения новый ADR **MUST** указать `supersedes`, старый **MUST** получить `superseded-by` в том же PR.
- Поле `status` **MUST** принимать только значения: `proposed`, `accepted`, `rejected`, `superseded`, `deprecated`.

---

## Pre-Flight Checklist

Перед коммитом нового или изменённого ADR:

- [ ] Frontmatter заполнен по [`../_meta/frontmatter.md`](../_meta/frontmatter.md) раздел 4.
- [ ] `id` уникален, соответствует префиксу имени файла.
- [ ] `status` — одно из разрешённых значений.
- [ ] Для `accepted` ADR — заполнено поле `date`.
- [ ] Для `superseded` ADR — заполнено `superseded-by` и соответствующий новый ADR имеет `supersedes`.
- [ ] Секции Context, Decision, Consequences, Alternatives considered заполнены.
- [ ] В Alternatives considered — хотя бы одна отвергнутая альтернатива с причиной.
- [ ] Строка добавлена/обновлена в [`README.md`](README.md).
- [ ] Главы, реализующие решение, либо уже соответствуют ему, либо обновлены в том же PR.

---

## If Chapters Disagree with This File

ADR со статусом `accepted` — **авторитетны поверх** любых глав документации. При конфликте между ADR и главой — глава **MUST** быть обновлена, ADR — остаётся. Этот `AGENTS.md` — навигация; он уступает и ADR, и главам.
