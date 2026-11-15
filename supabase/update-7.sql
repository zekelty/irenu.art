-- irenu.art — обновление №7: тесты из репозитория (папка me/tests) сами попадают в /me
-- Запуск один раз: Supabase → SQL Editor → New query → вставить → Run. Можно запускать повторно.
-- source_key = имя файла теста в репозитории; у тестов, созданных в приложении руками, он пустой. // 23

alter table public.me_tests add column if not exists source_key text;

create unique index if not exists me_tests_owner_source_key
  on public.me_tests (owner, source_key)
  where source_key is not null;
