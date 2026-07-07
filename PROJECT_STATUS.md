# Project Status

Last updated: July 7, 2026

## Live URLs

- Landing: https://fanatic.space/
- Admin CRM: https://fanatic.space/crm/
- Client portal skeleton: https://fanatic.space/portal/
- Thank-you page: https://fanatic.space/thanks/

## Working Now

- Cloudflare Pages deploy from GitHub `main`.
- Domain `fanatic.space`.
- Cloudflare Email Routing to `direct@fanatic.space`.
- FormSubmit contact form to `direct@fanatic.space`.
- Landing form also saves requests into Supabase `intake_requests`.
- Supabase project `fanatic-crm`.
- Admin CRM login with Supabase magic link.
- Admin CRM client tracker:
  - clients
  - progress items
  - sessions
  - support notes
  - files / links
  - private file upload to Supabase Storage
  - CSV export
  - JSON backup
  - intake request review and conversion to client
- Admin CRM can be installed as a PWA shell on Android-compatible browsers.
- Admin CRM can import clients from CSV directly in the browser.
- Admin CRM is moving toward teaching CRM structure: Today dashboard, Students, Tasks, Messages.
- CRM and portal Google login works through Supabase OAuth.
- psql installed.
- CLI helpers for CRM operations in `tools/`.
- CLI helpers can add and list client file/project/screenshot/video links.
- CSV import exists for moving clients from the current spreadsheet into CRM.
- Client portal database foundation.
- Client portal can update assigned progress statuses through a safe RPC.
- Client portal can add assigned progress items and support notes.
- Client portal can add file/project/screenshot/video links.
- Client portal can show session history and next actions without exposing private session notes.
- Admin CRM can grant/revoke client portal access from the Access tab.
- CRM and CLI can grant pending portal access by email before the client auth user exists.
- Portal claims pending email access after the client's first magic-link login.
- Supabase Auth redirect URLs include both `/crm/` and `/portal/`.
- `www.fanatic.space` redirects to `https://fanatic.space/` with a 301 for SEO consistency.
- CRM quality-of-life:
  - first client auto-selects after login
  - newly created client opens immediately
  - active tab persists across reloads
  - delete actions ask for confirmation
  - session private notes supported
  - client cards show activity counts
  - quick Add session action
  - secondary tools are grouped under a Tools menu
  - student list supports status filter, area filter, and sorting
  - add/edit forms are collapsed behind action blocks until needed
- Combined checks:
  - `tools/check-all.ps1`
  - `tools/check-public.ps1`
  - `tools/check-supabase.ps1`

## Important Follow-Ups

- Test installing `https://fanatic.space/crm/` as a PWA on Android/Chrome.
- Keep improving the admin CRM and client portal until they can replace the spreadsheet workflow.
- Rotate the Google OAuth client secret later because it appeared in a setup screenshot.
- Add Google Calendar integration after the session workflow is stable.
- Prepare 2-4 static ad images later for online lessons for ages 8-18: programming, AI tools, and practical computer directions.
- Replace contact phone / messenger placeholder when the number is ready.
- Remove test clients after UI testing:
  - `Codex Test Client`
  - `CLI Test Client`
  - `Form Lead Test`
- Add lightweight analytics if needed.

## Useful Commands

Run public deployment checks:

```powershell
.\tools\check-public.ps1
```

Check live frontend asset versions:

```powershell
.\tools\check-live-assets.ps1
```

Run all infrastructure checks:

```powershell
$env:PGPASSWORD = "<database-password>"
.\tools\check-all.ps1
```

Run CRM data integrity checks:

```powershell
$env:PGPASSWORD = "<database-password>"
.\tools\check-crm-data.ps1
```

List CRM clients:

```powershell
$env:PGPASSWORD = "<database-password>"
.\tools\crm-list-clients.ps1
```

Import clients from a CSV exported from Excel:

```powershell
$env:PGPASSWORD = "<database-password>"
.\tools\crm-import-clients.ps1 -CsvPath ".\examples\clients-import-template.csv"
```

Export CRM tables:

```powershell
$env:PGPASSWORD = "<database-password>"
.\tools\crm-export.ps1
```

Dump CRM database as portable SQL:

```powershell
$env:PGPASSWORD = "<database-password>"
.\tools\crm-dump-db.ps1
```

Create a full CRM backup bundle:

```powershell
$env:PGPASSWORD = "<database-password>"
.\tools\crm-backup.ps1
```

List intake requests:

```powershell
$env:PGPASSWORD = "<database-password>"
.\tools\crm-list-intake.ps1
```

Add a client file or project link:

```powershell
$env:PGPASSWORD = "<database-password>"
.\tools\crm-add-file-link.ps1 `
  -ClientEmail "client@example.com" `
  -Url "https://example.com/client-artifact" `
  -Label "Client artifact" `
  -Kind "project"
```

Show a compact report for one client:

```powershell
$env:PGPASSWORD = "<database-password>"
.\tools\crm-client-report.ps1 -ClientEmail "client@example.com"
```

List client portal access records:

```powershell
$env:PGPASSWORD = "<database-password>"
.\tools\crm-list-access.ps1
```

Revoke client portal access:

```powershell
$env:PGPASSWORD = "<database-password>"
.\tools\crm-revoke-client-access.ps1 `
  -ClientEmail "client@example.com" `
  -UserEmail "client@example.com"
```

Remove known Codex test clients after UI testing:

```powershell
$env:PGPASSWORD = "<database-password>"
.\tools\crm-delete-test-data.ps1 -ConfirmDelete
```

## Current Direction

Keep improving the admin CRM until it can replace the spreadsheet. Client portal and Android should follow the proven admin workflow, not lead it.
