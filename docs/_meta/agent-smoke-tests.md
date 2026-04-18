---
version: 1.0.1
last-reviewed: 2026-04-17
status: active
---

# Agent Smoke Tests

> Оглавление: [`AGENTS.md`](AGENTS.md).

Набор тестовых задач для проверки, что документация **работает** для ИИ-агента: агент может решить задачу, открыв правильные главы в правильном порядке, не заблудившись в навигации и не нарушив инвариантов. Если агент проваливает тест — это **дефект документации**, не дефект агента: значит, навигация неоднозначна, инвариант не зеркалирован, или пример двусмыслен.

---

## 1. Что это

Smoke-tests — 8 тестовых задач, покрывающих 5 активных категорий (`architecture`, `code-style`, `workflow`, `security`, `decisions`). Каждый тест описывает:

- **Задача** — точная формулировка, как её сформулировал бы разработчик.
- **Ожидаемый обход документации** — какие файлы агент **MUST** открыть и в каком порядке.
- **Применяемые Hard Invariants** — инварианты, которые агент **MUST** применить или упомянуть.
- **Критерии прохождения** — что должно быть в финальном выводе.
- **Частые провалы** — паттерны, на которых агент путается; если видите такой паттерн — документация требует правки.

Это **не** функциональные тесты (они не запускают агента автоматически). Это **контракт ожидаемого поведения**, против которого человек (или скриптовый прогон через LLM-runner в будущем) сверяется.

---

## 2. Когда прогонять

- **Квартально** — плановый прогон всех тестов; провалы фиксируются как issues на документацию.
- **После структурных изменений** — добавление новой категории, смена frontmatter-схемы, переименование слоя, смена шаблона `AGENTS.md`. Прогон **MUST** пройти без регрессий до мёржа ADR.
- **При добавлении нового теста** — если появляется новая категория или новый частый use case, добавляется новый тест с соответствующим обходом.

Плановый прогон **SHOULD** зафиксироваться в `last-reviewed` этого файла. Провалы **MUST** завести issue с severity по шкале `[blocker]`/`[issue]`/`[nit]` из [`../workflow/03-code-review.md`](../workflow/03-code-review.md) раздел 4.

---

## 3. Формат теста

Каждый тест — подраздел `## ST-NN — <Краткое описание>`. `ST` = Smoke Test. Нумерация — append-only; номер однажды выданного теста **MUST NOT** переиспользоваться, даже если тест удалён.

---

## 4. Критерии прохождения теста

Тест считается пройденным, если:

- [ ] Агент открыл **все** файлы из «Ожидаемый обход документации» в указанном порядке (порядок важен — он отражает pages-first / pre-flight-first).
- [ ] Агент **явно** применил или упомянул все инварианты из «Применяемые Hard Invariants».
- [ ] Финальный вывод удовлетворяет всем пунктам «Критерии прохождения».
- [ ] Не проявились паттерны из «Частые провалы».

Частичное прохождение (4 из 5 инвариантов) — **issue**, не **blocker**. Полный провал (агент ушёл в неверную категорию) — **blocker**.

---

## Тесты

---

### ST-01 — Разместить новую страницу

**Задача:**

> Добавь страницу профиля пользователя по пути `/profile`. На странице — аватар, имя, email, кнопка «Выйти».

**Ожидаемый обход документации:**

1. [`../architecture/AGENTS.md`](../architecture/AGENTS.md) — ориентация.
2. [`../architecture/05-pages-first.md`](../architecture/05-pages-first.md) — дерево решений: это страница → слайс в `pages/profile/`.
3. [`../architecture/02-slices-segments.md`](../architecture/02-slices-segments.md) — именование (kebab-case), стандартные сегменты.
4. [`../architecture/03-public-api.md`](../architecture/03-public-api.md) — контракт `index.ts`.
5. [`../architecture/09-routing.md`](../architecture/09-routing.md) — где живёт определение маршрута `/profile`, как страница экспортирует его для `app/`.
6. [`../architecture/07-checklists.md`](../architecture/07-checklists.md) раздел A — чек-лист новой страницы.
7. [`../code-style/universal/02-components.md`](../code-style/universal/02-components.md) — function-components, named-export.

**Применяемые Hard Invariants:**

