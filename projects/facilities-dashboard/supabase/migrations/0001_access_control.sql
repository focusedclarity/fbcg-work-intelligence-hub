-- =====================================================================
-- Department-gated dashboard access control (Model A)
-- One Supabase project, many dashboards; each user sees only their
-- department's dashboards. Manual roles table to start (swap to Entra-group
-- auto-mapping later by populating profiles.department from a sign-in hook).
-- =====================================================================

-- ---- tables ---------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  full_name   text,
  department  text,                        -- e.g. 'Facilities','Finance'; an admin sets this
  role        text not null default 'member' check (role in ('member','admin')),
  created_at  timestamptz not null default now()
);

create table if not exists public.dashboards (
  key         text primary key,            -- 'facilities','finance' — used in the route/URL
  name        text not null,
  department  text not null,               -- department allowed to see this dashboard
  sheet_id    text not null,               -- Smartsheet sheet id this dashboard reads
  created_at  timestamptz not null default now()
);

-- optional per-user exceptions (grant one user a dashboard outside their dept)
create table if not exists public.user_dashboard_grants (
  user_id       uuid references auth.users(id) on delete cascade,
  dashboard_key text references public.dashboards(key) on delete cascade,
  primary key (user_id, dashboard_key)
);

-- ---- helper functions (SECURITY DEFINER = bypass RLS, avoid recursion) ----
create or replace function public.is_admin(uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = uid and role = 'admin');
$$;

create or replace function public.can_access_dashboard(uid uuid, dkey text)
returns boolean language sql stable security definer set search_path = public as $$
  select
    exists (
      select 1 from public.profiles p
      join public.dashboards d on d.key = dkey
      where p.id = uid and (p.role = 'admin' or p.department = d.department)
    )
    or exists (
      select 1 from public.user_dashboard_grants g
      where g.user_id = uid and g.dashboard_key = dkey
    );
$$;

-- ---- auto-create a profile row on signup ---------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email,
          coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'))
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---- row-level security --------------------------------------------
alter table public.profiles              enable row level security;
alter table public.dashboards            enable row level security;
alter table public.user_dashboard_grants enable row level security;

-- a user reads their own profile; admins read all
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select
  using (id = auth.uid() or public.is_admin(auth.uid()));

-- a user reads only the dashboard catalog entries they may access
drop policy if exists dashboards_read on public.dashboards;
create policy dashboards_read on public.dashboards for select
  using (public.can_access_dashboard(auth.uid(), key));

-- a user reads their own grants; admins read all
drop policy if exists grants_read on public.user_dashboard_grants;
create policy grants_read on public.user_dashboard_grants for select
  using (user_id = auth.uid() or public.is_admin(auth.uid()));

-- (writes to these tables are done by an admin via the service role / SQL editor,
--  which bypasses RLS — no write policies are granted to end users.)

-- ---- seed the first dashboard --------------------------------------
insert into public.dashboards (key, name, department, sheet_id)
values ('facilities', 'Facilities Inspection Dashboard', 'Facilities', '8519533426855812')
on conflict (key) do nothing;

-- =====================================================================
-- AFTER SIGN-IN, an admin assigns departments, e.g.:
--   update public.profiles set department = 'Facilities' where email = 'someone@fbcglenarden.org';
--   update public.profiles set role = 'admin'            where email = 'gthomas@fbcglenarden.org';
-- Add another dashboard later:
--   insert into public.dashboards(key,name,department,sheet_id)
--   values ('finance','Finance Dashboard','Finance','<sheet id>');
-- =====================================================================
