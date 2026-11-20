# Supabase Auth and server-side Trial

## Runtime configuration

Copy `.env.example` to the ignored `.env.local` for local development. Keep `DEMO_MODE=true` for the demo, or set `DEMO_MODE=false` with a Supabase project URL, publishable key, and exact app origin to exercise authentication.

The application uses only `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` at runtime. Do not place a Supabase secret/service-role key in this project. Supabase project-management credentials belong in the connected Supabase tool; Vercel environment values belong in the Vercel project settings.

## Trial rules

1. Supabase Auth inserts a user.
2. The database trigger creates the profile, records the one-time trial claim, and creates a `trialing` subscription with exactly seven days between `trial_started_at` and `trial_ends_at`.
3. The server validates the Auth user and reads that user's subscription with their JWT and RLS.
4. Every private dashboard request is checked against database timestamps. Expired access redirects to `/plans`; unavailable entitlement fails closed and the dashboard HTML is not sent.
5. The browser refreshes the displayed remaining days from the session endpoint once per minute. This is presentation only; the server-side route/API checks remain authoritative.

Email uniqueness and confirmation, plus Supabase Auth's rate limits, are the current proportional anti-abuse controls. The app does not fingerprint devices or collect IP-derived identity. A person using another email can still request a distinct trial; stronger abuse prevention needs an explicit privacy and product policy.

## Supabase project setup still required

The applied schema is described by `supabase/bootstrap.sql`; `supabase/migrations/` mirrors its three applied migrations. All six application tables have RLS. Backend-only `trial_claims` and webhook events have service-role-only policies, while user reads are scoped to their own rows. The Supabase CLI is not installed or linked in this checkout, so verify migration history after linking before using `db push`.

Before enabling SaaS mode for real users, configure these Auth settings in the Supabase project:

- Set Site URL to the application origin.
- Allow the exact `/auth/confirm` redirect for each environment.
- Change the Confirm Signup email template to link to `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`.
- Change the Password Recovery email template to link to `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password`.
- Configure production SMTP and test email confirmation and password recovery end to end.

The local HTML callback verifies the token hash on the server and stores the returned session in HttpOnly cookies. Do not switch templates to return access tokens in URL fragments.

## Current subscription boundary

- Monthly prices use the existing reference catalog (R$ 47, R$ 97, R$ 247). Annual prices remain `NULL` until commercial values are approved.
- The dashboard does not expose a client-side way to grant paid access.
- No payment gateway is configured; plan buttons are disabled and a successful checkout cannot be assumed.
- Payment event schema is prepared, but signed webhook handling, idempotent plan activation, cancellation, refunds, and reconciliation remain pending.
- Admin account analytics and admin-role authorization remain pending; no user metadata is trusted for authorization.

## Local and Vercel behavior

- Local Node development remains a demo by default.
- Production mode without valid Supabase settings returns no protected dashboard content.
- The Vercel project `analisa-roi-oficial` has `DEMO_MODE=false`, `SUPABASE_URL`, and encrypted `SUPABASE_PUBLISHABLE_KEY` in Development/Preview/Production. Production `APP_ORIGIN` is `https://analisa-roi-oficial.vercel.app`. The local `.env.example` still keeps demo mode enabled.
- A production deployment is READY at `https://analisa-roi-oficial.vercel.app`. It predates the environment variables above, so a new deployment is required before those values take effect in the running functions.
- Configure the Supabase Site URL and confirmation redirect allowlist before testing email confirmation. Preview origins also need to be allowed. The current Vercel protection applies SSO to the default domain; public access requires a custom domain or a deliberate protection change.
