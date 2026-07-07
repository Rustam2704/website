# Minimal CRM Spec

Goal: replace the current spreadsheet with a small client portal without turning the project into a large platform.

Do not build this before the public lead path is stable.

## Version 0: Admin-only tracker

Purpose: replace the spreadsheet first, before giving clients logins.

Objects:

- Client
- Session
- Progress item
- Support note
- File/link

Client fields:

- name
- email
- timezone
- plan: `session_only` or `session_plus_support`
- area
- current_goal
- status: `lead`, `active`, `paused`, `done`
- created_at

Session fields:

- client_id
- date
- duration_minutes
- topic
- notes
- next_actions
- private_notes

Progress item fields:

- client_id
- title
- status: `blocked`, `in_progress`, `improved`, `done`
- priority: `low`, `normal`, `high`
- updated_at

Support note fields:

- client_id
- message
- source: `email`, `form`, `manual`, `chat`
- resolved: true / false
- created_at

File/link fields:

- client_id
- url
- label
- kind: `screenshot`, `project`, `video`, `document`, `other`
- created_at

## Version 1: Client portal

Add client login only after the admin tracker feels useful.

Client can:

- see current goal
- see next actions
- upload or link work
- mark progress status
- ask small support questions on the $130 plan

Client cannot:

- edit session notes
- see private notes
- change plan/payment data

## Recommended stack

- Supabase Auth
- Supabase Postgres
- Supabase Storage
- simple responsive web dashboard first
- Android later only as a small monitoring surface

First technical artifact:

- `supabase_schema.sql` creates the v0 tables, indexes, timestamps, and owner-based Row Level Security policies.
- `CRM_SETUP.md` describes the Supabase setup path.

## Export requirement

Every core table must be exportable to CSV.

This keeps the business portable if Supabase is not the right fit after 3 months.
