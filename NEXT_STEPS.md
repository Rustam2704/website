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
- psql installed and documented.
- CLI helpers created for client/progress/session/support/export/delete.
- Client portal skeleton deployed at `/portal/`.
- Client portal can update assigned progress item statuses.
- Client portal can add assigned progress items and support notes.

## Next practical steps

1. Confirm the latest Cloudflare Pages deploy after each push.
2. Keep `www.fanatic.space` active, then add an apex redirect later for SEO consistency.
3. Keep improving the admin CRM until it can replace the spreadsheet.
4. Add `https://fanatic.space/portal/` to Supabase Auth redirect URLs before real client portal testing.
5. Replace the phone/contact placeholder if a phone or messenger will be used.
6. Decide whether to add lightweight analytics.
7. Prepare 2-4 static ad images for ages 8-18 programming / AI / computer lessons after the core flow is stable.
8. Before May 2027, decide whether to renew `fanatic.space` or migrate to a cheaper domain.

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
