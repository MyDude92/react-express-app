# Evolving challenges and Collection

Ten optional projects, each with three cumulative stages, are listed on Coding.
The existing task catalog, browser runners, server graders and hint/reveal
controls handle all stages. JavaScript/TypeScript have hidden edge cases;
TypeScript also has positive and negative compiler assertions. React uses the
existing server Testing Library harness, never a client-supplied pass.

| Track | Project | Stage 1 → Stage 2 → Stage 3 |
| --- | --- | --- |
| JavaScript | Expression engine | Sums → precedence → recursive parsing and invalid input |
| JavaScript | Query pipeline | Filtering → sorting/pagination → projection and distinct records |
| JavaScript | Event bus | Ordered dispatch → unsubscribe/once → reentrancy and fault isolation |
| JavaScript | Dependency planner | DFS order → invalid graphs → parallel execution layers |
| TypeScript | Result pipeline | Typed map → flatMap/errors → fail-fast traversal |
| TypeScript | Typed state store | Generic state → subscriptions → undo/redo history |
| TypeScript | Schema validator | Primitives → recursive objects → arrays/optional/path errors |
| React | Task board | Add/toggle → filter/delete → immutable undo/redo |
| React | Product explorer | Search → sort/page → cross-page selection |
| React | Form wizard | Email validation → reversible steps → consent/submission/reset |

`shared/evolving.ts` owns ordered stage IDs and resume/unlock calculations.
Each stage reuses `coding_progress` and `coding_drafts`, so no new table or
migration is required. Stage issuance checks all preceding server-recorded
passes and submission rechecks prerequisites. Reveals and skips do not advance
the sequence. Signed-out visitors can try stage one; account progress requires
sign-in. A next stage without its own draft starts from the previous stage's
saved code. Submitting persists the exact code before recording a stage pass.
Earlier stages remain revisitable. Each stage earns existing first-pass XP
once through the idempotent grading routine.

Projects are optional: they do not enter Learn quotas, ordinary tier-unlock
denominators, skip suggestions or short practice queues. The final stage is
complete when passed, not when its reference solution is revealed. Cumulative
tests ensure new work cannot discard earlier requirements.

Collection replaces Cards in navigation. `/collection` has Questions, Coding
challenges (devShark only), and Shark Cards views. It reuses account flashcards,
coding bookmarks and collectible-card storage, preserving old data. `/cards`
continues to open the question deck for compatibility. Coding saves are also
available inside the task. Unavailable saved challenges can still be removed.

Coding review is disabled at the application boundary for old and new accounts:
progress responses contain `nextReviewAt: null` and `due: []`, and practice
selection ignores the legacy scheduling columns. Those columns and the old
SQL routine remain for backward compatibility; their timestamps are inert and
do not schedule any application behavior. Existing passes and XP are retained.
Question/concept spaced practice is unchanged.

Verification: `npm run test:coding` proves all reference solutions, rejects
untouched starters, checks EN/CS parity and answer-free payloads, and asserts
stable stage IDs, sequential unlocks, resume positions and cumulative tests.

Local verification (2026-09-15): API typecheck, launch contracts, production
build, all 279 reference solutions, 13 client tests, unused-code regression
check and whitespace check pass. Both production dependency audits report zero
vulnerabilities. Responsive browser verification could not run: no local
Chrome/Chromium executable is installed. Live cross-device persistence and
visual layouts still require authenticated browser acceptance; unit/content
checks do not establish that acceptance.
