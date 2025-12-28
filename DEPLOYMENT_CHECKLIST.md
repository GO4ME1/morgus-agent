# Morgus Platform: Deployment Checklist

**Date:** December 27, 2025  
**Status:** Ready for Production Deployment

## Pre-Deployment Verification ✅

- [x] Backend code complete and tested
- [x] Frontend integration complete
- [x] All critical features implemented
- [x] API client with JWT authentication
- [x] Security middleware in place
- [x] Environment variables documented
- [x] Frontend builds successfully
- [x] All changes committed to GitHub

## Backend Deployment (Fly.io)

### Prerequisites
1. Fly.io account created
2. Fly CLI installed and authenticated
3. Database migrations ready
4. Environment variables prepared

### Step 1: Authenticate with Fly.io
```bash
fly auth login
```

### Step 2: Navigate to Backend Directory
```bash
cd /home/ubuntu/morgus-agent/dppm-service
```

### Step 3: Verify fly.toml Configuration
```bash
cat fly.toml
```

Ensure the following are configured:
- App name: `morgus-deploy`
- Region: Appropriate for your users
- Internal port: 8080
- Health checks configured
- Environment variables set

### Step 4: Set Environment Variables
```bash
# Supabase
fly secrets set SUPABASE_URL="https://dnxqgphaisdxvdyeiwnh.supabase.co"
fly secrets set SUPABASE_ANON_KEY="your_supabase_anon_key"
fly secrets set SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"

# Stripe
fly secrets set STRIPE_SECRET_KEY="your_stripe_secret_key"
fly secrets set STRIPE_WEBHOOK_SECRET="your_stripe_webhook_secret"

# OpenAI
fly secrets set OPENAI_API_KEY="your_openai_api_key"

# Database
fly secrets set DATABASE_URL="your_database_url"

# JWT
fly secrets set JWT_SECRET="your_jwt_secret"

# App
fly secrets set NODE_ENV="production"
fly secrets set PORT="8080"
```

### Step 5: Deploy Backend
```bash
fly deploy
```

### Step 6: Verify Backend Deployment
```bash
# Check app status
fly status

# View logs
fly logs

# Test health endpoint
curl https://morgus-deploy.fly.dev/health
```

### Step 7: Run Database Migrations (if needed)
```bash
fly ssh console
npm run migrate
exit
```

## Frontend Deployment (Cloudflare Pages)

### Prerequisites
1. Cloudflare account created
2. Cloudflare Pages project created
3. GitHub repository connected
4. Build settings configured

### Option 1: Deploy via Cloudflare Dashboard

1. Go to Cloudflare Pages dashboard
2. Click "Create a project"
3. Connect to GitHub repository: `GO4ME1/morgus-agent`
4. Configure build settings:
   - **Build command:** `cd console && npm install && npx vite build`
   - **Build output directory:** `console/dist`
   - **Root directory:** `/`
   - **Node version:** `18`

5. Set environment variables:
   ```
   VITE_SUPABASE_URL=https://dnxqgphaisdxvdyeiwnh.supabase.co
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_API_URL=https://morgus-deploy.fly.dev
   ```

6. Click "Save and Deploy"

### Option 2: Deploy via Wrangler CLI

```bash
# Install Wrangler
npm install -g wrangler

# Authenticate
wrangler login

# Navigate to console directory
cd /home/ubuntu/morgus-agent/console

# Build the project
npm install
npx vite build

# Deploy to Cloudflare Pages
wrangler pages deploy dist --project-name=morgus-console
```

### Step 3: Configure Custom Domain (Optional)

1. Go to Cloudflare Pages dashboard
2. Select your project
3. Go to "Custom domains"
4. Add your domain (e.g., `app.morgus.ai`)
5. Follow DNS configuration instructions

### Step 4: Verify Frontend Deployment

1. Visit your Cloudflare Pages URL
2. Test user login/signup
3. Test API connectivity
4. Check browser console for errors
5. Test on mobile devices

