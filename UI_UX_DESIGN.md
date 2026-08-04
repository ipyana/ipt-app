# IPT Application System — UI/UX Redesign Summary

> **Note:** This document is a **design reference**. Some mockup details (kenyan names, "3 preferences", CoICT branding, demo reg numbers like `20250001`) are **superseded** — see `README.md` and `IMPLEMENTATION.md` for the current behavior. Brand colors are now **#14763b** (primary) and **#7a1315** (accent).

**Project:** MUST — IPT 2025/2026 (Mbeya University of Science and Technology)  
**Stack:** Next.js 16 App Router · TypeScript · Tailwind CSS 4 · Framer Motion  
**Libraries:** Lucide React · next-themes · shadcn/ui patterns · class-variance-authority

---

## 1. Design Principles

| Principle | Implementation |
|---|---|
| **Clarity** | Clean typography (Geist/Inter), generous whitespace, clear visual hierarchy |
| **Trust** | Professional academic aesthetic — university blue primary, structured layouts |
| **Delight** | Micro-animations (Framer Motion), hover states, smooth transitions |
| **Accessibility** | ARIA labels, keyboard navigation, proper contrast ratios, focus rings |
| **Responsive** | Mobile-first, collapsible sidebar, adaptive grids, touch-friendly targets |
| **Consistency** | Reusable component library, design tokens via CSS variables, single source of truth |

---

## 2. Theme System

### Color Palette

```
Primary (University Blue)
  --primary-50  → #eff6ff     --primary-600 → #003087  ← PRIMARY BRAND
  --primary-100 → #dbeafe     --primary-700 → #002670
  --primary-200 → #bfdbfe     --primary-800 → #001d59
  --primary-300 → #93c5fd     --primary-900 → #001342

Accent (Teal)
  --accent-50   → #f0fdfa     --accent-600  → #0d9488
  --accent-100  → #ccfbf1     --accent-700  → #0f766e
  --accent-400  → #2dd4bf     --accent-800  → #115e59

Neutral (Light Mode)
  --background  → #ffffff      --surface     → #f8fafc
  --foreground  → #0f172a      --surface-alt → #f1f5f9
  --border      → #e2e8f0

Neutral (Dark Mode)
  --background  → #0f172a      --surface     → #1e293b
  --foreground  → #f1f5f9      --surface-alt → #334155
  --border      → #334155
```

### Theme Switching

- **Provider:** `next-themes` (`ThemeProvider` in `src/components/theme-provider.tsx`)
- **Default:** Light mode (`defaultTheme="light"`)
- **Toggle:** Sun/Moon icon button in the TopNav bar
- **Persistence:** Stored in `localStorage`, applied via `class` attribute on `<html>`
- **CSS:** All color values defined as CSS custom properties, swapped via `.dark` class selector

---

## 3. Icon System

**Library:** Lucide React (1500+ icons, MIT license, outlined style)

All emojis have been removed and replaced with semantic Lucide icons:

| Context | Icon | Component |
|---|---|---|
| App branding | `GraduationCap` | Sidebar, TopNav, Login hero |
| Navigation | `LayoutDashboard`, `ClipboardList`, `FileText`, `Upload` | Sidebar (student) |
| Navigation | `BarChart3`, `Target`, `Users`, `Download` | Sidebar (admin) |
| Actions | `LogOut`, `ChevronLeft`, `Menu`, `X` | Layout controls |
| Statuses | `CheckCircle`, `Clock`, `AlertTriangle`, `AlertCircle` | Cards, messages |
| Content | `MapPin`, `Users`, `BookOpen`, `Calendar`, `Bell` | Info displays |
| Forms | `Search`, `Filter`, `ArrowRight`, `Edit3`, `Zap` | Inputs, buttons |
| Theme | `Sun`, `Moon` | Theme toggle |

---

## 4. Component Library

Location: `src/components/ui/`

### Button (`button.tsx`)
```
Variants:  primary | secondary | outline | ghost | destructive | accent
Sizes:     sm (h-8) | default (h-10) | lg (h-12) | icon (h-10 w-10)
Features:  Slot pattern (asChild), focus rings, disabled state, SVG sizing
```

### Card (`card.tsx`)
```
Sub-components:  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
Style:           rounded-xl, border, shadow-sm → hover:shadow-md
Usage:           Container for dashboard stats, cluster cards, form sections
```

