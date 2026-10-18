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
