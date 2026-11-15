// irenu // me — личный раздел: доски (как Trello) и тесты для учёбы.
// Доступ только после входа (тот же логин, что в админке). Данные видит только владелец (RLS). // 23
import { getClient, isConfigured } from '../js/db.js';
import { esc } from '../js/util.js';

const $app = document.getElementById('app');
const $title = document.getElementById('title');
const $back = document.getElementById('back');
const $tabs = document.getElementById('tabs');
const $saved = document.getElementById('saved');
const $action = document.getElementById('action');
const $toast = document.getElementById('toast');

let sb = null;
let user = null;

// ── утилиты ────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 10);
async function q(promise) {
  const { data, error } = await promise;
  if (error) throw error;
  return data;
}
let toastTimer;
function toast(msg, bad = false) {
  $toast.textContent = msg;
  $toast.classList.toggle('bad', bad);
  $toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => ($toast.hidden = true), bad ? 5000 : 2000);
}
function humanError(e) {
  if (!e) return 'Ошибка';
  if (/Invalid login/i.test(e.message)) return 'Неверная почта или пароль';
  if (/relation .* does not exist|me_boards|me_tests/i.test(e.message)) return 'Нет таблиц — запусти supabase/update-6.sql';
  return e.message || String(e);
}
function header(title, backHref = null, action = '') {
  $title.textContent = title;
  $back.hidden = !backHref;
  if (backHref) $back.href = backHref;
  $action.innerHTML = action;
  $saved.textContent = '';
}
function setTab(name) {
  $tabs.querySelectorAll('a').forEach((a) => a.classList.toggle('active', a.dataset.tab === name));
}
const fmtDate = (d) => new Date(d).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};
function loadScript(src) {
  return new Promise((ok, fail) => {
    if (document.querySelector(`script[src="${src}"]`)) return ok();
    const s = document.createElement('script');
    s.src = src; s.onload = ok; s.onerror = fail;
    document.head.appendChild(s);
  });
}

// Шторка снизу (вместо prompt/confirm — на iPhone так удобнее)
function sheet(html, onMount) {
  const wrap = document.createElement('div');
  wrap.className = 'sheet-wrap';
  wrap.innerHTML = `<div class="sheet" role="dialog" aria-modal="true"><div class="sheet-grip"></div>${html}</div>`;
  document.body.appendChild(wrap);
  const close = () => { wrap.classList.add('out'); setTimeout(() => wrap.remove(), 180); };
  wrap.addEventListener('click', (e) => { if (e.target === wrap) close(); });
  onMount?.(wrap.querySelector('.sheet'), close);
  return close;
}
function ask(title, value = '', placeholder = '', okText = 'Готово') {
  return new Promise((resolve) => {
    let done = false;
    const close = sheet(`
      <h3>${esc(title)}</h3>
      <form class="stack-form">
        <input type="text" name="v" value="${esc(value)}" placeholder="${esc(placeholder)}" autocomplete="off" enterkeyhint="done">
        <button class="btn primary block" type="submit">${esc(okText)}</button>
      </form>`, (el) => {
      const form = el.querySelector('form');
      setTimeout(() => form.v.focus(), 50);
      form.addEventListener('submit', (e) => {
        e.preventDefault(); done = true; close();
        resolve(form.v.value.trim() || null);
      });
    });
    // если закрыли тапом мимо
    const obs = new MutationObserver(() => {
      if (!document.body.contains(document.querySelector('.sheet-wrap'))) { obs.disconnect(); if (!done) resolve(null); }
    });
    obs.observe(document.body, { childList: true });
  });
}
function confirmSheet(title, text, okText = 'Удалить') {
  return new Promise((resolve) => {
    let done = false;
    sheet(`
      <h3>${esc(title)}</h3>
      ${text ? `<p class="hint">${esc(text)}</p>` : ''}
      <div class="row-btns" style="margin-top:16px">
        <button class="btn primary" data-yes>${esc(okText)}</button>
        <button class="btn" data-no>Отмена</button>
      </div>`, (el, close) => {
      el.querySelector('[data-yes]').onclick = () => { done = true; close(); resolve(true); };
      el.querySelector('[data-no]').onclick = () => { done = true; close(); resolve(false); };
    });
    const obs = new MutationObserver(() => {
      if (!document.querySelector('.sheet-wrap')) { obs.disconnect(); if (!done) resolve(false); }
    });
    obs.observe(document.body, { childList: true });
  });
}

