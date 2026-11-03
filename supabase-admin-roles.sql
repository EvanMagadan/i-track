-- Run after supabase-security-migration.sql when multiple administrators are ready.

create table if not exists public.admin_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin' check (role in ('owner', 'admin', 'billing', 'support')),
  display_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_client_assignments (
  admin_user_id uuid not null references auth.users(id) on delete cascade,
  client_id text not null references public.clients(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (admin_user_id, client_id)
);

alter table public.admin_profiles enable row level security;
alter table public.admin_client_assignments enable row level security;

create or replace function public.current_admin_role()
returns text
language sql stable security definer set search_path = public
as $$
  select coalesce(
    (select role from public.admin_profiles where user_id = auth.uid()),
    case when exists (select 1 from public.app_admins where user_id = auth.uid()) then 'owner' end
  );
$$;

create or replace function public.can_access_client(target_client_id text)
returns boolean
language sql stable security definer set search_path = public
as $$
  select public.current_admin_role() = 'owner'
    or exists (
      select 1 from public.admin_client_assignments
      where admin_user_id = auth.uid() and client_id = target_client_id
    )
    or exists (
      select 1 from public.clients
      where id = target_client_id and auth_user_id = auth.uid()
    );
$$;

revoke all on function public.current_admin_role() from public;
revoke all on function public.can_access_client(text) from public;
grant execute on function public.current_admin_role() to authenticated;
grant execute on function public.can_access_client(text) to authenticated;

drop policy if exists "clients read own record" on public.clients;
drop policy if exists "admins insert clients" on public.clients;
drop policy if exists "admins update clients" on public.clients;
drop policy if exists "admins delete clients" on public.clients;

create policy "assigned clients read" on public.clients for select to authenticated
  using (public.can_access_client(id));
create policy "owners and admins insert" on public.clients for insert to authenticated
  with check (public.current_admin_role() in ('owner', 'admin'));
create policy "assigned clients update" on public.clients for update to authenticated
  using (public.can_access_client(id) and public.current_admin_role() in ('owner', 'admin', 'billing'))
  with check (public.can_access_client(id));
create policy "owners delete clients" on public.clients for delete to authenticated
  using (public.current_admin_role() = 'owner');
