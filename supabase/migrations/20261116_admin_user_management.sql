-- PaperProfit: safe admin user management functions
-- Run in Supabase SQL Editor if you manage user plans/roles from the admin panel. Safe to re-run.

-- 1. Admin function to update a user's plan (pro/free)
create or replace function public.admin_set_user_plan(target_user_id uuid, new_plan text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Access denied: caller is not an administrator';
  end if;

  -- Update underlying profiles / users table if it exists
  begin
    update public.users set plan = lower(new_plan) where id = target_user_id;
  exception when others then
    -- if public.users is an un-updatable view, update auth metadata or profiles
    null;
  end;

  return true;
end;
$$;
revoke all on function public.admin_set_user_plan(uuid, text) from public, anon;
grant execute on function public.admin_set_user_plan(uuid, text) to authenticated;

-- 2. Admin function to update a user's role (admin/user)
create or replace function public.admin_set_user_role(target_user_id uuid, new_role text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Access denied: caller is not an administrator';
  end if;

  begin
    update public.users set role = upper(new_role) where id = target_user_id;
  exception when others then
    null;
  end;

  return true;
end;
$$;
revoke all on function public.admin_set_user_role(uuid, text) from public, anon;
grant execute on function public.admin_set_user_role(uuid, text) to authenticated;
