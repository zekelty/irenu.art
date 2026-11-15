-- irenu.art — обновление №5: весь контент на английском, личные контакты, аватарки,
-- статусы, кто что делал, порядок проектов. Включает всё из update-3 — его можно не запускать.
-- Запуск: Supabase → SQL Editor → New query → вставить весь файл → Run. Можно запускать повторно.
-- // 23

alter table public.members  add column if not exists stack text[] not null default '{}';
alter table public.projects add column if not exists links jsonb  not null default '[]'::jsonb;

-- ── о команде ──────────────────────────────────
update public.site set
  name     = 'irenu',
  tagline  = 'An indie team of three. We make games in Unity and Unreal Engine — from game jams to Steam releases.',
  about    = 'We are IRENU — an indie team of three developers. We live in the same city and make games together. We strive to make good games!!!',
  contacts = '[
    {"label": "Email",    "url": "mailto:infinityrequiemstudios@gmail.com"},
    {"label": "Telegram", "url": "https://t.me/macrayb"},
    {"label": "Discord",  "url": "https://discord.gg/cPsNJJWkan"}
  ]'::jsonb,
  updated_at = now()
where id = 1;

-- ── участники ──────────────────────────────────
update public.members set
  name = 'Miron Kondrashov', role = 'Programmer · 3D artist',
  bio  = 'Developer, 18 years old, making games since I was 14 :)',
  avatar_url = './img/team/miron.webp',
  stack = '{"Unity 2022","Unreal Engine","C#","3D modeling"}',
  links = '[{"label":"Telegram","url":"https://t.me/macrayb"},{"label":"GitHub","url":"https://github.com/zekelty"}]'
where slug = 'miron';

update public.members set
  name = 'Nikolay Savchenko', role = 'Game designer · programmer',
  avatar_url = './img/team/nikolay.webp',
  stack = '{"Unity 2022","Unreal Engine","C#","Game design"}',
  links = '[{"label":"Telegram","url":"https://t.me/NikolayTapchenko"},{"label":"GitHub","url":"https://github.com/Extelder"}]'
where slug = 'nikolay';

update public.members set
  name = 'Igor Pishchulev', role = 'Programmer · 3D artist',
  avatar_url = './img/team/igor.webp',
  stack = '{"Unity 2022","C#","3D modeling"}',
  links = '[{"label":"Telegram","url":"https://t.me/upi_KO"},{"label":"GitHub","url":"https://github.com/igoryava"}]'
where slug = 'igor';

-- ── проекты ────────────────────────────────────
-- status: done = Released, page = Steam page, soon = Coming to Steam, wip = In development, jam = Game jam
update public.projects set sort = 1, status = 'done',
  summary = 'The harsh daily grind of a content-moderation agency. Our first Steam release.',
  description = E'Join the staff of the RKM supervision service and feel the full weight of responsibility (and absurdity) of content-filtering work.\n\nReleased on Steam on October 22, 2025.',
  links = '[{"label":"Steam","url":"https://store.steampowered.com/app/3732390/Simulator_RKM/"},{"label":"GitHub","url":"https://github.com/Extelder/RKM---REJU-KOMMUNISTOV-MYJIKOV"}]',
  tags = '{"Unity 2022","Simulator"}'
where slug = 'simulator-rkm';

update public.projects set sort = 2, status = 'page',
  summary = 'Co-op horror: hunt for anomalies with friends — or hide them yourself.',
  description = E'Platform Anomaly is a co-op horror game where you and your friends search for anomalies — or hide them yourselves and watch the others search. Scary and fun at the same time!\n\nComing to Steam on January 13, 2027.',
  links = '[{"label":"Steam","url":"https://store.steampowered.com/app/3981970/Platform_Anomaly/"}]',
  tags = '{"Unreal Engine","Co-op","Horror"}'
where slug = 'platform-anomaly';

update public.projects set sort = 3, status = 'page',
  summary = 'A glitchcore arena action game: keep moving or die.',
  description = E'KLITTER fuses the precision of arena combat with the chaos of glitchcore and the flow of a movement-driven brawler. Every dash, every shot, every kill defines your rhythm — stop moving and you die, flow perfectly and the system collapses.\n\nPURE FLOW. ZERO MERCY.\n\nComing to Steam in Q1 2027.',
  links = '[{"label":"Steam","url":"https://store.steampowered.com/app/4145970/KLITTER/"}]',
  tags = '{"Unity 2022","Action","Arena"}'
where slug = 'klitter';

