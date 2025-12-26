# Morgus Development Rules

## 🔴 CRITICAL SECURITY RULES

### NEVER Commit Secrets to Git
**This is a HARD RULE - no exceptions!**

The following must NEVER be committed to this repository:
- API keys (OpenAI, OpenRouter, Stripe, Resend, etc.)
- Secret keys (sk_test_*, sk_live_*, whsec_*, re_*)
- Cloudflare API tokens
- Supabase service role keys
- Admin tokens or passwords
- Any authentication credentials

**Where secrets should be stored:**
- Cloudflare Worker secrets: `npx wrangler secret put SECRET_NAME`
- Environment variables in Cloudflare dashboard
- Local `.env` files (which are gitignored)

**If you accidentally commit a secret:**
1. Immediately rotate/regenerate the exposed key
2. Remove from git history using `git filter-branch` or BFG Repo Cleaner
3. Force push the cleaned history

---

## 📱 Desktop-First Development Strategy

To ensure stability and prevent conflicting deployments, all future UI/UX development for the Morgus Console must follow the **Desktop-First Development Strategy**.

### 1. Desktop-First Implementation

- **All new features or changes must be implemented and tested on the desktop version first.**
- The desktop version is the primary development target.
- Ensure all desktop features are fully functional and stable before proceeding to mobile.

### 2. Verify Desktop Version

- Before making any mobile changes, deploy the desktop version to a preview environment.
- Thoroughly test all features and functionality on multiple desktop browsers.
- Get confirmation from the user that the desktop version is working as expected.

### 3. Batch Changes for Mobile

- Once the desktop version is approved, create a separate branch for mobile changes.
- **Do not mix desktop and mobile changes in the same commit.**
- Apply all necessary mobile-specific styles and layout adjustments in this branch.

### 4. Verify Mobile Version

- Deploy the mobile branch to a separate preview environment.
- Test thoroughly on multiple mobile devices and screen sizes.
- Get confirmation from the user that the mobile version is working as expected.

### 5. Merge and Deploy to Production

- Once both desktop and mobile versions are approved, merge the mobile branch into the `main` branch.
- This will trigger an automatic deployment to production.
- Verify that both desktop and mobile are working correctly on the production URL.

---

## 📋 Pre-Commit Checklist

Before every commit, verify:
- [ ] No API keys or secrets in the code
- [ ] No tokens in markdown documentation
- [ ] No credentials in example commands (use placeholders like `YOUR_TOKEN_HERE`)
- [ ] `.env` files are gitignored
- [ ] Mobile UI not broken (if touching frontend)

---

## 🚀 Deployment Checklist

Before deploying:
- [ ] All secrets are set via `wrangler secret put`, not in code
- [ ] Test on preview deployment first
- [ ] Verify both desktop and mobile work
- [ ] Get user confirmation before production deploy

---

By following these rules, we protect sensitive credentials and ensure a stable user experience across all devices.
