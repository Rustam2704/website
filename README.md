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

- Blender
- Godot
- Unreal Engine
- Unity
- Computer administration and workspace setup
- Process organization and prioritization
- Broad technical support when the exact problem is unclear

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
- GitHub Pages enabled.
- Domain purchased: `fanatic.space`.
- Public URL is being moved to `https://fanatic.space/`.
- Domain expires: July 6, 2027.
- Renewal price: $250.20/year.
- Auto-renew is currently off.
- Basic SEO metadata added.
- Favicon, sitemap, robots.txt, and 404 page added.
- Static form submission moved from `mailto` to FormSubmit.
- FormSubmit activated and tested.
- Roadmap file created.
- Immediate launch checklist created.

Files:

- `index.html` - page structure and copy
- `styles.css` - visual design
- `script.js` - form behavior
- `assets/online-tutoring-hero.png` - generated hero image
- `assets/favicon.svg` - simple favicon
- `robots.txt` - search crawler instructions
- `sitemap.xml` - public sitemap
- `404.html` - GitHub Pages not-found page
- `ROADMAP.md` - future CRM and Android plan
- `NEXT_STEPS.md` - immediate launch checklist
- `EMAIL_SETUP.md` - Cloudflare Email Routing setup notes
- `FORM_SETUP.md` - contact form backend setup notes

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
- Current hosting is GitHub Pages.
- GitHub Pages does not process form submissions by itself.
- The current form uses FormSubmit and forwards submissions to `direct@fanatic.space`.
- Form submissions are confirmed to arrive in Gmail through Cloudflare Email Routing.
- Tally, Netlify Forms, or Supabase can replace FormSubmit later if needed.
- CRM should not be built until the lead path works.

Data / future portability constraints:

- Future CRM should use ordinary database tables where possible.
- Avoid deep vendor lock-in.
- Supabase is acceptable for the first CRM because it uses PostgreSQL and can export data.
- Keep CSV export as a safety valve.

---

## 5. Immediate Next Tasks

Highest priority:

1. Finish DNS connection for `fanatic.space`.
2. Enable HTTPS in GitHub Pages after DNS is verified.
3. Create domain email routing for `direct@fanatic.space`.
4. Confirm `direct@fanatic.space` forwards to Rustam's working inbox.
5. Replace the phone placeholder in `index.html`.
6. Enable HTTPS in GitHub Pages after the certificate is ready.

Nice but not blocking:

- Add a real photo or stronger technical workspace image.
- Add a compact credibility section for portal.zt.ua.
- Add one or two short testimonials or proof points.

Detailed checklist: `NEXT_STEPS.md`

---

## 6. Future Plan

Phase 1: Landing page and lead capture

- Finish domain and email.
- Make the consultation request path work reliably.
- Keep the site simple.

Phase 2: Minimal client CRM

- Admin login.
- Client login.
- Client profiles.
- Session logs.
- Progress statuses.
- File / link uploads.
- Support thread for $130 plan.
- CSV export.

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

Do not build the CRM, Android app, payments, or complex automation before the first commercial path works:

```text
public site -> consultation request -> reply -> paid session
```

This project should reduce friction, not create a new reason to avoid launch.
