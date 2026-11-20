# Quality

## Canonical checks

- `npm run typecheck`: JavaScript syntax validation.
- `npm run build`: existing structural/build validation.
- `npm test`: existing smoke checks.

These checks do not prove production integrations, browser compatibility across every device, security of a deployed service or correctness of simulated business metrics.

## Review scope

For UI changes, inspect the landing page and affected hash route at desktop and mobile widths, including keyboard focus and reduced motion. For data or routing changes, run all three commands above.

## Security boundary

The Supabase Security Advisor returned no findings after the RLS migrations. This is a database lint check, not a full production security review. Auth email delivery, deployed routes, external integrations, and secret-free production logging still need end-to-end validation before launch.
