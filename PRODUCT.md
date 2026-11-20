# Nemofy

## Problem and audience
Nemofy is a local demonstration of a marketing analytics workspace for operators who need one view of campaign spend, visits, funnel stages, sales and creative performance.

## MVP and critical flows
- The landing page is served at `/` and links to the dashboard at `/dashboard`.
- The dashboard follows the supplied dashboard reference structure and styling with Nemofy branding.
- Dashboard data, routes, preferences and exports are local demonstrations; no external account or payment is connected.

## Constraints
- Preserve the current vanilla HTML, CSS and JavaScript stack.
- Keep all demo data clearly simulated and avoid production credentials.
- Support local Node.js execution and responsive desktop/mobile layouts.

## Acceptance criteria
- `npm run typecheck`, `npm run build` and `npm test` run successfully.
- The server starts locally and serves the landing page and dashboard routes.
- Changes preserve local-only data behavior and keyboard-accessible controls.

## Assumptions
- Product name and metrics are demonstration content pending product validation.
- No production deployment, external integrations or persistence service is in scope.
