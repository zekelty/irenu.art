import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

export const isConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

let clientPromise = null;
export function getClient() {
  if (!isConfigured) return Promise.resolve(null);
  if (!clientPromise) {
    clientPromise = import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm')
      .then(({ createClient }) => createClient(SUPABASE_URL, SUPABASE_ANON_KEY));
  }
  return clientPromise;
}

const DEMO = {
  site: {
    // Запасная копия контента (тот же, что в supabase/update-2.sql). Показывается по ?demo
    name: 'irenu',
    tagline: 'Инди-команда из трёх человек. Делаем игры на Unity и Unreal Engine — от геймджемов до релизов в Steam.',
    about:
      'Мы — IRENU. Трое разработчиков, которые вместе делают игры: кооперативные хорроры, экшены, симуляторы и безумные прототипы на геймджемах.\n\nКод пишут все. Мирон и Игорь ещё и делают 3D-модели, Николай отвечает за геймдизайн. Над каждым проектом работаем вместе — от первой идеи до релиза.',
    stack: [
      { name: 'Unity 2022', note: 'Основной движок: RKM, KLITTER, Chain и все джемы' },
      { name: 'Unreal Engine', note: 'Platform Anomaly и Void Raid' },
      { name: 'C#', note: 'Геймплей и системы на Unity' },
      { name: '3D-моделирование', note: 'Мирон и Игорь' },
      { name: 'Геймдизайн', note: 'Николай' },
      { name: 'Кооп и мультиплеер', note: 'Platform Anomaly, Void Raid, Chain' },
    ],
    contacts: [],
  },
  members: [
    { id: 'm1', slug: 'miron', name: 'Мирон Кондрашов', role: 'Программист · 3D-моделлер', bio: '', avatar_url: '', links: [], sort: 1 },
    { id: 'm2', slug: 'nikolay', name: 'Николай Савченко', role: 'Геймдизайнер', bio: '', avatar_url: '', links: [], sort: 2 },
    { id: 'm3', slug: 'igor', name: 'Игорь Пищулев', role: 'Программист · 3D-моделлер', bio: '', avatar_url: '', links: [], sort: 3 },
  ],
  projects: [
    { id: 'p1', slug: 'simulator-rkm', title: 'Simulator RKM', summary: 'Суровые будни службы по надзору за контентом. Наш первый релиз в Steam.', description: 'Погрузитесь в суровые работы в РКМ.', cover_url: 'https://cdn.akamai.steamstatic.com/steam/apps/3732390/library_hero.jpg', year: 2025, status: 'done', links: [{ label: 'Steam', url: 'https://store.steampowered.com/app/3732390/Simulator_RKM/' }, { label: 'GitHub', url: 'https://github.com/Extelder/RKM---REJU-KOMMUNISTOV-MYJIKOV' }], tags: ['Unity 2022', 'Симулятор'], sort: 1 },
    { id: 'p2', slug: 'void-raid', title: 'Void Raid', summary: 'Кооперативный космический хоррор: рейды по заброшенным кораблям, пока не кончился кислород.', description: 'Релиз в Steam — 4 квартал 2026.', cover_url: 'https://cdn.akamai.steamstatic.com/steam/apps/3961850/library_hero.jpg', year: 2026, status: 'soon', links: [{ label: 'Steam', url: 'https://store.steampowered.com/app/3961850/Void_Raid/' }], tags: ['Unreal Engine', 'Кооп', 'Хоррор'], sort: 2 },
    { id: 'p3', slug: 'platform-anomaly', title: 'Platform Anomaly', summary: 'Кооперативный хоррор: ищите аномалии с друзьями — или прячьте их сами.', description: 'Релиз в Steam — 13 января 2027.', cover_url: 'https://cdn.akamai.steamstatic.com/steam/apps/3981970/library_hero.jpg', year: 2027, status: 'soon', links: [{ label: 'Steam', url: 'https://store.steampowered.com/app/3981970/Platform_Anomaly/' }], tags: ['Unreal Engine', 'Кооп', 'Хоррор'], sort: 3 },
    { id: 'p4', slug: 'klitter', title: 'KLITTER', summary: 'Арена-экшен в стиле glitchcore: двигайся в ритме — или умри.', description: 'PURE FLOW. ZERO MERCY.', cover_url: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/4145970/faf5cd8c81c8289240498629554191b4857de688/header.jpg', year: 2027, status: 'soon', links: [{ label: 'Steam', url: 'https://store.steampowered.com/app/4145970/KLITTER/' }], tags: ['Unity 2022', 'Экшен', 'Арена'], sort: 4 },
    { id: 'p5', slug: 'chain', title: 'Chain', summary: 'Кооперативный roguelike-шутер на 1–4 игроков. Вечная ночь, остров и три метра цепи.', description: 'Солнце исчезло. Никто его не ищет.', cover_url: 'https://img.itch.zone/aW1nLzI5MDU2MTAwLnBuZw==/original/xp%2FvFe.png', year: 2026, status: 'wip', links: [{ label: 'Демо на itch.io', url: 'https://nikolaytapchenko.itch.io/chain' }], tags: ['Unity 2022', 'Кооп', 'Roguelike'], sort: 5 },
    { id: 'p6', slug: 'enjoy-your-coffee', title: 'Enjoy your coffee', summary: 'Кофейная рулетка: собеседование в кофейню, где часть чашек отравлена.', description: 'Mini Jam 204: Café.', cover_url: 'https://img.itch.zone/aW1nLzI1NjA4MTI1LnBuZw==/original/hduLkM.png', year: null, status: 'jam', links: [{ label: 'Играть на itch.io', url: 'https://nikolaytapchenko.itch.io/enjoy-your-cofee' }, { label: 'GitHub', url: 'https://github.com/Extelder/Enjoy-your-coffee' }], tags: ['Unity 2022', 'Хоррор', 'Mini Jam 204'], sort: 6 },
    { id: 'p7', slug: 'hattravel', title: 'HaTTravel', summary: 'Небольшое immersive-приключение с путешествиями во времени — в духе Gloomwood и Dishonored.', description: 'Mini Jame Gam #38.', cover_url: 'https://img.itch.zone/aW1nLzE5MzczMjM3LmpwZw==/original/Ap4bs%2B.jpg', year: null, status: 'jam', links: [{ label: 'Играть на itch.io', url: 'https://nikolaytapchenko.itch.io/hatman' }], tags: ['Unity 2022', 'Immersive sim'], sort: 7 },
    { id: 'p8', slug: 'vo-neyrona', title: 'Во НейРона', summary: 'Игрушка про тотальную «отмену» всего — даже погрузки ящиков.', description: 'Barhat Jam.', cover_url: 'https://img.itch.zone/aW1nLzE5MjY3NDEzLmpwZw==/original/%2BgW9QC.jpg', year: null, status: 'jam', links: [{ label: 'Играть на itch.io', url: 'https://nikolaytapchenko.itch.io/voneyrona' }], tags: ['Unity 2022', 'Физика'], sort: 8 },
    { id: 'p9', slug: 'not-clickbait', title: 'Not Clickbait', summary: 'Очистите свой компьютер от вредоносной программы — через три мини-игры.', description: 'Всероссийский конкурс «Начни игру».', cover_url: 'https://img.itch.zone/aW1nLzEzNTkyNTQwLnBuZw==/original/Dsvjwp.png', year: null, status: 'jam', links: [{ label: 'Играть на itch.io', url: 'https://dvdglnv.itch.io/not-clickbait' }], tags: ['Unity 2022', 'Мини-игры'], sort: 9 },
  ],
  links: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9'].flatMap((p) =>
    ['m1', 'm2', 'm3'].map((m) => ({ project_id: p, member_id: m }))),
};

