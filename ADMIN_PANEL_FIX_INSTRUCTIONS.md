# Morgus Console Admin Panel Fix Instructions

## Problem Summary

The admin panel at `https://morgus-console.pages.dev/admin` gets stuck on "Checking authentication..." because the console cannot fetch the user profile from Supabase.

### Root Cause

The profile fetch fails with a **401 Unauthorized** error:
```
Invalid API key - Double check your Supabase `anon` or `service_role` API key.
```

This happens because the Supabase client in the console is either:
1. Missing the `VITE_SUPABASE_ANON_KEY` environment variable, OR
2. Has an incorrect/outdated anon key configured

## Solution

### Step 1: Get the Correct Supabase Anon Key

1. Go to https://supabase.com/dashboard/project/dnxqgphaisdxvdyeiwnh/settings/api-keys/legacy
2. Copy the **anon public** key (the long JWT token starting with `eyJhbGciOiJIUzI1NiIs...`)

### Step 2: Configure Cloudflare Pages Environment Variables

1. Go to your Cloudflare Pages dashboard
2. Navigate to: **Settings** → **Environment variables**
3. Add or update these variables for the **Production** environment:

```
VITE_SUPABASE_URL=https://dnxqgphaisdxvdyeiwnh.supabase.co
VITE_SUPABASE_ANON_KEY=<paste the anon key from Step 1>
```

### Step 3: Redeploy

After setting the environment variables, redeploy the console:
- Either trigger a new deployment from the Cloudflare Pages dashboard
- Or push a new commit to trigger automatic deployment

## Verification

After deployment, test the admin panel:

1. Go to https://morgus-console.pages.dev/login
2. Sign in with: `mross07@gmail.com` / `Morgus2026!`
3. Navigate to https://morgus-console.pages.dev/admin
4. The admin panel should load and show:
   - **Promo Codes** tab with 6 promo codes
   - **Users** tab with 4 users
   - **Model Insights** tab

## Database Status

✅ **RLS is DISABLED** on both `promo_codes` and `profiles` tables
✅ **Admin user exists**: `mross07@gmail.com` with `is_admin = TRUE`
✅ **Database is accessible** - the issue is purely a frontend API key configuration problem

## Code Changes Already Made

The following fixes have been committed to the repository (commit `5d1e368`):

1. **Added timeout handling** to Admin.tsx (5-second timeout)
2. **Added comprehensive error logging** to auth.tsx fetchProfile function
3. **Added error UI** with retry button for failed profile loads

These changes will take effect once the console is redeployed with the correct environment variables.

## Alternative: Use Service Role Key (NOT RECOMMENDED)

If you need the admin panel to work immediately without RLS, you could use the service_role key instead of the anon key. However, this is **NOT RECOMMENDED** for security reasons as it bypasses all RLS policies.

Only use this for testing purposes:
```
VITE_SUPABASE_ANON_KEY=<service_role_key>
```

Then re-enable RLS and switch back to the anon key for production.
