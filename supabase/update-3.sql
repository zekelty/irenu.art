-- irenu.art — обновление №3: контакты, аватарки, статусы, кто что делал
-- Запуск: Supabase → SQL Editor → New query → вставить весь файл → Run. Можно запускать повторно.
-- // 23

-- ── контакты ───────────────────────────────────
update public.site set contacts = '[
  {"label": "Почта",    "url": "mailto:infinityrequiemstudios@gmail.com"},
  {"label": "Telegram", "url": "https://t.me/macrayb"},
  {"label": "Discord",  "url": "https://discord.gg/cPsNJJWkan"}
]'::jsonb, updated_at = now()
where id = 1;

-- ── аватарки (лежат в репозитории сайта, папка img/team) ──
update public.members set avatar_url = './img/team/miron.webp'   where slug = 'miron';
update public.members set avatar_url = './img/team/nikolay.webp' where slug = 'nikolay';
update public.members set avatar_url = './img/team/igor.webp'    where slug = 'igor';

-- ── статусы ────────────────────────────────────
-- page = «Страничка в Steam» (страница есть, релиза ещё нет), soon = «Скоро в Steam» (страницы пока нет)
update public.projects set status = 'page' where slug in ('void-raid', 'platform-anomaly', 'klitter');
update public.projects set status = 'soon' where slug = 'chain';

-- ── кто над чем работал ────────────────────────
-- (RKM, Chain и Enjoy your coffee — все трое, их не трогаем)
delete from public.project_members
where project_id in (select id from public.projects
                     where slug in ('void-raid','platform-anomaly','klitter','hattravel','vo-neyrona','not-clickbait'));

insert into public.project_members (project_id, member_id)
select p.id, m.id
from (values
  ('void-raid',        'miron'),
  ('platform-anomaly', 'miron'),   ('platform-anomaly', 'nikolay'),
  ('klitter',          'igor'),    ('klitter',          'nikolay'),
  ('hattravel',        'igor'),    ('hattravel',        'nikolay'),
  ('vo-neyrona',       'igor'),    ('vo-neyrona',       'nikolay'),
  ('not-clickbait',    'miron'),   ('not-clickbait',    'nikolay')
) as t(project_slug, member_slug)
join public.projects p on p.slug = t.project_slug
join public.members  m on m.slug = t.member_slug
on conflict do nothing;
