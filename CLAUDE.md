# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # start dev server (Turbopack)
npm run build    # production build
npm run lint     # ESLint

# Prisma — schema changes
npx prisma migrate dev --name <name>   # create + apply a migration
npx prisma migrate deploy              # apply pending migrations (prod)
npx prisma studio                      # browser-based DB viewer
npx prisma generate                    # regenerate client after schema edits
```

**Two separate DB URLs are required:**
- `DATABASE_URL` — used by the app at runtime (via `@prisma/adapter-pg`)
- `DIRECT_URL` — used by `prisma.config.ts` for migrations (bypasses connection pooling)

## Architecture

### Multi-tenancy
Everything in the DB scopes to an `Organization`. There is no auth yet — `ORG_ID = "org-after-now-001"` is hardcoded in every page component. All API routes currently omit org filtering (they return all rows). This will need to be wired up when auth is added.

### BudgetTier system
The central pricing concept. A `BudgetTier` (T1–T5) on a `Job` drives automatic rate resolution for both gear and crew:

1. **Gear rates** — resolved in order: `GearTierRate.dayRate` → `GearTierRate.discountPct` off `Item.standardDayRate` → `TierDefaultDiscount` (org-wide fallback) → `Item.standardDayRate`
2. **Crew rates** — resolved in order: `CrewMemberTierRate` (individual override) → `RoleTierRate` (role default at that tier) → `CrewMember.standardDayRate`

The `JobForm` UI exposes budget tier as a 1–5 toggle but doesn't yet persist it to the DB (the `tierId` field on `Job` isn't wired up in the API route).

### Route and file structure
```
src/app/
  (dashboard)/          # route group — shares Sidebar layout
    page.tsx            # dashboard home (stat cards, currently static)
    jobs/page.tsx
    crew/page.tsx
    clients/page.tsx
    inventory/page.tsx
  api/
    jobs/route.ts       # GET/POST/PUT/DELETE
    crew/route.ts
    clients/route.ts
    inventory/route.ts
src/components/
  layout/Sidebar.tsx    # fixed left nav, client component
  jobs/JobForm.tsx      # slide-in drawer, client component
  crew/CrewForm.tsx
  clients/ClientForm.tsx
  inventory/ItemForm.tsx
src/lib/
  prisma.ts             # singleton PrismaClient using @prisma/adapter-pg
  supabase/
    client.ts           # browser Supabase client
    server.ts           # server-side Supabase client (cookie-aware)
```

### Prisma client
Uses `@prisma/adapter-pg` (the driver adapter pattern) instead of the default connector. The singleton in `src/lib/prisma.ts` constructs a `PrismaPg` adapter from `DATABASE_URL` and passes it to `PrismaClient`. This is the correct approach for Supabase + connection pooling — do not switch to `datasource.url` in schema.prisma.

### UI patterns
All four module pages follow the same pattern:
- Server-rendered shell + client component (`"use client"`)
- `useEffect` on mount to `fetch("/api/...")` and populate local state
- Optimistic updates: mutate local state immediately on save/delete without re-fetching
- Right-click context menu (`contextMenu` state + `useRef` for outside-click dismissal)
- Slide-in drawer form (`showForm` state) — fixed overlay, right-aligned panel

Styling is **inline `style` props throughout** — Tailwind utility classes are only used in the dashboard stat cards. Do not mix approaches; new UI should match the inline-style pattern used in the existing pages and forms.

### Crew roles
Roles are created on-the-fly in the API when a crew member is saved with a role name that doesn't exist yet. The `CrewMemberRole` join table tracks `isPrimary` (one per member) and `sortOrder`. The PUT route deletes all existing `CrewMemberRole` rows and re-creates them on every save.
