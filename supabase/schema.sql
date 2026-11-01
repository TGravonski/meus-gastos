-- Execute this script in Supabase Dashboard > SQL Editor.
create table if not exists public.transactions (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  description text not null default '',
  amount numeric(14,2) not null check (amount > 0),
  date date not null,
  type text not null check (type in ('despesa', 'receita')),
  category text not null,
  paid boolean not null default true,
  fixed boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists transactions_user_date_idx on public.transactions (user_id, date desc);

create table if not exists public.user_categories (
  user_id uuid primary key references auth.users(id) on delete cascade,
  categories jsonb not null default '{"despesa": [], "receita": []}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.transactions enable row level security;
alter table public.user_categories enable row level security;

create policy "Users manage their own transactions" on public.transactions
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage their own categories" on public.user_categories
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
