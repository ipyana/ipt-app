# MUST — IPT Cluster Selection Portal

Industrial Practical Training (IPT) placement portal for the **Mbeya University of Science and Technology (MUST)** — CoICT. Students select 2 cluster preferences, are auto-allocated to department-specific slots (FIFO), split into venue groups, and shift clusters/venues between phases.

Built with **Next.js 16 (App Router) + Prisma + PostgreSQL + Tailwind v4**.

## Roles

- **Student** — register (reg number starting `25`), pick 2 clusters, get allocated to a department slot + venue group, re-apply/transfer within 72h of submission, upload report.
- **Facilitator (Staff)** — self-register (name, email, phone, department, cluster), set password via activation link, get approved by admin/coordinator, manage venue groups + announcements, request cluster transfer.
- **Admin / Coordinator** — approve facilitators, manage clusters/departments/programs/students, auto-allocate, manage groups & venues, trigger Phase-2 allocation + shift reminders, manage email templates (admin+), review staff transfers (coordinator+).
- **Super Admin** — everything above + admins, waitlist, session/phases, email provider secrets.

## Tech stack

- **Framework:** Next.js 16 (App Router, `output: standalone`)
- **Database:** PostgreSQL 16 (PostGIS) via Prisma 7 + `@prisma/adapter-pg`
- **Auth:** JWT (jose, HS256, 24h) in httpOnly cookies; middleware proxy (`src/proxy.ts`) for route gating + security headers
- **Email:** Nodemailer SMTP (primary, configurable via System Config) with Resend fallback; all templates DB-backed and editable in the admin UI
- **Storage:** MinIO / S3-compatible (announcement attachments); local disk fallback
- **Styling:** Tailwind CSS v4 (brand: `#14763b` green, `#7a1315` maroon)

## Local development

```bash
npm install
cp .env.example .env        # set DATABASE_URL, JWT_SECRET
npm run db:setup            # prisma db push + seed
npm run dev                 # http://localhost:3000
```

Seed credentials (dev only — rotate in production):
- Super Admin: `superadmin` / `SuperAdmin@123`
- Admins: `admin` / `Admin@123`
- Facilitators: `Staff@123` (placeholder; must self-register in production)

## Key scripts

| Command | Purpose |
|---|---|
| `npm run db:setup` | Push schema + seed |
| `npm run build` / `start` | Build / run production server |
| `npx prisma migrate dev` | Create/apply a migration |
| `npx tsx scripts/gen-staff.ts` | Re-generate placeholder staff accounts |
| `npm run lint` | ESLint |

## Production deploy (CI/CD)

Push to `main` → GitHub Actions builds the Docker image, pushes to Harbor (`harbor.iventika.co.tz/ipt_app/ipt-app`), runs `prisma migrate deploy`, and redeploys the VPS container via `docker-compose.prod.yml`. See `.github/workflows/deploy.yml`.

Required secrets/env: `JWT_SECRET` (≥32 chars, random), `DATABASE_URL`, SMTP/MinIO config (editable in-app), `CRON_SECRET`, and GitHub secrets `HARBOR_USERNAME`, `HARBOR_PASSWORD`, `VPS_SSH_KEY`.

## Scheduled jobs

- **Phase-shift reminders** — 3 waves in week 5 of Phase 1 via VPS crontab hitting `/api/cron/phase-reminder?wave=1|2|3` with the `x-cron-secret` header.

## Documentation

- `IMPLEMENTATION.md` — architecture & flows (kept in sync with code)
- `UI_UX_DESIGN.md` — design system & screens
