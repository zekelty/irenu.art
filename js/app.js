import { loadAll } from './db.js';
import { esc, paragraphs, safeUrl, hue, initials } from './util.js';

const app = document.getElementById('app');
document.getElementById('year').textContent = new Date().getFullYear();

// Порядок здесь = порядок фильтров на главной
const STATUS = { done: 'Релиз', soon: 'Скоро в Steam', wip: 'В разработке', jam: 'Геймджем', idea: 'Идея' };
const FILTER_LABEL = { done: 'Релизы', soon: 'Скоро в Steam', wip: 'В разработке', jam: 'Геймджемы', idea: 'Идеи' };

let data = null;
let filter = 'all';
const EGG = 23; // ты нашёл пасхалку. их тут 23? нет. но число то самое.

// ── куски разметки ─────────────────────────────────────
const pad = (n) => String(n).padStart(2, '0');

function phBg(seed) {
  // Тёмная заглушка с красным свечением; положение свечения у каждого своё
  const h = hue(seed);
  const x = 15 + (h % 70), y = 10 + ((h * 7) % 60);
  return `background:radial-gradient(circle at ${x}% ${y}%,color-mix(in srgb,var(--accent) 55%,transparent),transparent 60%),linear-gradient(160deg,#1d1d27,#0a0a0f)`;
}

// Маленький аватар (стопка, список людей)
function avatar(m) {
  if (m.avatar_url) return `<img class="avatar" src="${esc(safeUrl(m.avatar_url))}" alt="${esc(m.name)}" loading="lazy">`;
  return `<div class="avatar-ph" style="${phBg(m.slug || m.name)}" aria-hidden="true">${esc(initials(m.name))}</div>`;
}

// Большая картинка: портрет участника или обложка проекта
function media(url, seed, label, alt = '') {
  if (url) return `<img src="${esc(safeUrl(url))}" alt="${esc(alt)}" loading="lazy">`;
  return `<div class="ph" style="${phBg(seed)}" aria-hidden="true"><span>${esc(label)}</span></div>`;
}

function badge(status) {
  return STATUS[status] ? `<span class="badge ${esc(status)}">${STATUS[status]}</span>` : '';
}

function tags(list) {
  return (list || []).map((t) => `<span class="tag">${esc(t)}</span>`).join('');
}

function linkButtons(links, primaryFirst = false) {
  const list = (links || []).filter((l) => l && l.url);
  if (!list.length) return '';
  return `<ul class="links">${list
    .map((l, i) => `<li><a class="btn ${primaryFirst && i === 0 ? 'primary' : ''}" href="${esc(safeUrl(l.url))}" target="_blank" rel="noopener">${esc(l.label || l.url)} ↗</a></li>`)
    .join('')}</ul>`;
}

function sectionHead(idx, title, count) {
  return `<div class="section-head reveal">
    <span class="idx">// ${pad(idx)}</span><h2>${esc(title)}</h2><span class="rule"></span>
    ${count != null ? `<span class="count">${pad(count)}</span>` : ''}
  </div>`;
}

function projectLinks(p) {
  const list = Array.isArray(p.links) ? p.links.filter((l) => l && l.url) : [];
  if (!list.length && p.url) list.push({ label: 'Открыть проект', url: p.url });
  return list;
}

function projectGrid(projects) {
  const list = filter === 'all' ? projects : projects.filter((p) => p.status === filter);
  return list.length ? list.map(projectCard).join('') : '<p class="empty">Тут пока пусто</p>';
}

function filters(projects) {
  const present = Object.keys(STATUS).filter((s) => projects.some((p) => p.status === s));
  if (present.length < 2) return '';
  const chip = (key, label, n) =>
    `<button class="chip ${filter === key ? 'active' : ''}" data-filter="${key}">${label}<span>${pad(n)}</span></button>`;
  return `<div class="filters reveal" role="toolbar" aria-label="Фильтр проектов">
    ${chip('all', 'Все', projects.length)}
    ${present.map((s) => chip(s, FILTER_LABEL[s], projects.filter((p) => p.status === s).length)).join('')}
  </div>`;
}

function stackBlock(stack) {
  const list = (stack || []).filter((s) => s && s.name);
  if (!list.length) return '';
  return `<div class="stack-grid">${list.map((s, i) => `
    <div class="stack-item cut reveal" data-egg="${i === 0 ? EGG : ''}">
      <span class="stack-idx">${pad(i + 1)}</span>
      <b>${esc(s.name)}</b>
      ${s.note ? `<small>${esc(s.note)}</small>` : ''}
    </div>`).join('')}
  </div>`;
}

