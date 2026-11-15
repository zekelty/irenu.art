-- irenu.art — обновление №4: текст «Кто мы», стек у каждого участника, роль Николая
-- Запуск: Supabase → SQL Editor → New query → вставить весь файл → Run. Можно запускать повторно.
-- // 23

alter table public.members add column if not exists stack text[] not null default '{}';

update public.site
set about = 'Мы — IRENU. Инди-команда, состоящая из трёх разработчиков: живём в одном городе и вместе делаем игры. Стремимся к созданию хороших игр!!!',
    updated_at = now()
where id = 1;

update public.members set
  role  = 'Программист · 3D-моделлер',
  stack = '{"Unity 2022","Unreal Engine","C#","3D-моделирование"}'
where slug = 'miron';

update public.members set
  role  = 'Геймдизайнер · программист',
  stack = '{"Unity 2022","Unreal Engine","C#","Геймдизайн"}'
where slug = 'nikolay';

update public.members set
  role  = 'Программист · 3D-моделлер',
  stack = '{"Unity 2022","C#","3D-моделирование"}'
where slug = 'igor';
