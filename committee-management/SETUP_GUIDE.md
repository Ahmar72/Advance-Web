# Committee Management System - Setup & Development Guide

## Phase 1: Local Environment Setup (You are here)

### Prerequisites
- Node.js v18+ (you have v22.19.0 ✓)
- npm v8+ (you have v10.9.3 ✓)
- VS Code (recommended)
- A Supabase account (free at https://supabase.com)

### Project Structure Created
```
committee-management/
├── src/
│   ├── app/
│   │   ├── services/
│   │   │   ├── supabase.service.ts      # Supabase client wrapper
│   │   │   ├── auth.service.ts           # Authentication state management
│   │   │   └── auth.guard.ts             # Route protection
│   │   ├── pages/
│   │   │   ├── auth/                     # Login/Signup pages
│   │   │   │   ├── login.ts
│   │   │   │   ├── login.html
│   │   │   │   ├── login.scss
│   │   │   │   ├── signup.ts
│   │   │   │   ├── signup.html
│   │   │   │   └── signup.scss
│   │   │   └── dashboard/                # Main dashboard
│   │   │       ├── dashboard.ts
│   │   │       ├── dashboard.html
│   │   │       └── dashboard.scss
│   │   ├── app.ts                        # Root component
│   │   ├── app.routes.ts                 # Routes configuration
│   │   └── app.config.ts                 # App configuration
│   ├── environments/
│   │   ├── environment.ts                # Development config
│   │   └── environment.prod.ts           # Production config
│   ├── index.html
│   ├── styles.scss                       # Global styles
│   └── main.ts
├── package.json
├── angular.json
├── tsconfig.json
└── README.md
```

---

## Phase 2: Supabase Setup (Do this next)

### Step 1: Create Supabase Project
1. Go to https://supabase.com and sign up (free)
2. Create a new project:
   - Name: `committee-management`
   - Password: Create a strong password (save it)
   - Region: Choose closest to you
3. Wait for project to initialize (~5 minutes)

### Step 2: Get Your Credentials
1. In Supabase dashboard, go to **Project Settings** → **API**
2. Copy:
   - **Project URL**: Save as `SUPABASE_URL`
   - **anon public key**: Save as `SUPABASE_ANON_KEY`

### Step 3: Configure Local Environment
1. Open `src/environments/environment.ts`
2. Replace:
   ```typescript
   url: 'YOUR_SUPABASE_URL',
   anonKey: 'YOUR_SUPABASE_ANON_KEY',
   ```
   with your actual credentials from Step 2

3. Also update `src/environments/environment.prod.ts` with same values (for now)

---

## Phase 3: Install Dependencies

The project has been scaffolded and is installing dependencies now.

When `npm install` completes:

```bash
npm install @supabase/supabase-js
```

---

## Phase 4: Start Development Server

Once dependencies are installed:

```bash
npm start
```

or

```bash
ng serve --open
```

This will:
- Start dev server on `http://localhost:4200`
- Open browser automatically
- Watch for file changes (hot reload)

---

## Phase 5: Test Authentication Flow

1. **Sign Up**
   - Navigate to `http://localhost:4200/signup`
   - Enter email, password, display name
   - Click "Sign Up"
   - Check Supabase console for new auth user

2. **Sign In**
   - Go to `http://localhost:4200/login`
   - Enter same credentials
   - Should redirect to dashboard

3. **Dashboard**
   - See welcome section
   - Four action cards (will implement pages later)
   - Click "Sign Out" button

---

## Phase 6: Database Schema (Next Step)

You'll create these tables in Supabase SQL Editor:

1. **profiles** - User metadata
2. **committees** - Committee details
3. **committee_members** - Member records with payment details
4. **committee_cycles** - Monthly turns
5. **payments** - Payment tracking
6. **notifications** - User notifications

---

## Key Files to Understand

| File | Purpose |
|------|---------|
| `src/app/services/supabase.service.ts` | Direct Supabase client interface |
| `src/app/services/auth.service.ts` | Observable-based auth state |
| `src/app/services/auth.guard.ts` | Route protection logic |
| `src/app/app.routes.ts` | All route definitions |
| `src/environments/environment.ts` | Config management |

---

## Common Commands

```bash
# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test

# Run linter
npm run lint

# Format code
npm run format
```

---

## Troubleshooting

### 1. "Supabase URL not configured"
- Check `src/environments/environment.ts`
- Ensure `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set
- Browser console should show the client initialized

### 2. "Cannot find module '@supabase/supabase-js'"
- Run `npm install @supabase/supabase-js` again
- Restart dev server

### 3. Login always redirects to login
- Check browser DevTools → Application → Local Storage
- Look for `supabase.auth.token`
- If missing, auth state isn't persisting

### 4. Build errors
- Run `npm clean-cache`
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again

---

## Next Steps Checklist

- [ ] Complete Supabase project setup
- [ ] Add credentials to environment files
- [ ] Run `npm install @supabase/supabase-js`
- [ ] Start dev server (`npm start`)
- [ ] Test signup/login flow
- [ ] Create database schema (SQL migrations)
- [ ] Build committee creation feature
- [ ] Build member management UI
- [ ] Build dashboard discovery
- [ ] Add payment tracking
- [ ] Implement notifications
- [ ] Add role-based access control (RLS)
- [ ] Deploy to production (Vercel/Netlify)

---

## Architecture Summary

```
┌─────────────────────────────────┐
│      Angular App                │
│  ├─ Login/Signup Pages          │
│  ├─ Dashboard                   │
│  ├─ Committee Pages (coming)    │
│  └─ Notifications               │
└─────────────────────────────────┘
           ↓ (HTTP/WebSocket)
┌─────────────────────────────────┐
│    Supabase Backend             │
│  ├─ PostgreSQL Database         │
│  ├─ Auth (email/password)       │
│  ├─ Storage (file uploads)      │
│  ├─ Realtime (subscriptions)    │
│  └─ Edge Functions (webhooks)   │
└─────────────────────────────────┘
```

---

## Support Resources

- Angular Docs: https://angular.dev
- Supabase Docs: https://supabase.com/docs
- Supabase JS Client: https://github.com/supabase/supabase-js
- RxJS: https://rxjs.dev

---

**Ready to continue? Complete the Supabase setup, then message me to build the database schema!**
