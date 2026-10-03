/* ============================================================
   Thunderstore Fast Archive
   Собирает валидный Thunderstore-пакет целиком в браузере.
   Правила: https://thunderstore.io/package/create/docs/
   ============================================================ */
(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const MAX_ZIP = 5242880000;           // ~5 GB, мягкий лимит Thunderstore
  const NAME_RE = /^[a-zA-Z0-9_]+$/;    // name / namespace
  const SEMVER_RE = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
  const DEP_RE = /^[a-zA-Z0-9_]+-[a-zA-Z0-9_]+-(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
  const STORAGE_KEY = 'tsfa.profile.v1';

  // ---------- пути установки по загрузчику ----------
  const PATHS = {
    bepinex: [
      ['BepInEx/plugins', 'BepInEx/plugins/ — обычный плагин (рекомендуется)'],
      ['BepInEx/patchers', 'BepInEx/patchers/ — preloader-патчер'],
      ['BepInEx/config', 'BepInEx/config/ — готовые конфиги'],
      ['', 'Корень архива — рядом с manifest.json'],
      ['custom', 'Своя папка…'],
    ],
    melonloader: [
      ['Mods', 'Mods/ — обычный MelonLoader-мод (рекомендуется)'],
      ['Plugins', 'Plugins/ — MelonLoader-плагин (грузится раньше мода)'],
      ['UserLibs', 'UserLibs/ — вспомогательные библиотеки'],
      ['UserData', 'UserData/ — ассеты, конфиги, палеты'],
      ['', 'Корень архива — рядом с manifest.json'],
      ['custom', 'Своя папка…'],
    ],
    northstar: [
      ['mods', 'mods/ — папка мода Northstar'],
      ['', 'Корень архива — рядом с manifest.json'],
      ['custom', 'Своя папка…'],
    ],
    none: [
      ['', 'Корень архива — рядом с manifest.json'],
      ['custom', 'Своя папка…'],
    ],
  };

  // ---------- игры ----------
  // ---------- каталог игр ----------
  // Версии пресетов актуальны на момент сборки — всегда сверяйся со страницей пакета.
  const BEP = ['BepInExPack', 'BepInEx-BepInExPack-5.4.2100'];
  const ML = ['MelonLoader 0.7.3', 'LavaGang-MelonLoader-0.7.3'];

  const GAMES = {
    bonelab: {
      title: 'BONELAB', emoji: '🦴', loader: 'melonloader', community: 'bonelab',
      tags: 'боунлаб bonelab slz marrow vr',
      note: 'MelonLoader раскладывает содержимое в <code>Mods/&lt;Author-ModName&gt;/</code>. Код-моды — в <code>Mods/</code>, ассеты и палеты — в <code>UserData/</code>.',
      deps: [
        ['MelonLoader 0.6.6', 'LavaGang-MelonLoader-0.6.6'],
        ['MelonLoader 0.7.3', 'LavaGang-MelonLoader-0.7.3'],
        ['BoneLib', 'gnonme-BoneLib-3.1.3'],
        ['Fusion', 'Lakatrazz-Fusion-1.9.2'],
      ],
      defaultDeps: ['LavaGang-MelonLoader-0.6.6', 'gnonme-BoneLib-3.1.3'],
    },
    boneworks: {
      title: 'BONEWORKS', emoji: '🔩', loader: 'melonloader', community: 'boneworks',
      tags: 'боунворкс boneworks vr',
      note: 'BONEWORKS-моды собраны под MelonLoader <b>0.5.7</b> — более новые версии ломают совместимость.',
      deps: [['MelonLoader 0.5.7', 'LavaGang-MelonLoader-0.5.7']],
      defaultDeps: ['LavaGang-MelonLoader-0.5.7'],
    },
    'lethal-company': {
      title: 'Lethal Company', emoji: '🛸', loader: 'bepinex', community: 'lethal-company',
      tags: 'летал компани lethal company',
      note: 'Классический BepInEx 5: <code>.dll</code> кладётся в <code>BepInEx/plugins</code>.',
      deps: [BEP, ['LethalLib', 'Evaisa-LethalLib-0.16.1'], ['MMHOOK', 'Evaisa-HookGenPatcher-0.0.5'], ['LC_API', '2018-LC_API-3.4.2']],
      defaultDeps: ['BepInEx-BepInExPack-5.4.2100'],
    },
    repo: {
      title: 'R.E.P.O.', emoji: '🤖', loader: 'bepinex', community: 'repo',
      tags: 'repo репо',
      note: 'BepInEx 5, плагины в <code>BepInEx/plugins</code>.',
      deps: [BEP, ['REPOLib', 'Zehs-REPOLib-2.1.0']],
      defaultDeps: ['BepInEx-BepInExPack-5.4.2100'],
    },
    'content-warning': {
      title: 'Content Warning', emoji: '📹', loader: 'bepinex', community: 'content-warning',
      tags: 'content warning контент',
      note: 'BepInEx 5, плагины в <code>BepInEx/plugins</code>.',
      deps: [BEP], defaultDeps: ['BepInEx-BepInExPack-5.4.2100'],
    },
    peak: {
      title: 'PEAK', emoji: '⛰️', loader: 'bepinex', community: 'peak',
      tags: 'peak пик climbing',
      note: 'BepInEx 5, плагины в <code>BepInEx/plugins</code>.',
      deps: [BEP], defaultDeps: ['BepInEx-BepInExPack-5.4.2100'],
    },
    ultrakill: {
      title: 'ULTRAKILL', emoji: '🔫', loader: 'bepinex', community: 'ultrakill',
      tags: 'ultrakill ультракилл',
      note: 'BepInEx 5. Для оружия и уровней обычно нужны дополнительные API-моды.',
      deps: [BEP], defaultDeps: ['BepInEx-BepInExPack-5.4.2100'],
    },
    riskofrain2: {
      title: 'Risk of Rain 2', emoji: '🌧️', loader: 'bepinex', community: 'riskofrain2',
      tags: 'risk of rain ror2 риск',
      note: 'BepInEx + R2API — стандартный стек RoR2.',
      deps: [['BepInExPack (RoR2)', 'bbepis-BepInExPack-5.4.2113'], ['R2API', 'tristanmcpherson-R2API-5.0.12']],
      defaultDeps: ['bbepis-BepInExPack-5.4.2113'],
    },
    valheim: {
      title: 'Valheim', emoji: '⚔️', loader: 'bepinex', community: 'valheim',
      tags: 'valheim вальхейм',
      note: 'У Valheim свой BepInEx-пак от denikson.',
      deps: [['BepInExPack Valheim', 'denikson-BepInExPack_Valheim-5.4.2202'], ['Jotunn', 'ValheimModding-Jotunn-2.20.1']],
      defaultDeps: ['denikson-BepInExPack_Valheim-5.4.2202'],
    },
    'v-rising': {
      title: 'V Rising', emoji: '🧛', loader: 'bepinex', community: 'v-rising',
      tags: 'v rising вампир',
      note: 'V Rising использует BepInEx 6 (Il2Cpp) — пак <code>BepInExPack_V_Rising</code>.',
      deps: [['BepInExPack V Rising', 'BepInEx-BepInExPack_V_Rising-1.733.2']],
      defaultDeps: ['BepInEx-BepInExPack_V_Rising-1.733.2'],
    },
    gtfo: {
      title: 'GTFO', emoji: '🔦', loader: 'bepinex', community: 'gtfo',
      tags: 'gtfo', note: 'BepInEx 6 (Il2Cpp). Сверься с паком коммьюнити GTFO.',
      deps: [BEP], defaultDeps: [],
    },
    'dyson-sphere-program': {
      title: 'Dyson Sphere Program', emoji: '🛰️', loader: 'bepinex', community: 'dyson-sphere-program',
      tags: 'dyson sphere dsp', note: 'BepInEx 5, плагины в <code>BepInEx/plugins</code>.',
      deps: [BEP], defaultDeps: ['BepInEx-BepInExPack-5.4.2100'],
    },
    subnautica: {
      title: 'Subnautica', emoji: '🐟', loader: 'bepinex', community: 'subnautica',
      tags: 'subnautica субнаутика', note: 'У Subnautica собственный пак <code>tobey-BepInExPack_Subnautica</code> — возьми актуальную версию со страницы пакета.',
      deps: [BEP], defaultDeps: [],
    },
    outward: {
      title: 'Outward', emoji: '🗡️', loader: 'bepinex', community: 'outward',
      tags: 'outward', note: 'BepInEx 5, плагины в <code>BepInEx/plugins</code>.',
      deps: [BEP], defaultDeps: ['BepInEx-BepInExPack-5.4.2100'],
    },
    rounds: {
      title: 'ROUNDS', emoji: '🎯', loader: 'bepinex', community: 'rounds',
      tags: 'rounds раундс', note: 'Почти все моды ROUNDS строятся поверх UnboundLib.',
      deps: [BEP, ['UnboundLib', 'willis81808-UnboundLib-3.2.8']],
      defaultDeps: ['BepInEx-BepInExPack-5.4.2100'],
    },
    muck: {
      title: 'Muck', emoji: '🪓', loader: 'bepinex', community: 'muck',
      tags: 'muck', note: 'BepInEx 5, плагины в <code>BepInEx/plugins</code>.',
      deps: [BEP], defaultDeps: ['BepInEx-BepInExPack-5.4.2100'],
    },
    timberborn: {
      title: 'Timberborn', emoji: '🦫', loader: 'bepinex', community: 'timberborn',
      tags: 'timberborn бобры', note: 'BepInEx 5, плагины в <code>BepInEx/plugins</code>.',
      deps: [BEP], defaultDeps: ['BepInEx-BepInExPack-5.4.2100'],
    },
    inscryption: {
      title: 'Inscryption', emoji: '🃏', loader: 'bepinex', community: 'inscryption',
      tags: 'inscryption инскрипшн', note: 'BepInEx 5. Для карт обычно нужен API-мод коммьюнити.',
      deps: [BEP], defaultDeps: ['BepInEx-BepInExPack-5.4.2100'],
    },
    'cult-of-the-lamb': {
      title: 'Cult of the Lamb', emoji: '🐑', loader: 'bepinex', community: 'cult-of-the-lamb',
      tags: 'cult of the lamb', note: 'BepInEx 5, плагины в <code>BepInEx/plugins</code>.',
      deps: [BEP], defaultDeps: ['BepInEx-BepInExPack-5.4.2100'],
    },
    'sons-of-the-forest': {
      title: 'Sons Of The Forest', emoji: '🌲', loader: 'bepinex', community: 'sons-of-the-forest',
      tags: 'sons of the forest', note: 'BepInEx 5, плагины в <code>BepInEx/plugins</code>.',
      deps: [BEP], defaultDeps: ['BepInEx-BepInExPack-5.4.2100'],
    },
    raft: {
      title: 'Raft', emoji: '🛶', loader: 'bepinex', community: 'raft',
      tags: 'raft рафт', note: 'BepInEx 5, плагины в <code>BepInEx/plugins</code>.',
      deps: [BEP], defaultDeps: ['BepInEx-BepInExPack-5.4.2100'],
    },
    h3vr: {
      title: 'H3VR', emoji: '🧨', loader: 'bepinex', community: 'h3vr',
      tags: 'h3vr hot dogs horseshoes vr', note: 'У H3VR свой BepInEx-пак и система Deli/Sodalite — сверься с коммьюнити.',
      deps: [BEP], defaultDeps: [],
    },
    'gorilla-tag': {
      title: 'Gorilla Tag', emoji: '🦍', loader: 'bepinex', community: 'gorilla-tag',
      tags: 'gorilla tag monke горилла', note: 'BepInEx 5 для PCVR. Для Quest сборка другая.',
      deps: [BEP], defaultDeps: ['BepInEx-BepInExPack-5.4.2100'],
    },
    'among-us': {
      title: 'Among Us', emoji: '🔪', loader: 'bepinex', community: 'among-us',
      tags: 'among us амонг ас', note: 'Among Us — BepInEx 6 Il2Cpp, пак <code>BepInExPack_AmongUs</code>.',
      deps: [BEP], defaultDeps: [],
    },
    'deep-rock-galactic': {
      title: 'Deep Rock Galactic', emoji: '⛏️', loader: 'none', community: 'deep-rock-galactic',
      tags: 'deep rock galactic drg', note: 'DRG использует собственный мод-лоадер: файлы кладутся в корень архива.',
      deps: [], defaultDeps: [],
    },
    palworld: {
      title: 'Palworld', emoji: '🐾', loader: 'none', community: 'palworld',
      tags: 'palworld палворлд', note: 'UE5-игра: pak/ue4ss-моды кладутся в корень архива.',
      deps: [], defaultDeps: [],
    },
    'schedule-i': {
      title: 'Schedule I', emoji: '💊', loader: 'melonloader', community: 'schedule-i',
      tags: 'schedule i шедул', note: 'Schedule I работает на MelonLoader: код-моды в <code>Mods/</code>.',
      deps: [ML], defaultDeps: ['LavaGang-MelonLoader-0.7.3'],
    },
    rumble: {
      title: 'RUMBLE', emoji: '🥊', loader: 'melonloader', community: 'rumble',
      tags: 'rumble vr', note: 'MelonLoader: код-моды в <code>Mods/</code>, ассеты в <code>UserData/</code>.',
      deps: [ML], defaultDeps: ['LavaGang-MelonLoader-0.7.3'],
    },
    'hard-bullet': {
      title: 'Hard Bullet', emoji: '🔪', loader: 'melonloader', community: 'hard-bullet',
      tags: 'hard bullet vr', note: 'MelonLoader. Для <code>.npc</code>-файлов у менеджера своё правило установки.',
      deps: [ML], defaultDeps: ['LavaGang-MelonLoader-0.7.3'],
    },
    'backpack-hero': {
      title: 'Backpack Hero', emoji: '🎒', loader: 'melonloader', community: 'backpack-hero',
      tags: 'backpack hero', note: 'MelonLoader: код-моды в <code>Mods/</code>.',
      deps: [ML], defaultDeps: ['LavaGang-MelonLoader-0.7.3'],
    },
    'patch-quest': {
      title: 'Patch Quest', emoji: '🧩', loader: 'melonloader', community: 'patch-quest',
      tags: 'patch quest', note: 'MelonLoader: код-моды в <code>Mods/</code>.',
      deps: [ML], defaultDeps: ['LavaGang-MelonLoader-0.7.3'],
    },
    northstar: {
      title: 'Titanfall 2 · Northstar', emoji: '🚀', loader: 'northstar', community: 'northstar',
      tags: 'northstar titanfall титанфолл', note: 'Northstar ждёт структуру <code>mods/&lt;Author&gt;.&lt;ModName&gt;/</code> с собственным <code>mod.json</code>.',
      deps: [], defaultDeps: [],
    },
    other: {
      title: 'Другая игра', emoji: '🎲', loader: 'bepinex', community: '',
      tags: 'other custom другая', note: 'Общий BepInEx-профиль. Зависимости и путь можно задать вручную.',
      deps: [BEP, ML], defaultDeps: [],
    },
    raw: {
      title: 'Без загрузчика', emoji: '📦', loader: 'none', community: '',
      tags: 'modpack модпак ассеты raw', note: 'Модпак или набор ассетов: файлы ложатся в корень архива.',
      deps: [], defaultDeps: [],
    },
  };

  const PALETTE = ['#4f7cff', '#8b5cf6', '#22d3ee', '#2ed47a', '#ffb020', '#ff5c5c', '#ec4899', '#64748b'];

  // ---------- state ----------
  const state = {
    files: [],              // {id, name, path, size, file}
    deps: [],
    iconBlob: null,         // Blob (готовый png 256x256)
    iconUrl: null,
    iconSource: 'generated',
    accent: PALETTE[0],
    activeDoc: 'readme',
    game: 'bonelab',
    autoDeps: [],   // зависимости, подставленные пресетом игры
  };
  const game = () => GAMES[state.game] || GAMES.other;
  let uid = 0;

  // ---------- helpers ----------
  const fmtSize = (b) => {
    if (b < 1024) return b + ' B';
    if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
    if (b < 1073741824) return (b / 1048576).toFixed(2) + ' MB';
    return (b / 1073741824).toFixed(2) + ' GB';
  };
  const toast = (msg, kind = '') => {
    const t = $('toast');
    t.textContent = msg;
    t.className = 'toast show ' + kind;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => (t.className = 'toast ' + kind), 2600);
  };
  const debounce = (fn, ms = 160) => {
    let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  };

  // ============================================================
  // ФАЙЛЫ
  // ============================================================
  function addFiles(fileList) {
    const incoming = Array.from(fileList || []);
    if (!incoming.length) return;
    // одиночный Thunderstore-zip — импортируем его целиком
    if (incoming.length === 1 && /\.zip$/i.test(incoming[0].name)) {
      if (confirm(`Импортировать «${incoming[0].name}» как готовый пакет?\n\nОК — разобрать архив и заполнить форму.\nОтмена — просто добавить zip файлом в пакет.`)) {
        importZip(incoming[0]);
        return;
      }
    }
    for (const f of incoming) {
      const rel = (f.webkitRelativePath || '').split('/').slice(1).join('/') || f.name;
      if (state.files.some((x) => x.path === rel && x.size === f.size)) continue;
      state.files.push({ id: ++uid, name: f.name, path: rel, size: f.size, file: f });
    }
    // если иконки ещё не выбирали — подхватим icon.png из набора
    const ic = state.files.find((f) => /^icon\.png$/i.test(f.name));
    if (ic && state.iconSource === 'generated') loadIconFromFile(ic.file, true);
    renderFiles(); update();
  }

  function renderFiles() {
    const ul = $('fileList');
    ul.innerHTML = '';
    for (const f of state.files) {
      const isDll = /\.dll$/i.test(f.name);
      const li = document.createElement('li');
      if (isDll) li.className = 'dll';
      li.innerHTML = `<span class="fi-ico">${isDll ? '🧩' : fileIcon(f.name)}</span>
        <span class="fi-name" title="${esc(f.path)}">${esc(f.path)}</span>
        <span class="fi-size">${fmtSize(f.size)}</span>`;
      const btn = document.createElement('button');
      btn.className = 'x'; btn.type = 'button'; btn.title = 'Убрать'; btn.textContent = '×';
      btn.onclick = () => { state.files = state.files.filter((x) => x.id !== f.id); renderFiles(); update(); };
      li.appendChild(btn);
      ul.appendChild(li);
    }
    const total = state.files.reduce((s, f) => s + f.size, 0);
    $('filesSummary').textContent = state.files.length
      ? `${state.files.length} файл(ов) · ${fmtSize(total)}`
      : 'Файлов нет';
  }

  function fileIcon(n) {
    if (/\.(png|jpe?g|webp|gif)$/i.test(n)) return '🖼️';
    if (/\.(json|cfg|xml|yml|yaml|txt|md)$/i.test(n)) return '📄';
    if (/\.(zip|7z|rar)$/i.test(n)) return '🗜️';
    if (/\.(wav|mp3|ogg)$/i.test(n)) return '🔊';
    if (/\.(bundle|assets|unity3d)$/i.test(n)) return '🎮';
    return '📎';
  }
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function installDir() {
    const v = $('installPath').value;
    if (v === 'custom') return ($('customPath').value || '').replace(/^\/+|\/+$/g, '');
    return v;
  }

  // ============================================================
  // ИГРЫ / ПРЕСЕТЫ
  // ============================================================
  function loaderLabel(l) {
    return l === 'melonloader' ? 'MelonLoader' : l === 'bepinex' ? 'BepInEx' : l === 'northstar' ? 'Northstar' : 'без загрузчика';
  }

  function renderGames() {
    const box = $('games'); box.innerHTML = '';
    const q = ($('gameSearch') ? $('gameSearch').value : '').trim().toLowerCase();
    const entries = Object.entries(GAMES).filter(([key, g]) =>
      !q || key.includes(q) || g.title.toLowerCase().includes(q) ||
      (g.tags || '').includes(q) || loaderLabel(g.loader).toLowerCase().includes(q));
    $('gameCount').textContent = q ? `${entries.length} из ${Object.keys(GAMES).length}` : `${Object.keys(GAMES).length} игр`;
    if (!entries.length) {
      box.innerHTML = '<div class="games-empty">Ничего не нашлось. Возьми профиль «Другая игра» — он универсальный.</div>';
      return;
    }
    entries.forEach(([key, g]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'game' + (key === state.game ? ' sel' : '');
      b.innerHTML = `<span class="g-emoji">${g.emoji}</span>
        <span class="g-meta"><span class="g-name">${esc(g.title)}</span>
        <span class="g-loader">${loaderLabel(g.loader)}</span></span>`;
      b.onclick = () => selectGame(key, true);
      box.appendChild(b);
    });
  }

  function renderPathOptions(keepValue) {
    const sel = $('installPath');
    // важно: '' — валидное значение (корень архива), поэтому отличаем «нет значения» явно
    const prev = keepValue !== undefined && keepValue !== null
      ? keepValue
      : (sel.options.length ? sel.value : null);
    const list = PATHS[game().loader] || PATHS.none;
    sel.innerHTML = '';
    list.forEach(([val, label]) => {
      const o = document.createElement('option');
      o.value = val; o.textContent = label;
      sel.appendChild(o);
    });
    sel.value = list.some(([v]) => v === prev) ? prev : list[0][0];
    $('customPath').classList.toggle('hidden', sel.value !== 'custom');
  }

  function renderDepPresets() {
    const box = $('depPresets'); box.innerHTML = '';
    const list = game().deps;
    if (!list.length) { box.innerHTML = '<span class="help">Для этого профиля пресетов нет — добавь зависимости вручную.</span>'; return; }
    list.forEach(([label, dep]) => {
      const b = document.createElement('button');
      b.type = 'button'; b.textContent = '+ ' + label; b.title = dep;
      b.onclick = () => { if (!state.deps.includes(dep)) { state.deps.push(dep); renderDeps(); update(); } };
      box.appendChild(b);
    });
  }

  function selectGame(key, userAction) {
    state.game = key;
    const g = game();
    renderGames();
    renderPathOptions(userAction ? null : undefined);
    renderDepPresets();
    $('loaderHint').textContent = loaderLabel(g.loader);
    $('gameLink').innerHTML = g.community
      ? `Актуальные версии зависимостей — на странице коммьюнити: <a href="https://thunderstore.io/c/${g.community}/" target="_blank" rel="noopener">thunderstore.io/c/${g.community}</a>`
      : '';
    $('gameNote').innerHTML = g.note;
    if (userAction) {
      // убираем зависимости, подставленные прошлым пресетом, и ставим новые
      state.deps = state.deps.filter((d) => !state.autoDeps.includes(d));
      state.autoDeps = g.defaultDeps.slice();
      g.defaultDeps.forEach((d) => { if (!state.deps.includes(d)) state.deps.push(d); });
      renderDeps();
      toast(`Профиль: ${g.title}`, 'ok');
    }
    update();
  }

  // ============================================================
  // ИКОНКА
  // ============================================================
  function drawGeneratedIcon() {
    const c = $('iconCanvas'), ctx = c.getContext('2d');
    const name = ($('name').value || 'Mod').replace(/_/g, ' ').trim() || 'Mod';
    const accent = state.accent;

    const g = ctx.createLinearGradient(0, 0, 256, 256);
    g.addColorStop(0, shade(accent, 20));
    g.addColorStop(1, shade(accent, -45));
    ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 256);

    // лёгкий узор
    ctx.strokeStyle = 'rgba(255,255,255,.07)'; ctx.lineWidth = 2;
    for (let i = -256; i < 256; i += 22) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + 256, 256); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(0,0,0,.22)';
    ctx.beginPath(); ctx.arc(200, 210, 110, 0, Math.PI * 2); ctx.fill();

    // инициалы
    const parts = name.split(/[\s_\-]+/).filter(Boolean);
    const initials = (parts.length > 1 ? parts[0][0] + parts[1][0] : name.slice(0, 2)).toUpperCase();
    ctx.fillStyle = '#fff';
    ctx.font = '700 118px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 5;
    ctx.fillText(initials, 128, 120);
    ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

    // подпись
    ctx.font = '600 20px Inter, system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    const short = name.length > 18 ? name.slice(0, 17) + '…' : name;
    ctx.fillText(short, 128, 210);

    ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, 252, 252);

    state.iconSource = 'generated';
    commitCanvasIcon();
  }

  function shade(hex, pct) {
    const n = parseInt(hex.slice(1), 16);
    const f = (v) => Math.max(0, Math.min(255, Math.round(v + (pct / 100) * 255)));
    return '#' + [f(n >> 16), f((n >> 8) & 255), f(n & 255)].map((v) => v.toString(16).padStart(2, '0')).join('');
  }

  function loadIconFromFile(file, silent) {
    if (!file || !/^image\//.test(file.type)) { if (!silent) toast('Нужен файл-картинка', 'err'); return; }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const c = $('iconCanvas'), ctx = c.getContext('2d');
      ctx.clearRect(0, 0, 256, 256);
      // cover-кроп по центру
      const s = Math.min(img.width, img.height);
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, 256, 256);
      URL.revokeObjectURL(url);
      state.iconSource = 'upload';
      $('iconBadge').textContent = `256×256 ← ${img.width}×${img.height}`;
      commitCanvasIcon(true);
    };
    img.onerror = () => { URL.revokeObjectURL(url); toast('Не удалось прочитать картинку', 'err'); };
    img.src = url;
  }

  function commitCanvasIcon(keepBadge) {
    if (!keepBadge) $('iconBadge').textContent = '256×256';
    $('iconCanvas').toBlob((blob) => {
      state.iconBlob = blob;
      if (state.iconUrl) URL.revokeObjectURL(state.iconUrl);
      state.iconUrl = URL.createObjectURL(blob);
      $('pgIcon').src = state.iconUrl;
      $('cardIcon').src = state.iconUrl;
      update();
    }, 'image/png');
  }

  // ============================================================
  // MANIFEST / ВАЛИДАЦИЯ
  // ============================================================
  function buildManifest() {
    return {
      name: $('name').value.trim(),
      version_number: $('version').value.trim(),
      website_url: $('website').value.trim(),
      description: $('description').value.trim(),
      dependencies: state.deps.slice(),
    };
  }

  function zipBaseName() {
    const a = $('author').value.trim() || 'Author';
    const n = $('name').value.trim() || 'Mod';
    const v = $('version').value.trim() || '0.0.0';
    return `${a}-${n}-${v}`;
  }

  function validate() {
    const errors = [], warns = [], oks = [];
    const author = $('author').value.trim();
    const name = $('name').value.trim();
    const desc = $('description').value.trim();
    const ver = $('version').value.trim();
    const site = $('website').value.trim();
    const readme = $('readme').value.trim();

    mark('author', !author || NAME_RE.test(author));
    mark('name', !name || (NAME_RE.test(name) && name.length <= 128));
    mark('version', !ver || SEMVER_RE.test(ver));

    if (!author) errors.push('Укажи автора / namespace — без него не собрать имя пакета.');
    else if (!NAME_RE.test(author)) errors.push('В namespace можно только a-z A-Z 0-9 и _ (без пробелов и дефисов).');

    if (!name) errors.push('Укажи имя мода (поле name в манифесте).');
    else if (!NAME_RE.test(name)) errors.push('В name можно только a-z A-Z 0-9 и _ . Пробел заменяй на _ .');
    else if (name.length > 128) errors.push('name длиннее 128 символов.');

    if (!desc) errors.push('Описание обязательно (до 250 символов).');
    else if (desc.length > 250) errors.push('Описание длиннее 250 символов.');

    if (!ver) errors.push('Укажи версию.');
    else if (!SEMVER_RE.test(ver)) errors.push('Версия должна быть строго Major.Minor.Patch, например 1.0.0 (без v, без 4-й цифры, без лидирующих нулей).');

    if (site && !/^https?:\/\/\S+$/i.test(site)) errors.push('website_url должен начинаться с http:// или https:// (или быть пустым).');

    const badDeps = state.deps.filter((d) => !DEP_RE.test(d));
    if (badDeps.length) errors.push(`Некорректные зависимости: ${badDeps.join(', ')} — нужен формат Namespace-Name-1.0.0`);
    if (new Set(state.deps).size !== state.deps.length) warns.push('В зависимостях есть дубликаты.');

    if (!state.iconBlob) errors.push('Нет иконки icon.png.');
    if (!readme) errors.push('README.md пустой — он показывается на странице мода.');
    else if (readme.length < 80) warns.push('README очень короткий. Добавь описание, установку и настройки — так мод скачивают охотнее.');

    if (!state.files.length) warns.push('Не добавлено ни одного файла мода — архив будет только с метаданными (это ок для модпака).');
    else if (!state.files.some((f) => /\.dll$/i.test(f.name))) warns.push('Среди файлов нет .dll — проверь, то ли ты загрузил.');

    if ($('installPath').value === 'custom' && !installDir()) errors.push('Выбрана своя папка, но путь не указан.');

    if (game().loader === 'melonloader' && /^BepInEx/i.test(installDir())) {
      warns.push('Игра на MelonLoader, а путь указан для BepInEx — скорее всего мод не загрузится.');
    }
    if (game().loader === 'bepinex' && /^(Mods|Plugins|UserLibs|UserData)$/i.test(installDir())) {
      warns.push('Игра на BepInEx, а выбрана папка MelonLoader — проверь путь установки.');
    }

    const total = state.files.reduce((s, f) => s + f.size, 0);
    if (total > MAX_ZIP) errors.push('Суммарный размер больше 5 ГБ — лимит Thunderstore.');

    const nameClash = state.files.some((f) => /^(manifest\.json|readme\.md|changelog\.md|icon\.png)$/i.test(f.path) && !installDir());
    if (nameClash) warns.push('Один из файлов в корне называется как служебный (manifest.json / README.md / icon.png) — он будет перезаписан.');

    if (!errors.length) {
      oks.push(`Пакет валиден: ${zipBaseName()}.zip`);
      const g = game();
      if (g.loader === 'melonloader' && !state.deps.some((d) => /^LavaGang-MelonLoader-/.test(d))) {
        warns.push(`Для ${g.title} в зависимости обычно добавляют LavaGang-MelonLoader — иначе менеджер не поставит загрузчик.`);
      } else if (g.loader === 'bepinex' && !state.deps.some((d) => /BepInExPack/i.test(d))) {
        warns.push(`Для ${g.title} в зависимостях обычно нужен BepInExPack.`);
      } else if (!state.deps.length) {
        warns.push('Зависимости не указаны — проверь, точно ли мод работает сам по себе.');
      }
    }
    return { errors, warns, oks };
  }

  function mark(id, ok) { $(id).classList.toggle('bad', !ok); }

  // ============================================================
  // РЕНДЕР
  // ============================================================
  function renderDeps() {
    const ul = $('depList'); ul.innerHTML = '';
    state.deps.forEach((d, i) => {
      const li = document.createElement('li');
      if (!DEP_RE.test(d)) li.className = 'invalid';
      li.innerHTML = `<span title="${esc(d)}">${esc(d)}</span>`;
      const b = document.createElement('button');
      b.className = 'x'; b.type = 'button'; b.textContent = '×';
      b.onclick = () => { state.deps.splice(i, 1); renderDeps(); update(); };
      li.appendChild(b);
      ul.appendChild(li);
    });
  }

  function renderPreview() {
    const author = $('author').value.trim() || 'Author';
    const name = $('name').value.trim() || 'My_Awesome_Mod';
    const desc = $('description').value.trim() || 'Короткое описание мода';
    const ver = $('version').value.trim() || '0.0.0';

    $('pgName').textContent = name.replace(/_/g, ' ');
    $('pgAuthor').textContent = author;
    $('pgDesc').textContent = desc;
    $('pgVer').textContent = 'v' + ver;
    $('cardName').textContent = name.replace(/_/g, ' ');
    $('cardAuthor').textContent = author;
    $('cardDesc').textContent = desc;
    $('cardVer').textContent = ver;

    const md = state.activeDoc === 'changelog' && !$('readme').value
      ? $('changelog').value : $('readme').value;
    const html = window.marked ? marked.parse(md || '*README пуст*', { breaks: true, gfm: true }) : esc(md);
    $('pgReadme').innerHTML = window.DOMPurify ? DOMPurify.sanitize(html) : html;

    // json
    $('jsonView').textContent = JSON.stringify(buildManifest(), null, 2);

    // tree
    const dir = installDir();
    const lines = [];
    const rootFiles = ['icon.png', 'manifest.json', 'README.md'];
    if ($('includeChangelog').checked && $('changelog').value.trim()) rootFiles.push('CHANGELOG.md');
    lines.push(`<span class="f-dir">${esc(zipBaseName())}.zip/</span>`);
    rootFiles.forEach((f) => lines.push(`  <span class="f-req">├─ ${f}</span>`));
    if (state.files.length) {
      const grouped = {};
      for (const f of state.files) {
        const full = dir ? `${dir}/${f.path}` : f.path;
        const parts = full.split('/');
        const fname = parts.pop();
        const d = parts.join('/');
        (grouped[d] = grouped[d] || []).push({ fname, size: f.size });
      }
      Object.keys(grouped).sort().forEach((d) => {
        if (d) lines.push(`  <span class="f-dir">├─ ${esc(d)}/</span>`);
        grouped[d].forEach((f) => {
          const cls = /\.dll$/i.test(f.fname) ? 'f-dll' : '';
          lines.push(`  ${d ? '│  ' : ''}├─ <span class="${cls}">${esc(f.fname)}</span>  <span style="opacity:.45">${fmtSize(f.size)}</span>`);
        });
      });
    }
    $('zipTree').innerHTML = lines.join('\n');
    $('treeName').textContent = zipBaseName() + '.zip';
    const total = state.files.reduce((s, f) => s + f.size, 0);
    $('treeSize').textContent = '≈ ' + fmtSize(total + (state.iconBlob ? state.iconBlob.size : 0) + 2048);
  }

  function renderValidation() {
    const { errors, warns, oks } = validate();
    const ul = $('issues'); ul.innerHTML = '';
    const add = (cls, icon, text) => {
      const li = document.createElement('li');
      li.className = cls;
      li.innerHTML = `<span>${icon}</span><span>${esc(text)}</span>`;
      ul.appendChild(li);
    };
    errors.forEach((e) => add('err', '✕', e));
    warns.forEach((w) => add('warn', '!', w));
    oks.forEach((o) => add('ok', '✓', o));
    if (!ul.children.length) add('ok', '✓', 'Всё в порядке.');

    const pill = $('statusPill');
    if (errors.length) { pill.className = 'pill pill-err'; pill.textContent = `${errors.length} ошибк(и)`; }
    else if (warns.length) { pill.className = 'pill pill-warn'; pill.textContent = `${warns.length} замечани(я)`; }
    else { pill.className = 'pill pill-ok'; pill.textContent = 'Готово к загрузке'; }

    $('btnDownload').disabled = errors.length > 0;
    $('zipName').textContent = zipBaseName() + '.zip';
    $('descCounter').textContent = `${$('description').value.length} / 250`;
  }

  const update = debounce(() => { renderPreview(); renderValidation(); saveProfile(true); }, 120);

  // ============================================================
  // СБОРКА ZIP
  // ============================================================
  async function buildZip() {
    const btn = $('btnDownload');
    const old = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span>⏳ Собираю архив…</span><small>подожди секунду</small>';
    try {
      const zip = new JSZip();
      zip.file('manifest.json', JSON.stringify(buildManifest(), null, 2));
      zip.file('README.md', $('readme').value);
      if ($('includeChangelog').checked && $('changelog').value.trim()) {
        zip.file('CHANGELOG.md', $('changelog').value);
      }
      zip.file('icon.png', state.iconBlob);

      const dir = installDir();
      for (const f of state.files) {
        if (!dir && /^(manifest\.json|README\.md|CHANGELOG\.md|icon\.png)$/i.test(f.path)) continue;
        zip.file(dir ? `${dir}/${f.path}` : f.path, f.file);
      }

      const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = zipBaseName() + '.zip';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      toast(`Готово: ${a.download} (${fmtSize(blob.size)})`, 'ok');
    } catch (e) {
      console.error(e);
      toast('Ошибка при сборке архива: ' + e.message, 'err');
    } finally {
      btn.innerHTML = old;
      renderValidation();
    }
  }

  // ============================================================
  // ИМПОРТ ГОТОВОГО ZIP
  // ============================================================
  const KNOWN_PREFIXES = ['BepInEx/plugins', 'BepInEx/patchers', 'BepInEx/config', 'Mods', 'Plugins', 'UserLibs', 'UserData', 'mods'];

  let importing = false;
  async function importZip(file) {
    if (importing) return;
    if (!window.JSZip) { toast('JSZip ещё не загрузился, попробуй снова', 'err'); return; }
    importing = true;
    try { await doImportZip(file); } finally { importing = false; }
  }

  async function doImportZip(file) {
    toast('Читаю архив…');
    let zip;
    try { zip = await JSZip.loadAsync(file); }
    catch (e) { toast('Это не zip-архив', 'err'); return; }

    const all = Object.values(zip.files).filter((f) => !f.dir);
    const manifestEntry = all.find((f) => /(^|\/)manifest\.json$/i.test(f.name));
    if (!manifestEntry) { toast('В архиве нет manifest.json — это не Thunderstore-пакет', 'err'); return; }
    const root = manifestEntry.name.replace(/manifest\.json$/i, '');   // '' или 'folder/'
    const rel = (n) => n.startsWith(root) ? n.slice(root.length) : n;

    // манифест
    let mf = {};
    try { mf = JSON.parse(await manifestEntry.async('string')); }
    catch (e) { toast('manifest.json повреждён: ' + e.message, 'err'); return; }

    $('name').value = mf.name || '';
    $('version').value = mf.version_number || '1.0.0';
    $('description').value = mf.description || '';
    $('website').value = mf.website_url || '';
    state.deps = Array.isArray(mf.dependencies) ? mf.dependencies.slice() : [];
    state.autoDeps = [];

    // автор из имени файла Author-Name-1.0.0.zip
    const m = (file.name || '').match(/^([A-Za-z0-9_]+)-([A-Za-z0-9_]+)-\d+\.\d+\.\d+\.zip$/i);
    if (m) $('author').value = m[1];
    else if (state.deps.length && !$('author').value) { /* оставляем как есть */ }

    // документы
    const readmeEntry = all.find((f) => rel(f.name).toLowerCase() === 'readme.md');
    if (readmeEntry) $('readme').value = await readmeEntry.async('string');
    const chEntry = all.find((f) => rel(f.name).toLowerCase() === 'changelog.md');
    if (chEntry) { $('changelog').value = await chEntry.async('string'); $('includeChangelog').checked = true; }

    // иконка
    const iconEntry = all.find((f) => rel(f.name).toLowerCase() === 'icon.png');
    if (iconEntry) {
      const blob = await iconEntry.async('blob');
      loadIconFromFile(new File([blob], 'icon.png', { type: 'image/png' }), true);
    }

    // остальные файлы
    const rest = all.filter((f) => !/^(manifest\.json|readme\.md|changelog\.md|icon\.png)$/i.test(rel(f.name)));
    const paths = rest.map((f) => rel(f.name));
    let prefix = KNOWN_PREFIXES
      .filter((p) => paths.length && paths.every((x) => x.toLowerCase().startsWith(p.toLowerCase() + '/')))
      .sort((a, b) => b.length - a.length)[0] || '';

    // угадываем игру/загрузчик по структуре
    if (prefix) {
      const loader = /^BepInEx/i.test(prefix) ? 'bepinex' : prefix === 'mods' ? 'northstar' : 'melonloader';
      if (game().loader !== loader) {
        const key = Object.keys(GAMES).find((k) => GAMES[k].loader === loader && k === 'other')
          || Object.keys(GAMES).find((k) => GAMES[k].loader === loader);
        if (key) { state.game = key; renderGames(); renderDepPresets(); }
      }
    }
    renderPathOptions(prefix);
    $('customPath').classList.toggle('hidden', $('installPath').value !== 'custom');

    state.files = [];
    for (const f of rest) {
      const p = rel(f.name);
      const blob = await f.async('blob');
      const short = prefix ? p.slice(prefix.length + 1) : p;
      state.files.push({
        id: ++uid,
        name: short.split('/').pop(),
        path: short,
        size: blob.size,
        file: new File([blob], short.split('/').pop()),
      });
    }

    renderFiles(); renderDeps();
    selectGame(state.game, false);
    renderPathOptions(prefix);
    update();
    toast(`Импортировано: ${mf.name || file.name} · ${rest.length} файл(ов)`, 'ok');
  }

  // ============================================================
  // ШАБЛОНЫ
  // ============================================================
  function readmeTemplate() {
    const name = ($('name').value.trim() || 'My_Awesome_Mod').replace(/_/g, ' ');
    const desc = $('description').value.trim() || 'Короткое описание того, что делает мод.';
    const g = game();
    const deps = state.deps.length ? state.deps.map((d) => `- ${d}`).join('\n') : '- —';
    const site = $('website').value.trim();
    const melon = g.loader === 'melonloader';
    const install = melon
      ? `1. Установи [MelonLoader](https://thunderstore.io/c/${g.community || 'bonelab'}/p/LavaGang/MelonLoader/) и запусти игру один раз.
2. Поставь мод через Thunderstore App / r2modman — или вручную положи \`.dll\` в папку \`Mods\` рядом с игрой.
3. Запусти игру и проверь консоль MelonLoader — мод должен отметиться при загрузке.`
      : `1. Установи [BepInEx](https://thunderstore.io/package/bbepis/BepInExPack/) и запусти игру один раз.
2. Поставь мод через r2modman / Gale — или вручную положи \`.dll\` в \`BepInEx/plugins\`.
3. Перезапусти игру, чтобы сгенерировался конфиг.`;
    const cfg = melon
      ? `Конфиг появится здесь: \`UserData/${$('name').value.trim() || 'MyMod'}.cfg\``
      : `Конфиг появится здесь: \`BepInEx/config/${$('author').value.trim() || 'Author'}.${$('name').value.trim() || 'MyMod'}.cfg\``;
    return `# ${name}

${desc}

> Игра: **${g.title}** · загрузчик: **${melon ? 'MelonLoader' : g.loader === 'bepinex' ? 'BepInEx' : 'не требуется'}**

## ✨ Возможности

- Фича раз
- Фича два
- Фича три

## 📦 Установка

${install}

## ⚙️ Настройка

${cfg}

| Параметр | По умолчанию | Описание |
| --- | --- | --- |
| Enabled | true | Включить мод |

## 🔗 Зависимости

${deps}

## 🐞 Баги и предложения

${site ? `Пиши в issues: ${site}` : 'Пиши в Discord или в issues репозитория.'}

## 📜 Лицензия

MIT
`;
  }

  function changelogTemplate() {
    const v = $('version').value.trim() || '1.0.0';
    const d = new Date().toISOString().slice(0, 10);
    return `# Changelog

## ${v} — ${d}

### Added
- Первый релиз 🎉

### Fixed
- —
`;
  }

  // ============================================================
  // ПРОФИЛЬ (localStorage)
  // ============================================================
  function saveProfile(quiet) {
    try {
      const data = {
        author: $('author').value, name: $('name').value, description: $('description').value,
        version: $('version').value, website: $('website').value, deps: state.deps,
        readme: $('readme').value, changelog: $('changelog').value,
        includeChangelog: $('includeChangelog').checked,
        installPath: $('installPath').value, customPath: $('customPath').value,
        accent: state.accent, game: state.game, autoDeps: state.autoDeps,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      if (!quiet) toast('Профиль сохранён в браузере', 'ok');
    } catch (_) { /* приват-режим */ }
  }

  function loadProfile() {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch (_) {}
    if (!d) return false;
    state.game = GAMES[d.game] ? d.game : 'bonelab';
    $('author').value = d.author || '';
    $('name').value = d.name || '';
    $('description').value = d.description || '';
    $('version').value = d.version || '1.0.0';
    $('website').value = d.website || '';
    $('readme').value = d.readme || '';
    $('changelog').value = d.changelog || '';
    $('includeChangelog').checked = !!d.includeChangelog;
    state.deps = Array.isArray(d.deps) ? d.deps : [];
    state.accent = d.accent || PALETTE[0];
    state.autoDeps = Array.isArray(d.autoDeps) ? d.autoDeps : [];
    selectGame(state.game, false);
    renderPathOptions(d.installPath);
    $('customPath').value = d.customPath || '';
    $('customPath').classList.toggle('hidden', $('installPath').value !== 'custom');
    renderDeps();
    return true;
  }

  // ============================================================
  // ИНИЦИАЛИЗАЦИЯ UI
  // ============================================================
  function initDropzone(zone, input, handler) {
    zone.addEventListener('click', () => input.click());
    zone.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); } });
    input.addEventListener('change', () => { handler(input.files); input.value = ''; });
    ['dragenter', 'dragover'].forEach((ev) => zone.addEventListener(ev, (e) => { e.preventDefault(); zone.classList.add('drag'); }));
    ['dragleave', 'drop'].forEach((ev) => zone.addEventListener(ev, (e) => { e.preventDefault(); zone.classList.remove('drag'); }));
    zone.addEventListener('drop', (e) => { if (e.dataTransfer?.files?.length) handler(e.dataTransfer.files); });
  }

  function init() {
    if (init._done) return;      // защита от повторной инициализации
    init._done = true;
    // палитра
    PALETTE.forEach((c) => {
      const s = document.createElement('div');
      s.className = 'swatch' + (c === state.accent ? ' sel' : '');
      s.style.background = c;
      s.onclick = () => {
        state.accent = c;
        document.querySelectorAll('.swatch').forEach((x) => x.classList.remove('sel'));
        s.classList.add('sel');
        drawGeneratedIcon();
      };
      $('swatches').appendChild(s);
    });

    initDropzone($('dropzone'), $('fileInput'), addFiles);
    $('btnPickFolder').onclick = (e) => { e.stopPropagation(); $('folderInput').click(); };
    $('folderInput').addEventListener('change', () => { addFiles($('folderInput').files); $('folderInput').value = ''; });
    initDropzone($('iconDrop'), $('iconInput'), (fl) => loadIconFromFile(fl[0]));

    // поля
    ['author', 'name', 'description', 'version', 'website', 'readme', 'changelog'].forEach((id) => {
      $(id).addEventListener('input', update);
    });
    $('name').addEventListener('input', () => { if (state.iconSource === 'generated') drawGeneratedIcon(); });
    $('includeChangelog').addEventListener('change', update);
    $('installPath').addEventListener('change', () => {
      $('customPath').classList.toggle('hidden', $('installPath').value !== 'custom');
      update();
    });
    $('customPath').addEventListener('input', update);

    // зависимости
    const addDep = () => {
      const raw = $('depInput').value.trim();
      if (!raw) return;
      raw.split(/[\s,]+/).filter(Boolean).forEach((d) => { if (!state.deps.includes(d)) state.deps.push(d); });
      $('depInput').value = '';
      renderDeps(); update();
    };
    $('btnAddDep').onclick = addDep;
    $('depInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); addDep(); } });

    // версия
    const bump = (idx) => {
      const p = ($('version').value.trim().match(SEMVER_RE) || [, '0', '0', '0']).slice(1).map(Number);
      p[idx]++; for (let i = idx + 1; i < 3; i++) p[i] = 0;
      $('version').value = p.join('.'); update();
    };
    $('bumpPatch').onclick = () => bump(2);
    $('bumpMinor').onclick = () => bump(1);

    // табы документов
    document.querySelectorAll('#docTabs .tab').forEach((t) => {
      t.onclick = () => {
        document.querySelectorAll('#docTabs .tab').forEach((x) => x.classList.remove('active'));
        t.classList.add('active');
        state.activeDoc = t.dataset.doc;
        $('readme').classList.toggle('hidden', state.activeDoc !== 'readme');
        $('changelog').classList.toggle('hidden', state.activeDoc !== 'changelog');
      };
    });
    // табы превью
    document.querySelectorAll('#prevTabs .tab').forEach((t) => {
      t.onclick = () => {
        document.querySelectorAll('#prevTabs .tab').forEach((x) => x.classList.remove('active'));
        t.classList.add('active');
        ['page', 'card', 'tree', 'json'].forEach((p) => $('pane-' + p).classList.toggle('hidden', p !== t.dataset.prev));
      };
    });

    $('btnTemplate').onclick = () => {
      if (state.activeDoc === 'changelog') {
        $('changelog').value = changelogTemplate();
        $('includeChangelog').checked = true;
      } else {
        $('readme').value = readmeTemplate();
      }
      update(); toast('Шаблон вставлен', 'ok');
    };

    $('gameSearch').addEventListener('input', renderGames);
    $('btnImport').onclick = () => $('zipInput').click();
    $('zipInput').addEventListener('change', () => {
      if ($('zipInput').files[0]) importZip($('zipInput').files[0]);
      $('zipInput').value = '';
    });

    $('btnDownload').onclick = buildZip;
    $('btnSaveProfile').onclick = () => saveProfile(false);
    $('btnCopyManifest').onclick = async () => {
      try { await navigator.clipboard.writeText(JSON.stringify(buildManifest(), null, 2)); toast('manifest.json скопирован', 'ok'); }
      catch (_) { toast('Буфер обмена недоступен', 'err'); }
    };
    $('btnReset').onclick = () => {
      if (!confirm('Очистить все поля и файлы?')) return;
      localStorage.removeItem(STORAGE_KEY);
      location.reload();
    };

    // глобальный dnd — чтобы браузер не открывал файл
    window.addEventListener('dragover', (e) => e.preventDefault());
    window.addEventListener('drop', (e) => e.preventDefault());

    // стартовые значения
    const restored = loadProfile();
    if (!restored) {
      selectGame('bonelab', false);
      state.deps = GAMES.bonelab.defaultDeps.slice();
      state.autoDeps = GAMES.bonelab.defaultDeps.slice();
      renderDeps();
      $('readme').value = readmeTemplate();
      $('changelog').value = changelogTemplate();
    }
    drawGeneratedIcon();
    renderFiles();
    renderDeps();
    renderPreview();
    renderValidation();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
