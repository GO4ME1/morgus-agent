# NotebookLM Automated Integration - Deployment Guide

**Date:** December 31, 2024  
**Status:** Ready for Deployment  
**Target:** Fly.io with Persistent Storage

---

## 🎯 Overview

This guide walks you through deploying the Morgus DPPM service with **fully automated NotebookLM integration**. Once deployed, users can chat with NotebookLM directly from Morgus without any manual copying/pasting.

---

## 📋 Prerequisites

1. **Fly.io Account** with CLI installed (`fly auth login`)
2. **Your NotebookLM Notebook ID**: `f3d3d717-6658-4d5b-9570-49c709a7d0fd`
3. **Google Account** credentials for one-time authentication
4. **Supabase** credentials (already configured)

---

## 🚀 Deployment Steps

### **Step 1: Create Persistent Volume**

The Chrome profile (with your Google session) needs to persist across deployments.

```bash
cd /home/ubuntu/morgus-agent/dppm-service

# Create a 1GB volume for Chrome profile storage
fly volumes create notebooklm_data \
  --region sjc \
  --size 1 \
  --app morgus-deploy
```

**Expected Output:**
```
        ID: vol_xxx
      Name: notebooklm_data
       App: morgus-deploy
    Region: sjc
      Zone: xxxx
   Size GB: 1
 Encrypted: true
Created at: 01 Jan 25 00:00 UTC
```

---

### **Step 2: Set Environment Variables**

```bash
# Enable NotebookLM integration
fly secrets set NOTEBOOKLM_ENABLED=true --app morgus-deploy

# Set your notebook ID
fly secrets set NOTEBOOKLM_NOTEBOOK_ID=f3d3d717-6658-4d5b-9570-49c709a7d0fd --app morgus-deploy

# Set Python environment path (already in Dockerfile)
fly secrets set NOTEBOOKLM_PYTHON_ENV=/app/notebooklm-env --app morgus-deploy

# Set Chrome profile directory (mounted volume)
fly secrets set NOTEBOOKLM_PROFILE_DIR=/app/chrome_profile_notebooklm --app morgus-deploy
```

---

### **Step 3: Deploy with NotebookLM Support**

```bash
# Deploy using the enhanced Dockerfile
fly deploy \
  --config fly.notebooklm.toml \
  --dockerfile Dockerfile.notebooklm \
  --app morgus-deploy
```

**This will:**
- ✅ Build Docker image with Python 3.11, Chrome, and notebooklm-mcp
- ✅ Install all dependencies
- ✅ Mount the persistent volume for Chrome profile
- ✅ Start the DPPM service

**Expected Output:**
```
==> Building image
...
==> Pushing image to fly
...
==> Deploying morgus-deploy
...
 ✔ [app] deployed successfully
```

---

### **Step 4: Initialize Chrome Profile (One-Time Setup)**

After deployment, you need to authenticate with Google **once**. This saves your session for future use.

```bash
# SSH into the Fly.io machine
fly ssh console --app morgus-deploy

# Once inside, run:
cd /app
source notebooklm-env/bin/activate

# Initialize with your notebook (this opens a browser)
notebooklm-mcp init https://notebooklm.google.com/notebook/f3d3d717-6658-4d5b-9570-49c709a7d0fd
```

**What happens:**
1. Chrome browser opens (headless mode with display)
2. You see Google Sign-In page
3. Log in with your Google account
4. Navigate to your NotebookLM notebook
5. Session is saved to `/app/chrome_profile_notebooklm/` (persistent volume)
6. Exit the SSH session

**Note:** Since Fly.io machines don't have a display, you may need to use VNC or X11 forwarding. Alternatively, you can:

**Alternative: Export Chrome Profile from Local Machine**

