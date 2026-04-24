# 11 — ESLint: автоматическая валидация слоёв

> Оглавление: [`README.md`](README.md).

Ручная дисциплина не масштабируется: на кодовой базе из ~150 файлов первый же code-review пропустит случайный импорт «снизу вверх». Эта глава описывает минимальный ESLint-рецепт, который ловит нарушения направления слоёв на уровне CI, и честно перечисляет, чего он **не** ловит.

---

## 1. Что закрывает автоматизация

| Инвариант | Автоматизирован | Чем |
|---|---|---|
| Направление слоёв (`app → pages → widgets → features → entities → shared`) | ✓ | `import/no-restricted-paths` |
| `@x`-фасады между entities | ✓ (не блокируются) | тот же `import/no-restricted-paths` |
| Внутрислайсовые импорты | ✓ (не блокируются) | тот же `import/no-restricted-paths` |
| Изоляция слайсов одного слоя | ✗ | ручной ревью + периодический audit |
| Deep imports в обход `index.ts` | ✗ | `import/no-internal-modules` (опционально) |
| Self-reference через собственный барел | ✗ | ручной ревью |
| Пустые «на будущее» слайсы | ✗ | ручной audit |

Главный фокус — layer direction. Это инвариант, нарушение которого даёт **каскадные** проблемы: зависимость `shared` от `entities` делает `shared` непереносимым и unit-тестируемым только вместе с доменом.

---

## 2. Минимальный конфиг

Требуемые пакеты:

```
eslint-plugin-import@^2.x
eslint-import-resolver-typescript@^3.x
```

Для flat-config (`eslint.config.js`):

```js
import importPlugin from 'eslint-plugin-import';

export default [
  {
    plugins: { import: importPlugin },
    settings: {
      'import/resolver': {
        typescript: { project: './tsconfig.app.json' },
      },
    },
    rules: {
      'import/no-restricted-paths': ['error', {
        zones: [
          // shared MUST NOT импортировать из слоёв выше
          { target: './src/shared', from: './src/entities' },
          { target: './src/shared', from: './src/features' },
          { target: './src/shared', from: './src/widgets'  },
          { target: './src/shared', from: './src/pages'    },
          { target: './src/shared', from: './src/app'      },

          // entities MUST NOT импортировать из слоёв выше
          { target: './src/entities', from: './src/features' },
          { target: './src/entities', from: './src/widgets'  },
          { target: './src/entities', from: './src/pages'    },
          { target: './src/entities', from: './src/app'      },

          // features MUST NOT импортировать из слоёв выше
          { target: './src/features', from: './src/widgets' },
          { target: './src/features', from: './src/pages'   },
          { target: './src/features', from: './src/app'     },

          // widgets MUST NOT импортировать из слоёв выше
          { target: './src/widgets', from: './src/pages' },
          { target: './src/widgets', from: './src/app'   },

          // pages MUST NOT импортировать из app
          { target: './src/pages', from: './src/app' },
        ],
      }],
    },
  },
];
```

Ровно 15 запретных пар — для 6 слоёв это верхний треугольник матрицы направлений: `5 + 4 + 3 + 2 + 1 = 15`.

---

## 3. Почему `import/no-restricted-paths`, а не `eslint-plugin-boundaries`

Рассматривали два варианта:

| Критерий | `import/no-restricted-paths` | `eslint-plugin-boundaries` |
|---|---|---|
| Поставляется с `eslint-plugin-import` | ✓ | ✗ — отдельный пакет |
| Концепции для освоения | `target`, `from` | elements, types, family, messages |
| Покрывает layer direction | ✓ | ✓ |
| Покрывает slice isolation | ✗ | ✓ |
| Конфиг читается без документации | ✓ | требует чтения README |

**По умолчанию — `import/no-restricted-paths`.** Решает 80% задачи одним правилом, уже установлен вместе с `eslint-plugin-import`. Если на проекте реально нужна автоматизация slice isolation внутри слоя (`features/foo` не должен импортить `features/bar`) — подключайте `eslint-plugin-boundaries` дополнительно, но не вместо.

---

## 4. Что правило правильно **не** блокирует

### 4.1 `@x`-фасады

Запретная пара «target: entities, from: entities» отсутствует — кросс-entity через `@x` легален. Рассмотрим:

```ts
// entities/post/model/types.ts
import type { User } from '@/entities/user/@x/post';
```

- `target` файла: `./src/entities/post/...`
- `from` пути: `./src/entities/user/@x/...`

Обе в `./src/entities/` — пары `entities → entities` в списке нет, правило не срабатывает. Это именно то, что нужно.

### 4.2 Внутрислайсовые импорты

```ts
// entities/user/ui/user-card.tsx
import type { User } from '../model/types';
```

