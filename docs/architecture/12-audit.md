# 12 — Архитектурный audit

> Оглавление: [`README.md`](README.md).

ESLint-правила из [11-eslint-setup.md](11-eslint-setup.md) закрывают layer direction, но **не** ловят slice isolation, deep imports, self-reference, wildcard-экспорты, запрещённые сегменты и пустые «future» слайсы. Эта глава описывает запускаемый bash-audit, который закрывает эти пробелы за секунды.

---

## 1. Когда запускать

- **SHOULD** — раз в квартал или перед major-релизом.
- **SHOULD** — после любой крупной миграции или рефакторинга, затрагивающего ≥ 20 файлов.
- **MAY** — в CI как periodic job (раз в неделю, с уведомлением в чат при находках).
- **MAY** — как pre-flight на стороне разработчика перед большим PR.

Audit — не замена ESLint, а **периодическая калибровка**. ESLint гоняется на каждом PR; audit — раз в квартал ловит то, что проползло мимо.

---

## 2. Что покрывает audit

| Проверка | Цель | Ловит bash? |
|---|---|---|
| 1. Направление слоёв | Нижний слой импортит верхний | ✗ — ESLint ловит |
| 2. `index.ts` у каждого слайса | Отсутствие Public API | ✓ |
| 3. Wildcard-экспорты | `export * from '...'` в `index.ts` | ✓ |
| 4. Запрещённые essence-сегменты | `components/`, `hooks/`, `utils/`, … | ✓ |
| 5. Deep imports в обход `index.ts` | `from '@/entities/user/ui/user-card'` | ✓ (эвристически) |
| 6. Cross-slice within-layer | `features/a` импортит `features/b` | ✓ (эвристически) |
| 7. Self-reference через свой барел | Файл слайса импортит `@/layer/slice` | ✓ |
| 8. Пустые «future» слайсы | `features/foo/` без `.ts`/`.tsx` файлов | ✓ |
| 9. Runtime cross-entity | entity импортит хук другой entity | ✗ — ручной ревью |
| 10. Имя ≠ доменная связь | `ClientAvatar` без зависимости от `Client` | ✗ — ручной ревью |

Чеки 9–10 требуют понимания семантики кода; bash их не увидит. Для них — периодический ручной проход по `entities/*/ui/*` и `entities/*/lib/*`.

---

## 3. Audit-скрипт

Полный скрипт. Предполагает запуск из корня фронтенд-пакета (где лежит `src/`).

```bash
#!/usr/bin/env bash
# fsd-audit.sh
set -uo pipefail

FAIL=0
section() { echo; echo "=== $1 ==="; }

section "Check 2: index.ts в каждом слайсе"
for layer in entities features widgets pages; do
  [ -d "src/$layer" ] || continue
  for slice in src/$layer/*/; do
    if [ ! -f "${slice}index.ts" ] && [ ! -f "${slice}index.tsx" ]; then
      echo "MISSING index: $slice"
      FAIL=1
    fi
  done
done

section "Check 3: wildcard-экспорты"
if grep -rnE "^export \*" src/ 2>/dev/null; then
  FAIL=1
fi

section "Check 4: запрещённые essence-сегменты"
for bad in components hooks types utils helpers constants; do
  found=$(find src/entities src/features src/widgets src/pages \
    -type d -name "$bad" 2>/dev/null)
  if [ -n "$found" ]; then
    echo "$found"
    FAIL=1
  fi
done

section "Check 5: deep imports в обход Public API"
# Матчит from "@/layer/slice/segment/file" — глубже одного уровня после слайса
if grep -rEn \
  "from ['\"]@/(entities|features|widgets|pages)/[a-z0-9-]+/(ui|model|api|lib|config)/[a-zA-Z0-9-]+['\"]" \
  src/ 2>/dev/null; then
  FAIL=1
fi

section "Check 6: cross-slice within-layer (без @x)"
for layer in entities features widgets pages; do
  [ -d "src/$layer" ] || continue
  for slice_dir in src/$layer/*/; do
    slice_name=$(basename "$slice_dir")
    # Ищем внутри слайса импорты в другие слайсы того же слоя.
    # Исключаем @x-фасады: from "@/entities/<other>/@x/<this>"
    while IFS= read -r line; do
      # Каждая строка — "file:line:match". Извлекаем целевой слайс.
      target=$(echo "$line" | grep -oE "@/$layer/[a-z0-9-]+" | head -1 | sed "s|@/$layer/||")
      [ -z "$target" ] && continue
      [ "$target" = "$slice_name" ] && continue   # self-reference — Check 7
      # @x-фасад легален только для entities
      if [ "$layer" = "entities" ] && echo "$line" | grep -q "@x/$slice_name"; then
        continue
      fi
      echo "CROSS-SLICE: $line"
      FAIL=1
    done < <(grep -rEn "from ['\"]@/$layer/[a-z0-9-]+" "$slice_dir" 2>/dev/null)
  done
done

section "Check 7: self-reference через свой барел"
for layer in entities features widgets pages; do
  [ -d "src/$layer" ] || continue
  for slice_dir in src/$layer/*/; do
    slice_name=$(basename "$slice_dir")
    if grep -rlnE "from ['\"]@/${layer}/${slice_name}['\"]" "$slice_dir" 2>/dev/null; then
      FAIL=1
    fi
  done
done

section "Check 8: пустые слайсы"
for layer in entities features widgets pages; do
  [ -d "src/$layer" ] || continue
  for slice_dir in src/$layer/*/; do
    count=$(find "$slice_dir" -type f \( -name "*.ts" -o -name "*.tsx" \) | wc -l)
    if [ "$count" -le 1 ]; then
      echo "NEAR-EMPTY ($count files): $slice_dir"
      FAIL=1
    fi
  done
done

echo
if [ $FAIL -eq 0 ]; then
  echo "✓ audit passed"
else
  echo "✗ audit found issues (see above)"
  exit 1
fi
```

