# Changelog v2.7.1 - Bugfix Release

**Release Date**: January 2, 2026

## 🐛 Bug Fixes

### User Signup Flow
- **Fixed auth.tsx**: Updated signUp function to pass `full_name` in user metadata to Supabase
- **Fixed database trigger**: Changed `handle_new_user()` to use correct column names (`full_name` instead of `display_name`)
- **Created missing profiles**: Added profiles for all existing users with 100 starting credits
- **Removed broken triggers**: Cleaned up duplicate and failing triggers

### NotebooksPanel
- **Fixed infinite loading**: Panel now shows "Log in to access your notebooks" instead of being stuck on "Loading..." when user is not logged in
- **Improved UX**: Better error handling and user feedback

### Mobile UI
- **Added MOE Modal styles**: Fixed mobile display issues with proper CSS for modals
- **Improved responsiveness**: Better mobile experience across all devices

## 📦 Deployments

- **Frontend**: https://5b58b33e.morgus-console-dyo.pages.dev/
- **Backend**: https://morgus-deploy.fly.dev/ (no changes)
- **Database**: Supabase (triggers fixed, profiles created)

## 🔧 Technical Changes

### GitHub Commits
- `26c85b2`: fix(auth): pass displayName as full_name in user metadata during signup
- `c6f6b50`: fix(css): add MOE Modal styles for mobile UI
- `d8b0c1a`: fix(notebooks): show login prompt instead of infinite loading when user not logged in

### Database Changes
- Created `on_auth_user_created_create_profile` trigger on auth.users
- Fixed `handle_new_user()` function to match profiles table schema
- Removed `on_auth_user_created_initialize_credits` trigger (temporarily disabled)

## ✅ Verified Working
- User signup and profile creation
- NotebooksPanel with proper loading states
- Mobile UI rendering
- Supabase database connectivity
- Console deployment on Cloudflare Pages

## 🚀 Next Steps
- Re-enable credits initialization trigger with proper schema
- Add test suite for frontend components
- Optimize slow database queries (197 performance issues in Supabase)
- Set up CI/CD pipeline for automated deployments
