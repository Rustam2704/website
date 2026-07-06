# Gmail Filter

Goal: keep real consultation requests out of Spam.

## Why this matters

The first forwarded email from `direct@fanatic.space` may land in Spam because:

- the domain is new
- mail is forwarded through Cloudflare
- FormSubmit sends on behalf of a form endpoint

This is normal at launch, but Gmail should be trained immediately.

## First action

When a real/test request appears in Spam:

1. Open the message.
2. Click `Not spam`.
3. If Gmail asks whether similar messages should be trusted, confirm.

## Recommended filter

Create a Gmail filter:

Search query:

```text
to:direct@fanatic.space OR "New consultation request from fanatic.space"
```

Actions:

- Never send it to Spam
- Mark as important
- Apply label: `fanatic.space`

Optional:

- Forward to another backup inbox later

## What not to do yet

Do not set up complex outbound branded email until the first lead flow is stable.

Receiving requests is enough for launch.
