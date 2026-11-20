# Project instructions

## Commands

- `npm run dev` or `npm start`: start the local server.
- `npm run typecheck`: syntax-check all JavaScript entry points.
- `npm run build`: run the existing build check.
- `npm test`: run the existing smoke checks.

## Working agreements

- Preserve the vanilla HTML/CSS/JS stack and local-only demo behavior.
- Read the relevant source and documentation before editing.
- Keep secrets in ignored environment files; never commit credentials or real customer data.
- Update the responsible document when commands, boundaries or behavior change.
- Validate changed JavaScript with `npm run typecheck` and run the relevant smoke/build checks.

## Project map

- `index.html`: document shell and asset loading.
- `app.js`: hash-router, landing page and demo UI rendering.
- `styles.css`, `design.css`, `ux.css`, `sales.css`: visual layers.
- `server.js`: local static server.
- `scripts/`: build and smoke validation.
- `docs/`: architecture, design, onboarding, quality and setup records.