Сохраните как `scripts/fsd-audit.sh`, `chmod +x`, запускайте из фронтенд-корня. Полный прогон на кодовой базе из ~150 файлов — 1–3 секунды.

---

## 4. Ложно-положительные срабатывания

У эвристических чеков (5, 6) возможны FPs. Как их читать:

### Check 5 — deep imports

Глубокий путь легален в двух случаях:

1. **Внутри того же слайса** — файл в `entities/user/ui/` импортирует `../model/types`. Скрипт это не ловит, потому что grep по `@/` не матчит относительные пути.
2. **Кросс-entity через `@x`** — `from '@/entities/user/@x/post'` сегментно выглядит как deep import, но это легальный фасад. Скрипт **срабатывает ложно** — отфильтруйте вручную или уточните regex.

### Check 6 — cross-slice

Скрипт пропускает `@x/<slice>`-фасады для `entities/*`. Но:

1. `shared/api/http-client.ts` читающий `useAuthStore` из `entities/user/` на **переходный** период (TODO перед feature-extract) — сработает ложно. Проверьте, есть ли TODO-комментарий; если есть — залогировано как tech debt, не новое нарушение.
2. Импорты тестов: `entities/order/lib/*.test.ts` могут импортить `@/entities/product` в рамках интеграционного сценария — сигнал сдвинуть тест в `features/` или `shared/`, но не автоматический баг.

---

## 5. Ручные проходы (что bash не видит)

### 5.1 Runtime cross-entity (Check 9)

Откройте `entities/*/ui/*.tsx` и `entities/*/lib/*.ts`. Ищите импорты **хуков** вида `useX` из других entities:

```bash
grep -rEn "import \{[^}]*use[A-Z][a-zA-Z]*[^}]*\} from ['\"]@/entities/" src/entities/
```

Каждый найденный — кандидат на переезд в `features/` (см. [04-cross-imports.md](04-cross-imports.md#runtime-cross-entity-это-features-не-x)).

### 5.2 Имя ≠ доменная связь (Check 10)

Откройте `entities/<name>/ui/<name>-*.tsx` — файлы с «доменным» именем. Для каждого задайте три вопроса из диагностики в [04-cross-imports.md](04-cross-imports.md#имя-доменная-связь):

1. Типы из `model/types.ts` сущности используются внутри?
2. Импорты из других сегментов сущности есть?
3. Компонент работал бы без этой доменной модели?

Если ответы «нет, нет, да» — перенос в `shared/ui/<thing>/` с переименованием.

---

## 6. Интеграция в CI

Минимальная форма — GitHub Actions job раз в неделю:

```yaml
# .github/workflows/fsd-audit.yml
name: FSD audit
on:
  schedule:
    - cron: "0 9 * * MON"
  workflow_dispatch:

jobs:
  audit:
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: frontend } }
    steps:
      - uses: actions/checkout@v4
      - run: bash scripts/fsd-audit.sh
```

Provider-agnostic альтернатива — вызывать скрипт из `package.json`:

```json
{ "scripts": { "audit:fsd": "bash scripts/fsd-audit.sh" } }
```

Затем `npm run audit:fsd` локально или в любом CI.

---

## 7. Что делать с находками

1. **Новое нарушение** (появилось после последнего audit) — завести PR, починить в рамках одного коммита.
2. **Унаследованное нарушение** (было и до миграции) — зафиксировать как `TODO(fsd):` в коде с ссылкой на план рефакторинга. Не скрывать `eslint-disable`-комментариями.
3. **Ложно-положительное** — уточнить regex в скрипте, не глушить весь чек.

Audit не должен становиться источником шума — иначе команда перестанет его запускать.

---

## 8. Сводка

| Рекомендация | Статус |
|---|---|
| Запускать audit-скрипт периодически (квартал / major-релиз) | SHOULD |
| Хранить `fsd-audit.sh` в `scripts/` репо | SHOULD |
| Запускать в CI scheduled job раз в неделю | MAY |
| Чинить находки отдельными атомарными коммитами | SHOULD |
| Ручной проход по runtime cross-entity (Check 9) | SHOULD — раз в квартал |
| Ручной проход по «имя ≠ домен» (Check 10) | SHOULD — раз в квартал |
| Автоматически пропускать `@x`-фасады в Check 5/6 | SHOULD |
