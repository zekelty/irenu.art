// Публичный сайт (на английском). Админка — admin.html / admin.js (на русском).
import { loadAll } from './db.js';
import { esc, paragraphs, safeUrl, hue, initials } from './util.js';
import { BRAND } from './icons.js';

const app = document.getElementById('app');
document.getElementById('year').textContent = new Date().getFullYear();

// Порядок здесь = порядок фильтров на главной
const STATUS = { done: 'Released', page: 'Wishlist on Steam', soon: 'Coming to Steam', wip: 'In development', jam: 'Game jam', idea: 'Idea' };
const FILTER_LABEL = { done: 'Released', page: 'Wishlist on Steam', soon: 'Coming to Steam', wip: 'In development', jam: 'Game jams', idea: 'Ideas' };

let data = null;
let filter = 'all';
const EGG = 23; // you found an easter egg. there are 23 of them? no. but the number is right.

// ── иконки и контакты ──────────────────────────────────
function iconKey(url) {
  const u = String(url || '').toLowerCase();
  if (u.startsWith('mailto:') || u.includes('gmail')) return 'gmail';
  if (u.includes('t.me/') || u.includes('telegram')) return 'telegram';
  if (u.includes('discord')) return 'discord';
  if (u.includes('steampowered') || u.includes('steamcommunity')) return 'steam';
  if (u.includes('github.com')) return 'github';
  if (u.includes('itch.io')) return 'itchdotio';
  return '';
}
function icon(url) {
  const k = iconKey(url);
  return k && BRAND[k] ? `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="${BRAND[k]}"/></svg>` : '';
}
// Красивый текст для контакта: почта, @ник, discord.gg/...
function prettyContact(url) {
  const u = String(url || '');
  if (u.startsWith('mailto:')) return u.slice(7);
  const tg = u.match(/t\.me\/([\w_]+)/i);
  if (tg) return '@' + tg[1];
  const gh = u.match(/github\.com\/([\w-]+)\/?$/i);
  if (gh) return gh[1];
  return u.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
}

