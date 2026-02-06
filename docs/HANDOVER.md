# CSO Self-Assessment Tool — Handover Document

This document provides the information needed to manage, maintain, and understand the **CSO (Civil Society Organisation) Self-Assessment Tool** (IGNITE CSOs). It is intended for technical handover to a new maintainer or team.

---

## 1. Executive Summary

**Purpose:** A web application for Civil Society Organisations (CSOs) to complete self-assessments, receive scored results, and get tailored improvement suggestions. Administrators manage organisations, questions, sections, and reports.

**Production URL:** `https://selfassess.csogo.org` (as per deployment config).

**Stack:** Next.js 14 (App Router), TypeScript, MySQL (Prisma), NextAuth (admin), custom JWT/session for organisations, TailwindCSS, PDF/Excel reporting.

---

## 2. System Functionality Overview

### 2.1 User Types and Entry Points

| User Type        | Entry Point           | Authentication |
|------------------|-----------------------|----------------|
| **Organisations**| `/organization/login` | Email + password; email verification required |
| **Public / Anonymous** | `/` (home), `/assessment/[id]` (shareable link) | None for viewing; org session for dashboard/reports |
| **Admins**       | `/admin/login`        | NextAuth credentials (email + password) |

### 2.2 Organisation Flow

1. **Registration / Login** (`/organization/login`)
   - Organisations register with name, email, password.
   - Email verification: token sent via SMTP; must verify before full access.
   - Resend verification: `POST /api/organizations/resend-verification`.

2. **Dashboard** (`/organization/dashboard`)
   - List of assessments (in progress / completed).
   - Start new assessment: `/assessment/new`.

3. **Assessment**
   - **Take assessment:** Multi-section questionnaire (Governance, Financial, Programme, HR).
   - Question types: Single choice, Multiple choice, Likert scale, Text, Boolean.
   - Responses saved via `POST /api/assessments/[id]/responses`.
   - Completion checked via `/api/assessments/[id]/check-completion`; on completion, status → `COMPLETED` and report/suggestions are generated.

4. **Report**
   - **View report:** `/assessment/[id]/report` — scores by section, overall level, suggestions.
   - **Download PDF:** API routes under `/api/assessments/...` and `/api/organizations/assessments/[id]/report/download`.
   - **Shareable link:** Assessments can have a `shareableLink` for unauthenticated access to the assessment (e.g. `/assessment/[shareableLink]`).

5. **Organisation reports list** (`/organization/reports`)
   - Access to reports for that organisation.

### 2.3 Admin Flow

1. **Login** (`/admin/login`)
   - NextAuth credentials provider; session stored in JWT cookie `next-auth.session-token`.
   - Middleware protects all `/admin/*` except `/admin/login`.

2. **Dashboard** (`/admin/dashboard`)
   - Overview of organisations and assessments.

3. **Sections** (admin)
   - CRUD for assessment sections (title, description, order, weight).
   - Reorder: `PATCH /api/sections/[id]/reorder`.

4. **Questions** (admin)
   - CRUD for questions (text, type, options, order, weight, section, mandatory, isHidden).
   - Types: `SINGLE_CHOICE`, `MULTIPLE_CHOICE`, `LIKERT_SCALE`, `TEXT`, `BOOLEAN`.

5. **Suggestions** (admin)
   - Question-, section-, and assessment-level suggestions with conditions (e.g. score ranges, response values).
   - Used by `SuggestionEngine` when generating reports.

6. **Organisations / Admins**
   - Organisation management.
   - Admin invite flow: invite by email → token sent → accept at `/admin/invite/accept` (or setup page) to set password.
   - Create first admin via CLI: `npm run create-admin -- <email> <password>`.

7. **Reports (admin)**
   - List: `/admin/reports`.
   - Per-organisation: `/admin/reports/[organizationId]`.
   - Download: `/api/admin/reports/[organizationId]/download`, `/api/admin/reports/download`.

### 2.4 Scoring and Suggestions

- **Scoring:** `src/lib/cso-score-calculator.ts` — section IDs expected: `governance-section`, `financial-section`, `programme-section`, `hr-section`. Section max scores and overall level (Emerging / Strong Foundation / Leading) are defined there.
- **Suggestions:** `src/lib/suggestion-engine.ts` — runs when an assessment is completed; evaluates question/section/assessment suggestion rules and attaches results to the report.

### 2.5 Email

