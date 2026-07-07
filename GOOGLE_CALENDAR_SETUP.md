# Google Calendar Setup

Goal: sync CRM sessions into a separate Google Calendar named `fanatic.space`.

## Current State

- CRM already stores session date, duration, topic, notes, next actions, and repeat choice.
- `supabase_calendar.sql` adds the database fields needed for calendar connection and event mapping.
- Actual sync should be implemented after the schema is applied and Google Calendar OAuth scope is enabled.

## Required Google / Supabase Setup

1. In Google Cloud, enable the Google Calendar API for the existing OAuth project.
2. In Google OAuth consent / data access, add a Calendar scope.
3. Prefer the narrower event scope when possible:

```text
https://www.googleapis.com/auth/calendar.events
```

4. Keep the existing Supabase callback URL:

```text
https://iavkvtkoowwkvizjpasy.supabase.co/auth/v1/callback
```

5. In the CRM OAuth call, request the Calendar scope only for the admin flow, not for student portal login.

## Database Setup

Run the lesson fields migration first:

```sql
\i supabase_lesson_fields.sql
```

Then run:

```sql
\i supabase_calendar.sql
```

or paste `supabase_calendar.sql` into the Supabase SQL Editor.

This creates:

- `calendar_connections`
- calendar sync fields on `sessions`
- event link/status fields from `supabase_lesson_fields.sql`
- RLS policies
- indexes for owner/event/status lookups

## Recommended Architecture

Use the browser only to start the admin OAuth flow.

Do not build long-term calendar sync purely in the static browser app, because Google provider tokens are sensitive and should not be treated like ordinary public frontend state.

Recommended flow:

1. Admin signs in with Google and grants Calendar scope.
2. Supabase receives Google provider tokens.
3. A Supabase Edge Function handles:
   - finding or creating the `fanatic.space` calendar;
   - inserting/updating/deleting Google Calendar events;
   - updating `sessions.google_calendar_*` fields;
   - recording sync errors.
4. CRM calls that Edge Function when a session is created or updated.

## Event Mapping

CRM session -> Google event:

- summary: `<student name> - <topic or Session>`
- start: `sessions.date`
- end: `sessions.date + duration_minutes`
- description:
  - current goal
  - next actions
  - non-private notes
- calendar: `calendar_connections.calendar_id`

Private notes should not be sent to Google Calendar.

## Source Notes

- Supabase Google auth can expose Google provider tokens after OAuth sign-in.
- Google Calendar event creation requires an OAuth scope such as `calendar.events` or `calendar`.
