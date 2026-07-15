# IPT Online Application System — Implementation Summary

**Built:** June 2025  
**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS · Prisma · PostgreSQL  
**Location:** `/Users/bro.ipyana/httdocs/ipt-app`

---

## 1. System Architecture

```
Users (Students/Admins)
     ↓ HTTPS
[Next.js Frontend + API — src/app/]
     ↓ Prisma Client (PG Adapter)
[PostgreSQL Database]
     ↓
[External: Email Service, File Storage] (placeholder)
```

- **Frontend & Backend:** Unified Next.js 16 App Router (no separate backend server)
- **Auth:** JWT via `jose` library, httpOnly cookies, route protection via `src/proxy.ts`
- **Database:** PostgreSQL via Prisma 7 with `@prisma/adapter-pg` driver adapter
- **Validation:** Zod v4 schemas on all API routes
- **Email:** Resend integration for allocation notifications (falls back to console.log if not configured)
- **Security:** CORS, security headers, input validation, bcrypt password hashing
- **Styling:** Tailwind CSS 4, mobile-first responsive design
- **Deployment:** Docker Compose + Vercel-ready config

---

## 2. Database Schema (Prisma — 5 Models)

| Model | Key Fields | Notes |
|---|---|---|
| **Student** | `studentId` (unique), `fullName`, `department`, `program`, `email`, `password`, `role` | 30 seeded for testing |
| **Admin** | `username` (unique), `email` (unique), `password`, `role` | 1 seeded |
| **Staff** | `name`, `email` (unique), `clusterId` (FK) | 2 staff per cluster |
| **Cluster** | `name`, `description`, `totalStudents`, `capacity`, `currentEnrolled`, `location`, `eligiblePrograms[]`, `programsBreakdown` (JSON) | 9 clusters seeded |
| **Application** | `studentId` (FK, unique), `clusterPref1/2/3` (int), `status`, `allocatedCluster`, `reportUrl`, `submissionDate` | One per student |

### Key Relationships
- `Student` 1:1 `Application` (enforced by `@@unique([studentId])`)
- `Cluster` 1:N `Staff`
- Cluster preferences stored as integer references (not formal relations) for simplicity

---

## 3. File Structure

```
ipt-app/
├── docker-compose.yml               # PostgreSQL 16 + Next.js app
├── Dockerfile                        # Node 22 Alpine image
├── prisma.config.ts                  # Prisma configuration
├── next.config.ts                    # Next.js configuration
├── .env                              # Environment variables
├── prisma/
│   ├── schema.prisma                 # Full database schema (5 models)
│   └── seed.ts                       # Seeds 9 clusters, 30 students, 1 admin, 18 staff
└── src/
    ├── proxy.ts                        # Auth guard — redirects unauthenticated users
    ├── lib/
    │   ├── db.ts                       # PrismaClient singleton (PG adapter)
    │   ├── auth.ts                     # createToken, verifyToken, getSession, requireAuth, requireAdmin
    │   └── clusterData.ts              # 9 cluster definitions + CLUSTER_ELIGIBILITY rules
    └── app/
        ├── layout.tsx                  # Root layout (fonts, metadata)
        ├── globals.css                 # Tailwind + CSS custom properties
        ├── page.tsx                    # Login / Register page (Student | Register | Admin tabs)
        ├── api/
        │   ├── auth/
        │   │   ├── login/route.ts      # POST — authenticates via identifier (reg number/username/email)
        │   │   ├── register/route.ts   # POST — creates student account
        │   │   ├── me/route.ts         # GET — returns current session user
        │   │   └── logout/route.ts     # POST — clears auth cookie
        │   ├── clusters/route.ts       # GET — returns all 9 clusters with staff
        │   ├── applications/route.ts   # GET (my app), POST (submit), PUT (update)
        │   └── admin/
        │       ├── applications/route.ts  # GET — all applications with student data
        │       ├── allocate/route.ts      # POST — allocate student to cluster
        │       ├── students/route.ts      # GET — all students with app status
        │       └── export/route.ts        # GET — download applications CSV
        ├── student/
        │   ├── layout.tsx              # Student nav (Dashboard, Select Clusters, My Status)
        │   ├── dashboard/page.tsx      # Overview — profile, app status, cluster cards
        │   ├── apply/page.tsx          # Cluster selection — 3 radio-button preferences
        │   └── status/page.tsx         # Application tracker with progress steps
        └── admin/
            ├── layout.tsx              # Admin nav (Dashboard, Allocations, Students, Export)
            ├── dashboard/page.tsx      # Stats cards, dept breakdown, capacity bars
            ├── allocations/page.tsx    # Filterable table, manual/auto allocate
            ├── students/page.tsx       # Searchable student list with status
            └── export/page.tsx         # Download CSV, export format preview
```

