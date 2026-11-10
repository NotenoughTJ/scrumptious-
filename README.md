# Scrumptious
LSU ISDS 4125 restaurant simulation — an editable, desktop-first team prototype around the existing FORTRAN engine.

Source branch: `Tahj-AI`. Review the shared foundation in a pull request before merging it into `main`.

## Try the app

Live private prototype: https://scrumptious-team-studio.lavishwaxwing3.chatgpt.site

Student view supports draft editing, validation, review, submission, and released results. Professor view supports submission review, round locking, real RFI downloads, FR.LST import, and result release. Team Studio contains editable architecture notes, design colors, and the person/area branch plan. Use the question-mark button for the guided walkthrough.

The demo starts with Q2 released and Q3 open. Firms 2, 3, and 4 have submitted; Firm 1 and Firm 5 are drafts. The original simulation remains external and is run manually by the professor. The sample-import button reads supplied historical output; it does not execute the simulation.

## Temporary GitHub Pages preview

A separate static build preserves the demo screens and file workflow on GitHub Pages. It uses sample data and browser-only storage; it does not connect to D1 or provide real authentication.

    npm run build:pages

The Pages workflow builds from main. Enable **Settings → Pages → Source → GitHub Actions** once, then run the **Temporary GitHub Pages demo** workflow. GitHub Pages must be available for this private repository’s account plan. No repository visibility changes are made by this workflow.

## Run locally

Requires Node.js 24 (minimum 22.13), npm, and Git. After cloning and checking out the foundation branch or updated main:

    npm ci
    npm run build
    node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_rare_brood.sql
    npm run dev

Apply the migration once to a fresh local database. Use the local URL printed by the development server. Development mode allows the sample workspace without production sign-in. Local database files are ignored by Git.

## Checks

    npm test
    npm run typecheck
    npm run build

The domain suite includes all 30 byte-for-byte RFI fixture round trips, the six supplied FR.LST periods, invalid imports, duplicate item names, validation, round transitions, duplicate-file detection, and ZIP packaging. The actual FORTRAN executable was not provided or run.

## Edit and collaborate

- Edit notes, colors, architecture decisions, and ownership in Team Studio, then choose Save shared changes. These edits persist in the app; they do not rewrite source files.
- Edit application code in the source areas below and use pull requests.
- Merge the shared foundation into main before branching by person/area. See CONTRIBUTING.md.

| Area | Owner | Main source |
| --- | --- | --- |
| Results / dashboard | Kylie | features/results-dashboard |
| Student decisions / shared design | Sarah | features/student-decisions, app/globals.css |
| Database | Kalynn | features/database, db, drizzle |
| RFI generator | Tahj | features/rfi-generator |
| FR.LST import | Cole | features/frlst-import |
| Shared contracts / shell | Everyone | features/shared |
| Editable project explanation | Everyone | features/studio |

## Persistence and access

Cloudflare D1 stores one shared prototype workspace with optimistic revision checks. Stale saves return HTTP 409. The proposed normalized domain schema is in docs/relational-schema.sql and is explicitly not an applied migration. See docs/ARCHITECTURE.md for the tradeoff and schema refinements.

The deployed Site is private and uses platform sign-in. Student/professor selectors preview screens; course-role and per-team authorization are still to implement before real student data is used. Repository visibility is unchanged. The course final submission calls for a public repository and appropriate judge access.

## Source materials and limits

The app follows the supplied architecture/design Word document, PBI/schema dictionary, example input/output archive, project description, final-deliverable guidelines, and final choices in the supplied Claude conversation. Q1 is baseline; Q2–Q7 have decision examples. There is no Q6 FR.LST in the supplied archive.

Report flag meanings, business ranges, reserved legacy values, and exact facilitator instructions still need instructor confirmation. Fixed-width constraints are not presented as confirmed business limits. The parser checks period and firms, but the source format has no app run ID to prove an output came from a particular generated input set.

Fonts are served locally with their OFL licenses. Design colors include calculated contrast checks; broader manual accessibility verification remains necessary. See docs/DEMO.md for a step-by-step demonstration.
