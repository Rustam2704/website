# www Domain Fix

Current production domain:

```text
https://fanatic.space/
```

Current issue:

```text
https://www.fanatic.space/
```

still points to old GitHub Pages DNS and fails HTTPS.

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
6. If offered, redirect `www` to apex:

```text
https://fanatic.space/
```

## Acceptance

- `https://www.fanatic.space/` does not show certificate errors.
- It either serves the site or redirects to `https://fanatic.space/`.

## Current status

Tracked in GitHub issue #8.
