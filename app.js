/* ============================================================
   Thunderstore Fast Archive
   Builds a valid Thunderstore package entirely in the browser.
   Rules: https://thunderstore.io/package/create/docs/
   UI strings come from i18n.js (EN default, RU second);
   the generated README.md / CHANGELOG.md are ALWAYS English.
   ============================================================ */
(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const T = (key, vars) => window.I18N.t(key, vars);
  const P = (key, n) => window.I18N.p(key, n);

  const MAX_ZIP = 5242880000;           // ~5 GB, the soft Thunderstore limit
  const NAME_RE = /^[a-zA-Z0-9_]+$/;    // name / namespace
  const SEMVER_RE = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
  const DEP_RE = /^[a-zA-Z0-9_]+-[a-zA-Z0-9_]+-(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
  const STORAGE_KEY = 'tsfa.profile.v1';
  const THEME_KEY = 'tsfa.theme';

  // ---------- install paths per loader (values are language-independent) ----------
  const PATHS = {
    bepinex: [
      ['BepInEx/plugins', 'paths.bepinex.plugins'],
      ['BepInEx/patchers', 'paths.bepinex.patchers'],
      ['BepInEx/config', 'paths.bepinex.config'],
      ['', 'paths.root'],
      ['custom', 'paths.custom'],
    ],
    melonloader: [
      ['Mods', 'paths.melonloader.mods'],
      ['Plugins', 'paths.melonloader.plugins'],
      ['UserLibs', 'paths.melonloader.userlibs'],
      ['UserData', 'paths.melonloader.userdata'],
      ['', 'paths.root'],
      ['custom', 'paths.custom'],
    ],
    northstar: [
      ['mods', 'paths.northstar.mods'],
      ['', 'paths.root'],
      ['custom', 'paths.custom'],
    ],
    none: [
      ['', 'paths.root'],
      ['custom', 'paths.custom'],
    ],
  };

  // ---------- game catalog ----------
  // Preset versions are current as of the build date — always double-check the package page.
  // `tags` mixes English and Russian search words on purpose: search matches both languages.
  const BEP = ['BepInExPack', 'BepInEx-BepInExPack-5.4.2100'];
  const ML = ['MelonLoader 0.7.3', 'LavaGang-MelonLoader-0.7.3'];

  const GAMES = {
    bonelab: {
      title: 'BONELAB', emoji: '🦴', loader: 'melonloader', community: 'bonelab',
      tags: 'боунлаб bonelab slz marrow vr',
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
      deps: [['MelonLoader 0.5.7', 'LavaGang-MelonLoader-0.5.7']],
      defaultDeps: ['LavaGang-MelonLoader-0.5.7'],
    },
    'lethal-company': {
      title: 'Lethal Company', emoji: '🛸', loader: 'bepinex', community: 'lethal-company',
      tags: 'летал компани lethal company',
      deps: [BEP, ['LethalLib', 'Evaisa-LethalLib-0.16.1'], ['MMHOOK', 'Evaisa-HookGenPatcher-0.0.5'], ['LC_API', '2018-LC_API-3.4.2']],
      defaultDeps: ['BepInEx-BepInExPack-5.4.2100'],
    },
    repo: {
      title: 'R.E.P.O.', emoji: '🤖', loader: 'bepinex', community: 'repo',
      tags: 'repo репо',
      deps: [BEP, ['REPOLib', 'Zehs-REPOLib-2.1.0']],
      defaultDeps: ['BepInEx-BepInExPack-5.4.2100'],
    },
    'content-warning': {
      title: 'Content Warning', emoji: '📹', loader: 'bepinex', community: 'content-warning',
      tags: 'content warning контент',
      deps: [BEP], defaultDeps: ['BepInEx-BepInExPack-5.4.2100'],
    },
    peak: {
      title: 'PEAK', emoji: '⛰️', loader: 'bepinex', community: 'peak',
      tags: 'peak пик climbing',
      deps: [BEP], defaultDeps: ['BepInEx-BepInExPack-5.4.2100'],
    },
    ultrakill: {
      title: 'ULTRAKILL', emoji: '🔫', loader: 'bepinex', community: 'ultrakill',
      tags: 'ultrakill ультракилл',
      deps: [BEP], defaultDeps: ['BepInEx-BepInExPack-5.4.2100'],
    },
    riskofrain2: {
      title: 'Risk of Rain 2', emoji: '🌧️', loader: 'bepinex', community: 'riskofrain2',
      tags: 'risk of rain ror2 риск',
      deps: [['BepInExPack (RoR2)', 'bbepis-BepInExPack-5.4.2113'], ['R2API', 'tristanmcpherson-R2API-5.0.12']],
      defaultDeps: ['bbepis-BepInExPack-5.4.2113'],
    },
    valheim: {
      title: 'Valheim', emoji: '⚔️', loader: 'bepinex', community: 'valheim',
      tags: 'valheim вальхейм',
      deps: [['BepInExPack Valheim', 'denikson-BepInExPack_Valheim-5.4.2202'], ['Jotunn', 'ValheimModding-Jotunn-2.20.1']],
      defaultDeps: ['denikson-BepInExPack_Valheim-5.4.2202'],
    },
    'v-rising': {
      title: 'V Rising', emoji: '🧛', loader: 'bepinex', community: 'v-rising',
      tags: 'v rising вампир',
      deps: [['BepInExPack V Rising', 'BepInEx-BepInExPack_V_Rising-1.733.2']],
      defaultDeps: ['BepInEx-BepInExPack_V_Rising-1.733.2'],
    },
    gtfo: {
      title: 'GTFO', emoji: '🔦', loader: 'bepinex', community: 'gtfo',
      tags: 'gtfo', deps: [BEP], defaultDeps: [],
    },
    'dyson-sphere-program': {
      title: 'Dyson Sphere Program', emoji: '🛰️', loader: 'bepinex', community: 'dyson-sphere-program',
      tags: 'dyson sphere dsp', deps: [BEP], defaultDeps: ['BepInEx-BepInExPack-5.4.2100'],
    },
    subnautica: {
      title: 'Subnautica', emoji: '🐟', loader: 'bepinex', community: 'subnautica',
      tags: 'subnautica субнаутика', deps: [BEP], defaultDeps: [],
    },
    outward: {
      title: 'Outward', emoji: '🗡️', loader: 'bepinex', community: 'outward',
      tags: 'outward', deps: [BEP], defaultDeps: ['BepInEx-BepInExPack-5.4.2100'],
    },
    rounds: {
      title: 'ROUNDS', emoji: '🎯', loader: 'bepinex', community: 'rounds',
      tags: 'rounds раундс',
      deps: [BEP, ['UnboundLib', 'willis81808-UnboundLib-3.2.8']],
      defaultDeps: ['BepInEx-BepInExPack-5.4.2100'],
    },
    muck: {
      title: 'Muck', emoji: '🪓', loader: 'bepinex', community: 'muck',
      tags: 'muck', deps: [BEP], defaultDeps: ['BepInEx-BepInExPack-5.4.2100'],
    },
    timberborn: {
      title: 'Timberborn', emoji: '🦫', loader: 'bepinex', community: 'timberborn',
      tags: 'timberborn бобры', deps: [BEP], defaultDeps: ['BepInEx-BepInExPack-5.4.2100'],
    },
    inscryption: {
      title: 'Inscryption', emoji: '🃏', loader: 'bepinex', community: 'inscryption',
      tags: 'inscryption инскрипшн', deps: [BEP], defaultDeps: ['BepInEx-BepInExPack-5.4.2100'],
    },
    'cult-of-the-lamb': {
      title: 'Cult of the Lamb', emoji: '🐑', loader: 'bepinex', community: 'cult-of-the-lamb',
      tags: 'cult of the lamb культ ягнёнка', deps: [BEP], defaultDeps: ['BepInEx-BepInExPack-5.4.2100'],
    },
    'sons-of-the-forest': {
      title: 'Sons Of The Forest', emoji: '🌲', loader: 'bepinex', community: 'sons-of-the-forest',
      tags: 'sons of the forest лес', deps: [BEP], defaultDeps: ['BepInEx-BepInExPack-5.4.2100'],
    },
    raft: {
      title: 'Raft', emoji: '🛶', loader: 'bepinex', community: 'raft',
      tags: 'raft рафт', deps: [BEP], defaultDeps: ['BepInEx-BepInExPack-5.4.2100'],
    },
    h3vr: {
      title: 'H3VR', emoji: '🧨', loader: 'bepinex', community: 'h3vr',
      tags: 'h3vr hot dogs horseshoes vr', deps: [BEP], defaultDeps: [],
    },
    'gorilla-tag': {
      title: 'Gorilla Tag', emoji: '🦍', loader: 'bepinex', community: 'gorilla-tag',
      tags: 'gorilla tag monke горилла', deps: [BEP], defaultDeps: ['BepInEx-BepInExPack-5.4.2100'],
    },
    'among-us': {
      title: 'Among Us', emoji: '🔪', loader: 'bepinex', community: 'among-us',
      tags: 'among us амонг ас', deps: [BEP], defaultDeps: [],
    },
    'deep-rock-galactic': {
      title: 'Deep Rock Galactic', emoji: '⛏️', loader: 'none', community: 'deep-rock-galactic',
      tags: 'deep rock galactic drg', deps: [], defaultDeps: [],
    },
    palworld: {
      title: 'Palworld', emoji: '🐾', loader: 'none', community: 'palworld',
      tags: 'palworld палворлд', deps: [], defaultDeps: [],
    },
    'schedule-i': {
      title: 'Schedule I', emoji: '💊', loader: 'melonloader', community: 'schedule-i',
      tags: 'schedule i шедул', deps: [ML], defaultDeps: ['LavaGang-MelonLoader-0.7.3'],
    },
    rumble: {
      title: 'RUMBLE', emoji: '🥊', loader: 'melonloader', community: 'rumble',
      tags: 'rumble vr', deps: [ML], defaultDeps: ['LavaGang-MelonLoader-0.7.3'],
    },
    'hard-bullet': {
      title: 'Hard Bullet', emoji: '🔪', loader: 'melonloader', community: 'hard-bullet',
      tags: 'hard bullet vr', deps: [ML], defaultDeps: ['LavaGang-MelonLoader-0.7.3'],
    },
    'backpack-hero': {
      title: 'Backpack Hero', emoji: '🎒', loader: 'melonloader', community: 'backpack-hero',
      tags: 'backpack hero', deps: [ML], defaultDeps: ['LavaGang-MelonLoader-0.7.3'],
    },
    'patch-quest': {
      title: 'Patch Quest', emoji: '🧩', loader: 'melonloader', community: 'patch-quest',
      tags: 'patch quest', deps: [ML], defaultDeps: ['LavaGang-MelonLoader-0.7.3'],
    },
    northstar: {
      title: 'Titanfall 2 · Northstar', emoji: '🚀', loader: 'northstar', community: 'northstar',
      tags: 'northstar titanfall титанфолл', deps: [], defaultDeps: [],
    },
    other: {
      title: 'Other game', emoji: '🎲', loader: 'bepinex', community: '',
      tags: 'other custom другая',
      deps: [BEP, ML], defaultDeps: [],
    },
    raw: {
      title: 'No loader', emoji: '📦', loader: 'none', community: '',
      tags: 'modpack модпак ассеты raw', deps: [], defaultDeps: [],
    },
  };

  const PALETTE = ['#3b6cf5', '#7b5cf0', '#0ea5b7', '#0d8f4f', '#c8861a', '#d02c22', '#db2777', '#64748b'];

  // ---------- state ----------
  const state = {
    files: [],              // {id, name, path, size, file}
    deps: [],
    iconBlob: null,         // Blob (ready 256x256 png)
    iconUrl: null,
    iconSource: 'generated',
    iconTouched: false,      // true once the user explicitly picks/generates an icon
    accent: PALETTE[0],
    activeDoc: 'readme',
    game: 'bonelab',
    autoDeps: [],           // dependencies injected by the game preset
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
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const toast = (msg, kind = '') => {
    const el = $('toast');
    el.textContent = msg;
    el.className = 'toast show ' + kind;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { el.className = 'toast ' + kind; }, 2600);
  };
  const debounce = (fn, ms = 160) => {
    let timer; return (...a) => { clearTimeout(timer); timer = setTimeout(() => fn(...a), ms); };
  };

  // ============================================================
  // THEME
  // ============================================================
  const currentTheme = () => (document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');

  function renderThemeButton() {
    const btn = $('btnTheme');
    const key = currentTheme() === 'dark' ? 'ui.themeToLight' : 'ui.themeToDark';
    btn.setAttribute('aria-label', T(key));
    btn.setAttribute('title', T(key));
  }

  function setTheme(theme, notify) {
    document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light');
    try { localStorage.setItem(THEME_KEY, theme); } catch (_) { /* private mode */ }
    renderThemeButton();
    if (notify) toast(T('toast.theme', { theme: theme }), '');
  }

  // ============================================================
  // LANGUAGE
  // ============================================================
  function renderLangSwitch() {
    document.querySelectorAll('#langSwitch button').forEach((b) => {
      b.classList.toggle('active', b.dataset.lang === window.I18N.lang);
    });
  }

  function switchLang(lang) {
    if (lang === window.I18N.lang) return;
    window.I18N.setLang(lang);   // applies static markup, then fires onChange → full re-render
    renderLangSwitch();
    toast(T('toast.lang', { lang: lang.toUpperCase() }), '');
  }

  // ============================================================
  // FILES
  // ============================================================
  function addFiles(fileList) {
    const incoming = Array.from(fileList || []);
    if (!incoming.length) return;
    // a single Thunderstore zip — import it as a whole package
    if (incoming.length === 1 && /\.zip$/i.test(incoming[0].name)) {
      if (confirm(T('toast.confirmImport', { file: incoming[0].name }))) {
        importZip(incoming[0]);
        return;
      }
    }
    for (const f of incoming) {
      const rel = (f.webkitRelativePath || '').split('/').slice(1).join('/') || f.name;
      if (state.files.some((x) => x.path === rel && x.size === f.size)) continue;
      state.files.push({ id: ++uid, name: f.name, path: rel, size: f.size, file: f });
    }
    // if the user has not chosen an icon yet, grab icon.png from the selection
    const ic = state.files.find((f) => /^icon\.png$/i.test(f.name));
    if (ic && !state.iconTouched) loadIconFromFile(ic.file, true);
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
      btn.className = 'x'; btn.type = 'button'; btn.title = T('files.remove'); btn.textContent = '×';
      btn.onclick = () => { state.files = state.files.filter((x) => x.id !== f.id); renderFiles(); update(); };
      li.appendChild(btn);
      ul.appendChild(li);
    }
    const total = state.files.reduce((s, f) => s + f.size, 0);
    $('filesSummary').textContent = state.files.length
      ? T('files.count', { n: state.files.length, word: P('files.word', state.files.length), size: fmtSize(total) })
      : T('files.none');
  }

  function fileIcon(n) {
    if (/\.(png|jpe?g|webp|gif)$/i.test(n)) return '🖼️';
    if (/\.(json|cfg|xml|yml|yaml|txt|md)$/i.test(n)) return '📄';
    if (/\.(zip|7z|rar)$/i.test(n)) return '🗜️';
    if (/\.(wav|mp3|ogg)$/i.test(n)) return '🔊';
    if (/\.(bundle|assets|unity3d)$/i.test(n)) return '🎮';
    return '📎';
  }

  function installDir() {
    const v = $('installPath').value;
    if (v === 'custom') return ($('customPath').value || '').replace(/^\/+|\/+$/g, '');
    return v;
  }

  // ============================================================
  // GAMES / PRESETS
  // ============================================================
  const loaderLabel = (id) => T('loaders.' + (id || 'none'));

  // every language's words, so the search works for both EN and RU queries
  const searchIndex = ([key, g]) => {
    const loaders = window.I18N.langs.map((l) => (window.I18N.dict[l].loaders[g.loader] || '')).join(' ');
    return `${key} ${g.title} ${g.tags || ''} ${loaders} ${g.community || ''}`.toLowerCase();
  };

  function renderGames() {
    const box = $('games');
    box.innerHTML = '';
    const q = ($('gameSearch') ? $('gameSearch').value : '').trim().toLowerCase();
    const all = Object.entries(GAMES);
    const entries = all.filter(([key, g]) => !q || searchIndex([key, g]).includes(q));
    $('gameCount').textContent = q
      ? T('game.countFiltered', { n: entries.length, m: all.length })
      : T('game.countAll', { n: all.length, word: P('game.countAllWord', all.length) });
    if (!entries.length) {
      const empty = document.createElement('div');
      empty.className = 'games-empty';
      empty.textContent = T('game.none');
      box.appendChild(empty);
      return;
    }
    entries.forEach(([key, g]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'game' + (key === state.game ? ' sel' : '');
      b.innerHTML = `<span class="g-emoji">${g.emoji}</span>
        <span class="g-meta"><span class="g-name">${esc(g.title)}</span>
        <span class="g-loader">${esc(loaderLabel(g.loader))}</span></span>`;
      b.onclick = () => selectGame(key, true);
      box.appendChild(b);
    });
  }

  function renderPathOptions(keepValue) {
    const sel = $('installPath');
    // note: '' is a valid value (archive root), so “no value” is tracked explicitly
    const prev = keepValue !== undefined && keepValue !== null
      ? keepValue
      : (sel.options.length ? sel.value : null);
    const list = PATHS[game().loader] || PATHS.none;
    sel.innerHTML = '';
    list.forEach(([val, labelKey]) => {
      const o = document.createElement('option');
      o.value = val; o.textContent = T(labelKey);
      sel.appendChild(o);
    });
    sel.value = list.some(([v]) => v === prev) ? prev : list[0][0];
    $('customPath').classList.toggle('hidden', sel.value !== 'custom');
  }

  function renderDepPresets() {
    const box = $('depPresets');
    box.innerHTML = '';
    const list = game().deps;
    if (!list.length) {
      const span = document.createElement('span');
      span.className = 'help';
      span.textContent = T('manifest.depPresetsNone');
      box.appendChild(span);
      return;
    }
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
      ? `${esc(T('game.community'))} <a href="https://thunderstore.io/c/${g.community}/" target="_blank" rel="noopener">thunderstore.io/c/${g.community}</a>`
      : '';
    $('gameNote').innerHTML = window.I18N.gameNote(key);
    if (userAction) {
      // drop the dependencies the previous preset injected, add the new ones
      state.deps = state.deps.filter((d) => !state.autoDeps.includes(d));
      state.autoDeps = g.defaultDeps.slice();
      g.defaultDeps.forEach((d) => { if (!state.deps.includes(d)) state.deps.push(d); });
      renderDeps();
      toast(T('game.toast', { game: g.title }), 'ok');
    }
    update();
  }

  // ============================================================
  // ICON
  // ============================================================
  function drawGeneratedIcon() {
    const c = $('iconCanvas'), ctx = c.getContext('2d');
    const name = ($('name').value || 'Mod').replace(/_/g, ' ').trim() || 'Mod';
    const accent = state.accent;

    const g = ctx.createLinearGradient(0, 0, 256, 256);
    g.addColorStop(0, shade(accent, 20));
    g.addColorStop(1, shade(accent, -45));
    ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 256);

    // light pattern
    ctx.strokeStyle = 'rgba(255,255,255,.07)'; ctx.lineWidth = 2;
    for (let i = -256; i < 256; i += 22) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + 256, 256); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(0,0,0,.22)';
    ctx.beginPath(); ctx.arc(200, 210, 110, 0, Math.PI * 2); ctx.fill();

    // initials
    const parts = name.split(/[\s_\-]+/).filter(Boolean);
    const initials = (parts.length > 1 ? parts[0][0] + parts[1][0] : name.slice(0, 2)).toUpperCase();
    ctx.fillStyle = '#fff';
    ctx.font = '700 118px system-ui, "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 5;
    ctx.fillText(initials, 128, 120);
    ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

    // caption
    ctx.font = '600 20px system-ui, "Segoe UI", Arial, sans-serif';
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
    if (!file || !/^image\//.test(file.type)) { if (!silent) toast(T('icon.errImage'), 'err'); return; }
    if (!silent) state.iconTouched = true;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const c = $('iconCanvas'), ctx = c.getContext('2d');
      ctx.clearRect(0, 0, 256, 256);
      // centered cover-crop
      const s = Math.min(img.width, img.height);
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, 256, 256);
      URL.revokeObjectURL(url);
      state.iconSource = 'upload';
      $('iconBadge').textContent = `256×256 ← ${img.width}×${img.height}`;
      commitCanvasIcon(true);
    };
    img.onerror = () => { URL.revokeObjectURL(url); toast(T('icon.errRead'), 'err'); };
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
  // MANIFEST / VALIDATION
  // Messages are i18n keys — they are translated at render time.
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

    if (!author) errors.push({ key: 'errs.noAuthor' });
    else if (!NAME_RE.test(author)) errors.push({ key: 'errs.badAuthor' });

    if (!name) errors.push({ key: 'errs.noName' });
    else if (!NAME_RE.test(name)) errors.push({ key: 'errs.badName' });
    else if (name.length > 128) errors.push({ key: 'errs.longName' });

    if (!desc) errors.push({ key: 'errs.noDesc' });
    else if (desc.length > 250) errors.push({ key: 'errs.longDesc' });

    if (!ver) errors.push({ key: 'errs.noVersion' });
    else if (!SEMVER_RE.test(ver)) errors.push({ key: 'errs.badVersion' });

    if (site && !/^https?:\/\/\S+$/i.test(site)) errors.push({ key: 'errs.badWebsite' });

    const badDeps = state.deps.filter((d) => !DEP_RE.test(d));
    if (badDeps.length) errors.push({ key: 'errs.badDeps', vars: { list: badDeps.join(', ') } });
    if (new Set(state.deps).size !== state.deps.length) warns.push({ key: 'errs.dupDeps' });

    if (!state.iconBlob) errors.push({ key: 'errs.noIcon' });
    if (!readme) errors.push({ key: 'errs.noReadme' });
    else if (readme.length < 80) warns.push({ key: 'errs.shortReadme' });

    if (!state.files.length) warns.push({ key: 'errs.noFiles' });
    else if (!state.files.some((f) => /\.dll$/i.test(f.name))) warns.push({ key: 'errs.noDll' });

    if ($('installPath').value === 'custom' && !installDir()) errors.push({ key: 'errs.customPath' });

    if (game().loader === 'melonloader' && /^BepInEx/i.test(installDir())) {
      warns.push({ key: 'errs.wrongPathMelon' });
    }
    if (game().loader === 'bepinex' && /^(Mods|Plugins|UserLibs|UserData)$/i.test(installDir())) {
      warns.push({ key: 'errs.wrongPathBep' });
    }

    const total = state.files.reduce((s, f) => s + f.size, 0);
    if (total > MAX_ZIP) errors.push({ key: 'errs.tooBig' });

    const nameClash = state.files.some((f) => /^(manifest\.json|readme\.md|changelog\.md|icon\.png)$/i.test(f.path) && !installDir());
    if (nameClash) warns.push({ key: 'errs.nameClash' });

    if (!errors.length) {
      oks.push({ key: 'errs.valid', vars: { name: zipBaseName() } });
      const g = game();
      if (g.loader === 'melonloader' && !state.deps.some((d) => /^LavaGang-MelonLoader-/.test(d))) {
        warns.push({ key: 'errs.melonDep', vars: { game: g.title } });
      } else if (g.loader === 'bepinex' && !state.deps.some((d) => /BepInExPack/i.test(d))) {
        warns.push({ key: 'errs.bepDep', vars: { game: g.title } });
      } else if (!state.deps.length) {
        warns.push({ key: 'errs.noDeps' });
      }
    }
    return { errors, warns, oks };
  }

  function mark(id, ok) { $(id).classList.toggle('bad', !ok); }

  // ---------- readiness ----------
  function manifestReady() {
    const author = $('author').value.trim();
    const name = $('name').value.trim();
    const desc = $('description').value.trim();
    const ver = $('version').value.trim();
    return !!author && NAME_RE.test(author)
      && !!name && NAME_RE.test(name) && name.length <= 128
      && !!desc && desc.length <= 250
      && SEMVER_RE.test(ver)
      && state.deps.every((d) => DEP_RE.test(d));
  }

  function renderReadiness() {
    const checks = [
      ['files', state.files.length > 0],
      ['manifest', manifestReady()],
      ['icon', !!state.iconBlob],
      ['readme', $('readme').value.trim().length > 0],
    ];
    let done = 0;
    checks.forEach(([id, ok]) => {
      $('step-' + id).classList.toggle('done', ok);
      if (ok) done++;
    });
    $('readyBar').style.width = Math.round((done / checks.length) * 100) + '%';
    $('readyCount').textContent = T('readiness.count', { done, total: checks.length });
    const hint = $('readyHint');
    const all = done === checks.length;
    hint.classList.toggle('ready', all);
    hint.textContent = all ? T('readiness.ready') : T('readiness.hint');
  }

  // ============================================================
  // RENDER
  // ============================================================
  function renderDeps() {
    const ul = $('depList');
    ul.innerHTML = '';
    state.deps.forEach((d, i) => {
      const li = document.createElement('li');
      if (!DEP_RE.test(d)) li.className = 'invalid';
      li.innerHTML = `<span title="${esc(d)}">${esc(d)}</span>`;
      const b = document.createElement('button');
      b.className = 'x'; b.type = 'button'; b.textContent = '×'; b.title = T('files.remove');
      b.onclick = () => { state.deps.splice(i, 1); renderDeps(); update(); };
      li.appendChild(b);
      ul.appendChild(li);
    });
  }

  function renderPreview() {
    const author = $('author').value.trim() || T('manifest.authorPh');
    const name = $('name').value.trim() || T('manifest.namePh');
    const desc = $('description').value.trim() || T('manifest.descPh');
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
    const html = window.marked
      ? marked.parse(md || T('preview.readmeEmpty'), { breaks: true, gfm: true })
      : esc(md);
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
    $('treeSize').textContent = T('preview.approx', { size: fmtSize(total + (state.iconBlob ? state.iconBlob.size : 0) + 2048) });
  }

  function renderValidation() {
    const { errors, warns, oks } = validate();
    const ul = $('issues');
    ul.innerHTML = '';
    const add = (cls, icon, text) => {
      const li = document.createElement('li');
      li.className = cls;
      li.innerHTML = `<span>${icon}</span><span>${esc(text)}</span>`;
      ul.appendChild(li);
    };
    errors.forEach((e) => add('err', '✕', T(e.key, e.vars)));
    warns.forEach((w) => add('warn', '!', T(w.key, w.vars)));
    oks.forEach((o) => add('ok', '✓', T(o.key, o.vars)));
    if (!ul.children.length) add('ok', '✓', T('validation.allGood'));

    const pill = $('statusPill');
    if (errors.length) { pill.className = 'pill pill-err'; pill.textContent = T('validation.statusErr', { n: errors.length }); }
    else if (warns.length) { pill.className = 'pill pill-warn'; pill.textContent = T('validation.statusWarn', { n: warns.length }); }
    else { pill.className = 'pill pill-ok'; pill.textContent = T('validation.statusOk'); }

    $('btnDownload').disabled = errors.length > 0;
    $('zipName').textContent = zipBaseName() + '.zip';
    $('descCounter').textContent = `${$('description').value.length} / 250`;
  }

  const update = debounce(() => {
    renderPreview();
    renderValidation();
    renderReadiness();
    saveProfile(true);
  }, 120);

  // ============================================================
  // BUILD ZIP
  // ============================================================
  async function buildZip() {
    const btn = $('btnDownload');
    const old = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<span>${esc(T('validation.downloading'))}</span><small>${esc(T('validation.downloadingWait'))}</small>`;
    try {
      if (!window.JSZip) { toast(T('toast.jsMissing'), 'err'); return; }
      if (!state.iconBlob) { toast(T('errs.noIcon'), 'err'); return; }
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
      toast(T('toast.zipDone', { name: a.download, size: fmtSize(blob.size) }), 'ok');
    } catch (e) {
      console.error(e);
      toast(T('toast.zipFail', { msg: e.message }), 'err');
    } finally {
      btn.innerHTML = old;
      renderValidation();
    }
  }

  // ============================================================
  // IMPORT A READY ZIP
  // ============================================================
  const KNOWN_PREFIXES = ['BepInEx/plugins', 'BepInEx/patchers', 'BepInEx/config', 'Mods', 'Plugins', 'UserLibs', 'UserData', 'mods'];

  let importing = false;
  async function importZip(file) {
    if (importing) return;
    if (!window.JSZip) { toast(T('toast.noJsZip'), 'err'); return; }
    importing = true;
    try { await doImportZip(file); } finally { importing = false; }
  }

  async function doImportZip(file) {
    toast(T('toast.importStart'));
    let zip;
    try { zip = await JSZip.loadAsync(file); }
    catch (e) { toast(T('toast.notZip'), 'err'); return; }

    const all = Object.values(zip.files).filter((f) => !f.dir);
    const manifestEntry = all.find((f) => /(^|\/)manifest\.json$/i.test(f.name));
    if (!manifestEntry) { toast(T('toast.noManifest'), 'err'); return; }
    const root = manifestEntry.name.replace(/manifest\.json$/i, '');   // '' or 'folder/'
    const rel = (n) => (n.startsWith(root) ? n.slice(root.length) : n);

    // manifest
    let mf = {};
    try { mf = JSON.parse(await manifestEntry.async('string')); }
    catch (e) { toast(T('toast.manifestBroken', { msg: e.message }), 'err'); return; }

    $('name').value = mf.name || '';
    $('version').value = mf.version_number || '1.0.0';
    $('description').value = mf.description || '';
    $('website').value = mf.website_url || '';
    state.deps = Array.isArray(mf.dependencies) ? mf.dependencies.slice() : [];
    state.autoDeps = [];

    // author from the file name Author-Name-1.0.0.zip
    const m = (file.name || '').match(/^([A-Za-z0-9_]+)-([A-Za-z0-9_]+)-\d+\.\d+\.\d+\.zip$/i);
    if (m) $('author').value = m[1];

    // documents
    const readmeEntry = all.find((f) => rel(f.name).toLowerCase() === 'readme.md');
    if (readmeEntry) $('readme').value = await readmeEntry.async('string');
    const chEntry = all.find((f) => rel(f.name).toLowerCase() === 'changelog.md');
    if (chEntry) { $('changelog').value = await chEntry.async('string'); $('includeChangelog').checked = true; }

    // icon
    const iconEntry = all.find((f) => rel(f.name).toLowerCase() === 'icon.png');
    if (iconEntry) {
      const blob = await iconEntry.async('blob');
      loadIconFromFile(new File([blob], 'icon.png', { type: 'image/png' }), true);
    }

    // everything else
    const rest = all.filter((f) => !/^(manifest\.json|readme\.md|changelog\.md|icon\.png)$/i.test(rel(f.name)));
    const paths = rest.map((f) => rel(f.name));
    const prefix = KNOWN_PREFIXES
      .filter((p) => paths.length && paths.every((x) => x.toLowerCase().startsWith(p.toLowerCase() + '/')))
      .sort((a, b) => b.length - a.length)[0] || '';

    // guess the game / loader from the structure
    if (prefix) {
      const loader = /^BepInEx/i.test(prefix) ? 'bepinex' : prefix === 'mods' ? 'northstar' : 'melonloader';
      if (game().loader !== loader) {
        const key = Object.keys(GAMES).find((k) => GAMES[k].loader === loader);
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
    toast(T('toast.imported', {
      name: mf.name || file.name,
      n: rest.length,
      word: P('files.word', rest.length),
    }), 'ok');
  }

  // ============================================================
  // TEMPLATES — always English, no matter the interface language.
  // Mod pages on Thunderstore are read worldwide; switching the
  // UI language never rewrites these.
  // ============================================================
  const loaderNameEN = (id) => window.I18N.dict.en.loaders[id] || 'no loader';

  function readmeTemplate() {
    const modId = $('name').value.trim() || 'My_Awesome_Mod';
    const name = modId.replace(/_/g, ' ');
    const author = $('author').value.trim() || 'Author';
    const version = $('version').value.trim() || '1.0.0';
    const desc = $('description').value.trim() || 'A short description of what this mod does.';
    const site = $('website').value.trim();
    const g = game();
    const deps = state.deps.length ? state.deps.map((d) => `- \`${d}\``).join('\n') : '- None';
    const melon = g.loader === 'melonloader';

    let install;
    if (melon) {
      install = [
        `1. Install [MelonLoader](https://thunderstore.io/c/${g.community || 'bonelab'}/p/LavaGang/MelonLoader/) and launch the game once.`,
        `2. Install this mod with the Thunderstore App / r2modman — or drop \`${modId}.dll\` into the \`Mods\` folder next to the game.`,
        '3. Launch the game and check the MelonLoader console — the mod should show up while loading.',
      ].join('\n');
    } else if (g.loader === 'northstar') {
      install = [
        '1. Install [Northstar](https://thunderstore.io/c/northstar/p/Northstar/Northstar/).',
        `2. Unpack the mod into \`mods/${author}.${modId}/\` next to \`NorthstarLauncher.exe\`.`,
        '3. Launch the game through NorthstarLauncher.',
      ].join('\n');
    } else if (g.loader === 'none') {
      install = [
        '1. Unpack the archive into the game folder, or install it with your mod manager.',
        '2. Keep the folder structure from this package.',
        '3. Launch the game.',
      ].join('\n');
    } else {
      install = [
        '1. Install [BepInEx](https://thunderstore.io/package/BepInEx/BepInExPack/) and launch the game once.',
        `2. Install this mod with r2modman / Gale — or drop \`${modId}.dll\` into \`BepInEx/plugins\`.`,
        '3. Restart the game so the config file is generated.',
      ].join('\n');
    }

    const cfg = melon
      ? `The config file appears at \`UserData/${modId}.cfg\`.`
      : `The config file appears at \`BepInEx/config/${author}.${modId}.cfg\`.`;

    return `# ${name}

${desc}

> Game: **${g.title}** · Loader: **${loaderNameEN(g.loader)}** · Version: **${version}** · Author: **${author}**

## ✨ Features

- Feature one
- Feature two
- Feature three

## 📦 Installation

${install}

## ⚙️ Configuration

${cfg}

| Option | Default | Description |
| --- | --- | --- |
| Enabled | true | Enable or disable the mod |

## 🔗 Dependencies

${deps}

## 🐞 Bugs & Suggestions

${site ? `Open an issue in the repository: ${site}` : 'Open an issue in the repository or ping me on Discord.'}

## 📜 License

MIT
`;
  }

  function changelogTemplate() {
    const v = $('version').value.trim() || '1.0.0';
    const d = new Date().toISOString().slice(0, 10);
    return `# Changelog

## ${v} — ${d}

### Added
- First release 🎉

### Fixed
- —
`;
  }

  // ============================================================
  // PROFILE (localStorage)
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
      if (!quiet) toast(T('toast.profileSaved'), 'ok');
    } catch (_) { /* private mode */ }
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
  // UI INIT
  // ============================================================
  function initDropzone(zone, input, handler) {
    zone.addEventListener('click', () => input.click());
    zone.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); } });
    input.addEventListener('change', () => { handler(input.files); input.value = ''; });
    ['dragenter', 'dragover'].forEach((ev) => zone.addEventListener(ev, (e) => { e.preventDefault(); zone.classList.add('drag'); }));
    ['dragleave', 'drop'].forEach((ev) => zone.addEventListener(ev, (e) => { e.preventDefault(); zone.classList.remove('drag'); }));
    zone.addEventListener('drop', (e) => { if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) handler(e.dataTransfer.files); });
  }

  function renderAll() {
    renderGames();
    renderPathOptions(undefined);
    renderDepPresets();
    renderDeps();
    renderFiles();
    renderPreview();
    renderValidation();
    renderReadiness();
  }

  function init() {
    if (init._done) return;      // guard against double init
    init._done = true;

    window.I18N.apply(document);
    renderThemeButton();
    renderLangSwitch();

    // header controls
    $('btnTheme').onclick = () => setTheme(currentTheme() === 'dark' ? 'light' : 'dark', true);
    document.querySelectorAll('#langSwitch button').forEach((b) => {
      b.onclick = () => switchLang(b.dataset.lang);
    });

    // accent palette
    PALETTE.forEach((c) => {
      const s = document.createElement('div');
      s.className = 'swatch' + (c === state.accent ? ' sel' : '');
      s.style.background = c;
      s.onclick = () => {
        state.accent = c;
        state.iconTouched = true;
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
    $('btnGenIcon').onclick = () => { state.iconTouched = true; drawGeneratedIcon(); };

    // fields
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

    // dependencies
    const addDep = () => {
      const raw = $('depInput').value.trim();
      if (!raw) return;
      raw.split(/[\s,]+/).filter(Boolean).forEach((d) => { if (!state.deps.includes(d)) state.deps.push(d); });
      $('depInput').value = '';
      renderDeps(); update();
    };
    $('btnAddDep').onclick = addDep;
    $('depInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); addDep(); } });

    // version bumpers
    const bump = (idx) => {
      const p = ($('version').value.trim().match(SEMVER_RE) || [, '0', '0', '0']).slice(1).map(Number);
      p[idx]++; for (let i = idx + 1; i < 3; i++) p[i] = 0;
      $('version').value = p.join('.'); update();
    };
    $('bumpPatch').onclick = () => bump(2);
    $('bumpMinor').onclick = () => bump(1);

    // document tabs
    document.querySelectorAll('#docTabs .tab').forEach((tab) => {
      tab.onclick = () => {
        document.querySelectorAll('#docTabs .tab').forEach((x) => x.classList.remove('active'));
        tab.classList.add('active');
        state.activeDoc = tab.dataset.doc;
        $('readme').classList.toggle('hidden', state.activeDoc !== 'readme');
        $('changelog').classList.toggle('hidden', state.activeDoc !== 'changelog');
      };
    });
    // preview tabs
    document.querySelectorAll('#prevTabs .tab').forEach((tab) => {
      tab.onclick = () => {
        document.querySelectorAll('#prevTabs .tab').forEach((x) => x.classList.remove('active'));
        tab.classList.add('active');
        ['page', 'card', 'tree', 'json'].forEach((pane) => $('pane-' + pane).classList.toggle('hidden', pane !== tab.dataset.prev));
      };
    });

    $('btnTemplate').onclick = () => {
      // templates stay English on purpose — see readmeTemplate()
      if (state.activeDoc === 'changelog') {
        $('changelog').value = changelogTemplate();
        $('includeChangelog').checked = true;
      } else {
        $('readme').value = readmeTemplate();
      }
      update();
      toast(T('toast.template'), 'ok');
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
      try { await navigator.clipboard.writeText(JSON.stringify(buildManifest(), null, 2)); toast(T('toast.manifestCopied'), 'ok'); }
      catch (_) { toast(T('toast.clipboardFail'), 'err'); }
    };
    $('btnReset').onclick = () => {
      if (!confirm(T('toast.resetConfirm'))) return;
      localStorage.removeItem(STORAGE_KEY);
      location.reload();
    };

    // global dnd — keep the browser from opening dropped files
    window.addEventListener('dragover', (e) => e.preventDefault());
    window.addEventListener('drop', (e) => e.preventDefault());

    // initial values
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
    renderAll();

    // re-render all dynamic content when the language changes;
    // the markdown editors are intentionally left untouched
    window.I18N.onChange(() => {
      renderAll();
      renderThemeButton();
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
