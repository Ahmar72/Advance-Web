---
description: "Use when creating or refactoring Next.js app routes, layouts, data-access modules, and Supabase integrations in this project. Enforces route-group structure, server-first patterns, app/data usage, and auth/navigation conventions."
name: "Next.js Directory Structure Rules"
applyTo:
  - "app/**/*.ts"
  - "app/**/*.tsx"
  - "components/**/*.ts"
  - "components/**/*.tsx"
  - "lib/**/*.ts"
  - "lib/**/*.tsx"
  - "hooks/**/*.ts"
  - "hooks/**/*.tsx"
---

# Next.js Directory Structure Rules

- Prefer Server Components. Add `"use client"` only when browser-only APIs, local interactive state, or client-side hooks are required.
- Use feature-based routing with route groups in `app/` (for example `(public)`, `(auth)`, `(admin)`, `(client)`).
- Do not place the primary public page in `app/page.tsx`. Use route-group pages/layouts (for example `(public)/layout.tsx` and `(public)/page.tsx`).
- Keep reusable layout UI in `app/components/` or `components/` (header, sidebar, footer), then compose it inside route-group layouts, not the root `app/layout.tsx`.

## Data Access

- Fetch server-side data through `app/data/**/*.ts` modules.
- Organize by role/feature where relevant:
- `app/data/admin/*` for admin fetchers (for example `admin-get-all-ads.ts`, `admin-get-ad-by-id.ts`).
- `app/data/moderator/*` for moderator fetchers.
- `app/data/auth/require-auth.ts` as the central server auth check.
- Keep fetcher function parameters minimal. Add parameters only for real filter/sort/pagination needs.

## Auth Rules

- Server-side auth gate must use `app/data/auth/require-auth.ts`.
- If user is not authenticated in server auth checks, return `redirect('/unauthorized')`.
- Client-side auth helpers belong in `hooks/use-auth.ts` (or equivalent). Do not use client auth hooks in Server Components.

## Not Found and Navigation

- If a requested resource does not exist, return `notFound()`.
- Never use `<a>` for internal navigation. Use `next/link`.

## Styling and Reuse

- Do not hardcode ad-hoc color values when project color tokens exist in `app/globals.css`. Use existing design tokens/utilities.
- Reuse helpers from `lib/` instead of duplicating utility logic in page components.

## Supabase Placement

- Keep Supabase client access under `lib/supabase/`.
- Keep SQL migrations in `supabase/migrations/`.
- Keep generated database types in `types/supabase.ts`.

## Guardrails

- Do not edit `package.json` directly unless explicitly requested.
