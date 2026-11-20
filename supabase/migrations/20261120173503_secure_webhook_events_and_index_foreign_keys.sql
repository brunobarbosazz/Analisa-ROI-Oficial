alter table private.billing_webhook_events enable row level security;

drop policy if exists billing_webhook_events_service_role_all on private.billing_webhook_events;
create policy billing_webhook_events_service_role_all on private.billing_webhook_events
  for all to service_role using (true) with check (true);

create index if not exists subscriptions_plan_id_idx
  on public.subscriptions (plan_id);
create index if not exists payment_transactions_subscription_id_idx
  on public.payment_transactions (subscription_id);
create index if not exists payment_transactions_plan_id_idx
  on public.payment_transactions (plan_id);
