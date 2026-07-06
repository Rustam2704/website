# Product Roadmap

## Phase 1: Landing page and lead capture

Status: in progress

- Static landing page with clear positioning.
- Free 15-minute consultation request form.
- Two plans: $100 session only, $130 session plus weekly support.
- Deploy to Netlify or similar static hosting.
- Add domain and domain email.

## Phase 2: Minimal client CRM

Goal: replace the current spreadsheet with a simple, respectable client portal without overbuilding.

Core features:

- Admin login for Rustam.
- Client login.
- Client profile: name, contact, area, plan, time zone, current goal.
- Session log: date, topic, notes, homework / next actions.
- Progress tracker: simple statuses such as blocked, in progress, improved, done.
- Client uploads or links: screenshots, project files, videos, documents.
- Support thread for small between-session questions on the $130 plan.
- Export data to CSV so the system never traps the business.

Recommended first implementation:

- Supabase for auth, database, file storage.
- Simple web app dashboard.
- Keep the spreadsheet as backup until the CRM feels stable.

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
- Wrap or rebuild only the small monitoring surface for Android after the CRM workflow is proven.

## Current principle

The CRM should make the work look organized without adding ceremony. The product exists to track real progress, not to simulate a larger school platform.