### Badge (`badge.tsx`)
```
Variants:  default | secondary | success | warning | danger | info | outline
Style:     rounded-full, px-2.5 py-0.5, text-xs font-semibold
Usage:     Status indicators (Pending/Allocated), department tags, eligibility
```

### Form Controls (`form.tsx`)
```
Components:  Input, Select, Label
Style:       h-10, rounded-lg, border, focus:ring-2 focus:ring-primary-500
Features:    Placeholder styling, disabled state, file input support
```

### Table (`table.tsx`)
```
Components:  Table, TableHeader, TableBody, TableRow, TableHead, TableCell
Style:       Full-width, hover:bg-slate-50 rows, proper padding
Usage:       Admin student list, allocations table
```

### Progress (`progress.tsx`)
```
Sizes:      sm (h-1.5) | default (h-2) | lg (h-3)
Variants:   primary (blue) | success (emerald) | warning (amber) | danger (red)
Features:   Animated width transition, optional percentage label
```

### Steps (`steps.tsx`)
```
Features:  Numbered circles → checkmarks on completion, connecting lines
States:    Completed (emerald + check), Current (blue + ring), Future (slate)
Usage:     Application progress tracker, multi-step cluster selection
```

### Skeleton (`skeleton.tsx`)
```
Style:     animate-pulse, rounded-lg, bg-slate-200
Usage:     Loading placeholders for cards, text, dashboard panels
```

---

## 5. Layout System

Location: `src/components/layout/`

### Sidebar (`Sidebar.tsx`)

```
┌─────────────────────────────────┐
│ 🎓 CoICT — IPT                  │  ← University logo + title
│    2025/2026                    │
├─────────────────────────────────┤
│ 📊 Dashboard                    │  ← Active: primary bg + text
│ 📝 Select Clusters              │  ← Inactive: slate, hover highlight
│ 📋 My Application               │
│ 📤 Upload Report                │
│                                 │
├─────────────────────────────────┤
│ 🚪 Sign Out                     │  ← Red hover
│ ◀  Collapse                     │  ← Toggle to 72px
└─────────────────────────────────┘

Behavior:
  - Default: 256px wide, all labels visible
  - Collapsed: 72px wide, icons only, tooltips (future)
  - Mobile (<1024px): Hidden, shown via MobileNav drawer
  - Role-aware: Student nav vs Admin nav items
  - Active state: Page highlighting via usePathname()
```

### TopNav (`TopNav.tsx`)

```
┌──────────────────────────────────────────────────────────────┐
│ ☰  🎓 CoICT — IPT 2025/2026      🌙 🔔  │ John Doe      │
│       Industrial Practical Training       │ S00123     [J] │
└──────────────────────────────────────────────────────────────┘

Components (left→right):
  1. Menu toggle (mobile only) — opens MobileNav
  2. University branding — logo + title + subtitle
  3. Theme toggle — Sun/Moon icon, uses next-themes
  4. Notification bell — placeholder
  5. User profile — name, ID, avatar initial (A for admin)

Behavior:
  - Sticky at top, z-30
  - Backdrop blur on scroll (bg-white/80)
  - Left offset matches sidebar width (64 or 256px)
  - Responsive: hides branding text on small screens
```

### MobileNav (`MobileNav.tsx`)

```
Slide-out drawer for screens < 1024px wide:

┌────────────────────┐
│ CoICT — IPT     ✕  │
├────────────────────┤
│ 📊 Dashboard       │
│ 📝 Select Clusters │
│ ...                │
├────────────────────┤
│ 🚪 Sign Out        │
└────────────────────┘

Features:
  - Overlay backdrop (bg-black/50, click to close)
  - Slide animation (translate-x)
  - Same nav items as sidebar
  - Auto-closes on navigation
```

### AppLayout (`AppLayout.tsx`)

```
Wraps all authenticated pages:

<AppLayout role="student|admin">
  <Sidebar />     ← Persistent desktop nav
  <MobileNav />   ← Slide-out mobile nav
  <TopNav />      ← Top bar with theme/user
  <main>          ← Page content with responsive padding
    {children}
  </main>
</AppLayout>

Features:
  - Auth check on mount (GET /api/auth/me)
  - Redirects to /login if unauthenticated or wrong role
  - Loading spinner during auth check
  - Responsive content padding
  - Fade-in animation on content load
```