```bash
# On your local machine (with display):
cd /home/ubuntu/morgus-agent
source /home/ubuntu/notebooklm-env/bin/activate
notebooklm-mcp init https://notebooklm.google.com/notebook/f3d3d717-6658-4d5b-9570-49c709a7d0fd

# This creates chrome_profile_notebooklm/ locally
# Tar it up
tar -czf chrome_profile.tar.gz chrome_profile_notebooklm/

# Upload to Fly.io
fly ssh sftp shell --app morgus-deploy
put chrome_profile.tar.gz /app/chrome_profile.tar.gz
exit

# SSH in and extract
fly ssh console --app morgus-deploy
cd /app
tar -xzf chrome_profile.tar.gz
rm chrome_profile.tar.gz
exit
```

---

### **Step 5: Restart the Service**

```bash
# Restart to load the Chrome profile
fly apps restart morgus-deploy
```

---

### **Step 6: Verify It's Working**

```bash
# Check logs
fly logs --app morgus-deploy

# Look for:
# ✅ NotebookLM MCP server started successfully
```

**Test the API:**
```bash
curl -X POST https://morgus-deploy.fly.dev/api/notebooklm/status \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"

# Expected response:
# {"running":true,"ready":true,"notebookId":"f3d3d717-6658-4d5b-9570-49c709a7d0fd"}
```

---

## 🧪 Testing from Frontend

Once deployed, the frontend will automatically use the backend API:

1. Open Morgus console: `https://morgus-console.pages.dev`
2. Start a new chat
3. Ask a question that triggers NotebookLM
4. The response should come back automatically (no clipboard needed!)

**Frontend Flow:**
```
User → Morgus Console → DPPM API → NotebookLM MCP → Google NotebookLM → Response
```

---

## 🔧 Configuration Files

### **Environment Variables (Fly.io Secrets)**

| Variable | Value | Purpose |
|----------|-------|---------|
| `NOTEBOOKLM_ENABLED` | `true` | Enable NotebookLM integration |
| `NOTEBOOKLM_NOTEBOOK_ID` | `f3d3d717-...` | Your notebook ID |
| `NOTEBOOKLM_PYTHON_ENV` | `/app/notebooklm-env` | Python venv path |
| `NOTEBOOKLM_PROFILE_DIR` | `/app/chrome_profile_notebooklm` | Chrome profile path |
| `CHROME_BIN` | `/usr/bin/chromium` | Chrome binary path |
| `CHROMEDRIVER_PATH` | `/usr/bin/chromedriver` | ChromeDriver path |

### **Dockerfile.notebooklm**

- Base: `node:20-slim`
- Adds: Python 3.11, Chromium, Selenium
- Installs: `notebooklm-mcp==2.0.11`
- Volume: `/app/chrome_profile_notebooklm`

### **fly.notebooklm.toml**

- Memory: 1GB (increased for Chrome + Python)
- Volume: `notebooklm_data` mounted at `/app/chrome_profile_notebooklm`
- Auto-start: Enabled
- Auto-stop: Enabled (saves costs)

---

## 🐛 Troubleshooting

### **Issue: "NotebookLM MCP server not ready"**

**Cause:** Chrome profile not initialized or session expired

**Solution:**
```bash
fly ssh console --app morgus-deploy
cd /app
source notebooklm-env/bin/activate
notebooklm-mcp init https://notebooklm.google.com/notebook/f3d3d717-6658-4d5b-9570-49c709a7d0fd
exit
fly apps restart morgus-deploy
```

---

### **Issue: "Authentication failed"**

**Cause:** Google session expired (happens after ~30 days)

**Solution:**
Re-run the init command (Step 4) to refresh the session.

---

### **Issue: "Timeout" errors**

**Cause:** NotebookLM is slow to respond

**Solution:**
Increase timeout in `notebooklm-config.json`:
```json
{
  "timeout": 120,
  "streaming_timeout": 120
}
```

Then redeploy:
```bash
fly deploy --config fly.notebooklm.toml --dockerfile Dockerfile.notebooklm --app morgus-deploy
```

