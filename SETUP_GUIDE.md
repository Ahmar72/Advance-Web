# ADS SASS Application - Complete Setup Guide

## Project Structure

```
AW mid/
├── backend/
│   ├── src/
│   │   └── index.ts
│   ├── .env
│   ├── .gitignore
│   ├── package.json
│   ├── tsconfig.json
│   └── node_modules/ (installed)
│
└── frontend/
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx
    │   └── globals.css
    ├── lib/
    │   ├── supabaseClient.ts
    │   └── useSupabaseAuth.ts
    ├── .env.local
    ├── .gitignore
    ├── package.json
    ├── tsconfig.json
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── next.config.js
    └── node_modules/ (partially installed)
```

## Setup Summary

### ✅ Completed Steps:

1. **Backend Setup:**
   - Created Express.js project structure
   - Installed dependencies: express, cors, dotenv, @supabase/supabase-js
   - Installed dev dependencies: typescript, ts-node-dev, @types/*
   - Configured TypeScript with ES2020 target
   - Created starting server file with CORS configured

2. **Frontend Setup:**
   - Created Next.js 15 project with TypeScript
   - Installed React, React DOM, Tailwind CSS
   - Created Supabase client helper
   - Created auth hook for authentication management
   - Configured environment variables setup

## 🔄 Next Steps

### 1. Install Supabase in Frontend

Due to OneDrive file locking, you may need to move the project to a local drive (C:\Users\{YourUsername}\ProjectName) and then run:

```bash
cd frontend
pnpm install @supabase/supabase-js
```

### 2. Configure Environment Variables

**Backend (.env):**
```env
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PORT=4000
```

**Frontend (.env.local):**
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

### 3. Get Supabase Credentials

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. In Project Settings > API:
   - Copy `Project URL` → SUPABASE_URL
   - Copy `Service Role Key` → SUPABASE_SERVICE_ROLE_KEY (backend only)
   - Copy `Publishable Key` → NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (frontend)

### 4. Run the Applications

**Backend (Terminal 1):**
```bash
cd backend
pnpm dev
# API running on http://localhost:4000
```

**Frontend (Terminal 2):**
```bash
cd frontend
pnpm dev
# App running on http://localhost:3000
```

## 🚀 Available Scripts

### Backend
- `pnpm dev` - Start development server with hot reload
- `pnpm build` - Compile TypeScript to JavaScript
- `pnpm start` - Run compiled server

### Frontend
- `pnpm dev` - Start Next.js development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

## 📁 File Explanations

### Backend Files

**src/index.ts** - Main server file
- Initializes Express app
- Sets up CORS for frontend (http://localhost:3000)
- Ready for route mounting

**package.json** - Dependencies
- `express` - Web framework
- `@supabase/supabase-js` - Supabase client SDK
- `cors` - Cross-origin requests
- `dotenv` - Environment variables
- `typescript`, `ts-node-dev` - TypeScript support

**tsconfig.json** - TypeScript configuration
- Target: ES2020 (modern JavaScript)
- Module: CommonJS (Node.js standard)
- Strict mode enabled

### Frontend Files

**app/layout.tsx** - Root layout component
- HTML structure for entire app
- Metadata configuration

**app/page.tsx** - Home page
- Starting component
- Health check link to backend

**lib/supabaseClient.ts** - Supabase initialization
- Creates client instance from environment variables
- Shared across all components

**lib/useSupabaseAuth.ts** - Custom React hook
- Authentication state management
- Methods: signUp, signIn, signOut
- User state tracking

## 🔧 Troubleshooting

### OneDrive Issue
If pnpm install fails with permission errors:
1. Move project to a local drive (C:\Projects\AW-mid instead of OneDrive)
2. Run pnpm install again

### Port Already in Use
- Backend: `pnpm dev -- --port 5000` (change PORT in .env)
- Frontend: `pnpm dev -- --port 3001`

### Supabase Connection Issues
1. Verify URLs in .env files (no trailing slashes)
2. Check if Supabase project is active
3. Verify keys are correct (copy-paste carefully)

## 🎯 Next Development Steps

1. Create API routes in backend/src/routers/
2. Build authentication pages in frontend/app/auth/
3. Create database tables in Supabase dashboard
4. Build main application features

## 📌 Quick Links

- [Supabase Documentation](https://supabase.com/docs)
- [Express.js Documentation](https://expressjs.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

---

**Created on:** March 25, 2026
