# CRM Setup

This is the technical path for the first CRM version.

## Current Target

Build v0 as an admin-only tracker first:

- Rustam logs in.
- Rustam creates clients.
- Rustam tracks sessions, progress, support notes, and useful links/files.
- Client login comes later, after the tracker is useful.

This avoids building a big client portal before the workflow is proven.

## Supabase Setup

1. Create a new Supabase project.
2. Open SQL Editor.
3. Paste and run `supabase_schema.sql`.
4. In Authentication, enable Email login.
5. Open Project Settings -> Data API.
6. Copy the Project URL and anon public key into `crm/config.js`.
7. Create the first Rustam admin user by signing in from `/crm/`.

Current Supabase project:

- Project name: `fanatic-crm`
- Region: West EU (Ireland)
- Status: database schema created

## Tables Created

- `clients`
- `sessions`
- `progress_items`
- `support_notes`
- `client_files`

Each table has:

- `owner_id` linked to the logged-in Supabase user.
- Row Level Security enabled.
- Policies so the logged-in owner can manage only their own records.
- `created_at` and `updated_at`.

## Next Build Step

The first small web dashboard is in `crm/`:

- `/crm/login`
- `/crm/clients`
- `/crm/clients/:id`
- add session
- add progress item
- add support note
- add file/link

The current static route is:

```text
/crm/
```

Before it can talk to Supabase, fill:

```js
window.FANATIC_CRM_SUPABASE = {
  url: "https://your-project.supabase.co",
  anonKey: "your-anon-public-key"
};
```

in `crm/config.js`.

## Do Not Build Yet

- Client login.
- Payments.
- Android app.
- Complex analytics.
- Chat replacement.

Android starts only after the mobile web dashboard is useful.