`target` и `from` — один и тот же подпуть, запрет не применяется.

---

## 5. Что правило **не** ловит (известные пробелы)

Явный список, чтобы команда знала границы автоматизации:

| Нарушение | Пример | Чем компенсировать |
|---|---|---|
| Slice isolation в одном слое | `features/a` импортит `features/b` | `eslint-plugin-boundaries` или per-slice zones в `no-restricted-paths` |
| Deep imports в обход Public API | `import X from '@/entities/user/ui/user-card'` | `import/no-internal-modules` |
| Self-reference через свой барел | Файл в `entities/user/` импортит `@/entities/user` | ручной ревью; см. [03-public-api.md](03-public-api.md) |
| Wildcard ре-экспорты в `index.ts` | `export * from './model'` | grep `^export \*` в pre-commit |
| Пустые «future» слайсы | `features/foo/` без кода | ручной периодический audit |
| Cross-entity UI-импорт | `entities/order/ui/*` импортит `@/entities/client` | ручной ревью + slice isolation правило |

Закрытие пропущенного — периодический bash-audit: см. [`12-audit.md`](12-audit.md).

---

## 6. Типовые ошибки конфигурации

### 6.1 Пути относительны от корня ESLint-конфига

```js
{ target: './src/shared', from: './src/entities' }   // ✓
{ target: 'src/shared',   from: 'src/entities'   }   // ✗ — не начинается с ./
{ target: '/src/shared',  from: '/src/entities'  }   // ✗ — абсолютный путь
```

### 6.2 Без TypeScript-резолвера правило молчит

Без `eslint-import-resolver-typescript` алиасы (`@/shared/...`) не резолвятся, и запреты молча не применяются. **Проверка**: намеренно сломайте импорт через алиас — ESLint должен сообщить `import/no-restricted-paths`, а не просто «Unable to resolve».

### 6.3 Конфиги и скрипты вне `src/`

Файлы вроде `vite.config.ts`, `vitest.config.ts`, `scripts/*` часто импортят из `src/` — это легально и правилом не блокируется (их `target` не попадает в `./src/...`). Но если такие файлы по ошибке экспортируют что-то обратно в `src/` — `no-restricted-paths` этого не заметит. Для них заведите отдельный глазами-ревью чек.

### 6.4 `--legacy-peer-deps` при миксе версий

`eslint-import-resolver-typescript@4.x` объявляет `eslint-plugin-import-x` как `peerOptional`. npm 7+ трактует `peerOptional` почти как обязательную зависимость и падает `ERESOLVE`. Обходы:

- Остаться на `eslint-import-resolver-typescript@^3.x` — peer strict не срабатывает.
- Ставить с `npm install --legacy-peer-deps` **точечно**, не через `.npmrc`.

Глобально включать `--legacy-peer-deps` в `.npmrc` **SHOULD NOT** — скрывает настоящие конфликты.

---

## 7. `eslint-plugin-import` vs `eslint-plugin-import-x`

В 2024–2025 экосистема раскололась. Активный форк — [`eslint-plugin-import-x`](https://github.com/un-ts/eslint-plugin-import-x): flat-config-native, быстрее; оригинал (`eslint-plugin-import@2.x`) обновляется медленнее, но продолжает работать.

- **API совместимое** — `no-restricted-paths` работает одинаково.
- **Миграция механическая** — сменить импорт плагина и имя ключа в `plugins`.
- **Когда мигрировать:** при обновлении `typescript-eslint` до 8.59+ или при подключении `eslint-import-resolver-typescript@4.x`.

До этого момента — остаётесь на `eslint-plugin-import@^2.x` без потери функциональности. Не нужно мигрировать «на всякий случай».

---

## 8. Интеграция в рабочий цикл

- **CI MUST** запускать `eslint --max-warnings=0` на PR. Правило `import/no-restricted-paths` — error, не warning.
- **Pre-commit SHOULD** запускать lint на изменённых файлах (lint-staged / husky).
- **Editor SHOULD** показывать ESLint-ошибки inline (`eslint.validate` в VS Code).

Разовая настройка окупается на первом же ревью, где правило ловит импорт «снизу вверх» без участия человека.

---

## 9. Сводка

| Рекомендация | Статус |
|---|---|
| `import/no-restricted-paths` с 15 layer-direction парами | MUST |
| `eslint-import-resolver-typescript` подключён | MUST |
| ESLint гоняется на CI с `--max-warnings=0` | MUST |
| `eslint-plugin-boundaries` для slice isolation | MAY |
| `import/no-internal-modules` для запрета deep imports | SHOULD |
| Периодический bash-audit пропущенного правилами — [`12-audit.md`](12-audit.md) | SHOULD |
| Глобальный `--legacy-peer-deps` через `.npmrc` | SHOULD NOT |
