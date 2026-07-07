# www Domain Fix

Current production domain:

```text
https://fanatic.space/
```

Original issue:

```text
https://www.fanatic.space/
```

pointed to old GitHub Pages DNS and failed HTTPS.

## Preferred fix

In Cloudflare:

1. Open `Workers & Pages`.
2. Open project `fanatic-space`.
3. Go to `Custom domains`.
4. Add:

```text
www.fanatic.space
```

5. Let Cloudflare update DNS.
6. Required for SEO: add a Cloudflare Redirect Rule from `www` to apex:

```text
https://fanatic.space/
```

## Acceptance

- `https://www.fanatic.space/` does not show certificate errors.
- It redirects to `https://fanatic.space/` with status `301`.

## Current status

Cloudflare Pages custom domain is active for `www.fanatic.space`.

`https://www.fanatic.space/` serves the site cleanly.

Remaining SEO task:

- Add a Cloudflare Redirect Rule so the canonical public domain is only `https://fanatic.space/`.

Repository-level `_redirects` did not apply the host-level redirect reliably. Use a Cloudflare Redirect Rule:

```text
If hostname equals www.fanatic.space
Static redirect to https://fanatic.space/${path}
Status code 301
```

Exact Cloudflare UI path:

1. Open Cloudflare dashboard.
2. Open domain `fanatic.space`.
3. Go to `Rules`.
4. Open `Redirect Rules`.
5. Create rule.
6. Rule name:

```text
www to apex
```

7. If incoming requests match:

```text
Hostname equals www.fanatic.space
```

8. Then:

```text
Static redirect
URL: https://fanatic.space${uri.path}
Status code: 301
Preserve query string: enabled
```

9. Deploy rule.
