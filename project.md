# Project: FMF Trust Management System

## Overview

Internal web application for **Free Mind Foundation (FMF)**, a Kerala-based preventive mental wellness NGO/trust, to manage members, volunteers, donations (with 80G receipts), meeting minutes, committees/departments, and events. Fresh build, no legacy data migration.

Two portals within one app:
- **Admin Portal** — internal staff, role-based access, full CRUD across all modules
- **Volunteer Portal** — approved volunteers only, self-service, limited to their own data

Members never get login accounts. This is an internal tool — no public-facing signup.

---

## Tech Stack

- **Framework**: Next.js (React, App Router), single codebase for frontend + API routes
- **Database**: MySQL
- **ORM**: Prisma
- **Auth**: NextAuth.js (or JWT + bcrypt) — two auth contexts: Admin (role-based) and Volunteer (self-service, restricted)
- **UI Library**: **Material UI (MUI v5+)** — see UI Design section below, this is a hard requirement
- **PDF generation**: server-side (e.g. `pdf-lib` or `@react-pdf/renderer`) for 80G receipts and finalized meeting minutes
- **Email**: pluggable provider, config-driven (not hardcoded to one vendor) — start with **Brevo** (300/day free tier) or **Resend** (3,000/month free tier); used for volunteer invite links and optionally receipt emails
- **Deployment target**: deployed manually by the client to their own server (Node.js runtime + MySQL instance). Codebase should build and run cleanly with standard `next build` / `next start` — no containerization required.
- **Domain**: admin.freemindfoundation.org.in (informational — not needed for local dev)

---

## UI Design Requirements

**Simple and minimalistic, following Material Design.**

- Use **MUI (Material UI)** components throughout — do not hand-roll custom component primitives (buttons, inputs, tables, dialogs, nav) when an MUI equivalent exists.
- Layout: generous white space, clean typography (Roboto, MUI default), minimal shadows/elevation — flat and calm, not skeuomorphic or heavy.
- **Color palette**: primary = teal/green (matches FMF brand identity), neutral greys for backgrounds/surfaces, avoid clutter or saturated accent overload.
- **Navigation**: persistent left sidebar (MUI Drawer) for Admin Portal with module icons + labels; simpler top app bar for the Volunteer Portal (fewer destinations).
- **Data-heavy screens** (member/volunteer/donation lists): MUI `DataGrid` or `Table` with sorting, filtering, pagination — keep columns minimal by default with an "expand for details" pattern rather than dense wide tables.
- **Forms**: MUI form components, clear field grouping, inline validation, stepper component (`MUI Stepper`) for the multi-stage Volunteer Onboarding flow specifically.
- **Dashboard**: MUI `Card` components in a responsive grid for KPI summaries; simple charts (bar/line) using a lightweight library (e.g. Recharts) styled to match the MUI theme, not overly decorative.
- **Dialogs/confirmations**: MUI `Dialog` for create/edit/delete actions — no browser-native `confirm()`/`alert()`.
- **Responsive**: usable on tablet/desktop for admin (assume desk-based staff use); Volunteer Portal should be mobile-friendly since volunteers will likely check it on their phones.
- **Dark mode**: not required for v1 — light theme only, keep it simple.

---

## Users & Roles

| Role | Portal | Access |
|---|---|---|
| Super Admin | Admin | Full access to everything, incl. Settings & user/role management |
| Program Admin | Admin | Full: Members, Volunteers, Committees, Events. View-only: Donations |
| Finance Admin | Admin | Full: Donations & 80G receipts. View-only: everything else |
| Committee Secretary | Admin | Full: Meeting Minutes. View-only: Committees |
| Data Entry Staff | Admin | Add/Edit only on Members & Volunteers (no delete) |
| Auditor | Admin | View-only across all modules |
| Volunteer | Volunteer Portal | Own profile, own hours log, own assigned events only |

All create/edit/delete actions must be recorded in an audit log (user, action, entity, timestamp).

---

## Modules

### 1. Member Registration (simple, no approval)
Fields: name, phone, email, address, join date, membership type/tier, notes.
No approval step — record is `Active` on creation. No login account.

