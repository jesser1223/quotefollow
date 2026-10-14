-- QuoteFollow: quotes table + Row Level Security
-- Run this in the Supabase SQL Editor after creating your project.

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  customer_name text not null,
  customer_email text,
  customer_phone text,
  job_description text not null,
  amount numeric not null check (amount >= 0),
  date_sent date not null,
  next_follow_up date,
  notes text,
  status text not null default 'awaiting'
    check (status in ('awaiting', 'followup_needed', 'won', 'lost', 'follow_later')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.quotes enable row level security;

create policy "Users can select their own quotes"
  on public.quotes for select
  using (auth.uid() = user_id);

create policy "Users can insert their own quotes"
  on public.quotes for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own quotes"
  on public.quotes for update
  using (auth.uid() = user_id);

create policy "Users can delete their own quotes"
  on public.quotes for delete
  using (auth.uid() = user_id);

-- Optional: auto-update updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists quotes_set_updated_at on public.quotes;
create trigger quotes_set_updated_at
  before update on public.quotes
  for each row execute function public.set_updated_at();