## Post-Deployment Verification

### Backend Health Checks
- [ ] `/health` endpoint returns 200 OK
- [ ] `/api/marketplace/browse` returns data
- [ ] `/api/billing/pricing` returns pricing tiers
- [ ] Authentication middleware works
- [ ] Rate limiting is active
- [ ] CORS headers are correct

### Frontend Functionality
- [ ] User can sign up
- [ ] User can log in
- [ ] Dashboard loads correctly
- [ ] Marketplace browsing works
- [ ] Billing page displays correctly
- [ ] Knowledge base uploads work
- [ ] API key management works
- [ ] MCP export generates files

### Integration Tests
- [ ] Frontend → Backend API calls succeed
- [ ] JWT authentication works end-to-end
- [ ] File uploads process correctly
- [ ] Stripe checkout redirects work
- [ ] Error handling displays properly
- [ ] Loading states work correctly

## Monitoring Setup

### Backend Monitoring
```bash
# Set up Fly.io monitoring
fly dashboard

# View real-time logs
fly logs -a morgus-deploy

# Check metrics
fly metrics -a morgus-deploy
```

### Frontend Monitoring
1. Enable Cloudflare Web Analytics
2. Set up error tracking (e.g., Sentry)
3. Monitor Core Web Vitals
4. Track API error rates

### Database Monitoring
1. Monitor Supabase dashboard
2. Check query performance
3. Monitor connection pool
4. Set up alerts for errors

## Rollback Procedure

### Backend Rollback
```bash
# List recent deployments
fly releases

# Rollback to previous version
fly releases rollback <version>
```

### Frontend Rollback
1. Go to Cloudflare Pages dashboard
2. Select "Deployments"
3. Find previous successful deployment
4. Click "Rollback to this deployment"

## Security Checklist

- [ ] All environment variables are set as secrets
- [ ] HTTPS is enforced
- [ ] CORS is properly configured
- [ ] Rate limiting is active
- [ ] API keys are hashed with bcrypt
- [ ] JWT tokens expire appropriately
- [ ] Input validation is in place
- [ ] SQL injection protection enabled
- [ ] XSS protection headers set
- [ ] CSP headers configured

## Performance Optimization

- [ ] Enable Cloudflare CDN caching
- [ ] Configure browser caching headers
- [ ] Compress static assets
- [ ] Enable HTTP/2
- [ ] Optimize images
- [ ] Lazy load components
- [ ] Code splitting implemented

## Backup Strategy

### Database Backups
- Supabase automatic daily backups enabled
- Point-in-time recovery available
- Export critical data weekly

### Code Backups
- GitHub repository with full history
- Tagged releases for each deployment
- Backup branches maintained

## Support & Maintenance

### Regular Tasks
- Monitor error logs daily
- Review performance metrics weekly
- Update dependencies monthly
- Security audit quarterly

### Incident Response
1. Check Fly.io status page
2. Review application logs
3. Check Supabase status
4. Verify Cloudflare status
5. Rollback if necessary
6. Notify users if downtime > 5 minutes

## Success Criteria

The deployment is successful when:
1. ✅ Backend responds to health checks
2. ✅ Frontend loads without errors
3. ✅ Users can sign up and log in
4. ✅ API calls complete successfully
5. ✅ No critical errors in logs
6. ✅ Response times < 500ms
7. ✅ All features functional

## Next Steps After Deployment

1. **User Testing** - Invite beta users to test
2. **Feedback Collection** - Set up feedback forms
3. **Analytics Setup** - Track user behavior
4. **Marketing Launch** - Announce to public
5. **Support Setup** - Prepare help documentation
6. **Scaling Plan** - Monitor usage and scale as needed

---

**Prepared by:** Manus AI  
**Version:** 2.6.0-deployment-ready  
**Last Updated:** December 27, 2025
