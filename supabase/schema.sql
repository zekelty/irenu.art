-- irenu.art — схема базы для Supabase
-- Запуск: Supabase Dashboard → SQL Editor → New query → вставить весь файл → Run.
-- Скрипт можно запускать повторно: он ничего не ломает и не дублирует.

-- ─────────────────────────────────────────────
-- Таблицы
-- ─────────────────────────────────────────────

-- Общая инфа о команде (одна строка, id = 1)
create table if not exists public.site (
  id         int primary key default 1 check (id = 1),
  name       text not null default 'irenu',
  tagline    text default '',
  about      text default '',
  contacts   jsonb not null default '[]'::jsonb,  -- [{ "label": "Telegram", "url": "https://t.me/..." }]
  updated_at timestamptz not null default now()
);
insert into public.site (id) values (1) on conflict (id) do nothing;

-- Участники
create table if not exists public.members (
  id         uuid primary key default gen_random_uuid(),
  slug       text unique not null,          -- для ссылки: irenu.art/#/member/<slug>
  name       text not null,
  role       text default '',
  bio        text default '',
  avatar_url text default '',
  links      jsonb not null default '[]'::jsonb,
  sort       int not null default 0,
  created_at timestamptz not null default now()
);

-- Проекты
create table if not exists public.projects (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,         -- irenu.art/#/project/<slug>
  title       text not null,
  summary     text default '',              -- одна строка для карточки
  description text default '',              -- полный текст
  cover_url   text default '',
  year        int,
  status      text default 'done',          -- done | wip | idea
  url         text default '',              -- ссылка на сам проект
  tags        text[] not null default '{}',
  sort        int not null default 0,
  created_at  timestamptz not null default now()
);

-- Кто участвовал в каком проекте
create table if not exists public.project_members (
  project_id uuid references public.projects(id) on delete cascade,
  member_id  uuid references public.members(id)  on delete cascade,
  primary key (project_id, member_id)
);

-- Кому можно редактировать (почты тех, кто логинится в админку)
create table if not exists public.editors (
  email text primary key
);

-- ─────────────────────────────────────────────
-- Права (RLS): читать могут все, писать — только редакторы
-- ─────────────────────────────────────────────

create or replace function public.is_editor() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.editors
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

alter table public.site            enable row level security;
alter table public.members         enable row level security;
alter table public.projects        enable row level security;
alter table public.project_members enable row level security;
alter table public.editors         enable row level security;

do $$
declare t text;
begin
  foreach t in array array['site','members','projects','project_members'] loop
    execute format('drop policy if exists "public read" on public.%I', t);
    execute format('create policy "public read" on public.%I for select using (true)', t);
    execute format('drop policy if exists "editors write" on public.%I', t);
    execute format('create policy "editors write" on public.%I for all to authenticated using (public.is_editor()) with check (public.is_editor())', t);
  end loop;
end $$;

-- editors: редактор видит список редакторов, менять — только через Dashboard
drop policy if exists "editors read" on public.editors;
create policy "editors read" on public.editors for select to authenticated using (public.is_editor());

-- ─────────────────────────────────────────────
-- Хранилище картинок (bucket "media", публичный на чтение)
-- ─────────────────────────────────────────────

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = true;

drop policy if exists "media editors insert" on storage.objects;
create policy "media editors insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'media' and public.is_editor());

drop policy if exists "media editors update" on storage.objects;
create policy "media editors update" on storage.objects
  for update to authenticated using (bucket_id = 'media' and public.is_editor());

drop policy if exists "media editors delete" on storage.objects;
create policy "media editors delete" on storage.objects
  for delete to authenticated using (bucket_id = 'media' and public.is_editor());

-- ─────────────────────────────────────────────
-- ВПИШИ СВОИ ПОЧТЫ (те же, с которыми заводишь юзеров в Authentication → Users)
-- ─────────────────────────────────────────────
-- insert into public.editors (email) values
--   ('you@example.com'),
--   ('friend@example.com')
-- on conflict do nothing;
