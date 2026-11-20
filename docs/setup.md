# Toolkit setup record

- Toolkit: `soumatheusgomes/vibe-coding-toolkit`
- Revision: current checkout reviewed on 2026-11-20.
- Scope: existing-project adoption in the local workspace.
- Client: Codex desktop; local project instructions are loaded from `AGENTS.md`.
- Package manager: npm; runtime contract: Node.js >=20.

## Coverage

| Area | Status | Evidence or reason |
|---|---|---|
| Product context | validated | `PRODUCT.md` created from observed app behavior |
| Shared instructions | validated | `AGENTS.md`, `CLAUDE.md` |
| Architecture/design/onboarding/quality | configured | documents added under `docs/` |
| Existing scripts | reused | package scripts preserved |
| Next.js/Drizzle/PostgreSQL | not applicable | incompatible with the current vanilla demo |
| Supabase Trial/Auth foundation | applied | project `Nemofy`; migrations mirrored locally; Auth email/SMTP settings still pending |
| Vercel project config | configured | project `analisa-roi-oficial`; Supabase URL/publishable key and SaaS mode set for all environments |
| Vercel production deployment | ready | `analisa-roi-oficial.vercel.app`; redeploy required to load the environment variables added afterward |
| External services, Sentry, Context7, Graphify | pending/not configured | no concrete need or approved project destination |
| Supabase database advisors | validated | Security Advisor clear; performance advisor only reports indexes not yet used on empty tables |
| Full production security audit | not run | separate pre-launch scope |

## Verification

Run `npm run typecheck`, `npm run build` and `npm test` after setup. The current results are recorded in `docs/TEST-REPORT.md`.