- **Config:** `src/lib/email.ts` — uses Nodemailer with env vars (`EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM_EMAIL`, `EMAIL_FROM_NAME`, `EMAIL_SECURE`).
- **Used for:** Organisation verification emails, admin invite emails, resend verification.
- **Script:** `scripts/test-email-verification.ts` for testing.

---

## 3. Tech Stack and Architecture

| Layer        | Technology |
|-------------|------------|
| Frontend    | Next.js 14 (App Router), React 18, TypeScript, TailwindCSS, Framer Motion, React Hook Form, Zod, Chart.js / react-chartjs-2 |
| Auth (admin)| NextAuth.js 4 (Credentials + JWT) |
| Auth (org)  | Custom (session/token via API and `useOrganizationAuth`) |
| API         | Next.js Route Handlers (`src/app/api/`) |
| Database    | MySQL 8+ (or MariaDB 10.3+), Prisma ORM |
| PDF         | @react-pdf/renderer, jsPDF, PDFKit |
| Excel       | ExcelJS |
| Sitemap     | next-sitemap (postbuild) |

- **Prisma client output:** `src/generated/prisma` (see `prisma/schema.prisma`).
- **Path alias:** `@/` → `src/`.

---

## 4. Project Structure (Key Areas)

```
src/
├── app/
│   ├── api/                    # API routes (admin, assessments, auth, organizations, questions, sections, suggestions)
│   ├── admin/                  # Admin UI (login, dashboard, reports, setup, suggestions, admins)
│   ├── assessment/             # Assessment take/view and report (including [id], new, report)
│   ├── organization/           # Org login, dashboard, reports
│   ├── about/, privacy/, terms/, acceptable-use/
│   ├── layout.tsx, globals.css, providers.tsx
│   └── page.tsx                # Public home
├── components/                 # Shared UI (header, forms, charts, admin-management, etc.)
├── hooks/                      # e.g. useOrganizationAuth
├── lib/                        # auth.ts, prisma.ts, email.ts, cso-score-calculator, suggestion-engine, report-generator
└── middleware.ts               # Protects /admin/* (except login)

prisma/
├── schema.prisma               # MySQL schema
└── migrations/                 # Migration history

scripts/
├── create-admin.ts             # Create admin user (email, password)
├── export-postgres-data.ts     # Export from PostgreSQL (migration)
├── import-mysql-data.ts        # Import into MySQL (migration)
├── test-email-verification.ts
└── MIGRATION_QUICK_START.md
```

---

## 5. Environment and Configuration

### 5.1 Required Environment Variables

**Local development:** `.env.local` (or `.env`). **Production:** `.env.production` (see `env.production.example`).

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | MySQL connection string, e.g. `mysql://user:pass@localhost:3306/dbname` | Yes |
| `NEXTAUTH_SECRET` | Secret for NextAuth (admin) — use a strong random string | Yes |
| `NEXTAUTH_URL` | Full app URL, e.g. `https://selfassess.csogo.org` | Yes |
| `NEXT_PUBLIC_APP_URL` | Public app URL (e.g. for links in emails) | Yes |
| `EMAIL_HOST` | SMTP host | Yes (if email used) |
| `EMAIL_PORT` | SMTP port (e.g. 465) | Yes |
| `EMAIL_SECURE` | `true` / `false` | Yes |
| `EMAIL_USER` | SMTP username | Yes |
| `EMAIL_PASS` | SMTP password | Yes |
| `EMAIL_FROM_EMAIL` | Sender address | Yes |
| `EMAIL_FROM_NAME` | Sender name | Yes |
| `PORT` | Server port (production; default 3000) | Optional |

Copy `env.production.example` to `.env.production` and fill in real values. Do not commit `.env` or `.env.production`.

---

## 6. Database

- **Provider:** MySQL (see `prisma/schema.prisma`).
- **Main models:** Organization, Assessment, Section, Question, Response, Report, ReportSuggestion, Admin; suggestion models (QuestionSuggestion, SectionSuggestion, AssessmentSuggestion).
- **Enums:** AssessmentStatus (IN_PROGRESS, COMPLETED), QuestionType, SuggestionType.

**Commands:**

```bash
npx prisma generate          # Regenerate client after schema change
npx prisma migrate dev       # Dev: create/apply migrations
npx prisma migrate deploy    # Production: apply migrations only
npx prisma db push           # Push schema without migrations (used in deploy-production.sh for some setups)
npm run db:seed              # Seed (if configured in prisma/seed.ts)
```

