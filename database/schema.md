# Database structure and business rules

## Soft delete

Soft delete applies only to domain tables: `rubric`, `theme`, `text`, and `correction`.

`deleted_at` null means the row is active. Retiring a row sets `deleted_at`. That does not delete or retire rows that point at it.

- A `rubric` can be retired only when no active `theme` points at it.
- A `theme` can be retired only when no active `text` points at it.
- A `text` can be retired, and its `correction` rows stay as history. Queries for active texts leave those corrections out with the text.
- `user`, `session`, `account`, and `verification` do not use soft delete.

A new `theme`, or a `theme` that changes rubric, must point at an active `rubric`.
A new `text`, or a `text` that changes theme, must point at an active `theme`.
A new `correction` must point at an active `text` and an active `rubric`.

The database rejects the writes above. Hard `DELETE` is not how a catalog item leaves circulation.

## Authentication

`user`, `session`, `account`, and `verification` identify the person, the session, and email verification.

Deleting a `user` cascades to `session`, `account`, `text`, and, through the text, `correction`.

`verification` has no foreign key to `user`. It stores an identifier (usually the email) and expires on its own. Deleting the account does not delete those rows.

Themes and rubrics are a shared catalog. Deleting a user does not touch them.

### Email verification

`user.email_verified` decides who can start a `correction`. It does not decide who can sign in or write.

- A `text` can be saved whatever the value is. It stays without a `correction` until its author confirms the email and asks for the reading.
- The server checks the value before each reading starts, ahead of any submission limit. A blocked attempt creates no `correction`, so it uses no reading.
- A `text` with no `correction` means that no reading was recorded. It does not mean a reading failed.

## Domain

`rubric` is the criteria the AI uses to grade a text.
`theme` is the prompt a text can be written for.
`text` is the text a user writes for one theme.
`correction` is one AI grading of one text, using the rubric from that moment.

- 1 `user` writes N `text`. 1 `text` belongs to 1 `user`.
- 1 `theme` is used by N `text`. 1 `text` belongs to 1 `theme`.
- 1 `text` has N `correction`. 1 `correction` belongs to 1 `text`.
- 1 `rubric` is used by N `theme`. 1 `theme` uses 1 `rubric`.
- 1 `rubric` can have been used by N `correction`. 1 `correction` records 1 `rubric`.

The rubric in force for a text is the theme's rubric (`theme.rubric_id`). The rubric of a correction that already exists is the rubric stored on that correction.

## What delete does

| Foreign key            | Action   | Effect                                                     |
| ---------------------- | -------- | ---------------------------------------------------------- |
| `theme.rubric_id`      | restrict | Deleting a rubric does not delete themes or texts          |
| `text.theme_id`        | restrict | Deleting a theme does not delete texts                     |
| `text.user_id`         | cascade  | Deleting a user deletes that user's texts                  |
| `correction.text_id`   | cascade  | Deleting a text deletes its corrections                    |
| `correction.rubric_id` | restrict | Deleting a rubric does not delete corrections that used it |
| `reading_call.correction_id` | cascade | Deleting a correction deletes its model calls |

Hard delete of `rubric` or `theme` stays blocked while a reference exists. The normal way to take a catalog item out of circulation is soft delete, under the rules above.

## Correction history

Each `correction` freezes what the AI graded:

- `content`: the correction itself
- `score`: the grade, from 0 through 1000 inclusive
- `text_content`: the text body at grading time
- `rubric_id` and `rubric_content`: the rubric applied at that moment

Later edits to `text.content`, `rubric.content`, or `theme.rubric_id` do not change corrections already stored.

On insert, `text_content` must equal the current `text.content`, and `rubric_content` must equal the current `rubric.content` of the active rubric used for that correction.

## Score

`score` is `numeric(6, 2)`, from 0.00 through 1000.00. The `correction_score_range` check rejects a grade outside that range.

## Indexes

Domain foreign keys are indexed: `theme.rubric_id`, `text.theme_id`, `text.user_id`, `correction.text_id`, and `correction.rubric_id`.

## Reading lifecycle and limits (Phase 0-C)

A scene without a correction is an editable saved draft. Only that state permits
updating its content. Starting a reading reserves a PENDING correction synchronously,
with frozen scene and rubric bodies, before dispatching the workflow. Reservation,
draft updates and limits serialize per author with a PostgreSQL transaction lock.
Dispatch failure marks the reservation FAILED; it never leaves a draft pretending
to be queued. Duplicate starts are rejected while a reading is active or completed.

A failed attempt can be retried on the same scene, using exactly its frozen body.
Retries add a correction attempt, never a text. They use the rubric frozen on the
failed attempt; if that rubric has changed, starting is rejected rather than silently
changing the evaluation. Completed and failed attempts are terminal: late workflow
results cannot overwrite them.

