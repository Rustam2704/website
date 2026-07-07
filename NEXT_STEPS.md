# Next Steps

## Done

- Website source is in GitHub: https://github.com/Rustam2704/website
- Domain purchased: `fanatic.space`
- Public URL target: https://fanatic.space/
- Cloudflare Pages is the main production deploy target.
- Domain expires: July 6, 2027
- Renewal price: $250.20/year
- Auto-renew is currently off
- GitHub Pages is enabled from `main`.
- The form now posts to FormSubmit instead of opening the visitor's email app.
- FormSubmit is activated and tested.
- The landing form also writes a lead record into Supabase `intake_requests`.
- `direct@fanatic.space` receives routed email.
- The site has a short privacy note for form submissions.
- Intake and reply templates are documented.
- Supabase project `fanatic-crm` created.
- CRM database schema applied.
- CRM private file storage bucket created.
- Admin CRM dashboard deployed at `/crm/`.
- Admin CRM can review intake requests and convert them into clients.
- Admin CRM can import clients from CSV in the browser.
- psql installed and documented.
- CLI helpers created for client/progress/session/support/export/delete.
- CLI helpers added for CSV client import, full backup bundle, file links, client reports, and pending client portal access grant/list/revoke.
- Client portal skeleton deployed at `/portal/`.
- Client portal can update assigned progress item statuses.
- Client portal can add assigned progress items and support notes.
- Client portal can add file/project/screenshot/video links.
- Client portal can show session history and next actions without private notes.
- Client portal can open assigned private stored files through signed URLs.
- Client portal can claim pending access after the client's first magic-link login.
- Project status now includes live frontend asset versions and CRM data integrity checks.
- Supabase Auth redirect URLs include both `/crm/` and `/portal/`.
- `www.fanatic.space` redirects to `https://fanatic.space/` with a 301 for SEO consistency.
- Landing hero now uses a Lenovo-style technical workspace image.
- CRM shell now starts moving from generic client tracker toward teaching CRM: Today, Students, Tasks, Messages.

## Next practical steps

1. Confirm the latest Cloudflare Pages deploy after each push.
2. Keep improving the admin CRM until it can replace the spreadsheet.
3. Keep improving the client portal after the admin workflow is stable.
4. Test real client portal login when a real client email is ready.
5. Configure Supabase Google OAuth provider if social login should work in production.
6. Add Google Calendar integration after the CRM session workflow is stable.
7. Replace the phone/contact placeholder if a phone or messenger will be used.
8. Decide whether to add lightweight analytics.
9. Prepare 2-4 static ad images for ages 8-18 programming / AI / computer lessons after the core flow is stable.
10. Before May 2027, decide whether to renew `fanatic.space` or migrate to a cheaper domain.

## Fast form options

- Current choice: FormSubmit.
- Use Netlify Forms if deploying through Netlify.
- Use Tally if a polished form is needed with almost no coding.
- Supabase now stores intake requests; FormSubmit remains the email fallback.

## Domain email options

- Cloudflare Email Routing: simple forwarding, cheap, good enough at the start.
- Zoho Mail: proper mailbox, relatively cheap.
- Google Workspace: polished but more expensive.

## Rule for now

The first lead path works, so the next technical priority is CRM infrastructure:

visitor -> free 15-minute consultation request -> reply -> paid session.

Avoid spending more time on reply templates or sales playbooks for now. Rustam can adjust those later.
