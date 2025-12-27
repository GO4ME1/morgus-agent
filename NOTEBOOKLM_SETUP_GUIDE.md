# 📚 NotebookLM Integration Setup Guide

**Last Updated:** December 26, 2024

This guide shows you how to set up and use Google NotebookLM integration in Morgus for AI-powered research and knowledge management.

---

## ✅ What's Already Done

- ✅ **notebooklm-mcp installed** (v2.0.11)
- ✅ **Selenium installed** (v4.39.0)
- ✅ **Python virtual environment created** (`/home/ubuntu/notebooklm-env`)
- ✅ **NotebookLM service created** (`dppm-service/src/notebooklm-service.ts`)
- ✅ **API routes created** (`dppm-service/src/notebooklm-routes.ts`)

---

## 🚀 Quick Setup (5 Minutes)

### **Step 1: Initialize NotebookLM** (One-Time)

```bash
# Activate Python environment
source /home/ubuntu/notebooklm-env/bin/activate

# Initialize with your NotebookLM URL
# Replace YOUR_NOTEBOOK_ID with your actual notebook ID from NotebookLM
notebooklm-mcp init https://notebooklm.google.com/notebook/YOUR_NOTEBOOK_ID
```

**What this does:**
1. Creates `notebooklm-config.json` with your settings
2. Creates `chrome_profile_notebooklm/` folder for persistent auth
3. Opens Chrome browser for one-time Google login
4. Saves your session for future headless operation

**Where to find your Notebook ID:**
1. Go to https://notebooklm.google.com
2. Open or create a notebook
3. Copy the ID from the URL: `https://notebooklm.google.com/notebook/YOUR_NOTEBOOK_ID`

---

### **Step 2: Test the MCP Server**

```bash
# Test that it works
notebooklm-mcp --config notebooklm-config.json chat --message "Hello, who are you?"
```

**Expected output:**
```
I'm your NotebookLM AI assistant...
```

---

### **Step 3: Start the Server**

```bash
# Start in STDIO mode (for MCP clients)
notebooklm-mcp --config notebooklm-config.json server

# OR start in HTTP mode (for testing)
notebooklm-mcp --config notebooklm-config.json server --transport http --port 8001
```

---

## 📋 Integration with Morgus

### **Option A: Manual Start (For Testing)**

```bash
# Terminal 1: Start NotebookLM MCP server
cd /home/ubuntu/morgus-agent
source /home/ubuntu/notebooklm-env/bin/activate
notebooklm-mcp --config notebooklm-config.json server

# Terminal 2: Start DPPM service
cd /home/ubuntu/morgus-agent/dppm-service
npm start
```

### **Option B: Automatic Start (Production)**

The DPPM service can automatically start/stop the NotebookLM MCP server via the TypeScript service wrapper.

**Add to `dppm-service/src/index.ts`:**

```typescript
import notebookLMRoutes from './notebooklm-routes';
import { startNotebookLM } from './notebooklm-service';

// Add routes
app.use('/api/notebooklm', notebookLMRoutes);

// Auto-start NotebookLM on server start
startNotebookLM({
  notebookId: process.env.NOTEBOOKLM_NOTEBOOK_ID,
  pythonEnvPath: '/home/ubuntu/notebooklm-env'
}).catch(err => {
  console.error('Failed to start NotebookLM:', err);
});
```

---

## 🎯 API Endpoints

### **1. Start NotebookLM Server**
```bash
POST /api/notebooklm/start
Content-Type: application/json

{
  "notebookId": "your-notebook-id",
  "headless": true
}
```

### **2. Chat with NotebookLM**
```bash
POST /api/notebooklm/chat
Content-Type: application/json

{
  "message": "What are the key concepts in AI agents?",
  "timeout": 30
}
```

### **3. Research a Topic**
```bash
POST /api/notebooklm/research
Content-Type: application/json

{
  "topic": "Model Context Protocol (MCP)",
  "sources": [
    "https://modelcontextprotocol.io/introduction",
    "https://github.com/modelcontextprotocol/servers"
  ]
}
```

### **4. Check Status**
```bash
GET /api/notebooklm/status
```

### **5. Stop Server**
```bash
POST /api/notebooklm/stop
```

