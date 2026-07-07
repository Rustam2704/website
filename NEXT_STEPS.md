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
- `direct@fanatic.space` receives routed email.
- The site has a short privacy note for form submissions.
- Intake and reply templates are documented.
- Supabase project `fanatic-crm` created.
- CRM database schema applied.
- CRM private file storage bucket created.
- Admin CRM dashboard deployed at `/crm/`.
- psql installed and documented.
- CLI helpers created for client/progress/session/support/export/delete.
- Read-only client portal skeleton deployed at `/portal/`.

## Next practical steps

1. Confirm the latest Cloudflare Pages deploy after each push.
2. Keep `www.fanatic.space` active, then add an apex redirect later for SEO consistency.
3. Keep improving the admin CRM until it can replace the spreadsheet.
4. Add `https://fanatic.space/portal/` to Supabase Auth redirect URLs before real client portal testing.
5. Replace the phone/contact placeholder if a phone or messenger will be used.
6. Decide whether to add lightweight analytics.
7. Before May 2027, decide whether to renew `fanatic.space` or migrate to a cheaper domain.

## Fast form options

- Current choice: FormSubmit.
- Use Netlify Forms if deploying through Netlify.
- Use Tally if a polished form is needed with almost no coding.
- Use Supabase later when the CRM starts.

## Domain email options

- Cloudflare Email Routing: simple forwarding, cheap, good enough at the start.
- Zoho Mail: proper mailbox, relatively cheap.
- Google Workspace: polished but more expensive.

## Rule for now

The first lead path works, so the next technical priority is CRM infrastructure:

visitor -> free 15-minute consultation request -> reply -> paid session.

Avoid spending more time on reply templates or sales playbooks for now. Rustam can adjust those later.
