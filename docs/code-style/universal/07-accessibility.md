# 07 — Accessibility (universal)

> Оглавление: [`../README.md`](../README.md). Профиль стека: [`../PROFILE.md`](../PROFILE.md).

Правила доступности React-приложений. Ориентир — WCAG 2.2 AA + WAI-ARIA 1.2. Применимо ко всем версиям React.

---

## 1. Главный принцип

> **No ARIA is better than bad ARIA. Semantic HTML > ARIA.**

Большинство кастомных компонентов можно построить на нативных HTML-элементах, которые **уже** доступны. Добавлять ARIA — только когда нативного эквивалента нет.

---

## 2. Semantic HTML

- Интерактивный элемент **MUST** использовать нативный тег:
  - Кнопка → `<button>` (не `<div onClick={...}>`).
  - Ссылка → `<a href="...">`.
  - Форма → `<form>`.
  - Поле ввода → `<input>` / `<textarea>` / `<select>`.
  - Группировка → `<fieldset>` + `<legend>`.
- Структурные теги — `<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>`, `<section>`, `<article>`.
- Списки — `<ul>`/`<ol>`/`<li>`.
- Таблицы — `<table>` с `<thead>`/`<tbody>`/`<th scope="col">`.

✓ Корректно:
```tsx
<button type="button" onClick={handleDelete} aria-label="Delete item">
  <TrashIcon aria-hidden="true" />
</button>
```

✗ Некорректно:
```tsx
<div role="button" tabIndex={0} onClick={handleDelete}>   {/* ✗ */}
  <TrashIcon />
</div>
```

---

## 3. Кнопки

- `<button>` **MUST** иметь `type` (`button` / `submit` / `reset`). По умолчанию `submit` — часто не то, что нужно.
- Иконочная кнопка **MUST** иметь `aria-label` или `aria-labelledby`.
- Иконки внутри кнопок с текстом **MUST** быть `aria-hidden="true"`.
- Кликабельный div / span / `<a>` без `href` как «кнопка» — **MUST NOT**.

✓ Корректно:
```tsx
<button type="submit" aria-label="Submit form">
  <CheckIcon aria-hidden="true" />
</button>
```

---

## 4. Ссылки vs кнопки

- Перемещает по маршруту/URL → `<a href="...">` (или `<Link>` роутера).
- Вызывает действие → `<button>`.

---

## 5. Формы

(Подробнее — в [`05-forms-principles.md`](05-forms-principles.md) раздел 4.)

- Каждый input **MUST** иметь связанный `<label>`.
- `placeholder` **MUST NOT** заменять label.
- Ошибки **MUST** связываться через `aria-describedby` + `role="alert"`.
- `required` — нативный атрибут.
- `aria-invalid="true"` при ошибочном состоянии.
- `autoComplete` — корректное значение из [HTML spec](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/autocomplete).

---

## 6. Клавиатурная навигация

- Весь интерактив **MUST** быть доступен с клавиатуры.
- Порядок фокуса **MUST** соответствовать визуальному порядку.
- Видимый focus indicator — **MUST** (Tailwind: `focus-visible:outline-2 focus-visible:outline-offset-2`).
- `outline: none` без альтернативы — **MUST NOT**.
- `tabIndex > 0` — **MUST NOT** (ломает естественный порядок). `0` / `-1` допустимы для программного управления.

### Клавиатурные контракты для типовых виджетов

| Компонент | Клавиши |
|---|---|
| Button | Enter, Space |
| Link | Enter |
| Checkbox | Space |
| Radio group | Стрелки (navigate), Space (select) |
| Select/Combobox | Стрелки, Enter, Esc |
| Dialog/Modal | Esc (close), focus trap внутри |
| Menu | Стрелки, Enter, Esc |
| Tabs | Стрелки (navigate), Home/End |

Для нетривиальных виджетов **SHOULD** использовать готовые паттерны: Radix UI / React Aria / headless-библиотеки. Они гарантируют корректные клавиатурные контракты.

---

## 7. Фокус-менеджмент

- При открытии модалки фокус **MUST** перемещаться в неё и **запираться** (focus trap). При закрытии — возвращаться на триггер.
- После навигации в SPA — фокус **SHOULD** перемещаться на `<main>` (через `tabIndex={-1}` + `focus()`).
- `autoFocus` — **SHOULD NOT**, кроме случаев, когда пользователь явно ожидает (первое поле формы входа).

---

## 8. ARIA — когда и как

- ARIA **MAY** применяться для компонентов без HTML-эквивалента: таб-контрол, комбобокс, tree, grid, drag-and-drop.
- **MUST** следовать [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/).
- **MUST NOT** менять роль нативного элемента без крайней необходимости (`<button role="link">` — почти всегда ошибка).
- `aria-*` атрибуты в JSX — kebab-case (как в HTML).

### Часто используемые ARIA

| Атрибут | Назначение |
|---|---|
| `aria-label` | Доступное имя без видимого текста |
| `aria-labelledby` | Имя берётся из другого элемента по id |
| `aria-describedby` | Дополнительное описание |
| `aria-expanded` | Раскрыто/свёрнуто |
| `aria-hidden` | Скрыть от assistive tech |
| `aria-live` | Регион, объявляющий изменения (`polite` / `assertive`) |
| `aria-busy` | Элемент в процессе загрузки |
| `aria-current` | Текущая страница/шаг/элемент |

---

## 9. Изображения

- Содержательные изображения **MUST** иметь осмысленный `alt`.
- Декоративные изображения — `alt=""` (или `role="presentation"`).
- Информативные изображения **SHOULD** быть `<img>`, не `background-image`.

---

## 10. Цвет и контраст

- Текст **MUST** соответствовать WCAG AA: **4.5:1** для обычного, **3:1** для крупного.
- Цвет **MUST NOT** быть единственным каналом информации.

---

## 11. Motion и `prefers-reduced-motion`

- Анимации > 250 мс **MUST** уважать `prefers-reduced-motion`.
- Горизонтальные движения / zoom / parallax **MUST** отключаться при `prefers-reduced-motion: reduce`.

---

## 12. Screen reader announcements

```tsx
<div role="status" aria-live="polite">
  {isSaving ? "Saving…" : saved ? "Saved" : null}
</div>
```

- `polite` — по умолчанию.
- `assertive` — только для критичных, редких прерываний.

---

## 13. Инструменты проверки

### Автоматические

- `eslint-plugin-jsx-a11y` — **MUST** в линтинге.
- `axe-core` / `@axe-core/react` / `vitest-axe` — автоматические a11y-тесты.

### Ручные

- Прогон без мыши.
- Screen reader: NVDA (Windows), VoiceOver (macOS), Orca (Linux).
- Zoom до 200%.

---

## 14. Антипаттерны

- `<div onClick={}>` как кнопка — **MUST NOT**.
- `role="button"` с ручным Enter/Space, когда подходит `<button>` — **MUST NOT**.
- `placeholder` вместо `<label>` — **MUST NOT**.
- `outline: none` без альтернативы — **MUST NOT**.
- Только цвет для статуса — **MUST NOT**.
- `tabIndex > 0` — **MUST NOT**.
- `aria-label` на `<div>` с видимым текстом — избыточно, создаёт двойное объявление.
- `aria-hidden` на фокусируемых элементах — **MUST NOT**.
