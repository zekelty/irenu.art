import { loadAll } from './db.js';
import { esc, paragraphs, safeUrl, hue, initials } from './util.js';

const app = document.getElementById('app');
document.getElementById('year').textContent = new Date().getFullYear();

const STATUS = { wip: 'в работе', done: 'готов', idea: 'идея' };

let data = null;

// ── маленькие куски разметки ───────────────────────────
function avatar(m, cls = '') {
  if (m.avatar_url) {
    return `<img class="avatar ${cls}" src="${esc(safeUrl(m.avatar_url))}" alt="${esc(m.name)}" loading="lazy">`;
  }
  const h = hue(m.slug || m.name);
  return `<div class="avatar-ph ${cls}" style="background:hsl(${h} 70% 70%)" aria-hidden="true">${esc(initials(m.name))}</div>`;
}

function cover(p) {
  if (p.cover_url) {
    return `<img class="cover" src="${esc(safeUrl(p.cover_url))}" alt="" loading="lazy">`;
  }
  const h = hue(p.slug || p.title);
  return `<div class="cover-ph" style="background:linear-gradient(135deg,hsl(${h} 75% 68%),hsl(${(h + 50) % 360} 70% 55%))" aria-hidden="true">${esc(initials(p.title, 1))}</div>`;
}

function badge(status) {
  return STATUS[status] ? `<span class="badge ${esc(status)}">${STATUS[status]}</span>` : '';
}

function linkButtons(links, primaryFirst = false) {
  const list = (links || []).filter((l) => l && l.url);
  if (!list.length) return '';
  return `<ul class="links">${list
    .map((l, i) => `<li><a class="btn ${primaryFirst && i === 0 ? 'primary' : ''}" href="${esc(safeUrl(l.url))}" target="_blank" rel="noopener">${esc(l.label || l.url)} ↗</a></li>`)
    .join('')}</ul>`;
}