---

## 6. Page Redesigns

### 6.1 Login Page (`/`)

```
┌──────────────────────┬──────────────────────────────────┐
│                      │                                  │
│   🎓 (logo)          │        Sign In                   │
│                      │                                  │
│   CoICT — IPT        │   [Student] [Register] [Admin]   │
│   2025/2026          │                                  │
│                      │   Registration Number or Email   │
│   Industrial         │   [___________________________]   │
│   Practical          │                                  │
│   Training           │   Password                       │
│                      │   [___________________________]   │
│   Cluster Selection  │                                  │
│   Portal             │   [     Sign In  →     ]         │
│                      │                                  │
│   Mbeya University   │   Demo: 20250001 / Student@123   │
│   of Science and     │                                  │
│   Technology         │                                  │
└──────────────────────┴──────────────────────────────────┘

Design:
  - Split-screen: brand panel (left, primary gradient) + form (right, white)
  - On mobile: brand collapses to small logo + title above form
  - Tab bar: animated pill selection (Student | Register | Admin)
  - Framer Motion: AnimatePresence for tab content transitions
  - Form: Label + Input pattern, full-width submit button
  - Demo credentials: subtle hint below form
```

### 6.2 Student Dashboard (`/student/dashboard`)

```
Sections (top→bottom):

1. HEADER
   Welcome back, [First Name]
   S00123 · ETE · BSc. Electronic Engineering
                                                    [Start Application]

2. APPLICATION STATUS (if applied)
   ┌──────────────────────────────────────────────┐
   │ ✓  Allocated!                    [View →]    │
   │    You have been allocated to                │
   │    [Computer Maintenance and Peripherals]    │
   └──────────────────────────────────────────────┘

   OR (if not applied):
   ┌ - - - - - - - - - - - - - - - - - - - - - - ┐
   │  ⓘ  No Application Yet                       │
   │     Browse clusters and select 3 preferences  │
   │     [Select Clusters]                         │
   └ - - - - - - - - - - - - - - - - - - - - - - ┘

3. STAT CARDS (4 columns)
   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
   │ 📚       │ │ 👥       │ │ 🎓       │ │ ✓        │
   │ Clusters │ │ Capacity │ │ Dept     │ │ Status   │
   │ 9        │ │ 1,396    │ │ ETE      │ │ Pending  │
   └──────────┘ └──────────┘ └──────────┘ └──────────┘

4. CLUSTER GRID (3 columns, responsive)
   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
   │ Comp Maint   │ │ Networking   │ │ SW Dev       │
   │ [Eligible]   │ │ [Restricted] │ │ [Eligible]   │
   │              │ │              │ │              │
   │ Description  │ │ Description  │ │ Description  │
   │ ████████░░ 70%│ │ ██████░░░ 55%│ │ ████░░░░░ 40%│
   │ 📍 Lab 1     │ │ 📍 Block B   │ │ 📍 Hub       │
   │ 👥 2 staff   │ │ 👥 2 staff   │ │ 👥 2 staff   │
   │ [ETE][CSE]   │ │ [ETE][IST]   │ │ [IF][CSE]    │
   └──────────────┘ └──────────────┘ └──────────────┘

Key features:
  - Eligibility badge per cluster (green "Eligible" / gray "Restricted")
  - Department tags highlighted for matching dept
  - Capacity bar with color coding (<70% blue, <90% amber, >90% red)
  - Skeleton loading state for all cards while fetching
```

### 6.3 Student Apply — Cluster Selection (`/student/apply`)