// ── вход ───────────────────────────────────────────────
function showLogin() {
  $tabs.hidden = true;
  header('me');
  $app.innerHTML = `
    <div class="login-box">
      <h2>Вход</h2>
      <form class="stack-form" id="login">
        <label class="field"><span>Почта</span><input type="email" name="email" required autocomplete="email" inputmode="email"></label>
        <label class="field"><span>Пароль</span><input type="password" name="password" required autocomplete="current-password"></label>
        <p class="error"></p>
        <button class="btn primary block" type="submit">Войти</button>
      </form>
      <p class="hint" style="margin-top:20px">Тот же логин, что в админке сайта.</p>
    </div>`;
  const form = document.getElementById('login');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button');
    btn.disabled = true;
    form.querySelector('.error').textContent = '';
    try {
      const data = await q(sb.auth.signInWithPassword({ email: form.email.value.trim(), password: form.password.value }));
      user = data.user;
      enter();
    } catch (err) {
      form.querySelector('.error').textContent = humanError(err);
    } finally {
      btn.disabled = false;
    }
  });
}

function enter() {
  $tabs.hidden = false;
  window.addEventListener('hashchange', route);
  route();
}

// ── роутер ─────────────────────────────────────────────
function route() {
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  const [page, id, sub] = parts;
  let run;
  if (!page) { setTab('boards'); run = () => viewBoards(); }
  else if (page === 'board') { setTab('boards'); run = () => viewBoard(id); }
  else if (page === 'tests') { setTab('tests'); run = () => viewTests(); }
  else if (page === 'test' && sub === 'edit') { setTab('tests'); run = () => viewTestEdit(id); }
  else if (page === 'test' && sub === 'run') { setTab('tests'); run = () => viewTestRun(id); }
  else if (page === 'test') { setTab('tests'); run = () => viewTest(id); }
  else if (page === 'more') { setTab('more'); run = () => viewMore(); }
  else { location.hash = '#/'; return; }
  $app.innerHTML = '<div class="loading">Загружаем…</div>';
  run().catch((e) => { console.error(e); $app.innerHTML = `<p class="empty-note">${esc(humanError(e))}</p>`; });
  window.scrollTo(0, 0);
}

function notFound(text, backHref) {
  header('—', backHref);
  $app.innerHTML = `<p class="empty-note">${esc(text)}</p>`;
}

// ═══════════════════════ ДОСКИ ═══════════════════════
const COLORS = ['', '#ff004f', '#ff7a1a', '#ffd23f', '#3ddc84', '#66c0f4', '#a77bff'];
const newBoardData = () => ({
  columns: [
    { id: uid(), title: 'Надо сделать', cards: [] },
    { id: uid(), title: 'В процессе', cards: [] },
    { id: uid(), title: 'Готово', cards: [] },
  ],
});

async function viewBoards() {
  header('Доски');
  const boards = await q(sb.from('me_boards').select('id,title,data,updated_at').order('sort').order('created_at'));
  $app.innerHTML = `
    <div class="tiles">
      ${boards.map((b) => {
        const cols = b.data?.columns || [];
        const total = cols.reduce((n, c) => n + c.cards.length, 0);
        const done = cols.length ? cols[cols.length - 1].cards.length : 0;
        const pct = total ? Math.round((done / total) * 100) : 0;
        return `<a class="tile cut" href="#/board/${b.id}">
          <b>${esc(b.title)}</b>
          <small>${total} карточ${total % 10 === 1 && total % 100 !== 11 ? 'ка' : [2, 3, 4].includes(total % 10) && ![12, 13, 14].includes(total % 100) ? 'ки' : 'ек'} · обновлено ${fmtDate(b.updated_at)}</small>
          <span class="bar"><i style="width:${pct}%"></i></span>
        </a>`;
      }).join('')}
      <button class="tile add" id="new-board"><b>+ Новая доска</b></button>
    </div>`;
  document.getElementById('new-board').onclick = async () => {
    const title = await ask('Новая доска', '', 'Например: Учёба, Chain, Покупки', 'Создать');
    if (!title) return;
    try {
      const row = await q(sb.from('me_boards').insert({ title, data: newBoardData(), sort: boards.length }).select('id').single());
      location.hash = `#/board/${row.id}`;
    } catch (e) { toast(humanError(e), true); }
  };
}

