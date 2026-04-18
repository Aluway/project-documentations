---
version: 1.0.0
last-reviewed: 2026-04-17
status: active
---

# Usage Guide — как пользоваться этой документацией

> Оглавление: [`AGENTS.md`](AGENTS.md).

Единый task-to-docs router для всех аудиторий. Если у вас есть задача — найдите её здесь и пройдите по указанным ссылкам. Если задачи нет в таблицах, используйте раздел 3 «Поиск конкретного правила».

---

## 1. Аудитории и маршруты

Выберите строку, которая описывает вас **сейчас**. Каждая строка — короткий путь «что открыть, в каком порядке».

| Роль | Что открыть (в порядке) | Глубина чтения |
|---|---|---|
| **ИИ-агент, первая задача в неизвестном репо** | 1. [`../../AGENTS.md`](../../AGENTS.md) (корневой) → 2. категорийный `AGENTS.md` соответствующей категории → 3. конкретная глава | Читается всё указанное |
| **Новый разработчик, присоединяющийся к существующему проекту** | 1. [`../../README.md`](../../README.md) (обзор) → 2. [`../../AGENTS.md`](../../AGENTS.md) Document Map → 3. «Minimum viable reading» (раздел 5 ниже) | Бегло 1–2, вдумчиво 3 |
| **Новый разработчик, форкнувший template** | 1. [`../onboarding/01-first-fork.md`](../onboarding/01-first-fork.md) (пошагово) → 2. [`../onboarding/02-common-branches.md`](../onboarding/02-common-branches.md) если отличается от дефолта | Последовательно, не пропуская шаги |
| **Daily developer, уже знакомый с проектом** | Таблица «Task-to-chapter router» ниже — прямой переход к главе | Только главу, относящуюся к задаче |
| **Ревьюер кода на PR** | 1. [`../workflow/03-code-review.md`](../workflow/03-code-review.md) раздел 3 (чек-лист ревьюера) → 2. соответствующие Hard Invariants затронутых категорий | Чек-лист целиком, Hard Invariants — по релевантности |
| **Автор / правщик документации** | 1. [`AGENTS.md`](AGENTS.md) этой категории → 2. [`style-guide.md`](style-guide.md) и [`frontmatter.md`](frontmatter.md) → 3. [`templates/`](templates/) | Целиком, перед первой правкой |
| **Maintainer template-репо** | 1. [`governance.md`](governance.md) → 2. [`agent-smoke-tests.md`](agent-smoke-tests.md) → 3. [`../decisions/README.md`](../decisions/README.md) Index | Периодически по каденсу |

Если ни одна строка не описывает вас точно — выберите ближайшую; таблица ниже (раздел 2) покрывает большинство задач напрямую.

---

## 2. Task-to-chapter router

Типовые задачи и главы, которые нужны для их решения. Порядок ссылок = порядок чтения.

### Работа с кодом

