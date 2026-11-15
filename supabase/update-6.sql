-- irenu.art — обновление №6: личный раздел /me (доски и тесты)
-- Запуск: Supabase → SQL Editor → New query → вставить весь файл → Run. Можно запускать повторно.
-- Каждый видит и меняет ТОЛЬКО свои записи (owner = тот, кто вошёл). // 23

-- Доски в стиле Trello: колонки и карточки лежат внутри data (JSON)
create table if not exists public.me_boards (
  id         uuid primary key default gen_random_uuid(),
  owner      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title      text not null default 'Доска',
  data       jsonb not null default '{"columns": []}'::jsonb,
  sort       int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Тесты: вопросы хранятся текстом в простом формате (? вопрос / + верно / - неверно / ! пояснение)
create table if not exists public.me_tests (
  id          uuid primary key default gen_random_uuid(),
  owner       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title       text not null default 'Тест',
  description text not null default '',
  source      text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Попытки прохождения
create table if not exists public.me_attempts (
  id         uuid primary key default gen_random_uuid(),
  owner      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  test_id    uuid not null references public.me_tests(id) on delete cascade,
  score      int not null,
  total      int not null,
  created_at timestamptz not null default now()
);

alter table public.me_boards   enable row level security;
alter table public.me_tests    enable row level security;
alter table public.me_attempts enable row level security;

do $$
declare t text;
begin
  foreach t in array array['me_boards','me_tests','me_attempts'] loop
    execute format('drop policy if exists "own rows" on public.%I', t);
    execute format('create policy "own rows" on public.%I for all to authenticated using (owner = auth.uid()) with check (owner = auth.uid())', t);
  end loop;
end $$;
