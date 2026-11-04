# Database Structure

Postgres on Supabase. Create each table in the build step that first needs it. API keys are never stored in these tables, because they stay on the student's device.

## All tables

|   Group    |         Table         |             Purpose              |           Belongs to           | Build step |
| :--------: | :-------------------: | :------------------------------: | :----------------------------: | :--------: |
|  Account   |       `profiles`      |           User details           |          `auth.users`          |     1      |
|  Account   |  `google_connections` |     Encrypted Google access      |           `profiles`           |     8      |
|  Subjects  |        `terms`        |    Semesters or school terms     |           `profiles`           |     2      |
|  Subjects  |       `subjects`      |       Classes being taken        |            `terms`             |     2      |
|  Schedule  |    `class_meetings`   |        Weekly class times        |           `subjects`           |     4      |
|  Schedule  |        `events`       |    Exams, deadlines and tasks    |     `subjects` (optional)      |     4      |
|   Notes    |        `notes`        |         Rich text notes          |           `subjects`           |     5      |
|   Notes    |      `note_files`     |    Details of uploaded files     |            `notes`             |     5      |
| Quiz cards |        `decks`        |         Groups of cards          |           `subjects`           |     6      |
| Quiz cards |        `cards`        |      Questions and answers       |            `decks`             |     6      |
| Quiz cards |     `card_reviews`    |          Study history           |            `cards`             |     6      |
|   Grades   |    `grading_scales`   |    Named scales, such as A–F     |           `profiles`           |     3      |
|   Grades   | `grading_scale_bands` |     Score cutoffs in a scale     |        `grading_scales`        |     3      |
|   Grades   |   `grade_categories`  | Weighted groups, such as Quizzes |           `subjects`           |     3      |
|   Grades   |     `grade_items`     |        Individual scores         |       `grade_categories`       |     3      |
|  AI chat   |     `chat_threads`    |          Conversations           | `subjects`, `notes` (optional) |     7      |
|  AI chat   |    `chat_messages`    |    Messages in a conversation    |         `chat_threads`         |     7      |

## Standard columns

Every table has these columns unless its section says otherwise. They aren't repeated in the tables below.

|    Column    |      Type     | Required |                   Details                   |
| :----------: | :-----------: | :------: | :-----------------------------------------: |
|     `id`     |     `uuid`    |   Yes    |   Primary key, default `gen_random_uuid()`  |
|  `user_id`   |     `uuid`    |   Yes    | References `profiles(id)` on delete cascade |
| `created_at` | `timestamptz` |   Yes    |               Default `now()`               |
| `updated_at` | `timestamptz` |   Yes    |               Default `now()`               |

Row-level security is on for every table. Users can only access rows where `user_id = auth.uid()`. `user_id` defaults to `auth.uid()`, and the app can't set or change it.

Foreign keys between student tables include `user_id`, so a student can't attach a row to someone else's subject, note or scale, even if they know its ID.

## Account

### `profiles`

The `id` references `auth.users(id)` on delete cascade. There is no `user_id`, and users can only access the row where `id = auth.uid()`. A trigger creates the row on sign-up. Students can only edit `display_name`, `timezone` and `default_grading_scale_id`. The browser fills in `timezone` on the student's first visit.

|           Column           |  Type  | Required |                               Details                               |
| :------------------------: | :----: | :------: | :-----------------------------------------------------------------: |
|       `display_name`       | `text` |    No    |                                                                     |
|         `timezone`         | `text` |    No    |                      For example, `Asia/Manila`                     |
| `default_grading_scale_id` | `uuid` |    No    | References `grading_scales(id)` on delete set null; added in step 3 |

### `google_connections`

`user_id` is the primary key, and there is no `id`. The browser has no access to this table, so only server code can use it.

|           Column          |   Type   | Required |            Details             |
| :-----------------------: | :------: | :------: | :----------------------------: |
| `refresh_token_encrypted` |  `text`  |   Yes    | Encrypted Google refresh token |
|          `scopes`         | `text[]` |    No    |   Google permissions granted   |
|       `calendar_id`       |  `text`  |    No    |  Google Calendar to sync with  |

## Subjects

### `terms`

|    Column    |  Type  | Required |                Details                |
| :----------: | :----: | :------: | :-----------------------------------: |
|    `name`    | `text` |   Yes    | For example, `1st Semester 2026-2027` |
| `start_date` | `date` |   Yes    |                                       |
|  `end_date`  | `date` |   Yes    |                                       |

### `subjects`

|       Column       |      Type      | Required |                               Details                               |
| :----------------: | :------------: | :------: | :-----------------------------------------------------------------: |
|     `term_id`      |     `uuid`     |    No    |              References `terms(id)` on delete set null              |
| `grading_scale_id` |     `uuid`     |    No    | References `grading_scales(id)` on delete set null; added in step 3 |
|       `name`       |     `text`     |   Yes    |                                                                     |
|       `code`       |     `text`     |    No    |                                                                     |
|    `instructor`    |     `text`     |    No    |                                                                     |
|      `color`       |     `text`     |    No    |                                                                     |
|      `units`       | `numeric(4,2)` |    No    |                          Used to weight GPA                         |
|   `archived_at`    | `timestamptz`  |    No    |                          Null while active                          |

