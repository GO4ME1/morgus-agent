# NotebookLM MCP Integration - Complete Analysis

**Date:** December 31, 2024  
**Status:** Configured with User Credentials  
**MCP Server:** khengyun/notebooklm-mcp v2.0.11

---

## 🔍 Overview

The Morgus platform integrates with Google NotebookLM through the **khengyun/notebooklm-mcp** Python MCP server. This integration uses **your personal NotebookLM credentials** stored in a persistent Chrome profile.

---

## 🔑 Authentication & Credentials

### **How It Works**
1. **Chrome Profile Storage**: Your Google login credentials are stored in `chrome_profile_notebooklm/`
2. **Persistent Session**: The MCP server uses Selenium to maintain a logged-in Chrome session
3. **Headless Operation**: After initial login, the browser runs in headless mode
4. **No API Keys**: NotebookLM doesn't have a public API - this uses browser automation

### **Your Notebook ID**
```
f3d3d717-6658-4d5b-9570-49c709a7d0fd
```

This is configured in:
- `notebooklm-config.json` (line 5)
- `console/src/config/notebooklm.ts` (line 9)

### **Chrome Profile Location**
```
/home/ubuntu/morgus-agent/chrome_profile_notebooklm/
```

**Current Status:**
- ✅ Directory exists
- ⚠️ Profile appears incomplete (only metadata, no Default profile or cookies)
- ⚠️ May need re-initialization with `notebooklm-mcp init`

---

## 🏗️ Architecture

### **Component Stack**

```
┌─────────────────────────────────────────┐
│  Morgus Console (Frontend)              │
│  - console/src/services/notebooklm.ts   │
│  - Manual clipboard integration         │
└─────────────────┬───────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────┐
│  DPPM Service (Backend)                 │
│  - dppm-service/src/notebooklm-*.ts    │
│  - API endpoints for NotebookLM         │
└─────────────────┬───────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────┐
│  NotebookLM MCP Server (Python)         │
│  - khengyun/notebooklm-mcp v2.0.11     │
│  - Selenium + Chrome automation         │
└─────────────────┬───────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────┐
│  Google NotebookLM (Web)                │
│  - https://notebooklm.google.com        │
│  - Your personal notebook               │
└─────────────────────────────────────────┘
```

### **Data Flow**

**Option 1: Frontend Manual (Current Implementation)**
```
User → Console → Clipboard → NotebookLM Web UI
```

**Option 2: Backend MCP (Available but Not Used)**
```
User → Console → DPPM API → MCP Server → NotebookLM Web UI
```

---

## 📁 File Structure

### **Frontend Files**
```
console/src/
├── config/notebooklm.ts           # Configuration (notebook ID, features)
├── services/notebooklm.ts         # Frontend service (clipboard integration)
└── lib/mcp-client.ts              # Generic MCP client (not used for NotebookLM)
```

### **Backend Files**
```
dppm-service/src/
├── notebooklm-service.ts          # MCP server wrapper (spawn Python process)
├── notebooklm-routes.ts           # API endpoints (/start, /chat, /status, /stop)
├── notebooklm-extras.ts           # Additional features (FAQ, timeline)
├── notebooklm-infographic.ts      # Infographic generation
├── notebooklm-podcast.ts          # Podcast generation
└── notebooklm-studyguide.ts       # Study guide generation
```

### **Configuration Files**
```
/home/ubuntu/morgus-agent/
├── notebooklm-config.json         # MCP server configuration
└── chrome_profile_notebooklm/     # Chrome profile with your credentials
```

### **Python Environment**
```
/home/ubuntu/notebooklm-env/       # Python virtual environment
└── bin/
    ├── python                      # Python 3.x
    └── notebooklm-mcp             # MCP CLI tool
```

**Status:** ⚠️ Environment not found - needs to be created

---

## 🔧 Configuration Details

