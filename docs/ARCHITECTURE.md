# Scrumptious architecture and design

This foundation follows the supplied architecture/design document, PBI and data dictionary, simulation samples, and the final decisions in the supplied Claude conversation. The prototype is a modern interface around the existing Cornell restaurant simulation. FORTRAN remains outside the web application.

## The end-to-end workflow

1. A student team edits one quarter strategy in four parts: Menu, Staffing, Amenities & upkeep, and Management info (including financial changes).
2. Client feedback identifies missing values. The server validates the complete strategy before submission. Submitted decisions are immutable until reopened while the quarter is open.
3. The professor reviews all teams and locks the quarter when all five have valid submissions.
4. The RFI adapter produces five fixed-width ASCII files. The professor downloads them individually or in a ZIP.
5. The professor runs the existing FORTRAN engine using the established facilitator process.
6. The FR.LST parser validates the entire output before committing results. The professor previews and releases them.
7. Students see released results and history. Professors compare all five firms.

Q1 is a supplied starting baseline. Q2-Q7 have decision examples. The demo starts with Q2 released, Q3 open, firms 2/3/4 submitted, and firms 1/5 in draft. The supplied archive has six FR.LST files (Q1, Q2, Q3, Q4, Q5, Q7); it does not include a Q6 FR.LST.

## Current implementation and target model

| Concern | Current runtime | Proposed evolution |
| --- | --- | --- |
| Hosting | React/Vinext on Cloudflare Workers through Sites | Retain the deployment integration |
| Persistence | D1 workspace row with JSON snapshot and revision | Review the normalized model in relational-schema.sql |
| Consistency | Atomic compare-and-swap update; outdated revisions return HTTP 409 | Preserve this behavior for fine-grained writes |
| Identity | Private Site boundary and authenticated write routes | Verified course-role and team membership |
| Roles | Clearly labeled student/professor screen previews | Stored server-side roles; no role escalation from a selector |
| Engine | External manual execution | Remains unchanged |
| Files | Template-preserving generator and text parser | Confirm undocumented mappings with the instructor |

The runtime intentionally uses a snapshot as a small, understandable prototype foundation. The target relational SQL is a design reference, not a second live database. The UI says which is which.

## Domain refinements

The original dictionary calls the decision table TeamDecision and the result table TeamMetrics; the supplied diagram also uses RoundDecision and RoundResult. Shared TypeScript contracts use Decision and Result. The target SQL uses RoundDecision and RoundResult consistently.

- Add SimulationRound for lifecycle and release state.
- Use (TeamID, RoundNumber, LineNumber) for menu selections. Firm 2 in Q2 has two STEAK selections with different preparation levels; item identity cannot be the selection primary key.
- Store imported menu results separately from editable menu decisions.
- Match imported firm numbers to teams. This prototype has one market and one course simulation; a multi-cohort product needs SimulationID on all relevant keys.
- Keep baseline results independent of decision records because Q1 has no student decisions.

## File contracts

RFI uses supplied per-firm, per-quarter templates. Known fields are updated in place. Reserved lines, unknown control fields, line endings, and unchanged numeric formatting are preserved. The 30 provided decision examples round-trip byte for byte.

Known menu fields: item columns 1-32; preparation label 33-50; level 51-53; portion 54-63; promotion 64-73; price 74-83. Operations and Finance fields use ten-character cells after column 43. Human-readable report names are not assigned to the three raw flags until the professor confirms their positions.

Numeric validation currently enforces presence, nonnegative decisions where appropriate, preparation levels, decimal precision, unique line numbers, maximum eight selections, and fixed-width capacity. These are format constraints, not confirmed business maxima. Finance changes allow signed whole dollars.

FR.LST import checks the quarter, firms 1-5, required income-statement metrics, customer statistics, and all detectable menu rows. Purchased guest reports repeat firm headers; they are excluded from income-statement counting. Wrong periods, duplicate income statements, partial firm sets, or malformed menu rows fail before any state write. An identical file hash is a no-op.

The supplied report does not echo an application run ID. Quarter and firm checks cannot prove that a file was produced from the exact current RFI set. The facilitator must retain file provenance. The sample-import button is an explicit demonstration of parsing supplied historical output.

## Design decisions

The desktop view is primary because teams compare wide numeric forms and reports. Phones receive the same tasks in a responsive layout. The four form parts group related decisions, show completion, allow direct navigation, and end with one full review. This is a task-organization choice, not an untested claim about Gen Z.

The established palette is gold #E0A94F, white #FFFFFF, deep green #1F3A2A, light orange #FCEDE4, and soft orange #D98B62. The page remains white in light mode. Dark mode uses #161616 and #242424, with the existing palette as accents and text. There is no green page background.

All result tiles use the same surface. Bars are solid gold with contrasting outlines; the donut uses multiple labeled segments. Negative net income is shown numerically, and a loss changes the donut to cost composition rather than inventing a positive profit slice.

Bricolage Grotesque is used for 24 px headings and important numbers. Hanken Grotesk handles 16 px body and 14 px small text, with compact labels where tables need them. Fonts are served locally with their OFL licenses.

Colors, ownership, project notes, and architecture decisions are editable in Team Studio. Saved changes persist in D1. Editing the branch plan does not create GitHub branches. Source changes remain Git-reviewed code changes.

## Scope still requiring team decisions

- Confirm the three report flags, input business ranges, reserved control fields, and facilitator execution instructions.
- Provision real student/professor membership and server-side team access before using real student records. Preview role controls are not authorization.
- Decide when to migrate from the shared snapshot to normalized tables.
- Add course/cohort identity and round creation if the product must support more than this single demonstration.
- Validate generated changed-value files in the actual FORTRAN executable; the executable was not supplied or run here.
- Complete screen-reader and broader accessibility checks. Contrast calculations and browser checks do not establish full WCAG compliance.

The live app is private by default. The course final-deliverable guidelines call for a public GitHub repository and a live app through exam week; repository visibility and team/judge access should be arranged deliberately.
