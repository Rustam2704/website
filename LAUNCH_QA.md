# Launch QA

Use this checklist after every meaningful site change.

## Public site

- `https://fanatic.space/` loads.
- `https://www.fanatic.space/` redirects to `https://fanatic.space/`.
- Hero image loads.
- Form is visible.
- Privacy note opens.
- Pricing is correct:
  - `$100` session only
  - `$130` session plus support
- Contact email is `direct@fanatic.space`.
- `/thanks/` loads.

## Form

- Submit a test request.
- User is redirected to the thank-you page.
- Email arrives in Gmail.
- Message is not stuck in Spam, or is marked as Not Spam.
- The submitted email address is visible for reply.

## DNS / Email

- `fanatic.space` has GitHub Pages A records.
- `www.fanatic.space` points to `Rustam2704.github.io`.
- MX records point to Cloudflare Email Routing.
- SPF includes Cloudflare Email Routing.

## HTTPS

Production hosting: Cloudflare Pages with Cloudflare-managed HTTPS.

When ready:

- `https://fanatic.space/` loads.
- Hosting provider has HTTPS enabled.
- `_next` in `index.html` uses `https://fanatic.space/thanks/`.
- canonical / sitemap should already use `https://fanatic.space/`.
