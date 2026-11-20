# Architecture

## Runtime

- The product keeps the current Node.js and vanilla HTML/CSS/JS stack.
- `server.js` serves the local demo and exposes the small Auth API used when Supabase is configured.
- `api/` contains equivalent Vercel Node Functions; `vercel.json` routes private dashboard pages through the entitlement guard.
- `public/dashboard.html` is excluded from the Vercel static output and is returned only after a server-side session and subscription check.
- Browser demo records remain local-only. Supabase currently owns identity, profile, plan, trial, subscription, and payment-history foundations; operational campaign data has not migrated yet.

## Authorization boundary

- Development defaults to `DEMO_MODE=true` to preserve local demo behavior.
- Production defaults to SaaS mode. If Supabase Auth or the subscription table cannot be checked, protected routes fail closed.
- Supabase access and refresh tokens are kept in HttpOnly, SameSite cookies. The dashboard does not receive the publishable key or a service key.
- Authenticated access is not enough: every private page checks the subscription row in Postgres. A trial is valid only while its database `trial_ends_at` is later than server time; a paid subscription is valid only while `current_period_end` is later than server time.
- The auth-user trigger creates one profile and a seven-day trial at account creation. `trial_claims` prevents issuing a second trial to the same Auth user.
- Client roles cannot insert or update subscriptions or payment records. A payment provider has not been selected, so no checkout or payment activation is simulated.

## Database boundary

- `supabase/bootstrap.sql` describes the reviewed schema for a fresh project. `supabase/migrations/` mirrors the three migrations applied to the connected project; the CLI is not installed or linked in this checkout, so verify migration history after linking before using `db push`.
- Public tables use RLS and limited grants. `trial_claims` is backend-only; user-scoped profile, subscription, and payment reads are restricted to the authenticated user's rows. The private webhook-event table has RLS and a service-role-only policy, and the `private` schema is not exposed through the Data API.
- No service-role key is used by this app runtime. Signed payment webhook handling still requires a server-side provider implementation.

## Vercel

- `npm run build` writes the landing page and static assets to `dist/`.
- The dashboard HTML shell is kept out of `dist/`; `/dashboard` and related routes reach `api/app.js` and are served only after entitlement validation.
- Vercel environment variables must be configured separately for Development, Preview, and Production. `APP_ORIGIN` must match the deployed origin for each environment.
