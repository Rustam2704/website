# Form Setup

The site uses Supabase for CRM intake records and FormSubmit for email delivery.

## Current behavior

Visitor submits the website form:

```text
fanatic.space form -> Supabase intake_requests
fanatic.space form -> FormSubmit -> direct@fanatic.space -> rustam.aleskerov7@gmail.com
```

The visitor does not need to open Gmail or any local mail app. A successful request is saved to
the CRM first, then forwarded by email as a backup notification.

Successful submissions redirect to:

```text
https://fanatic.space/thanks/
```

## Endpoint

```text
https://formsubmit.co/direct@fanatic.space
```

## Activation status

Status: activated and tested.

FormSubmit requires one first submission to activate the target email address. This has already been done.

Activation flow used:

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

## Gmail threading

FormSubmit sends messages from the same sender, so Gmail may group similar submissions.

The site script changes `_subject` before submit:

```text
Consultation: <name> / <area> / <timestamp>
```

This makes separate requests less likely to collapse into one Gmail conversation.

## Spam control

The form includes a hidden `_honey` field. Normal visitors will not fill it, but simple bots often do.

Captcha is disabled for now to reduce friction:

```text
_captcha=false
```
