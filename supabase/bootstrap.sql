-- Nemofy SaaS foundation for a fresh project.
-- This file intentionally contains no credentials or service-role key.

begin;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to service_role;

create table if not exists public.plans (
  id text primary key,
  name text not null,
  price_monthly_brl numeric(10,2),
  price_annual_brl numeric(10,2),
  is_public boolean not null default false,
  limits jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint plans_monthly_price_nonnegative check (price_monthly_brl is null or price_monthly_brl >= 0),
  constraint plans_annual_price_nonnegative check (price_annual_brl is null or price_annual_brl >= 0)
);

insert into public.plans (id, name, price_monthly_brl, price_annual_brl, is_public, limits)
values
  ('trial', 'Trial', null, null, false, '{"ad_accounts":5,"pixels":5,"dashboards":5,"webhooks":5,"automation_rules":7}'::jsonb),
  ('basic', 'Basic', 47.00, null, true, '{"ad_accounts":2,"pixels":2,"dashboards":1,"webhooks":1,"automation_rules":2}'::jsonb),
  ('pro', 'Pro', 97.00, null, true, '{"ad_accounts":5,"pixels":5,"dashboards":5,"webhooks":5,"automation_rules":7}'::jsonb),
  ('scale', 'Scale', 247.00, null, true, '{"ad_accounts":"unlimited","pixels":"unlimited","dashboards":"unlimited","webhooks":"unlimited","automation_rules":15}'::jsonb)
on conflict (id) do update set
  name = excluded.name,
  price_monthly_brl = excluded.price_monthly_brl,
  is_public = excluded.is_public,
  limits = excluded.limits;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_full_name_size check (char_length(full_name) <= 100)
);

create table if not exists public.trial_claims (
  user_id uuid primary key references auth.users(id) on delete cascade,
  claimed_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id text not null references public.plans(id),
  status text not null check (status in ('trialing','active','past_due','canceled','expired','incomplete')),
  billing_interval text check (billing_interval in ('month','year')),
  trial_started_at timestamptz,
  trial_ends_at timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  provider text,
  provider_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscriptions_trial_dates check (
    (status <> 'trialing' and trial_started_at is null and trial_ends_at is null)
    or (status = 'trialing' and trial_started_at is not null and trial_ends_at = trial_started_at + interval '7 days')
  ),
  constraint subscriptions_period_dates check (
    current_period_end is null or current_period_start is null or current_period_end > current_period_start
  ),
  constraint subscriptions_provider_pair check (
    (provider is null and provider_subscription_id is null)
    or (provider is not null and provider_subscription_id is not null)
  )
);

create unique index if not exists subscriptions_provider_ref_idx
  on public.subscriptions (provider, provider_subscription_id)
  where provider_subscription_id is not null;
create unique index if not exists subscriptions_one_access_record_per_user_idx
  on public.subscriptions (user_id)
  where status in ('trialing','active','past_due');
create index if not exists subscriptions_user_created_idx
  on public.subscriptions (user_id, created_at desc);
create index if not exists subscriptions_plan_id_idx
  on public.subscriptions (plan_id);

create table if not exists public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  plan_id text not null references public.plans(id),
  provider text not null,
  provider_payment_id text not null,
  amount_brl numeric(10,2) not null check (amount_brl >= 0),
  currency text not null default 'BRL' check (currency = 'BRL'),
  status text not null check (status in ('pending','paid','failed','refunded','chargeback')),
  occurred_at timestamptz,
  created_at timestamptz not null default now(),
  unique (provider, provider_payment_id)
);
create index if not exists payment_transactions_user_created_idx
  on public.payment_transactions (user_id, created_at desc);
create index if not exists payment_transactions_subscription_id_idx
  on public.payment_transactions (subscription_id);
create index if not exists payment_transactions_plan_id_idx
  on public.payment_transactions (plan_id);

create table if not exists private.billing_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_event_id text not null,
  event_type text not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  processing_status text not null default 'received' check (processing_status in ('received','processed','failed')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  unique (provider, provider_event_id)
);

alter table public.plans enable row level security;
alter table public.profiles enable row level security;
alter table public.trial_claims enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payment_transactions enable row level security;
alter table private.billing_webhook_events enable row level security;

revoke all on table public.plans, public.profiles, public.trial_claims, public.subscriptions, public.payment_transactions from anon, authenticated;
grant select on table public.plans to anon, authenticated;
grant select on table public.profiles, public.subscriptions, public.payment_transactions to authenticated;
grant update (full_name) on table public.profiles to authenticated;
grant all on table public.plans, public.profiles, public.trial_claims, public.subscriptions, public.payment_transactions to service_role;
grant all on table private.billing_webhook_events to service_role;

drop policy if exists billing_webhook_events_service_role_all on private.billing_webhook_events;
create policy billing_webhook_events_service_role_all on private.billing_webhook_events
  for all to service_role using (true) with check (true);

drop policy if exists plans_public_select on public.plans;
create policy plans_public_select on public.plans
  for select to anon, authenticated using (is_public);

drop policy if exists profiles_select_self on public.profiles;
create policy profiles_select_self on public.profiles
  for select to authenticated using ((select auth.uid()) is not null and user_id = (select auth.uid()));
drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update to authenticated
  using ((select auth.uid()) is not null and user_id = (select auth.uid()))
  with check ((select auth.uid()) is not null and user_id = (select auth.uid()));

drop policy if exists trial_claims_service_role_all on public.trial_claims;
create policy trial_claims_service_role_all on public.trial_claims
  for all to service_role using (true) with check (true);

drop policy if exists subscriptions_select_self on public.subscriptions;
create policy subscriptions_select_self on public.subscriptions
  for select to authenticated using ((select auth.uid()) is not null and user_id = (select auth.uid()));

drop policy if exists payment_transactions_select_self on public.payment_transactions;
create policy payment_transactions_select_self on public.payment_transactions
  for select to authenticated using ((select auth.uid()) is not null and user_id = (select auth.uid()));

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
revoke all on function private.set_updated_at() from public, anon, authenticated;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function private.set_updated_at();
drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at before update on public.subscriptions
  for each row execute function private.set_updated_at();

create or replace function private.create_profile_and_trial()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  claim_user_id uuid;
  display_name text;
  trial_start timestamptz := now();
begin
  display_name := left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 100);
  insert into public.profiles (user_id, full_name)
  values (new.id, display_name)
  on conflict (user_id) do nothing;

  insert into public.trial_claims (user_id)
  values (new.id)
  on conflict (user_id) do nothing
  returning user_id into claim_user_id;

  if claim_user_id is not null then
    insert into public.subscriptions (
      user_id, plan_id, status, trial_started_at, trial_ends_at
    ) values (
      new.id, 'trial', 'trialing', trial_start, trial_start + interval '7 days'
    );
  end if;
  return new;
end;
$$;
revoke all on function private.create_profile_and_trial() from public, anon, authenticated;

drop trigger if exists on_auth_user_created_analisa_roi on auth.users;
create trigger on_auth_user_created_analisa_roi
  after insert on auth.users
  for each row execute function private.create_profile_and_trial();

commit;