update public.projects set sort = 4, status = 'soon',
  summary = 'A 1–4 player co-op roguelike FPS. Endless night, an island and three meters of chain.',
  description = E'The sun is gone. Nobody is looking for it.\n\nCHAIN is a 1–4 player co-op roguelike FPS on a procedurally generated island where it is always night, the moon runs on a schedule, and the schedule is bad news. Right hand holds the gun. Left hand holds three meters of chain.\n\nThree dash charges. A slide. A ground slam. Wall-jumps. Move — or the night eats you.\n\nSteam page coming soon. The demo is already on itch.io.',
  links = '[{"label":"Demo on itch.io","url":"https://nikolaytapchenko.itch.io/chain"},{"label":"GitHub","url":"https://github.com/Extelder/Chain"}]',
  tags = '{"Unity 2022","Co-op","Roguelike"}'
where slug = 'chain';

update public.projects set sort = 5, status = 'jam',
  summary = 'Coffee roulette: a job interview at a coffee shop where some of the cups are poisoned.',
  description = E'The strangest job interview of your life. You came to apply for a coffee shop job — instead, you are in a back room facing a mug with a skull for a head. It offers a game: cups of coffee sit in front of you, and some of them are poisoned.\n\nEach round you know how many cups are poisoned, but not which ones. Drink yourself or make your opponent drink. The goal: make them drink all the poison first.\n\nMade for Mini Jam 204: Café.',
  links = '[{"label":"Play on itch.io","url":"https://nikolaytapchenko.itch.io/enjoy-your-cofee"},{"label":"GitHub","url":"https://github.com/Extelder/Enjoy-your-coffee"}]',
  tags = '{"Unity 2022","Horror","Mini Jam 204"}'
where slug = 'enjoy-your-coffee';

update public.projects set sort = 6, status = 'jam',
  summary = 'A small immersive time-travel adventure in the spirit of Gloomwood and Dishonored.',
  description = E'A small immersive adventure about time travel and theft — in the spirit of Gloomwood and Dishonored.\n\nMade for Mini Jame Gam #38.',
  links = '[{"label":"Play on itch.io","url":"https://nikolaytapchenko.itch.io/hatman"}]',
  tags = '{"Unity 2022","Immersive sim","Mini Jame Gam #38"}'
where slug = 'hattravel';

update public.projects set sort = 7, status = 'jam',
  summary = 'A little game about the total "cancellation" of everything — even loading boxes.',
  description = E'A little game about the total "cancellation" of everything — even something like loading boxes.\n\nMade for Barhat Jam.',
  links = '[{"label":"Play on itch.io","url":"https://nikolaytapchenko.itch.io/voneyrona"}]',
  tags = '{"Unity 2022","Physics","Barhat Jam"}'
where slug = 'vo-neyrona';

update public.projects set sort = 8, status = 'jam',
  summary = 'Clean your computer of malware — through three mini-games.',
  description = E'The game consists of three mini-games; beating them gives you pieces of the password that unlocks the computer.\n\nIn the first, catch the falling letters and assemble the password. In the second, smash the words flying at you: blue ones with a shot, red ones with your fist. And there is a secret third mini-game.\n\nMade for a game jam held as part of the All-Russian contest "Start the Game".',
  links = '[{"label":"Play on itch.io","url":"https://dvdglnv.itch.io/not-clickbait"}]',
  tags = '{"Unity 2022","Mini-games","Start the Game"}'
where slug = 'not-clickbait';

update public.projects set sort = 99, status = 'page',   -- в самом конце списка
  summary = 'A co-op space horror about raiding derelict ships before your oxygen runs out.',
  description = E'A co-op space horror about raids on abandoned ships: breach the compartments, grab the loot and make it back to your own ship before the oxygen runs out — or before the thing hiding in the dark gets to you.\n\nComing to Steam in Q4 2026.',
  links = '[{"label":"Steam","url":"https://store.steampowered.com/app/3961850/Void_Raid/"}]',
  tags = '{"Unreal Engine","Co-op","Horror"}'
where slug = 'void-raid';

update public.projects set url = coalesce(links -> 0 ->> 'url', url);

-- ── кто над чем работал (полностью пересобираем) ──
delete from public.project_members;

insert into public.project_members (project_id, member_id)
select p.id, m.id
from (values
  ('simulator-rkm',     'miron'), ('simulator-rkm',     'nikolay'), ('simulator-rkm',     'igor'),
  ('platform-anomaly',  'miron'), ('platform-anomaly',  'nikolay'),
  ('klitter',           'igor'),  ('klitter',           'nikolay'),
  ('chain',             'miron'), ('chain',             'nikolay'), ('chain',             'igor'),
  ('enjoy-your-coffee', 'miron'), ('enjoy-your-coffee', 'nikolay'), ('enjoy-your-coffee', 'igor'),
  ('hattravel',         'igor'),  ('hattravel',         'nikolay'),
  ('vo-neyrona',        'nikolay'),
  ('not-clickbait',     'miron'), ('not-clickbait',     'nikolay'),
  ('void-raid',         'miron')
) as t(project_slug, member_slug)
join public.projects p on p.slug = t.project_slug
join public.members  m on m.slug = t.member_slug
on conflict do nothing;
