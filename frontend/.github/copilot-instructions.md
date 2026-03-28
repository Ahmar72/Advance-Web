i am using nextjs, supabase and tailwindcss, windows, pnpm

i will referrence files one by one and your task is fix those files for optimization.

supabase client is inside lib/supabase/

## Directory structure:

use server-components over client.
use feature based directory structre with route groups.

if resource not found use

```ts
return notFound();
```

### for example:

`(admin)/admin`
/page.tsx for admin dashboard.
/ads/page.tsx for listing adn viewing ads as admin.

`(client)/ads/`
page.tsx home page for client showing their all ads sorting based on createdAt.

`app/data/`

create or use app/data/\*\*.ts for fethcing data on server side, use parameters IFF necessary like for filtering/sorting.

- to fetch data on server side for better-performance.

`data/admin/`

- for getting data for admin.
  admin-get-all-ads.ts // gets all ads that are approved by moderator.
  admin-get-ad-by-id.ts // gets ad details,

`data/moderator/`

- for moderator

`data/auth/`

`require-auth.ts` for getting auth and return user info, if not authed `return redirect('/unauthorized');`
require-auth is central file to check auth on server-side.
create hooks/use-auth.ts for client side auth check, dont use this in server components.

update or create reusable components for header, sidebar, footer that can be reused, dont use these headers footer in app/layout.tsx, use new route group with page.tsx (public)/layout.tsx and use here, no app/page.tsx directly.

`app/components/`

create or use components dir foor reusable components,
dont use hardcoded colors, css is inside globals.css, use these colors instead.

never use <a> tag for internal navigation.

dont edit package.json directly.
create role based header.

create or update nextjs proxy.ts, use nextjs skills for more info or refer to [nextjs](https://context7.com/vercel/next.js/llms.txt?tokens=10000)

supabase migrations are inside supabase/
types are genrate inside types/
run `pnpm dlx supabase db push` for pushing migrations to supbase
and pnpm dlx supabase gen types typescript --project-id YOUR_PROJECT_REF > types/supabase.ts,

use or create lib/ for reusable functions instead of creating in everyfile