async function viewBoard(id) {
  const board = await q(sb.from('me_boards').select('*').eq('id', id).maybeSingle());
  if (!board) return notFound('Доска не найдена', '#/');
  const data = board.data && Array.isArray(board.data.columns) ? board.data : newBoardData();
  header(board.title, '#/', '<button class="icon-btn" id="board-menu" aria-label="Меню доски">⋯</button>');

  // сохранение с задержкой — чтобы не дёргать базу на каждое движение
  let saveTimer;
  const save = () => {
    $saved.textContent = '…';
    clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      try {
        await q(sb.from('me_boards').update({ data, updated_at: new Date().toISOString() }).eq('id', id));
        $saved.textContent = 'сохранено';
      } catch (e) { $saved.textContent = ''; toast(humanError(e), true); }
    }, 400);
  };

  const findCard = (cardId) => {
    for (const col of data.columns) {
      const i = col.cards.findIndex((c) => c.id === cardId);
      if (i !== -1) return { col, i, card: col.cards[i] };
    }
    return null;
  };

  let dragging = false;
  const render = () => {
    $app.innerHTML = `
      <div class="board">
        ${data.columns.map((col) => `
          <section class="col" data-col="${col.id}">
            <div class="col-head">
              <button class="col-title" data-col-menu="${col.id}">${esc(col.title)}</button>
              <span class="col-count">${col.cards.length}</span>
              <button class="icon-btn" data-col-menu="${col.id}" aria-label="Меню колонки">⋯</button>
            </div>
            <div class="cards" data-cards="${col.id}">
              ${col.cards.map((c) => `
                <div class="kcard" data-card="${c.id}" style="${c.color ? `--c:${c.color}` : ''}">
                  ${esc(c.title)}${c.notes ? '<small>≡ заметка</small>' : ''}
                </div>`).join('')}
            </div>
            <button class="add-card" data-add="${col.id}">+ Карточка</button>
          </section>`).join('')}
        <button class="add-col" id="add-col">+ Колонка</button>
      </div>`;

    $app.querySelectorAll('[data-add]').forEach((b) => (b.onclick = async () => {
      const title = await ask('Новая карточка', '', 'Что нужно сделать?', 'Добавить');
      if (!title) return;
      data.columns.find((c) => c.id === b.dataset.add).cards.push({ id: uid(), title, notes: '', color: '' });
      save(); render();
    }));
    $app.querySelectorAll('[data-card]').forEach((el) => (el.onclick = () => { if (!dragging) editCard(el.dataset.card); }));
    $app.querySelectorAll('[data-col-menu]').forEach((b) => (b.onclick = () => colMenu(b.dataset.colMenu)));
    document.getElementById('add-col').onclick = async () => {
      const title = await ask('Новая колонка', '', 'Название', 'Добавить');
      if (!title) return;
      data.columns.push({ id: uid(), title, cards: [] });
      save(); render();
      $app.querySelector('.board').scrollLeft = 1e6;
    };

    // перетаскивание: на телефоне — долгое нажатие, на компе — сразу
    if (window.Sortable) {
      $app.querySelectorAll('[data-cards]').forEach((list) => {
        new window.Sortable(list, {
          group: 'cards', animation: 160, delay: 220, delayOnTouchOnly: true, touchStartThreshold: 6,
          ghostClass: 'ghost', chosenClass: 'chosen', scrollSensitivity: 80, bubbleScroll: true,
          onStart: () => { dragging = true; },
          onEnd: () => {
            const all = {};
            data.columns.forEach((c) => c.cards.forEach((card) => (all[card.id] = card)));
            $app.querySelectorAll('[data-cards]').forEach((l) => {
              const col = data.columns.find((c) => c.id === l.dataset.cards);
              col.cards = [...l.querySelectorAll('[data-card]')].map((n) => all[n.dataset.card]).filter(Boolean);
              l.closest('.col').querySelector('.col-count').textContent = col.cards.length;
            });
            save();
            setTimeout(() => (dragging = false), 50);
          },
        });
      });
    }
  };

  const editCard = (cardId) => {
    const found = findCard(cardId);
    if (!found) return;
    const { card } = found;
    sheet(`
      <h3>Карточка</h3>
      <form class="stack-form">
        <label class="field"><span>Название</span><input type="text" name="title" value="${esc(card.title)}"></label>
        <label class="field"><span>Заметка</span><textarea name="notes" rows="5" placeholder="Подробности, ссылки, чек-лист…">${esc(card.notes || '')}</textarea></label>
        <div class="field"><span>Метка</span>
          <div class="colors">${COLORS.map((c) => `
            <label><input type="radio" name="color" value="${c}" ${(card.color || '') === c ? 'checked' : ''}><span class="${c ? '' : 'none'}" style="--c:${c || 'transparent'}">${c ? '' : '✕'}</span></label>`).join('')}
          </div>
        </div>
        <label class="field"><span>Колонка</span>
          <select name="col">${data.columns.map((c) => `<option value="${c.id}" ${c.id === found.col.id ? 'selected' : ''}>${esc(c.title)}</option>`).join('')}</select>
        </label>
        <div class="row-btns">
          <button class="btn primary" type="submit">Сохранить</button>
          <span class="spacer"></span>
          <button class="btn danger" type="button" data-del>Удалить</button>
        </div>
      </form>`, (el, close) => {
      const form = el.querySelector('form');
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        card.title = form.title.value.trim() || card.title;
        card.notes = form.notes.value;
        card.color = form.color.value;
        const target = form.col.value;
        if (target !== found.col.id) {
          found.col.cards.splice(found.col.cards.indexOf(card), 1);
          data.columns.find((c) => c.id === target).cards.push(card);
        }
        save(); render(); close();
      });
      el.querySelector('[data-del]').onclick = () => {
        found.col.cards.splice(found.col.cards.indexOf(card), 1);
        save(); render(); close();
      };
    });
  };

  const colMenu = (colId) => {
    const idx = data.columns.findIndex((c) => c.id === colId);
    const col = data.columns[idx];
    sheet(`
      <h3>Колонка</h3>
      <form class="stack-form">
        <label class="field"><span>Название</span><input type="text" name="title" value="${esc(col.title)}"></label>
        <div class="row-btns">
          <button class="btn" type="button" data-move="-1" ${idx === 0 ? 'disabled' : ''}>← Левее</button>
          <button class="btn" type="button" data-move="1" ${idx === data.columns.length - 1 ? 'disabled' : ''}>Правее →</button>
        </div>
        <div class="row-btns">
          <button class="btn primary" type="submit">Сохранить</button>
          <span class="spacer"></span>
          <button class="btn danger" type="button" data-del>Удалить</button>
        </div>
      </form>`, (el, close) => {
      const form = el.querySelector('form');
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        col.title = form.title.value.trim() || col.title;
        save(); render(); close();
      });
      el.querySelectorAll('[data-move]').forEach((b) => (b.onclick = () => {
        const to = idx + Number(b.dataset.move);
        data.columns.splice(idx, 1);
        data.columns.splice(to, 0, col);
        save(); render(); close();
      }));
      el.querySelector('[data-del]').onclick = async () => {
        close();
        if (col.cards.length && !(await confirmSheet('Удалить колонку?', `В ней ${col.cards.length} карточ(ек) — они удалятся.`))) return;
        data.columns.splice(idx, 1);
        save(); render();
      };
    });
  };

  document.getElementById('board-menu').onclick = () => {
    sheet(`
      <h3>Доска</h3>
      <div class="more-list">
        <button class="btn block" data-rename>Переименовать</button>
        <button class="btn block danger" data-del>Удалить доску</button>
      </div>`, (el, close) => {
      el.querySelector('[data-rename]').onclick = async () => {
        close();
        const title = await ask('Название доски', board.title);
        if (!title) return;
        board.title = title;
        $title.textContent = title;
        try { await q(sb.from('me_boards').update({ title }).eq('id', id)); } catch (e) { toast(humanError(e), true); }
      };
      el.querySelector('[data-del]').onclick = async () => {
        close();
        if (!(await confirmSheet('Удалить доску?', 'Все колонки и карточки удалятся. Это нельзя отменить.'))) return;
        try { await q(sb.from('me_boards').delete().eq('id', id)); location.hash = '#/'; } catch (e) { toast(humanError(e), true); }
      };
    });
  };

  // Доску показываем сразу; перетаскивание включаем, когда библиотека догрузится.
  // Без неё карточку всё равно можно перенести через поле «Колонка».
  render();
  if (!window.Sortable) {
    loadScript('https://cdn.jsdelivr.net/npm/sortablejs@1.15.2/Sortable.min.js')
      .then(() => { if (location.hash === `#/board/${id}` && !document.querySelector('.sheet-wrap')) render(); })
      .catch(() => {});
  }
}