---

## 4. API Endpoints

### Public
| Method | Route | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Login via identifier (reg number, username, or email) + password |
| `POST` | `/api/auth/register` | Student registration (reg number, name, dept, program, email, password) |
| `POST` | `/api/auth/logout` | Clear session |

### Authenticated (Student)
| Method | Route | Description |
|---|---|---|
| `GET` | `/api/auth/me` | Current user profile |
| `GET` | `/api/clusters` | List all clusters + staff |
| `GET` | `/api/applications` | Get own application |
| `POST` | `/api/applications` | Submit application (3 prefs) |
| `PUT` | `/api/applications` | Update pending application |

### Authenticated (Admin)
| Method | Route | Description |
|---|---|---|
| `GET` | `/api/admin/applications` | All applications with student details |
| `POST` | `/api/admin/allocate` | Allocate student to cluster |
| `GET` | `/api/admin/students` | All students with app status |
| `GET` | `/api/admin/export` | Download CSV export |

### Validation Rules (enforced via Zod schemas in `src/lib/validations.ts`)
- `loginSchema` — `identifier` (non-empty), `password` (non-empty)
- `registerSchema` — `studentId` (min 3 chars), `fullName`, `department` (enum ETE/IST/IF/CSE/CoSTE), `program`, `email` (valid email), `password` (min 6 chars)
- `applicationSchema` — `pref1`, `pref2`, `pref3` (all positive ints, distinct)
- `allocationSchema` — `applicationId`, `clusterId` (positive ints)
- Business logic checks: department eligibility, cluster existence, duplicate applications, edit only while pending

---

## 5. Email Notifications (Resend)

Configured via environment variables:
```bash
RESEND_API_KEY="re_xxxx"          # Sign up at https://resend.com
EMAIL_FROM="IPT System <noreply@ipt.university.ac.ke>"
```

When `RESEND_API_KEY` is set:
- **Allocation email** sent automatically when a student is allocated (manual or auto)
- Email includes: student name, allocated cluster, location, instructions

When `RESEND_API_KEY` is not set: emails are logged to console (no-op) — app works fine without it.

---

## 6. File Upload (IPT Reports)

**Endpoint:** `POST /api/applications/report`

- Students can upload reports only after allocation
- Accepts PDF and Word documents (.pdf, .doc, .docx)
- Max file size: 10MB
- Files saved to `uploads/reports/` directory
- `reportUrl` stored on the Application record

---

## 7. Cluster Data (9 Clusters, 1,396 total capacity)

| # | Cluster Name | Capacity | Eligible Departments |
|---|---|---|---|
| 1 | Computer Maintenance and Peripherals | 144 | ETE, CSE, CoSTE |
| 2 | Networking and Telecommunications | 188 | ETE, IST, CSE, CoSTE |
| 3 | Software Development and Applications | 165 | IF, CSE, IST |
| 4 | Database Management Systems | 140 | IF, IST, CSE, CoSTE |
| 5 | Web and Multimedia Technologies | 155 | IF, IST, CSE, ETE, CoSTE |
| 6 | Information Systems Management | 150 | IST, IF, CoSTE |
| 7 | Embedded Systems and IoT | 145 | ETE, CSE, CoSTE |
| 8 | Cybersecurity and Forensics | 160 | CSE, IF, IST, ETE |
| 9 | Artificial Intelligence and Data Science | 149 | CSE, IF, IST, CoSTE, ETE |