- Слайс лежит в `pages/profile/` (kebab-case).
- `index.ts` с явными именованными экспортами; **MUST NOT** — `export *`.
- Сегменты из стандартного набора (`ui`, `model`, `api`, `lib`, `config`); **MUST NOT** — `components`, `hooks`, `types`.
- Направление импортов: `pages → widgets → features → entities → shared`; **MUST NOT** — импорт из соседнего `pages/*`.
- pages-first: UI блоки остаются в слайсе страницы, пока не появилось ≥ 2 потребителей.
- Компоненты — function-components с named-export; **MUST NOT** — `React.FC`, `export default`.

**Критерии прохождения:**

- Код размещён в `pages/profile/`, **не** в `features/` и **не** в `entities/`.
- Пустых «на будущее» `features/logout/`, `entities/profile/` — не создано.
- В ответе явно упомянут pages-first принцип и чек-лист A.

**Частые провалы (дефекты документации):**

- Агент создаёт `features/logout/` и `entities/profile/` с одним компонентом — нарушение pages-first. Если это стабильно воспроизводится, значит 05-pages-first недостаточно настойчив.
- Агент использует `pages/profile/components/ProfileAvatar.tsx` — essence-сегмент запрещён, но агент его выбирает — значит 02-slices-segments нужно усилить.
- Агент кладёт `index.ts` с `export * from "./ui"` — значит 03-public-api не заметен.

---

### ST-02 — Добавить кросс-ссылку между сущностями

**Задача:**

> В `entities/post/` нужен тип `User["id"]` из `entities/user/`. Как организовать?

**Ожидаемый обход документации:**

1. [`../architecture/AGENTS.md`](../architecture/AGENTS.md).
2. [`../architecture/04-cross-imports.md`](../architecture/04-cross-imports.md) — `@x`-фасады.
3. [`../architecture/07-checklists.md`](../architecture/07-checklists.md) раздел G — чек-лист кросс-ссылки.

**Применяемые Hard Invariants:**

- Слайсы одного слоя **MUST NOT** импортировать друг друга; единственное исключение — `entities/*` через `@x`-фасад.
- Фасад лежит у **экспортёра**: `entities/user/@x/post.ts`.
- Через `@x` ре-экспортируются **только** типы и read-only хелперы; **MUST NOT** — UI и stores.
- Потребитель импортирует из `@/entities/user/@x/post`; обычный импорт `@/entities/user` на стороне потребителя **MUST** быть удалён.

**Критерии прохождения:**

- Создан файл `entities/user/@x/post.ts` с ре-экспортом `User["id"]`.
- `entities/post/*` импортирует `import type { UserId } from "@/entities/user/@x/post"` (или аналог).
- Обычный импорт `@/entities/user` из `entities/post/*` отсутствует.

**Частые провалы:**

- Агент кладёт фасад у потребителя: `entities/post/@x/user.ts` — значит 04-cross-imports не объясняет owner'а достаточно настойчиво.
- Агент импортирует напрямую `@/entities/user` из `entities/post/*` — значит Hard Invariant про «слайсы одного слоя не импортируют» не зеркалирован видно в AGENTS.md.

---

### ST-03 — Починить TypeScript-ошибку

**Задача:**

> В `pages/profile/ui/profile-card.tsx` параметр `user` имеет тип `any` — ESLint ругается. Исправь.

**Ожидаемый обход документации:**

1. [`../code-style/AGENTS.md`](../code-style/AGENTS.md) — прочитать, проверить PROFILE.
2. [`../code-style/PROFILE.md`](../code-style/PROFILE.md) — увидеть `TODO`, применить fallback-стратегию, пометить вывод.
3. [`../code-style/universal/01-typescript.md`](../code-style/universal/01-typescript.md) раздел 3 — запрет `any`.
4. [`../code-style/universal/01-typescript.md`](../code-style/universal/01-typescript.md) раздел 4 — типизация props через `interface`.
5. [`../architecture/05-pages-first.md`](../architecture/05-pages-first.md) — решение, где живёт тип `User` (в `entities/user/model/types.ts`, если используется ≥ 2 страницами; иначе — в `pages/profile/model/types.ts`).

**Применяемые Hard Invariants:**

