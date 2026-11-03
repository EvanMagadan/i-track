-- Provider isolation and activation abuse protection.
create table if not exists public.client_activation_rate_limits (
  rate_key text primary key,
  window_started_at timestamptz not null default now(),
  attempt_count integer not null default 0
);

create or replace function public.check_activation_rate_limit(rate_key text)
returns boolean language plpgsql security definer set search_path=public
as $$
declare current_row public.client_activation_rate_limits;
begin
  select * into current_row from public.client_activation_rate_limits where client_activation_rate_limits.rate_key=check_activation_rate_limit.rate_key for update;
  if current_row is null then
    insert into public.client_activation_rate_limits(rate_key,attempt_count) values(rate_key,1);
    return true;
  end if;
  if current_row.window_started_at < now()-interval '15 minutes' then
    update public.client_activation_rate_limits set window_started_at=now(),attempt_count=1 where client_activation_rate_limits.rate_key=check_activation_rate_limit.rate_key;
    return true;
  end if;
  if current_row.attempt_count >= 10 then return false; end if;
  update public.client_activation_rate_limits set attempt_count=attempt_count+1 where client_activation_rate_limits.rate_key=check_activation_rate_limit.rate_key;
  return true;
end $$;

revoke all on function public.check_activation_rate_limit(text) from public;
grant execute on function public.check_activation_rate_limit(text) to service_role;

drop policy if exists "organization clients read" on public.clients;
create policy "organization clients read" on public.clients for select to authenticated
  using (organization_id=public.current_organization_id());
