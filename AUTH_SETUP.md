# GitHub OAuth Authentication Setup Guide

Complete authentication system built with Supabase GitHub OAuth, following [official Supabase GitHub auth documentation](https://supabase.com/docs/guides/auth/social-login/auth-github).

## Overview

This implementation provides:
- ✅ GitHub OAuth sign-in via Supabase
- ✅ Backend API routes for token exchange
- ✅ JWT token verification middleware
- ✅ Frontend Auth Context with `useAuth()` hook
- ✅ Protected routes with automatic redirect
- ✅ Session persistence across page refresh
- ✅ Professional UI with `useTransition` loading states

---

## Backend Setup

### Environment Variables

Create `.env` in `backend/` (copy from `.env.example`):

```env
PORT=4000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-public-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

### Backend Architecture

Following the custom backend structure with Supabase integration:

```
backend/src/
├── config/
│   ├── env.ts                 # Zod-validated environment variables
│   └── supabase.ts            # Supabase singleton client (service role key)
│
├── features/auth/
│   ├── auth.types.ts          # TypeScript interfaces for auth
│   ├── auth.schema.ts         # Zod validation schemas
│   ├── auth.service.ts        # Business logic + Supabase Auth calls
│   ├── auth.controller.ts     # Request/response handling
│   └── auth.routes.ts         # Express router
│
├── shared/middleware/
│   ├── auth.middleware.ts     # JWT verification: requireAuth & optionalAuth
│   ├── validate.middleware.ts # Zod-based request validation
│   └── error.middleware.ts    # Global error handling
│
├── routes/
│   └── index.ts               # Central router - registers all routers
│
└── index.ts                   # Express app entry point
```

### Backend API Endpoints

#### Public Endpoints (No auth required)

**GET** `/api/v1/auth/github/signin`
- Returns GitHub OAuth URL for frontend to redirect to
- Response:
  ```json
  {
    "success": true,
    "message": "GitHub OAuth URL generated",
    "data": {
      "url": "https://github.com/login/oauth/authorize?...",
      "provider": "github"
    }
  }
  ```

**POST** `/api/v1/auth/github/callback`
- Exchanges GitHub authorization code for session tokens
- Request body: `{ "code": "string" }`
- Response includes: `access_token`, `refresh_token`, `user` data

**POST** `/api/v1/auth/refresh`
- Exchanges refresh token for new access token
- Request body: `{ "refreshToken": "string" }`

#### Protected Endpoints (Require: `Authorization: Bearer <token>`)

**GET** `/api/v1/auth/me`
- Returns current authenticated user information

**POST** `/api/v1/auth/logout`
- Signs out user by invalidating refresh token

### Technology Stack

- **Runtime**: Node.js
- **Language**: TypeScript (strict mode)
- **Framework**: Express.js
- **Auth**: Supabase Auth (service role key)
- **Validation**: Zod schemas
- **Error Handling**: Centralized middleware
- **Dependencies added**: `zod`

---

## Frontend Setup

### Environment Variables

Create `.env.local` in `frontend/` (copy from `.env.example`):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-public-anon-key
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
```

### Frontend Architecture

```
frontend/app/
├── (auth)/                        # Route group for auth pages (centered layout)
│   ├── layout.tsx                 # Centered auth UI container
│   ├── signin/
│   │   └── page.tsx               # Sign-in page with GitHub button
│   └── callback/
│       └── page.tsx               # OAuth callback handler
│
└── page.tsx                       # Protected home/dashboard

frontend/components/
├── GitHubSignInButton.tsx         # Reusable GitHub sign-in button
└── UserProfileCard.tsx            # User profile display component

frontend/lib/
├── supabaseClient.ts              # Supabase client instance
└── AuthContext.tsx                # Auth context with useAuth() hook
```

### Frontend Components

#### `<AuthProvider>`
Wraps the entire app (in `layout.tsx`). Manages:
- Session loading from localStorage
- Token storage and retrieval
- Auth state management
- Sign-in and sign-out methods

Usage:
```tsx
<AuthProvider>
  {children}
</AuthProvider>
```

#### `useAuth()` Hook
Access auth state anywhere in the app:

```tsx
const { 
  user,              // User object or null
  isLoading,         // Initial auth check loading
  isAuthenticated,   // Boolean: !!user && !!accessToken
  accessToken,       // JWT token
  refreshToken,      // Refresh token
  signInWithGitHub,  // Async function to initiate GitHub sign-in
  signOut,           // Async function to sign out
} = useAuth();
```

#### `<GitHubSignInButton />`
Professional GitHub sign-in button with:
- Loading spinner via `useTransition`
- GitHub icon SVG
- Gradient background
- Hover effects
- Disabled state handling

Props:
```tsx
<GitHubSignInButton 
  disabled={boolean}
  onSign={() => void}
/>
```

#### `<UserProfileCard />`
Displays authenticated user info with:
- Avatar with user initial
- Email and user ID display
- GitHub username from metadata
- Sign out button
- Settings link (placeholder)

Props:
```tsx
<UserProfileCard 
  user={User}
  onSignOut={() => void}
/>
```

### Frontend Pages

#### `/signin` (Sign-in page)
- Beautiful welcome header with GitHub icon
- `<GitHubSignInButton />` component
- Benefits/features list
- Terms of Service footer

#### `/auth/callback` (OAuth callback)
- Receives `?code=...` from GitHub
- Exchanges code for session via backend
- Stores tokens in localStorage
- Redirects to home page
- Shows error state if auth fails

#### `/` (Protected home)
- Displays user profile card
- Shows account status
- Lists logged-in provider (GitHub)
- Navigation header with settings link
- Responsive grid layout

---

## Supabase GitHub OAuth Configuration

### Step 1: Create GitHub OAuth Application

1. Go to [GitHub Developer Settings](https://github.com/settings/applications/new)
2. Click "New OAuth App"
3. Fill in:
   - **Application name**: Your app name
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/auth/callback`
   - Leave "Enable Device Flow" unchecked
4. Click "Register application"
5. Copy your **Client ID**
6. Click "Generate a new client secret" and copy it

### Step 2: Enable GitHub in Supabase

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to: **Authentication** → **Providers**
3. Click **GitHub** to expand
4. Turn on **GitHub Enabled**
5. Paste your **Client ID** and **Client Secret**
6. Copy your **Callback URL**: `https://<project-ref>.supabase.co/auth/v1/callback`
7. Update your GitHub OAuth app with this callback URL (if needed)
8. Click **Save**

### Step 3: Get Supabase Keys

1. Go to **Settings** → **API**
2. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **Anon Key** → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - **Service Role Key** → `SUPABASE_SERVICE_ROLE_KEY`

---

## Running the Application

### Backend

```bash
cd backend
pnpm install  # Install dependencies including zod
pnpm dev  # Start development server on http://localhost:4000
```

### Frontend

```bash
cd frontend
pnpm install  # Install dependencies
pnpm dev  # Start dev server on http://localhost:3000
```

Both servers should be running simultaneously for the OAuth flow to work.

---

## Authentication Flow

```
┌─────────────┐
│   User      │
│ Clicks Sign │
│   In Button │
└──────┬──────┘
       │
       ▼
┌──────────────────────────────────────────┐
│ Frontend: GitHubSignInButton Component    │
│  - Shows loading spinner via useTransition
│  - Calls signInWithGitHub()              │
└──────┬───────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────┐
│ Frontend AuthContext: signInWithGitHub()  │
│  - GET /api/v1/auth/github/signin        │
│  - Receives GitHub OAuth URL             │
│  - Redirects browser to GitHub           │
└──────┬───────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────┐
│ GitHub OAuth Server                      │
│  - User logs in with GitHub credentials │
│  - GitHub approves application access    │
│  - GitHub redirects to callback URL      │
└──────┬───────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────┐
│ Frontend: /auth/callback page            │
│  - Receives ?code=... from GitHub        │
│  - POST /api/v1/auth/github/callback     │
└──────┬───────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────┐
│ Backend: auth.controller.handleCallback()│
│  - Receives GitHub code from frontend    │
│  - Calls AuthService.signInWithGitHubCode()
│  - Supabase: exchangeCodeForSession()    │
│  - Returns: tokens + user data           │
└──────┬───────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────┐
│ Frontend: /auth/callback page            │
│  - Receives tokens from backend response │
│  - Stores in localStorage:               │
│    - accessToken                         │
│    - refreshToken                        │
│    - user (JSON)                         │
│  - Redirects to / (home page)            │
└──────┬───────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────┐
│ Frontend: Home Page (/page.tsx)          │
│  - useAuth() loads tokens from localStorage
│  - AuthContext updates user state        │
│  - Renders protected dashboard           │
│  - Shows UserProfileCard                 │
└──────────────────────────────────────────┘
```

---

## Key Features

### Backend
- ✅ Supabase Auth service role integration
- ✅ JWT token management (access + refresh)
- ✅ Protected routes with middleware
- ✅ Request validation with Zod
- ✅ Global error handling
- ✅ Environment variable validation

### Frontend
- ✅ `useAuth()` context hook for auth state
- ✅ `useTransition` for loading states
- ✅ Session persistence in localStorage
- ✅ Automatic token handling
- ✅ Protected routes with redirects
- ✅ Professional UI components
- ✅ Dark mode support
- ✅ TypeScript type safety

---

## Session Management

### On Initial Page Load
1. AuthProvider checks localStorage for tokens
2. If tokens exist and valid, sets user state
3. If no tokens, user state remains null
4. Protected pages check user and redirect to /signin if needed

### Token Storage (localStorage)
```javascript
localStorage.setItem('accessToken', 'token');
localStorage.setItem('refreshToken', 'token');
localStorage.setItem('user', JSON.stringify(userObj));
```

### On Sign Out
1. Call `signOut()` from `useAuth()` hook
2. Backend logs out user (invalidates refresh token)
3. Clear localStorage
4. Update auth context state
5. Redirect to /signin

---

## Troubleshooting

### "GitHub OAuth failed" or "Invalid OAuth app"
- Verify GitHub app Client ID and Secret in Supabase
- Check GitHub OAuth app's Authorization callback URL matches your setup
- Ensure GitHub provider is enabled in Supabase

### "No session returned" from Supabase
- Verify Supabase GitHub provider is **enabled**
- Check GitHub OAuth app credentials are correct
- Ensure service role key is used (not anon key) on backend

### Tokens not persisting after refresh
- Check browser localStorage is enabled
- Verify `NEXT_PUBLIC_BACKEND_URL` in frontend `.env` is correct
- Clear localStorage and try sign-in again
- Check browser console for errors

### CORS errors
- Ensure `FRONTEND_URL` in backend `.env` matches frontend URL exactly
- Verify CORS middleware in `src/index.ts` includes frontend URL
- Check both apps are running (backend on 4000, frontend on 3000)

### "Unauthorized" on protected endpoints
- Ensure token is being sent in `Authorization: Bearer <token>` header
- Check token hasn't expired (default: 1 hour)
- Try refreshing the page to reload token from localStorage

---

## Next Steps (Optional Enhancements)

- [ ] Add automatic token refresh before expiration
- [ ] Implement forgot password flow
- [ ] Add Google OAuth provider
- [ ] Create user settings/profile management page
- [ ] Add role-based access control (RBAC)
- [ ] Implement email verification
- [ ] Add multi-factor authentication (MFA)
- [ ] Create admin dashboard
- [ ] Add audit logging

---

## Documentation References

- [Supabase GitHub OAuth](https://supabase.com/docs/guides/auth/social-login/auth-github)
- [Supabase Auth API](https://supabase.com/docs/reference/javascript/auth-signinwithoauth)
- [Next.js Authentication](https://nextjs.org/docs/app/building-your-application/authentication)
- [React Context API](https://react.dev/reference/react/useContext)
- [useTransition Hook](https://react.dev/reference/react/useTransition)
