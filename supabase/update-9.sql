create table if not exists public.me_day_entries (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  date date not null,
  note text not null check (char_length(btrim(note)) between 1 and 4000),
  summary jsonb not null check (jsonb_typeof(summary) = 'object'),
  created_at timestamptz not null default now()
);

create index if not exists me_day_entries_owner_date
  on public.me_day_entries (owner, date desc, created_at desc, id desc);

alter table public.me_day_entries enable row level security;
revoke all on public.me_day_entries from anon, authenticated;
grant select, insert on public.me_day_entries to authenticated;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'me_day_entries' and policyname = 'read own day entries') then
    create policy "read own day entries" on public.me_day_entries for select to authenticated
      using (owner = (select auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'me_day_entries' and policyname = 'add own day entries') then
    create policy "add own day entries" on public.me_day_entries for insert to authenticated
      with check (owner = (select auth.uid()));
  end if;
end $$;
