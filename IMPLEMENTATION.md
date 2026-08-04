# IMPLEMENTATION.md — MUST IPT Portal

This document reflects the **current** codebase. Keep it in sync when changing behavior.

## Architecture

- **Next.js 16 App Router**, `output: "standalone"` (Docker). All pages are client components under `src/app`; layout is `src/components/layout/AppLayout`.
- **Prisma 7 + PostgreSQL** (`prisma/schema.prisma`), Prisma Client generated to `src/generated/prisma`.
- **Auth:** `src/lib/auth.ts` (jose JWT, 24h, httpOnly cookie `token`) + `src/proxy.ts` (middleware) gates pages/APIs by role and sets security headers (CSP, HSTS, etc.).
- **Roles:** `student`, `staff` (facilitator), `admin`, `coordinator`, `super_admin`.

## Data model (highlights)

- `Student`, `Staff`, `Admin` — accounts. Staff have `status` (`pending_activation` → `pending_approval` → `active`/`rejected`) and `clusterId`.
- `Department`, `Program` — program belongs to a department.
- `Cluster`, `ClusterDepartment` — a cluster has per-department slot quotas (`slots`/`enrolled`). Allocation is department-scoped.
- `Venue`, `Group` — a cluster has venues; a group = a venue per cluster+phase. Students get a `PhaseAllocation` with a `groupId`.
- `IptSession`, `Phase` — 2 phases per cluster per session (5 weeks each). `PhaseAllocation` links student→phase→cluster→group.
- `Application` (2 cluster prefs, status), `TransferRequest` (transfer/reapplication), `WaitlistEntry`.
- `Announcement`, `AnnouncementRead`, `EmailTemplate`, `EmailLog`, `Setting`, `Otp`, `StaffTransferRequest`.

## Workflows

### Student
1. **Register** — reg number (14–15 chars starting `25`), full name, dept→program, email, strong password. Duplicate email/phone/reg across all roles → 409 "User Already Exists".
2. **Apply** — pick 2 distinct clusters eligible for their department (slot > 0).
3. **Allocate** — `tryAllocate` (submit time) or admin "Auto-Allocate All" (FIFO by submissionDate). Enforces `enrolled < slots` atomically (`src/lib/allocate.ts`). Allocated student gets Phase 1 + Phase 2 `PhaseAllocation` in the chosen clusters, plus a venue `Group` (least-loaded).
4. **Re-apply / transfer** — within **72h** of submission (single endpoint `/api/applications/reapply`; `type: transfer` or `reapplication`). Flips status to `reapplying`, reviewed by coordinator/super admin.
5. **Reports** — upload after `allocated`.
6. **Phase 2** — admin triggers `/api/admin/phase2` to (re)build Phase-2 allocations/groups + emails.

### Facilitator
1. **Self-register** — name, email, phone, department, cluster → `pending_activation`; activation-link email sent.
2. **Activate** — click link, set strong password → `pending_approval`.
3. **Approve** (admin/coordinator/super admin) → `active`, `account_activated` email with cluster + login link.
4. **Manage** — own-cluster announcements (`/staff/announcements`), groups & venues (`/staff/groups`).
5. **Cluster transfer** — request via staff dashboard; approved by coordinator/super admin → `StaffTransferRequest`.

### Admin / Coordinator / Super Admin
- Approve/reject facilitators; add facilitators (activation email sent, no direct password).
- Clusters/departments/programs/students CRUD (destructive ops are admin+ only).
- Groups & Venues (`/admin/groups`): create groups, move students, auto-balance.
- Allocations + **Phase-2 Allocation** + **Send Shift Reminder** buttons.
- Staff Transfers review (coordinator+).
- System Config (both admin & super admin trees): Email Provider (SMTP + MinIO), Email Templates, Email Logs, Announcements; IPT Session (super admin).

## Emails

21 DB-backed templates in `src/lib/email/templates.ts` (`DEFAULT_TEMPLATES`), rendered with `{{var}}` substitution (HTML-escaped). Senders in `src/lib/email.ts`. SMTP via `nodemailer` (config in `Setting` table), Resend fallback. Logs to `EmailLog`.

## Security

- Strong passwords (min 8, uppercase, number, special), bcrypt cost 12.
- Rate limiting on auth endpoints (`src/lib/rateLimit.ts`); OTP attempts capped at 5.
- File access: `/api/files` requires auth + key prefix allowlist; uploads path-containment enforced.
- JWT fails hard if `JWT_SECRET` unset/weak; CSP + HSTS headers in proxy.
- Destructive admin ops use `requireAdminOnly` (admin + super admin, not coordinator).

## Conventions

- API error boilerplate via `src/lib/api.ts` (`apiError`/`ok`).
- Shared staff route factory `src/lib/staffRoutes.ts` (admin + super admin wrap it).
- `src/lib/nav.ts` is the single source of nav for ContextSidebar / MobileNav / IconBar.
- Brand colors: primary `#14763b`, accent `#7a1315` (tokens in `src/app/globals.css`).