// ═══════════════════════ ТЕСТЫ ═══════════════════════
// Формат: «? вопрос», «+ верный ответ», «- неверный», «! пояснение». Пустые строки — просто для красоты.
function parseTest(src) {
  const questions = [];
  const errors = [];
  let cur = null;
  String(src || '').split('\n').forEach((raw, i) => {
    const line = raw.trim();
    if (!line) return;
    const m = line.match(/^([?+\-!])\s*(.*)$/);
    if (!m) {
      if (cur && !cur.options.length) cur.prompt += '\n' + line; // продолжение вопроса
      else errors.push(`Строка ${i + 1}: начни с ?, +, - или !`);
      return;
    }
    const [, kind, text] = m;
    if (kind === '?') { cur = { prompt: text, options: [], explain: '', line: i + 1 }; questions.push(cur); return; }
    if (!cur) { errors.push(`Строка ${i + 1}: сначала вопрос (строка с ?)`); return; }
    if (kind === '!') cur.explain += (cur.explain ? '\n' : '') + text;
    else cur.options.push({ text, ok: kind === '+' });
  });
  questions.forEach((qq) => {
    if (qq.options.length < 2) errors.push(`Вопрос в строке ${qq.line}: нужно хотя бы 2 варианта`);
    else if (!qq.options.some((o) => o.ok)) errors.push(`Вопрос в строке ${qq.line}: отметь верный ответ через +`);
  });
  return { questions, errors };
}