```
Select Your Clusters
Choose 3 clusters in order of preference.  Dept: [ETE]

●───────○───────○
1st     2nd     3rd
Choice  Choice  Choice

┌─────────────────────────────────────────────────┐
│  First Preference                               │
│  Select one cluster from the options below      │
│                                                 │
│  ┌───────────────────────────────────────┐ (✓) │
│  │ Computer Maint...         [Selected]  │     │
│  │ Description text...                   │     │
│  │ 📍 Workshop 1  👥 Kamau, Otieno      │     │
│  │ 0/144 enrolled                        │     │
│  │ ████████████████████████████░░░░░░░░░ │     │
│  └───────────────────────────────────────┘     │
│                                                 │
│  ┌───────────────────────────────────────┐ (1) │
│  │ Embedded Systems...                   │     │
│  │ 📍 IoT Lab  👥 Mutua, Wambui         │     │
│  │ ████████████████░░░░░░░░░░░░░░░░░░░░  │     │
│  └───────────────────────────────────────┘     │
│                                                 │
│                [Back]   1 2 3   [Next →]       │
└─────────────────────────────────────────────────┘

Design:
  - Steps component: connected circles showing progress
  - Radio-card pattern: clickable full-width cards with selection state
  - Framer Motion: AnimatePresence slide-left/right between steps
  - Selected cluster shown with blue border + checkmark
  - Bottom bar: Back/Next navigation + preference indicators (1 2 3 circles)
  - Locked state: if already allocated, shows warning card with "View Status" link
```

### 6.4 Student Status (`/student/status`)

```
My Application
📅 Submitted Monday, June 10, 2025

┌──────────────────────────────────────┐
│ Progress                             │
│                                      │
│ ●───────●───────○                    │
│ Submittd  Revwng  Alloctd            │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ Your Preferences                     │
│                                      │
│ 1st Choice    [Comp Maintenance]     │  ← amber badge
│ 2nd Choice    [Embedded Systems]     │  ← slate
│ 3rd Choice    [IoT & Robotics]       │
└──────────────────────────────────────┘

┌◆─────────────────────────────────────┐
│ 📍 Allocated Cluster                 │
│    Embedded Systems and IoT          │  ← emerald left border
└──────────────────────────────────────┘

           [ ✏️ Modify Preferences ]    ← only if pending
```

### 6.5 Student Report Upload (`/student/report`)

```
Upload Report
Submit your IPT report for Embedded Systems and IoT

┌──────────────────────────────────────┐
│ Report File                          │
│ Upload a PDF or Word doc (max 10MB)  │
│                                      │
│  ┌ - - - - - - - - - - - - - - - ┐   │
│  │      📤                        │   │
│  │  Click to select a file        │   │
│  │  PDF, DOC, or DOCX — 10MB     │   │
│  └ - - - - - - - - - - - - - - - ┘   │
│                                      │
│  📄 report.pdf  [✕]   2.3 MB        │  ← file preview (if selected)
│                                      │
│  [          📤 Upload Report      ]  │
└──────────────────────────────────────┘

┌◆─────────────────────────────────────┐
│ ✓ Report Submitted                   │  ← only if reportUrl exists
│    Your report has been received.     │
└──────────────────────────────────────┘

States:
  - No application → "Submit your application first"
  - Not allocated → "Report upload available after allocation" + CTA
  - Ready → Upload zone + file preview + submit button
  - Uploaded → Confirmation card with green border
```

### 6.6 Admin Dashboard (`/admin/dashboard`)

```
Admin Overview
IPT Application Management Dashboard

┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ 📋       │ │ 🕐       │ │ ✓        │ │ 📚       │
│ Total    │ │ Pending  │ │ Allocatd │ │ Clusters │
│ 24       │ │ 12       │ │ 8        │ │ 9        │
└──────────┘ └──────────┘ └──────────┘ └──────────┘

┌──────────────────────┐ ┌──────────────────────┐
│ 👥 Apps by Dept      │ │ 📈 Cluster Capacity  │
│                      │ │                      │
│ ETE  ████████░░  8   │ │ Comp Maint  ████  0% │
│ IST  ██████░░░  6   │ │ Networking  ████  0% │
│ IF   ████░░░░░  4   │ │ SW Dev      ████  0% │
│ CSE  ███░░░░░░  3   │ │ ...                 │
│ CSTE ███░░░░░░  3   │ │                      │
└──────────────────────┘ └──────────────────────┘
```

### 6.7 Admin Allocations (`/admin/allocations`)