Only scenes of 100–2,000 whitespace-separated words may start readings. Each author
may start 10 readings in a rolling 24 hours and 3 in a rolling 10 minutes. Count all
non-failed attempts, including soft-deleted corrections and scenes. Failed attempts
consume neither limit. The response includes the time when capacity becomes available.
Email verification is checked before reading limits; saving drafts remains possible.

After 2 minutes the UI reports a delay. After 10 minutes a PENDING/IN_PROGRESS
attempt expires to FAILED. Expiration is reconciled on status/history/detail reads
and before admission, even if the browser was closed. Terminal-write guards also
reject results past the deadline. Expired attempts release capacity and can be retried.

## Structured catalog and reading records (Phase 1-B)

`rubric.criteria` is an ordered JSON array of exactly five criteria, totaling
1,000 points. Each criterion has a stable id, name, kind, public description,
maximum and four named bands with numeric bounds and internal descriptors.
`rubric.genre` is a directly queryable genre key. `rubric.content` remains the
private model instruction document; public queries select only public criterion
fields and never return the instruction document or internal band descriptors.

`theme.genre`, `objective`, `min_words` and `max_words` are explicit metadata.
The genre must agree with its rubric. Word bounds are recommendations for the
exercise; the operational admission bounds remain 100–2,000 words.
`theme.briefing` stores situation, alreadyTrue, mustInclude (one array element
per checklist item), youDecide and doNotPenalize. The twelve catalog exercises
receive all fields in the migration, without requiring a subsequent seed.
Existing markdown `description` is retained byte-for-byte for the current model
and historical reference set. Public briefings are rendered from structured data.
Unknown, pre-catalog rows can retain null structured fields and use their legacy
description; no genre, instructions or results are invented for them.

Every new reading freezes `rubric_criteria` and `source` on reservation. Source
contains the theme title/description and rubric title, complementing the existing
frozen bodies. `model_id`, `prompt_version` and `prompt_config` record the exact
application configuration, including instructions, output schema and provider
options. The prompt version is a content hash of that configuration and the
prompt template; changing any part produces a different version. These technical
fields are not selected for the writing UI. A deployment change before dispatch
must fail rather than record one configuration while calling another.

`structured_result` is a versioned JSON document containing the opening, one highlight with its quotation, criterion
results (id, score, band, evidence, strengths and gaps) and revision suggestion.
Readings completed before Phase 1-C keep it null; since 1-C every completed
reading has it (see below). Structured completion requires a frozen rubric and model
configuration, all five matching criterion ids, bounded scores/bands and a total
matching `score`. Band ceilings apply to hundredths too: e.g. 30.01 out of
150 belongs to the second band, just as in the evaluation reports. Evidence and prose remain frozen verbatim, never reconstructed
from a later rubric. No old markdown result is backfilled by guessing scores or
quotes. `COMPLETED` is the only status that represents a reading version; failed
attempts remain diagnostic history and do not count as versions.

The database freezes snapshot fields after insertion and result fields after
completion/failure, allowing soft deletion. On insert it captures the current
structured rubric and verifies supplied snapshots. Retry admission also compares
criteria and briefing snapshots, so catalog edits cannot silently change a retry.

## Reading engine, monitoring and cost (Phase 1-C)

Every new reading is structured. The model returns, for each of the five frozen
criteria, a score, strengths, gaps and one or two quotations, plus an opening,
one highlight with its quotation and one revision focus. The server, not the
model, decides what is stored:

- Coverage: exactly the five frozen criterion ids, none missing, repeated or
  invented. A missing revision focus, opening, highlight, strengths or gaps is
  rejected.
- Scores: each criterion from 0 to its frozen maximum, rounded to hundredths.
  A score outside that range is rejected, never clamped.
- Bands: computed from the frozen bands, never taken from the model.
- Total: `score` is the sum of the stored criterion scores, computed on the
  server. The model is not asked for a total.
- Quotations: kept only when they are a literal, contiguous stretch of the
  frozen `text_content` (whitespace runs, quote marks, dash and ellipsis
  variants and letter case may differ; accents and words may not, and an
  omission marked with "..." does not match). The stored evidence is the scene's
  own substring, so it can be located in the scene. A quotation not found in the
  scene is discarded. When the highlight, or any criterion, is left with no
  valid quotation, the reading is rejected.
- A rejected reply is asked again once, with the reason. A second rejection
  fails the attempt at the `validation` stage; it stays retryable like any
  failed attempt. Transient provider errors are retried by the workflow step.
- `content` is markdown rendered from `structured_result` for the current
  reading screen. Nothing parses it back; the structure is the source.

The database enforces the last line of defense: one or two quotations per
criterion (`valid_structured_reading`) and every stored quotation present in
`text_content` (`correction_evidence_in_scene`).