**Departments:** ETE, IST, IF, CSE, CoSTE

> Edit `src/lib/clusterData.ts` to update names, capacities, descriptions, staff, or eligibility rules.

---

## 8. Key UI Pages

### Login Page (`/`)
- Three tabs: **Student** | **Register** | **Admin**
- **Student login:** Registration number or email + password. Routes to student dashboard.
- **Admin login:** Username or email + password. Routes to admin dashboard.
- **Student registration:** Registration number, full name, department → program (cascading dropdown), email, password
- Single `/api/auth/login` endpoint handles both roles — identifies user type from the database
- Demo hints shown below each form

### Student Dashboard (`/student/dashboard`)
- Welcome card with student ID, department, program
- Application status banner (Pending / Allocated) with allocated cluster name
- "Select Clusters Now" CTA if no application exists
- 9 cluster cards in responsive grid showing: capacity bar, location, staff count, eligibility tags (highlighted if matching student's department)

### Student Apply (`/student/apply`)
- Shows student's department as context
- 3 preference sections (First, Second, Third) each as radio-button lists
- Each cluster card shows: name, description, location, enrolled/capacity, staff surnames
- Only eligible clusters shown for student's department
- Already-selected clusters excluded from subsequent preference options
- Edit mode: pre-fills existing preferences, uses PUT instead of POST
- Locked if application already allocated

### Student Status (`/student/status`)
- Submission date in full locale format
- 3-step progress tracker: Pending → Reviewing → Allocated
- Preferences displayed with color coding (1st = amber, 2nd/3rd = slate)
- Allocated cluster shown in green badge if assigned
- "Modify Preferences" link if still pending

### Admin Dashboard (`/admin/dashboard`)
- 4 stat cards: Total Applications, Pending, Allocated, Clusters
- Bar chart: Applications by Department
- Bar chart: Cluster Capacities (color-coded: green <70%, yellow <90%, red >90%)

### Admin Allocations (`/admin/allocations`)
- "Auto-Allocate All" button — iterates pending apps, assigns to first available preference
- Filter buttons: All / Pending / Allocated
- Department filter dropdown
- Table: Student name/ID, Dept, 3 preferences, Status, Allocate dropdown
- Allocate dropdown shows only the student's 3 preferences with current enrollment counts

### Admin Students (`/admin/students`)
- Search by name, ID, or email
- Filter by department
- Table: Student name/ID, Program, Department badge, Status badge, Allocation
- 4 summary badges at top: Total, Applied, Allocated, Pending

### Admin Export (`/admin/export`)
- Download Applications CSV button
- Cluster Summary placeholder
- Column format preview

---

## 9. Setup Instructions

### Prerequisites
- Docker Desktop (recommended) **or** Node.js 20.9+ + PostgreSQL

### Quick Start with Docker

```bash
cd /Users/bro.ipyana/httdocs/ipt-app

# Start both PostgreSQL + Next.js app
docker compose up --build

# App runs at → http://localhost:3000
# PostgreSQL exposed at → localhost:5432 (if needed)
```

The `docker compose up` command:
1. Starts a PostgreSQL 16 container with `ipt_db` database
2. Waits for DB to be healthy
3. Pushes the Prisma schema + seeds the database
4. Starts the Next.js dev server on port 3000

To reset the database:
```bash
docker compose down -v   # removes the DB volume
docker compose up --build
```

### Manual Setup (without Docker)

```bash
cd /Users/bro.ipyana/httdocs/ipt-app

# 1. Configure environment
# Edit .env — set your PostgreSQL connection string and JWT secret
DATABASE_URL="postgresql://user:password@localhost:5432/ipt_db?schema=public"
JWT_SECRET="your-secret-key-change-me"

# 2. Install dependencies
npm install

# 3. Generate Prisma client
npm run db:generate

# 4. Push schema to database + seed data
npm run db:setup

# 5. Start development server
npm run dev
# → http://localhost:3000
```

### Production Build

```bash
npm run build
npm start
# → http://localhost:3000
```

### Available npm Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run db:migrate` | Create migration from schema |
| `npm run db:push` | Push schema to DB (no migration) |
| `npm run db:seed` | Run seed script |
| `npm run db:setup` | Push schema + seed in one command |
| `npm run db:studio` | Open Prisma Studio GUI |

### Reseeding After Schema Changes

```bash
npx prisma db push --force-reset && npm run db:seed
```

---

## 10. Demo Credentials

| Role | Login With | Password |
|---|---|---|
| Admin | `admin` (username) or `admin@ipt.university.ac.ke` (email) | `Admin@123` |
| Student | Registration number `20250001` through `20250030` or email | `Student@123` |

> Students log in using their **registration number** (e.g. `20250001`) or email. Admins use their **username** (`admin`) or email.

---

## 11. Security

- Passwords hashed with bcrypt (12 rounds)
- JWT signed with HS256, 24-hour expiry
- Auth cookie set as httpOnly, SameSite=lax, Secure in production
- Proxy (`src/proxy.ts`) guards all routes except `/login` and `/api/auth/*`
- Admin routes double-checked via `requireAdmin()` in API handlers
- Input validation on all API routes: Zod schemas on every endpoint
- Security headers: `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy`, `Permissions-Policy`
- CORS configured for API routes via proxy + Vercel headers
- File uploads validated for type (PDF/DOCX only) and size (max 10MB)

---

## 12. Deployment (Vercel)

A `vercel.json` is included with:
- Build command with Prisma generate
- Environment variable placeholders
- Security headers
- CORS headers for API routes

**Required environment variables on Vercel:**
```
JWT_SECRET
DATABASE_URL
RESEND_API_KEY       (optional — for email notifications)
EMAIL_FROM            (optional)
NEXT_PUBLIC_APP_URL   (your Vercel domain)
```

**Deploy steps:**
```bash
npm i -g vercel
vercel --prod
# Set environment variables in Vercel dashboard
```

---

## 13. Customization Guide

### Updating Cluster Data
Edit `src/lib/clusterData.ts`:
- `CLUSTER_SEED_DATA[]` — cluster names, capacities, descriptions, locations, staff, `programsBreakdown`
- `CLUSTER_ELIGIBILITY` — map cluster names → allowed department codes

### Updating Eligibility Rules
The eligibility check happens in `src/app/api/applications/route.ts` using `isEligible()` from `clusterData.ts`.

### Adding SSO / University Auth
Replace `POST /api/auth/login` with OAuth/OIDC flow. The token creation via `createToken()` in `src/lib/auth.ts` remains the same.

### Email Notifications
Set `RESEND_API_KEY` in `.env` to enable real emails. The `src/lib/email.ts` module handles sending and falls back to console logging when not configured.

### File Uploads (Reports)
The `POST /api/applications/report` endpoint is ready. In production, switch from local disk storage to S3/Cloud Storage by replacing the `writeFile` call in the route handler.

---

## 14. Known Limitations / Future Work

- **SSO Integration:** Currently simple credentials; placeholder for university SSO
- **Concurrent Allocation:** Auto-allocate processes sequentially; could batch for 1,400+ students
- **Rate Limiting:** Not yet configured
- **Program-Level Eligibility:** Currently checks department only; could extend to program-level
- **Cloud Storage:** Report uploads use local disk; migrate to S3/Cloud Storage for production
