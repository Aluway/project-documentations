# 10 — Миграция существующего кода в FSD 2.1

> Оглавление: [`README.md`](README.md).

Эта глава описывает практику **постепенной миграции** существующего фронтенда в структуру FSD 2.1. Greenfield-проектам она не нужна. Основана на реальном опыте переноса ~150 файлов за 8 инкрементальных этапов с зелёным билдом после каждого коммита.

Что уже описано в других главах, сюда не дублируется:
- Конкретные правила расположения — [05-pages-first.md](05-pages-first.md), [07-checklists.md](07-checklists.md).
- Правила импортов и переход на `@/` alias — [06-import-rules.md](06-import-rules.md).
- ESLint-конфиг, который финально валидирует миграцию — [11-eslint-setup.md](11-eslint-setup.md).
- Audit для перепроверки после миграции — [12-audit.md](12-audit.md).

Здесь — только миграционно-специфичное знание.

---

## 1. Принципы

- **Инкрементально.** Один concern на этап, один этап — несколько атомарных коммитов. Никакого big-bang переписывания.
- **Зелёный билд между коммитами.** После каждого коммита `npm run build`, тесты и линт проходят. Если не проходят — это **не этап**, это прерванный рефакторинг.
- **Downward first.** Мигрируем слои снизу вверх: `shared` → `entities` → `features` → `widgets` → `pages` → `app`. Причина: слой импортируется только из слоёв выше, поэтому после миграции `shared` потребители ещё целы; если сначала тронуть `pages`, каждый следующий слой будет ломать уже мигрированный.
- **Один concern на коммит.** «Перенести Sidebar в widget» и «переместить `use-is-mobile` в `shared/lib/hooks`» — два разных изменения, два разных коммита. Смешение — частая причина невозможности откатить.

---

## 2. Типовой порядок этапов

Шаблон, проверенный на реальной миграции. Правьте под свой стек.

| Этап | Что делается |
|---|---|
| 0 | Path alias `@/*` в `tsconfig` и бандлере. Установка `eslint-plugin-import` без строгих правил. |
| 1 | Kebab-case-rename всех файлов-кандидатов (codemod). Пустой семантики — только имена. |
| 2 | `shared/{ui,lib,api,config}/`. Примитивы и утилиты переезжают первыми. |
| 3 | `entities/<name>/` по одной сущности. При первой кросс-связи — `@x`-фасад. |
| 4 | `features/<verb>-<name>/` для интерактивных композиций. |
| 5 | `widgets/<name>/` для самодостаточных UI-блоков. |
| 6 | `pages/<name>/` — page slices по бизнес-концепту. |
| 7 | `app/` — точка входа, роутинг, провайдеры, DI для shared. |
| 8 | Cleanup transitional paths, включение ESLint `import/no-restricted-paths` в error. |

Итоговая валидация миграции — момент, когда ESLint из [11-eslint-setup.md](11-eslint-setup.md) включается в `error` с 15 правилами направления и показывает **0 нарушений**. Если нарушения есть — миграция не закончена.

---

## 3. Transitional paths — осознанный tech debt

В середине миграции часто возникает развилка:

- **(A)** Сразу перенести зависимость в целевую FSD-локацию и обновить все импорты.
- **(B)** Временно перенаправить импорт на промежуточный путь, не являющийся FSD-слоем (например, `@/hooks/use-foo`).

Выбор **(B)** — часто правильный, потому что каждый этап имеет один concern. Но только при соблюдении **трёх условий**:

1. **Дата истечения зафиксирована в плане.** Транзитный путь живёт до конкретного этапа (обычно финального cleanup).
2. **Не маскирует реальные FSD-нарушения.** `@/hooks/` — это «не-FSD папка», а не нарушение слоя. Если транзит прячет layer violation — это не транзит, это долг.
3. **Документирован явно.** В commit-message или `TODO(fsd):` — не «я помню», а grep-able.

Без этих условий транзитный путь превращается в долгосрочную грязь.

**Пример из практики:** папка `@/hooks/` работала транзитом 5 этапов. На финальном Stage 8 — одним коммитом 3 хука переехали в `shared/lib/hooks/<name>/`, 16 импортов обновлены, grep `@/hooks/` вернул 0.

---

## 4. `TODO(fsd):` вместо `eslint-disable`

Временное нарушение FSD-правила **MUST** фиксироваться `TODO(fsd):` в коде, а не глушиться `eslint-disable` или аналогом.