A reading needs frozen `rubric_criteria`. An attempt without them, from a
pre-catalog rubric, fails at the `grading` stage before any model call; no
structure is invented for it.

The prompt keeps instructions and material apart: system instructions hold
every rule, and the user prompt delimits `<tema>`, `<rubrica>`, `<criterios>`
and `<cena>`, with the scene last. Delimiter-like text inside the scene is
neutralized, so a scene cannot close its own part or open another. The
rubric's old markdown output section is left out of the prompt; the frozen
`rubric_content` is unchanged.

### Monitoring

`correction.started_at` is when the workflow moved the attempt to
IN_PROGRESS; `finished_at` is when it completed or failed. Queue time is
`started_at - created_at`; time to reading is `finished_at - created_at`.
`failure_stage` records where a FAILED attempt stopped: `dispatch` (the
workflow could not be started), `queue_timeout` and `processing_timeout`
(expired after 10 minutes while PENDING or IN_PROGRESS), `admission` (scene,
rubric or reservation no longer valid), `grading` (configuration mismatch,
missing criteria or provider failure), `validation` (two rejected replies) and
`saving` (scene or rubric changed, or the deadline passed, before the write).
`failure_reason` is the internal message. Older failed rows keep both null.
These fields freeze with the terminal result and are never selected for the
writing UI.

`operation_alert` keeps the last time each alert kind was sent, so an ongoing
problem alerts once per hour. It holds no personal data.

### Cost

`reading_call` holds one row per model call made for an attempt: accepted,
rejected by validation, or failed with a provider error. Each row records the
model, prompt version, token counts, the list price in force that day
(`price`, frozen with the row) and `cost_usd`. Cost is null when the provider
did not report usage; it is never counted as zero. `kind` is `reading` for the
evaluation and `comparison` for the separate version comparison. The operations
report counts those costs apart, so a comparison does not raise the cost per
reading.

`reading_call.correction_id` cascades: deleting a correction (and so a text or
a user) deletes its calls. Soft-deleting a correction keeps them, so spend
stays measurable.


## Writing drafts (Phase 1-E)

A draft uses the existing text row. An empty title means no personal title;
presentation falls back to the exercise title, including old automatic titles.
The JSON string array `text.checklist` records manually checked briefing items.
It is writing metadata only, never included in model input or correction snapshots.

Draft-only saves accept content below the reading minimum. They use the same
per-author transaction lock as reading reservation. Updates are rejected while
a reading is pending or in progress, while the latest attempt failed and must
be retried unchanged, and while the latest completed reading has no structured
focus. Submission checks its confirmed content again inside the reservation
transaction, so an intervening edit from another tab cannot silently change
what is submitted. The UI serializes autosaves and waits for them before
submission. Once reserved, the frozen text remains visible in the reading state.

## Reading feedback (Phase 1-F)

Only the author of an active scene can give feedback on its active, completed,
structured reading. `reading_feedback` has one mutable usefulness choice per
correction (`yes`, `partly`, `no`). `reading_disagreement` has one mutable optional
reason (at most 2,000 characters) per correction and frozen criterion id. An empty
reason still records a disagreement. These records refer to the immutable reading,
so its model, prompt version and criterion snapshots remain available for analysis.
They never update the correction, its score, or start another reading. Legacy
markdown readings have no criterion feedback. Foreign keys cascade on hard delete
of the correction; soft deletion preserves feedback but hides it from active quality
reports. Quality reports aggregate by model/prompt; an explicit candidate export
provides reading and criterion ids for investigation, never automatically changes
the reference set. Feedback contains user-supplied text and must not enter telemetry.

## Scene versions (Phase 1-G)

A version is an active completed correction, numbered by `created_at` among
that scene's completed corrections. A failed attempt is not a version and does
not replace the previous completed text. Each completed correction already
freezes its own `text_content`, score, rubric and structured result. Editing
the scene later does not change those rows.

After the latest active correction is completed and structured, `text.content`
is the draft of the next version. It opens with the body of that latest
version and may then diverge. The draft stays on the same text row. Reserving
the next reading freezes the draft into a new correction and leaves every
earlier correction untouched. The new reading uses the same admission locks,
size bounds and edit lock as the first one: once it is pending or in progress,
`text.content` cannot change. A failed reading of that draft is retried from
its frozen body, still without counting as a version.

`text.revision_intent` is the optional draft answer to "O que você tentou
mudar?", at most 2,000 characters. Blank means omitted and is stored as null.
It is writing metadata: it is not part of the model prompt, the score, or
telemetry. Reservation of a new version copies the current draft answer onto
`correction.revision_intent` and clears the draft field. A retry copies the
answer from the failed attempt, not from the cleared draft. The column then
freezes with the rest of the correction snapshot. The answer is shown only
with the completed version it belongs to. The first version has none.
The comparison reads this frozen answer for display and does not send it to
the grader or to the comparison model.

