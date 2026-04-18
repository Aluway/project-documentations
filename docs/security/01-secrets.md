---
version: 1.0.1
last-reviewed: 2026-04-17
status: active
---

# 01 — Секреты и `.env`-файлы

> Оглавление: [`README.md`](README.md).

Правила обращения с секретами на уровне репо, runtime, git-истории и CI. Охватывает env-переменные, credential-файлы, процедуру при утечке.

---

## 1. Что такое «секрет»

Секрет — любое значение, раскрытие которого даёт атакующему возможность, которой у него не должно быть. В frontend-контексте сюда входят:

- API-ключи сторонних сервисов (Stripe secret key, SendGrid API key, AWS credentials).
- OAuth client secrets.
- JWT signing keys, session keys, encryption keys.
- Database URLs с паролями.
- Приватные ключи SSH / GPG / TLS.
- Webhook signing secrets.
- Токены доступа (GitHub PAT, npm tokens, CI secrets).
- Любое значение, маркированное как «confidential» в документации сервиса.

**NOT секреты** (могут быть в клиентском коде):

- Публичные URL API.
- Google Analytics / Stripe publishable keys (они publishable by design).
- Sentry DSN (он не секрет сам по себе — designed to be in the client).
- Supabase anon key (но **NOT** service_role key).

Если сомневаетесь — считайте секретом и консультируйтесь с ops / security lead.

---

## 2. Запрет коммита

- `.env`, `.env.local`, `.env.*.local`, `*.env`, `*-secret.*`, `*-credential.*`, `*.pem`, `*.key`, `id_rsa`, `id_ed25519`, файлы с подписью `BEGIN PRIVATE KEY` — **MUST NOT** попадать в git. Минимальный `.gitignore` репо содержит эти исключения.
- Любой string, подходящий под паттерны секретов (AKIA для AWS, `sk_live_` для Stripe, JWT-структура `xxx.yyy.zzz` с содержательным payload) в коде или комментариях — **MUST NOT**.
- **MUST NOT** включать секреты в:
  - commit-messages;
  - PR-описания и скриншоты;
  - issue-комментарии;
  - logs / error reports;
  - тестовые фикстуры (используйте явные заглушки `test-key`, `fake-token`).

---

## 3. `.env`-контракт

### Структура

Репо **MUST** содержать:

- **`.env.example`** — шаблон с перечислением всех ожидаемых переменных, БЕЗ реальных значений. Каждая переменная — с комментарием: что это, где получить, публичная или секретная.
- **`.gitignore`** с правилами, исключающими `.env*.local` и `.env` (кроме `.env.example`).

Проект **MUST NOT** содержать:

- `.env` в любом виде с реальными значениями.
- Копии `.env.example` с заполненными секретами в `.env.prod.example`, `.env.staging.example` и т.п. — это тот же секрет в git, под другим именем.

### Пример `.env.example`

```dotenv
# Public API endpoint — безопасно в клиенте.
PUBLIC_API_URL=https://api.example.com

# Sentry DSN — designed to be public.
PUBLIC_SENTRY_DSN=https://<key>@sentry.io/<project>

# ── SECRETS (MUST NOT be committed in any .env*) ───────────────

# Stripe secret key — из 1Password vault "Payments".
STRIPE_SECRET_KEY=

# Database URL — provisioned by ops, см. runbook at <link>.
DATABASE_URL=
```

### Загрузка

- `.env` файлы читаются фреймворком сборки (Vite, Next.js, etc.) либо через `dotenv` пакет.
- **MUST** использовать стандартный механизм фреймворка, не кастомный парсер. Это гарантирует корректную обработку publicness-правил.
- **MUST NOT** инлайнить секреты в config-файлы (`next.config.js`, `vite.config.ts`) — они бандлятся.

---

## 4. Публичные vs секретные переменные

Фреймворки различают публичные и секретные env-переменные по **префиксу имени**. Публичные попадают в client bundle; секретные — доступны только на сервере / в build-time environment.

| Фреймворк | Публичный префикс | Всё остальное |
|---|---|---|
| Next.js | `NEXT_PUBLIC_*` | Доступно только на сервере (API routes, Server Components). |
| Vite | `VITE_*` | Недоступно в клиенте. |
| Remix | `PUBLIC_*` (по конвенции; нет автоматики) | Ручное управление. |
| Astro | `PUBLIC_*` | Недоступно в клиенте. |
| Create React App (legacy) | `REACT_APP_*` | Всё. Нет secret-разделения. **SHOULD** мигрировать. |

### Правила

- **MUST** — если переменная имеет публичный префикс, её значение — **публичное**. Оно видно любому пользователю приложения через devtools / `view-source` / bundle. Секретам там не место.
- **MUST NOT** — называть секретную переменную с публичным префиксом «потому что иначе фреймворк не видит». Если фреймворк не даёт её на клиенте — значит и не должен. Ищите другой механизм (server-side API, proxy).
- **MUST NOT** — инлайнить серверную переменную в клиентский компонент (`process.env.DB_PASSWORD` в React Client Component) — bundler резолвит её в statically-baked значение, и секрет окажется в bundle.

