# Project Structure Rules & Guidelines

**Purpose:** Standard directory and file organization rules for AI agents and developers to follow when creating features and components in Next.js projects.

---

## Directory Structure Overview

```
project-root/
├── app/                    # Next.js App Router (primary application code)
│   ├── (route-group)/      # Route groups: auth, admin, student, professor, etc.
│   │   ├── _components/    # Components scoped only to this route group
│   │   ├── feature-folder/
│   │   │   ├── page.tsx
│   │   │   └── layout.tsx
│   │   └── actions.ts      # Server actions for this route group
│   ├── api/                # API routes and webhooks
│   ├── data/               # Server-side data access layer
│   ├── error.tsx
│   ├── not-found.tsx
│   └── layout.tsx
├── components/             # Shared UI components (used across route groups)
├── lib/                    # Core utilities, services, helpers
│   ├── auth.ts             # Server-side auth logic
│   ├── auth-client.ts      # Client-side auth logic
│   ├── prisma.ts           # Prisma client
│   ├── utils/              # Utility functions (formatDate.ts, etc.)
│   ├── zod-schema.ts       # Zod validation schemas
│   └── types.ts
├── hooks/                  # React hooks
├── public/                 # Static assets
```

---

## Naming Conventions

- **Files & Folders:** Use `kebab-case` (dashes, not underscores or camelCase)
  - ✅ `user-profile.tsx`, `admin-dashboard/`
  - ❌ `userProfile.tsx`, `admin_dashboard/`
- **Components & Classes:** Use `PascalCase` (CapitalCase)
  - ✅ `UserProfile`, `AdminDashboard`
  - ❌ `userProfile`, `admin-dashboard`
- **Variables/Functions:** Use `camelCase` (lowercase start)
  - ✅ `getUserData()`, `isAdminUser`
  - ❌ `get-user-data()`, `IsAdminUser`

---

## App Router Structure (route-groups)

### Route Group Organization

Use **route groups** `(groupName)` to organize features by role/domain:

```
app/
├── (auth)/               # Authentication routes
│   ├── _components/      # Forms, modals, dialogs scoped to auth
│   ├── login/
│   │   ├── page.tsx
│   │   └── layout.tsx
│   ├── register/
│   ├── forgot-password/
│   └── actions.ts        # ALL server actions for auth routes
├── (admin)/
│   ├── _components/      # Admin-only components
│   ├── admin/
│   │   ├── users/
│   │   ├── subjects/
│   │   └── dashboard/
│   └── actions.ts
├── (student)/
│   ├── _components/      # Student-only UI
│   ├── student/
│   │   ├── courses/
│   │   └── grades/
│   └── actions.ts
└── (user)/               # General user routes
    ├── profile/
    └── actions.ts
```

### Within Each Route Group

```
(groupName)/
├── _components/          # MUST BE HERE: UI components used ONLY in this group
│   ├── user-form.tsx
│   ├── user-card.tsx
│   └── dialogs/
├── feature-folder/
│   ├── page.tsx          # Route page
│   ├── layout.tsx        # Route layout (optional)
│   └── _components/      # (optional) feature-level components
├── layout.tsx            # Group-level layout
└── actions.ts            # Server mutations for entire group
```

**Rule:** If a component is used in multiple groups, move it to [components/](components/) instead.

---

## Server-Side Architecture (data/)

All database reads must go in `data/` directory:

```
data/
├── admin/
│   ├── get-all-users.ts
│   ├── get-user-by-id.ts
│   └── get-dashboard-stats.ts
├── student/
│   ├── get-student-courses.ts
│   └── get-student-grades.ts
├── session/
│   └── require-session.ts  # Auth utility, NOT a query
├── permission/
│   └── require-permission.ts
└── user/
    └── get-user-profile.ts
```

**Rule:** Every database fetch (Prisma query) goes in `data/`. This separates read logic from UI rendering.

---