A subject's `term_id` must point at a term with the same `user_id`, so a student can't attach a subject to someone else's term. Deleting a term only clears `term_id`.

Names can be up to 100 characters, `code` up to 30, and `instructor` up to 100. `color` must be a hex color like `#2f6fb0`, and `units` can't be negative. A term's `end_date` can't be before its `start_date`.

## Schedule

### `class_meetings`

Weekly classes that repeat between the term's start and end dates.

|     Column    |    Type    | Required |                   Details                   |
| :-----------: | :--------: | :------: | :-----------------------------------------: |
|  `subject_id` |   `uuid`   |   Yes    | References `subjects(id)` on delete cascade |
| `day_of_week` | `smallint` |   Yes    |       0 = Sunday through 6 = Saturday       |
|  `start_time` |   `time`   |   Yes    |         Local to `profiles.timezone`        |
|   `end_time`  |   `time`   |   Yes    |         Local to `profiles.timezone`        |
|   `location`  |   `text`   |    No    |                                             |

### `events`

One-time items such as exams, deadlines and personal tasks. Index on `(user_id, starts_at)`.

An all-day event is a date rather than a moment, so `starts_at` holds midnight UTC on that date and is read back in UTC. That keeps it on the same date in every time zone. Other events are exact moments, shown in the student's time zone.

|       Column      |      Type     | Required |                   Details                   |
| :---------------: | :-----------: | :------: | :-----------------------------------------: |
|    `subject_id`   |     `uuid`    |    No    | References `subjects(id)` on delete cascade |
|      `title`      |     `text`    |   Yes    |                                             |
|       `type`      |     `text`    |   Yes    |   `exam`, `assignment`, `task` or `other`   |
|    `starts_at`    | `timestamptz` |   Yes    |                                             |
|     `ends_at`     | `timestamptz` |    No    |                                             |
|     `all_day`     |   `boolean`   |   Yes    |               Default `false`               |
|   `completed_at`  | `timestamptz` |    No    |                                             |
| `google_event_id` |     `text`    |    No    |               Added in step 8               |

## Notes

### `notes`

GIN index on `search_vector`, which uses the `english` search configuration. `content` and `plain_text` are each limited to 500,000 bytes or characters.

|      Column     |    Type    | Required |                   Details                   |
| :-------------: | :--------: | :------: | :-----------------------------------------: |
|   `subject_id`  |   `uuid`   |   Yes    | References `subjects(id)` on delete cascade |
|     `title`     |   `text`   |   Yes    |                                             |
|    `content`    |  `jsonb`   |    No    |             The Tiptap document             |
|   `plain_text`  |   `text`   |    No    |       Extracted from `content` on save      |
| `search_vector` | `tsvector` |    No    |   Generated from `title` and `plain_text`   |

### `note_files`

Stores file details only. The files themselves live in Supabase Storage.

|     Column     |   Type   | Required |                 Details                  |
| :------------: | :------: | :------: | :--------------------------------------: |
|   `note_id`    |  `uuid`  |   Yes    | References `notes(id)` on delete cascade |
| `storage_path` |  `text`  |   Yes    |                                          |
|  `file_name`   |  `text`  |   Yes    |                                          |
|  `mime_type`   |  `text`  |    No    |                                          |
|  `size_bytes`  | `bigint` |    No    |                                          |

### Storage

|   Setting   |                         Value                         |
| :---------: | :---------------------------------------------------: |
|    Bucket   |                 `note-files` (private)                |
| Path format |      `{user_id}/{note_id}/{file_id}-{file_name}`      |
|    Access   | Users can only access paths under their own `user_id` |
|  File size  |                    Up to 10 MB each                   |
|    Quota    |    50 MB per student, plus at most one file over it   |
| File types  |     PDF, images, text, CSV, Markdown, Office files    |

`note_storage_used_bytes()` returns how much the signed-in student has stored. It counts stored objects rather than `note_files` rows, so files uploaded without a row still count. A Storage policy can't query its own table, so this function runs with elevated rights, and it only ever reports on the caller's own folder.

Deleting a note row doesn't delete its stored files, so the app removes them first, both when deleting a note and when deleting a subject.

## Quiz cards

### `decks`

|      Column      |  Type  | Required |                   Details                   |
| :--------------: | :----: | :------: | :-----------------------------------------: |
|   `subject_id`   | `uuid` |   Yes    | References `subjects(id)` on delete cascade |
| `source_note_id` | `uuid` |    No    |  References `notes(id)` on delete set null  |
|      `name`      | `text` |   Yes    |                                             |

### `cards`

