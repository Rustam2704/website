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
- CRM has CLI helpers for intake listing, conversion, archive, auth users, CSV export, SQL dump, and test-data cleanup.
- Client portal can:
  - show assigned client profile
  - show progress
  - update progress status
  - add progress items
  - add support notes
  - add file / project / screenshot / video links
  - show safe session history without private notes
- CRM and portal are marked `noindex, nofollow` through meta tags, robots.txt, and Cloudflare `_headers`.
- PWA icons were added for CRM installability on Android-compatible browsers.
- Portable PostgreSQL dump helper added.

## Verified

Run the same checks any time:

```powershell
$env:PGPASSWORD = "<database-password>"
.\tools\check-all.ps1
```

Latest checked pieces:

- Public pages return 200.
- CRM and portal return `X-Robots-Tag: noindex, nofollow`.
- Supabase tables exist.
- Supabase storage bucket exists.
- Client portal RPC functions exist.
- `pg_dump` backup script works.

## Still Needs User Clicks Later

- Add `https://fanatic.space/portal/` to Supabase Auth redirect URLs before inviting real clients into the portal.
- Add Cloudflare Redirect Rule for `www.fanatic.space -> fanatic.space` with 301 for SEO.
- Test CRM install on Android / Chrome.
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

Export CSV tables:

```powershell
$env:PGPASSWORD = "<database-password>"
.\tools\crm-export.ps1
```

Dump database:

```powershell
$env:PGPASSWORD = "<database-password>"
.\tools\crm-dump-db.ps1
```