## Server Actions & Mutations (actions.ts)

```
(groupName)/
└── actions.ts            # Mutations for this route group
```

**Rules for actions.ts:**

- Include `"use server"` at the very top
- Export async functions that return `Promise<ApiResponseType>`
- Do NOT throw `Error` directly; return `{ status: "error", message: "..." }`
- Always include auth check: `await requireSession()`
- Include permission checks if needed: `await requirePermission({ user: ["permission-name"] })`
- Use `errorMessage(error)` to format errors
- Pattern:

```typescript
"use server";

import { requireSession } from "@/app/data/session/require-session";
import { errorMessage } from "@/lib/error-message";

export async function updateUser(
  userId: string,
  data: UpdateUserInput
): Promise<ApiResponseType> {
  await requireSession();

  try {
    // Validation
    const validated = updateUserSchema.safeParse(data);
    if (!validated.success) {
      return { status: "error", message: "Invalid input" };
    }

    // Mutation
    await prisma.user.update({
      where: { id: userId },
      data: validated.data,
    });

    return { status: "success", message: "User updated" };
  } catch (error) {
    return { status: "error", message: errorMessage(error) };
  }
}
```

---

## Components (Shared UI)

```
components/
├── ui/                   # Shadcn/UI components & primitives
├── user/
│   ├── user-avatar.tsx
│   └── user-image.tsx
├── general/
│   ├── header.tsx
│   └── footer.tsx
├── theme-provider.tsx
└── theme-toggle.tsx
```

**Rule:** Only components used across **2+ route groups** go here. Group-specific UI stays in `(groupName)/_components/`.

---

## Validation Schemas (lib/zod-schema.ts)

All Zod schemas go in one file:

```typescript
// lib/zod-schema.ts
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type LoginSchemaType = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8),
});

export type RegisterSchemaType = z.infer<typeof registerSchema>;
```

---

## Utilities & Helpers (lib/utils/)

Create small, focused utility files:

```
lib/utils/
├── format-date.ts
├── format-currency.ts
├── get-initials.ts
├── constants.ts
└── helpers.ts
```

Import: `import { formatDate } from "@/lib/utils"`

---

## Hooks (hooks/)

Reusable React hooks:

```
hooks/
├── use-try-catch.ts       # Async error handling hook
├── use-signout.ts         # Client-side signout
├── use-mobile.ts          # Mobile media query check
├── use-scroll.ts
└── use-permission.ts
```

---

## Prisma Schema & Seeding (prisma/)

```
prisma/
├── schema.prisma          # Database schema
├── migrations/            # Auto-generated migrations
└── seed/
    ├── seed.ts            # Main seed orchestrator
    ├── seed-users.ts      # Seed specific entity types
    ├── seed-courses.ts
    └── utils.ts           # Shared seed helpers
```

**Seeding Rules:**

- Use `upsert` on unique keys to prevent duplicates
- Assign hardcoded string IDs: `user-admin-01`, `prof-cs-01`
- Always verify relationships exist before creating dependents
- Use fake images: `https://avatar.vercel.sh/${name.toLowerCase().split(" ")[0]}`

---

## Form Implementation Pattern

```tsx
// (groupName)/_components/my-form.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { mySchema } from "@/lib/zod-schema";
import { useTransition } from "react";
import { startTransition } from "react";
import { toast } from "sonner";
import { myAction } from "../actions";

export function MyForm() {
  const [isPending, startTransition] = useTransition();
  const form = useForm({
    resolver: zodResolver(mySchema),
  });

  async function onSubmit(data: MySchemaType) {
    startTransition(async () => {
      const result = await myAction(data);
      if (result.status === "success") {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Form fields */}
      <button disabled={isPending}>Submit</button>
    </form>
  );
}
```

---

## Data Fetching Pattern (Server Components)

