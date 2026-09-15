# Launch hardening follow-up — 2026-09-16

The owner authorized merging the audit and fixes to main and continuing
security, recovery, load and multi-account verification. PR #192 merged as
`541941e81076270f0aa1a2201dabf8f206b77257`; its devShark production deployment
reached READY. The observations below were made on September 15 UTC / September
16 Prague time. This is **not launch approval**.

## Grading integrity

A local regression reproduced a JavaScript wrong-answer pass by replacing the
old guest-global comparison function. No malicious submission was sent to
production. Expected values and comparisons now remain in the trusted host.
QuickJS receives learner code and calls only; its controller is held through a
private host handle, with strict learner scope and captured primitives. Tagged,
bounded serialization preserves undefined, non-finite numbers and negative zero.
Trusted calls no longer dispatch through learner-overridable `eval`.

Ten adversarial cases cover comparison/expectation/evaluator replacement,
intrinsic and serializer poisoning, forged completion, promise replacement,
prototype serializers and controller/caller access. They fail to forge passes;
lossless values and a clean run after attacks pass. All 385 reference tasks
also pass. The integrity regression is part of both products' CI.

**React integrity remains open (#191).** Its microVM protects application
credentials and bounds runtime, but the learner and assertion/result producer
still share a guest Node process. Response shape validation cannot establish
that the authored assertions ran. A separate trusted assertion process observing
a browser-isolated learner is a candidate design requiring implementation and
full catalogue/adversarial validation. No source blacklist or Node `vm` security
claim substitutes for this boundary.

## Two-account evidence

Two disposable, marked synthetic users authenticated independently against
production. Both were denied admin access. Attempts to override the draft owner
could not read/write the other user's draft; direct Data API draft access was
denied by grants. A coding session issued to user A was rejected for user B.

Multiplayer and Classroom API checks covered create/join, host-only controls,
hidden answer keys, duplicate-answer idempotency, all five questions and final
results. Two separate Chromium contexts also completed both flows through the
actual UI. Classroom also recovered after the participant was offline while
the host started, then reloaded and completed all questions. These checks used
synthetic users, not the owner's real account.

An initial fixture pair was deleted through the account-erasure API, and their
old access tokens were rejected by Auth afterward. A second pair was retained
temporarily for browser checks to respect the deletion endpoint's two-per-hour
IP limit. After browser checks, exact-ID/metadata-guarded cleanup invoked the
app's erasure function and removed those synthetic Auth records. Verification
found zero remaining fixture users, rooms, drafts, participants or answers.
Both deleted accounts' tokens were rejected with HTTP 401 by the protected
app draft API, and private fixture credential/session files were removed.

## Bounded load observation

Production: one initial request, then three batches of three concurrent React
submissions, using form, board and catalogue reference solutions. All **10/10**
returned HTTP 200 and passed, awarded zero XP and persisted no anonymous
progress. Median **5.767 s**, p95/max **14.933 s**; range **5.467–14.933 s**.
No 5xx logs were returned for the production deployment over the check window.

This is a small concurrency smoke test, not a saturation/soak test or capacity
guarantee. The slowest request is significant headroom evidence for further
measurement. Expected launch concurrency, sustained throughput, error budgets
and Sandbox usage/cost still need acceptance. No billing settings changed.
An earlier probe used two incorrect task IDs and stopped on 404; the corrected
ten-submission run above is the reported measurement.

## Recovery and outstanding gates

Owner targets: **RPO 24 hours; RTO 1 hour**. A completed backup approximately
19 hours old was visible. An isolated restore form is prepared, but the new
database credential requires owner handoff. No restore has run; RTO is unknown.
See [recovery procedure](./backup-restore.md).

Keep #190/#191 open for the completed restore, delivered external alert,
expected-load acceptance, Safari/Firefox/Windows/physical devices, and React
adversarial grading integrity. No audit can establish that the app is bug-free.

## Repeatable operator checks

- `npm run test:grading-integrity` — offline adversarial QuickJS regression.
- `scripts/check-live-accounts.mjs` — requires `SMOKE_ACCOUNT_FILE` containing
  two deliberately provisioned marked fixtures; signs in, exercises real APIs,
  and deletes only those accounts unless `SMOKE_KEEP_FIXTURES=1` is set.
- `scripts/check-live-browser.mjs` — consumes the private session file from the
  account check via `SMOKE_SESSION_FILE`, plus an explicit `SMOKE_BASE_URL`.
  Optional `CHROME_BIN` selects an installed browser. Uses separate contexts.
- `scripts/check-grading-load.ts` — bundle with the repository's esbuild like
  other TypeScript scripts, then set `SMOKE_BASE_URL`. Fixed at ten submissions,
  maximum concurrency three; no auth credentials or progress writes.

Operator output under ignored `artifacts/` contains measurements. Keep session
files private, remove them after use, and always verify fixture cleanup.

## Local validation

API types, launch contracts, grading integrity, all 385 coding references,
production build and both production dependency audits passed (zero reported
vulnerabilities). Exactly twelve API handlers remain. No UI or database schema
was changed by the grading fix; the preceding responsive matrix remains relevant.