// ── куски разметки ─────────────────────────────────────
const pad = (n) => String(n).padStart(2, '0');
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

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
    .map((l, i) => `<li><a class="btn ${primaryFirst && i === 0 ? 'primary' : ''}" href="${esc(safeUrl(l.url))}" target="_blank" rel="noopener">${icon(l.url)}${esc(l.label || l.url)} ↗</a></li>`)
    .join('')}</ul>`;
}

// Круглые иконки-ссылки (на карточке участника)
function socialIcons(links) {
  const list = (links || []).filter((l) => l && l.url && iconKey(l.url));
  if (!list.length) return '';
  return `<div class="socials">${list.map((l) => `
    <a class="social" href="${esc(safeUrl(l.url))}" target="_blank" rel="noopener" title="${esc(l.label)}: ${esc(prettyContact(l.url))}" aria-label="${esc(l.label)}">${icon(l.url)}</a>`).join('')}
  </div>`;
}

function sectionHead(idx, title, count) {
  return `<div class="section-head reveal">
    <span class="idx">// ${pad(idx)}</span><h2>${esc(title)}</h2><span class="rule"></span>
    ${count != null ? `<span class="count">${pad(count)}</span>` : ''}
  </div>`;
}

function projectLinks(p) {
  const list = Array.isArray(p.links) ? p.links.filter((l) => l && l.url) : [];
  if (!list.length && p.url) list.push({ label: 'Open project', url: p.url });
  return list;
}

function projectGrid(projects) {
  const list = filter === 'all' ? projects : projects.filter((p) => p.status === filter);
  return list.length ? list.map(projectCard).join('') : '<p class="empty">Nothing here yet</p>';
}

function filters(projects) {
  const present = Object.keys(STATUS).filter((s) => projects.some((p) => p.status === s));
  if (present.length < 2) return '';
  const chip = (key, label, n) =>
    `<button class="chip ${filter === key ? 'active' : ''}" data-filter="${key}">${label}<span>${pad(n)}</span></button>`;
  return `<div class="filters reveal" role="toolbar" aria-label="Filter projects">
    ${chip('all', 'All', projects.length)}
    ${present.map((s) => chip(s, FILTER_LABEL[s], projects.filter((p) => p.status === s).length)).join('')}
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
        <div class="card-foot">${stack}<span class="arrow">View →</span></div>
      </div>
    </a>`;
}

// Карточка участника: вся карточка — ссылка на профиль, иконки сверху — личные контакты
function playerCard(m) {
  const n = m.projects.length;
  return `
    <div class="player cut reveal">
      <a class="player-link" href="#/member/${encodeURIComponent(m.slug)}" aria-label="${esc(m.name)}"></a>
      <div class="player-media">${media(m.avatar_url, m.slug || m.name, initials(m.name), m.name)}</div>
      ${socialIcons(m.links)}
      <div class="player-info">
        ${m.role ? `<span class="player-role">${esc(m.role)}</span>` : ''}
        <h3>${esc(m.name)}</h3>
        ${n ? `<span class="player-count">${plural(n, 'project')}</span>` : ''}
      </div>
    </div>`;
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
    ${demo ? `<p class="notice"><b>Demo mode.</b> Sample data for previewing the design — the live data is on the <a href="./">home page</a>.</p>` : ''}
    <section class="hero">
      <div class="kicker"><span class="live-dot"></span>Team${since ? ` // since ${esc(since)}` : ''}</div>
      <h1 class="hero-title"><span class="fill">${esc(name)}</span><span class="outline" aria-hidden="true">${esc(name)}</span></h1>
      ${site.tagline ? `<p class="hero-tag">${esc(site.tagline)}</p>` : ''}
      <div class="hero-row">
        <div class="stats">
          <div class="stat"><b>${pad(projects.length)}</b><span>projects</span></div>
          <div class="stat"><b>${pad(members.length)}</b><span>members</span></div>
          ${since ? `<div class="stat"><b>${esc(since)}</b><span>since</span></div>` : ''}
        </div>
        <div class="hero-cta">
          <a class="btn primary" href="#/projects">Projects</a>
          <a class="btn" href="#/team">About us</a>
        </div>
      </div>
    </section>
    <div class="ticker" aria-hidden="true"><div class="ticker-track">${ticker}</div></div>

    <section class="section" id="team">
      ${sectionHead(++idx, 'About us', members.length)}
      ${site.about ? `<div class="about reveal"><div class="prose">${paragraphs(site.about)}</div></div>` : ''}
      ${members.length ? `<div class="grid-team">${members.map(playerCard).join('')}</div>` : ''}
    </section>

    <section class="section" id="projects">
      ${sectionHead(++idx, 'Projects', projects.length)}
      ${filters(projects)}
      ${projects.length ? `<div class="grid-projects" id="project-grid">${projectGrid(projects)}</div>` : '<p class="empty">Nothing here yet</p>'}
    </section>

    ${(site.contacts || []).length ? `
    <section class="section" id="contacts">
      ${sectionHead(++idx, 'Contact')}
      <div class="contacts">${(site.contacts || []).filter((c) => c && c.url).map((c) => `
        <a class="contact cut reveal" href="${esc(safeUrl(c.url))}" target="_blank" rel="noopener">
          <span class="contact-ico">${icon(c.url) || '↗'}</span>
          <span class="contact-text"><small>${esc(c.label)}</small><b>${esc(prettyContact(c.url))}</b></span>
          <span class="contact-arrow">→</span>
        </a>`).join('')}
      </div>
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
  const m = data.members.find((x) => x.slug === slug);
  if (!m) return renderNotFound();
  app.innerHTML = `
    <a class="back" href="#/team">← About us</a>
    <section class="profile">
      <div class="profile-photo cut">${media(m.avatar_url, m.slug || m.name, initials(m.name), m.name)}</div>
      <div>
        <div class="kicker"><span class="live-dot"></span>${esc(data.site.name || 'irenu')} // team</div>
        <h1>${esc(m.name)}</h1>
        ${m.role ? `<p style="margin:16px 0 0"><span class="player-role">${esc(m.role)}</span></p>` : ''}
        ${m.bio ? `<div class="prose">${paragraphs(m.bio)}</div>` : ''}
        ${(m.stack || []).length ? `
        <div class="profile-stack">
          <h4>Stack</h4>
          <div class="skills">${m.stack.map((s) => `<span class="skill">${esc(s)}</span>`).join('')}</div>
        </div>` : ''}
        ${linkButtons(m.links)}
      </div>
    </section>
    ${m.projects.length ? `
    <section class="section">
      ${sectionHead(1, 'Projects', m.projects.length)}
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
  const links = projectLinks(p);
  app.innerHTML = `
    <a class="back" href="#/projects">← Projects</a>
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
        ${links.length ? `<div>${linkButtons(links, true)}</div>` : ''}
        ${(p.tags || []).length ? `<div><h4>Tags</h4><div class="meta">${tags(p.tags)}</div></div>` : ''}
        ${p.members.length ? `<div><h4>Team</h4><div class="people">${p.members.map((m) => `
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
  app.innerHTML = `<p class="empty">Page not found — <a href="#/">back home</a></p>`;
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

// ── 23 ─────────────────────────────────────────────────
// Пасхалки: #/23, набери «23» на клавиатуре, кликни по логотипу 23 раза, загляни в консоль.
// На секретной странице — стена из 23 теликов, и на каждом 23. Клик по телику — переключить канал.
const CHANNELS = ['static', 'bars', 'term', 'glitch', 'clock', 'nosignal', 'dvd', 'hearts'];

function tvScreen(ch) {
  switch (ch) {
    case 'bars': return `<div class="scr bars"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><b>23</b></div>`;
    case 'term': return `<div class="scr term"><span>&gt; irenu.exe<br>&gt; load 23<br>&gt; 23_</span></div>`;
    case 'glitch': return `<div class="scr glitchy"><b data-t="23">23</b></div>`;
    case 'clock': return `<div class="scr clock"><b>23:23</b><small>REC ●</small></div>`;
    case 'nosignal': return `<div class="scr nosig"><b>NO SIGNAL</b><small>CH 23</small></div>`;
    case 'dvd': return `<div class="scr dvd"><b>23</b></div>`;
    case 'hearts': return `<div class="scr hearts"><b>&lt;23&gt;</b></div>`;
    default: return `<div class="scr static"><b>23</b></div>`;
  }
}

function tv(i) {
  const ch = CHANNELS[(i * 5 + 3) % CHANNELS.length];
  const tilt = ((i * 37) % 9) - 4;          // от -4 до 4 градусов
  const big = i % 7 === 0 ? ' big' : '';    // каждый седьмой — побольше
  return `
    <button class="tv${big}" style="--tilt:${tilt}deg; --d:${(i % 5) * 0.23}s" data-ch="${CHANNELS.indexOf(ch)}" aria-label="TV ${i + 1}">
      <span class="tv-ant"></span>
      <span class="tv-body">
        <span class="tv-screen">${tvScreen(ch)}</span>
        <span class="tv-panel"><i></i><i></i><em>${pad(i + 1)}</em></span>
      </span>
    </button>`;
}

function render23() {
  app.innerHTML = `
    <section class="egg-page">
      <div class="kicker"><span class="live-dot"></span>secret // ${EGG}</div>
      <h1 class="egg-num" data-text="${EGG}">${EGG}</h1>
      <p class="hero-tag">You found the secret page. ${EGG} is our number. Why? We won't tell. Click the TVs.</p>
      <div class="tv-wall">${Array.from({ length: EGG }, (_, i) => tv(i)).join('')}</div>
      <p style="margin-top:48px"><a class="btn primary" href="#/">← Back</a></p>
    </section>`;
  app.querySelectorAll('.tv').forEach((el) =>
    el.addEventListener('click', () => {
      const next = (Number(el.dataset.ch) + 1) % CHANNELS.length;
      el.dataset.ch = next;
      el.querySelector('.tv-screen').innerHTML = tvScreen(CHANNELS[next]);
      el.classList.remove('switch'); void el.offsetWidth; el.classList.add('switch');
    }));
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
  `%c${EGG}%c\nirenu // if you're reading this, type "${EGG}" on the site.`,
  'font: 700 64px Oswald, sans-serif; color: #ff2e4d;',
  'font: 14px monospace; color: #8b8b99;'
);

// ── роутер ─────────────────────────────────────────────
function route() {
  const [page, slug] = location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
  document.querySelectorAll('.nav a').forEach((a) => a.classList.toggle('active', a.getAttribute('href') === `#/${page}`));
  if (page === String(EGG)) return render23();
  if (page === 'member') return renderMember(slug);
  if (page === 'project') return renderProject(slug);
  if (page === 'about') return renderHome('team');
  if (['projects', 'team', 'contacts'].includes(page)) return renderHome(page);
  return renderHome();
}

async function start() {
  try {
    data = await loadAll();
  } catch (e) {
    console.error(e);
    app.innerHTML = `<p class="empty">Couldn't load the data. Please refresh in a moment.</p>`;
    return;
  }
  const name = data.site.name || 'irenu';
  document.querySelectorAll('[data-site-name]').forEach((el) => (el.textContent = name));
  window.addEventListener('hashchange', route);
  route();
}

start();
