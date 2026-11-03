-- Multi-tenant provider model. Run after the security and admin-role migrations.
create extension if not exists pgcrypto;
create table if not exists public.organizations (id uuid primary key default gen_random_uuid(), name text not null, slug text not null unique, created_by uuid not null references auth.users(id) on delete restrict, created_at timestamptz not null default now());
create table if not exists public.organization_members (organization_id uuid not null references public.organizations(id) on delete cascade, user_id uuid not null references auth.users(id) on delete cascade, role text not null default 'owner' check (role in ('owner','admin','billing','support')), created_at timestamptz not null default now(), primary key (organization_id,user_id));
alter table public.clients add column if not exists organization_id uuid references public.organizations(id) on delete cascade;
do $$
declare owner_id uuid; org_id uuid;
begin
  select user_id into owner_id from public.app_admins order by created_at limit 1;
  if owner_id is not null and not exists (select 1 from public.organizations) then
    insert into public.organizations (name,slug,created_by) values ('I-Track','i-track',owner_id) returning id into org_id;
    insert into public.organization_members (organization_id,user_id,role) values (org_id,owner_id,'owner');
    update public.clients set organization_id=org_id where organization_id is null;
  end if;
end $$;
create or replace function public.current_organization_id() returns uuid language sql stable security definer set search_path=public as 'select organization_id from public.organization_members where user_id=auth.uid() order by created_at limit 1';
create or replace function public.current_organization_role() returns text language sql stable security definer set search_path=public as 'select role from public.organization_members where user_id=auth.uid() and organization_id=public.current_organization_id() limit 1';
create or replace function public.handle_new_provider() returns trigger language plpgsql security definer set search_path=public as $$
declare org_id uuid; org_name text;
begin
  if coalesce((new.raw_user_meta_data->>'provider_signup')::boolean,false) is not true then return new; end if;
  org_name:=coalesce(new.raw_user_meta_data->>'organization_name',split_part(coalesce(new.email,'provider'),'@',1));
  insert into public.organizations(name,slug,created_by) values (org_name,lower(regexp_replace(org_name||'-'||substr(new.id::text,1,8),'[^a-zA-Z0-9]+','-','g')),new.id) returning id into org_id;
  insert into public.organization_members(organization_id,user_id,role) values(org_id,new.id,'owner');
  return new;
end $$;
drop trigger if exists on_auth_user_provider_created on auth.users;
create trigger on_auth_user_provider_created after insert on auth.users for each row execute procedure public.handle_new_provider();
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
drop policy if exists "assigned clients read" on public.clients;
drop policy if exists "owners and admins insert" on public.clients;
drop policy if exists "assigned clients update" on public.clients;
drop policy if exists "owners delete clients" on public.clients;
create policy "organization clients read" on public.clients for select to authenticated using (organization_id=public.current_organization_id() or public.can_access_client(id));
create policy "organization admins insert" on public.clients for insert to authenticated with check (organization_id=public.current_organization_id() and public.current_organization_role() in ('owner','admin'));
create policy "organization members update" on public.clients for update to authenticated using (organization_id=public.current_organization_id() and public.current_organization_role() in ('owner','admin','billing')) with check (organization_id=public.current_organization_id());
create policy "organization owners delete" on public.clients for delete to authenticated using (organization_id=public.current_organization_id() and public.current_organization_role()='owner');
grant execute on function public.current_organization_id() to authenticated;
grant execute on function public.current_organization_role() to authenticated;