### **notebooklm-config.json**
```json
{
  "headless": false,                    // Browser visibility
  "debug": false,                       // Debug logging
  "timeout": 60,                        // Operation timeout (seconds)
  "default_notebook_id": "f3d3d717...", // Your notebook
  "base_url": "https://notebooklm.google.com",
  "server_name": "notebooklm-mcp",
  "stdio_mode": true,                   // JSON-RPC over stdin/stdout
  "streaming_timeout": 60,
  "response_stability_checks": 3,
  "retry_attempts": 3,
  "auth": {
    "cookies_path": null,
    "profile_dir": "./chrome_profile_notebooklm",
    "use_persistent_session": true,
    "auto_login": true
  }
}
```

### **Frontend Configuration**
```typescript
// console/src/config/notebooklm.ts
export const NOTEBOOKLM_CONFIG = {
  defaultNotebookId: 'f3d3d717-6658-4d5b-9570-49c709a7d0fd',
  baseUrl: 'https://notebooklm.google.com',
  features: {
    multipleNotebooks: true,
    audioOverview: true,
    sourceManagement: true,
    studyGuides: true
  }
};
```

### **Backend Service Configuration**
```typescript
// dppm-service/src/notebooklm-service.ts
constructor(config: NotebookLMConfig = {}) {
  this.config = {
    headless: true,
    timeout: 30,
    profileDir: './chrome_profile_notebooklm',
    pythonEnvPath: '/home/ubuntu/notebooklm-env',
    ...config
  };
}
```

---

## 🚀 Setup Requirements

### **1. Python Environment**
```bash
# Create virtual environment
python3 -m venv /home/ubuntu/notebooklm-env

# Activate
source /home/ubuntu/notebooklm-env/bin/activate

# Install notebooklm-mcp
pip install notebooklm-mcp==2.0.11

# Install dependencies
pip install selenium
```

### **2. Initialize Chrome Profile**
```bash
cd /home/ubuntu/morgus-agent
source /home/ubuntu/notebooklm-env/bin/activate

# Initialize with your notebook
notebooklm-mcp init https://notebooklm.google.com/notebook/f3d3d717-6658-4d5b-9570-49c709a7d0fd
```

**What this does:**
- Opens Chrome browser
- Prompts you to log in to Google
- Navigates to your NotebookLM notebook
- Saves session to `chrome_profile_notebooklm/`
- Creates cookies and authentication tokens

### **3. Test the MCP Server**
```bash
# Test chat
notebooklm-mcp --config notebooklm-config.json chat --message "Hello!"

# Start server
notebooklm-mcp --config notebooklm-config.json server --transport stdio
```

---

## 🎯 API Endpoints (Backend)

### **1. Start NotebookLM Server**
```http
POST /api/notebooklm/start
Content-Type: application/json

{
  "notebookId": "f3d3d717-6658-4d5b-9570-49c709a7d0fd",
  "headless": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "NotebookLM MCP server started successfully"
}
```

### **2. Chat with NotebookLM**
```http
POST /api/notebooklm/chat
Content-Type: application/json

{
  "message": "What are the key concepts in AI agents?",
  "timeout": 30
}
```

**Response:**
```json
{
  "success": true,
  "response": "AI agents are autonomous systems that...",
  "timestamp": 1735689600000
}
```

### **3. Check Status**
```http
GET /api/notebooklm/status
```

**Response:**
```json
{
  "running": true,
  "ready": true,
  "notebookId": "f3d3d717-6658-4d5b-9570-49c709a7d0fd"
}
```

### **4. Stop Server**
```http
POST /api/notebooklm/stop
```

**Response:**
```json
{
  "success": true,
  "message": "NotebookLM MCP server stopped"
}
```

---

## 🔄 Current Implementation

### **Frontend: Manual Clipboard Approach**

The console currently uses a **manual clipboard integration**:

```typescript
// console/src/services/notebooklm.ts
async chat(notebookId: string, message: string): Promise<string> {
  // NotebookLM doesn't have an API - use manual clipboard approach
  return await this.getInsights(notebookId, message);
}

private async getInsights(notebookId: string, message: string): Promise<string> {
  // Copy message to clipboard
  await navigator.clipboard.writeText(message);
  
  // Open NotebookLM in new tab
  const url = `https://notebooklm.google.com/notebook/${notebookId}`;
  window.open(url, '_blank');
  
  return 'Content copied to clipboard. Paste into NotebookLM to continue.';
}
```

**User Flow:**
1. User sends message in Morgus
2. Message is copied to clipboard
3. NotebookLM opens in new tab
4. User manually pastes and submits

### **Backend: MCP Server Integration (Available)**

The backend has full MCP server integration ready to use:

```typescript
// dppm-service/src/notebooklm-service.ts
async chat(message: string, options: { timeout?: number } = {}): Promise<NotebookLMResponse> {
  // Create JSON-RPC request
  const request = {
    jsonrpc: '2.0',
    id: Date.now(),
    method: 'tools/call',
    params: {
      name: 'chat_with_notebook',
      arguments: {
        message,
        notebook_id: this.config.notebookId
      }
    }
  };

  // Send to MCP server via stdin
  this.mcpProcess?.stdin?.write(JSON.stringify(request) + '\n');
  
  // Wait for response
  return new Promise((resolve, reject) => {
    // ... response handling
  });
}
```

**Why Not Used:**
- Requires Python environment setup
- Requires Chrome profile initialization
- Requires MCP server to be running
- Manual approach is simpler for MVP

---

## 🔐 Security Considerations

### **Credentials Storage**
- ✅ Chrome profile stored locally (not in git)
- ✅ No API keys or passwords in code
- ✅ Session cookies encrypted by Chrome
- ⚠️ Profile directory should be backed up securely

### **Access Control**
- ⚠️ Anyone with access to the server can use your NotebookLM
- ⚠️ No per-user authentication for NotebookLM access
- 💡 Consider: Multi-user support with separate Chrome profiles

### **Best Practices**
1. **Backup Chrome Profile**: Copy `chrome_profile_notebooklm/` regularly
2. **Re-authenticate Periodically**: Google sessions expire after ~30 days
3. **Monitor Usage**: Check NotebookLM activity for unauthorized access
4. **Separate Notebooks**: Use different notebooks for different purposes

---

## 🐛 Troubleshooting

### **Issue: "NotebookLM MCP server not ready"**
**Cause:** Python environment not set up or MCP server not running

**Solution:**
```bash
# Check if environment exists
ls -la /home/ubuntu/notebooklm-env

