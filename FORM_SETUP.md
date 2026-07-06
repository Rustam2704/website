# Form Setup

The site uses FormSubmit for the first real contact form.

## Current behavior

Visitor submits the website form:

```text
fanatic.space form -> FormSubmit -> direct@fanatic.space -> rustam.aleskerov7@gmail.com
```

The visitor does not need to open Gmail or any local mail app.

## Endpoint

```text
https://formsubmit.co/direct@fanatic.space
```

## First activation

FormSubmit requires one first submission to activate the target email address.

Expected flow:

1. Submit a test form on the public site.
2. FormSubmit sends an activation email to `direct@fanatic.space`.
3. Cloudflare Email Routing forwards it to Gmail.
4. Open the activation email and confirm.
5. Submit another test form.

## Spam note

Because `fanatic.space` is new and forwarded mail often looks unusual to Gmail, first messages may land in Spam.

After receiving a valid test message:

- mark it as "Not spam"
- optionally create a Gmail filter for mail sent to `direct@fanatic.space`

## Why the form still asks for email

The visitor's email is needed for reply and qualification. It is included in the submission and copied into the `_replyto` field before submit.

Rustam can reply using the email address provided in the form.