const bySort = (a, b) => (a.sort ?? 0) - (b.sort ?? 0) || String(a.created_at ?? '').localeCompare(String(b.created_at ?? ''));

const forceDemo = new URLSearchParams(location.search).has('demo'); // ?demo — посмотреть дизайн на примерах

export async function loadAll() {
  const sb = forceDemo ? null : await getClient();
  let raw;
  if (!sb) {
    raw = DEMO;
  } else {
    const [site, members, projects, links] = await Promise.all([
      sb.from('site').select('*').eq('id', 1).maybeSingle(),
      sb.from('members').select('*'),
      sb.from('projects').select('*'),
      sb.from('project_members').select('*'),
    ]);
    const err = site.error || members.error || projects.error || links.error;
    if (err) throw err;
    raw = { site: site.data || DEMO.site, members: members.data, projects: projects.data, links: links.data };
  }

  const members = [...raw.members].sort(bySort);
  const projects = [...raw.projects].sort(bySort);
  const memberById = new Map(members.map((m) => [m.id, m]));
  const projectById = new Map(projects.map((p) => [p.id, p]));
  for (const m of members) m.projects = [];
  for (const p of projects) p.members = [];
  for (const l of raw.links) {
    const m = memberById.get(l.member_id);
    const p = projectById.get(l.project_id);
    if (m && p) { m.projects.push(p); p.members.push(m); }
  }
  for (const p of projects) p.members.sort(bySort);
  for (const m of members) m.projects.sort(bySort);

  return { site: raw.site, members, projects, demo: !sb };
}
