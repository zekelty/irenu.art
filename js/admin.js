import { getClient, isConfigured } from './db.js';
import { esc, slugify, linksToText, textToLinks, hue, initials } from './util.js';

const view = document.getElementById('view');
const tabs = document.getElementById('tabs');
const toastEl = document.getElementById('toast');
let sb = null;

// ── утилиты ────────────────────────────────────────────
let toastTimer;
function toast(msg, bad = false) {
  toastEl.textContent = msg;
  toastEl.classList.toggle('bad', bad);
  toastEl.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toastEl.hidden = true), bad ? 6000 : 2500);
}

function humanError(e) {
  if (!e) return 'Неизвестная ошибка';
  if (e.code === '23505') return 'Такой адрес (slug) уже занят — придумай другой.';
  if (e.code === '42501' || /row-level security/i.test(e.message)) return 'Нет прав. Твоей почты нет в таблице editors.';
  if (/Invalid login/i.test(e.message)) return 'Неверная почта или пароль.';
  return e.message || String(e);
}

async function q(promise) {
  const { data, error } = await promise;
  if (error) throw error;
  return data;
}

function thumb(url, name, round) {
  if (url) return `<img class="thumb ${round ? 'round' : ''}" src="${esc(url)}" alt="">`;
  const h = hue(name);
  return `<div class="thumb ${round ? 'round' : ''} avatar-ph" style="background:hsl(${h} 70% 70%);border-radius:${round ? '50%' : '10px'}">${esc(initials(name))}</div>`;
}

function field(label, control, hint = '') {
  return `<label class="field"><span>${label}</span>${control}${hint ? `<small>${hint}</small>` : ''}</label>`;
}

function imageField(name, url, folder, round) {
  return `
    <div class="field"><span>${name === 'avatar_url' ? 'Аватар' : 'Обложка'}</span>
      <div class="img-field" data-folder="${folder}">
        <img class="preview" src="${esc(url || '')}" alt="" style="${url ? '' : 'visibility:hidden'};${round ? 'border-radius:50%' : ''}">
        <div class="controls">
          <label class="btn" style="align-self:flex-start">Загрузить картинку<input type="file" accept="image/*" hidden></label>
          <input type="url" name="${name}" value="${esc(url || '')}" placeholder="или вставь ссылку на картинку">
        </div>
      </div>
    </div>`;
}

// Сжимаем картинку до 1600px по длинной стороне → webp
async function shrink(file, max = 1600) {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file;
  try {
    const bmp = await createImageBitmap(file);
    const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bmp.width * k);
    canvas.height = Math.round(bmp.height * k);
    canvas.getContext('2d').drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((r) => canvas.toBlob(r, 'image/webp', 0.86));
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file;
  }
}

async function uploadImage(file, folder) {
  const blob = await shrink(file);
  const ext = blob.type === 'image/webp' ? 'webp' : (file.name.split('.').pop() || 'img').toLowerCase();
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  await q(sb.storage.from('media').upload(path, blob, { contentType: blob.type || file.type, cacheControl: '31536000' }));
  return sb.storage.from('media').getPublicUrl(path).data.publicUrl;
}

function wireImageFields(root) {
  root.querySelectorAll('.img-field').forEach((box) => {
    const file = box.querySelector('input[type=file]');
    const url = box.querySelector('input[type=url]');
    const preview = box.querySelector('.preview');
    const show = (u) => { preview.src = u; preview.style.visibility = u ? '' : 'hidden'; };
    url.addEventListener('input', () => show(url.value.trim()));
    file.addEventListener('change', async () => {
      if (!file.files[0]) return;
      const label = file.parentElement;
      label.firstChild.textContent = 'Загружаю…';
      try {
        const u = await uploadImage(file.files[0], box.dataset.folder);
        url.value = u;
        show(u);
        toast('Картинка загружена — не забудь сохранить');
      } catch (e) {
        toast(humanError(e), true);
      } finally {
        label.firstChild.textContent = 'Загрузить картинку';
        file.value = '';
      }
    });
  });
}

function wireSlug(form, sourceName) {
  const src = form.elements[sourceName];
  const slug = form.elements.slug;
  if (slug.value) slug.dataset.touched = '1';
  slug.addEventListener('input', () => (slug.dataset.touched = '1'));
  src.addEventListener('input', () => {
    if (!slug.dataset.touched) slug.value = slugify(src.value);
  });
}

async function submitting(form, fn) {
  const btn = form.querySelector('button[type=submit]');
  const err = form.querySelector('.error');
  btn.disabled = true;
  err.textContent = '';
  try {
    await fn();
  } catch (e) {
    console.error(e);
    err.textContent = humanError(e);
  } finally {
    btn.disabled = false;
  }
}

