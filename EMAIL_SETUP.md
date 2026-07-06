# Email Setup

Goal: make `direct@fanatic.space` receive consultation requests.

## Recommended first setup

Use Cloudflare Email Routing.

This creates a professional domain email address and forwards incoming mail to Rustam's existing inbox. It is enough for launch.

## Address

Use:

```text
direct@fanatic.space
```

Later optional addresses:

```text
hello@fanatic.space
rustam@fanatic.space
```

## Cloudflare steps

1. Open Cloudflare.
2. Select `fanatic.space`.
3. Go to Email / Email Routing.
4. Add destination address: Rustam's real working inbox.
5. Open the verification email in that inbox and confirm it.
6. Create routing rule:

```text
Custom address: direct@fanatic.space
Action: Send to verified destination address
```

7. Optional: enable catch-all forwarding later, but not required for launch.

## Important limitation

Cloudflare Email Routing receives and forwards email. It does not automatically make Gmail send outgoing mail as `direct@fanatic.space`.

For launch this is acceptable:

- Client writes to `direct@fanatic.space`.
- Rustam receives it in his normal inbox.
- Rustam can reply from the normal inbox at first.

Later, if outgoing branded email matters, use one of:

- Zoho Mail
- Google Workspace
- SMTP provider connected to Gmail

## Site status

The website form already points to:

```text
direct@fanatic.space
```
