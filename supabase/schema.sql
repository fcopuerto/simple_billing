-- Run this in Supabase SQL editor

create table clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  hourly_rate numeric(10,2) not null,
  created_at timestamptz default now()
);

create table work_entries (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  description text not null,
  hours numeric(5,2) not null,
  created_at timestamptz default now()
);

-- RLS
alter table clients enable row level security;
alter table work_entries enable row level security;

create policy "users can manage own clients" on clients
  for all using (auth.uid() = user_id);

create policy "users can manage own work_entries" on work_entries
  for all using (auth.uid() = user_id);
