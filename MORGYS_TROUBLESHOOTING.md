# Morgys Feature - Troubleshooting Guide

## Common Issues and Solutions

### Issue 1: "Failed to create Morgy" Error

#### Symptoms
- User completes all 5 steps
- Clicks "Create Morgy" button
- Error message appears: "Failed to create Morgy"
- Console shows error logs

#### Possible Causes & Solutions

**Cause 1: Authentication Token Missing or Invalid**

Check browser console for:
```
Response status: 401
Response data: {success: false, error: "Unauthorized"}
```

**Solution:**
1. User needs to sign out and sign in again
2. Check that `session?.access_token` is being passed correctly
3. Verify Supabase auth is working properly

**Verification:**
```javascript
// In browser console
console.log('Session:', session);
console.log('Token:', session?.access_token);
console.log('User:', user);
```

---

**Cause 2: Missing Required Fields**

Check browser console for:
```
Response status: 400
Response data: {success: false, error: "Name must be between 3 and 255 characters"}
```

**Solution:**
1. Ensure `formData.name` is at least 3 characters
2. Ensure `formData.category` is valid
3. Check validation in `validateMorgyData` middleware

**Verification:**
```javascript
// Check payload in console logs
console.log('Creating Morgy with payload:', payload);
// Verify:
// - name.length >= 3
// - category is one of: business, social, research, technical, creative, custom
```

---

**Cause 3: Database Schema Mismatch**

Check browser console for:
```
Response status: 500
Response data: {success: false, error: "Failed to create Morgy"}
```

Check Fly.io logs for:
```
Error creating Morgy: column "xxx" does not exist
```

**Solution:**
1. Verify `morgys` table has all 18 required columns
2. Run migration to add missing columns
3. Check that JSON fields (ai_config, personality, etc.) are properly formatted

**Required Columns:**
```sql
-- Core fields
id uuid PRIMARY KEY
creator_id text NOT NULL
name text NOT NULL
description text
category text NOT NULL
tags text[]

-- Configuration (JSONB)
ai_config jsonb
personality jsonb
appearance jsonb
capabilities jsonb
knowledge_base jsonb

-- Marketplace
is_public boolean DEFAULT false
license_type text DEFAULT 'free'
price numeric(10,2) DEFAULT 0
is_premium boolean DEFAULT false
published_at timestamptz

-- Stats
total_purchases integer DEFAULT 0
total_revenue numeric(10,2) DEFAULT 0
rating numeric(3,2) DEFAULT 0
review_count integer DEFAULT 0
view_count integer DEFAULT 0

-- Metadata
created_at timestamptz DEFAULT now()
updated_at timestamptz DEFAULT now()
is_starter boolean DEFAULT false
```

**Verification:**
```sql
-- Run in Supabase SQL Editor
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'morgys'
ORDER BY ordinal_position;
```

---

**Cause 4: Backend API Not Running**

Check browser console for:
```
Failed to fetch
Network error
```

**Solution:**
1. Verify Fly.io backend is running: https://morgus-deploy.fly.dev/health
2. Check Fly.io logs: `fly logs -a morgus-deploy`
3. Restart backend if needed: `fly deploy -a morgus-deploy`

**Verification:**
```bash
# Test API health
curl https://morgus-deploy.fly.dev/health

# Should return:
{"status":"ok","timestamp":"2026-01-08T..."}
```

---

**Cause 5: CORS Issues**

Check browser console for:
```
Access to fetch at 'https://morgus-deploy.fly.dev/api/morgys' 
from origin 'https://console.morgus.ai' has been blocked by CORS policy
```

**Solution:**
1. Verify CORS headers are set in backend
2. Check that `Access-Control-Allow-Origin` includes console.morgus.ai
3. Verify preflight OPTIONS requests are handled

**Verification:**
```bash
# Test CORS headers
curl -H "Origin: https://console.morgus.ai" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type,Authorization" \
     -X OPTIONS \
     https://morgus-deploy.fly.dev/api/morgys -v
```

---

### Issue 2: MCP Servers Not Loading

#### Symptoms
- Step 5 shows "Loading MCP servers..." forever
- Even after fixes, no servers appear

#### Solution
✅ **Already Fixed** in this deployment!

The fix adds fallback sample servers when database is empty:
- Web Search
- Stripe Payments
- Google Sheets
- GitHub
- Twitter/X
- Email

**If still not working:**
1. Check browser console for errors
2. Verify `loadMCPServers()` function is being called
3. Check that `SAMPLE_MCP_SERVERS` constant exists

---

### Issue 3: UI Text Too Small

#### Symptoms
- Step 5 text is hard to read
- Cards are overlapping
- Category badges are tiny

#### Solution
✅ **Already Fixed** in this deployment!

Font sizes increased:
- Server name: 18px → 20px
- Description: 15px → 16px
- Category badge: 13px → 14px

Spacing improved:
- Card padding: 20px → 24px
- Card height: 100px → 120px
- Added 4px margin-bottom

**If still not working:**
1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh (Ctrl+Shift+R)
3. Check that new CSS is loaded in DevTools

---

## Debugging Workflow

### Step 1: Check Browser Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for error messages
4. Check for detailed logs from `handleSubmit`

**Expected logs:**
```
Creating Morgy with payload: {...}
Response status: 201
Response data: {success: true, morgy: {...}}
```

**Error logs:**
```
Creating Morgy with payload: {...}
Response status: 400/401/500
Response data: {success: false, error: "..."}
Failed to create Morgy: ...
Error creating Morgy: Error: ...
```

---

### Step 2: Check Network Tab
1. Open browser DevTools (F12)
2. Go to Network tab
3. Filter by "Fetch/XHR"
4. Look for POST request to `/api/morgys`
5. Check request payload and response