Index on `(user_id, due_at)`. `front` and `back` can be up to 2,000 characters. Editing a card keeps its schedule.

|    Column    |      Type     | Required |                 Details                  |
| :----------: | :-----------: | :------: | :--------------------------------------: |
|  `deck_id`   |     `uuid`    |   Yes    | References `decks(id)` on delete cascade |
|   `front`    |     `text`    |   Yes    |                                          |
|    `back`    |     `text`    |   Yes    |                                          |
|   `due_at`   | `timestamptz` |   Yes    |             Default `now()`              |
| `fsrs_state` |    `jsonb`    |    No    |      The full `ts-fsrs` card state       |

### `card_reviews`

Append-only history, with no `updated_at`. Students can add rows but not change or delete them, and rows are only removed along with their card.

`record_card_review(...)` updates a card's schedule and adds its review in one transaction, so the two can't disagree. It runs with the caller's rights, so row-level security still applies.

|     Column    |      Type     | Required |                 Details                  |
| :-----------: | :-----------: | :------: | :--------------------------------------: |
|   `card_id`   |     `uuid`    |   Yes    | References `cards(id)` on delete cascade |
|    `rating`   |   `smallint`  |   Yes    | 1 = Again, 2 = Hard, 3 = Good, 4 = Easy  |
| `reviewed_at` | `timestamptz` |   Yes    |             Default `now()`              |

## Grades

Final grades and GPA are calculated from these tables and never stored, so they can't go out of sync when a score changes. The app warns when a subject's category weights don't add up to 100. A subject uses its own `grading_scale_id` if set, then the student's `default_grading_scale_id`, then a built-in A to F scale.

`save_grading_scale(...)` saves a scale and its bands in one transaction, so a failure can't leave a scale half edited. It runs with the caller's rights, so row-level security still applies.

### `grading_scales`

|         Column        |      Type      | Required |                       Details                       |
| :-------------------: | :------------: | :------: | :-------------------------------------------------: |
|         `name`        |     `text`     |   Yes    |                                                     |
|   `higher_is_better`  |   `boolean`    |   Yes    | Default `true`; `false` when 1.00 is the best grade |
| `passing_grade_point` | `numeric(4,2)` |    No    |                 For example, `3.00`                 |
|    `average_label`    |     `text`     |   Yes    |          Default `GPA`; for example, `GWA`          |
|     `base_percent`    | `numeric(5,2)` |   Yes    | Default `0`; for example, `50` for a base-50 school |

### `grading_scale_bands`

Unique on `(scale_id, min_percent)`.

|     Column    |      Type      | Required |                      Details                      |
| :-----------: | :------------: | :------: | :-----------------------------------------------: |
|   `scale_id`  |     `uuid`     |   Yes    | References `grading_scales(id)` on delete cascade |
| `min_percent` | `numeric(5,2)` |   Yes    |                                                   |
|    `label`    |     `text`     |   Yes    |             For example, `A` or `1.25`            |
| `grade_point` | `numeric(4,2)` |    No    |                                                   |

### `grade_categories`

|    Column    |      Type      | Required |                   Details                   |
| :----------: | :------------: | :------: | :-----------------------------------------: |
| `subject_id` |     `uuid`     |   Yes    | References `subjects(id)` on delete cascade |
|    `name`    |     `text`     |   Yes    |            For example, `Quizzes`           |
|   `weight`   | `numeric(5,2)` |   Yes    |                Greater than 0               |

### `grade_items`

|     Column    |      Type      | Required |                       Details                       |
| :-----------: | :------------: | :------: | :-------------------------------------------------: |
| `category_id` |     `uuid`     |   Yes    | References `grade_categories(id)` on delete cascade |
|     `name`    |     `text`     |   Yes    |                                                     |
|    `score`    | `numeric(7,2)` |    No    |                  Null until graded                  |
|  `max_score`  | `numeric(7,2)` |   Yes    |                    Greater than 0                   |
|  `graded_on`  |     `date`     |    No    |                                                     |

## AI chat

### `chat_threads`

|    Column    |  Type  | Required |                   Details                    |
| :----------: | :----: | :------: | :------------------------------------------: |
| `subject_id` | `uuid` |    No    | References `subjects(id)` on delete set null |
|  `note_id`   | `uuid` |    No    |  References `notes(id)` on delete set null   |
|   `title`    | `text` |    No    |                                              |

### `chat_messages`

Append-only, with no `updated_at`.

|    Column   |  Type  | Required |                     Details                     |
| :---------: | :----: | :------: | :---------------------------------------------: |
| `thread_id` | `uuid` |   Yes    | References `chat_threads(id)` on delete cascade |
|    `role`   | `text` |   Yes    |              `user` or `assistant`              |
|  `content`  | `text` |   Yes    |                                                 |

## Deleting subjects

Deleting a subject permanently removes its class meetings, events, notes, decks and grades. The app should offer archiving by default and ask for confirmation before deleting.
