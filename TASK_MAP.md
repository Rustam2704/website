# Task Map

Source: `instruction1.txt`

This file is the shared task map for the next product direction. It keeps the broad vision separate from the shorter operational checklists.

## 1. Landing And Auth

Done:

- Fix mobile hero/tool-cloud issue where tool tags could visually fall into the white page area.
- Replace the old Mac-style background with a Lenovo-style technical workspace.
- Add Google login UI.
- Configure Google OAuth provider in Supabase.
- Remove Apple login from the UI for now.

Current decision:

- GitHub login is not needed.
- Apple login is not worth doing if it requires the paid Apple Developer Program.
- Google login is the main social login target.

Still needed:

- Verify that Google login and email magic-link login return the user to the same Supabase account when the email address matches.
- Rotate the Google OAuth client secret later because it appeared in a setup screenshot.

## 2. Core CRM Direction

Problem:

- The CRM home currently should not answer only: "How many clients do I have and how do I add one?"
- It should answer first: "What do I need to do today?"

Done / started:

- The CRM is being repositioned as a teaching CRM.
- Dashboard now starts moving toward `Today`.
- Add student is moved into a modal instead of permanently occupying the page.
- Terminology is moving from `Clients` to `Students`.
- Quick `Add session` action exists.
- Secondary export/import/backup/sign-out actions are grouped under `Tools`.
- Student list supports status filter, area filter, and sorting.
- Add/edit forms are collapsed until needed.

Still needed:

- Make the daily dashboard truly useful:
  - upcoming lessons;
  - unconfirmed lessons;
  - overdue tasks;
  - unread messages;
  - students who have not received a response for too long.
- Keep refining the daily dashboard logic and selected-student workflow.

## 3. Google Calendar Integration

Goal:

- Connect the CRM to Google Calendar.
- Create a separate calendar named `fanatic.space` inside the connected Google account.
- Add lessons/events into that calendar directly from the CRM.
- Let the user enable/disable that calendar in Google Calendar normally.

Started:

- The CRM session form now has start date, start time, end date, end time, and repeat.

Still needed:

- Store calendar connection state.
- Request Google Calendar permissions.
- Create/find the `fanatic.space` calendar.
- Sync CRM sessions to Google Calendar events.
- Support repeat rules.
- Add confirmation status if needed.

## 4. Admin Dashboard

Target sections:

- `Today`
- `Upcoming sessions`
- `Needs attention`
- lower-priority stats: Total / Leads / Active / With support

Upcoming sessions should show:

- time;
- student name;
- lesson topic;
- `Open student`;
- `Start session`.

Needs attention should show:

- no next lesson;
- paid lessons running out;
- overdue task;
- student inactive for too long;
- missing summary after the last lesson.

Status:

- Basic `Today`, `Upcoming sessions`, and `Needs attention` sections exist.
- They are still shallow and need better data model support.

## 5. Students Page

Target:

- Use `Students`, not `Clients`, because most users are learners.

Desired table columns:

- Student
- Next session
- Current goal
- Last activity
- Progress
- Plan
- Notes

Controls:

- search;
- Active / Lead / Paused filter;
- area filter;
- sort by next session;
- `Add student` button.

Status:

- Add student modal exists.
- Search and status filter exist.
- Full table layout, area filter, and next-session sorting are still needed.

## 6. Student Page

Goal:

- This should become the main working screen for the teacher.

Header should show:

- student name;
- area / status / timezone;
- next session;
- completed sessions and remaining sessions.

Tabs:

- Overview
- Sessions
- Tasks
- Progress
- Notes
- Files
- Payments, only when needed

Overview should show only the important daily context:

- current goal;
- next lesson;
- active tasks;
- latest session summary;
- blockers;
- latest files and messages.

Status:

- Current selected-student panel exists.
- Full student page and focused Overview are still needed.
- Forms should not all be visible at once.

## 7. Student Portal

Goal:

- The portal should feel like a guided learning dashboard, not a database viewer.

Done / started:

- Start page is now `Student dashboard`.
- Navigation is now: Home, Tasks, Sessions, Progress, Files, Messages.
- `Support` is renamed to `Messages`.
- Home has Next lesson, Your next steps, Current goal, and Recent progress.

Still needed:

- Show better next lesson details.
- Add `Join lesson` / `View details`.
- Use the student's timezone.
- Make `Continue task` or `View next lesson` the clear primary action.

## 8. LMS-Lite Features

Desired, but only where they simplify teaching:

- tasks/homework with deadline;
- task status;
- teacher comment;
- attached materials;
- task templates;
- recurring learning goals;
- progress history;
- short summary after each lesson visible to teacher and student.

Later, not now:

- tests;
- shared material library;
- automatic assignment of materials.

Rule:

- Do not turn the system into a course builder before it is genuinely needed.

## 9. Visual Direction

Keep:

- calm style;
- low visual noise;
- restrained colors.

Improve:

- reduce oversized headings;
- reduce empty space;
- make action hierarchy clearer;
- move export/backup/sign out away from primary workflow;
- reduce nested borders;
- keep sidebar around 210-220px;
- add a persistent main action.

Status:

- Sidebar width reduced.
- Headings reduced somewhat.
- Some hierarchy improvements started.
- Export/backup/sign out still need to be moved.

## 10. Product Concept

Position the system as:

```text
A lightweight teaching CRM and student portal for individual learning.
```

The main object is:

```text
student -> current learning process -> next useful action
```

The system should stay practical and fast, not become a fake school platform.