const SAMPLE = `? Сколько будет 2 + 2?
+ 4
- 3
- 5
! Классика.

? Какой движок у Void Raid?
+ Unreal Engine
- Unity
- Godot

? Наше число?
+ 23
- 42
- 7`;

// ── тесты из репозитория (папка me/tests) ──────────────
// Claude кладёт файлы тестов в me/tests/*.txt и их список в me/tests/index.json.
// Здесь они сами попадают в базу: новые добавляются, изменённые обновляются, удалённые из списка — удаляются.
// Формат файла: шапка «title: …» / «description: …», строка «---», дальше вопросы в обычном формате.
let syncedAt = 0;
let syncWarned = false;

function parseTestFile(text, file) {
  const t = String(text).replace(/\r/g, '');
  const meta = {};
  let body = t;
  const sep = t.search(/^---\s*$/m);
  if (sep !== -1) {
    t.slice(0, sep).split('\n').forEach((l) => {
      const m = l.match(/^\s*(\w+)\s*:\s*(.*)$/);
      if (m) meta[m[1].toLowerCase()] = m[2].trim();
    });
    body = t.slice(sep).replace(/^---\s*\n?/, '');
  }
  return { title: meta.title || file.replace(/\.\w+$/, ''), description: meta.description || '', source: body.trim() };
}

async function syncRepoTests(force = false) {
  if (!force && Date.now() - syncedAt < 60_000) return; // не чаще раза в минуту
  syncedAt = Date.now();
  let files;
  try {
    const r = await fetch(`tests/index.json?t=${Date.now()}`, { cache: 'no-store' });
    if (!r.ok) return;
    files = (await r.json()).filter((f) => typeof f === 'string' && f.trim());
  } catch { return; }
  const existing = await q(sb.from('me_tests').select('id,source_key,title,description,source').not('source_key', 'is', null));
  const byKey = new Map(existing.map((t) => [t.source_key, t]));
  for (const file of files) {
    try {
      const r = await fetch(`tests/${encodeURIComponent(file)}?t=${Date.now()}`, { cache: 'no-store' });
      if (!r.ok) continue;
      const t = parseTestFile(await r.text(), file);
      const cur = byKey.get(file);
      if (!cur) await q(sb.from('me_tests').insert({ ...t, source_key: file }));
      else if (cur.title !== t.title || cur.description !== t.description || cur.source !== t.source) {
        await q(sb.from('me_tests').update({ ...t, updated_at: new Date().toISOString() }).eq('id', cur.id));
      }
      byKey.delete(file);
    } catch (e) { console.warn('test sync', file, e); }
  }
  for (const t of byKey.values()) {
    try { await q(sb.from('me_tests').delete().eq('id', t.id)); } catch { /* ничего */ }
  }
}

