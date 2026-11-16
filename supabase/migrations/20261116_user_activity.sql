-- PaperProfit: real user-activity tracking + admin access control
-- Run once in Supabase → SQL Editor. Safe to re-run.

-- 1. Who is an admin (checked by the database, not by the browser)
create table if not exists public.app_admins (
  email text primary key
);
alter table public.app_admins enable row level security;
-- No policies: nobody can read/write this table through the API. Add admins only here in the SQL editor.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.app_admins a
    where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;
grant execute on function public.is_admin() to anon, authenticated;

-- 2. Activity events: session start, page view, search, presence ping
create table if not exists public.user_activity (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid(),
  email text,
  session_id text not null,
  event text not null check (event in ('session_start', 'page', 'search', 'ping', 'session_end')),
  page text,
  query text,
  user_agent text,
  created_at timestamptz not null default now()
);
create index if not exists user_activity_created_idx on public.user_activity (created_at desc);
create index if not exists user_activity_user_idx on public.user_activity (user_id, created_at desc);

alter table public.user_activity enable row level security;

drop policy if exists "users insert own activity" on public.user_activity;
create policy "users insert own activity" on public.user_activity
  for insert to authenticated
  with check (user_id = auth.uid() and lower(coalesce(email, '')) = lower(coalesce(auth.jwt() ->> 'email', '')));

drop policy if exists "admins read activity" on public.user_activity;
create policy "admins read activity" on public.user_activity
  for select to authenticated
  using (public.is_admin());

-- 3. Admins can read (not change) every user's portfolio size for the admin panel
drop policy if exists "admins read portfolios" on public.portfolios;
create policy "admins read portfolios" on public.portfolios for select to authenticated using (public.is_admin());
drop policy if exists "admins read stocks" on public.stocks;
create policy "admins read stocks" on public.stocks for select to authenticated using (public.is_admin());

-- 4. public.users is a VIEW over the login accounts and was readable by anyone with the public (anon) key.
--    Close it to the API; admins read it only through a function that checks is_admin().
revoke all on public.users from anon, authenticated;

create or replace function public.admin_list_users()
returns setof public.users
language sql
stable
security definer
set search_path = public
as $$
  select * from public.users where public.is_admin();
$$;
revoke all on function public.admin_list_users() from public, anon;
grant execute on function public.admin_list_users() to authenticated;

-- 5. Optional housekeeping: delete activity older than 90 days (run manually, or schedule with pg_cron)
-- delete from public.user_activity where created_at < now() - interval '90 days';

-- 6. LAST STEP — add your admin login email (the one you sign in to PaperProfit with):
-- insert into public.app_admins (email) values ('you@example.com') on conflict do nothing;
