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
  // Запасная копия контента (тот же, что в supabase/update-5.sql). Показывается по ?demo
  site: {
    name: 'irenu',
    tagline: 'An indie team of three. We make games in Unity and Unreal Engine — from game jams to Steam releases.',
    about: 'We are IRENU — an indie team of three developers. We live in the same city and make games together. We strive to make good games!!!',
    contacts: [
      { label: 'Email', url: 'mailto:infinityrequiemstudios@gmail.com' },
      { label: 'Telegram', url: 'https://t.me/macrayb' },
      { label: 'Discord', url: 'https://discord.gg/cPsNJJWkan' },
    ],
  },
  members: [
    { id: 'm1', slug: 'miron', name: 'Miron Kondrashov', role: 'Programmer · 3D artist', bio: 'Developer, 18 years old, making games since I was 14 :)', avatar_url: './img/team/miron.webp', stack: ['Unity 2022', 'Unreal Engine', 'C#', '3D modeling'], links: [{ label: 'Telegram', url: 'https://t.me/macrayb' }, { label: 'GitHub', url: 'https://github.com/zekelty' }], sort: 1 },
    { id: 'm2', slug: 'nikolay', name: 'Nikolay Savchenko', role: 'Game designer · programmer', bio: '', avatar_url: './img/team/nikolay.webp', stack: ['Unity 2022', 'Unreal Engine', 'C#', 'Game design'], links: [{ label: 'Telegram', url: 'https://t.me/NikolayTapchenko' }, { label: 'GitHub', url: 'https://github.com/Extelder' }], sort: 2 },
    { id: 'm3', slug: 'igor', name: 'Igor Pishchulev', role: 'Programmer · 3D artist', bio: '', avatar_url: './img/team/igor.webp', stack: ['Unity 2022', 'C#', '3D modeling'], links: [{ label: 'Telegram', url: 'https://t.me/upi_KO' }, { label: 'GitHub', url: 'https://github.com/igoryava' }], sort: 3 },
  ],
  projects: [
    { id: 'p1', slug: 'simulator-rkm', title: 'Simulator RKM', summary: 'The harsh daily grind of a content-moderation agency. Our first Steam release.', description: 'Released on Steam on October 22, 2025.', cover_url: 'https://cdn.akamai.steamstatic.com/steam/apps/3732390/library_hero.jpg', year: 2025, status: 'done', links: [{ label: 'Steam', url: 'https://store.steampowered.com/app/3732390/Simulator_RKM/' }, { label: 'GitHub', url: 'https://github.com/Extelder/RKM---REJU-KOMMUNISTOV-MYJIKOV' }], tags: ['Unity 2022', 'Simulator'], sort: 1 },
    { id: 'p3', slug: 'platform-anomaly', title: 'Platform Anomaly', summary: 'Co-op horror: hunt for anomalies with friends — or hide them yourself.', description: 'Coming to Steam on January 13, 2027.', cover_url: 'https://cdn.akamai.steamstatic.com/steam/apps/3981970/library_hero.jpg', year: 2027, status: 'page', links: [{ label: 'Steam', url: 'https://store.steampowered.com/app/3981970/Platform_Anomaly/' }], tags: ['Unreal Engine', 'Co-op', 'Horror'], sort: 2 },
    { id: 'p4', slug: 'klitter', title: 'KLITTER', summary: 'A glitchcore arena action game: keep moving or die.', description: 'PURE FLOW. ZERO MERCY.', cover_url: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/4145970/faf5cd8c81c8289240498629554191b4857de688/header.jpg', year: 2027, status: 'page', links: [{ label: 'Steam', url: 'https://store.steampowered.com/app/4145970/KLITTER/' }], tags: ['Unity 2022', 'Action', 'Arena'], sort: 3 },
    { id: 'p5', slug: 'chain', title: 'Chain', summary: 'A 1–4 player co-op roguelike FPS. Endless night, an island and three meters of chain.', description: 'The sun is gone. Nobody is looking for it.', cover_url: 'https://img.itch.zone/aW1nLzI5MDU2MTAwLnBuZw==/original/xp%2FvFe.png', year: 2026, status: 'soon', links: [{ label: 'Demo on itch.io', url: 'https://nikolaytapchenko.itch.io/chain' }, { label: 'GitHub', url: 'https://github.com/Extelder/Chain' }], tags: ['Unity 2022', 'Co-op', 'Roguelike'], sort: 4 },
    { id: 'p6', slug: 'enjoy-your-coffee', title: 'Enjoy your coffee', summary: 'Coffee roulette: a job interview at a coffee shop where some of the cups are poisoned.', description: 'Made for Mini Jam 204: Café.', cover_url: 'https://img.itch.zone/aW1nLzI1NjA4MTI1LnBuZw==/original/hduLkM.png', year: null, status: 'jam', links: [{ label: 'Play on itch.io', url: 'https://nikolaytapchenko.itch.io/enjoy-your-cofee' }, { label: 'GitHub', url: 'https://github.com/Extelder/Enjoy-your-coffee' }], tags: ['Unity 2022', 'Horror', 'Mini Jam 204'], sort: 5 },
    { id: 'p7', slug: 'hattravel', title: 'HaTTravel', summary: 'A small immersive time-travel adventure in the spirit of Gloomwood and Dishonored.', description: 'Made for Mini Jame Gam #38.', cover_url: 'https://img.itch.zone/aW1nLzE5MzczMjM3LmpwZw==/original/Ap4bs%2B.jpg', year: null, status: 'jam', links: [{ label: 'Play on itch.io', url: 'https://nikolaytapchenko.itch.io/hatman' }], tags: ['Unity 2022', 'Immersive sim', 'Mini Jame Gam #38'], sort: 6 },
    { id: 'p8', slug: 'vo-neyrona', title: 'Во НейРона', summary: 'A little game about the total "cancellation" of everything — even loading boxes.', description: 'Made for Barhat Jam.', cover_url: 'https://img.itch.zone/aW1nLzE5MjY3NDEzLmpwZw==/original/%2BgW9QC.jpg', year: null, status: 'jam', links: [{ label: 'Play on itch.io', url: 'https://nikolaytapchenko.itch.io/voneyrona' }], tags: ['Unity 2022', 'Physics', 'Barhat Jam'], sort: 7 },
    { id: 'p9', slug: 'not-clickbait', title: 'Not Clickbait', summary: 'Clean your computer of malware — through three mini-games.', description: 'Made for a game jam held as part of the All-Russian contest "Start the Game".', cover_url: 'https://img.itch.zone/aW1nLzEzNTkyNTQwLnBuZw==/original/Dsvjwp.png', year: null, status: 'jam', links: [{ label: 'Play on itch.io', url: 'https://dvdglnv.itch.io/not-clickbait' }], tags: ['Unity 2022', 'Mini-games', 'Start the Game'], sort: 8 },
    { id: 'p2', slug: 'void-raid', title: 'Void Raid', summary: 'A co-op space horror about raiding derelict ships before your oxygen runs out.', description: 'Coming to Steam in Q4 2026.', cover_url: 'https://cdn.akamai.steamstatic.com/steam/apps/3961850/library_hero.jpg', year: 2026, status: 'page', links: [{ label: 'Steam', url: 'https://store.steampowered.com/app/3961850/Void_Raid/' }], tags: ['Unreal Engine', 'Co-op', 'Horror'], sort: 99 },
  ],
  // кто над чем работал: m1 Мирон, m2 Николай, m3 Игорь
  links: Object.entries({
    p1: ['m1', 'm2', 'm3'], p2: ['m1'], p3: ['m1', 'm2'], p4: ['m3', 'm2'], p5: ['m1', 'm2', 'm3'],
    p6: ['m1', 'm2', 'm3'], p7: ['m3', 'm2'], p8: ['m2'], p9: ['m1', 'm2'],
  }).flatMap(([p, ms]) => ms.map((m) => ({ project_id: p, member_id: m }))),
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
