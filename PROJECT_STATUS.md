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
- psql installed.
- CLI helpers for CRM operations in `tools/`.
- Client portal database foundation.
- Client portal can update assigned progress statuses through a safe RPC.
- Admin CRM can grant/revoke client portal access from the Access tab.
- CRM quality-of-life:
  - first client auto-selects after login
  - newly created client opens immediately
  - active tab persists across reloads
  - delete actions ask for confirmation
  - session private notes supported
  - client cards show activity counts
- Combined checks:
  - `tools/check-all.ps1`
  - `tools/check-public.ps1`
  - `tools/check-supabase.ps1`

## Important Follow-Ups

- Add `https://fanatic.space/portal/` to Supabase Auth redirect URLs before testing real client portal login with a real client email.
- Add Cloudflare Redirect Rule for `www.fanatic.space -> fanatic.space` with 301 for SEO.
- Test installing `https://fanatic.space/crm/` as a PWA on Android/Chrome.
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

Run all infrastructure checks:

```powershell
$env:PGPASSWORD = "<database-password>"
.\tools\check-all.ps1
```

List CRM clients:

```powershell
$env:PGPASSWORD = "<database-password>"
.\tools\crm-list-clients.ps1
```

Export CRM tables:

```powershell
$env:PGPASSWORD = "<database-password>"
.\tools\crm-export.ps1
```

## Current Direction

Keep improving the admin CRM until it can replace the spreadsheet. Client portal and Android should follow the proven admin workflow, not lead it.
