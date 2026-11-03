create table if not exists public.client_activation_tokens (
  client_id text primary key references public.clients(id) on delete cascade,
  token_hash text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.client_activation_tokens enable row level security;
revoke all on public.client_activation_tokens from anon, authenticated;
alter table public.clients add column if not exists auth_login text;
update public.clients set auth_login = lower(id) where auth_login is null;
create unique index if not exists clients_auth_login_idx on public.clients(auth_login) where auth_login is not null;

create or replace function public.link_client_auth_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.clients set auth_user_id = new.id
  where auth_login = split_part(new.email, '@', 1) and auth_user_id is null;
  return new;
end; $$;

drop trigger if exists link_client_auth_user on auth.users;
create trigger link_client_auth_user after insert on auth.users
for each row execute function public.link_client_auth_user();
