# Morgus Pre-Commit Security Checklist

Use this checklist before every commit to ensure no secrets are accidentally exposed.

---

## 🔴 Automated Hook (Recommended)

A pre-commit hook is available that automatically checks for secrets. To enable it:

```bash
# Run this once to set up the hook
git config core.hooksPath .githooks
chmod +x .githooks/pre-commit
```

The hook will automatically block commits containing:
- Stripe keys (`sk_test_*`, `sk_live_*`, `whsec_*`)
- Resend API keys (`re_*`)
- OpenAI keys (`sk-*`)
- AWS Access Keys (`AKIA*`) and Secret Keys
- JWT tokens (Supabase keys)
- `.env` files

---

## ✅ Manual Checklist

Before running `git commit`, verify each item:

### API Keys & Tokens

| Check | Status |
|-------|--------|
| No Stripe secret keys (`sk_test_*`, `sk_live_*`) | ☐ |
| No Stripe webhook secrets (`whsec_*`) | ☐ |
| No Resend API keys (`re_*`) | ☐ |
| No OpenAI/OpenRouter keys (`sk-*`) | ☐ |
| No AWS Access Key IDs (`AKIA*`) | ☐ |
| No AWS Secret Access Keys | ☐ |
| No Cloudflare API tokens | ☐ |
| No Supabase service role keys | ☐ |
| No admin tokens or passwords | ☐ |

### Files & Patterns

| Check | Status |
|-------|--------|
| No `.env` files staged (should be gitignored) | ☐ |
| No hardcoded credentials in code | ☐ |
| Documentation uses placeholders (`YOUR_KEY_HERE`) | ☐ |
| Example commands don't contain real tokens | ☐ |

### Safe Patterns (OK to commit)

These patterns are acceptable:
- `sk_test_YOUR_STRIPE_KEY` (placeholder)
- `sk_test_...` (truncated reference)
- `YOUR_TOKEN_HERE`
- `<API_KEY>`
- References in `.env.example` files

---

## 🔍 Quick Search Commands

Run these before committing to find potential secrets:

```bash
# Search for Stripe keys
grep -rn "sk_test_[A-Za-z0-9]\{20,\}\|sk_live_" --include="*.ts" --include="*.md"

# Search for webhook secrets
grep -rn "whsec_[A-Za-z0-9]\{10,\}" --include="*.ts" --include="*.md"

# Search for Resend keys
grep -rn "re_[A-Za-z0-9]\{20,\}" --include="*.ts" --include="*.md"

# Search for OpenAI keys
grep -rn "sk-[A-Za-z0-9]\{20,\}" --include="*.ts" --include="*.md"

# Search for JWT tokens (Supabase)
grep -rn "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\." --include="*.ts" --include="*.md"
```

---

## 🚨 If You Accidentally Commit a Secret

1. **Immediately rotate the key** in the service dashboard (Stripe, Supabase, etc.)
2. **Remove from git history:**
   ```bash
   # Install BFG Repo Cleaner
   brew install bfg  # or download from https://rtyley.github.io/bfg-repo-cleaner/
   
   # Remove the secret from all history
   bfg --replace-text passwords.txt
   
   # Clean up
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   
   # Force push (coordinate with team!)
   git push --force
   ```
3. **Update the new key** in Cloudflare Worker secrets

---

## 📍 Where Secrets Should Live

| Secret Type | Storage Location |
|-------------|------------------|
| Stripe keys | `wrangler secret put STRIPE_SECRET_KEY` |
| Supabase keys | `wrangler secret put SUPABASE_SERVICE_KEY` |
| OpenAI keys | `wrangler secret put OPENAI_API_KEY` |
| Resend keys | `wrangler secret put RESEND_API_KEY` |
| Admin tokens | `wrangler secret put ADMIN_API_TOKEN` |
| Local dev | `.env` file (gitignored) |

---

**Remember:** Even private repos can be compromised. Treat all secrets as if the repo were public!
