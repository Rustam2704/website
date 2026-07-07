# Rustam "fanatic" Alieskerov Website

Public landing page and future client system for direct technical coaching.

Live site: https://fanatic.space/  
Repository: https://github.com/Rustam2704/website

---

## 1. Project Goal

Create a fast, serious, low-friction online presence for Rustam Alieskerov's direct consulting and coaching work.

The site should sell a simple path:

```text
visitor -> free 15-minute consultation -> fit check -> paid 50-minute session
```

The project must eventually grow into a lightweight client CRM where clients can log in, upload progress, track work, and later use a small Android monitoring app.

---

## 2. Current Offer

Name / positioning:

- Rustam "fanatic" Alieskerov
- Direct technical coaching for serious learners
- Respectful, direct, practical approach
- Focus on result, not luxury-service theatrics

Areas:

- Teaching and mentorship for technical skills
- Technical advice and support when the problem is unclear
- Computer administration and workspace setup
- Creative and engineering tools as needed
- Process organization and prioritization
- Broad technical support across practical software and workflow problems

Example background tools:

- Blender, Godot, Unreal Engine, Unity, Git, Windows, Linux, Python, AI tools, VS Code, OBS, Figma, Notion, networks, hardware, pipelines, automation, debugging

Pricing:

- Free consultation: 15 minutes
- Session only: $100 for 50 minutes
- Session plus support: $130 for 50 minutes plus small questions during the week

Credibility:

- 12 years of technical education experience
- Existing online school: https://portal.zt.ua
- This offer is direct work with Rustam, not delegated school classes

---

## 3. Current Status

Done:

- Static landing page created.
- Hero image generated and stored locally.
- Git repository initialized.
- Project pushed to GitHub.
- GitHub Pages enabled as fallback.
- Domain purchased: `fanatic.space`.
- Production URL is live on Cloudflare Pages: `https://fanatic.space/`.
- `www.fanatic.space` redirects to `https://fanatic.space/` with a 301 for SEO consistency.
- Domain expires: July 6, 2027.
- Renewal price: $250.20/year.
- Auto-renew is currently off.
- Basic SEO metadata added.
- Favicon, sitemap, robots.txt, and 404 page added.
- Static form submission moved from `mailto` to FormSubmit.
- Landing form also writes intake requests into Supabase.
- FormSubmit activated and tested.
- Admin CRM deployed at `/crm/` and connected to Supabase.
- Client portal deployed at `/portal/` and connected to Supabase.
- Client portal can add progress, support notes, file links, and see safe session history.
- Admin CRM can import clients from CSV in the browser.
- CLI helpers support CSV import from the current spreadsheet, full backup bundles, client reports, file links, and pending portal access grant/list/revoke.
- Roadmap file created.
- Immediate launch checklist created.

Files:

- `index.html` - page structure and copy
- `styles.css` - visual design
- `script.js` - form behavior
- `assets/lenovo-technical-hero.png` - current Lenovo-style generated hero image
- `assets/online-tutoring-hero.png` - previous generated hero image kept as fallback
- `assets/favicon.svg` - simple favicon
- `robots.txt` - search crawler instructions
- `sitemap.xml` - public sitemap
- `404.html` - GitHub Pages not-found page
- `privacy.html` - short privacy note for the contact form
- `ROADMAP.md` - future CRM and Android plan
- `NEXT_STEPS.md` - immediate launch checklist
- `EMAIL_SETUP.md` - Cloudflare Email Routing setup notes
- `FORM_SETUP.md` - contact form backend setup notes
- `GMAIL_FILTER.md` - Gmail spam/filter setup notes
- `LAUNCH_QA.md` - public launch QA checklist
- `CLOUDFLARE_PAGES.md` - Cloudflare Pages deployment notes
- `CRM_SPEC.md` - first scoped CRM/product spec
- `CRM_SETUP.md` - Supabase setup path for CRM v0
- `DB_ACCESS.md` - psql / Supabase database access notes
- `supabase_schema.sql` - first CRM database schema
- `supabase_storage.sql` - private Supabase Storage bucket and policies
- `supabase_client_portal.sql` - client access mapping and read policies
- `crm/` - admin CRM web dashboard
- `portal/` - client portal
- `INTAKE_PLAYBOOK.md` - lead qualification and consultation workflow
- `REPLY_TEMPLATES.md` - email replies for new leads
- `DOMAIN_WWW_FIX.md` - completed `www.fanatic.space` DNS/redirect notes
- `PROJECT_STATUS.md` - concise current status and next actions
- `MORNING_HANDOFF.md` - current handoff snapshot after autonomous setup work

