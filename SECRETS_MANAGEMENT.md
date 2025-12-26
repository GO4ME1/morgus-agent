# Morgus Secrets Management Guide

This guide explains how to securely manage API keys, tokens, and other sensitive credentials for the Morgus application without exposing them in the codebase.

---

## Overview

Morgus uses a **zero-secrets-in-code** approach. All sensitive credentials are stored externally and injected at runtime through environment variables. This ensures that even if the repository is compromised, attackers cannot access production systems.

| Environment | Secrets Storage | Access Method |
|-------------|-----------------|---------------|
| Production (Worker) | Cloudflare Worker Secrets | `env.SECRET_NAME` |
| Production (Console) | Cloudflare Pages Environment Variables | `import.meta.env.VITE_*` |
| Local Development | `.env` files (gitignored) | `process.env.SECRET_NAME` |

---

## 1. Cloudflare Worker Secrets (Backend)

Cloudflare Worker Secrets are encrypted at rest and only decrypted when your worker runs. This is the most secure method for backend secrets.

### Setting Secrets via CLI

```bash
# Set your Cloudflare API token first
export CLOUDFLARE_API_TOKEN="your-cloudflare-api-token"

# Navigate to worker directory
cd worker

# Set individual secrets (you'll be prompted to enter the value)
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler secret put STRIPE_WEBHOOK_SECRET
npx wrangler secret put SUPABASE_SERVICE_KEY
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put OPENROUTER_API_KEY
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put ADMIN_API_TOKEN

# Or pipe the value directly (useful for automation)
echo "sk_test_your_key_here" | npx wrangler secret put STRIPE_SECRET_KEY
```

### Setting Secrets via Dashboard

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Workers & Pages** → **morgus-orchestrator**
3. Click **Settings** → **Variables**
4. Under **Secrets**, click **Add variable**
5. Enter the name and value, then click **Encrypt**

### Accessing Secrets in Code

In your Cloudflare Worker, secrets are available on the `env` object:

```typescript
// worker/src/index.ts
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Access secrets from env
    const stripeKey = env.STRIPE_SECRET_KEY;
    const supabaseKey = env.SUPABASE_SERVICE_KEY;
    
    // Use them in your code
    const stripe = new Stripe(stripeKey);
    const supabase = createClient(env.SUPABASE_URL, supabaseKey);
  }
}

// Define the Env interface
interface Env {
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  SUPABASE_URL: string;
  SUPABASE_KEY: string;
  SUPABASE_SERVICE_KEY: string;
  OPENAI_API_KEY: string;
  OPENROUTER_API_KEY: string;
  RESEND_API_KEY: string;
  ADMIN_API_TOKEN: string;
  ENVIRONMENT: string;
}
```

### Listing Current Secrets

```bash
npx wrangler secret list
```

Note: This only shows secret names, not values (values cannot be retrieved once set).

### Deleting Secrets

```bash
npx wrangler secret delete SECRET_NAME
```

---

## 2. Cloudflare Pages Environment Variables (Frontend)

For the frontend console, use Cloudflare Pages environment variables. Note that frontend variables are exposed to the browser, so only use them for public keys.

### Safe for Frontend (Public Keys)

| Variable | Purpose | Safe for Frontend? |
|----------|---------|-------------------|
| `VITE_SUPABASE_URL` | Supabase project URL | ✅ Yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | ✅ Yes (RLS protected) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe public key | ✅ Yes |
| `VITE_API_URL` | Backend API URL | ✅ Yes |

### Never in Frontend (Secret Keys)

| Variable | Purpose | Safe for Frontend? |
|----------|---------|-------------------|
| `STRIPE_SECRET_KEY` | Stripe secret key | ❌ Never |
| `SUPABASE_SERVICE_KEY` | Supabase admin key | ❌ Never |
| `OPENAI_API_KEY` | OpenAI API key | ❌ Never |

### Setting via Dashboard

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Workers & Pages** → **morgus-console**
3. Click **Settings** → **Environment variables**
4. Add variables for **Production** and/or **Preview**

### Accessing in Frontend Code

```typescript
// console/src/lib/supabase.ts
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

---

## 3. Local Development Setup

For local development, use `.env` files that are gitignored.

### Create Local Environment Files

```bash
# Worker environment
cat > worker/.dev.vars << 'EOF'
STRIPE_SECRET_KEY=sk_test_your_test_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key
OPENAI_API_KEY=sk-your_openai_key
OPENROUTER_API_KEY=sk-or-your_key
RESEND_API_KEY=re_your_resend_key
ADMIN_API_TOKEN=your_admin_token
ENVIRONMENT=development
EOF

# Console environment
cat > console/.env.local << 'EOF'
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_URL=http://localhost:8787
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key
EOF
```

### Ensure Files Are Gitignored

Verify these entries exist in `.gitignore`:

```gitignore
# Environment files
.env
.env.local
.env.*.local
.dev.vars
*.vars

