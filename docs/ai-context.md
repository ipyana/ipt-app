# AI Context — MUST IPT Portal

Use this when generating or editing UI code so it matches this project exactly.

## Tech Stack

**Framework / runtime**
- **Next.js 16.2.9** (App Router) on **React 19.2.4**, **TypeScript 5**, Node 20+.
- Server components + Route Handlers (`app/api/**/route.ts`) + **Middleware** (`src/proxy.ts`) for auth/role-gated routing (it is the proxy, not a standard `middleware.ts`).
- **Prisma 7.8** ORM with `@prisma/adapter-pg` + `pg`, schema-first (client generated to `src/generated/prisma`).

**UI / styling**
- **Tailwind CSS v4** — CSS-first config. There is **no `tailwind.config.js`**; theme lives in `src/app/globals.css` via `@theme inline` + CSS variables (e.g. `--primary-500`, `--accent-500`, `--surface`, `--sidebar`).
- **Shadcn/ui** (Radix-based, hand-rolled, NOT `components.json`-managed): `src/components/ui/{button,badge,card,dialog,select,table,tabs,sheet,progress,skeleton,steps,form}.tsx` built with **class-variance-authority** + **tailwind-merge** via `cn()` from `@/lib/utils`.
- **Framer Motion 12** for all animations (`motion.div`, `AnimatePresence`).
- **Lucide-react** icons (v1.18).
- **next-themes** for dark mode (`class` strategy, `storageKey="ipt-theme"`).

**Component patterns to follow**
- Buttons: `variant` = `primary | secondary | outline | ghost | destructive | accent | link`; `size` = `xs | sm | default | lg | icon | iconSm`. `accent` is maroon (`#7a1315`), `primary` is green (`#14763b`).
- Layout shell: `AppLayout role="student"|"admin"|"staff"|"super_admin"` → `Sidebar` (desktop) + `MobileNav` (drawer) + `TopNav`. Coordinator logs in through `role="admin"` pages.
- Forms: `Input`, `Label` from `@/components/ui/form`; custom `<select>` uses `@/components/ui/select` (or raw `select` with `bg-panel`).
- Tables: `Table/TableHeader/TableRow/TableHead/TableBody/TableCell` from `@/components/ui/table`.

## Breakpoints (Tailwind v4 defaults, confirmed in-use)
| Prefix | Width | Used for |
|---|---|---|
| `sm:` | **640px** | show/hide table columns (53 uses) |
| `md:` | **768px** | occasional column visibility (3 uses) |
| `lg:` | **1024px** | desktop sidebar (`lg:pl-60`, `lg:left-60`, `lg:block`), drawer `lg:hidden` (21 uses) |
| `xl:` | **1280px** | minor (2 uses) |
| `2xl:` | **1536px** | not currently used |

Mobile drawer: `fixed inset-y-0 left-0 z-[60] w-64`; TopNav is `fixed top-0 right-0 z-50 ... lg:left-60`. **Keep mobile drawer above TopNav (`z-[60]` vs `z-50`).**

## Feature Scope — hardest screens

1. **Admin Students / Staff tables** (`/admin/students`, `/admin/staff`, `/super-admin/staff`) — 8–9 columns each, with **row-selection checkboxes + header "select all" + sticky bulk-delete bar** (`useBulkSelection` + `BulkDeleteDialog`), inline Edit/Move/Delete, per-row status badges, search + filter. Responsive: most columns hidden below `sm:`/`md:`.
2. **Allocations page** (`/admin/allocations`) — 6 columns, filter tabs (All/Pending/Allocated/Reapplying), department filter, **per-row inline "Allocate to..." `<select>`** that calls an API on change, status that must distinguish **Transfer Request** vs **Re-application** (from `pendingRequest.type`), plus header action buttons (Auto-Allocate, Phase 2, Shift Reminder).
3. **Weekly Report tracker** (`/student/report`) — a **per-week grid** (2 phases × N weeks) with per-week status (submitted = green "View Report" / pending = "Upload Report"), an **overall progress ring** (submitted/total + %), and a **Preview-then-Submit dialog** that enforces no-withdraw (409 on re-upload).
4. **Clusters page** (`/admin/clusters`) — **All / Phase 1 / Phase 2 toggle view**, phase cards with %-full progress bars and group chips, plus a 6-column management table with the same bulk-select pattern.