---

### **Issue: "Volume not mounted"**

**Cause:** Volume wasn't created or isn't attached

**Solution:**
```bash
# Check volumes
fly volumes list --app morgus-deploy

# If missing, create it
fly volumes create notebooklm_data --region sjc --size 1 --app morgus-deploy

# Redeploy
fly deploy --config fly.notebooklm.toml --dockerfile Dockerfile.notebooklm --app morgus-deploy
```

---

### **Issue: Frontend still using clipboard**

**Cause:** Backend API not responding or auth token missing

**Solution:**
1. Check backend logs: `fly logs --app morgus-deploy`
2. Verify API is accessible: `curl https://morgus-deploy.fly.dev/api/notebooklm/status`
3. Check frontend console for errors
4. Verify `VITE_API_BASE_URL` is set correctly in frontend

---

## 📊 Monitoring

### **Check Service Health**

```bash
# View logs
fly logs --app morgus-deploy

# Check status
fly status --app morgus-deploy

# SSH into machine
fly ssh console --app morgus-deploy
```

### **Monitor NotebookLM MCP**

```bash
# Inside SSH session
ps aux | grep notebooklm-mcp

# Check if Chrome is running
ps aux | grep chromium
```

---

## 💰 Cost Optimization

The current configuration uses:
- **Memory:** 1GB (required for Chrome)
- **CPU:** 1 shared CPU
- **Storage:** 1GB volume ($0.15/month)
- **Auto-stop:** Enabled (machine stops when idle)

**Estimated Cost:** ~$5-10/month (depending on usage)

**To reduce costs:**
- Keep auto-stop enabled
- Use `min_machines_running = 0` (already set)
- Consider scaling down memory to 512MB if Chrome runs well

---

## 🔐 Security Considerations

### **Chrome Profile Security**

- ✅ Stored on encrypted Fly.io volume
- ✅ Not accessible from outside the machine
- ✅ Session cookies encrypted by Chrome
- ⚠️ Anyone with SSH access can use your NotebookLM

**Best Practices:**
1. **Limit SSH Access:** Only trusted team members
2. **Rotate Sessions:** Re-authenticate every 30 days
3. **Monitor Usage:** Check NotebookLM activity regularly
4. **Backup Profile:** Copy `chrome_profile_notebooklm/` periodically

### **API Security**

- ✅ Requires authentication (`requireAuth` middleware)
- ✅ Rate limited (`usageTrackingMiddleware`)
- ✅ HTTPS only
- ✅ CORS configured

---

## 🎉 Success Criteria

You'll know it's working when:

1. ✅ Deployment succeeds without errors
2. ✅ Logs show: "✅ NotebookLM MCP server started successfully"
3. ✅ API `/api/notebooklm/status` returns `{"running":true,"ready":true}`
4. ✅ Frontend chat with NotebookLM works automatically
5. ✅ No clipboard copying needed!

---

## 📚 Additional Resources

- **NotebookLM MCP GitHub:** https://github.com/khengyun/notebooklm-mcp
- **Fly.io Volumes:** https://fly.io/docs/reference/volumes/
- **Fly.io Secrets:** https://fly.io/docs/reference/secrets/
- **Morgus DPPM Service:** `/home/ubuntu/morgus-agent/dppm-service/`

---

## 🚀 Next Steps

After successful deployment:

1. **Test thoroughly** - Try various NotebookLM queries
2. **Monitor performance** - Check response times and errors
3. **Update documentation** - Add any learnings or issues
4. **Consider multi-user** - Each user could have their own notebook
5. **Add features** - Study guides, FAQs, timelines, etc.

---

**Deployment Status:** ⏳ Ready to Deploy  
**Last Updated:** December 31, 2024  
**Notebook ID:** f3d3d717-6658-4d5b-9570-49c709a7d0fd  
**Target:** Fly.io (morgus-deploy)