```
Allocations                         12 pending
                          [⚡ Auto-Allocate All]

[All] [Pending] [Allocated]          [Filter ▾] All Depts

┌──────────────────────────────────────────────────────────┐
│ Student          │ Dept │ Preferences     │ Status  Actn │
├──────────────────┼──────┼─────────────────┼──────────────┤
│ 👤 John Doe      │ [ETE]│ 1: Comp Maint   │ [Pending]    │
│   S00123         │      │ 2: Embedded     │   [Alloc▾]   │
│                  │      │ 3: Networking   │              │
├──────────────────┼──────┼─────────────────┼──────────────┤
│ 👤 Jane Smith    │ [CSE]│ 1: SW Dev       │ [Cybersec]   │
│   S00456         │      │ 2: AI & Data    │  Allocated   │
│                  │      │ 3: Cybersec     │              │
└──────────────────┴──────┴─────────────────┴──────────────┘

Auto-allocate: Single PUT request → server-side engine → refresh table
```

### 6.8 Admin Students (`/admin/students`)

```
Students                            1,396 registered

┌────┐ ┌────┐ ┌────┐ ┌────┐
│ 👥 │ │ 📄 │ │ ✓  │ │ 🕐 │
│Totl│ │Appd│ │Allc│ │Pend│
└────┘ └────┘ └────┘ └────┘

🔍 [Search by name, ID, email...]       [All Departments ▾]

┌──────────────────────────────────────────────────────┐
│ Student         │ Program         │ Dept │ Stat  Allc│
├─────────────────┼─────────────────┼──────┼───────────┤
│ John Doe        │ BSc. Electronic │ [ETE]│ [Pend] — │
│ S00123          │ Engineering     │      │           │
├─────────────────┼─────────────────┼──────┼───────────┤
│ Jane Smith      │ BSc. Comp Sci   │ [CSE]│ [Allc]    │
│ S00456          │                 │      │  Cybersec │
└─────────────────┴─────────────────┴──────┴───────────┘
```

### 6.9 Admin Export (`/admin/export`)

```
Export Data
Download reports for offline analysis

┌─────────────────────────┐ ┌─────────────────────────┐
│ 📊 Applications CSV     │ │ 📋 Cluster Summary      │
│ All apps with details   │ │ Enrollment per cluster  │
│ [⬇ Download]            │ │ [Download]              │
└─────────────────────────┘ └─────────────────────────┘

┌─────────────────────────────────────────┐
│ CSV Columns                             │
│ [Student ID] [Full Name] [Department]   │
│ [Program] [Email] [Preference 1]        │
│ [Preference 2] [Preference 3]           │
│ [Status] [Allocated Cluster]            │
│ [Submission Date]                       │
└─────────────────────────────────────────┘
```

---

## 7. Animations & Micro-Interactions

| Pattern | Implementation | Usage |
|---|---|---|
| **Page transitions** | `AnimatePresence` + `motion.div` (opacity + y) | Login tabs, step transitions |
| **Step transitions** | `AnimatePresence mode="wait"` with x-axis slide | Cluster selection (1→2→3) |
| **List entrance** | Staggered `initial={{ opacity: 0, x: -12 }}` | Status page preferences |
| **Message alerts** | `initial={{ opacity: 0, y: -8 }}` slide-in | Success/error notifications |
| **Hover effects** | `transition-all duration-200` + shadow lift | Cards, buttons, nav items |
| **Progress bars** | `transition-all duration-500 ease-out` | Capacity utilization |
| **Theme toggle** | Instant class swap (no transition to avoid flash) | Light ↔ Dark |
| **Sidebar collapse** | `transition-all duration-300 ease-in-out` | Width change 256→72px |
| **Mobile drawer** | `transition-transform duration-300 ease-in-out` | Slide in/out |
| **Skeleton loading** | `animate-pulse` | Dashboard data loading |

---

## 8. Responsive Breakpoints

| Breakpoint | Behavior |
|---|---|
| **< 640px (sm)** | Single column grids, full-width cards, condensed tables |
| **< 768px (md)** | Hidden table columns (Program, Allocation), full-width forms |
| **< 1024px (lg)** | MobileNav replaces Sidebar, hamburger menu visible |
| **≥ 1024px (lg)** | Persistent sidebar, multi-column grids, full tables |
| **≥ 1280px (xl)** | Max-width content containers (max-w-6xl / max-w-7xl) |

All interactive elements meet minimum 44×44px touch targets on mobile.

---

## 9. Accessibility