### Проверка утечки в bundle

Перед релизом:

```bash
# Build production bundle and grep for known secret patterns.
npm run build
grep -rE '(sk_live_|AKIA[0-9A-Z]{16}|AIzaSy|xoxb-)' dist/ build/ .next/
```

Secret scanning на уровне CI (GitHub Secret Scanning, Gitleaks, TruffleHog) **SHOULD** быть настроен на каждый PR.

---

## 5. Процедура при утечке

Если секрет **всё-таки** попал в commit / logs / скриншот / публичное место:

### Шаг 1 — Немедленная ротация (минуты)

- **MUST** ротировать секрет (сменить пароль, пересоздать токен, revoke API key) **прямо сейчас**. Не ждите рефиша истории, не ждите ревью, не ждите утра — ротация **первична**.
- Проверить logs / dashboards провайдера секрета на факт использования в окне между коммитом и ротацией. Предполагать худшее.

### Шаг 2 — Чистка git-истории

Если секрет коммитнут:

```bash
# git-filter-repo is the preferred tool over BFG for new repos (active maintenance).
git filter-repo --replace-text <(echo 'OLD_SECRET==>REDACTED')

# Force-push в main (MUST — с уведомлением всех контрибьюторов).
git push --force-with-lease origin main
```

- **MUST** уведомить всех контрибьюторов, что им нужно переклонировать репо.
- **MUST** понимать: если секрет коммитнут в public-репо, он **уже утечен** для сканеров (GitHub dorking, автоматические боты). Чистка истории — запоздалая мера.

### Шаг 3 — Уведомление

- **MUST** уведомить ops / security / incident response в течение 1 часа.
- **MUST** открыть private incident issue (не на GitHub public) с временем обнаружения, временем утечки, объёмом (какой секрет, что он даёт), действиями, статусом ротации.

### Шаг 4 — Post-mortem (3 рабочих дня)

- **MUST** — post-mortem issue с:
  - root cause (как секрет попал);
  - timeline (от коммита до ротации);
  - impact (что мог бы сделать атакующий);
  - preventive actions (добавить pre-commit secret-scan, улучшить code review, обучение).
- **SHOULD** — preventive actions превратить в PR'ы в течение 2 недель.

### Что **MUST NOT** делать

- **MUST NOT** — «удалить в следующем коммите» без ротации. Секрет остаётся в истории и доступен любому клонировавшему репо.
- **MUST NOT** — умалчивать инцидент. Security-инциденты, сокрытые от команды, повторяются.
- **MUST NOT** — откладывать ротацию до «подходящего момента». Каждая минута — увеличение окна эксплуатации.

---

## 6. Runtime-правила

- Секреты **MUST** загружаться из environment, не хардкодиться. Даже для скриптов разработки.
- Секреты **MUST NOT** логироваться. При сериализации объектов с секретами — использовать redaction.
- Секреты **MUST NOT** попадать в error-messages, отправляемые клиенту / Sentry / analytics.
- Для дев-окружения **SHOULD** использовать секрет-менеджер (1Password CLI, AWS Secrets Manager, Vault) а не файл `.env.local` с реальными значениями у каждого разработчика.

### Redaction в логах

```ts
function redact(obj: Record<string, unknown>): Record<string, unknown> {
  const SENSITIVE = ["password", "token", "secret", "apiKey", "authorization"];
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = SENSITIVE.some((s) => k.toLowerCase().includes(s.toLowerCase())) ? "[REDACTED]" : v;
  }
  return out;
}
```

Это минимальный пример; production-решение **SHOULD** использовать библиотеку (`pino-noir`, `winston`-плагины, custom serializers).

---

## 7. Запрещённые паттерны

- **Секрет в `const` на клиенте** (`const API_KEY = "sk_live_..."`) — **MUST NOT**.
- **Секрет в query-string URL** (`fetch('/api?key=sk_live_...')`) — **MUST NOT**. URLs пишутся в proxy-логи, referrer-заголовки, browser history.
- **Секрет в `localStorage` / `sessionStorage` / IndexedDB** — **MUST NOT**. XSS в приложении = мгновенное раскрытие. Session tokens — в `httpOnly` cookies на стороне сервера.
- **Секрет в `document.cookie` без `httpOnly`** — **MUST NOT** для значений, не требующих чтения JS-кодом.
- **«Временный» секрет в коде для отладки** — **MUST NOT**. Ревью пропустит, бот GitHub отсканирует, утечка состоялась.
- **Secret в автотестах, хранящихся в репо** — **MUST NOT**. Тесты используют фикстуры с заведомо-фейковыми значениями.
- **Обход hooks, ловящих секреты** (`git commit --no-verify`) — **MUST NOT** без письменного разрешения security lead'а (и даже тогда — с обоснованием в теле коммита).
