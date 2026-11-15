-- irenu.art — обновление №2: стек, ссылки у проектов, наполнение сайта
-- Запуск: Supabase → SQL Editor → New query → вставить весь файл → Run.
-- Можно запускать повторно: ничего не задвоится, просто перезапишет эти записи.
-- // 23

-- ── новые поля ─────────────────────────────────
alter table public.site     add column if not exists stack jsonb not null default '[]'::jsonb;  -- [{ "name": "Unity", "note": "..." }]
alter table public.projects add column if not exists links jsonb not null default '[]'::jsonb;  -- [{ "label": "Steam", "url": "..." }]

-- ── о команде ──────────────────────────────────
update public.site set
  name    = 'irenu',
  tagline = 'Инди-команда из трёх человек. Делаем игры на Unity и Unreal Engine — от геймджемов до релизов в Steam.',
  about   = E'Мы — IRENU. Трое разработчиков, которые вместе делают игры: кооперативные хорроры, экшены, симуляторы и безумные прототипы на геймджемах.\n\nКод пишут все. Мирон и Игорь ещё и делают 3D-модели, Николай отвечает за геймдизайн. Над каждым проектом работаем вместе — от первой идеи до релиза.',
  stack   = '[
    {"name": "Unity 2022",        "note": "Основной движок: RKM, KLITTER, Chain и все джемы"},
    {"name": "Unreal Engine",     "note": "Platform Anomaly и Void Raid"},
    {"name": "C#",                "note": "Геймплей и системы на Unity"},
    {"name": "3D-моделирование",  "note": "Мирон и Игорь"},
    {"name": "Геймдизайн",        "note": "Николай"},
    {"name": "Кооп и мультиплеер","note": "Platform Anomaly, Void Raid, Chain"}
  ]'::jsonb,
  updated_at = now()
where id = 1;

-- ── участники ──────────────────────────────────
insert into public.members (slug, name, role, sort) values
  ('miron',   'Мирон Кондрашов',  'Программист · 3D-моделлер', 1),
  ('nikolay', 'Николай Савченко', 'Геймдизайнер',              2),
  ('igor',    'Игорь Пищулев',    'Программист · 3D-моделлер', 3)
on conflict (slug) do update set name = excluded.name, role = excluded.role, sort = excluded.sort;

-- ── проекты ────────────────────────────────────
-- status: done = Релиз, soon = Скоро в Steam, wip = В разработке, jam = Геймджем
insert into public.projects (slug, title, summary, description, cover_url, year, status, url, links, tags, sort) values

('simulator-rkm', 'Simulator RKM',
 'Суровые будни службы по надзору за контентом. Наш первый релиз в Steam.',
 E'Погрузитесь в суровые работы в РКМ. Вступите в ряды сотрудников службы по надзору и почувствуйте на себе всю ответственность (и абсурдность) работы по фильтрации контента.\n\nВышла в Steam 22 октября 2025 года.',
 'https://cdn.akamai.steamstatic.com/steam/apps/3732390/library_hero.jpg', 2025, 'done',
 'https://store.steampowered.com/app/3732390/Simulator_RKM/',
 '[{"label":"Steam","url":"https://store.steampowered.com/app/3732390/Simulator_RKM/"},{"label":"GitHub","url":"https://github.com/Extelder/RKM---REJU-KOMMUNISTOV-MYJIKOV"}]',
 '{"Unity 2022","Симулятор"}', 1),

('void-raid', 'Void Raid',
 'Кооперативный космический хоррор: рейды по заброшенным кораблям, пока не кончился кислород.',
 E'Кооперативный космический хоррор о рейдах по заброшенным кораблям: вскрывайте отсеки, хватайте добычу и успевайте вернуться на свой корабль до того, как закончится кислород — или до того, как нечто, скрывающееся во тьме, доберётся до вас.\n\nРелиз в Steam — 4 квартал 2026.',
 'https://cdn.akamai.steamstatic.com/steam/apps/3961850/library_hero.jpg', 2026, 'soon',
 'https://store.steampowered.com/app/3961850/Void_Raid/',
 '[{"label":"Steam","url":"https://store.steampowered.com/app/3961850/Void_Raid/"}]',
 '{"Unreal Engine","Кооп","Хоррор"}', 2),

('platform-anomaly', 'Platform Anomaly',
 'Кооперативный хоррор: ищите аномалии с друзьями — или прячьте их сами.',
 E'Platform Anomaly — кооперативный хоррор, где вы с друзьями ищете аномалии или сами прячете их, наблюдая за поисками. Страшно и весело одновременно!\n\nРелиз в Steam — 13 января 2027.',
 'https://cdn.akamai.steamstatic.com/steam/apps/3981970/library_hero.jpg', 2027, 'soon',
 'https://store.steampowered.com/app/3981970/Platform_Anomaly/',
 '[{"label":"Steam","url":"https://store.steampowered.com/app/3981970/Platform_Anomaly/"}]',
 '{"Unreal Engine","Кооп","Хоррор"}', 3),

('klitter', 'KLITTER',
 'Арена-экшен в стиле glitchcore: двигайся в ритме — или умри.',
 E'KLITTER соединяет точность аренных боёв, хаос glitchcore и поток динамичного бравлера, построенного на движении. Каждый рывок, каждый выстрел, каждое убийство задают твой ритм: остановишься — умрёшь, войдёшь в идеальный поток — и система рухнет.\n\nPURE FLOW. ZERO MERCY.\n\nРелиз в Steam — 1 квартал 2027.',
 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/4145970/faf5cd8c81c8289240498629554191b4857de688/header.jpg', 2027, 'soon',
 'https://store.steampowered.com/app/4145970/KLITTER/',
 '[{"label":"Steam","url":"https://store.steampowered.com/app/4145970/KLITTER/"}]',
 '{"Unity 2022","Экшен","Арена"}', 4),