```tsx
import { Suspense } from "react";
import { getUsers } from "@/data/admin/get-users";

// Loading skeleton
function UsersSkeleton() {
  return <div>Loading...</div>;
}

// Server component that fetches
async function UsersWrapper() {
  const users = await getUsers();
  return <UsersTable users={users} />;
}

// Main page component
export default function Page() {
  return (
    <div>
      <Suspense fallback={<UsersSkeleton />}>
        <UsersWrapper />
      </Suspense>
    </div>
  );
}
```

---

## Authentication Pattern

### Server-Side (lib/auth.ts)

```typescript
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "@/lib/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma),
  // ... config
});
```

### Check Auth in Server Actions

```typescript
import { requireSession } from "@/app/data/session/require-session";

export async function protectedAction() {
  await requireSession(); // Throws if not authenticated
  // Safe to proceed
}
```

### Client-Side Auth (lib/auth-client.ts)

```typescript
import { createAuthClient } from "better-auth/react";

export const { signOut } = createAuthClient();
```

---

## Do's & Don'ts

### ✅ DO

- Use server actions for mutations
- Use `data/` for all database reads
- Group route-specific components in `(group)/_components/`
- Use Zod for form validation
- Import Prisma as: `import prisma from "@/lib/prisma"`
- Use `formatDate()` from `@/lib/utils` for dates
- Use `sonner` toast for notifications
- Use React `startTransition` for async UI updates
- Wrap permissions in `requirePermission()` call
- Use `Suspense` + skeleton loaders for better UX

### ❌ DON'T

- Edit `package.json` or `tsconfig.json` (unless explicitly requested)
- Use `throw new Error()` in actions; return error response instead
- Put shared components in `_components` (keep those for group-only UI)
- Make direct DB calls in Client Components
- Hardcode authentication checks inline; use utilities
- Create barrel files (`index.ts` exports) for large modules
- Import from `node_modules` directly for styling; use Tailwind/CSS modules
- Use dynamic imports where static imports work fine

---

## When Creating a New Feature

1. **Pick a route group** or create one: `app/(newgroup)/`
2. **Create the page structure:**
   ```
   app/(newgroup)/
   ├── _components/          (UI for this group)
   ├── feature-name/
   │   ├── page.tsx
   │   └── layout.tsx
   ├── layout.tsx
   └── actions.ts            (server mutations)
   ```
3. **Plan data fetching:** Create queries in `data/newgroup/get-*.ts`
4. **Design forms:** Create form components in `(newgroup)/_components/`
5. **Add actions:** Server mutations go in `(newgroup)/actions.ts`
6. **Add validation:** Schemas go in `lib/zod-schema.ts`
7. **Test & document** in respective sections

---

## Imports Quick Reference

```typescript
// Database
import prisma from "@/lib/prisma";

// Auth
import { requireSession } from "@/app/data/session/require-session";
import { requirePermission } from "@/lib/permissions";

// Validation
import { mySchema } from "@/lib/zod-schema";

// Utilities
import { formatDate } from "@/lib/utils";

// Components
import { Component } from "@/components/component-name";
import { Button } from "@/components/ui/button";
import { useSignout } from "@/hooks/use-signout";
```

---

## TypeScript Types

```typescript
// API Response type
type ApiResponseType =
  | { status: "success"; message: string }
  | { status: "error"; message: string };

// Page Props (properly typed)
import { PageProps } from "@/lib/types";

export default async function Page(props: PageProps<"/route/[param]">) {
  const { id } = await props.params;
  // ...
}
```

---

## Notes for AI Agents

When following this structure:

- **Always respect the directory names and nesting**—they indicate scope and ownership
- **Enforce the "shared vs. group-specific" rule**—components in `_components` must not appear in multiple groups
- **Keep data access separated**—never mix DB queries with component logic
- **Use the exact import paths** provided in the imports section
- **Follow the action/mutation pattern** exactly—consistency matters for maintainability
- **Ask clarifying questions** if a feature could belong to multiple groups

---

## Last Updated: March 25, 2026
