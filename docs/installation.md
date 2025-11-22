# Morgus Installation Guide

This guide will walk you through setting up the Morgus Autonomous Agent System.

## Prerequisites

- Ubuntu 22.04 server (or DigitalOcean droplet)
- Docker and Docker Compose installed
- Cloudflare account with Pages access
- Supabase project
- OpenAI API key
- GitHub account (optional, for code storage)

## Step 1: Clone the Repository

```bash
git clone https://github.com/GO4ME1/morgus-agent.git
cd morgus-agent
```

## Step 2: Set Up Supabase Database

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Navigate to the SQL Editor
3. Run the schema from `database/schema.sql`
4. Note your project URL and service key from Settings > API

## Step 3: Configure Environment Variables

### Orchestrator (.env)

Create `/orchestrator/.env` from `.env.example`:

```bash
cp .env.example orchestrator/.env
```

Edit `orchestrator/.env` and fill in:

```env
# OpenAI
OPENAI_API_KEY=sk-...

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
SUPABASE_ANON_KEY=eyJ...

# Cloudflare
CLOUDFLARE_API_TOKEN=...
CLOUDFLARE_ACCOUNT_ID=...

# Optional: Search APIs
BING_SEARCH_API_KEY=...
```

### Console (.env)

Create `console/.env` from `console/.env.example`:

```bash
cp console/.env.example console/.env
```

Edit `console/.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

## Step 4: Build Docker Sandbox Image

```bash
cd docker
docker build -t morgus-sandbox:latest .
```

This creates the isolated sandbox environment for code execution.

## Step 5: Install Orchestrator Dependencies

```bash
cd ../orchestrator
pip3 install -r requirements.txt
```

## Step 6: Start the Orchestrator Service

### Option A: Run Directly

```bash
python3 main.py
```

### Option B: Run as Systemd Service

Create `/etc/systemd/system/morgus-orchestrator.service`:

```ini
[Unit]
Description=Morgus Orchestrator Service
After=network.target docker.service
Requires=docker.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/morgus-agent/orchestrator
Environment="PATH=/usr/local/bin:/usr/bin:/bin"
ExecStart=/usr/bin/python3 main.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable morgus-orchestrator
sudo systemctl start morgus-orchestrator
sudo systemctl status morgus-orchestrator
```

## Step 7: Build and Deploy Console

### Build Console

```bash
cd ../console
pnpm install
pnpm build
```

### Deploy to Cloudflare Pages

#### Option A: Via Wrangler CLI

```bash
npx wrangler pages publish dist --project-name=morgus-console
```

#### Option B: Via Cloudflare Dashboard

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to Pages
3. Create a new project
4. Connect to your GitHub repository
5. Set build settings:
   - Build command: `pnpm build`
   - Build output directory: `dist`
   - Environment variables: Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

## Step 8: Configure Cloudflare API Token

The orchestrator needs a Cloudflare API token to deploy projects.

1. Go to Cloudflare Dashboard > My Profile > API Tokens
2. Create Token > Create Custom Token
3. Permissions:
   - Account > Cloudflare Pages > Edit
4. Copy the token and add to `orchestrator/.env` as `CLOUDFLARE_API_TOKEN`

## Step 9: Test the System

1. Open the Morgus Console in your browser (Cloudflare Pages URL)
2. Click "New Task"
3. Create a simple test task (e.g., "Create a hello world HTML page")
4. Monitor the task progress in real-time

## Troubleshooting

### Orchestrator won't start

- Check Docker is running: `sudo systemctl status docker`
- Verify environment variables are set correctly
- Check logs: `sudo journalctl -u morgus-orchestrator -f`

### Sandbox container fails

- Ensure Docker image is built: `docker images | grep morgus-sandbox`
- Check Docker permissions: `sudo usermod -aG docker $USER`
- Rebuild image: `cd docker && docker build -t morgus-sandbox:latest .`

### Console can't connect to Supabase

- Verify Supabase URL and anon key in console/.env
- Check Supabase project is active
- Verify RLS policies are configured (see schema.sql)

### Deployment fails

- Verify Cloudflare API token has correct permissions
- Check CLOUDFLARE_ACCOUNT_ID is correct
- Ensure wrangler is installed in sandbox: `docker exec <container> which wrangler`

## Security Considerations

- Never commit `.env` files to version control
- Use strong, unique API keys
- Restrict Cloudflare API token to minimum required permissions
- Enable Supabase Row Level Security (RLS)
- Regularly update dependencies

## Updating Morgus

```bash
cd morgus-agent
git pull
cd orchestrator && pip3 install -r requirements.txt
cd ../console && pnpm install && pnpm build
sudo systemctl restart morgus-orchestrator
```

## Support

For issues or questions, please open an issue on GitHub or contact support at help@go4me.ai.