('chain', 'Chain',
 'Кооперативный roguelike-шутер на 1–4 игроков. Вечная ночь, остров и три метра цепи.',
 E'Солнце исчезло. Никто его не ищет.\n\nCHAIN — кооперативный roguelike-шутер на 1–4 игроков на процедурно генерируемом острове, где всегда ночь, луна ходит по расписанию, и это расписание не сулит ничего хорошего. В правой руке — пушка, в левой — три метра цепи.\n\nРывки, подкаты, удары о землю и прыжки от стен: двигайся — или ночь тебя сожрёт.\n\nСтраница в Steam скоро. Демо уже на itch.io.',
 'https://img.itch.zone/aW1nLzI5MDU2MTAwLnBuZw==/original/xp%2FvFe.png', 2026, 'wip',
 'https://nikolaytapchenko.itch.io/chain',
 '[{"label":"Демо на itch.io","url":"https://nikolaytapchenko.itch.io/chain"}]',
 '{"Unity 2022","Кооп","Roguelike"}', 5),

('enjoy-your-coffee', 'Enjoy your coffee',
 'Кофейная рулетка: собеседование в кофейню, где часть чашек отравлена.',
 E'Самое странное собеседование в твоей жизни. Ты пришёл устроиться в кофейню, а вместо интервью оказался в подсобке напротив кружки с черепом. Она предлагает игру: перед вами чашки кофе, и некоторые из них отравлены.\n\nКаждый раунд ты знаешь, сколько чашек с ядом, но не знаешь каких. Пей сам или заставь пить соперника. Цель — чтобы весь яд выпил он.\n\nСделано на геймджеме Mini Jam 204: Café.',
 'https://img.itch.zone/aW1nLzI1NjA4MTI1LnBuZw==/original/hduLkM.png', null, 'jam',
 'https://nikolaytapchenko.itch.io/enjoy-your-cofee',
 '[{"label":"Играть на itch.io","url":"https://nikolaytapchenko.itch.io/enjoy-your-cofee"},{"label":"GitHub","url":"https://github.com/Extelder/Enjoy-your-coffee"}]',
 '{"Unity 2022","Хоррор","Mini Jam 204"}', 6),

('hattravel', 'HaTTravel',
 'Небольшое immersive-приключение с путешествиями во времени — в духе Gloomwood и Dishonored.',
 E'Небольшое immersive-приключение с путешествиями во времени и кражами — в духе Gloomwood и Dishonored.\n\nСделано на геймджеме Mini Jame Gam #38.',
 'https://img.itch.zone/aW1nLzE5MzczMjM3LmpwZw==/original/Ap4bs%2B.jpg', null, 'jam',
 'https://nikolaytapchenko.itch.io/hatman',
 '[{"label":"Играть на itch.io","url":"https://nikolaytapchenko.itch.io/hatman"}]',
 '{"Unity 2022","Immersive sim","Mini Jame Gam #38"}', 7),

('vo-neyrona', 'Во НейРона',
 'Игрушка про тотальную «отмену» всего — даже погрузки ящиков.',
 E'Игрушка про тотальную «отмену» всего, даже такой вещи, как погрузка ящиков.\n\nСделано на геймджеме Barhat Jam.',
 'https://img.itch.zone/aW1nLzE5MjY3NDEzLmpwZw==/original/%2BgW9QC.jpg', null, 'jam',
 'https://nikolaytapchenko.itch.io/voneyrona',
 '[{"label":"Играть на itch.io","url":"https://nikolaytapchenko.itch.io/voneyrona"}]',
 '{"Unity 2022","Физика","Barhat Jam"}', 8),

('not-clickbait', 'Not Clickbait',
 'Очистите свой компьютер от вредоносной программы — через три мини-игры.',
 E'Игра состоит из трёх мини-игр: проходя их, игрок получает кусочки пароля для разблокировки компьютера.\n\nВ первой нужно ловить падающие буквы и собрать пароль. Во второй — разбивать летящие слова: синие выстрелом, красные кулаком. А ещё есть секретная третья мини-игра.\n\nСделано на геймджеме в рамках Всероссийского конкурса «Начни игру».',
 'https://img.itch.zone/aW1nLzEzNTkyNTQwLnBuZw==/original/Dsvjwp.png', null, 'jam',
 'https://dvdglnv.itch.io/not-clickbait',
 '[{"label":"Играть на itch.io","url":"https://dvdglnv.itch.io/not-clickbait"}]',
 '{"Unity 2022","Мини-игры","«Начни игру»"}', 9)

on conflict (slug) do update set
  title = excluded.title, summary = excluded.summary, description = excluded.description,
  cover_url = excluded.cover_url, year = excluded.year, status = excluded.status,
  url = excluded.url, links = excluded.links, tags = excluded.tags, sort = excluded.sort;

-- ── все работали над всеми проектами ───────────
insert into public.project_members (project_id, member_id)
select p.id, m.id
from public.projects p
cross join public.members m
where p.slug in ('simulator-rkm','void-raid','platform-anomaly','klitter','chain','enjoy-your-coffee','hattravel','vo-neyrona','not-clickbait')
  and m.slug in ('miron','nikolay','igor')
on conflict do nothing;
