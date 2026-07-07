# Product Roadmap

## Phase 1: Landing page, deploy, and lead capture

Status: in progress

- Static landing page with clear positioning.
- Free 15-minute consultation request form.
- Two plans: $100 session only, $130 session plus weekly support.
- Deploy through Cloudflare Pages.
- Add domain and domain email.
- Redirect `www.fanatic.space` to `fanatic.space` for SEO consistency. Done.
- Replace the old Mac-style hero with a Lenovo-style technical workspace. Done.

Important rule:

- Do not spend time on playbooks, reply templates, or extra sales documents until the technical infrastructure is moving.

## Phase 2: Minimal client CRM

Status: in progress

Goal: replace the current spreadsheet with a simple, respectable client portal without overbuilding.

Product direction: a lightweight teaching CRM and student portal for individual learning.

Detailed first scope: `CRM_SPEC.md`

Core features:

- Admin login for Rustam. Done.
- Client login. Prepared at `/portal/`; real client access records are added when a real client email is ready.
- Student profile: name, contact, area, plan, time zone, current goal. Done.
- Session log: start/end style form, topic, notes, summary / next actions. In progress.
- Task/progress tracker: simple statuses such as blocked, in progress, improved, done. In progress.
- Client uploads or links: screenshots, project files, videos, documents. Admin upload/link done.
- Support thread for small between-session questions on the $130 plan. Admin notes and client support notes are implemented.
- Export data to CSV so the system never traps the business. Done via CLI and browser JSON backup.

Recommended first implementation:

- Supabase for auth, database, file storage. Done.
- Simple web app dashboard. In progress and deployed at `/crm/`.
- Keep the spreadsheet as backup until the CRM feels stable.

Upcoming integration:

- Google / Apple auth buttons are present in the UI.
- Supabase OAuth providers must be configured before production social login works.
- Google Calendar integration should create/use a separate `fanatic.space` calendar and sync session events after the session workflow is stable.

Avoid in version 1:

- Complex analytics.
- Gamification.
- Payment automation.
- Full messaging platform behavior.
- Too many progress metrics.

## Phase 3: Android monitoring app

Goal: a small companion app for monitoring and small edits, not a full product rewrite.

Core features:

- Login.
- Client list.
- Quick progress status update.
- Add short note after a session.
- View recent client uploads and questions.
- Push notifications later, only if useful.

Recommended first implementation:

- Start with a responsive web dashboard that works well on mobile.
- CRM is being made installable as a PWA first, which is the fastest Android-like monitoring path.
- Wrap or rebuild only the small monitoring surface for Android after the CRM workflow is proven.

## Later: Static Ad Creatives

Goal: prepare a few simple static ad images for online lessons aimed at parents / children ages 8-18.

Scope:

- Programming lessons.
- AI tools and practical computer skills.
- Other computer directions as needed.
- 2-4 static images for tests.

Do later, after the site and first CRM path are working.

## Current principle

The CRM should make the work look organized without adding ceremony. The product exists to track real progress, not to simulate a larger school platform.
