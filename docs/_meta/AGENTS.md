---
version: 1.2.0
last-reviewed: 2026-04-17
status: active
---

# AGENTS.md — Meta (документация о документации)

> Категорийная точка входа для ИИ-агентов.
> Эта категория описывает, **как устроена** документация в репозитории: шаблоны глав, стиль письма, governance, frontmatter. Главы здесь — на русском.

---

## Scope

Эта категория покрывает инфраструктуру документации:

- Шаблоны новых файлов (category `AGENTS.md`, universal-глава, variant-глава, ADR).
- Правила стиля документации (RFC 2119, длина, ссылки, форматирование).
- Спецификацию frontmatter для каждой главы.
- Governance: кто владеет, когда ревьюит, как депрецируется глава.

**Не покрывает** содержательные правила кода — это юрисдикция [`docs/architecture/`](../architecture/AGENTS.md) и [`docs/code-style/`](../code-style/AGENTS.md).

---

## When to Read

| Файл | Когда открывать |
|---|---|
| [`usage-guide.md`](usage-guide.md) | Ищете, куда идти под конкретную задачу. Task-to-chapter router + поиск правил + FAQ. Подходит любой аудитории — от нового разработчика до ревьюера. |
| [`style-guide.md`](style-guide.md) | Пишете или редактируете любую главу — проверить стиль, keywords, ссылки. |
| [`frontmatter.md`](frontmatter.md) | Создаёте новую главу или обновляете метаданные (version, status, requires). |
| [`governance.md`](governance.md) | Планируете изменение в `universal/*`, депрецируете главу, не знаете, кто owner. |
| [`ci-linter.md`](ci-linter.md) | Запускаете линтер, добавляете новую проверку, интегрируете в CI. |
| [`agent-smoke-tests.md`](agent-smoke-tests.md) | Проводите квартальный прогон smoke-tests или добавляете новый тест после структурных изменений. |
| [`templates/AGENTS-category.md`](templates/AGENTS-category.md) | Создаёте новую категорию в `docs/<new-category>/`. |
| [`templates/chapter-universal.md`](templates/chapter-universal.md) | Пишете новую universal-главу (стек-агностичную). |
| [`templates/chapter-variant.md`](templates/chapter-variant.md) | Пишете новую variant-главу (условно активную). |
| [`templates/ADR.md`](templates/ADR.md) | Фиксируете архитектурное решение в [`docs/decisions/`](../decisions/AGENTS.md). |

---

## Working Protocol

Перед любой правкой документации:

1. **Определите тип изменения**:
   - новая категория → [`templates/AGENTS-category.md`](templates/AGENTS-category.md);
   - новая глава внутри существующей категории → соответствующий шаблон;
   - правка существующей главы → [`style-guide.md`](style-guide.md) + bump `version` в её frontmatter;
   - решение, влияющее на структуру → ADR в [`docs/decisions/`](../decisions/AGENTS.md).
2. **Прочитайте [`style-guide.md`](style-guide.md)** — RFC 2119, ссылки, длина, запреты.
3. **Проверьте [`frontmatter.md`](frontmatter.md)** — заполните обязательные поля, обновите `last-reviewed`.
4. **Сверьтесь с [`governance.md`](governance.md)** — нужно ли согласование owner'а, затрагивает ли `universal/*`.
5. **Pre-Flight** ниже — перед коммитом.

---

## Hard Invariants

- Каждая глава **MUST** иметь frontmatter с полями `version`, `last-reviewed`, `status`. Правила — [`frontmatter.md`](frontmatter.md).
- Каждая категория **MUST** иметь свой `AGENTS.md` с секциями: Scope, When to Read, Working Protocol, Hard Invariants, Pre-Flight Checklist, «If Chapters Disagree».
- Все правила **MUST** использовать RFC 2119 keywords заглавными буквами: `MUST`, `MUST NOT`, `SHOULD`, `SHOULD NOT`, `MAY`.
- Авторитет — в главах. `AGENTS.md` — навигация и короткая выжимка инвариантов; **MUST NOT** содержать правил, которых нет в главах.
- Одно правило живёт в **одном** месте. Остальные упоминания — ссылкой (DRY). Дублирование текста правил — **MUST NOT**.
- Структурные решения (новая категория, переименование слоя, смена шаблона) **MUST** сопровождаться ADR в [`docs/decisions/`](../decisions/AGENTS.md).

---

## Pre-Flight Checklist

- [ ] Frontmatter главы заполнен и валиден по [`frontmatter.md`](frontmatter.md).
- [ ] `version` поднят по semver (MAJOR — breaking правила; MINOR — новое правило; PATCH — формулировки/примеры).
- [ ] `last-reviewed` обновлён до сегодняшней даты.
- [ ] Keywords RFC 2119 — заглавными; не использованы слова-паразиты («желательно», «по возможности», «стоит»).
- [ ] Ссылки на другие главы — через markdown, не обычным текстом. Битых ссылок нет.
- [ ] Если правка затрагивает `universal/*` — получено согласование согласно [`governance.md`](governance.md).
- [ ] Если введена новая категория / новый variant / удалена глава — открыт ADR в [`docs/decisions/`](../decisions/AGENTS.md).
- [ ] В `AGENTS.md` категории обновлены секции When to Read / Hard Invariants, если главы добавились/удалились.
- [ ] Линтер `node scripts/lint-docs.mjs` — зелёный (см. [`ci-linter.md`](ci-linter.md)).
- [ ] При структурных изменениях (новая категория / смена шаблона / переименование слоя) — проведён прогон [`agent-smoke-tests.md`](agent-smoke-tests.md), регрессий нет.

---

## If Chapters Disagree with This File

Главы (`style-guide.md`, `frontmatter.md`, `governance.md`) — **авторитетны**. Этот файл — навигация. Конфликт → следуйте главе, флагните несоответствие в выводе.