### 2. Volunteer Registration & Onboarding (multi-step approval)
5-stage pipeline, each stage has status (`Pending/In Progress/Passed/Failed`) + timestamp:
1. Application — name, contact, address, skills/interests tags, availability, motivation
2. Document/ID Verification — ID reference, certificates, verified by Program Admin
3. Interview — date, interviewer, outcome notes
4. Training — sessions attended, completion status
5. Approved — auto-creates volunteer login account, auto-sends password-setup invite email

Rejectable at any stage (reason logged, record retained, not deleted).

Volunteer Portal capabilities: view/edit own profile, log hours (date, activity, hours), view assigned events/tasks.

### 3. Donations & 80G Receipts
Fields: donor name, contact, PAN, address, amount, date, payment mode, tier/purpose, auto-generated sequential receipt number (FY-wise, e.g. `FMF/2026-27/0001`), linked donor record if applicable, status.

80G PDF receipt auto-generated on donation entry, pulling trust legal details from the **Settings** module (not hardcoded): trust name, registered address, 80G number, 80G validity, PAN, authorized signatory.

### 4. Meeting Minutes
Fields: meeting type (Board/Committee/General Body/Ad-hoc), date/time/location, attendees + absentees, agenda items with notes, decisions, action items (owner, due date, status), minute status (`Draft → Under Review → Finalized`, locked once finalized, addendum-only after).

### 5. Committee / Department Management
Fully dynamic — no fixed/hardcoded list of committees. Super Admin creates/renames/archives committees or departments directly in-app.
Fields: name, purpose, members (linked, each with designation + term start/end), term status (auto-flag `Expired`), linked meetings.

### 6. Events & Calendar
Fields: name, type, date/time, location/online link, description, status (`Planned/Ongoing/Completed/Cancelled`).
Assignments: volunteers/committee members with role (Lead/Support) + optional task description.
Calendar view (month/week), filterable. Feeds Volunteer Portal's assigned-events view and can pre-fill hours-log entries.

### 7. Settings & Organization Configuration
Super Admin only. Trust/legal details (name, address, 80G number & validity with expiry reminder, PAN, FCRA number if applicable, signatory name), branding (logo, PDF letterhead), financial year settings (FY start month, receipt numbering format), email provider config (API key, provider choice), user & role management.

### 8. Dashboard
KPI cards: active members/volunteers, new this month, volunteer pipeline snapshot, donations this month/quarter with 80G receipts issued count, upcoming events, overdue meeting action items, committees with expiring terms, 80G validity expiry warning, recent activity feed.

---

## Permission Matrix

| Module | Super Admin | Program Admin | Finance Admin | Committee Secretary | Data Entry | Auditor | Volunteer |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Members | Full | Full | View | View | Add/Edit | View | — |
| Volunteers | Full | Full | View | View | Add/Edit | View | Own only |
| Donations & 80G | Full | View | Full | View | — | View | — |
| Meeting Minutes | Full | Edit | View | Full | — | View | — |
| Committees | Full | Full | View | View | — | View | — |
| Events & Calendar | Full | Full | View | View | — | View | Own assigned |
| Settings | Full | — | — | — | — | — | — |

---

## Build Roadmap

1. **Foundation**: Auth (admin roles + volunteer accounts), DB schema (Prisma), MUI theme setup (teal/green Material Design), navigation shells for both portals, Settings module
2. **Core Records**: Member Registration, Volunteer Onboarding pipeline (with Stepper UI)
3. **Donations & 80G**: Donation entry, sequential receipts, PDF generation & email, pulling from Settings
4. **Governance**: Meeting Minutes, dynamic Committee/Department Management
5. **Events & Calendar**: Event CRUD, assignment, calendar view, hours-log linkage
6. **Volunteer Portal**: Self-service profile, hours logging, assigned events view
7. **Dashboard, Reports & Polish**: KPI dashboard, CSV exports, audit log view, expiry alerts

---

## Notes for the Agent

- No public signup or public-facing pages — this is 100% internal/authenticated.
- No data migration needed — schema can be designed fresh without legacy constraints.
- Deployment is handled manually by the client on their own server — no Docker/containerization needed, just a clean, standard `next build` / `next start` setup with clear `.env` configuration for MySQL and email provider credentials.
- Keep committee/department entities fully dynamic (DB-driven, not enum/hardcoded).
- Keep the email provider abstracted behind a single interface so switching Brevo ↔ Resend later is a config change, not a code change.
- Follow Material Design conventions throughout via MUI — avoid custom-styled components that diverge from MUI's default look and feel unless necessary for brand color application.