- `any` **MUST NOT** использоваться вне узких границ с нетипизированными библиотеками.
- Props компонентов — через `interface`, **не** `type`.
- `React.FC` **MUST NOT**; `export default` **SHOULD NOT**.
- Внешние данные **MUST** валидироваться schema-парсером (Zod / Valibot / Yup) — напоминание, если `user` приходит из API.

**Критерии прохождения:**

- Определён `interface UserCardProps { user: User; … }` (или аналог).
- Тип `User` находится в соответствующем слайсе по pages-first.
- Если `PROFILE.md` содержит `TODO` — вывод помечен как требующий ревью, ссылается на fallback-стратегию.

**Частые провалы:**

- Агент приводит `any` → `unknown` без сужения — технически не `any`, но пропадает использование. Значит 01-typescript раздел 3 не даёт явного примера, что делать дальше.
- Агент использует `type UserCardProps = ...` вместо `interface` — значит 01-typescript раздел 2 недостаточно заметен.
- Агент не проверяет `PROFILE.md` первым, пишет по дефолту React 19 — значит code-style/AGENTS.md Working Protocol не акцентирует «сначала profile».

---

### ST-04 — Добавить форму

**Задача:**

> Добавь форму входа (email + пароль) на страницу `/login`. С валидацией email и минимум 8 символов пароля.

**Ожидаемый обход документации:**

1. [`../code-style/AGENTS.md`](../code-style/AGENTS.md) + [`../code-style/PROFILE.md`](../code-style/PROFILE.md) — определить `forms-approach`.
2. [`../code-style/universal/05-forms-principles.md`](../code-style/universal/05-forms-principles.md) — controlled/uncontrolled, a11y, стратегия валидации.
3. **Если** `forms-approach = react-hook-form` — [`../code-style/variants/forms-react-hook-form.md`](../code-style/variants/forms-react-hook-form.md).
   **Если** `forms-approach = react-19-actions` — [`../code-style/variants/forms-react-19-actions.md`](../code-style/variants/forms-react-19-actions.md).
   **Если** `PROFILE.md` = TODO — универсальные правила + пометка «требуется уточнение».
4. [`../code-style/universal/07-accessibility.md`](../code-style/universal/07-accessibility.md) — label-input связка, aria-invalid, aria-describedby для ошибок.
5. [`../security/02-input-handling.md`](../security/02-input-handling.md) раздел 1 — валидация на границе.

**Применяемые Hard Invariants:**

- Label связан с input через `htmlFor` + `id` **или** оборачиванием; placeholder **MUST NOT** заменять label.
- Интерактивные элементы доступны с клавиатуры.
- Ошибки валидации: `aria-invalid="true"` + `aria-describedby="<error-id>"`.
- Внешние данные (submit payload) **MUST** валидироваться schema-парсером.

**Критерии прохождения:**

- Есть видимый `<label>` у каждого input.
- Валидация через Zod / Valibot (или аналог из PROFILE), не ручные if-проверки.
- Ошибки отображаются с `aria-describedby`-связью.
- Кнопка submit — `disabled` во время submitting.
- Если неактивированный variant не применён (например, React Hook Form при PROFILE=`TODO`), это явно указано.

**Частые провалы:**

- Агент использует `placeholder` вместо `<label>` — значит 07-accessibility недостаточно акцентирует semantic HTML.
- Агент пишет валидацию через серию `if (!email.includes("@"))` — значит связь 05-forms-principles ↔ Zod недостаточна.
- Агент применяет правила React Hook Form при `forms-approach: TODO` — значит fallback-стратегия PROFILE не считывается.

---

### ST-05 — Открыть PR

**Задача:**

> Я закончил feature-ветку `feature/user-profile-page`. Открой PR.

**Ожидаемый обход документации:**

1. [`../workflow/AGENTS.md`](../workflow/AGENTS.md).
2. [`../workflow/02-pull-requests.md`](../workflow/02-pull-requests.md) разделы 2–3 — заголовок, шаблон описания.
3. [`../workflow/01-git.md`](../workflow/01-git.md) раздел 2 — проверить коммиты (subject ≤ 50, imperative).
4. [`../workflow/03-code-review.md`](../workflow/03-code-review.md) раздел 7 — self-review перед request-review.

**Применяемые Hard Invariants:**

- Заголовок PR — формат `<type>(<scope>): <subject>`.
- Описание содержит Summary (1–3 буллета), Why, Changes, Test plan (≥ 1 пункт), Related.
- PR ≤ 500 строк diff'а или обоснование в описании.
- Если PR реализует ADR — ссылка в Related.

