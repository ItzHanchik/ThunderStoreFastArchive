# ⚡ Thunderstore Fast Archive

Веб-инструмент, который собирает валидный **Thunderstore**-архив мода за минуту: кидаешь `.dll`, заполняешь поля, смотришь живое превью страницы мода — и скачиваешь готовый `Author-Mod-1.0.0.zip`.

Всё работает **полностью в браузере**: ни один файл не уходит на сервер (zip собирается через JSZip).

## Возможности

- 🧩 **Drag & drop** любых файлов и целых папок (`.dll`, конфиги, бандлы)
- 📂 Выбор места установки внутри архива: `BepInEx/plugins`, корень, `BepInEx/patchers` или свой путь
- 📝 Форма `manifest.json` с живой валидацией по правилам Thunderstore
- 🔗 Зависимости с пресетами (BepInEx, R2API, LethalLib, Jotunn…) и проверкой формата `Namespace-Name-1.0.0`
- 🖼️ Иконка: загрузка картинки с авто-кропом до **ровно 256×256 PNG**, либо генератор иконки из названия
- 📄 Редактор `README.md` / `CHANGELOG.md` с шаблонами и markdown-превью
- 👀 Превью: страница мода, карточка в списке, дерево содержимого zip, готовый `manifest.json`
- 💾 Автосохранение профиля в `localStorage` + бамп версии в один клик

## Правила Thunderstore, которые проверяет инструмент

Валидный пакет — это zip, в корне которого лежат (регистр важен!):

| Файл | Требование |
| --- | --- |
| `icon.png` | PNG, ровно 256×256 |
| `README.md` | markdown, UTF-8, рендерится на странице мода |
| `manifest.json` | метаданные пакета, UTF-8 JSON |
| `CHANGELOG.md` | опционально |

Поля `manifest.json`:

| Ключ | Правило |
| --- | --- |
| `name` | только `a-z A-Z 0-9 _`, без пробелов, до 128 символов |
| `description` | максимум 250 символов |
| `version_number` | строго `Major.Minor.Patch` (semver), например `1.3.2` |
| `dependencies` | список строк `Namespace-Name-1.0.0` |
| `website_url` | URL или пустая строка |

Максимальный размер пакета — ~5 ГБ (мягкий лимит).

Источники: [Thunderstore Wiki — Creating a Package](https://wiki.thunderstore.io/mods/creating-a-package), [Package Format Docs](https://thunderstore.io/package/create/docs/).

## Запуск локально

Это статический сайт без сборки — достаточно любого http-сервера:

```bash
python3 -m http.server 8000
# открыть http://localhost:8000
```

## Структура

```
index.html   — разметка
styles.css   — тема и layout
app.js       — логика: файлы, валидация, иконка, превью, сборка zip
```

Внешние библиотеки подключаются с CDN: [JSZip](https://stuk.github.io/jszip/), [marked](https://marked.js.org/), [DOMPurify](https://github.com/cure53/DOMPurify).
