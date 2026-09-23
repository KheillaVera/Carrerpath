# PathAura

> From learning a skill to getting work.

A digital platform that helps students, graduates and skilled youth in Rwanda move from
learning skills into internships, jobs and career development opportunities — while giving
employers structured evidence of what candidates can actually do.

**This repository is currently at the end of Phase 7 (Matching engine).** See "Roadmap" below.

---

## Why this exists

Many young people learn skills but struggle to convert those skills into employment. They
don't always know which roles they qualify for, which skills employers actually want, what
they're missing, or how to prove what they can do. Employers, in turn, struggle to identify
candidates by real capability rather than by CV alone.

PathAura is **not another job board**. Its signature loop is:

**Skills → Evidence → Matching → Skill gaps → Learning → Opportunity → Employment outcome.**

For each user the platform is designed to answer:

- What can I do?
- What am I missing?
- What should I learn next?
- Which opportunities fit me?
- How do I prove my skills?
- Did this platform actually help me get work?

## Signature features (by the end of the build)

- Structured skill profile (skills + assessments + projects + certifications + experience).
- Transparent match scores between profile and opportunity (matched skills, gaps, strengths).
- Skill-gap analysis against a target role.
- Personalized career roadmap with recommended next skills and projects.
- Employer candidate dashboard that surfaces real evidence, not just CVs.
- Employment outcome tracking (applied → interviewed → hired → retained).

## Technology stack

- **Frontend** — React + Vite + Tailwind, React Router, React Hook Form, Axios, Lucide, Recharts.
- **Backend** — Node.js + Express, JWT auth, bcrypt, express-validator, Helmet, CORS, rate limiting.
- **Database** — MySQL (relational, with FKs, indexes, unique constraints, timestamps).

## Repository layout

```
client/    React + Vite + Tailwind SPA
server/    Node.js + Express REST API
```

Each side has its own `package.json`, `.env.example` and folder structure. See spec section 6 for
the intended module layout.

## Getting started

### Requirements

- Node.js 22+ (developed with Node 24) and npm 10+. SQLite is built into Node, so
  local development needs nothing else installed.
- MySQL 8.x only for production, or if you set `DB_CLIENT=mysql` locally.

### 1. Install dependencies (once)

```bash
npm run setup          # installs both server and client
```

### 2. Create the database (once)

Local development uses **SQLite**, which runs inside the API process — there is no
database server to install or start, and nothing for the operating system to kill when
memory is tight. The file lives at `server/data/pathaura.sqlite` and is gitignored.

```bash
cp server/.env.example server/.env   # then set a JWT secret
npm run db:reset                     # creates the schema and seeds demo data
```

### 3. Run the whole platform

```bash
npm start
```

That one command starts the API and the web app together, labels their output
(`api |` / `web |`), and stops both on Ctrl+C. On Windows you can also double-click
`start.cmd` in the project root.

Then open **http://localhost:5173**.

| Email | Password | Role |
| --- | --- | --- |
| `seeker@demo.rw` | `Demo1234` | Job seeker |
| `employer@demo.rw` | `Demo1234` | Employer |
| `admin@demo.rw` | `Demo1234` | Administrator |

If a previous run was closed abruptly and a port is still held, `npm run stop` frees
ports 4000 and 5173. To run only one side, `npm run api` and `npm run web` still work.

**Production uses MySQL.** Set `DB_CLIENT=mysql` in `.env` along with the `DB_HOST`
settings, and the same commands apply the migrations in
`server/src/database/migrations/`. Application code never branches on the database:
`server/src/config/db.js` selects a driver and both expose the same interface, with
`server/src/config/db/sqlDialect.js` translating the MySQL dialect the queries are
written in.

## Design system

PathAura ships a single design system rather than per-page styling. Screens compose shared
primitives, so colour, spacing, focus states, motion and both themes stay consistent everywhere.

**Foundations** — `client/tailwind.config.js` and `client/src/index.css`

- **Colour.** Semantic tokens defined as CSS variables under `:root` and `.dark`: `surface`,
  `panel`, `elevated`, `sunken`, `ink`, `ink-soft`, `muted`, `faint`, `line`, `line-strong`,
  `accent`, `accent-soft`, `scrim`, plus `danger` / `warn` / `success` / `info` triplets. The brand
  scale is a warm clay/terracotta. Nothing hardcodes a raw colour.
- **Type.** A deliberate scale from `2xs` to `7xl`, each size paired with its line height and
  tracking — large text tightens, small text stays open. Inter for the interface; Instrument Serif
  appears only as an editorial accent in marketing copy.
- **Elevation.** Borders separate surfaces; shadows are reserved for things that genuinely float
  (menus, dialogs, toasts). Radii are modest.
- **Motion.** 120–240ms, `ease-out`, used for state changes rather than decoration.
  `prefers-reduced-motion` is honoured globally.