| Feature | Implementation |
|---|---|
| **Color contrast** | All text meets WCAG AA (4.5:1 for normal, 3:1 for large) |
| **Focus indicators** | `focus-visible:ring-2 ring-offset-2` on all interactive elements |
| **Keyboard nav** | All buttons, links, selects keyboard-operable |
| **ARIA labels** | `aria-label` on icon-only buttons, `aria-current="page"` on active nav |
| **Screen readers** | Semantic HTML (`<nav>`, `<main>`, `<header>`), role attributes |
| **Reduced motion** | Framer Motion respects `prefers-reduced-motion` via CSS fallbacks |
| **Form labels** | All inputs have associated `<Label>` components |

---

## 10. File Structure

```
src/
├── app/
│   ├── layout.tsx                          # Root layout + ThemeProvider
│   ├── globals.css                         # Design tokens + Tailwind + animations
│   ├── page.tsx                            # Login page (split-screen design)
│   ├── student/
│   │   ├── dashboard/page.tsx              # Student dashboard
│   │   ├── apply/page.tsx                  # 3-step cluster selection
│   │   ├── status/page.tsx                 # Application tracker
│   │   └── report/page.tsx                 # Report upload
│   └── admin/
│       ├── dashboard/page.tsx              # Admin overview
│       ├── allocations/page.tsx            # Allocation management
│       ├── students/page.tsx               # Student list
│       └── export/page.tsx                 # Data export
├── components/
│   ├── theme-provider.tsx                  # next-themes wrapper
│   ├── layout/
│   │   ├── AppLayout.tsx                   # Authenticated page wrapper
│   │   ├── Sidebar.tsx                     # Desktop sidebar nav
│   │   ├── TopNav.tsx                      # Top app bar
│   │   └── MobileNav.tsx                   # Mobile slide-out nav
│   └── ui/
│       ├── button.tsx                      # Button (6 variants, 4 sizes)
│       ├── card.tsx                        # Card (header/content/footer)
│       ├── badge.tsx                       # Badge (6 variants)
│       ├── form.tsx                        # Input, Select, Label
│       ├── table.tsx                       # Table (header/body/row/cell)
│       ├── progress.tsx                    # Progress bar (4 sizes, 4 colors)
│       ├── steps.tsx                       # Step indicator
│       └── skeleton.tsx                    # Loading skeleton
└── lib/
    └── utils.ts                            # cn() utility (clsx + twMerge)
```

---

## 11. Design Decisions & Trade-offs

| Decision | Rationale |
|---|---|
| **Light mode default** | Academic/professional context; better readability in classrooms and offices |
| **Geist font** | Clean, modern, excellent readability; Google-inspired; pairs well with Inter |
| **Lucide over Heroicons** | Larger icon set (1500+), MIT license, consistent 24px outlined style |
| **shadcn/ui patterns** | Industry standard component patterns (CVA variants, Slot, forwardRef) without the full dependency |
| **Framer Motion, sparingly** | Only for meaningful transitions (steps, page changes, alerts); no decorative animations |
| **Server-side auto-allocate** | Moves allocation logic to a single PUT endpoint; avoids N sequential client requests |
| **Collapsible sidebar** | Saves horizontal space on laptops; 72px icon mode for power users |
| **Separate report page** | Clean separation of concerns; report upload is a distinct workflow (final week) |

---

## 12. Before/After Comparison

| Aspect | Before | After |
|---|---|---|
| **Icons** | Emojis (📊, 📝, 📋, etc.) | Lucide React icons (consistent, semantic) |
| **Navigation** | Tab bar below header | Persistent left sidebar + mobile drawer |
| **Theme** | Dark default, poor contrast | Light default, full dark mode toggle |
| **Cards** | Flat, no hover | Rounded, shadow, hover lift, color-coded borders |
| **Tables** | Raw HTML | Proper header/body/row/cell with hover states |
| **Forms** | Native inputs | Styled Input/Select/Label with focus rings |
| **Status** | Raw text | Badge component with semantic colors |
| **Loading** | Spinner only | Skeleton cards + pulse animation |
| **Transitions** | None | Framer Motion page/step/list animations |
| **Login** | Single column form | Split-screen (brand + form), animated tabs |
| **Cluster selection** | Radio buttons | Animated step walkthrough with radio cards |
| **Mobile** | Basic responsive | Collapsible sidebar, slide-out drawer, touch targets |
| **Accessibility** | Minimal | ARIA labels, focus rings, semantic HTML, contrast ratios |