| Хочу… | Читать |
|---|---|
| Добавить новую страницу | [`../architecture/05-pages-first.md`](../architecture/05-pages-first.md) → [`../architecture/02-slices-segments.md`](../architecture/02-slices-segments.md) → [`../architecture/03-public-api.md`](../architecture/03-public-api.md) → [`../architecture/09-routing.md`](../architecture/09-routing.md) → [`../architecture/07-checklists.md`](../architecture/07-checklists.md) раздел A |
| Добавить новый виджет | [`../architecture/05-pages-first.md`](../architecture/05-pages-first.md) (проверить оправданность) → [`../architecture/07-checklists.md`](../architecture/07-checklists.md) раздел B |
| Добавить новую фичу | [`../architecture/05-pages-first.md`](../architecture/05-pages-first.md) → [`../architecture/07-checklists.md`](../architecture/07-checklists.md) раздел C |
| Добавить новую сущность | [`../architecture/07-checklists.md`](../architecture/07-checklists.md) раздел D → [`../architecture/04-cross-imports.md`](../architecture/04-cross-imports.md) (если будет `@x`) |
| Добавить утилиту в shared | [`../architecture/07-checklists.md`](../architecture/07-checklists.md) раздел E |
| Типизировать данные с API | [`../code-style/universal/01-typescript.md`](../code-style/universal/01-typescript.md) разделы 3, 4 → [`../security/02-input-handling.md`](../security/02-input-handling.md) раздел 1 |
| Написать форму | [`../code-style/universal/05-forms-principles.md`](../code-style/universal/05-forms-principles.md) → активный `variants/forms-*` из `PROFILE.md` → [`../code-style/universal/07-accessibility.md`](../code-style/universal/07-accessibility.md) раздел 5 |
| Выбрать, где жить состоянию | [`../code-style/universal/04-state-model.md`](../code-style/universal/04-state-model.md) решающее дерево → активный `variants/state-*` |
| Стилизовать компонент | [`../code-style/universal/06-styling-principles.md`](../code-style/universal/06-styling-principles.md) → активный `variants/styling-*` |
| Написать тест | [`../code-style/universal/08-testing-principles.md`](../code-style/universal/08-testing-principles.md) → активный `variants/testing-*` |
| Рефакторинг с переносом кода между слоями | [`../architecture/05-pages-first.md`](../architecture/05-pages-first.md) → [`../architecture/07-checklists.md`](../architecture/07-checklists.md) раздел F |
| Связать `entities/A` с `entities/B` | [`../architecture/04-cross-imports.md`](../architecture/04-cross-imports.md) → [`../architecture/07-checklists.md`](../architecture/07-checklists.md) раздел G |
| Добавить interactive UI | [`../code-style/universal/02-components.md`](../code-style/universal/02-components.md) → [`../code-style/universal/07-accessibility.md`](../code-style/universal/07-accessibility.md) |
| Оптимизировать производительность | [`../code-style/universal/09-performance-principles.md`](../code-style/universal/09-performance-principles.md) → активный `variants/react-*` |

### Git / PR / релизы

| Хочу… | Читать |
|---|---|
| Создать ветку | [`../workflow/01-git.md`](../workflow/01-git.md) раздел 1 |
| Написать коммит | [`../workflow/01-git.md`](../workflow/01-git.md) раздел 2 |
| Открыть PR | [`../workflow/02-pull-requests.md`](../workflow/02-pull-requests.md) |
| Отревьюить PR | [`../workflow/03-code-review.md`](../workflow/03-code-review.md) |
| Получить ревью на свой PR | [`../workflow/03-code-review.md`](../workflow/03-code-review.md) разделы 4–6 (форма feedback, критерии approve, разногласия) |
| Разрулить конфликт в git | [`../workflow/01-git.md`](../workflow/01-git.md) раздел 4 (публичная vs локальная история) |
| Сделать релиз | [`../workflow/04-releases.md`](../workflow/04-releases.md) разделы 1–3 |
| Hotfix в продакшене | [`../workflow/04-releases.md`](../workflow/04-releases.md) раздел 5 |
| Откатить релиз | [`../workflow/04-releases.md`](../workflow/04-releases.md) раздел 6 |

### Security

| Хочу… | Читать |
|---|---|
| Добавить env-переменную | [`../security/01-secrets.md`](../security/01-secrets.md) разделы 3, 4 |
| Утёк секрет в коммит | [`../security/01-secrets.md`](../security/01-secrets.md) раздел 5 (процедура при утечке) — немедленно |
| Рендерить user-generated content | [`../security/02-input-handling.md`](../security/02-input-handling.md) раздел 2 |
| Построить URL из данных | [`../security/02-input-handling.md`](../security/02-input-handling.md) раздел 4 |
| Настроить CSP | [`../security/02-input-handling.md`](../security/02-input-handling.md) раздел 6 |
| Добавить npm-пакет | [`../security/03-dependencies.md`](../security/03-dependencies.md) раздел 1 (due diligence checklist) |
| Разобраться с `npm audit` | [`../security/03-dependencies.md`](../security/03-dependencies.md) раздел 4 |