**Component classes** — `.btn-*` (`.btn-sm`, `.btn-lg`, `.btn-icon`), `.input`, `.label`, `.hint`,
`.field-error`, `.card`, `.card-interactive`, `.panel-header`, `.badge-*`, `.chip`, `.alert-*`,
`.table`, `.nav-item`, `.menu`, `.toast`, `.skeleton`, `.icon-tile`, `.section-label`,
`.container-app`.

**Shared components** — `client/src/components`

| Component | Purpose |
| --- | --- |
| `Modal` | Dialog with focus trap, scroll lock, Escape to close, focus restored on exit |
| `ConfirmDialog` | Themed confirmation for destructive actions — replaces `window.confirm` |
| `Toast` / `useToast` | Confirmations and failures as notifications rather than inline boxes |
| `Skeleton*` | Loading placeholders shaped like the content they replace, so layout never jumps |
| `StatusPill` | The single source of truth for how every status is worded and coloured |
| `PageHeader`, `EmptyState`, `Segmented`, `StatTile`, `Avatar`, `DropdownMenu` | Shared page furniture |

**Theming.** Light and dark are both first-class. The toggle lives in the header of the public site
and the dashboard; the choice persists in `localStorage` under `pathaura_theme`, and with no stored
choice the app follows the operating system and keeps tracking it live. An inline script in
`client/index.html` applies the theme before first paint, so there is no flash of the wrong palette.

**Accessibility.** Skip links on both layouts, visible focus rings on every interactive element,
labelled form controls with `aria-invalid` and `aria-describedby`, `aria-current` in navigation,
keyboard-operable dialogs and menus, live regions for result counts and notifications, and colour
pairs checked for contrast in both themes.

**When writing new UI**, compose the tokens and components above instead of styling a page directly —
that is what keeps both themes correct and the product coherent.

## API surface (Phases 1–7)

| Method | Path | Description | Auth |
| --- | --- | --- | --- |
| `GET`  | `/api/health` | Health probe (also pings DB) | – |
| `POST` | `/api/auth/register` | Create account, receive JWT | – |
| `POST` | `/api/auth/login` | Log in, receive JWT | – |
| `POST` | `/api/auth/logout` | Stateless logout confirmation | – |
| `GET`  | `/api/auth/me` | Current user + permissions | Bearer |
| `GET`  | `/api/skills` | Skills catalogue (filter by `q`, `category`) | – |
| `GET`  | `/api/skills/categories` | Skill categories | – |
| `GET`  | `/api/profile` | Current user profile (with job-seeker section) | Bearer |
| `PATCH`| `/api/profile` | Update account + job-seeker profile | Bearer |
| `GET`  | `/api/profile/skills` | Skills on the current user's profile | Bearer |
| `POST` | `/api/profile/skills` | Add a skill (self-declared level) | Bearer |
| `DELETE`| `/api/profile/skills/:skillId` | Remove a skill | Bearer |
| `GET`/`POST`/`PATCH`/`DELETE` | `/api/profile/projects[/:id]` | Projects + linked skills (owner only) | Bearer |
| `GET`/`POST`/`PATCH`/`DELETE` | `/api/profile/education[/:id]` | Education entries (owner only) | Bearer |
| `GET`/`POST`/`PATCH`/`DELETE` | `/api/profile/experience[/:id]` | Experience entries (owner only) | Bearer |
| `GET`/`POST`/`PATCH`/`DELETE` | `/api/profile/certifications[/:id]` | Certifications; status starts `pending` (owner only) | Bearer |
| `GET`  | `/api/companies` | Public company directory (filter by `q`, `industry`) | – |
| `GET`  | `/api/companies/:slug` | Public company profile + open positions | – |
| `GET`  | `/api/companies/mine` | The employer's own company | Bearer |
| `POST`/`PATCH` | `/api/companies[/:id]` | Create / update a company profile | Bearer (employer) |
| `GET`  | `/api/jobs` | Marketplace search — `q`, type, work mode, district, skills, sort, paging | optional |
| `GET`  | `/api/jobs/filters` | Facet counts for the filter panel | – |
| `GET`  | `/api/jobs/:id` | Public posting detail (records a view) | optional |
| `GET`  | `/api/jobs/mine[/:id]` | The employer's postings, including drafts | Bearer |
| `POST`/`PATCH`/`DELETE` | `/api/jobs[/:id]` | Manage postings and their required skills | Bearer (employer) |
| `PATCH`| `/api/jobs/:id/status` | Move a posting draft → published → closed | Bearer (employer) |
| `GET`  | `/api/jobs/saved` | Saved opportunities | Bearer |
| `POST`/`DELETE` | `/api/jobs/:id/save` | Save / unsave an opportunity | Bearer |
| `POST` | `/api/applications` | Apply to a published posting | Bearer (`applications.submit`) |
| `GET`  | `/api/applications/mine` | The seeker's applications with their status timeline | Bearer |
| `PATCH`| `/api/applications/:id/withdraw` | Withdraw an application | Bearer |
| `GET`  | `/api/applications/employer` | Applicants for the employer's postings | Bearer (`applications.review`) |
| `GET`  | `/api/applications/employer/stats` | Applicant counts by status | Bearer (`applications.review`) |
| `GET`  | `/api/applications/:id/evidence` | Applicant's skills, projects, certifications + skill overlap | Bearer (`applications.review`) |
| `PATCH`| `/api/applications/:id/status` | Move an application through the pipeline | Bearer (`applications.review`) |
| `POST` | `/api/applications/:id/interviews` | Schedule an interview | Bearer (`applications.review`) |
| `GET`  | `/api/interviews/mine` | Interviews — employers see theirs, applicants see theirs | Bearer |
| `PATCH`/`DELETE` | `/api/interviews/:id` | Reschedule, complete, cancel or delete an interview | Bearer (employer) |
| `GET`  | `/api/admin/stats` | Live platform counts for the admin dashboard | Bearer (admin) |
| `GET`  | `/api/admin/activity` | Recent audit-log activity | Bearer (admin) |
| `GET`  | `/api/admin/companies` | Employer verification queue (filter by `status`) | Bearer (admin) |
| `PATCH`| `/api/admin/companies/:id/verification` | Verify / reject a company | Bearer (`admin.verify_employer`) |