**Критерии прохождения:**

- Заголовок PR соответствует формату.
- Все 5 секций описания заполнены; Test plan не пустой.
- Self-review проведён (упомянут в ответе).
- Нет `[blocker]`-комментариев к своим коммитам (subject, атомарность).

**Частые провалы:**

- Агент делает PR с описанием «see commits» — значит 02-pull-requests раздел 3 недостаточно императивен.
- Агент не предлагает self-review — значит 03-code-review раздел 7 не акцентирован.
- Заголовок PR «Updates» — значит шаблон не соблюдается; проверить, достаточно ли явно 02-pull-requests раздел 2.

---

### ST-06 — Hotfix в продакшене

**Задача:**

> В проде баг: при пустой корзине страница `/checkout` падает. Срочно нужен фикс.

**Ожидаемый обход документации:**

1. [`../workflow/AGENTS.md`](../workflow/AGENTS.md).
2. [`../workflow/04-releases.md`](../workflow/04-releases.md) раздел 5 — hotfix-процедура.
3. [`../workflow/01-git.md`](../workflow/01-git.md) раздел 1 — именование ветки `hotfix/<version>-<desc>`.
4. [`../code-style/universal/08-testing-principles.md`](../code-style/universal/08-testing-principles.md) — regression-тест **до** фикса.
5. [`../workflow/02-pull-requests.md`](../workflow/02-pull-requests.md) + [`../workflow/03-code-review.md`](../workflow/03-code-review.md) — ускоренный review (SLA 2 часа).

**Применяемые Hard Invariants:**

- Ветка — `hotfix/<current-version>-<short-desc>`.
- Regression-тест, воспроизводящий баг, **MUST** быть написан **до** фикса.
- Minимальное исправление — никакого сопутствующего рефакторинга.
- PATCH-bump версии + tag + deploy + post-mortem в 3 рабочих дня.

**Критерии прохождения:**

- Ветка именована по формату.
- Предложен regression-тест.
- Фикс содержит только исправление бага, без «попутных улучшений».
- Упомянута необходимость post-mortem и PATCH-bump.

**Частые провалы:**

- Агент сразу чинит баг без regression-теста — значит 04-releases раздел 5 шаг 2 не зеркалирован в AGENTS.md hard invariants.
- Агент рефакторит окружающий код «раз уж тут» — значит «no scope creep in hotfix» недостаточно заметно.
- Агент MINOR-bump'ит версию — значит 04-releases раздел 1 таблица semver не считывается.

---

### ST-07 — Фиксить XSS в рендере

**Задача:**

> В `features/article/ui/article-body.tsx` содержимое статьи рендерится через `dangerouslySetInnerHTML={{ __html: article.body }}`. Статьи приходят от пользователей. Исправь.

**Ожидаемый обход документации:**

1. [`../security/AGENTS.md`](../security/AGENTS.md).
2. [`../security/02-input-handling.md`](../security/02-input-handling.md) раздел 2 — XSS и рендер.
3. [`../code-style/universal/01-typescript.md`](../code-style/universal/01-typescript.md) раздел 3 — runtime-валидация внешних данных.
4. [`../security/03-dependencies.md`](../security/03-dependencies.md) раздел 1 — due diligence при добавлении DOMPurify.

**Применяемые Hard Invariants:**

- `dangerouslySetInnerHTML` **MUST NOT** без sanitization через trusted библиотеку.
- Regex-фильтры (`.replace(/<script>/g, "")`) **MUST NOT** — обходятся.
- Allowlist тегов и атрибутов **MUST** быть минимален.
- Добавление DOMPurify **MUST** пройти due diligence чек-лист.

**Критерии прохождения:**

- Импортирован DOMPurify (или sanitize-html), вызов `.sanitize()` перед рендером.
- Allowlist явно задан (минимум тегов).
- `href`-атрибуты проверяются на protocol (см. 02-input-handling раздел 2).
- Упомянуто due diligence при добавлении пакета.

**Частые провалы:**

- Агент пишет regex-фильтр вместо DOMPurify — значит антипаттерн в 02-input-handling недостаточно заметен.
- Агент добавляет пакет без упоминания due diligence — значит 03-dependencies раздел 1 не зеркалирован в security/AGENTS.md Hard Invariants.
- Агент не валидирует `href` → риск `javascript:` — значит 02-input-handling раздел 2 «URL в атрибутах» не акцентирован.