async function viewTests() {
  header('Тесты');
  try {
    await syncRepoTests();
  } catch (e) {
    console.warn(e);
    if (!syncWarned) { syncWarned = true; toast('Тесты от Claude не подтянулись — запусти supabase/update-7.sql', true); }
  }
  const [tests, attempts] = await Promise.all([
    q(sb.from('me_tests').select('*').order('updated_at', { ascending: false })),
    q(sb.from('me_attempts').select('test_id,score,total')),
  ]);
  const best = {};
  attempts.forEach((a) => {
    const p = a.total ? a.score / a.total : 0;
    best[a.test_id] = Math.max(best[a.test_id] ?? 0, p);
  });
  $app.innerHTML = `
    <div class="tiles">
      ${tests.map((t) => {
        const n = parseTest(t.source).questions.length;
        const b = best[t.id];
        return `<a class="tile cut" href="#/test/${t.id}">
          ${t.source_key ? '<span class="from-claude">от Claude</span>' : ''}
          <b>${esc(t.title)}</b>
          <small>${n} вопрос${n % 10 === 1 && n % 100 !== 11 ? '' : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? 'а' : 'ов'}${b != null ? ` · лучший ${Math.round(b * 100)}%` : ' · ещё не проходил'}</small>
          <span class="bar"><i style="width:${b != null ? Math.round(b * 100) : 0}%"></i></span>
        </a>`;
      }).join('')}
      <a class="tile add" href="#/test/new/edit"><b>+ Новый тест</b></a>
    </div>`;
}

async function viewTest(id) {
  const [t, attempts] = await Promise.all([
    q(sb.from('me_tests').select('*').eq('id', id).maybeSingle()),
    q(sb.from('me_attempts').select('*').eq('test_id', id).order('created_at', { ascending: false }).limit(23)),
  ]);
  if (!t) return notFound('Тест не найден', '#/tests');
  const n = parseTest(t.source).questions.length;
  const best = attempts.reduce((m, a) => Math.max(m, a.total ? a.score / a.total : 0), 0);
  header(t.title, '#/tests');
  $app.innerHTML = `
    <div class="test-head">
      ${t.description ? `<p class="hint">${esc(t.description)}</p>` : ''}
      <div class="big-stat">
        <div><b>${n}</b><span>вопросов</span></div>
        <div><b>${attempts.length}</b><span>попыток</span></div>
        <div><b>${attempts.length ? Math.round(best * 100) + '%' : '—'}</b><span>лучший</span></div>
      </div>
      <div class="more-list">
        <a class="btn primary block" href="#/test/${id}/run">Пройти тест</a>
        ${t.source_key
          ? '<p class="hint" style="margin:6px 0 0">Этот тест сделал Claude. Чтобы поменять или удалить — попроси Claude, он обновит файл в репозитории.</p>'
          : `<a class="btn block" href="#/test/${id}/edit">Редактировать</a>`}
      </div>
    </div>
    ${attempts.length ? `
      <h4 class="group-title" style="margin-top:28px">История</h4>
      <div class="attempts">${attempts.map((a) => `
        <div class="attempt"><span>${fmtDate(a.created_at)}</span><b>${a.score} / ${a.total} · ${Math.round((a.score / a.total) * 100)}%</b></div>`).join('')}
      </div>` : ''}
  `;
}