## Version comparison (Phase 1-H)

The grader never receives the previous version's score. After that evaluation
is fixed, a separate step compares it with the previous completed reading.
A failed attempt is not a version and is not the baseline. The comparison is
stored on the newer correction as `comparison` and freezes when that reading
becomes completed; it does not change the score, the bands or the structured
result.

The stored comparison holds, for each shared criterion, both scores and bands
and whether that criterion improved, regressed or stayed. A regression is kept
even when another criterion or the total rose. When the two frozen texts are
identical, every movement is `unchanged`: a higher score is not an improvement.
The focus judgment is a separate model call. It sees the previous focus and
both scenes, not the scores and not the revision intention. Its quotation must
be a literal stretch of the new scene. One rejected reply is asked again. A
second rejection, or a provider failure after the step retries, leaves the
focus `unavailable` and still stores the score comparison. The reading itself
stays completed. An identical text skips that call and records focus
`unchanged`. The first completed version, and a previous version without a
structured result, have no comparison.

## Scene retirement (Phase 1-I)

Retiring a scene sets `text.deleted_at` and leaves every `correction`,
`reading_call`, and reading-feedback row in place. Those rows are not
soft-deleted and not hard-deleted. Hard `DELETE` of a text stays the cascade
used when the account is deleted; it is not how a person removes a scene.
Because the attempts remain, rate limits and cost still count them, and undo
can bring the scene back with its readings.

Active lists and draft continuation omit a retired scene. Undo clears
`deleted_at` only inside the undo window: 8 seconds on screen
(`SCENE_UNDO_MS`) and 10 seconds accepted by the server
(`SCENE_UNDO_SERVER_MS`), so a click that leaves as the notice closes can
still finish. After that window the retirement stands. Neither action changes
the scene body, its versions, feedback, or attempt rows.

A reading that is still `PENDING` or `IN_PROGRESS` keeps running. Retirement
does not cancel the model call and does not change the attempt. If the scene
is still retired when the workflow reaches admission or saving, the existing
active-text check fails the attempt (`Text not found`) and the scene stays
out of the lists. Undo before that check lets the reading finish. Undo after
the attempt has failed brings the scene back with that failed reading, which
can be retried. A completed reading is never removed.

## Scene closure (Phase 2-B)

Closing a scene sets `text.closed_at`. It is the writer's decision and is
allowed after the latest active attempt is completed, at any score band. A low
score does not close the scene and is not recorded as giving up. Closing does
not delete, retire, or rewrite versions, attempts, calls, or feedback.
Reopening clears `closed_at` at any later time and restores the situation the
scene had before. Retirement (`deleted_at`) stays separate: a closed scene can
still be retired, and reopening does not restore a retired scene.

While `closed_at` is set, the scene cannot be edited and cannot start another
reading. The reading and the comparison remain available. The current situation
is derived for Minhas cenas, the catalog, and Início; it is not stored. A scene
is closed when `closed_at` is set. Otherwise the latest active attempt decides:
no attempt is a saved draft; `PENDING` is waiting; `IN_PROGRESS` is being read;
`FAILED` is a failed reading; `COMPLETED` whose current body differs from the
frozen version is a revision in progress; `COMPLETED` with the same body is a
finished reading. The band shown for a finished reading comes from the total
score, using the same 20/50/80/100 thresholds as the rubric. Failed attempts
are not versions and do not add a row to those lists.

## First opening of a reading (Phase 2-B)

`correction.opened_at` is the first time the author opened that completed
reading. Listing a scene, or a notification, does not set it. It can be written
only while null, only on a `COMPLETED` reading, and a later change is rejected.
Setting it does not change the frozen snapshot or the terminal result.
Readings completed before this column existed are backfilled from `finished_at`,
then `updated_at`, then `created_at`, so they are already opened. A reading
completed after that stays unopened, and counts as new, until its first opening.

## Catalog situation (Phase 2-C)

The catalog derives one personal situation per active exercise from the author's
active scenes and active correction attempts. No scene means unwritten. A scene
without an attempt is a draft; after any reading has been requested, an open
scene is in review, including waiting, failed and completed readings. Only the
author's explicit closure makes it closed. These four catalog groups do not
replace the more detailed reading states in Minhas cenas.

When an exercise has multiple scenes, an open scene takes precedence over closed
scenes; within either group the most recently updated scene is selected (id breaks
ties). The card continues that same scene. Retired scenes and attempts, and scenes
belonging to other authors, do not affect its situation. The catalog applies both
genre and situation filters to the full active catalog.