---

## 4. Current Constraints

Primary constraint:

- Move fast and avoid overbuilding. The user has been stuck for more than a year, so momentum matters more than perfect infrastructure.

Business constraints:

- The site must look serious, direct, and competent.
- It should not look overly elite or service-heavy.
- The copy should filter for strict, serious clients.
- The first consultation must be free because clients often cannot clearly define their technical problem.

Technical constraints:

- Current site is static HTML/CSS/JS.
- Current production hosting is Cloudflare Pages.
- GitHub Pages remains configured as fallback.
- GitHub Pages does not process form submissions by itself.
- The current form uses FormSubmit and forwards submissions to `direct@fanatic.space`.
- Form submissions are confirmed to arrive in Gmail through Cloudflare Email Routing.
- The form sets a unique subject before submit so Gmail does not merge all requests into one thread.
- Tally, Netlify Forms, or Supabase can replace FormSubmit later if needed.
- CRM should stay focused on replacing the spreadsheet before adding complex product features.

Data / future portability constraints:

- Future CRM should use ordinary database tables where possible.
- Avoid deep vendor lock-in.
- Supabase is acceptable for the first CRM because it uses PostgreSQL and can export data.
- Keep CSV export as a safety valve.
- Keep SQL dumps and backup bundles available so the database can move away from Supabase later.

---

## 5. Immediate Next Tasks

Highest priority:

1. Confirm Cloudflare Pages deploys after each push.
2. Keep improving the Supabase-backed CRM until it can replace the spreadsheet.
3. Test the client portal with a real invited client account when a real client email is ready.
4. Keep the CRM and portal readable, simple, and portable instead of adding heavy product ceremony.
5. Configure Supabase Google and Apple OAuth providers if social login should work in production.
6. Add Google Calendar integration only after the teaching CRM session workflow is stable.
7. Replace the phone/contact placeholder if a phone or messenger will be used.

Nice but not blocking:

- Add a real photo or stronger technical workspace image.
- Add a compact credibility section for portal.zt.ua.
- Add one or two short testimonials or proof points.
- Prepare 2-4 static ad images later for online lessons for ages 8-18: programming, AI tools, and practical computer directions.

Detailed checklist: `NEXT_STEPS.md`

---

## 6. Future Plan

Phase 1: Landing page and lead capture

- Finish domain and email.
- Make the consultation request path work reliably.
- Keep the site simple.

Phase 2: Minimal client CRM

- Admin dashboard is deployed at `/crm/`.
- CRM is being repositioned as a lightweight teaching CRM: dashboard first, students second.
- Supabase project URL and publishable key are configured in `crm/config.js`.
- Admin login is working.
- Client portal is deployed at `/portal/`.
- Client profiles, session logs, progress statuses, support notes, file/link records, CSV export, and JSON backup are implemented in the CRM.
- Client portal can show assigned profile/progress/sessions/files and can add progress/support/file-link updates.

Likely stack:

- Supabase auth
- Supabase Postgres
- Supabase Storage
- Simple responsive web dashboard

Phase 3: Android monitoring app

- Small companion app, not full rewrite.
- View clients.
- Add quick notes.
- Update progress.
- Check uploads and support questions.

Detailed roadmap: `ROADMAP.md`

---

## 7. Local Development

Start local server:

```powershell
python -m http.server 4173 --bind 127.0.0.1
```

Open:

```text
http://127.0.0.1:4173
```

Git path on this machine if `git` is not available in the current terminal:

```text
C:\Program Files\Git\cmd\git.exe
```

---

## 8. Operating Rule

The first commercial path should stay simple:

```text
public site -> consultation request -> reply -> paid session
```

Now that the page, domain, email routing, and form are working, the next real technical work is CRM infrastructure. Avoid spending more time on playbooks, reply templates, or extra sales text unless they unblock the technical setup.