async function viewTestEdit(id) {
  const isNew = id === 'new';
  const t = isNew ? { title: '', description: '', source: SAMPLE } : await q(sb.from('me_tests').select('*').eq('id', id).maybeSingle());
  if (!t) return notFound('Тест не найден', '#/tests');
  if (t.source_key) return notFound('Этот тест сделал Claude — правки через него', `#/test/${id}`);
  header(isNew ? 'Новый тест' : 'Редактор', isNew ? '#/tests' : `#/test/${id}`);
  $app.innerHTML = `
    <form class="stack-form" id="f">
      <label class="field"><span>Название</span><input type="text" name="title" value="${esc(t.title)}" placeholder="Например: Матан, билеты 1–20" required></label>
      <label class="field"><span>Описание</span><input type="text" name="description" value="${esc(t.description)}" placeholder="Необязательно"></label>
      <div class="fmt">
        Формат простой — каждая строка начинается со значка:
        <pre>? Вопрос
+ правильный ответ
- неправильный ответ
- ещё неправильный
! пояснение (необязательно)</pre>
      </div>
      <label class="field"><span>Вопросы</span><textarea name="source" class="mono" spellcheck="false" autocapitalize="off">${esc(t.source)}</textarea></label>
      <div id="parse"></div>
      <div class="row-btns">
        <button class="btn primary" type="submit">Сохранить</button>
        <span class="spacer"></span>
        ${isNew ? '' : '<button class="btn danger" type="button" id="del">Удалить тест</button>'}
      </div>
    </form>`;
  const form = document.getElementById('f');
  const $parse = document.getElementById('parse');
  const check = () => {
    const { questions, errors } = parseTest(form.source.value);
    $parse.innerHTML = errors.length
      ? `<ul class="parse-bad">${errors.slice(0, 8).map((e) => `<li>${esc(e)}</li>`).join('')}</ul>`
      : `<span class="parse-ok">✓ ${questions.length} вопросов, всё ок</span>`;
    return { questions, errors };
  };
  form.source.addEventListener('input', check);
  check();
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const { questions, errors } = check();
    if (errors.length || !questions.length) { toast('Сначала поправь ошибки в вопросах', true); return; }
    const row = { title: form.title.value.trim() || 'Тест', description: form.description.value.trim(), source: form.source.value, updated_at: new Date().toISOString() };
    try {
      const saved = isNew
        ? await q(sb.from('me_tests').insert(row).select('id').single())
        : await q(sb.from('me_tests').update(row).eq('id', id).select('id').single());
      toast('Сохранено');
      location.hash = `#/test/${saved.id}`;
    } catch (err) { toast(humanError(err), true); }
  });
  document.getElementById('del')?.addEventListener('click', async () => {
    if (!(await confirmSheet('Удалить тест?', 'Вместе с историей попыток. Это нельзя отменить.'))) return;
    try { await q(sb.from('me_tests').delete().eq('id', id)); location.hash = '#/tests'; } catch (err) { toast(humanError(err), true); }
  });
}

