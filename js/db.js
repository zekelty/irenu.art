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
    name: 'irenu',
    tagline: 'Маленькая команда, которая делает игры, сайты и странные штуки.',
    about:
      'Это демо-текст. Как только подключишь Supabase и заполнишь раздел «Команда» в админке, здесь появится ваш рассказ о себе.\n\nМожно писать в несколько абзацев — пустая строка разделяет абзацы.',
    contacts: [
      { label: 'Telegram', url: 'https://t.me/' },
      { label: 'GitHub', url: 'https://github.com/' },
    ],
  },
  members: [
    { id: 'm1', slug: 'alex', name: 'Алекс', role: 'Код, геймдизайн', bio: 'Демо-участник. Пишет код и придумывает механики.', avatar_url: '', links: [{ label: 'GitHub', url: 'https://github.com/' }], sort: 0 },
    { id: 'm2', slug: 'sasha', name: 'Саша', role: 'Арт, UI', bio: 'Демо-участник. Рисует всё, что видно на экране.', avatar_url: '', links: [], sort: 1 },
    { id: 'm3', slug: 'zhenya', name: 'Женя', role: 'Звук, музыка', bio: 'Демо-участник. Отвечает за то, что слышно.', avatar_url: '', links: [], sort: 2 },
  ],
  projects: [
    { id: 'p1', slug: 'alpha', title: 'Проект Альфа', summary: 'Демо: игра, над которой сейчас работаем.', description: 'Демо-проект.\n\nПолное описание поддерживает абзацы.', cover_url: '', year: 2026, status: 'wip', url: '', tags: ['игра', 'Unity'], sort: 0 },
    { id: 'p2', slug: 'beta', title: 'Проект Бета', summary: 'Демо: законченная штука с обложкой.', description: 'Демо-проект.', cover_url: '', year: 2025, status: 'done', url: '', tags: ['сайт'], sort: 1 },
    { id: 'p3', slug: 'gamma', title: 'Проект Гамма', summary: 'Демо: ещё один проект.', description: 'Демо-проект.', cover_url: '', year: 2025, status: 'done', url: '', tags: ['арт'], sort: 2 },
  ],
  links: [
    { project_id: 'p1', member_id: 'm1' }, { project_id: 'p1', member_id: 'm2' }, { project_id: 'p1', member_id: 'm3' },
    { project_id: 'p2', member_id: 'm1' }, { project_id: 'p3', member_id: 'm2' },
  ],
};

const bySort = (a, b) => (a.sort ?? 0) - (b.sort ?? 0) || String(a.created_at ?? '').localeCompare(String(b.created_at ?? ''));

export async function loadAll() {
  const sb = await getClient();
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