**Successful request:**
```
Request URL: https://morgus-deploy.fly.dev/api/morgys
Request Method: POST
Status Code: 201 Created

Request Headers:
  Content-Type: application/json
  Authorization: Bearer eyJ...
  x-user-id: 83bde59e-daf4-4ddb-9100-e7d429e2c1b0

Request Payload:
{
  "creator_id": "83bde59e-daf4-4ddb-9100-e7d429e2c1b0",
  "name": "Cyber Porky the Navigator",
  "description": "...",
  ...
}

Response:
{
  "success": true,
  "morgy": {
    "id": "...",
    "name": "Cyber Porky the Navigator",
    ...
  }
}
```

---

### Step 3: Check Fly.io Logs
```bash
# View recent logs
fly logs -a morgus-deploy

# Follow logs in real-time
fly logs -a morgus-deploy -f

# Filter for errors
fly logs -a morgus-deploy | grep -i error
```

**Look for:**
- Database connection errors
- Authentication errors
- Validation errors
- SQL errors

---

### Step 4: Check Supabase Logs
1. Go to Supabase dashboard
2. Navigate to Logs section
3. Filter by "Database" or "API"
4. Look for errors around the time of Morgy creation attempt

**Common errors:**
- `column "xxx" does not exist`
- `null value in column "xxx" violates not-null constraint`
- `permission denied for table morgys`

---

### Step 5: Test API Directly
```bash
# Get auth token from browser console
# console.log(session?.access_token)

# Test POST /api/morgys
curl -X POST https://morgus-deploy.fly.dev/api/morgys \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "x-user-id: YOUR_USER_ID_HERE" \
  -d '{
    "name": "Test Morgy",
    "description": "Testing API",
    "category": "custom",
    "tags": ["test"],
    "aiConfig": {
      "primaryModel": "gpt-4",
      "temperature": 0.7,
      "maxTokens": 2000,
      "systemPrompt": "You are a test agent",
      "fallbackModels": ["gpt-3.5-turbo"]
    },
    "personality": {
      "tone": "professional",
      "verbosity": "balanced",
      "emojiUsage": "minimal",
      "responseStyle": "test"
    },
    "appearance": {
      "avatar": "🐷",
      "color": "#00FFFF",
      "icon": "custom"
    },
    "capabilities": {
      "webSearch": true,
      "codeExecution": false,
      "fileProcessing": true,
      "imageGeneration": false,
      "voiceInteraction": false,
      "mcpTools": []
    },
    "knowledgeBase": {
      "documents": [],
      "urls": [],
      "customData": []
    },
    "marketplace": {
      "isPublic": false,
      "licenseType": "free",
      "price": 0,
      "isPremium": false
    }
  }'
```

---

## Quick Fixes

### Fix 1: Clear Browser Cache
```
1. Press Ctrl+Shift+Delete (Windows) or Cmd+Shift+Delete (Mac)
2. Select "Cached images and files"
3. Click "Clear data"
4. Refresh page (Ctrl+R or Cmd+R)
```

### Fix 2: Sign Out and Sign In Again
```
1. Click user avatar in top-right
2. Click "Sign Out"
3. Sign in again with same credentials
4. Try creating Morgy again
```

### Fix 3: Restart Backend
```bash
# SSH into Fly.io
fly ssh console -a morgus-deploy

# Or just redeploy
cd /path/to/morgus-agent/dppm-service
fly deploy -a morgus-deploy
```

### Fix 4: Check Database Schema
```sql
-- Run in Supabase SQL Editor
-- Check if morgys table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'morgys'
);

-- Check column count (should be 18+)
SELECT COUNT(*) 
FROM information_schema.columns 
WHERE table_name = 'morgys';

-- List all columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'morgys'
ORDER BY ordinal_position;
```

---

## Contact & Escalation

If issues persist after trying all troubleshooting steps:

1. **Collect diagnostic info:**
   - Browser console logs (screenshot or copy/paste)
   - Network tab request/response (screenshot)
   - Fly.io logs (copy/paste)
   - Supabase logs (screenshot)

2. **Document the issue:**
   - What were you trying to do?
   - What happened instead?
   - What error messages did you see?
   - What have you tried already?

3. **Check related systems:**
   - Is Supabase up? https://status.supabase.com
   - Is Fly.io up? https://status.flyio.net
   - Is Cloudflare up? https://www.cloudflarestatus.com

---

## Known Limitations

1. **File uploads in Knowledge Base** - Currently only URLs and text are supported. File upload functionality exists but may need backend implementation.

2. **MCP server icons** - Icons are optional and may not display if `icon_url` is null.

3. **Sample MCP servers** - The fallback sample servers are not real MCP servers. They're just UI placeholders until the database is populated.

4. **Creator ID validation** - The backend uses `x-user-id` header which might not match the actual authenticated user. This is a security concern that should be addressed.

---

## Success Checklist

After deployment, verify:

- [ ] Step 5 loads immediately (no infinite loading)
- [ ] 6 sample MCP servers are visible
- [ ] Text is readable (20px, 16px, 14px fonts)
- [ ] Cards don't overlap (4px margin-bottom)
- [ ] Console shows detailed logs when creating Morgy
- [ ] Error messages are specific and actionable
- [ ] Morgy creation succeeds (or shows helpful error)
- [ ] New Morgy appears in Morgy Pen after creation
- [ ] MCP export functionality works (test separately)

---

## Next Steps

1. **Deploy fixes** to Cloudflare Pages
2. **Test end-to-end** Morgy creation
3. **Monitor logs** for any new errors
4. **Populate database** with real MCP servers (optional)
5. **Implement MCP export** testing workflow
