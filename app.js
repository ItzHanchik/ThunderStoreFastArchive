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
    none: [
      ['', 'Корень архива — рядом с manifest.json'],
      ['custom', 'Своя папка…'],
    ],
  };

  // ---------- игры ----------
  const GAMES = {
    bonelab: {
      title: 'BONELAB', emoji: '🦴', loader: 'melonloader', community: 'bonelab',
      note: 'MelonLoader раскладывает содержимое в <code>Mods/&lt;Author-ModName&gt;/</code>. Код-моды — в <code>Mods/</code>, ассеты и палеты — в <code>UserData/</code>.',
      deps: [
        ['MelonLoader 0.6.6', 'LavaGang-MelonLoader-0.6.6'],
        ['MelonLoader 0.7.3 (свежий)', 'LavaGang-MelonLoader-0.7.3'],
        ['BoneLib', 'gnonme-BoneLib-3.1.3'],
        ['Fusion', 'Lakatrazz-Fusion-1.9.2'],
      ],
      defaultDeps: ['LavaGang-MelonLoader-0.6.6', 'gnonme-BoneLib-3.1.3'],
    },
    boneworks: {
      title: 'BONEWORKS', emoji: '🔩', loader: 'melonloader', community: 'boneworks',
      note: 'BONEWORKS-моды собраны под MelonLoader <b>0.5.7</b> — более новые версии ломают совместимость.',
      deps: [['MelonLoader 0.5.7', 'LavaGang-MelonLoader-0.5.7']],
      defaultDeps: ['LavaGang-MelonLoader-0.5.7'],
    },
    lethal: {
      title: 'Lethal Company', emoji: '🛸', loader: 'bepinex', community: 'lethal-company',
      note: 'Классический BepInEx 5: <code>.dll</code> кладётся в <code>BepInEx/plugins</code>.',
      deps: [
        ['BepInExPack', 'BepInEx-BepInExPack-5.4.2100'],
        ['LethalLib', 'Evaisa-LethalLib-0.16.1'],
        ['MMHOOK', 'Evaisa-HookGenPatcher-0.0.5'],
        ['LC_API', '2018-LC_API-3.4.2'],
      ],
      defaultDeps: ['BepInEx-BepInExPack-5.4.2100'],
    },
    repo: {
      title: 'R.E.P.O.', emoji: '🤖', loader: 'bepinex', community: 'repo',
      note: 'BepInEx 5, плагины в <code>BepInEx/plugins</code>.',
      deps: [['BepInExPack', 'BepInEx-BepInExPack-5.4.2100'], ['REPOLib', 'Zehs-REPOLib-2.1.0']],
      defaultDeps: ['BepInEx-BepInExPack-5.4.2100'],
    },
    valheim: {
      title: 'Valheim', emoji: '⚔️', loader: 'bepinex', community: 'valheim',
      note: 'У Valheim свой BepInEx-пак от denikson.',
      deps: [['BepInExPack Valheim', 'denikson-BepInExPack_Valheim-5.4.2202'], ['Jotunn', 'ValheimModding-Jotunn-2.20.1']],
      defaultDeps: ['denikson-BepInExPack_Valheim-5.4.2202'],
    },
    ror2: {
      title: 'Risk of Rain 2', emoji: '🌧️', loader: 'bepinex', community: 'riskofrain2',
      note: 'BepInEx + R2API — стандартный стек RoR2.',
      deps: [['BepInExPack', 'bbepis-BepInExPack-5.4.2113'], ['R2API', 'tristanmcpherson-R2API-5.0.12']],
      defaultDeps: ['bbepis-BepInExPack-5.4.2113'],
    },
    other: {
      title: 'Другая игра', emoji: '🎲', loader: 'bepinex', community: '',
      note: 'Общий BepInEx-профиль. Зависимости и путь можно задать вручную.',
      deps: [['BepInExPack', 'BepInEx-BepInExPack-5.4.2100'], ['MelonLoader', 'LavaGang-MelonLoader-0.7.3']],
      defaultDeps: [],
    },
    raw: {
      title: 'Без загрузчика', emoji: '📦', loader: 'none', community: '',
      note: 'Модпак или набор ассетов: файлы ложатся в корень архива.',
      deps: [],
      defaultDeps: [],
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
  function renderGames() {
    const box = $('games'); box.innerHTML = '';
    Object.entries(GAMES).forEach(([key, g]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'game' + (key === state.game ? ' sel' : '');
      b.innerHTML = `<span class="g-emoji">${g.emoji}</span>
        <span class="g-meta"><span class="g-name">${esc(g.title)}</span>
        <span class="g-loader">${g.loader === 'melonloader' ? 'MelonLoader' : g.loader === 'bepinex' ? 'BepInEx' : 'без загрузчика'}</span></span>`;
      b.onclick = () => selectGame(key, true);
      box.appendChild(b);
    });
  }

  function renderPathOptions(keepValue) {
    const sel = $('installPath');
    const prev = keepValue || sel.value;
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
    $('loaderHint').textContent = g.loader === 'melonloader' ? 'MelonLoader' : g.loader === 'bepinex' ? 'BepInEx 5' : 'без загрузчика';
    $('gameNote').innerHTML = g.note;
    if (userAction) {
      // подставляем базовые зависимости загрузчика, не трогая пользовательские
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
        accent: state.accent, game: state.game,
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
