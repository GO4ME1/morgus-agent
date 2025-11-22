#!/bin/bash
set -e

echo "======================================"
echo "Morgus Agent System Setup"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
   echo -e "${RED}Please do not run as root${NC}"
   exit 1
fi

# Check prerequisites
echo "Checking prerequisites..."

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed. Please install Docker first.${NC}"
    echo "Visit: https://docs.docker.com/engine/install/ubuntu/"
    exit 1
fi
echo -e "${GREEN}✓ Docker found${NC}"

# Check Python
if ! command -v python3.11 &> /dev/null; then
    echo -e "${YELLOW}Python 3.11 not found. Installing...${NC}"
    sudo apt update
    sudo apt install -y python3.11 python3.11-venv python3-pip
fi
echo -e "${GREEN}✓ Python 3.11 found${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Node.js not found. Installing...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
fi
echo -e "${GREEN}✓ Node.js found${NC}"

# Check pnpm
if ! command -v pnpm &> /dev/null; then
    echo -e "${YELLOW}pnpm not found. Installing...${NC}"
    npm install -g pnpm
fi
echo -e "${GREEN}✓ pnpm found${NC}"

echo ""
echo "======================================"
echo "Step 1: Environment Configuration"
echo "======================================"
echo ""

# Check if .env exists
if [ ! -f "orchestrator/.env" ]; then
    echo "Creating orchestrator/.env from template..."
    cp .env.example orchestrator/.env
    echo -e "${YELLOW}Please edit orchestrator/.env with your API keys:${NC}"
    echo "  - OPENAI_API_KEY"
    echo "  - SUPABASE_URL"
    echo "  - SUPABASE_SERVICE_KEY"
    echo "  - CLOUDFLARE_API_TOKEN"
    echo "  - CLOUDFLARE_ACCOUNT_ID"
    echo ""
    read -p "Press Enter when you've configured orchestrator/.env..."
fi

if [ ! -f "console/.env" ]; then
    echo "Creating console/.env from template..."
    cp console/.env.example console/.env
    echo -e "${YELLOW}Please edit console/.env with your Supabase credentials:${NC}"
    echo "  - VITE_SUPABASE_URL"
    echo "  - VITE_SUPABASE_ANON_KEY"
    echo ""
    read -p "Press Enter when you've configured console/.env..."
fi

echo ""
echo "======================================"
echo "Step 2: Building Docker Sandbox"
echo "======================================"
echo ""

cd docker
echo "Building morgus-sandbox:latest..."
docker build -t morgus-sandbox:latest .
echo -e "${GREEN}✓ Sandbox image built${NC}"
cd ..

echo ""
echo "======================================"
echo "Step 3: Installing Orchestrator"
echo "======================================"
echo ""

cd orchestrator
echo "Creating Python virtual environment..."
python3.11 -m venv venv
source venv/bin/activate
echo "Installing Python dependencies..."
pip install -r requirements.txt
deactivate
echo -e "${GREEN}✓ Orchestrator dependencies installed${NC}"
cd ..

echo ""
echo "======================================"
echo "Step 4: Building Console"
echo "======================================"
echo ""

cd console
echo "Installing console dependencies..."
pnpm install
echo "Building console..."
pnpm build
echo -e "${GREEN}✓ Console built${NC}"
cd ..

echo ""
echo "======================================"
echo "Step 5: Setting up Systemd Service"
echo "======================================"
echo ""

read -p "Do you want to install Morgus as a systemd service? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    SERVICE_FILE="/etc/systemd/system/morgus-orchestrator.service"
    
    sudo tee $SERVICE_FILE > /dev/null <<EOF
[Unit]
Description=Morgus Orchestrator Service
After=network.target docker.service
Requires=docker.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)/orchestrator
Environment="PATH=/usr/local/bin:/usr/bin:/bin"
ExecStart=$(pwd)/orchestrator/venv/bin/python main.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

    sudo systemctl daemon-reload
    sudo systemctl enable morgus-orchestrator
    
    echo -e "${GREEN}✓ Systemd service installed${NC}"
    echo ""
    echo "To start the service:"
    echo "  sudo systemctl start morgus-orchestrator"
    echo "To check status:"
    echo "  sudo systemctl status morgus-orchestrator"
    echo "To view logs:"
    echo "  sudo journalctl -u morgus-orchestrator -f"
fi

echo ""
echo "======================================"
echo "Step 6: Deploying Console"
echo "======================================"
echo ""

read -p "Do you want to deploy the console to Cloudflare Pages now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cd console
    
    # Check if wrangler is logged in
    if ! npx wrangler whoami &> /dev/null; then
        echo "Logging in to Cloudflare..."
        npx wrangler login
    fi
    
    read -p "Enter Cloudflare Pages project name (default: morgus-console): " PROJECT_NAME
    PROJECT_NAME=${PROJECT_NAME:-morgus-console}
    
    echo "Deploying to Cloudflare Pages..."
    npx wrangler pages publish dist --project-name=$PROJECT_NAME
    
    echo -e "${GREEN}✓ Console deployed${NC}"
    cd ..
fi

echo ""
echo "======================================"
echo "Setup Complete!"
echo "======================================"
echo ""
echo -e "${GREEN}Morgus has been successfully installed!${NC}"
echo ""
echo "Next steps:"
echo "1. Make sure your Supabase database schema is set up (database/schema.sql)"
echo "2. Start the orchestrator:"
echo "   ${YELLOW}cd orchestrator && source venv/bin/activate && python main.py${NC}"
echo "   Or if you installed the systemd service:"
echo "   ${YELLOW}sudo systemctl start morgus-orchestrator${NC}"
echo "3. Open your Cloudflare Pages URL to access the console"
echo "4. Create your first task!"
echo ""
echo "Documentation: https://github.com/GO4ME1/morgus-agent/tree/main/docs"
echo ""
