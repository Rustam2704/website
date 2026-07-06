# Cloudflare Pages Deployment

Goal: host `fanatic.space` on Cloudflare Pages instead of waiting for GitHub Pages HTTPS provisioning.

Status: active.

This is the preferred next move because:

- the domain is already registered in Cloudflare
- DNS is already managed in Cloudflare
- Cloudflare Pages provides HTTPS automatically
- the site is static and needs no build step

## Project settings

Repository:

```text
Rustam2704/website
```

Production branch:

```text
main
```

Build command:

```text
leave empty
```

Build output directory:

```text
/
```

Framework preset:

```text
None
```

## Custom domain

Use:

```text
fanatic.space
```

Optional later:

```text
www.fanatic.space
```

## After Cloudflare Pages works

FormSubmit redirect in `index.html` should be:

```text
_next=https://fanatic.space/thanks/
```

This is now configured.

## GitHub Pages fallback

GitHub Pages is still configured, but HTTPS certificate provisioning is delayed.

If Cloudflare Pages works, GitHub Pages becomes only a fallback and can be ignored.
