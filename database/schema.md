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
did not report usage; it is never counted as zero. `kind` is `reading`; the
comparison of Phase 1-H will add its own kind to the same table.

`reading_call.correction_id` cascades: deleting a correction (and so a text or
a user) deletes its calls. Soft-deleting a correction keeps them, so spend
stays measurable.


## Writing drafts (Phase 1-E)

A draft uses the existing text row. An empty title means no personal title;
presentation falls back to the exercise title, including old automatic titles.
The JSON string array `text.checklist` records manually checked briefing items.
It is writing metadata only, never included in model input or correction snapshots.

Draft-only saves accept content below the reading minimum. They use the same
per-author transaction lock as reading reservation and reject updates once any
correction exists. Submission checks its confirmed content again inside the
reservation transaction, so an intervening edit from another tab cannot silently
change what is submitted. The UI serializes autosaves and waits for them before
submission. Once reserved, the frozen text remains visible in the reading state.
