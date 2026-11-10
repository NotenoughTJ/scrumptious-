# Working together

Merge the shared foundation into main before creating the area branches. Main is the shared working application. Make small pull requests, have another teammate review them, and update from main before the next piece of work.

| Primary owner | Branch | Source area |
| --- | --- | --- |
| Kylie | kylie/results-dashboard | features/results-dashboard |
| Sarah | sarah/student-decisions | features/student-decisions, shared UI/styles |
| Kalynn | kalynn/database | features/database, db, drizzle |
| Tahj | tahj/rfi-generator | features/rfi-generator |
| Cole | cole/frlst-import | features/frlst-import |

Ownership gives each area a person responsible for moving it forward. It does not prevent collaboration. Changes to features/shared/types.ts, lifecycle rules, or file contracts need explicit coordination with affected owners.

After the foundation is merged:

1. Fetch and update local main.
2. Create your person/area branch from main.
3. Run npm ci, then the checks in README.md.
4. Commit one working change and open a PR to main.
5. Ask another teammate to review the UI behavior, data contract, and relevant tests.
6. Merge only after review, then bring updated main into the next work item.

Use the pull request template. Avoid committing node_modules, build output, local D1 state, environment files, or credentials. Applied migrations are immutable; append a migration rather than rewriting one that was deployed.

Team Studio edits update app content, not source files or GitHub branches. Export the plan when you want a reviewable copy.