```ts
// shared/api/http-client.ts
// TODO(fsd): Этап 7 — переехать на DI через setter, authStore не место в shared/api.
//            Причина текущего импорта: interceptors читают токен до появления app-bootstrap.
import { useAuthStore } from '@/store/auth-store';
```

Почему так:

- `eslint-disable` делает нарушение **невидимым** — его не видно в grep, в отчётах ESLint, в code-review.
- `TODO(fsd):` делает его **видимым и контекстуальным** — причина и план фикса записаны рядом.
- Grep `TODO(fsd)` в любой момент показывает актуальный архитектурный долг миграции.

Для нарушений, которые **не** планируется чинить (например, workaround сторонней библиотеки) — `eslint-disable` с комментарием нормально. FSD-долг — всегда `TODO(fsd):`.

---

## 5. Миграционные скрипты: подводные камни

Bash-codemod для переезда одной сущности (`scripts/migrate-entity.sh` или аналог) ускоряет работу в 10 раз, но имеет четыре типовые слепые зоны:

### 5.1 Runtime-экспорты в `types.ts`

Экстрактор, регексящий `^export (interface|type)` для переезда типов в `model/types.ts`, **пропустит** runtime-значения из того же файла:

```ts
// Старый types.ts содержит и то, и другое:
export interface Order { /* ... */ }
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = { /* ... */ };
export function getMarginCategory(margin: number) { /* ... */ }
```

После переезда `Order` в `model/types.ts` — `ORDER_STATUS_LABELS` и `getMarginCategory` остаются за бортом Public API. **Fix:** руками вынести в `model/consts.ts` или `model/labels.ts` и добавить в `index.ts`.

### 5.2 Sibling imports без префикса сегмента

Паттерн `components/<plural>/<name>` в импортах ловится sed-ом, а `../<plural>/<name>` из сестры `components/dashboard/*` — нет:

```ts
// components/orders/order-card.tsx
import { MarginDisplay } from '../dashboard/margin-display';  // ← скрипт этого не видит
```

**Fix:** дополнительный sed-паттерн на `\.\./<plural>/<name>` поверх основного.

### 5.3 Cross-entity type refs ломаются каскадом

Когда мигрируется `material`, а `product/types.ts` ещё ссылается на `./material` — возникает разрыв:

- Сначала: `material` переезжает в `entities/material/`, `product/types.ts` получает битый `./material`.
- Правим `product/types.ts` на `@/entities/material` **до того, как** сам `product` мигрирует.
- Позже, когда `product` переезжает: второй проход — меняем на `@x/product` фасад.

Двухфазно, но управляемо. **Fix:** план миграции должен отмечать, какие type-refs придётся править дважды.

### 5.4 Self-reference в свой барел после переезда

После миграции файл внутри слайса может получить импорт через собственный Public API:

```ts
// entities/order/ui/order-card.tsx
import { shortOrderNumber } from '@/entities/order';   // ✗ self-reference
```

Обычно это результат того, что sed-скрипт перевёл относительный путь в абсолютный, не проверяя, не попал ли путь в свой же барел. **Fix:** после миграции — run [12-audit.md Check 7](12-audit.md). На точечных срабатываниях — обратно на relative (`from '../lib/order-search'`).

---

## 6. Переписывание импортов: все формы одного модуля

Типичная проблема на большом codemod: один и тот же модуль импортируется из разных глубин в разных формах.

```ts
'./components/ui/button'         // из src/
'../components/ui/button'        // из src/pages/
'../../components/ui/button'     // из src/components/orders/
'./ui/button'                    // из src/components/ (после urgent-фикса)
'../ui/button'                   // из src/components/services/
'../../ui/button'                // редко, из глубоких вложений
```

Все → `@/shared/ui/button`. Один sed-паттерн не покрывает все формы — нужны три-четыре:

```bash
s#(['"`])[^'"`]*components/ui/<p>(['"`])#\1@/shared/ui/<p>\2#g
s#(['"`])\.\./ui/<p>(['"`])#\1@/shared/ui/<p>\2#g
s#(['"`])\./ui/<p>(['"`])#\1@/shared/ui/<p>\2#g
```

**Правило:** перед любым массовым переписыванием импортов **MUST** сделать `grep -rn "import.*<символ>"` и убедиться, что покрыты все префиксы (`./`, `../`, `../../`, с `components/` и без). Пропуск — тихие ошибки компиляции, которые обнаружатся в другом PR.

Связанное правило «не переписывать глубины, переходить на alias» — [06-import-rules.md §4.4](06-import-rules.md#44-перенос-файла--переход-на-алиас).

---

## 7. Platform-specific gotchas

### 7.1 Windows / NTFS — case-insensitive renames

NTFS не различает `Button.tsx` и `button.tsx` — для ОС это один файл. Git по умолчанию (`core.ignorecase=true`) тоже. Case-only rename через `git mv Button.tsx button.tsx` может молча оставить старое имя.

Два обходных приёма:

1. **Через temp:** `git mv Button.tsx _tmp.tsx && git mv _tmp.tsx button.tsx`.
2. **Выключить ignorecase** на время миграции: `git config core.ignorecase false` (локально в репо).

Multi-char renames (`ClientCard.tsx` → `client-card.tsx`) работают обычным `git mv` без плясок.

### 7.2 CRLF warnings на Windows

`git add` с `core.autocrlf=true` сыпет:

```text
warning: LF will be replaced by CRLF in foo.tsx.
The file will have its original line endings in your working directory.
```

Это **не ошибка** — Git хранит в репо LF, в рабочей копии конвертирует в CRLF. Отключать `core.autocrlf` на Windows **SHOULD NOT** — иначе CRLF попадут в репо и сломают CI на Linux.

### 7.3 `set -euo pipefail` + Git Bash + xargs

Скрипты миграции с `set -e` на Git Bash иногда молча обрывались в середине цикла. Причина: `find ... -print0 | xargs -0 sed -i` при некоторых состояниях даёт ненулевой exit code, даже когда логически всё отработало.

**Workaround:** `set -uo pipefail` без `-e`. Защита от необъявленных переменных и broken pipe остаётся, защита от любой ненулевой ошибки — теряется. Для **одноразовых** скриптов миграции это приемлемо: верификация идёт отдельным `npm run build` и `npm test`.

### 7.4 `.tsx` в импортах

TypeScript по конвенции импортит без расширения. Но Vite-шаблоны генерят `import App from './App.tsx'` (с расширением, разрешено через `allowImportingTsExtensions: true`). Codemod, переписывающий импорты, **MUST** закладывать оба паттерна: с расширением и без.

---

## 8. Git rename detection при split'ах

Когда один файл разделяется на несколько (`utils.ts` → `shared/lib/cn/cn.ts` + `shared/lib/format/format.ts`), git автоматически детектит **только один** rename — обычно с самой высокой similarity. Второй файл идёт как `create mode`.

Это поведение не требует вмешательства — git делает правильный выбор. Но commit-message **SHOULD** описать происхождение каждого нового файла, чтобы история не теряла контекст:

```text
refactor(shared): split utils.ts by purpose

src/lib/utils.ts (27 lines, 4 exports) -> deleted, split by purpose:
  cn()          -> shared/lib/cn/
  formatters    -> shared/lib/format/
```

Так `git log --follow` для любого из новых файлов найдёт полную историю.

---

## 9. Метрики реальной миграции (для калибровки scope)

| Этап | Коммитов | Примеры содержимого |
|---|---|---|
| 0 | 2 | path alias, eslint-plugin-import без правил |
| 1 | 1 | kebab-case rename (~100 файлов одним codemod'ом) |
| 2 | 4 | `shared/{ui,lib,api}` |
| 3 | 7 | 6 entity-слайсов + 4 `@x`-фасада |
| 4 | 2 | `features/{manage-product,manage-order}` |
| 5 | 1 | `widgets/{sidebar,bottom-nav}` |
| 6 | 6 | 17 page-слайсов |
| 7 | 1 | `app/` + DI refactor shared/api |
| 8 | 3 | cleanup transitional paths + ESLint boundaries + docs |
| **Σ** | **~27** | **~150 файлов перемещено** |

Полезные ориентиры: 25–30 атомарных коммитов на ~150 файлов; 0 layer violations после финального ESLint; тесты 100% pass после каждого коммита.

---

## 10. Чек-лист этапа миграции

Запускайте перед закрытием каждого этапа (не каждого коммита — для коммита хватит [07-checklists.md раздел I](07-checklists.md#i-архитектурный-pre-flight-на-каждый-коммит)).

- [ ] Этап имел **один** concern, описанный в плане.
- [ ] Каждый коммит этапа оставляет билд, тесты и линт зелёными.
- [ ] Нет смешанных коммитов вида «перенос + обновление API + багфикс».
- [ ] Transitional paths, появившиеся на этапе, задокументированы (commit-message или `TODO(fsd):`) с датой истечения.
- [ ] Если транзит истекает на этом этапе — он действительно удалён, grep показывает 0.
- [ ] Cross-entity связи через `@x`, а не прямой импорт.
- [ ] Новых layer violations не появилось ([11-eslint-setup.md](11-eslint-setup.md) правила не срабатывают).
- [ ] Audit-скрипт из [12-audit.md](12-audit.md) не находит новых нарушений.

---

## 11. Инверсия `shared → upper` через DI в `app`

Типовая ситуация при миграции: `shared/api/http-client.ts` в старом коде импортирует `authStore` напрямую, чтобы interceptors подставляли токен и обрабатывали 401. Формально это **нарушение направления слоёв** — `shared` смотрит в `entities` (или выше).

На этапе переезда `authStore` в `entities/user/` есть два пути:

### Путь A — симметричный, но неправильный

Просто обновить импорт: `@/store/auth-store` → `@/entities/user`. Sed-паттерн сделает это за секунду, но нарушение направления **не исчезает**: `shared/api` всё равно знает об `entities/user`.

### Путь B — инверсия через setter injection

`shared/api` **не знает** об auth вообще; `app` — единственный слой, который видит оба и соединяет их на bootstrap.

```ts
// shared/api/http-client.ts — чистый транспорт
let getAuthToken: () => string | null = () => null;
let onUnauthorized: () => void = () => {};

export function setAuthTokenGetter(getter: () => string | null) {
  getAuthToken = getter;
}
export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) onUnauthorized();
    return Promise.reject(err);
  },
);
```

```ts
// app/providers/setup-http-client.ts — wiring на уровне app
import { useAuthStore } from '@/entities/user';
import { setAuthTokenGetter, setUnauthorizedHandler } from '@/shared/api';