---

### ST-08 — Добавить ADR

**Задача:**

> Мы решили использовать MobX вместо Zustand для глобального state. Нужно зафиксировать решение.

**Ожидаемый обход документации:**

1. [`../decisions/AGENTS.md`](../decisions/AGENTS.md) — Working Protocol для нового ADR.
2. [`templates/ADR.md`](templates/ADR.md) — шаблон.
3. [`frontmatter.md`](frontmatter.md) раздел 4 — frontmatter для ADR.
4. [`governance.md`](governance.md) раздел 4 — процесс добавления variant'а.
5. [`../decisions/README.md`](../decisions/README.md) — определить следующий `id`.
6. [`../code-style/PROFILE.md`](../code-style/PROFILE.md) — обновить `global-client-state`.
7. [`../code-style/AGENTS.md`](../code-style/AGENTS.md) — обновить When to Read — Variants.

**Применяемые Hard Invariants:**

- `id` = `последний существующий + 1`; `id` **MUST NOT** переиспользоваться.
- Секции Context / Decision / Consequences / Alternatives considered — все заполнены.
- Минимум одна отвергнутая альтернатива.
- Новая variant-глава `variants/state-mobx.md` содержит `requires.profile.global-client-state: mobx`.
- `PROFILE.md` и `AGENTS.md` категории обновлены **в том же PR**.

**Критерии прохождения:**

- Создан `decisions/NNNN-introduce-mobx-for-global-state.md` (или аналог) со `status: proposed` или `accepted`.
- Создан `variants/state-mobx.md` с `requires`.
- `PROFILE.md` дополнен опцией `mobx` в `Global client state`.
- ADR упоминает, что **не** заменяет Zustand (если оба сосуществуют) или явно `supersedes` старый ADR о Zustand.
- Строка в `decisions/README.md` Index добавлена.

**Частые провалы:**

- Агент пропускает шаг добавления в PROFILE — значит governance раздел 4 не акцентирован в decisions/AGENTS.md.
- Агент не предлагает альтернатив — значит ADR-шаблон не настаивает достаточно.
- Агент копирует `id` существующего ADR — значит decisions/AGENTS.md Hard Invariants про уникальность `id` не зеркалированы.

---

## 5. Прогон и отчёт

### Ручной прогон

1. Открыть чистую сессию ИИ-агента (новый чат, no prior context).
2. Вставить задачу теста.
3. Наблюдать, какие файлы агент открывает и в каком порядке.
4. Сравнить с ожидаемым обходом и критериями.
5. Записать результат: `pass`, `partial` (какие инварианты пропущены), `fail` (ушёл в неверную категорию).

### Форма отчёта

```markdown
# Smoke-test run — YYYY-MM-DD

| ID | Status | Notes |
|---|---|---|
| ST-01 | pass | — |
| ST-02 | partial | Агент создал фасад у потребителя, а не у экспортёра. Issue: 04-cross-imports недостаточно явен об owner'е. |
| ST-03 | pass | — |
| ... | ... | ... |

## Issues to file
- [issue] 04-cross-imports: усилить формулировку «фасад у экспортёра» с явным примером имени файла.
- ...
```

### Интерпретация

- **Все pass** — документация работает.
- **1–2 partial** — мелкий drift; issues фикс точечными PR'ами.
- **≥ 3 partial или ≥ 1 fail** — систематический drift; возможна правка шаблонов / governance / навигации.

---

## 6. Добавление нового теста

При появлении новой категории или нового частого use-case:

1. Выдать следующий `ST-NN` (append-only; последний использованный + 1).
2. Заполнить все 5 блоков: Задача, Ожидаемый обход, Hard Invariants, Критерии, Частые провалы.
3. Прогнать тест вручную, чтобы убедиться, что ожидаемый обход действительно воспроизводим.
4. Bump PATCH этой главы; `last-reviewed` обновить.

Удаление теста **MUST NOT** переиспользовать его номер; помечайте удалённые как `ST-NN: REMOVED (<reason>, <date>)` в секции ниже.

---

## 7. Удалённые / устаревшие тесты

*Пока нет.*
