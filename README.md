# ⚡ Thunderstore Fast Archive

Веб-инструмент, который собирает валидный **Thunderstore**-архив мода за минуту: кидаешь `.dll`, заполняешь поля, смотришь живое превью страницы мода — и скачиваешь готовый `Author-Mod-1.0.0.zip`.

Всё работает **полностью в браузере**: ни один файл не уходит на сервер (zip собирается через JSZip).

## Возможности

- 🎮 **Пресеты игр в один клик** — BONELAB, BONEWORKS, Lethal Company, R.E.P.O., Valheim, Risk of Rain 2, «другая игра» и «без загрузчика». Пресет подставляет путь установки, зависимости загрузчика и шаблон README
- 🧩 **Drag & drop** любых файлов и целых папок (`.dll`, конфиги, бандлы)
- 📂 Выбор места установки внутри архива: `BepInEx/plugins`, корень, `BepInEx/patchers` или свой путь
- 📝 Форма `manifest.json` с живой валидацией по правилам Thunderstore
- 🔗 Зависимости с пресетами (BepInEx, R2API, LethalLib, Jotunn…) и проверкой формата `Namespace-Name-1.0.0`
- 🖼️ Иконка: загрузка картинки с авто-кропом до **ровно 256×256 PNG**, либо генератор иконки из названия
- 📄 Редактор `README.md` / `CHANGELOG.md` с шаблонами и markdown-превью
- 👀 Превью: страница мода, карточка в списке, дерево содержимого zip, готовый `manifest.json`
- 💾 Автосохранение профиля в `localStorage` + бамп версии в один клик

## Пресеты игр

| Игра | Загрузчик | Папка по умолчанию | Базовые зависимости |
| --- | --- | --- | --- |
| BONELAB | MelonLoader | `Mods/` | `LavaGang-MelonLoader-0.6.6`, `gnonme-BoneLib-3.1.3` |
| BONEWORKS | MelonLoader 0.5.7 | `Mods/` | `LavaGang-MelonLoader-0.5.7` |
| Lethal Company | BepInEx 5 | `BepInEx/plugins/` | `BepInEx-BepInExPack-5.4.2100` |
| R.E.P.O. | BepInEx 5 | `BepInEx/plugins/` | `BepInEx-BepInExPack-5.4.2100` |
| Valheim | BepInEx 5 | `BepInEx/plugins/` | `denikson-BepInExPack_Valheim-5.4.2202` |
| Risk of Rain 2 | BepInEx 5 | `BepInEx/plugins/` | `bbepis-BepInExPack-5.4.2113` |
| Без загрузчика | — | корень zip | — |

Для MelonLoader доступны `Mods/`, `Plugins/`, `UserLibs/`, `UserData/` — менеджер модов разложит их в `Mods/<Author-ModName>/` и `UserData/<Author-ModName>/`. Для BepInEx — `BepInEx/plugins`, `BepInEx/patchers`, `BepInEx/config`. Версии зависимостей можно поправить вручную — пресет лишь подставляет актуальные на момент сборки.

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

## GitHub Pages

В репозитории лежит workflow `.github/workflows/deploy-pages.yml`, который публикует сайт на GitHub Pages при пуше.

Один раз нужно включить Pages вручную: **Settings → Pages → Build and deployment → Source: GitHub Actions**. После этого сайт будет доступен по адресу `https://itzhanchik.github.io/ThunderStoreFastArchive/`, а каждый пуш в `main` будет его обновлять.

## Структура

```
index.html   — разметка
styles.css   — тема и layout
app.js       — логика: файлы, валидация, иконка, превью, сборка zip
```

Внешние библиотеки подключаются с CDN: [JSZip](https://stuk.github.io/jszip/), [marked](https://marked.js.org/), [DOMPurify](https://github.com/cure53/DOMPurify).
