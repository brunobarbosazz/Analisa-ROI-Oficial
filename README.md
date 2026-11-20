# Nemofy

Nemofy landing page and local dashboard demo. The landing page is served at `/`; dashboard routes are served at `/dashboard`, `/campaigns`, `/sales`, `/visits`, `/rules`, `/integrations`, `/notifications`, `/account`, and `/settings`.

The local demo remains browser-only. Optional SaaS mode adds server-side Supabase Auth and seven-day trial enforcement. Operational campaign data and payment processing are still demonstrative; no ad accounts, checkout provider, or signed payment webhooks are connected.

## Run locally

Requires Node.js 20 or newer.

```powershell
npm run dev
```

The server prints its active URL when it starts. It prefers port 3000 and automatically tries the next available port if 3000 is occupied. Open the printed URL for the landing page and add `/dashboard` for the dashboard.

## Local state

Theme, dashboard layout, metric colors, date filters, and notification preferences are saved in the browser's `localStorage`. Use **Restaurar dados** on the settings route to clear local demo preferences.

## Supabase/Auth

See [docs/saas-auth.md](docs/saas-auth.md) for local environment setup, the Trial enforcement model, and remaining Supabase Auth configuration. The Supabase foundation is applied and Vercel project `analisa-roi-oficial` has a production deployment and its backend environment configured; redeploy once to activate the updated variables. Keep `.env.local` ignored and never paste secret keys into chat or source control. `npm run build` writes a Vercel static output directory; the dashboard shell is only returned through an entitlement-checked Node Function.