### Документация и решения

| Хочу… | Читать |
|---|---|
| Предложить архитектурное изменение | [`templates/ADR.md`](templates/ADR.md) → [`../decisions/AGENTS.md`](../decisions/AGENTS.md) Working Protocol |
| Заменить существующее решение | [`../decisions/AGENTS.md`](../decisions/AGENTS.md) «Замена существующего ADR» |
| Добавить новую категорию документации | [`governance.md`](governance.md) раздел 4 → [`templates/AGENTS-category.md`](templates/AGENTS-category.md) |
| Добавить variant-главу | [`templates/chapter-variant.md`](templates/chapter-variant.md) → обновить [`../code-style/PROFILE.md`](../code-style/PROFILE.md) |
| Править существующую главу | [`style-guide.md`](style-guide.md) → [`frontmatter.md`](frontmatter.md) (bump `version` и `last-reviewed`) |
| Добавить проверку в линтер | [`ci-linter.md`](ci-linter.md) раздел 6 |
| Провести квартальное ревью документации | [`governance.md`](governance.md) раздел 2 → [`agent-smoke-tests.md`](agent-smoke-tests.md) |

### Форк и адопция

| Хочу… | Читать |
|---|---|
| Форкнуть template в новый проект | [`../onboarding/01-first-fork.md`](../onboarding/01-first-fork.md) |
| Форкнуть в нестандартный проект (монорепо, SSR, mobile, solo) | [`../onboarding/02-common-branches.md`](../onboarding/02-common-branches.md) + [`../onboarding/01-first-fork.md`](../onboarding/01-first-fork.md) |
| Заполнить `PROFILE.md` | [`../onboarding/01-first-fork.md`](../onboarding/01-first-fork.md) раздел 2 |
| Решить конфликт в Compatibility Matrix | [`../code-style/PROFILE.md`](../code-style/PROFILE.md) «Compatibility Matrix» |

---

## 3. Поиск конкретного правила

Если в таблицах выше вашей задачи нет — ищите правило напрямую.

### Найти все `MUST` правила по теме

```bash
grep -rn "\*\*MUST\*\*\|\*\*MUST NOT\*\*" docs/ | grep -i "<ключевое слово>"
```

Пример: `... | grep -i "index.ts"` — все MUST-правила про `index.ts`.

### Найти все антипаттерны

Секции «Антипаттерны» / «Запрещённые паттерны» в конце каждой главы:

```bash
grep -rn "^## .*[АаЗз]нтипаттерн\|^## .*[Зз]апрещённ" docs/
```

### Найти Hard Invariants всех категорий разом

```bash
for f in docs/*/AGENTS.md docs/_meta/AGENTS.md; do
  echo "=== $f ==="
  awk '/^## Hard Invariants/,/^## /' "$f" | head -20
done
```

### Найти, в какой главе прописано конкретное правило

Если помните фрагмент формулировки (`"Public API"`, `"force-push"`, `"dangerouslySetInnerHTML"`) — grep по `docs/`:

```bash
grep -rn "dangerouslySetInnerHTML" docs/
```

Первое попадание в **главе** (не в `AGENTS.md` и не в `README.md`) — авторитетный источник правила.

### Найти ADR по теме

[`../decisions/README.md`](../decisions/README.md) Index — все ADR с одной строкой описания. Ctrl+F по ключевому слову.

### Найти, кто owner категории

1. [`../../.github/CODEOWNERS`](../../.github/CODEOWNERS) — primary source в форкнутом проекте.
2. [`governance.md`](governance.md) раздел 1 — модель владения.
3. Frontmatter `owner:` в категорийном `AGENTS.md` — резервный источник.

