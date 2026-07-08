# Fanatic Test CRM

This is the React/Vite source for the redesigned CRM route at `/test-crm/`.

The existing production CRM at `/crm/` is still the safe working version. This source builds static files into `../test-crm/` so Cloudflare Pages can serve it without changing the current root static setup.

## Source

- `src/components/ui/` is copied from Atomic CRM / shadcn UI components.
- `src/main.tsx` maps the UI to the existing Fanatic Supabase tables.
- `../test-crm/` is build output and should not be edited by hand.

## Commands

```powershell
npm install
npm run build
```

Local static preview from the repo root:

```powershell
python -m http.server 4173 --bind 127.0.0.1
```

Open:

```text
http://127.0.0.1:4173/test-crm/
http://127.0.0.1:4173/test-crm/?demo=1
```

## Auth

The live `/test-crm/` route reads `/crm/config.js`.

Before using real Google OAuth on production, add this redirect URL in Supabase Auth:

```text
https://fanatic.space/test-crm/
```

For local OAuth testing:

```text
http://127.0.0.1:4173/test-crm/
```