**Creating the first admin (no UI):**

```bash
npm run create-admin -- admin@example.com YourSecurePassword
```

---

## 7. Running and Building

- **Development:** `npm run dev` (Next.js dev server, default port 3000).
- **Build:** `npm run build` (runs `prisma generate`, `next build`, and server TypeScript build; postbuild runs next-sitemap).
- **Production start:** `npm start` (or `npm run start:standalone` if built with `npm run build:standalone`).
- **Lint:** `npm run lint`.

---

## 8. Deployment

- **Target:** cPanel with Node.js and MySQL (see `deployment-guide.md`).
- **Production URL/path:** `selfassess.csogo.org` under `/home/thecrop/public_html/selfassess.csogo.org/` (from deployment guide).
- **Script:** `./deploy-production.sh` — finds npm, loads `.env.production` (or `.env`), installs deps, runs `prisma generate`, `prisma db push`, optionally imports from `postgres-export.json`, then `npm run build`. Does not start the app; restart via cPanel Application Manager or process manager.
- **Entry file on server:** `app.js` (custom Next server loading `.env.production`); cPanel Application Manager points to this.
- **Standalone option:** `USE_STANDALONE=true npm run build` then `npm run start:standalone` (see `next.config.js` and `server.js`).

Important: After deployment, restart the Node application from cPanel/process manager and verify logs.

---

## 9. Scripts and Maintenance

| Script | Purpose |
|--------|--------|
| `npm run create-admin` | Create admin (args: email, password). |
| `npm run db:seed` | Seed database (Prisma seed). |
| `npm run export-postgres` | Export from PostgreSQL (migration). |
| `npm run import-mysql` | Import into MySQL (e.g. from postgres export). |
| `scripts/test-email-verification.ts` | Test email sending. |

**Backups:** Use cPanel/MySQL backups for the database; keep `.env.production` and any uploads/static assets backed up separately.

**Migrations from PostgreSQL:** See `MIGRATION_GUIDE.md` and `scripts/MIGRATION_QUICK_START.md` if moving from an existing PostgreSQL instance.

---

## 10. Security and Access

- **Admin routes:** All `/admin/*` except `/admin/login` require a valid NextAuth session (middleware).
- **API routes:** Admin APIs should check session; organisation APIs check org auth/token as implemented in each route.
- **Secrets:** Keep `NEXTAUTH_SECRET` and database credentials secure; rotate if compromised.
- **HTTPS:** Production should run behind HTTPS (handled by cPanel/hosting).

---

## 11. Troubleshooting

- **Database connection:** Verify MySQL is running, `DATABASE_URL` is correct, and the database/user exist and have sufficient privileges.
- **Migrations:** If schema is out of sync, consider `npx prisma migrate deploy` or (with care) `npx prisma db push`; for dev, `npx prisma migrate reset` resets DB (data loss).
- **Env not loading:** Ensure `.env.local` or `.env.production` is in project root and restart the process.
- **Email not sending:** Check SMTP env vars and run `scripts/test-email-verification.ts`; check firewall/port and credentials.
- **Build failures:** Run `npx prisma generate` and `npm run build`; fix any TypeScript or ESLint errors reported.
- **cPanel app not starting:** Check Application Manager logs, `PORT`, and that `app.js` and dependencies are present and executable.

Further troubleshooting is in `README.md` and `deployment-guide.md`.

---

## 12. Handover Checklist

- [ ] Access to repository and any private deployment/config docs.
- [ ] cPanel (or hosting) login and Node.js app configuration.
- [ ] MySQL credentials and backup procedure.
- [ ] `.env.production` (or equivalent) stored securely — not in repo.
- [ ] At least one admin account created and tested.
- [ ] SMTP credentials and test email verified.
- [ ] Knowledge of where application logs are (cPanel / server).
- [ ] Domain and SSL for `selfassess.csogo.org` (if applicable).

---

## 13. Reference Documents in Repo

- **README.md** — Getting started, scripts, env vars, project structure.
- **deployment-guide.md** — cPanel deployment steps.
- **MIGRATION_GUIDE.md** — PostgreSQL → MySQL migration.
- **env.production.example** — Production env template.

---

*Document generated for project handover. Update this file as the system or deployment process changes.*