# If not, create it
python3 -m venv /home/ubuntu/notebooklm-env
source /home/ubuntu/notebooklm-env/bin/activate
pip install notebooklm-mcp==2.0.11
```

### **Issue: "Authentication failed"**
**Cause:** Chrome profile missing or session expired

**Solution:**
```bash
# Re-initialize
cd /home/ubuntu/morgus-agent
source /home/ubuntu/notebooklm-env/bin/activate
notebooklm-mcp init https://notebooklm.google.com/notebook/f3d3d717-6658-4d5b-9570-49c709a7d0fd
```

### **Issue: "Timeout" errors**
**Cause:** NotebookLM is slow to respond

**Solution:**
```json
// Increase timeout in notebooklm-config.json
{
  "timeout": 120,
  "streaming_timeout": 120
}
```

### **Issue: Chrome profile incomplete**
**Cause:** Profile created but login not completed

**Solution:**
```bash
# Delete and recreate
rm -rf chrome_profile_notebooklm
notebooklm-mcp init https://notebooklm.google.com/notebook/YOUR_NOTEBOOK_ID
# Complete the login process in the browser that opens
```

---

## 📊 Features Available

| Feature | Frontend | Backend | Status |
|---------|----------|---------|--------|
| **Chat with Notebook** | ✅ Manual | ✅ MCP | Ready |
| **Add Sources** | ❌ | ✅ MCP | Backend only |
| **Generate Study Guide** | ❌ | ✅ MCP | Backend only |
| **Generate FAQ** | ❌ | ✅ MCP | Backend only |
| **Generate Timeline** | ❌ | ✅ MCP | Backend only |
| **Generate Infographic** | ❌ | ✅ MCP | Backend only |
| **Generate Podcast** | ❌ | ✅ MCP | Backend only |
| **Audio Overview** | ❌ | ❌ | Not implemented |
| **Multiple Notebooks** | ✅ Config | ✅ MCP | Ready |

---

## 🚀 Upgrade Path: Manual → Automated

To enable full automated NotebookLM integration:

### **Step 1: Set Up Python Environment**
```bash
python3 -m venv /home/ubuntu/notebooklm-env
source /home/ubuntu/notebooklm-env/bin/activate
pip install notebooklm-mcp==2.0.11 selenium
```

### **Step 2: Initialize Chrome Profile**
```bash
cd /home/ubuntu/morgus-agent
notebooklm-mcp init https://notebooklm.google.com/notebook/f3d3d717-6658-4d5b-9570-49c709a7d0fd
# Complete Google login in the browser
```

### **Step 3: Update Frontend Service**
```typescript
// console/src/services/notebooklm.ts
async chat(notebookId: string, message: string): Promise<string> {
  // Call backend API instead of manual clipboard
  const response = await fetch(`${API_BASE_URL}/api/notebooklm/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, notebookId })
  });
  
  const data = await response.json();
  return data.response;
}
```

### **Step 4: Deploy DPPM Service**
```bash
cd /home/ubuntu/morgus-agent/dppm-service
npm run build
fly deploy
```

### **Step 5: Test End-to-End**
```bash
# Test from console
curl -X POST https://morgus-deploy.fly.dev/api/notebooklm/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello NotebookLM!"}'
```

---

## 📚 Related MCP Servers

The Morgus platform also has these custom MCP servers:

1. **morgus-rag** - Vector search over knowledge base
2. **morgus-web-search** - Enhanced web search
3. **morgus-code-executor** - Safe code execution
4. **morgus-github** - GitHub integration
5. **morgus-calendar** - Google Calendar integration
6. **morgus-notion** - Notion integration

All located in: `/home/ubuntu/morgus-agent/mcp-servers/`

---

## 🎯 Recommendations

### **For Current Setup (Manual)**
1. ✅ Keep manual clipboard approach for simplicity
2. ✅ Document the user flow clearly
3. ✅ Add UI hints for clipboard paste
4. ✅ Consider adding a "Copy to NotebookLM" button

### **For Future Enhancement (Automated)**
1. 🔄 Set up Python environment on production server
2. 🔄 Initialize Chrome profile with your credentials
3. 🔄 Deploy DPPM service with NotebookLM routes
4. 🔄 Update frontend to call backend API
5. 🔄 Add per-user notebook configuration

### **For Multi-User Support**
1. 🔮 Create separate Chrome profiles per user
2. 🔮 Store notebook IDs in user_settings table
3. 🔮 Implement OAuth flow for Google authentication
4. 🔮 Manage multiple MCP server instances

---

## 📝 Summary

**Current State:**
- ✅ NotebookLM config files exist
- ✅ Backend MCP integration code ready
- ✅ Frontend uses manual clipboard approach
- ⚠️ Python environment needs setup
- ⚠️ Chrome profile needs initialization

**Your Credentials:**
- Notebook ID: `f3d3d717-6658-4d5b-9570-49c709a7d0fd`
- Chrome Profile: `chrome_profile_notebooklm/` (needs re-init)
- Python Env: `/home/ubuntu/notebooklm-env` (needs creation)

**Next Steps:**
1. Decide: Keep manual or upgrade to automated?
2. If automated: Set up Python env and Chrome profile
3. If manual: Add UI improvements for better UX
4. Document the chosen approach for users

---

**Status:** ✅ Documented  
**Last Updated:** December 31, 2024  
**MCP Server:** khengyun/notebooklm-mcp v2.0.11  
**Your Notebook:** f3d3d717-6658-4d5b-9570-49c709a7d0fd