function projectCard(p) {
  const tags = (p.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join('');
  const stack = p.members.length
    ? `<div class="stack" title="${esc(p.members.map((m) => m.name).join(', '))}">${p.members.slice(0, 5).map((m) => avatar(m)).join('')}</div>`
    : '<span></span>';
  return `
    <a class="card" href="#/project/${encodeURIComponent(p.slug)}">
      ${cover(p)}
      <div class="card-body">
        <div class="meta">${badge(p.status)}${p.year ? `<span>${esc(p.year)}</span>` : ''}</div>
        <h3 class="card-title">${esc(p.title)}</h3>
        ${p.summary ? `<p class="card-text">${esc(p.summary)}</p>` : ''}
        <div class="card-foot"><div class="meta">${tags}</div>${stack}</div>
      </div>
    </a>`;
}

function memberCard(m) {
  const n = m.projects.length;
  return `
    <a class="member-card" href="#/member/${encodeURIComponent(m.slug)}">
      ${avatar(m)}
      <div>
        <h3>${esc(m.name)}</h3>
        ${m.role ? `<p class="role">${esc(m.role)}</p>` : ''}
      </div>
      ${n ? `<span class="projects-count">${n} ${plural(n, 'проект', 'проекта', 'проектов')}</span>` : ''}
    </a>`;
}

function plural(n, one, few, many) {
  const a = n % 10, b = n % 100;
  if (a === 1 && b !== 11) return one;
  if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return few;
  return many;
}

// ── страницы ───────────────────────────────────────────
function renderHome(scrollTo) {
  const { site, members, projects, demo } = data;
  const name = site.name || 'irenu';
  app.innerHTML = `
    ${demo ? `<p class="notice"><b>Демо-режим.</b> Supabase ещё не подключён — впиши ключи в <code>js/config.js</code>.</p>` : ''}
    <section class="hero">
      <h1>${esc(name)}<span class="dot">.</span></h1>
      ${site.tagline ? `<p>${esc(site.tagline)}</p>` : ''}
    </section>

    ${site.about ? `
    <section class="section" id="about">
      <div class="section-head"><h2>Кто мы</h2></div>
      <div class="prose">${paragraphs(site.about)}</div>
    </section>` : ''}

    <section class="section" id="projects">
      <div class="section-head"><h2>Проекты</h2><span class="count">${projects.length}</span></div>
      ${projects.length ? `<div class="grid-projects">${projects.map(projectCard).join('')}</div>` : '<p class="empty">Пока пусто.</p>'}
    </section>

    <section class="section" id="team">
      <div class="section-head"><h2>Команда</h2><span class="count">${members.length}</span></div>
      ${members.length ? `<div class="grid-team">${members.map(memberCard).join('')}</div>` : '<p class="empty">Пока пусто.</p>'}
    </section>

    ${(site.contacts || []).length ? `
    <section class="section" id="contacts">
      <div class="section-head"><h2>Контакты</h2></div>
      <div class="contacts">${linkButtons(site.contacts)}</div>
    </section>` : ''}
  `;
  document.title = name;
  if (scrollTo) {
    document.getElementById(scrollTo)?.scrollIntoView();
  } else {
    window.scrollTo(0, 0);
  }
}

function renderMember(slug) {
  const m = data.members.find((x) => x.slug === slug);
  if (!m) return renderNotFound();
  app.innerHTML = `
    <a class="back" href="#/team">← Команда</a>
    <section class="detail-head">
      ${avatar(m)}
      <div>
        <h1>${esc(m.name)}</h1>
        ${m.role ? `<p class="role">${esc(m.role)}</p>` : ''}
        ${linkButtons(m.links)}
      </div>
    </section>
    ${m.bio ? `<div class="prose">${paragraphs(m.bio)}</div>` : ''}
    ${m.projects.length ? `
    <section class="section">
      <div class="section-head"><h2>Проекты</h2><span class="count">${m.projects.length}</span></div>
      <div class="grid-projects">${m.projects.map(projectCard).join('')}</div>
    </section>` : ''}
  `;
  document.title = `${m.name} — ${data.site.name || 'irenu'}`;
  window.scrollTo(0, 0);
}

function renderProject(slug) {
  const p = data.projects.find((x) => x.slug === slug);
  if (!p) return renderNotFound();
  const tags = (p.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join('');
  app.innerHTML = `
    <a class="back" href="#/projects">← Проекты</a>
    <div class="project-cover">${cover(p)}</div>
    <h1 class="project-title">${esc(p.title)}</h1>
    <div class="meta">${badge(p.status)}${p.year ? `<span>${esc(p.year)}</span>` : ''}${tags}</div>
    ${p.url ? linkButtons([{ label: 'Открыть проект', url: p.url }], true) : ''}
    <div class="prose" style="margin-top:32px">${paragraphs(p.description || p.summary || '')}</div>
    ${p.members.length ? `
    <section class="section">
      <div class="section-head"><h2>Кто делал</h2></div>
      <div class="people">${p.members.map((m) => `
        <a class="person" href="#/member/${encodeURIComponent(m.slug)}">
          ${avatar(m)}<span>${esc(m.name)}${m.role ? `<small>${esc(m.role)}</small>` : ''}</span>
        </a>`).join('')}
      </div>
    </section>` : ''}
  `;
  document.title = `${p.title} — ${data.site.name || 'irenu'}`;
  window.scrollTo(0, 0);
}

function renderNotFound() {
  app.innerHTML = `<p class="empty">Такой страницы нет. <a href="#/">На главную</a></p>`;
}

// ── роутер ─────────────────────────────────────────────
function route() {
  const parts = location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
  const [page, slug] = parts;
  document.querySelectorAll('.nav a').forEach((a) => a.classList.toggle('active', a.getAttribute('href') === `#/${page}`));
  if (page === 'member') return renderMember(slug);
  if (page === 'project') return renderProject(slug);
  if (['projects', 'team', 'contacts', 'about'].includes(page)) return renderHome(page);
  return renderHome();
}

async function start() {
  try {
    data = await loadAll();
  } catch (e) {
    console.error(e);
    app.innerHTML = `<p class="empty">Не получилось загрузить данные. Обнови страницу чуть позже.</p>`;
    return;
  }
  const name = data.site.name || 'irenu';
  document.querySelectorAll('[data-site-name]').forEach((el) => (el.textContent = name));
  window.addEventListener('hashchange', route);
  route();
}

start();