// Прохождение. onlyThese — повтор только ошибок (такая попытка в историю не пишется)
async function viewTestRun(id, onlyThese = null) {
  const t = await q(sb.from('me_tests').select('id,title,source').eq('id', id).maybeSingle());
  if (!t) return notFound('Тест не найден', '#/tests');
  const all = parseTest(t.source).questions;
  const list = shuffle(onlyThese || all).map((qq) => ({ ...qq, options: shuffle(qq.options) }));
  header(t.title, `#/test/${id}`);
  let i = 0;
  let score = 0;
  const wrong = [];

  const show = () => {
    const qq = list[i];
    $app.innerHTML = `
      <div class="run-top"><span>${onlyThese ? 'Работа над ошибками' : 'Вопрос'}</span><span>${i + 1} / ${list.length}</span></div>
      <div class="progress"><i style="width:${(i / list.length) * 100}%"></i></div>
      <p class="prompt">${esc(qq.prompt)}</p>
      <div class="opts">${qq.options.map((o, k) => `<button class="opt" data-k="${k}">${esc(o.text)}</button>`).join('')}</div>
      <div id="after"></div>`;
    $app.querySelectorAll('.opt').forEach((b) => (b.onclick = () => {
      const picked = qq.options[Number(b.dataset.k)];
      $app.querySelectorAll('.opt').forEach((x, k) => {
        x.disabled = true;
        if (qq.options[k].ok) x.classList.add('right');
      });
      if (picked.ok) score++;
      else { b.classList.add('wrong'); wrong.push(qq); }
      if (navigator.vibrate) navigator.vibrate(picked.ok ? 15 : [30, 40, 30]);
      document.getElementById('after').innerHTML = `
        ${qq.explain ? `<div class="explain">${esc(qq.explain)}</div>` : ''}
        <button class="btn primary block" style="margin-top:18px" id="next">${i + 1 < list.length ? 'Дальше →' : 'Результат'}</button>`;
      document.getElementById('next').onclick = () => { i++; i < list.length ? show() : finish(); };
      document.getElementById('next').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }));
  };

  const finish = async () => {
    const pct = Math.round((score / list.length) * 100);
    if (!onlyThese) {
      try { await q(sb.from('me_attempts').insert({ test_id: id, score, total: list.length })); } catch (e) { toast(humanError(e), true); }
    }
    $app.innerHTML = `
      <div class="run-top"><span>Результат</span><span>${score} / ${list.length}</span></div>
      <p class="result-num">${pct}<small>%</small></p>
      <p class="hint">${pct === 100 ? 'Идеально. 23 из 23 по ощущениям.' : pct >= 80 ? 'Отлично, почти без ошибок.' : pct >= 50 ? 'Неплохо, но есть что повторить.' : 'Надо ещё поучить — давай по ошибкам.'}</p>
      ${wrong.length ? `
        <h4 class="group-title" style="margin-top:24px">Ошибки</h4>
        <div class="mistakes">${wrong.map((qq) => `
          <div class="mistake"><p>${esc(qq.prompt)}</p><small>✓ ${esc(qq.options.filter((o) => o.ok).map((o) => o.text).join(' / '))}</small></div>`).join('')}
        </div>` : ''}
      <div class="more-list" style="margin-top:20px">
        ${wrong.length ? '<button class="btn primary block" id="retry-wrong">Пройти только ошибки</button>' : ''}
        <a class="btn block ${wrong.length ? '' : 'primary'}" href="#/test/${id}/run" id="again">Ещё раз целиком</a>
        <a class="btn block" href="#/test/${id}">К тесту</a>
      </div>`;
    document.getElementById('retry-wrong')?.addEventListener('click', () => viewTestRun(id, wrong));
    // если уже на #/test/id/run, hashchange не сработает — перезапускаем вручную
    document.getElementById('again').addEventListener('click', (e) => { e.preventDefault(); viewTestRun(id); });
  };

  if (!list.length) { $app.innerHTML = '<p class="empty-note">В тесте нет вопросов</p>'; return; }
  show();
}

// ═══════════════════════ ЕЩЁ ═══════════════════════
async function viewMore() {
  header('Ещё');
  const standalone = window.navigator.standalone || matchMedia('(display-mode: standalone)').matches;
  $app.innerHTML = `
    <p class="hint">Вошёл как <b style="color:var(--text)">${esc(user?.email || '')}</b></p>
    ${standalone ? '' : `
    <div class="install" style="margin:18px 0">
      <b>Поставить как приложение на iPhone:</b>
      <ol>
        <li>Открой эту страницу в <b>Safari</b></li>
        <li>Нажми «Поделиться» (квадрат со стрелкой)</li>
        <li>Выбери «На экран „Домой“» → «Добавить»</li>
      </ol>
    </div>`}
    <div class="more-list" style="margin-top:18px">
      <a class="btn block" href="../" target="_blank">Открыть сайт ↗</a>
      <a class="btn block" href="../admin.html" target="_blank">Админка сайта ↗</a>
      <button class="btn block danger" id="logout">Выйти</button>
    </div>
    <p class="hint" style="margin-top:40px;text-align:center;opacity:.4">irenu // me // v0.23</p>`;
  document.getElementById('logout').onclick = async () => {
    await sb.auth.signOut();
    user = null;
    window.removeEventListener('hashchange', route);
    location.hash = '';
    showLogin();
  };
}

// ── старт ──────────────────────────────────────────────
async function start() {
  if (!isConfigured) { $app.innerHTML = '<p class="empty-note">Supabase не подключён</p>'; return; }
  sb = await getClient();
  const { data } = await sb.auth.getSession();
  user = data.session?.user || null;
  if (user) enter(); else showLogin();
}

start();
