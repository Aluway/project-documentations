---
version: 1.0.3
last-reviewed: 2026-04-17
status: active
---

# Architecture Decision Records

> Точка входа для агента: [`AGENTS.md`](AGENTS.md). Шаблон нового ADR: [`../_meta/templates/ADR.md`](../_meta/templates/ADR.md).

Этот каталог фиксирует **почему** документация и код в репозитории выглядят так, как выглядят. Каждый ADR — короткий документ: проблема, принятое решение, последствия, отвергнутые альтернативы.

---

## Зачем ADR

Код и документация отвечают на «что» и «как». ADR отвечают на «почему» — и делают это письменно, датированно, неизменяемо. Это даёт:

- **Контекст при правке.** Автор изменения видит, на чём было основано старое решение, и не предлагает ту же альтернативу, которая уже была отвергнута.
- **Устойчивость к сменам команды.** Решение переживает авторов.
- **Дешёвую замену**: если обстоятельства изменились — пишется новый ADR, старый маркируется `superseded`. Обсуждение не теряется.

---

## Формат

- Файлы: `NNNN-<kebab-name>.md`, где `NNNN` — четырёхзначный `id`.
- Структура — по шаблону [`../_meta/templates/ADR.md`](../_meta/templates/ADR.md): Status / Context / Decision / Consequences / Alternatives considered / References.
- Frontmatter-поля — [`../_meta/frontmatter.md`](../_meta/frontmatter.md) раздел 4.

`id` — append-only: номер занят навсегда, даже если ADR отклонён или заменён.

---

## Статусы

- `proposed` — обсуждается. Ещё не решение, только предложение.
- `accepted` — принято. Применяется. Документация и код **MUST** ему соответствовать.
- `rejected` — рассмотрено, отклонено. Остаётся как след: следующий автор не предложит то же самое.
- `superseded` — заменено новым ADR. Исторический артефакт.
- `deprecated` — неактуально, прямой замены нет (технология ушла, домен закрыт).

---

## Index

Список всех ADR в хронологическом порядке. При добавлении нового ADR — **MUST** добавить строку сюда.

| ID | Название | Status | Date |
|---|---|---|---|
| [0001](0001-agents-hub-navigation.md) | Двухуровневая навигация `AGENTS.md` как точка входа для агентов | accepted | 2026-04-17 |
| [0002](0002-universal-variants-split.md) | Разделение code-style на `universal/` + `variants/` через `PROFILE.md` | accepted | 2026-04-17 |
| [0003](0003-fsd-2.1-pages-first.md) | FSD 2.1 «pages-first» как архитектурная методология фронтенда | accepted | 2026-04-17 |
| [0004](0004-rfc-2119-keywords.md) | RFC 2119 keywords как единственный источник силы правила | accepted | 2026-04-17 |
| [0005](0005-frontmatter-for-chapters.md) | Обязательный YAML-frontmatter в каждой главе документации | accepted | 2026-04-17 |
| [0006](0006-language-policy.md) | Двуязычная политика — английский в коде, русский в главах документации | accepted | 2026-04-17 |
| [0007](0007-introduce-workflow-category.md) | Ввод категории `docs/workflow/` для git-процесса, PR и релизов | accepted | 2026-04-17 |
| [0008](0008-introduce-security-category.md) | Ввод категории `docs/security/` для secrets, input handling и dependencies | accepted | 2026-04-17 |
| [0009](0009-exclude-i18n-from-template.md) | Исключение i18n из scope'а template-репо | accepted | 2026-04-17 |
| [0010](0010-introduce-onboarding-category.md) | Ввод категории `docs/onboarding/` для fork-bootstrap и первых шагов | accepted | 2026-04-17 |

---

## Добавление нового ADR

1. Возьмите следующий `id` (последняя строка таблицы выше `+1`).
2. Скопируйте шаблон из [`../_meta/templates/ADR.md`](../_meta/templates/ADR.md).
3. Заполните frontmatter, начните со `status: proposed`.
4. Опишите Context, Decision, Consequences, Alternatives considered.
5. Добавьте строку в таблицу Index выше.
6. После согласования — смените `status: accepted`, зафиксируйте `date`.
7. Обновите главы, реализующие решение, в том же PR.

Полный протокол — [`AGENTS.md`](AGENTS.md) секция Working Protocol.
