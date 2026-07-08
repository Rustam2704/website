# Google OAuth Setup

Current decision: use Google as the only visible sign-in path for both `/crm/` and `/portal/`.

This keeps the login screen simple for clients and avoids Apple Developer Program cost. GitHub is also skipped because it is not useful for most students or parents.

## Supabase

Project: `fanatic-crm`

Provider:

- Authentication -> Sign In / Providers -> Google
- Enable Google
- Client ID: from the Google Cloud OAuth web client
- Client Secret: from the same Google Cloud OAuth web client
- Skip nonce checks: off
- Allow users without an email: off

Callback URL to register in Google Cloud:

```text
https://iavkvtkoowwkvizjpasy.supabase.co/auth/v1/callback
```

URL Configuration:

```text
Site URL:
https://fanatic.space

Redirect URLs:
https://fanatic.space/crm/
https://fanatic.space/portal/
```

## App Behavior

- CRM login sends the user to Google and returns to `https://fanatic.space/crm/`.
- Portal login sends the user to Google and returns to `https://fanatic.space/portal/`.
- The browser should show the normal Google account chooser when cached Google accounts exist.
- If the user is not signed into Google, Google shows its normal login screen.
- Apple and GitHub buttons are intentionally absent.
- Email magic links are not shown in the UI right now.

## Account Matching

The stable matching key is still email:

- CRM stores the student's email on the student record.
- CRM can grant portal access to that email before the student signs in.
- After the student signs in with Google, the portal claims pending access for the matching Google email.

This means the normal path is:

```text
Rustam creates student with email -> grants access -> student clicks Google -> portal opens the matching profile
```

## Later

- Rotate the Google OAuth client secret because it appeared in a setup screenshot.
- Add stronger account-linking rules only if real clients hit edge cases with changed emails or duplicate accounts.
- Keep Apple skipped unless there is a clear business reason to pay for Apple Developer Program.
