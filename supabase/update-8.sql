create table if not exists public.me_workouts (
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  session_id uuid not null,
  position smallint not null check (position between 0 and 19),
  date date not null,
  training_type text not null default '' check (char_length(training_type) <= 120),
  exercise text not null check (char_length(btrim(exercise)) between 1 and 120),
  sets smallint not null check (sets between 1 and 40),
  reps smallint not null check (reps between 1 and 500),
  weight_kg numeric check (weight_kg between 0 and 2000),
  rir smallint check (rir between 0 and 30),
  notes text not null default '' check (char_length(notes) <= 500),
  created_at timestamptz not null default now(),
  primary key (owner, session_id, position)
);

create index if not exists me_workouts_owner_date
  on public.me_workouts (owner, date desc, created_at desc);

alter table public.me_workouts enable row level security;
revoke all on public.me_workouts from anon, authenticated;
grant select, insert on public.me_workouts to authenticated;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'me_workouts' and policyname = 'read own workouts') then
    create policy "read own workouts" on public.me_workouts for select to authenticated
      using (owner = (select auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'me_workouts' and policyname = 'log own workouts') then
    create policy "log own workouts" on public.me_workouts for insert to authenticated
      with check (owner = (select auth.uid()));
  end if;
end $$;
