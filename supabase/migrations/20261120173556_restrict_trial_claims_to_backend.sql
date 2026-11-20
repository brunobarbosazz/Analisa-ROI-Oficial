drop policy if exists trial_claims_service_role_all on public.trial_claims;
create policy trial_claims_service_role_all on public.trial_claims
  for all to service_role using (true) with check (true);