function projectCard(p) {
  const stack = p.members.length
    ? `<div class="stack" title="${esc(p.members.map((m) => m.name).join(', '))}">${p.members.slice(0, 5).map(avatar).join('')}</div>`
    : '<span></span>';
  return `
    <a class="card cut reveal" href="#/project/${encodeURIComponent(p.slug)}">
      <div class="card-media">${media(p.cover_url, p.slug || p.title, initials(p.title, 1))}${badge(p.status)}</div>
      <div class="card-body">
        <div class="meta">${p.year ? `<span class="year">${esc(p.year)}</span>` : ''}${tags(p.tags)}</div>
        <h3 class="card-title">${esc(p.title)}</h3>
        ${p.summary ? `<p class="card-text">${esc(p.summary)}</p>` : ''}
        <div class="card-foot">${stack}<span class="arrow">Смотреть →</span></div>
      </div>
    </a>`;
}

function playerCard(m, i) {
  const n = m.projects.length;
  return `
    <a class="player cut reveal" href="#/member/${encodeURIComponent(m.slug)}">
      <div class="player-media">${media(m.avatar_url, m.slug || m.name, initials(m.name), m.name)}</div>
      <span class="player-num">${pad(i + 1)}</span>
      <div class="player-info">
        ${m.role ? `<span class="player-role">${esc(m.role)}</span>` : ''}
        <h3>${esc(m.name)}</h3>
        ${n ? `<span class="player-count">${n} ${plural(n, 'проект', 'проекта', 'проектов')}</span>` : ''}
      </div>
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
  const years = projects.map((p) => p.year).filter(Boolean);
  const since = years.length ? Math.min(...years) : null;
  // Бегущая строка: повторяем названия, пока половина ленты не станет шире любого экрана,
  // потом удваиваем — анимация сдвигает ровно на половину, и шов не виден.
  let tickerItems = projects.length ? projects.map((p) => p.title) : [name, 'team'];
  while (tickerItems.join('').length < 160) tickerItems = tickerItems.concat(tickerItems);
  const ticker = [...tickerItems, ...tickerItems].map((t) => `<span>${esc(t)}</span>`).join('');
  let idx = 0;

  app.innerHTML = `
    ${demo ? `<p class="notice"><b>Демо-режим.</b> Это примеры, чтобы посмотреть дизайн, — настоящие данные на <a href="./">главной</a>.</p>` : ''}
    <section class="hero">
      <div class="kicker"><span class="live-dot"></span>Team${since ? ` // since ${esc(since)}` : ''}</div>
      <h1 class="hero-title"><span class="fill">${esc(name)}</span><span class="outline" aria-hidden="true">${esc(name)}</span></h1>
      ${site.tagline ? `<p class="hero-tag">${esc(site.tagline)}</p>` : ''}
      <div class="hero-row">
        <div class="stats">
          <div class="stat"><b>${pad(projects.length)}</b><span>проектов</span></div>
          <div class="stat"><b>${pad(members.length)}</b><span>в составе</span></div>
          ${since ? `<div class="stat"><b>${esc(since)}</b><span>с года</span></div>` : ''}
        </div>
        <div class="hero-cta">
          <a class="btn primary" href="#/projects">Проекты</a>
          <a class="btn" href="#/team">Состав</a>
        </div>
      </div>
    </section>
    <div class="ticker" aria-hidden="true"><div class="ticker-track">${ticker}</div></div>

    ${site.about || (site.stack || []).length ? `
    <section class="section" id="about">
      ${sectionHead(++idx, 'Кто мы')}
      ${site.about ? `<div class="about reveal"><div class="prose">${paragraphs(site.about)}</div></div>` : ''}
      ${stackBlock(site.stack)}
    </section>` : ''}

    <section class="section" id="projects">
      ${sectionHead(++idx, 'Проекты', projects.length)}
      ${filters(projects)}
      ${projects.length ? `<div class="grid-projects" id="project-grid">${projectGrid(projects)}</div>` : '<p class="empty">Пока пусто</p>'}
    </section>

    <section class="section" id="team">
      ${sectionHead(++idx, 'Состав', members.length)}
      ${members.length ? `<div class="grid-team">${members.map(playerCard).join('')}</div>` : '<p class="empty">Пока пусто</p>'}
    </section>

    ${(site.contacts || []).length ? `
    <section class="section" id="contacts">
      ${sectionHead(++idx, 'Связь')}
      <div class="contacts reveal">${linkButtons(site.contacts)}</div>
    </section>` : ''}
  `;
  document.title = name;
  app.querySelectorAll('[data-filter]').forEach((btn) =>
    btn.addEventListener('click', () => {
      filter = btn.dataset.filter;
      app.querySelectorAll('[data-filter]').forEach((b) => b.classList.toggle('active', b === btn));
      document.getElementById('project-grid').innerHTML = projectGrid(projects);
      afterRender();
    }));
  afterRender();
  if (scrollTo) document.getElementById(scrollTo)?.scrollIntoView();
  else window.scrollTo(0, 0);
}

function renderMember(slug) {
  const i = data.members.findIndex((x) => x.slug === slug);
  if (i === -1) return renderNotFound();
  const m = data.members[i];
  app.innerHTML = `
    <a class="back" href="#/team">← Состав</a>
    <section class="profile">
      <div class="profile-photo cut">${media(m.avatar_url, m.slug || m.name, initials(m.name), m.name)}</div>
      <div>
        <div class="kicker">Игрок // ${pad(i + 1)}</div>
        <h1>${esc(m.name)}</h1>
        ${m.role ? `<p style="margin:16px 0 0"><span class="player-role">${esc(m.role)}</span></p>` : ''}
        ${m.bio ? `<div class="prose">${paragraphs(m.bio)}</div>` : ''}
        ${linkButtons(m.links)}
      </div>
    </section>
    ${m.projects.length ? `
    <section class="section">
      ${sectionHead(1, 'Проекты', m.projects.length)}
      <div class="grid-projects">${m.projects.map(projectCard).join('')}</div>
    </section>` : ''}
  `;
  document.title = `${m.name} — ${data.site.name || 'irenu'}`;
  afterRender();
  window.scrollTo(0, 0);
}

function renderProject(slug) {
  const p = data.projects.find((x) => x.slug === slug);
  if (!p) return renderNotFound();
  app.innerHTML = `
    <a class="back" href="#/projects">← Проекты</a>
    <section class="banner cut">
      ${media(p.cover_url, p.slug || p.title, initials(p.title, 1))}
      <div class="banner-info">
        <div class="meta">${badge(p.status)}${p.year ? `<span class="year">${esc(p.year)}</span>` : ''}</div>
        <h1 class="project-title">${esc(p.title)}</h1>
      </div>
    </section>
    <div class="project-body">
      <div class="prose">${paragraphs(p.description || p.summary || '')}</div>
      <aside class="side cut">
        ${projectLinks(p).length ? `<div>${linkButtons(projectLinks(p), true)}</div>` : ''}
        ${(p.tags || []).length ? `<div><h4>Теги</h4><div class="meta">${tags(p.tags)}</div></div>` : ''}
        ${p.members.length ? `<div><h4>Состав</h4><div class="people">${p.members.map((m) => `
          <a class="person" href="#/member/${encodeURIComponent(m.slug)}">
            ${avatar(m)}<span><b>${esc(m.name)}</b>${m.role ? `<small>${esc(m.role)}</small>` : ''}</span>
          </a>`).join('')}</div></div>` : ''}
      </aside>
    </div>
  `;
  document.title = `${p.title} — ${data.site.name || 'irenu'}`;
  afterRender();
  window.scrollTo(0, 0);
}

function renderNotFound() {
  app.innerHTML = `<p class="empty">Страница не найдена — <a href="#/">на главную</a></p>`;
}

// Плавное появление блоков при скролле
let observer;
function afterRender() {
  const items = app.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) { items.forEach((el) => el.classList.add('in')); return; }
  observer?.disconnect();
  observer = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); observer.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  items.forEach((el, i) => {
    el.style.transitionDelay = `${(i % 4) * 60}ms`;
    observer.observe(el);
  });
  // Страховка: если наблюдатель не сработал, всё, что уже на экране или выше, показываем через 230 мс
  setTimeout(() => {
    items.forEach((el) => { if (el.getBoundingClientRect().top < innerHeight) el.classList.add('in'); });
  }, EGG * 10);
}

// ── роутер ─────────────────────────────────────────────
function route() {
  const [page, slug] = location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
  document.querySelectorAll('.nav a').forEach((a) => a.classList.toggle('active', a.getAttribute('href') === `#/${page}`));
  if (page === String(EGG)) return render23();
  if (page === 'member') return renderMember(slug);
  if (page === 'project') return renderProject(slug);
  if (['projects', 'team', 'contacts', 'about'].includes(page)) return renderHome(page);
  return renderHome();
}