// ── вход ───────────────────────────────────────────────
function showLogin() {
  tabs.hidden = true;
  view.innerHTML = `
    <div class="panel login">
      <h1>Вход для команды</h1>
      <form class="stack-form" id="login">
        ${field('Почта', '<input type="email" name="email" required autocomplete="email">')}
        ${field('Пароль', '<input type="password" name="password" required autocomplete="current-password">')}
        <p class="error"></p>
        <button class="btn primary" type="submit">Войти</button>
      </form>
    </div>`;
  const form = document.getElementById('login');
  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    submitting(form, async () => {
      await q(sb.auth.signInWithPassword({ email: form.email.value.trim(), password: form.password.value }));
      await enterPanel();
    });
  });
}

async function enterPanel() {
  const ok = await q(sb.rpc('is_editor'));
  if (!ok) {
    const { data } = await sb.auth.getUser();
    view.innerHTML = `
      <div class="panel login">
        <h1>Нет доступа</h1>
        <p>Почты <b>${esc(data.user?.email)}</b> нет в списке редакторов. Добавь её в таблицу <code>editors</code> в Supabase.</p>
        <button class="btn" id="out">Выйти</button>
      </div>`;
    document.getElementById('out').onclick = logout;
    return;
  }
  tabs.hidden = false;
  window.addEventListener('hashchange', route);
  route();
}

async function logout() {
  await sb.auth.signOut();
  window.removeEventListener('hashchange', route);
  location.hash = '';
  showLogin();
}
document.getElementById('logout').addEventListener('click', (e) => { e.preventDefault(); logout(); });

function route() {
  const [tab, id] = location.hash.replace(/^#/, '').split('/');
  tabs.querySelectorAll('a').forEach((a) => a.classList.toggle('active', a.getAttribute('href') === `#${tab || 'site'}`));
  const run = { members: () => (id ? editMember(id) : listMembers()), projects: () => (id ? editProject(id) : listProjects()) }[tab] || editSite;
  view.innerHTML = '<div class="loading">Загружаем…</div>';
  run().catch((e) => { console.error(e); view.innerHTML = `<p class="empty">${esc(humanError(e))}</p>`; });
}

// ── команда (site) ─────────────────────────────────────
async function editSite() {
  const s = (await q(sb.from('site').select('*').eq('id', 1).maybeSingle())) || {};
  view.innerHTML = `
    <div class="panel">
      <h1>О команде</h1>
      <form class="stack-form" id="f">
        ${field('Название', `<input type="text" name="name" value="${esc(s.name)}" required>`)}
        ${field('Подзаголовок', `<input type="text" name="tagline" value="${esc(s.tagline)}">`, 'Одна строка под большим названием на главной')}
        ${field('Кто мы', `<textarea name="about" rows="8">${esc(s.about)}</textarea>`, 'Пустая строка — новый абзац')}
        ${field('Стек', `<textarea name="stack" rows="6" placeholder="Unity 2022 | Основной движок">${esc((s.stack || []).map((x) => (x.note ? `${x.name} | ${x.note}` : x.name)).join('\n'))}</textarea>`, 'Плитки в блоке «Кто мы». По одной на строку: <code>Название | пояснение</code>')}
        ${field('Контакты', `<textarea name="contacts" rows="4" placeholder="Telegram | https://t.me/...">${esc(linksToText(s.contacts))}</textarea>`, 'По одной на строку: <code>Название | ссылка</code>')}
        <p class="error"></p>
        <div class="actions"><button class="btn primary" type="submit">Сохранить</button><a class="btn" href="./" target="_blank">Открыть сайт ↗</a></div>
      </form>
    </div>`;
  const form = document.getElementById('f');
  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    submitting(form, async () => {
      await q(sb.from('site').upsert({
        id: 1,
        name: form.name.value.trim(),
        tagline: form.tagline.value.trim(),
        about: form.about.value.trim(),
        contacts: textToLinks(form.contacts.value),
        stack: textToLinks(form.stack.value).map((l) => ({ name: l.label, note: l.label === l.url ? '' : l.url })),
        updated_at: new Date().toISOString(),
      }));
      toast('Сохранено');
    });
  });
}

// ── участники ──────────────────────────────────────────
async function listMembers() {
  const rows = await q(sb.from('members').select('*').order('sort').order('created_at'));
  view.innerHTML = `
    <div class="panel">
      <div class="panel-head"><h1>Участники</h1><a class="btn primary" href="#members/new">+ Добавить</a></div>
      <div class="list">${rows.length ? rows.map((m) => `
        <div class="list-item">
          ${thumb(m.avatar_url, m.name, true)}
          <div class="info"><b>${esc(m.name)}</b><small>${esc(m.role || '—')} · /${esc(m.slug)}</small></div>
          <a class="btn" href="#members/${m.id}">Изменить</a>
        </div>`).join('') : '<p class="empty">Пока никого. Жми «Добавить».</p>'}
      </div>
    </div>`;
}

