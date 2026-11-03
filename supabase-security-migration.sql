-- Security migration. Apply this in Supabase SQL Editor after creating an
-- administrator account in Supabase Auth. Do not run until the app has been
-- migrated to Auth-backed sessions, because the old UI has no DB identity.

alter table public.clients
  add column if not exists auth_user_id uuid references auth.users(id) on delete cascade;
alter table public.clients add column if not exists email text;
create unique index if not exists clients_email_lower_idx on public.clients (lower(email)) where email is not null;

-- Passwords must not be stored in this table. Migrate existing users to
-- Supabase Auth before dropping the legacy column.
comment on column public.clients.password is 'DEPRECATED: migrate to Supabase Auth, then drop this column';

alter table public.clients enable row level security;

drop policy if exists "Allow public read access" on public.clients;
drop policy if exists "Allow public insert access" on public.clients;
drop policy if exists "Allow public update access" on public.clients;

-- Clients may read only their own record. Administrators are granted access by
-- membership in app_admins, which must be created in a separate protected table.
create table if not exists public.app_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.app_admins enable row level security;

create or replace function public.is_app_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.app_admins where user_id = auth.uid());
$$;

revoke all on function public.is_app_admin() from public;
grant execute on function public.is_app_admin() to authenticated;

-- Link a newly confirmed Auth account to its pre-registered client record.
create or replace function public.link_client_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.clients
  set auth_user_id = new.id
  where lower(email) = lower(new.email)
    and auth_user_id is null;
  return new;
end;
$$;

drop trigger if exists link_client_auth_user on auth.users;
create trigger link_client_auth_user
  after insert on auth.users
  for each row execute function public.link_client_auth_user();

create policy "clients read own record" on public.clients
  for select to authenticated
  using (auth.uid() = auth_user_id or public.is_app_admin());

create policy "admins insert clients" on public.clients
  for insert to authenticated
  with check (public.is_app_admin());

create policy "admins update clients" on public.clients
  for update to authenticated
  using (public.is_app_admin())
  with check (public.is_app_admin());

create policy "admins delete clients" on public.clients
  for delete to authenticated
  using (public.is_app_admin());

-- Never expose the admin membership table to ordinary users.
revoke all on public.app_admins from anon, authenticated;