---

## 4. FAQ

**В какой категории правило про X?**
Сначала проверьте «Task-to-chapter router» (раздел 2). Если задачи там нет — раздел 3 «Поиск конкретного правила». Если правила нет — возможно, пробел в документации; откройте issue.

**Правило в одной главе противоречит правилу в другой.**
Сначала проверьте свежесть `accepted`-ADR в [`../decisions/`](../decisions/AGENTS.md) по той же теме — он переопределяет. Если ADR нет — consult категорийный `AGENTS.md`: [`governance.md`](governance.md) раздел 5 описывает приоритет (ADR → глава → категорийный AGENTS → корневой AGENTS → `_meta`).

**Как предложить новое правило?**
Для нетривиальных изменений (universal-глава, новая категория, смена схемы) — ADR по шаблону [`templates/ADR.md`](templates/ADR.md). Для мелких правок (формулировка, новый пример) — прямой PR в соответствующую главу.

**Где найти «почему мы так решили»?**
[`../decisions/`](../decisions/AGENTS.md) — ADR-категория содержит Context и Alternatives considered для всех ключевых структурных решений.

**Как работать в автономном режиме, если `PROFILE.md` не заполнен?**
[`../code-style/PROFILE.md`](../code-style/PROFILE.md) «Fallback-стратегия для незаполненных полей» — применять universal-минимум + consensus-дефолт 2026, помечать вывод как требующий ревью.

**Когда нужен ADR, а когда хватает обычного PR?**
[`governance.md`](governance.md) раздел 4: структурные изменения (категория / variant / схема frontmatter) — ADR обязателен. Правки формулировок, новые примеры, исправления — обычный PR с bump'ом `version`.

**Документация устарела — что делать?**
PR с обновлением содержимого + bump соответствующего уровня по semver (PATCH для формулировки, MINOR для добавления правила, MAJOR для breaking). [`frontmatter.md`](frontmatter.md) раздел 2.

**В форке нужно правило, которого нет в template.**
Добавьте главу / категорию через процедуру [`governance.md`](governance.md) раздел 4. Если это общее правило, которое пригодится другим форкам — подайте upstream-PR в template-репо.

---

## 5. Minimum viable reading

Минимальный набор для повседневной работы (80% задач):

1. [`../../AGENTS.md`](../../AGENTS.md) — корневой hub, Document Map, Global Pre-Flight. **5 минут.**
2. [`../workflow/AGENTS.md`](../workflow/AGENTS.md) — git / PR / review / releases. Применяется в каждом PR. **10 минут.**
3. [`../architecture/AGENTS.md`](../architecture/AGENTS.md) + [`../architecture/05-pages-first.md`](../architecture/05-pages-first.md) — дерево решений «куда класть код». **15 минут.**
4. [`../code-style/AGENTS.md`](../code-style/AGENTS.md) + [`../code-style/PROFILE.md`](../code-style/PROFILE.md) — профиль стека, какие variants активны. **10 минут.**
5. [`../security/AGENTS.md`](../security/AGENTS.md) — 10 Hard Invariants поперёк secrets / input / deps. **5 минут.**

Итого — **~45 минут** на общий контур. Детали читаются под конкретную задачу через раздел 2 этой главы.

Всё остальное (глубина глав, ADR-мотивы, `_meta/`, `onboarding/`) читается по мере необходимости, не разом.

---

## 6. Когда эта глава устарела

Эта глава — мета-навигатор. Устаревает, когда:

- Добавлена новая категория (обновить раздел 2 под её задачи).
- Переименована / удалена глава (обновить ссылки в таблицах).
- Изменилась модель аудиторий (например, template стал использоваться не только в React-проектах).

`last-reviewed` этой главы **SHOULD** обновляться вместе с любым изменением структуры категорий — иначе она дрейфует быстрее большинства других _meta-файлов.
