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
6. Optional: add a Cloudflare Redirect Rule from `www` to apex:

```text
https://fanatic.space/
```

## Acceptance

- `https://www.fanatic.space/` does not show certificate errors.
- It either serves the site or redirects to `https://fanatic.space/`.

## Current status

Cloudflare Pages custom domain is active for `www.fanatic.space`.

`https://www.fanatic.space/` serves the site cleanly.

Repository-level `_redirects` did not apply the host-level redirect reliably. Use a Cloudflare Redirect Rule if canonical `www -> apex` redirect is required:

```text
If hostname equals www.fanatic.space
Static redirect to https://fanatic.space/${path}
Status code 301
```
