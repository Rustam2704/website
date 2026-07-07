# Morning Handoff

Last updated: July 7, 2026

## Live

- Landing: https://fanatic.space/
- CRM: https://fanatic.space/crm/
- Client portal: https://fanatic.space/portal/
- Thanks page: https://fanatic.space/thanks/

## Done Overnight

- Landing requests now save into Supabase `intake_requests` and still send email through FormSubmit.
- CRM has a global `Requests` panel.
- CRM can convert intake requests into clients.
- CRM has CLI helpers for intake listing, conversion, archive, auth users, CSV export, SQL dump, full backup, CSV import, client reports, file links, pending portal access grant/list/revoke, and test-data cleanup.
- CRM intake conversion now reuses an existing client with the same email instead of creating duplicates.
- CRM can import clients from CSV directly in the browser; existing clients are updated by email instead of duplicated.
- Client portal can:
  - show assigned client profile
  - show progress
  - update progress status
  - add progress items
  - add support notes
  - add file / project / screenshot / video links
  - show safe session history without private notes
  - open assigned private stored files through short-lived signed URLs
  - claim pending email access after the first magic-link login
- CRM and portal are marked `noindex, nofollow` through meta tags, robots.txt, and Cloudflare `_headers`.
- PWA icons were added for CRM installability on Android-compatible browsers.
- Portal manifest and service worker were added for Android-compatible browser installability.
- Portable PostgreSQL dump helper and one-command backup helper added.
- CRM service worker cache was refreshed so installed CRM shells are less likely to hold stale JS/config.

## Verified

Run the same checks any time:

```powershell
$env:PGPASSWORD = "<database-password>"
.\tools\project-status.ps1
```

Latest checked pieces:

- Public pages return 200.
- CRM and portal return `X-Robots-Tag: noindex, nofollow`.
- Supabase tables exist.
- Supabase storage bucket exists.
- Supabase storage policy lets clients read only assigned private files.
- Client portal RPC functions exist.
- `pg_dump` backup script works.
- Live CRM and portal pages were checked in the browser: no console errors and no blank screen.
- Live frontend asset versions can be checked from the terminal.
- CRM data integrity checks now catch duplicate client emails, invalid file URLs, broken access records, and converted requests without linked clients.
- Supabase Auth redirect URLs include both `/crm/` and `/portal/`.
- `www.fanatic.space` redirects to `https://fanatic.space/` with a 301 for SEO consistency.
- Landing hero uses a Lenovo-style technical workspace image.
- CRM and portal Google login works through Supabase OAuth.
- CRM shell is moving from generic client tracker toward teaching CRM: Today dashboard, Students, Tasks, Messages.
- CRM now has quick Add session, grouped Tools, student area filter, student sorting, and collapsed action forms.
- Selected student now has a working page header and Overview tab with goal, next lesson, tasks, blockers, latest session, latest message, and latest file.
- Today detects stale messages, stale tasks, missing session next actions, active students without upcoming sessions, blockers, and new requests.
- Portal home now has direct actions to sessions and tasks, with add forms collapsed until needed.
- Google Calendar groundwork exists in `supabase_calendar.sql` and `GOOGLE_CALENDAR_SETUP.md`.

## Still Needs User Clicks Later

- Test CRM install on Android / Chrome.
- Keep improving the admin CRM and client portal before moving into Android-specific work.
- Rotate the Google OAuth client secret later because it appeared in a setup screenshot.
- Decide whether to delete test clients:

```powershell
$env:PGPASSWORD = "<database-password>"
.\tools\crm-delete-test-data.ps1 -ConfirmDelete
```

## Useful Commands

List clients:

```powershell
$env:PGPASSWORD = "<database-password>"
.\tools\crm-list-clients.ps1
```

List intake requests:

```powershell
$env:PGPASSWORD = "<database-password>"
.\tools\crm-list-intake.ps1
```

List Supabase Auth users:

```powershell
$env:PGPASSWORD = "<database-password>"
.\tools\crm-list-auth-users.ps1
```

List portal access:

```powershell
$env:PGPASSWORD = "<database-password>"
.\tools\crm-list-access.ps1
```

Revoke portal access:

```powershell
$env:PGPASSWORD = "<database-password>"
.\tools\crm-revoke-client-access.ps1 `
  -ClientEmail "client@example.com" `
  -UserEmail "client@example.com"
```

Export CSV tables:

```powershell
$env:PGPASSWORD = "<database-password>"
.\tools\crm-export.ps1
```

Import clients from CSV:

```powershell
$env:PGPASSWORD = "<database-password>"
.\tools\crm-import-clients.ps1 -CsvPath ".\examples\clients-import-template.csv"
```

Dump database:

```powershell
$env:PGPASSWORD = "<database-password>"
.\tools\crm-dump-db.ps1
```

Create a full backup bundle:

```powershell
$env:PGPASSWORD = "<database-password>"
.\tools\crm-backup.ps1
```

Create a client and grant portal access by email:

```powershell
$env:PGPASSWORD = "<database-password>"
.\tools\crm-create-client-with-access.ps1 `
  -Name "Client Name" `
  -Email "client@example.com" `
  -Area "AI / programming"
```

Show one-client report:

```powershell
$env:PGPASSWORD = "<database-password>"
.\tools\crm-client-report.ps1 -ClientEmail "client@example.com"
```

Run full local status:

```powershell
$env:PGPASSWORD = "<database-password>"
.\tools\project-status.ps1
```
