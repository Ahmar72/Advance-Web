# GitHub OAuth Setup Guide

## Required: Configure GitHub OAuth App

### Step 1: Create GitHub OAuth App
1. Go to https://github.com/settings/developers
2. Click **"New OAuth App"**
3. Fill in with:
   - **Application name**: `AdFlow Pro`
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/callback` ⚠️ **CRITICAL**
4. Click **"Register application"**
5. Copy the following and save:
   - **Client ID**
   - **Client Secret** (generate if needed)

### Step 2: Enable in Supabase
1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Go to **Authentication** → **Providers**
4. Find **GitHub** and click **Enable**
5. Paste:
   - **GitHub Client ID** (from step 1)
   - **GitHub Client Secret** (from step 1)
6. Click **Save**

### Step 3: Verify Setup
- ✅ GitHub OAuth App created
- ✅ GitHub provider enabled in Supabase
- ✅ Callback URL is `http://localhost:3000/callback`
- ✅ Backend `.env` has `FRONTEND_URL=http://localhost:3000`
- ✅ Frontend `.env.local` has correct Supabase URL and keys

---

## Test Flow

1. Go to http://localhost:3000
2. Click "Sign In with GitHub"
3. You should be redirected to GitHub
4. Authorize the app
5. GitHub redirects back to `http://localhost:3000/callback?code=XXXXX`
6. Page exchanges code for session tokens
7. Redirects to dashboard

---

## If It Still Doesn't Work

### Check Browser Console (F12 → Console)
Look for what parameters GitHub is sending back:
- If you see `code=...` → GitHub is working ✅
- If you see `error=...` → GitHub OAuth app misconfigured ❌
- If you see nothing → Redirect URI doesn't match ❌

### Common Issues

| Issue | Solution |
|-------|----------|
| `error: access_denied` | User didn't authorize or app permissions wrong |
| `code` not in URL | GitHub OAuth app redirect URI doesn't match |
| Blank page | Supabase GitHub provider not enabled |
| `CORS error` | Backend not running or wrong port |

---

## Troubleshooting

**If GitHub OAuth still fails:**

1. **Verify Redirect URI matches exactly:**
   - GitHub OAuth App: `http://localhost:3000/callback`
   - Backend code: `/callback` ✅

2. **Check Supabase GitHub provider:**
   - Authentication → Providers → GitHub → Status should be `Enabled` (green)

3. **Check tokens in `.env` files:**
   ```bash
   # backend/.env
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_ANON_KEY=eyJhbGc...
   
   # frontend/.env.local
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJhbGc...
   ```

3. **Restart both servers after changes:**
   ```powershell
   # Terminal 1
   cd backend && npm run dev
   
   # Terminal 2
   cd frontend && npm run dev
   ```

---

## Quick Reference

| Component | Value | Where |
|-----------|-------|-------|
| GitHub OAuth App Callback | `http://localhost:3000/callback` | GitHub OAuth App settings |
| Supabase GitHub Client ID | From GitHub App | Supabase Dashboard |
| Supabase GitHub Client Secret | From GitHub App | Supabase Dashboard |
| Frontend Callback Component | `/app/(auth)/callback/page.tsx` | Next.js route |
| Backend Redirect URL | `/callback` | Backend constructs via `FRONTEND_URL` |