export function setupHttpClient() {
  setAuthTokenGetter(() => useAuthStore.getState().token);
  setUnauthorizedHandler(() => {
    useAuthStore.getState().logout();
    window.location.href = '/login';
  });
}
```

```ts
// app/index.tsx — one-shot на загрузке
import { setupHttpClient } from './providers/setup-http-client';

setupHttpClient();
```

**Результат:**

- `shared/api/http-client.ts` не знает об entities. Его можно переиспользовать в другом проекте с другим auth-решением.
- `entities/user` не знает о транспорте. `authStore` остаётся чистым.
- `app/` знает про оба — это его роль.
- ESLint `import/no-restricted-paths` не срабатывает: нет ни одного импорта «снизу вверх».

### Когда применять

Паттерн применим везде, где `shared/*` **должен** знать о чём-то из верхних слоёв:

- http-client + auth store / language / feature flags.
- logger + user id / trace id.
- analytics client + session context.

**Общее правило:** если `shared/` нуждается в runtime-значении из домена — не тащите домен в `shared`, а разверните зависимость через setter/getter в `app/`. Это каноничный hexagonal-architecture workaround, адаптированный под FSD.

### Сигналы, что setter-injection избыточна

- Значение известно на compile-time (конфиг, константа) — просто импортите из `shared/config`.
- Зависимость **не** runtime (только тип) — это `@x` или прямой тип-импорт из `shared`.
- Клиент используется в одном месте — прокиньте зависимость через параметр функции, а не через module-level setter.

Setter injection — средство, а не стиль. Применяйте точечно.

---

## 12. Сводка

| Практика | Статус |
|---|---|
| Мигрировать слои снизу вверх (`shared` → `app`) | **MUST** |
| Один concern на этап; зелёный билд после каждого коммита | **MUST** |
| Transitional paths документированы (expiry + `TODO(fsd):`) | **MUST** |
| Временные layer-violations помечены `TODO(fsd):`, не `eslint-disable` | **MUST** |
| Итоговая валидация — включение [11-eslint-setup.md](11-eslint-setup.md) в `error` с 0 нарушений | **MUST** |
| Cross-entity type-refs через `@x`-фасад; hooks/stores — через `features/` | **MUST** |
| Относительные `../` при переезде → `@/` alias ([06-import-rules.md §4.4](06-import-rules.md#44-перенос-файла--переход-на-алиас)) | **MUST** |
| Инверсия `shared → upper` через setter injection в `app/` | **SHOULD** |
| Prompt-аудит после миграции ([12-audit.md](12-audit.md)) | **SHOULD** |
| Скрипты с `set -uo pipefail` (не `-e`) на Git Bash | **SHOULD** |
| Глобальный `--legacy-peer-deps` через `.npmrc` | **SHOULD NOT** |