All error responses share the same shape:

```json
{ "error": { "code": "validation_error", "message": "…", "details": [] } }
```

## Environment variables

`server/.env.example` documents the full set. Highlights:

- `PORT` — HTTP port (default `4000`).
- `CLIENT_ORIGIN` — allowed CORS origin (default `http://localhost:5173`).
- `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` — MySQL connection (`DB_NAME` defaults to `pathaura`).
- `JWT_SECRET` — **must** be replaced with a long random string in every real environment.
- `JWT_EXPIRES_IN`, `BCRYPT_ROUNDS`, `RATE_LIMIT_*` — auth/security tuning.

`client/.env.example` only exposes `VITE_API_BASE_URL`.

## Security posture (Phases 1-2)

- Passwords hashed with bcrypt at configurable rounds; hashes never leave the database layer.
- JWT bearer tokens, short-lived by default, verified on every request.
- Role-based authorization at the route level and permission-based checks in middleware.
- Helmet, CORS whitelist, JSON body size limit, per-IP rate limiting (stricter on `/api/auth`).
- Centralized error handler that never leaks stack traces, SQL, or file paths.
- Parameterized queries via `mysql2` (no string concatenation).
- Env-driven secrets — nothing sensitive committed. `.env` is gitignored.

## Testing

`server/tests/smoke.js` is an end-to-end check that drives the real HTTP API through the
whole flow built so far: logging in as each demo role, creating and verifying a company,
posting and publishing an opportunity, searching the marketplace, saving a posting,
applying, reviewing the applicant's skills evidence, moving the application through the
pipeline, scheduling an interview and withdrawing. It also asserts the negative cases —
job seekers cannot create postings, non-members cannot edit a company, drafts stay out of
public search, duplicate applications are rejected, and protected routes reject missing or
invalid tokens.

```bash
cd server
npm run db:reset        # DISPOSABLE database only — the test writes real rows
npm run dev             # terminal 1
npm run test:smoke      # terminal 2
```

Point it somewhere else with `SMOKE_BASE_URL=http://host:port/api npm run test:smoke`.
A full-coverage automated suite is Phase 13.

## Roadmap

The build follows the 15 phases from the product specification:

1. **Foundation — done.** Auth, roles/permissions, profile skeleton, dashboard shells.
2. **Job seeker — done.** Profile editor, skills catalogue + user skills, projects with skill links, education, experience, certifications (pending → verified flow).
3. **Employers — done.** Company profiles with public pages, admin verification queue, job/internship postings with required skills.
4. **Marketplace — done.** Public search with filters, sorting and facets, posting detail pages, saved opportunities.
5. **Applications — done.** Apply with a cover letter, status timeline, withdrawal, employer applicant dashboard with skills evidence, interview scheduling.
6. **Skill assessments — done.** Question banks per skill, timed attempts, scoring and verified skill levels.
7. **Matching engine — done.** Transparent weighted scores between a profile and an opportunity, with matched skills, gaps and recommendations.
8. Career roadmap. **← next**
9. Training providers + mentors.
10. Notifications.
11. Analytics + employment outcome tracking.
12. Security hardening.
13. Testing.
14. Deployment.
15. Advanced (AI assistant, CV builder, real-time messaging).

## Non-goals for this phase

- No real hiring decisions are made by the platform. Match scores are transparent heuristics.
- No AI-driven or automated candidate rejection.
- No fabricated employment statistics — outcomes are only reported when users/employers record them.
