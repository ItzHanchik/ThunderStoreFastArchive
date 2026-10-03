/* ============================================================
   Thunderstore Fast Archive — i18n
   English is the default language, Russian is the second one.
   The choice is stored in localStorage (tsfa.lang) and applied
   before the first paint by an inline bootstrap in index.html.
   ============================================================ */
(() => {
  'use strict';

  const STORAGE_KEY = 'tsfa.lang';
  const DEFAULT_LANG = 'en';
  const SUPPORTED = ['en', 'ru'];

  // ------------------------------------------------------------
  // Dictionaries. Keys must mirror each other 1:1.
  // Values can be strings, HTML fragments (see data-i18n-html)
  // or arrays of plural forms: EN [one, many], RU [one, few, many].
  // ------------------------------------------------------------
  const DICT = {
    en: {
      meta: {
        title: 'Thunderstore Fast Archive — build a mod package in a minute',
        description: 'Build a valid Thunderstore mod package right in your browser: drop the DLLs, fill in the form, preview the mod page and download a ready zip.',
      },
      brand: {
        title: 'Thunderstore <span>Fast Archive</span>',
        sub: 'Assemble a valid mod package in a minute — right in your browser',
      },
      ui: {
        privacy: '\u{1F512} 100% local',
        privacyTitle: 'No file ever leaves your browser',
        importZip: '\u{1F4E5} Import zip',
        reset: 'Reset',
        rules: 'Publishing rules \u2197',
        langLabel: 'Interface language',
        themeToDark: 'Switch to dark theme',
        themeToLight: 'Switch to light theme',
      },
      readiness: {
        title: 'Package readiness',
        hint: 'Complete all four steps to publish your mod.',
        files: 'Files',
        manifest: 'Manifest',
        icon: 'Icon',
        readme: 'Readme',
        count: '{done} of {total}',
        ready: 'Ready to publish',
        stepFiles: 'Mod files',
        stepManifest: 'Manifest',
        stepIcon: 'Icon 256\u00d7256',
        stepReadme: 'README',
      },
      sections: {
        game: '1. Game & loader',
        files: '2. Mod files',
        filesHint: 'DLL and everything else',
        manifest: '3. Manifest',
        manifestHint: 'manifest.json',
        icon: '4. Icon',
        iconHint: 'icon.png \u00b7 exactly 256\u00d7256',
        docs: '5. README & CHANGELOG',
        docsHint: 'markdown',
        validation: 'Validation',
        preview: 'Preview',
      },
      game: {
        searchPh: '\u{1F50D} Search a game: bonelab, lethal, valheim\u2026',
        countAll: '{n} {word}',
        countAllWord: ['game', 'games'],
        countFiltered: '{n} of {m}',
        none: 'Nothing found. Pick the \u201cOther game\u201d profile — it works for anything.',
        note: 'Choosing a game fills in the right install folder, dependencies and README template.',
        community: 'Current dependency versions live on the community page:',
        toast: 'Profile: {game}',
      },
      files: {
        dropTitle: 'Drop your <b>.dll</b> here (or any files / a folder)',
        dropSub: 'or click to choose \u00b7 a ready mod <b>.zip</b> is imported as a whole package',
        pickFolder: '\u{1F4C1} Choose folder',
        none: 'No files yet',
        count: '{n} {word} \u00b7 {size}',
        word: ['file', 'files'],
        remove: 'Remove',
      },
      install: {
        label: 'Where to put the files inside the archive',
        help: 'Mod managers (r2modman / Gale / Thunderstore App) unpack files according to these rules.',
        customPh: 'e.g. BepInEx/plugins/MyMod',
      },
      manifest: {
        author: 'Author / namespace',
        authorPh: 'YourTeamName',
        authorHelp: 'The name of your team on Thunderstore. It is a part of the archive file name.',
        name: 'Mod name',
        namePh: 'My_Awesome_Mod',
        nameHelp: 'Only <code>a-z A-Z 0-9 _</code>, no spaces, up to 128 characters.',
        desc: 'Short description',
        descPh: 'What the mod does — in one line',
        version: 'Version',
        versionPh: '1.0.0',
        bumpPatch: '+patch',
        bumpPatchTitle: 'Bump the patch version',
        bumpMinor: '+minor',
        bumpMinorTitle: 'Bump the minor version',
        website: 'Website / repository',
        deps: 'Dependencies',
        depPh: 'Namespace-Name-1.0.0',
        addDep: 'Add',
        depHelp: 'Strict format: <code>Namespace-Name-Major.Minor.Patch</code>. The mod manager installs these automatically.',
        depPresetsNone: 'No presets for this profile — add dependencies manually.',
      },
      icon: {
        drop: '\u{1F5BC}\u{FE0F} Drop an image or click',
        dropSub: 'PNG / JPG / WEBP — we crop and squeeze it to 256\u00d7256',
        genLabel: 'No image? Generate one from the mod name:',
        genBtn: '\u{1F3B2} Generate icon',
        errImage: 'An image file is required',
        errRead: 'Could not read the image',
      },
      docs: {
        readme: 'README.md',
        changelog: 'CHANGELOG.md',
        optional: 'optional',
        insertTemplate: 'Insert template',
        include: 'Put CHANGELOG into the archive',
        englishBadge: 'English only',
        englishTip: 'Mod pages on Thunderstore are read all over the world, so the README.md and CHANGELOG.md templates are always generated in English — switching the interface language never overwrites them.',
      },
      validation: {
        download: '\u2b07\ufe0f Download archive',
        downloading: '\u23f3 Packing the archive\u2026',
        downloadingWait: 'one moment',
        copyManifest: 'Copy manifest.json',
        saveProfile: 'Save profile',
        statusOk: 'Ready to upload',
        statusErr: '{n} error(s)',
        statusWarn: '{n} warning(s)',
        allGood: 'Everything looks good.',
      },
      preview: {
        page: 'Mod page',
        card: 'Card',
        tree: 'Zip contents',
        json: 'manifest.json',
        cardHint: 'This is how the mod looks in the Thunderstore listing and in mod managers.',
        readmeEmpty: '*README is empty*',
        approx: '\u2248 {size}',
      },
      footer: {
        privacy: 'Files never leave the browser — the archive is built locally with JSZip.',
        wiki: 'Thunderstore Wiki',
        validator: 'Manifest Validator',
      },
      toast: {
        confirmImport: 'Import \u201c{file}\u201d as a ready package?\n\nOK — parse the archive and fill in the form.\nCancel — just add the zip as a payload file.',
        noJsZip: 'JSZip is still loading, try again in a moment',
        importStart: 'Reading the archive\u2026',
        notZip: 'This is not a zip archive',
        noManifest: 'No manifest.json inside — this is not a Thunderstore package',
        manifestBroken: 'manifest.json is corrupted: {msg}',
        imported: 'Imported: {name} \u00b7 {n} {word}',
        template: 'Template inserted',
        profileSaved: 'Profile saved in this browser',
        manifestCopied: 'manifest.json copied',
        clipboardFail: 'Clipboard is unavailable',
        zipDone: 'Done: {name} ({size})',
        zipFail: 'Failed to build the archive: {msg}',
        jsMissing: 'Libraries are still loading, try again',
        resetConfirm: 'Clear all fields and files?',
        theme: 'Theme: {theme}',
        lang: 'Language: {lang}',
      },
      loaders: {
        melonloader: 'MelonLoader',
        bepinex: 'BepInEx',
        northstar: 'Northstar',
        none: 'no loader',
      },
      paths: {
        root: 'Archive root — next to manifest.json',
        custom: 'Custom folder\u2026',
        bepinex: {
          plugins: 'BepInEx/plugins/ — regular plugin (recommended)',
          patchers: 'BepInEx/patchers/ — preloader patcher',
          config: 'BepInEx/config/ — ready-made configs',
        },
        melonloader: {
          mods: 'Mods/ — a regular MelonLoader mod (recommended)',
          plugins: 'Plugins/ — a MelonLoader plugin (loads before mods)',
          userlibs: 'UserLibs/ — helper libraries',
          userdata: 'UserData/ — assets, configs, palettes',
        },
        northstar: {
          mods: 'mods/ — the Northstar mod folder',
        },
      },
      errs: {
        noAuthor: 'Set an author / namespace — the package name cannot be built without it.',
        badAuthor: 'The namespace may only contain a-z A-Z 0-9 and _ (no spaces, no dashes).',
        noName: 'Set the mod name (the name field of the manifest).',
        badName: 'The name may only contain a-z A-Z 0-9 and _ . Replace spaces with _ .',
        longName: 'The name is longer than 128 characters.',
        noDesc: 'A description is required (up to 250 characters).',
        longDesc: 'The description is longer than 250 characters.',
        noVersion: 'Set a version.',
        badVersion: 'The version must be exactly Major.Minor.Patch, e.g. 1.0.0 (no \u201cv\u201d, no fourth number, no leading zeros).',
        badWebsite: 'website_url must start with http:// or https:// (or stay empty).',
        badDeps: 'Invalid dependencies: {list} — the format is Namespace-Name-1.0.0',
        dupDeps: 'There are duplicate dependencies.',
        noIcon: 'No icon.png yet.',
        noReadme: 'README.md is empty — it is shown on the mod page.',
        shortReadme: 'The README is very short. Add a description, installation and configuration notes — mods like that get downloaded more often.',
        noFiles: 'No mod files added — the archive will contain metadata only (fine for a modpack).',
        noDll: 'There is no .dll among the files — double-check what you uploaded.',
        customPath: 'A custom folder is selected, but the path is empty.',
        wrongPathMelon: 'The game uses MelonLoader while the install path is a BepInEx one — most likely the mod will not load.',
        wrongPathBep: 'The game uses BepInEx while a MelonLoader folder is selected — check the install path.',
        tooBig: 'The total size is above 5 GB — that is the Thunderstore limit.',
        nameClash: 'A root file has a reserved name (manifest.json / README.md / icon.png) — it will be overwritten.',
        melonDep: 'For {game} the dependencies usually include LavaGang-MelonLoader — otherwise the manager will not install the loader.',
        bepDep: 'For {game} the dependencies usually need a BepInExPack.',
        noDeps: 'No dependencies listed — double-check that the mod works on its own.',
        valid: 'Package is valid: {name}.zip',
      },
      games: {
        bonelab: { note: 'MelonLoader unpacks content into <code>Mods/&lt;Author-ModName&gt;/</code>. Code mods go to <code>Mods/</code>; assets and palettes go to <code>UserData/</code>.' },
        boneworks: { note: 'BONEWORKS mods are built for MelonLoader <b>0.5.7</b> — newer versions break compatibility.' },
        'lethal-company': { note: 'Classic BepInEx 5: the <code>.dll</code> goes into <code>BepInEx/plugins</code>.' },
        repo: { note: 'BepInEx 5, plugins go into <code>BepInEx/plugins</code>.' },
        'content-warning': { note: 'BepInEx 5, plugins go into <code>BepInEx/plugins</code>.' },
        peak: { note: 'BepInEx 5, plugins go into <code>BepInEx/plugins</code>.' },
        ultrakill: { note: 'BepInEx 5. Weapon and level mods usually need extra API mods.' },
        riskofrain2: { note: 'BepInEx + R2API is the standard Risk of Rain 2 stack.' },
        valheim: { note: 'Valheim has its own BepInEx pack by denikson.' },
        'v-rising': { note: 'V Rising uses BepInEx 6 (Il2Cpp) — the <code>BepInExPack_V_Rising</code> package.' },
        gtfo: { note: 'BepInEx 6 (Il2Cpp). Check the GTFO community package.' },
        'dyson-sphere-program': { note: 'BepInEx 5, plugins go into <code>BepInEx/plugins</code>.' },
        subnautica: { note: 'Subnautica has its own pack, <code>tobey-BepInExPack_Subnautica</code> — grab the current version from its package page.' },
        outward: { note: 'BepInEx 5, plugins go into <code>BepInEx/plugins</code>.' },
        rounds: { note: 'Almost all ROUNDS mods build on top of UnboundLib.' },
        muck: { note: 'BepInEx 5, plugins go into <code>BepInEx/plugins</code>.' },
        timberborn: { note: 'BepInEx 5, plugins go into <code>BepInEx/plugins</code>.' },
        inscryption: { note: 'BepInEx 5. Card mods usually need the community API mod.' },
        'cult-of-the-lamb': { note: 'BepInEx 5, plugins go into <code>BepInEx/plugins</code>.' },
        'sons-of-the-forest': { note: 'BepInEx 5, plugins go into <code>BepInEx/plugins</code>.' },
        raft: { note: 'BepInEx 5, plugins go into <code>BepInEx/plugins</code>.' },
        h3vr: { note: 'H3VR has its own BepInEx pack and the Deli/Sodalite system — check the community.' },
        'gorilla-tag': { note: 'BepInEx 5 for PCVR. Quest builds are different.' },
        'among-us': { note: 'Among Us uses BepInEx 6 Il2Cpp, package <code>BepInExPack_AmongUs</code>.' },
        'deep-rock-galactic': { note: 'DRG has its own mod loader: files go to the archive root.' },
        palworld: { note: 'A UE5 game: pak/ue4ss mods go to the archive root.' },
        'schedule-i': { note: 'Schedule I runs on MelonLoader: code mods go to <code>Mods/</code>.' },
        rumble: { note: 'MelonLoader: code mods go to <code>Mods/</code>, assets go to <code>UserData/</code>.' },
        'hard-bullet': { note: 'MelonLoader. <code>.npc</code> files have their own install rule in the mod manager.' },
        'backpack-hero': { note: 'MelonLoader: code mods go to <code>Mods/</code>.' },
        'patch-quest': { note: 'MelonLoader: code mods go to <code>Mods/</code>.' },
        northstar: { note: 'Northstar expects the <code>mods/&lt;Author&gt;.&lt;ModName&gt;/</code> structure with its own <code>mod.json</code>.' },
        other: { note: 'A generic BepInEx profile. Dependencies and install path can be set manually.' },
        raw: { note: 'A modpack or an asset pack: files go to the archive root.' },
      },
    },

    ru: {
      meta: {
        title: 'Thunderstore Fast Archive — собери мод-пакет за минуту',
        description: 'Собери валидный Thunderstore-архив прямо в браузере: закинь DLL, заполни поля, посмотри превью страницы мода и скачай готовый zip.',
      },
      brand: {
        title: 'Thunderstore <span>Fast Archive</span>',
        sub: 'Собери валидный мод-пакет за минуту — прямо в браузере',
      },
      ui: {
        privacy: '\u{1F512} 100% локально',
        privacyTitle: 'Ни один файл не уходит на сервер',
        importZip: '\u{1F4E5} Импорт zip',
        reset: 'Сбросить',
        rules: 'Правила публикации \u2197',
        langLabel: 'Язык интерфейса',
        themeToDark: 'Включить тёмную тему',
        themeToLight: 'Включить светлую тему',
      },
      readiness: {
        title: 'Готовность пакета',
        hint: 'Пройди все четыре шага, чтобы опубликовать мод.',
        files: 'Файлы',
        manifest: 'Манифест',
        icon: 'Иконка',
        readme: 'Readme',
        count: '{done} из {total}',
        ready: 'Готово к публикации',
        stepFiles: 'Файлы мода',
        stepManifest: 'Манифест',
        stepIcon: 'Иконка 256\u00d7256',
        stepReadme: 'README',
      },
      sections: {
        game: '1. Игра и загрузчик',
        files: '2. Файлы мода',
        filesHint: 'DLL и всё остальное',
        manifest: '3. Манифест',
        manifestHint: 'manifest.json',
        icon: '4. Иконка',
        iconHint: 'icon.png \u00b7 ровно 256\u00d7256',
        docs: '5. README и CHANGELOG',
        docsHint: 'markdown',
        validation: 'Проверка',
        preview: 'Превью',
      },
      game: {
        searchPh: '\u{1F50D} Поиск игры: bonelab, lethal, valheim\u2026',
        countAll: '{n} {word}',
        countAllWord: ['игра', 'игры', 'игр'],
        countFiltered: '{n} из {m}',
        none: 'Ничего не нашлось. Возьми профиль «Другая игра» — он универсальный.',
        note: 'Выбор игры подставит правильную папку установки, зависимости и шаблон README.',
        community: 'Актуальные версии зависимостей — на странице коммьюнити:',
        toast: 'Профиль: {game}',
      },
      files: {
        dropTitle: 'Перетащи сюда <b>.dll</b> (или любые файлы / папку)',
        dropSub: 'или нажми, чтобы выбрать \u00b7 готовый <b>.zip</b> мода импортируется целиком',
        pickFolder: '\u{1F4C1} Выбрать папку',
        none: 'Файлов нет',
        count: '{n} {word} \u00b7 {size}',
        word: ['файл', 'файла', 'файлов'],
        remove: 'Убрать',
      },
      install: {
        label: 'Куда класть файлы внутри архива',
        help: 'Менеджеры модов (r2modman / Gale / Thunderstore App) раскладывают файлы по этим правилам.',
        customPh: 'например: BepInEx/plugins/MyMod',
      },
      manifest: {
        author: 'Автор / namespace',
        authorPh: 'YourTeamName',
        authorHelp: 'Как называется твоя команда на Thunderstore. Входит в имя файла архива.',
        name: 'Имя мода',
        namePh: 'My_Awesome_Mod',
        nameHelp: 'Только <code>a-z A-Z 0-9 _</code>, без пробелов, до 128 символов.',
        desc: 'Короткое описание',
        descPh: 'Что делает мод — одной строкой',
        version: 'Версия',
        versionPh: '1.0.0',
        bumpPatch: '+patch',
        bumpPatchTitle: 'Увеличить patch',
        bumpMinor: '+minor',
        bumpMinorTitle: 'Увеличить minor',
        website: 'Сайт / репозиторий',
        deps: 'Зависимости',
        depPh: 'Namespace-Name-1.0.0',
        addDep: 'Добавить',
        depHelp: 'Формат строгий: <code>Namespace-Name-Major.Minor.Patch</code>. Эти моды менеджер поставит автоматически.',
        depPresetsNone: 'Для этого профиля пресетов нет — добавь зависимости вручную.',
      },
      icon: {
        drop: '\u{1F5BC}\u{FE0F} Перетащи картинку или нажми',
        dropSub: 'PNG / JPG / WEBP — обрежем и ужмём до 256\u00d7256',
        genLabel: 'Нет картинки? Сгенерируем из названия:',
        genBtn: '\u{1F3B2} Сгенерировать иконку',
        errImage: 'Нужен файл-картинка',
        errRead: 'Не удалось прочитать картинку',
      },
      docs: {
        readme: 'README.md',
        changelog: 'CHANGELOG.md',
        optional: 'опц.',
        insertTemplate: 'Вставить шаблон',
        include: 'Класть CHANGELOG в архив',
        englishBadge: 'English only',
        englishTip: 'Страницу мода на Thunderstore читают люди со всего мира, поэтому шаблоны README.md и CHANGELOG.md всегда генерируются на английском — смена языка интерфейса их не перезаписывает.',
      },
      validation: {
        download: '\u2b07\ufe0f Скачать архив',
        downloading: '\u23f3 Собираю архив\u2026',
        downloadingWait: 'подожди секунду',
        copyManifest: 'Копировать manifest.json',
        saveProfile: 'Сохранить профиль',
        statusOk: 'Готово к загрузке',
        statusErr: '{n} ошибк(и)',
        statusWarn: '{n} замечани(я)',
        allGood: 'Всё в порядке.',
      },
      preview: {
        page: 'Страница мода',
        card: 'Карточка',
        tree: 'Содержимое zip',
        json: 'manifest.json',
        cardHint: 'Так мод выглядит в списке на Thunderstore и в менеджере модов.',
        readmeEmpty: '*README пуст*',
        approx: '\u2248 {size}',
      },
      footer: {
        privacy: 'Файлы не покидают браузер — архив собирается локально через JSZip.',
        wiki: 'Thunderstore Wiki',
        validator: 'Manifest Validator',
      },
      toast: {
        confirmImport: 'Импортировать «{file}» как готовый пакет?\n\nОК — разобрать архив и заполнить форму.\nОтмена — просто добавить zip файлом в пакет.',
        noJsZip: 'JSZip ещё не загрузился, попробуй ещё раз',
        importStart: 'Читаю архив\u2026',
        notZip: 'Это не zip-архив',
        noManifest: 'В архиве нет manifest.json — это не Thunderstore-пакет',
        manifestBroken: 'manifest.json повреждён: {msg}',
        imported: 'Импортировано: {name} \u00b7 {n} {word}',
        template: 'Шаблон вставлен',
        profileSaved: 'Профиль сохранён в браузере',
        manifestCopied: 'manifest.json скопирован',
        clipboardFail: 'Буфер обмена недоступен',
        zipDone: 'Готово: {name} ({size})',
        zipFail: 'Ошибка при сборке архива: {msg}',
        jsMissing: 'Библиотеки ещё загружаются, попробуй снова',
        resetConfirm: 'Очистить все поля и файлы?',
        theme: 'Тема: {theme}',
        lang: 'Язык: {lang}',
      },
      loaders: {
        melonloader: 'MelonLoader',
        bepinex: 'BepInEx',
        northstar: 'Northstar',
        none: 'без загрузчика',
      },
      paths: {
        root: 'Корень архива — рядом с manifest.json',
        custom: 'Своя папка\u2026',
        bepinex: {
          plugins: 'BepInEx/plugins/ — обычный плагин (рекомендуется)',
          patchers: 'BepInEx/patchers/ — preloader-патчер',
          config: 'BepInEx/config/ — готовые конфиги',
        },
        melonloader: {
          mods: 'Mods/ — обычный MelonLoader-мод (рекомендуется)',
          plugins: 'Plugins/ — MelonLoader-плагин (грузится раньше мода)',
          userlibs: 'UserLibs/ — вспомогательные библиотеки',
          userdata: 'UserData/ — ассеты, конфиги, палеты',
        },
        northstar: {
          mods: 'mods/ — папка мода Northstar',
        },
      },
      errs: {
        noAuthor: 'Укажи автора / namespace — без него не собрать имя пакета.',
        badAuthor: 'В namespace можно только a-z A-Z 0-9 и _ (без пробелов и дефисов).',
        noName: 'Укажи имя мода (поле name в манифесте).',
        badName: 'В name можно только a-z A-Z 0-9 и _ . Пробел заменяй на _ .',
        longName: 'name длиннее 128 символов.',
        noDesc: 'Описание обязательно (до 250 символов).',
        longDesc: 'Описание длиннее 250 символов.',
        noVersion: 'Укажи версию.',
        badVersion: 'Версия должна быть строго Major.Minor.Patch, например 1.0.0 (без v, без 4-й цифры, без лидирующих нулей).',
        badWebsite: 'website_url должен начинаться с http:// или https:// (или быть пустым).',
        badDeps: 'Некорректные зависимости: {list} — нужен формат Namespace-Name-1.0.0',
        dupDeps: 'В зависимостях есть дубликаты.',
        noIcon: 'Нет иконки icon.png.',
        noReadme: 'README.md пустой — он показывается на странице мода.',
        shortReadme: 'README очень короткий. Добавь описание, установку и настройки — так мод скачивают охотнее.',
        noFiles: 'Не добавлено ни одного файла мода — архив будет только с метаданными (это ок для модпака).',
        noDll: 'Среди файлов нет .dll — проверь, то ли ты загрузил.',
        customPath: 'Выбрана своя папка, но путь не указан.',
        wrongPathMelon: 'Игра на MelonLoader, а путь указан для BepInEx — скорее всего мод не загрузится.',
        wrongPathBep: 'Игра на BepInEx, а выбрана папка MelonLoader — проверь путь установки.',
        tooBig: 'Суммарный размер больше 5 ГБ — лимит Thunderstore.',
        nameClash: 'Один из файлов в корне называется как служебный (manifest.json / README.md / icon.png) — он будет перезаписан.',
        melonDep: 'Для {game} в зависимости обычно добавляют LavaGang-MelonLoader — иначе менеджер не поставит загрузчик.',
        bepDep: 'Для {game} в зависимостях обычно нужен BepInExPack.',
        noDeps: 'Зависимости не указаны — проверь, точно ли мод работает сам по себе.',
        valid: 'Пакет валиден: {name}.zip',
      },
      games: {
        bonelab: { note: 'MelonLoader раскладывает содержимое в <code>Mods/&lt;Author-ModName&gt;/</code>. Код-моды — в <code>Mods/</code>, ассеты и палеты — в <code>UserData/</code>.' },
        boneworks: { note: 'BONEWORKS-моды собраны под MelonLoader <b>0.5.7</b> — более новые версии ломают совместимость.' },
        'lethal-company': { note: 'Классический BepInEx 5: <code>.dll</code> кладётся в <code>BepInEx/plugins</code>.' },
        repo: { note: 'BepInEx 5, плагины в <code>BepInEx/plugins</code>.' },
        'content-warning': { note: 'BepInEx 5, плагины в <code>BepInEx/plugins</code>.' },
        peak: { note: 'BepInEx 5, плагины в <code>BepInEx/plugins</code>.' },
        ultrakill: { note: 'BepInEx 5. Для оружия и уровней обычно нужны дополнительные API-моды.' },
        riskofrain2: { note: 'BepInEx + R2API — стандартный стек RoR2.' },
        valheim: { note: 'У Valheim свой BepInEx-пак от denikson.' },
        'v-rising': { note: 'V Rising использует BepInEx 6 (Il2Cpp) — пак <code>BepInExPack_V_Rising</code>.' },
        gtfo: { note: 'BepInEx 6 (Il2Cpp). Сверься с паком коммьюнити GTFO.' },
        'dyson-sphere-program': { note: 'BepInEx 5, плагины в <code>BepInEx/plugins</code>.' },
        subnautica: { note: 'У Subnautica собственный пак <code>tobey-BepInExPack_Subnautica</code> — возьми актуальную версию со страницы пакета.' },
        outward: { note: 'BepInEx 5, плагины в <code>BepInEx/plugins</code>.' },
        rounds: { note: 'Почти все моды ROUNDS строятся поверх UnboundLib.' },
        muck: { note: 'BepInEx 5, плагины в <code>BepInEx/plugins</code>.' },
        timberborn: { note: 'BepInEx 5, плагины в <code>BepInEx/plugins</code>.' },
        inscryption: { note: 'BepInEx 5. Для карт обычно нужен API-мод коммьюнити.' },
        'cult-of-the-lamb': { note: 'BepInEx 5, плагины в <code>BepInEx/plugins</code>.' },
        'sons-of-the-forest': { note: 'BepInEx 5, плагины в <code>BepInEx/plugins</code>.' },
        raft: { note: 'BepInEx 5, плагины в <code>BepInEx/plugins</code>.' },
        h3vr: { note: 'У H3VR свой BepInEx-пак и система Deli/Sodalite — сверься с коммьюнити.' },
        'gorilla-tag': { note: 'BepInEx 5 для PCVR. Для Quest сборка другая.' },
        'among-us': { note: 'Among Us — BepInEx 6 Il2Cpp, пак <code>BepInExPack_AmongUs</code>.' },
        'deep-rock-galactic': { note: 'DRG использует собственный мод-лоадер: файлы кладутся в корень архива.' },
        palworld: { note: 'UE5-игра: pak/ue4ss-моды кладутся в корень архива.' },
        'schedule-i': { note: 'Schedule I работает на MelonLoader: код-моды в <code>Mods/</code>.' },
        rumble: { note: 'MelonLoader: код-моды в <code>Mods/</code>, ассеты в <code>UserData/</code>.' },
        'hard-bullet': { note: 'MelonLoader. Для <code>.npc</code>-файлов у менеджера своё правило установки.' },
        'backpack-hero': { note: 'MelonLoader: код-моды в <code>Mods/</code>.' },
        'patch-quest': { note: 'MelonLoader: код-моды в <code>Mods/</code>.' },
        northstar: { note: 'Northstar ждёт структуру <code>mods/&lt;Author&gt;.&lt;ModName&gt;/</code> с собственным <code>mod.json</code>.' },
        other: { note: 'Общий BepInEx-профиль. Зависимости и путь можно задать вручную.' },
        raw: { note: 'Модпак или набор ассетов: файлы ложатся в корень архива.' },
      },
    },
  };

  // ------------------------------------------------------------
  // Language state
  // ------------------------------------------------------------
  const readStored = () => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      return SUPPORTED.includes(v) ? v : null;
    } catch (_) { return null; }
  };

  const initial = readStored() || DEFAULT_LANG;
  let lang = initial;
  document.documentElement.lang = lang;

  const listeners = [];
  const lookup = (l, key) => key.split('.').reduce((node, part) => (node == null ? undefined : node[part]), DICT[l]);

  function interpolate(str, vars) {
    if (!vars) return str;
    return str.replace(/\{(\w+)\}/g, (m, name) => (vars[name] === undefined || vars[name] === null ? m : String(vars[name])));
  }

  /** Translate a dot-path key with {placeholder} interpolation. */
  function t(key, vars) {
    const raw = lookup(lang, key);
    if (typeof raw === 'string') return interpolate(raw, vars);
    if (raw !== undefined) return raw;
    const fallback = lookup(DEFAULT_LANG, key);
    if (typeof fallback === 'string') return interpolate(fallback, vars);
    if (fallback !== undefined) return fallback;
    return key;
  }

  /** Pick the right plural form: I18N.p('files.word', 3). */
  function p(key, n) {
    const forms = lookup(lang, key) || lookup(DEFAULT_LANG, key);
    if (!Array.isArray(forms)) return '';
    if (forms.length <= 2) return n === 1 ? forms[0] : (forms[1] || forms[0]);
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return forms[0];
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
    return forms[2];
  }

  /** Apply translations to static markup: data-i18n, data-i18n-html, data-i18n-attr. */
  function apply(root) {
    const scope = root || document;
    scope.querySelectorAll('[data-i18n]').forEach((el) => {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    scope.querySelectorAll('[data-i18n-html]').forEach((el) => {
      el.innerHTML = t(el.getAttribute('data-i18n-html'));
    });
    scope.querySelectorAll('[data-i18n-attr]').forEach((el) => {
      el.getAttribute('data-i18n-attr').split(';').forEach((pair) => {
        const [attr, key] = pair.split(':').map((s) => s && s.trim());
        if (attr && key) el.setAttribute(attr, t(key));
      });
    });
    document.title = t('meta.title');
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', t('meta.description'));
    document.documentElement.lang = lang;
  }

  function setLang(next) {
    if (!SUPPORTED.includes(next) || next === lang) return;
    lang = next;
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (_) { /* private mode */ }
    apply(document);
    listeners.forEach((fn) => { try { fn(lang); } catch (e) { console.error(e); } });
  }

  function onChange(fn) { if (typeof fn === 'function') listeners.push(fn); }

  /** Game note (HTML allowed) for the current language. */
  const gameNote = (gameKey) => {
    const value = t('games.' + gameKey + '.note');
    return value === 'games.' + gameKey + '.note' ? '' : value;
  };

  window.I18N = {
    langs: SUPPORTED,
    defaultLang: DEFAULT_LANG,
    get lang() { return lang; },
    get isDefault() { return lang === DEFAULT_LANG; },
    dict: DICT,
    t, p, apply, setLang, onChange, gameNote,
    /** Localised name of a loader. */
    loader: (id) => t('loaders.' + (id || 'none')),
  };

  // Deferred scripts run after the DOM is parsed and before the first paint,
  // so translating here removes any flash of the source language.
  apply(document);
})();