---

## 🔧 Configuration

### **notebooklm-config.json**

```json
{
  "default_notebook_id": "your-notebook-id",
  "headless": true,
  "timeout": 30,
  "auth": {
    "profile_dir": "./chrome_profile_notebooklm"
  },
  "debug": false
}
```

### **Environment Variables**

Add to `.env`:
```bash
NOTEBOOKLM_NOTEBOOK_ID=your-default-notebook-id
NOTEBOOKLM_HEADLESS=true
NOTEBOOKLM_TIMEOUT=30
```

---

## 🎨 Usage Examples

### **Example 1: Research from Chat**

User: "Research Model Context Protocol for me"

Morgus:
1. Calls `/api/notebooklm/research`
2. Sends topic to NotebookLM
3. Gets comprehensive research
4. Returns formatted response

### **Example 2: Add Sources**

User: "Add this article to my notebook: https://example.com/article"

Morgus:
1. Calls `/api/notebooklm/chat`
2. Sends "Add source: https://example.com/article"
3. NotebookLM processes the article
4. Confirms addition

### **Example 3: Generate Study Guide**

User: "Create a study guide about AI agents"

Morgus:
1. Calls `/api/notebooklm/chat`
2. Sends "Generate a study guide about AI agents"
3. NotebookLM creates structured guide
4. Returns formatted study guide

---

## 🐛 Troubleshooting

### **"Server not ready" error**

```bash
# Restart the MCP server
pkill -f notebooklm-mcp
source /home/ubuntu/notebooklm-env/bin/activate
notebooklm-mcp --config notebooklm-config.json server
```

### **"Authentication failed" error**

```bash
# Re-initialize (will open browser for login)
source /home/ubuntu/notebooklm-env/bin/activate
notebooklm-mcp init https://notebooklm.google.com/notebook/YOUR_NOTEBOOK_ID
```

### **"Timeout" error**

Increase timeout in config:
```json
{
  "timeout": 60
}
```

Or in API call:
```json
{
  "message": "...",
  "timeout": 60
}
```

### **Chrome profile issues**

```bash
# Delete and recreate profile
rm -rf chrome_profile_notebooklm
notebooklm-mcp init https://notebooklm.google.com/notebook/YOUR_NOTEBOOK_ID
```

---

## 📊 Features Available

| Feature | Status | Description |
|---------|--------|-------------|
| **Chat with Notebook** | ✅ Ready | Send messages and get AI responses |
| **Add Sources** | ✅ Ready | Add URLs, PDFs, text to notebook |
| **Generate Study Guide** | ✅ Ready | Create structured study guides |
| **Generate FAQ** | ✅ Ready | Extract FAQs from sources |
| **Generate Timeline** | ✅ Ready | Create event timelines |
| **Audio Overview** | 🚧 Coming | Generate audio summaries |
| **Multiple Notebooks** | ✅ Ready | Switch between notebooks |
| **Export Content** | 🚧 Coming | Export notebook content |

---

## 🎯 Next Steps

1. **Initialize NotebookLM** with your notebook ID
2. **Test the MCP server** with a simple chat
3. **Integrate with DPPM service** (add routes to index.ts)
4. **Test from Morgus chat** (create a test conversation)
5. **Add to worker** (enable NotebookLM tool in orchestrator)

---

## 📚 Resources

- **NotebookLM MCP GitHub**: https://github.com/khengyun/notebooklm-mcp
- **FastMCP Documentation**: https://github.com/jlowin/fastmcp
- **Google NotebookLM**: https://notebooklm.google.com
- **MCP Specification**: https://modelcontextprotocol.io

---

## 🎉 Benefits

**For Users:**
- 🧠 AI-powered research assistant
- 📚 Structured knowledge management
- 🎓 Automatic study guide generation
- 💡 Intelligent Q&A from sources
- 🔍 Deep analysis of documents

**For Morgus:**
- 🚀 Unique differentiator (NotebookLM integration)
- 🎯 Enhanced research capabilities
- 📊 Better knowledge retention
- 🤖 More intelligent responses
- 🌟 Premium feature for paid users

---

**Ready to build the future of AI-powered research! 🚀**
