create table if not exists clients (
  id text primary key,
  name text not null,
  address text,
  plan numeric,
  phone text,
  install_date text,
  due_date text,
  status text,
  password text,
  payments jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

alter table clients enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'clients' and policyname = 'Allow public read access'
  ) then
    create policy "Allow public read access" on clients for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'clients' and policyname = 'Allow public insert access'
  ) then
    create policy "Allow public insert access" on clients for insert with check (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'clients' and policyname = 'Allow public update access'
  ) then
    create policy "Allow public update access" on clients for update using (true) with check (true);
  end if;
end
$$;
