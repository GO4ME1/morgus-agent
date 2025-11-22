# Cloudflare Setup Guide

This guide covers setting up Cloudflare Pages for the Morgus Console and configuring API tokens for deployments.

## Part 1: Deploy Morgus Console

### Option A: Automatic Deployment via GitHub

1. **Push Console to GitHub**

```bash
cd console
git init
git add .
git commit -m "Initial console commit"
git remote add origin https://github.com/GO4ME1/morgus-agent.git
git push -u origin main
```

2. **Connect to Cloudflare Pages**

- Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
- Navigate to **Workers & Pages** > **Pages**
- Click **Create a project**
- Click **Connect to Git**
- Select your GitHub repository: `GO4ME1/morgus-agent`
- Configure build settings:
  - **Project name**: `morgus-console`
  - **Production branch**: `main`
  - **Build command**: `cd console && pnpm install && pnpm build`
  - **Build output directory**: `console/dist`
  - **Root directory**: `/` (leave empty or set to root)

3. **Add Environment Variables**

In the Cloudflare Pages project settings:

- Go to **Settings** > **Environment variables**
- Add the following variables:

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `VITE_SUPABASE_URL` | `https://your-project.supabase.co` | Production |
| `VITE_SUPABASE_ANON_KEY` | `eyJ...` | Production |

4. **Deploy**

- Click **Save and Deploy**
- Wait for build to complete
- Your console will be available at: `https://morgus-console.pages.dev`

### Option B: Manual Deployment via Wrangler

1. **Install Wrangler**

```bash
npm install -g wrangler
```

2. **Login to Cloudflare**

```bash
wrangler login
```

3. **Build Console**

```bash
cd console
pnpm install
pnpm build
```

4. **Deploy**

```bash
npx wrangler pages publish dist --project-name=morgus-console
```

5. **Set Environment Variables**

```bash
npx wrangler pages secret put VITE_SUPABASE_URL
npx wrangler pages secret put VITE_SUPABASE_ANON_KEY
```

## Part 2: Create Cloudflare API Token

The orchestrator needs an API token to deploy user projects to Cloudflare Pages.

### Step 1: Create Custom API Token

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Click on your profile icon (top right) > **My Profile**
3. Navigate to **API Tokens** tab
4. Click **Create Token**
5. Click **Create Custom Token**

### Step 2: Configure Token Permissions

**Token name**: `Morgus Orchestrator`

**Permissions**:
- Account > Cloudflare Pages > Edit
- Account > Account Settings > Read

**Account Resources**:
- Include > Your Account

**Client IP Address Filtering** (optional):
- Add your server's IP address for extra security

**TTL**: 
- Start Date: Now
- End Date: Never (or set expiration as needed)

### Step 3: Create and Save Token

1. Click **Continue to summary**
2. Review permissions
3. Click **Create Token**
4. **IMPORTANT**: Copy the token immediately (it won't be shown again)
5. Save it to your orchestrator `.env` file:

```env
CLOUDFLARE_API_TOKEN=your_token_here
```

### Step 4: Get Account ID

1. Go to Cloudflare Dashboard
2. Select any domain (or go to Workers & Pages)
3. Scroll down in the right sidebar
4. Copy **Account ID**
5. Add to orchestrator `.env`:

```env
CLOUDFLARE_ACCOUNT_ID=your_account_id_here
```

## Part 3: Configure Custom Domain (Optional)

### For Console

1. Go to your Cloudflare Pages project (`morgus-console`)
2. Navigate to **Custom domains**
3. Click **Set up a custom domain**
4. Enter your domain (e.g., `morgus.go4me.ai`)
5. Follow DNS configuration instructions
6. Wait for SSL certificate provisioning

### For User Deployments

User projects deployed by Morgus will automatically get URLs like:
- `https://project-name.pages.dev`

To use custom domains:
1. Each deployed project can have custom domains added manually
2. Or configure a wildcard domain (e.g., `*.apps.go4me.ai`)

## Part 4: Test Deployment

### Test Console Deployment

1. Open your console URL: `https://morgus-console.pages.dev`
2. Verify it loads correctly
3. Check browser console for errors
4. Test creating a new task

### Test Orchestrator Deployment

1. Create a test task via console: "Create a simple HTML page with 'Hello World'"
2. Monitor task execution
3. Verify deployment succeeds
4. Check that artifact URL is accessible

## Troubleshooting

### Build Fails

**Error**: `Command not found: pnpm`

**Solution**: Update build command to install pnpm first:
```bash
npm install -g pnpm && cd console && pnpm install && pnpm build
```

### Environment Variables Not Working

**Issue**: Supabase connection fails

**Solution**: 
- Verify variables are set in **Production** environment
- Redeploy after adding variables
- Check variable names match exactly (case-sensitive)

### API Token Doesn't Work

**Error**: `Authentication error` or `Insufficient permissions`

**Solution**:
- Verify token has **Cloudflare Pages > Edit** permission
- Check Account ID is correct
- Ensure token hasn't expired
- Try creating a new token

### Deployment Quota Exceeded

**Error**: `You have reached the maximum number of projects`

**Solution**:
- Cloudflare Pages free tier: 100 projects
- Delete old/unused projects
- Or upgrade to paid plan

## Cloudflare Pages Limits

### Free Tier
- 500 builds per month
- 100 custom domains per project
- Unlimited requests
- Unlimited bandwidth
- 20,000 files per deployment
- 25 MB per file

### Paid Tier ($20/month)
- 5,000 builds per month
- Everything else same as free

For Morgus, the free tier should be sufficient for most use cases.

## Security Best Practices

1. **API Token Security**
   - Never commit tokens to git
   - Use environment variables
   - Rotate tokens periodically
   - Restrict by IP if possible

2. **Environment Variables**
   - Use different Supabase keys for dev/prod
   - Never expose service keys in console
   - Use anon key (with RLS) in frontend

3. **Custom Domains**
   - Always use HTTPS
   - Enable HSTS
   - Configure CAA records

## Next Steps

After setting up Cloudflare:

1. ✅ Console deployed and accessible
2. ✅ API token configured in orchestrator
3. ✅ Test deployment successful
4. → Set up monitoring and alerts
5. → Configure custom domain
6. → Set up CI/CD for console updates

## Resources

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)
- [API Token Permissions](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/)
