# ADS SASS Application

A full-stack SaaS application built with Express.js, Next.js, and Supabase.

## 📋 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase account ([create one free](https://supabase.com))

### Backend Setup
```bash
cd backend
pnpm install
```

Create `.env` file:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
PORT=4000
```

Run:
```bash
pnpm dev
```

### Frontend Setup
```bash
cd frontend
pnpm install
pnpm install @supabase/supabase-js  # If not already installed
```

Create `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
```

Run:
```bash
pnpm dev
```

## 🏗️ Project Structure

- **Backend** (`/backend`): Express.js API server
  - TypeScript configured with ES2020
  - Supabase integration
  - CORS enabled for frontend

- **Frontend** (`/frontend`): Next.js 15 with React 19
  - TypeScript & Tailwind CSS
  - Authentication hooks
  - Supabase client pre-configured

## 🔑 Getting Supabase Credentials

1. Visit [supabase.com](https://supabase.com) and create new project
2. Go to **Project Settings** > **API**
3. Copy necessary keys (see SETUP_GUIDE.md for details)

## 🚀 Development

```bash
# Terminal 1 - Backend
cd backend && pnpm dev

# Terminal 2 - Frontend  
cd frontend && pnpm dev
```

- Backend: http://localhost:4000
- Frontend: http://localhost:3000

## 📚 Documentation

See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for:
- Detailed setup instructions
- Troubleshooting guide
- File structure explanation
- Available npm scripts

## ⚠️ Known Issues

**OneDrive Folder:** If pnpm install fails with permission errors, consider moving the project to a local drive (C:\Projects\) instead of OneDrive.

## 🛠️ Tech Stack

- **Backend**: Express.js, TypeScript, Supabase
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth

---

**Status**: ✅ Initial setup complete | Ready for development
