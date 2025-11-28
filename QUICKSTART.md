# Morgus Agent - Quick Start Guide

## System Overview

The Morgus Autonomous Agent System is now deployed and ready to use! Here's what's been set up:

### ✅ Components Deployed

1. **Supabase Database** - PostgreSQL database with real-time capabilities
   - Project: `morgus-agent`
   - URL: `https://dnxqgphaisdxvdyeiwnh.supabase.co`
   - Tables: `tasks`, `task_steps`, `artifacts`

2. **E2B Sandbox Environment** - Secure code execution environment
   - API Key configured
   - Python code interpreter ready

3. **Orchestrator Backend** - FastAPI server with LLM integration
   - Located in: `/home/ubuntu/morgus-agent/orchestrator/`
   - Virtual environment created with all dependencies

4. **GitHub Repository** - All code pushed to GitHub
   - Repository: `https://github.com/GO4ME1/morgus-agent`

---

## Running the Orchestrator

### Option 1: Run Locally (Development)

```bash
cd /home/ubuntu/morgus-agent/orchestrator
source venv/bin/activate
python server.py
```

The API will be available at: `http://localhost:8000`

### Option 2: Run with Uvicorn (Production)

```bash
cd /home/ubuntu/morgus-agent/orchestrator
source venv/bin/activate
uvicorn server:app --host 0.0.0.0 --port 8000 --reload
```

---

## API Endpoints

Once the server is running, you can access:

- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health
- **Create Task**: POST http://localhost:8000/tasks
- **List Tasks**: GET http://localhost:8000/tasks
- **Execute Code**: POST http://localhost:8000/execute

### Example: Create a Task

```bash
curl -X POST http://localhost:8000/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Analyze Sales Data",
    "description": "Create a Python script to analyze Q4 sales data and generate a report",
    "user_id": "user123"
  }'
```

### Example: Execute Code

```bash
curl -X POST http://localhost:8000/execute \
  -H "Content-Type: application/json" \
  -d '{
    "task_id": "your-task-id",
    "code": "print(\"Hello from Morgus!\")\nresult = 2 + 2\nprint(f\"2 + 2 = {result}\")",
    "language": "python"
  }'
```

---

## Environment Variables

The `.env` file in `/home/ubuntu/morgus-agent/orchestrator/` contains:

```env
SUPABASE_URL=https://dnxqgphaisdxvdyeiwnh.supabase.co
SUPABASE_SERVICE_KEY=<configured>
E2B_API_KEY=<configured>
OPENAI_API_KEY=<needs to be set>
DEFAULT_MODEL=gpt-4-turbo-preview
FAST_MODEL=gpt-3.5-turbo
PORT=8000
HOST=0.0.0.0
```

**⚠️ Important**: You need to add your OpenAI API key (or compatible API key) to the `.env` file for LLM functionality.

---

## Next Steps

### 1. Add Your OpenAI API Key

Edit the `.env` file:
```bash
cd /home/ubuntu/morgus-agent/orchestrator
nano .env
```

Add your API key:
```
OPENAI_API_KEY=sk-your-actual-api-key-here
```

### 2. Test the System

Start the server and test with the examples above.

### 3. Deploy to Production

For production deployment, consider:

- **Orchestrator**: Deploy to a VPS (DigitalOcean, AWS, etc.) or serverless platform
- **Console**: Deploy the React app to Cloudflare Pages (already attempted, needs fixing)
- **Domain**: Point a custom domain to your deployment

### 4. Integrate with the Console

Once the console is deployed, update its environment variables to point to your orchestrator API endpoint.

---

## Architecture

```
┌─────────────────┐
│  React Console  │  (Cloudflare Pages - to be fixed)
│   (Frontend)    │
└────────┬────────┘
         │
         │ HTTP/WebSocket
         │
┌────────▼────────┐
│   FastAPI       │  (Orchestrator - Ready!)
│  Orchestrator   │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼──────┐
│ E2B   │ │Supabase │
│Sandbox│ │Database │
└───────┘ └─────────┘
```

---

## Troubleshooting

### Port Already in Use
```bash
# Find process using port 8000
lsof -i :8000
# Kill the process
kill -9 <PID>
```

### Database Connection Issues
- Check that SUPABASE_URL and SUPABASE_SERVICE_KEY are correct in `.env`
- Verify network connectivity to Supabase

### E2B Sandbox Issues
- Verify E2B_API_KEY is set correctly
- Check E2B dashboard for usage limits: https://e2b.dev/dashboard

---

## Support & Documentation

- **Full Documentation**: See `/docs/` directory
- **Architecture Guide**: `/docs/architecture.md`
- **Installation Guide**: `/docs/installation.md`
- **Cloudflare Setup**: `/docs/cloudflare-setup.md`

---

## Credentials File

All credentials are stored in: `/home/ubuntu/morgus-credentials.txt`

**⚠️ Keep this file secure and never commit it to git!**