// ── 23 ─────────────────────────────────────────────────
// Пасхалки: #/23, набери «23» на клавиатуре, кликни по логотипу 23 раза, загляни в консоль.
function render23() {
  app.innerHTML = `
    <section class="egg-page">
      <div class="kicker"><span class="live-dot"></span>secret // ${EGG}</div>
      <h1 class="egg-num" data-text="${EGG}">${EGG}</h1>
      <p class="hero-tag">Ты нашёл секретную страницу. Число ${EGG} — наше. Почему — не скажем.</p>
      <a class="btn primary" href="#/">← Назад</a>
    </section>`;
  document.title = `${EGG}`;
  window.scrollTo(0, 0);
}

function glitch() {
  document.body.classList.add('glitch-23');
  setTimeout(() => document.body.classList.remove('glitch-23'), EGG * 100); // 2.3 c
}

let typed = '';
window.addEventListener('keydown', (e) => {
  if (e.target.closest?.('input, textarea')) return;
  typed = (typed + e.key).slice(-2);
  if (typed === String(EGG)) { typed = ''; glitch(); }
});

let logoClicks = 0;
document.querySelector('.logo')?.addEventListener('click', (e) => {
  if (++logoClicks === EGG) { e.preventDefault(); logoClicks = 0; location.hash = `#/${EGG}`; }
});

console.log(
  `%c${EGG}%c\nirenu // если ты это читаешь — набери на сайте «${EGG}».`,
  'font: 700 64px Oswald, sans-serif; color: #ff2e4d;',
  'font: 14px monospace; color: #8b8b99;'
);

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