# Never commit these
*.pem
*.key
credentials.json
```

### Running Locally with Secrets

```bash
# Worker (uses .dev.vars automatically)
cd worker
npx wrangler dev

# Console (uses .env.local automatically)
cd console
npm run dev
```

---

## 4. Secrets Rotation Procedure

Regularly rotate secrets to minimize risk. Follow this procedure:

### Step 1: Generate New Secret

Generate the new secret in the respective service dashboard (Stripe, Supabase, etc.).

### Step 2: Update in Cloudflare

```bash
# Update the secret
echo "new_secret_value" | npx wrangler secret put SECRET_NAME

# Deploy to apply changes
npx wrangler deploy
```

### Step 3: Verify Functionality

Test the application to ensure the new secret works correctly.

### Step 4: Revoke Old Secret

Once verified, revoke the old secret in the service dashboard.

### Rotation Schedule

| Secret Type | Recommended Rotation |
|-------------|---------------------|
| API Keys | Every 90 days |
| Webhook Secrets | Every 90 days |
| Admin Tokens | Every 30 days |
| Service Keys | Every 180 days |

---

## 5. Emergency Response: Compromised Secret

If a secret is compromised, act immediately:

### Immediate Actions

1. **Revoke the compromised key** in the service dashboard
2. **Generate a new key** in the service dashboard
3. **Update Cloudflare secrets** with the new key
4. **Deploy immediately** to apply changes
5. **Review access logs** for unauthorized usage
6. **Notify stakeholders** if user data may be affected

### Quick Commands

```bash
# Rotate Stripe key
echo "sk_test_new_key" | npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler deploy

# Rotate admin token
openssl rand -hex 32 | npx wrangler secret put ADMIN_API_TOKEN
npx wrangler deploy
```

---

## 6. Secrets Inventory

Keep track of all secrets used by Morgus:

| Secret Name | Service | Location | Owner |
|-------------|---------|----------|-------|
| `STRIPE_SECRET_KEY` | Stripe | Worker Secrets | Stripe Dashboard |
| `STRIPE_WEBHOOK_SECRET` | Stripe | Worker Secrets | Stripe Dashboard |
| `SUPABASE_URL` | Supabase | Worker Vars | Supabase Dashboard |
| `SUPABASE_KEY` | Supabase | Worker Vars | Supabase Dashboard |
| `SUPABASE_SERVICE_KEY` | Supabase | Worker Secrets | Supabase Dashboard |
| `OPENAI_API_KEY` | OpenAI | Worker Secrets | OpenAI Dashboard |
| `OPENROUTER_API_KEY` | OpenRouter | Worker Secrets | OpenRouter Dashboard |
| `RESEND_API_KEY` | Resend | Worker Secrets | Resend Dashboard |
| `ADMIN_API_TOKEN` | Internal | Worker Secrets | Self-generated |
| `VITE_SUPABASE_URL` | Supabase | Pages Env Vars | Supabase Dashboard |
| `VITE_SUPABASE_ANON_KEY` | Supabase | Pages Env Vars | Supabase Dashboard |

---

## 7. Best Practices Summary

### Do's

| Practice | Reason |
|----------|--------|
| Use Cloudflare Secrets for backend | Encrypted at rest, secure injection |
| Use `.env` files locally | Keeps secrets out of code |
| Rotate secrets regularly | Limits exposure window |
| Use least-privilege keys | Minimizes blast radius |
| Audit secret access | Detects unauthorized use |

### Don'ts

| Anti-Pattern | Risk |
|--------------|------|
| Hardcoding secrets in code | Exposed in git history forever |
| Committing `.env` files | Secrets leaked to repo |
| Sharing secrets via chat/email | Intercepted or logged |
| Using production keys locally | Accidental data modification |
| Reusing secrets across services | Single point of failure |

---

## 8. Quick Reference Commands

```bash
# === Cloudflare Worker Secrets ===
# Set a secret
npx wrangler secret put SECRET_NAME

# List all secrets (names only)
npx wrangler secret list

# Delete a secret
npx wrangler secret delete SECRET_NAME

# Deploy after secret changes
npx wrangler deploy

# === Local Development ===
# Create worker dev vars
touch worker/.dev.vars

# Create console env
touch console/.env.local

# Run worker locally
cd worker && npx wrangler dev

# Run console locally
cd console && npm run dev

# === Generate Secure Tokens ===
# Generate 32-byte hex token
openssl rand -hex 32

# Generate 64-byte base64 token
openssl rand -base64 64
```

---

## Need Help?

If you need to set up secrets or have questions about this guide:

1. Check the [Cloudflare Workers Secrets docs](https://developers.cloudflare.com/workers/configuration/secrets/)
2. Check the [Cloudflare Pages Environment Variables docs](https://developers.cloudflare.com/pages/platform/build-configuration/#environment-variables)
3. Review the `DEVELOPMENT_RULES.md` for security policies