async function editMember(id) {
  const isNew = id === 'new';
  const m = isNew ? { links: [], sort: 0 } : await q(sb.from('members').select('*').eq('id', id).single());
  view.innerHTML = `
    <div class="panel">
      <a class="back" href="#members" style="margin:0 0 16px">← Участники</a>
      <h1>${isNew ? 'Новый участник' : esc(m.name)}</h1>
      <form class="stack-form" id="f">
        <div class="row">
          ${field('Имя', `<input type="text" name="name" value="${esc(m.name)}" required>`)}
          ${field('Роль', `<input type="text" name="role" value="${esc(m.role)}" placeholder="Код, арт, звук…">`)}
        </div>
        ${imageField('avatar_url', m.avatar_url, 'members', true)}
        ${field('О себе', `<textarea name="bio" rows="6">${esc(m.bio)}</textarea>`, 'Пустая строка — новый абзац')}
        ${field('Ссылки', `<textarea name="links" rows="3" placeholder="GitHub | https://github.com/...">${esc(linksToText(m.links))}</textarea>`, 'По одной на строку: <code>Название | ссылка</code>')}
        <div class="row">
          ${field('Адрес страницы (slug)', `<input type="text" name="slug" value="${esc(m.slug)}" required pattern="[a-z0-9-]+">`, 'Латиница, цифры и дефис. Будет irenu.art/#/member/<b>slug</b>')}
          ${field('Порядок', `<input type="number" name="sort" value="${esc(m.sort ?? 0)}">`, 'Меньше — выше в списке')}
        </div>
        <p class="error"></p>
        <div class="actions">
          <button class="btn primary" type="submit">Сохранить</button>
          ${isNew ? '' : `<a class="btn" href="./#/member/${esc(m.slug)}" target="_blank">Посмотреть ↗</a>`}
          <span class="spacer"></span>
          ${isNew ? '' : '<button class="btn danger" type="button" id="del">Удалить</button>'}
        </div>
      </form>
    </div>`;
  const form = document.getElementById('f');
  wireSlug(form, 'name');
  wireImageFields(form);
  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    submitting(form, async () => {
      const row = {
        name: form.name.value.trim(),
        role: form.role.value.trim(),
        bio: form.bio.value.trim(),
        avatar_url: form.avatar_url.value.trim(),
        links: textToLinks(form.links.value),
        slug: slugify(form.slug.value),
        sort: Number(form.sort.value) || 0,
      };
      if (isNew) await q(sb.from('members').insert(row));
      else await q(sb.from('members').update(row).eq('id', id));
      toast('Сохранено');
      location.hash = '#members';
    });
  });
  document.getElementById('del')?.addEventListener('click', async () => {
    if (!confirm(`Удалить «${m.name}»? Это нельзя отменить.`)) return;
    try {
      await q(sb.from('members').delete().eq('id', id));
      toast('Удалено');
      location.hash = '#members';
    } catch (e) { toast(humanError(e), true); }
  });
}

// ── проекты ────────────────────────────────────────────
const STATUS = { done: 'Релиз', page: 'Страничка в Steam', soon: 'Скоро в Steam', wip: 'В разработке', jam: 'Геймджем', idea: 'Идея' }; // 23

async function listProjects() {
  const rows = await q(sb.from('projects').select('*').order('sort').order('created_at'));
  view.innerHTML = `
    <div class="panel">
      <div class="panel-head"><h1>Проекты</h1><a class="btn primary" href="#projects/new">+ Добавить</a></div>
      <div class="list">${rows.length ? rows.map((p) => `
        <div class="list-item">
          ${thumb(p.cover_url, p.title, false)}
          <div class="info"><b>${esc(p.title)}</b><small>${esc(STATUS[p.status] || '')}${p.year ? ` · ${esc(p.year)}` : ''} · /${esc(p.slug)}</small></div>
          <a class="btn" href="#projects/${p.id}">Изменить</a>
        </div>`).join('') : '<p class="empty">Пока пусто. Жми «Добавить».</p>'}
      </div>
    </div>`;
}

