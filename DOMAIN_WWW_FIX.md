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

`https://www.fanatic.space/` redirects to `https://fanatic.space/` with status `301`.

The implemented Cloudflare Page Rule is:

```text
URL match: www.fanatic.space/*
Setting: Forwarding URL
Status code: 301 - Permanent Redirect
Destination: https://fanatic.space/$1
```

Verification:

```text
https://www.fanatic.space/test-path?x=1
-> 301
-> https://fanatic.space/test-path?x=1
```
