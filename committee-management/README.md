# Committee Management System

Angular + Supabase app for rotating committees with sign-up/login, committee creation, member tracking, payments, progress views, and notifications.

## What is implemented

- Supabase authentication
- Protected dashboard
- Committee creation with duration, monthly amount, and max members
- Committee discovery with creator reputation
- Committee detail page with members, progress, cycles, and payments
- Notifications page with realtime refresh support
- Supabase migration script in `DATABASE_SCHEMA.sql`

## Quick start

1. Create a Supabase project.
2. Copy your project URL and anon key into `src/environments/environment.ts` and `src/environments/environment.prod.ts`.
3. Run the database migration in `DATABASE_SCHEMA.sql` from the Supabase SQL editor.
4. Install dependencies if needed:

```bash
npm install
```

5. Start the app:

```bash
npm start
```

## Database migration

Paste the full contents of `DATABASE_SCHEMA.sql` into the Supabase SQL editor and run it once.

The migration creates:

- `profiles`
- `committees`
- `committee_members`
- `committee_cycles`
- `payments`
- `notifications`
- RLS policies, triggers, helper functions, and summary views

## Testing

Run the unit tests:

```bash
npm test -- --watch=false
```

Run a production build:

```bash
npm run build
```

Manual verification checklist:

- Sign up and confirm the profile is created by the database trigger.
- Sign in and confirm dashboard access.
- Create a committee and verify the creator is auto-added as member 1.
- Open Discover and confirm committee reputation, amount, and member counts show up.
- Open a committee detail page and verify members, progress, cycles, and payments render.
- Open Notifications and confirm unread counts and mark-read actions work.

## Deployment notes

- Use production Supabase environment values in `src/environments/environment.prod.ts`.
- Keep `DATABASE_SCHEMA.sql` in sync with any future table or policy changes.
- Build before deployment with `npm run build`.
- Host the Angular app on Vercel, Netlify, or a similar static host.
- Store sensitive values in the hosting provider’s environment variables if you later move configuration out of the source tree.

## Helpful files

- `src/app/services/supabase.service.ts`
- `src/app/services/auth.service.ts`
- `src/app/services/committee.service.ts`
- `src/app/pages/committee/create.ts`
- `src/app/pages/committee/discover.ts`
- `src/app/pages/committee/detail.ts`
- `src/app/pages/notifications/notifications.ts`
- `DATABASE_SCHEMA.sql`