async function editProject(id) {
  const isNew = id === 'new';
  const [p, members, linked] = await Promise.all([
    isNew ? { tags: [], sort: 0, status: 'done', year: new Date().getFullYear() } : q(sb.from('projects').select('*').eq('id', id).single()),
    q(sb.from('members').select('id,name,avatar_url').order('sort').order('created_at')),
    isNew ? [] : q(sb.from('project_members').select('member_id').eq('project_id', id)),
  ]);
  const linkedIds = new Set(linked.map((l) => l.member_id));
  view.innerHTML = `
    <div class="panel">
      <a class="back" href="#projects" style="margin:0 0 16px">← Проекты</a>
      <h1>${isNew ? 'Новый проект' : esc(p.title)}</h1>
      <form class="stack-form" id="f">
        ${field('Название', `<input type="text" name="title" value="${esc(p.title)}" required>`)}
        ${field('Коротко', `<input type="text" name="summary" value="${esc(p.summary)}" maxlength="200">`, 'Одна фраза для карточки на главной')}
        ${imageField('cover_url', p.cover_url, 'projects', false)}
        ${field('Описание', `<textarea name="description" rows="8">${esc(p.description)}</textarea>`, 'Пустая строка — новый абзац')}
        <div class="row-3">
          ${field('Статус', `<select name="status">${Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${p.status === k ? 'selected' : ''}>${v}</option>`).join('')}</select>`)}
          ${field('Год', `<input type="number" name="year" value="${esc(p.year ?? '')}" min="1990" max="2100">`)}
          ${field('Порядок', `<input type="number" name="sort" value="${esc(p.sort ?? 0)}">`)}
        </div>
        ${field('Ссылки', `<textarea name="links" rows="3" placeholder="Steam | https://store.steampowered.com/app/...">${esc(linksToText(p.links?.length ? p.links : (p.url ? [{ label: 'Открыть проект', url: p.url }] : [])))}</textarea>`, 'По одной на строку: <code>Название | ссылка</code>. Первая станет главной красной кнопкой')}
        ${field('Теги', `<input type="text" name="tags" value="${esc((p.tags || []).join(', '))}" placeholder="игра, Unity">`, 'Через запятую')}
        <div class="field"><span>Кто делал</span>
          <div class="checks">${members.length ? members.map((m) => `
            <label class="check"><input type="checkbox" name="members" value="${m.id}" ${linkedIds.has(m.id) ? 'checked' : ''}>${esc(m.name)}</label>`).join('') : '<small>Сначала добавь участников.</small>'}
          </div>
        </div>
        ${field('Адрес страницы (slug)', `<input type="text" name="slug" value="${esc(p.slug)}" required pattern="[a-z0-9-]+">`, 'Латиница, цифры и дефис. Будет irenu.art/#/project/<b>slug</b>')}
        <p class="error"></p>
        <div class="actions">
          <button class="btn primary" type="submit">Сохранить</button>
          ${isNew ? '' : `<a class="btn" href="./#/project/${esc(p.slug)}" target="_blank">Посмотреть ↗</a>`}
          <span class="spacer"></span>
          ${isNew ? '' : '<button class="btn danger" type="button" id="del">Удалить</button>'}
        </div>
      </form>
    </div>`;
  const form = document.getElementById('f');
  wireSlug(form, 'title');
  wireImageFields(form);
  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    submitting(form, async () => {
      const row = {
        title: form.title.value.trim(),
        summary: form.summary.value.trim(),
        description: form.description.value.trim(),
        cover_url: form.cover_url.value.trim(),
        status: form.status.value,
        year: form.year.value ? Number(form.year.value) : null,
        sort: Number(form.sort.value) || 0,
        links: textToLinks(form.links.value),
        url: textToLinks(form.links.value)[0]?.url || '',
        tags: form.tags.value.split(',').map((t) => t.trim()).filter(Boolean),
        slug: slugify(form.slug.value),
      };
      const saved = isNew
        ? await q(sb.from('projects').insert(row).select('id').single())
        : await q(sb.from('projects').update(row).eq('id', id).select('id').single());
      const pid = saved.id;
      const chosen = [...form.querySelectorAll('input[name=members]:checked')].map((c) => c.value);
      await q(sb.from('project_members').delete().eq('project_id', pid));
      if (chosen.length) await q(sb.from('project_members').insert(chosen.map((member_id) => ({ project_id: pid, member_id }))));
      toast('Сохранено');
      location.hash = '#projects';
    });
  });
  document.getElementById('del')?.addEventListener('click', async () => {
    if (!confirm(`Удалить «${p.title}»? Это нельзя отменить.`)) return;
    try {
      await q(sb.from('projects').delete().eq('id', id));
      toast('Удалено');
      location.hash = '#projects';
    } catch (e) { toast(humanError(e), true); }
  });
}

// ── старт ──────────────────────────────────────────────
async function start() {
  if (!isConfigured) {
    view.innerHTML = `
      <div class="panel login">
        <h1>Supabase не подключён</h1>
        <p>Впиши <code>SUPABASE_URL</code> и <code>SUPABASE_ANON_KEY</code> в <code>js/config.js</code>, закоммить — и здесь появится вход.</p>
      </div>`;
    return;
  }
  sb = await getClient();
  const { data } = await sb.auth.getSession();
  if (data.session) {
    try { await enterPanel(); } catch (e) { console.error(e); showLogin(); }
  } else {
    showLogin();
  }
}

start();
