#!/bin/bash

# Morgy System Setup Script
# This script sets up the complete Morgy system

set -e  # Exit on error

echo "🚀 Morgy System Setup"
echo "===================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if running in correct directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: Must run from morgus-agent directory${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 1: Checking environment variables...${NC}"
if [ ! -f "dppm-service/.env" ]; then
    echo -e "${RED}Error: dppm-service/.env not found${NC}"
    echo "Please create dppm-service/.env with required variables:"
    echo "  SUPABASE_URL"
    echo "  SUPABASE_SERVICE_ROLE_KEY"
    echo "  OPENAI_API_KEY"
    echo "  GEMINI_API_KEY"
    exit 1
fi
echo -e "${GREEN}✓ Environment file found${NC}"
echo ""

echo -e "${YELLOW}Step 2: Installing dependencies...${NC}"
cd dppm-service
npm install multer @types/multer
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

echo -e "${YELLOW}Step 3: Building backend...${NC}"
npm run build
echo -e "${GREEN}✓ Backend built${NC}"
echo ""

echo -e "${YELLOW}Step 4: Applying database migration...${NC}"
cd ..
if command -v supabase &> /dev/null; then
    echo "Using Supabase CLI..."
    supabase db push
    echo -e "${GREEN}✓ Migration applied via CLI${NC}"
else
    echo -e "${YELLOW}Supabase CLI not found. Please apply migration manually:${NC}"
    echo "  1. Go to your Supabase project dashboard"
    echo "  2. Navigate to SQL Editor"
    echo "  3. Run the SQL from: supabase/migrations/20251227_morgy_system.sql"
    echo ""
    read -p "Press Enter when migration is applied..."
fi
echo ""

echo -e "${YELLOW}Step 5: Enabling pgvector extension...${NC}"
echo "Please run this SQL in your Supabase SQL Editor:"
echo ""
echo "CREATE EXTENSION IF NOT EXISTS vector;"
echo ""
echo "Then run the search_knowledge function from knowledge-base-service.ts"
echo ""
read -p "Press Enter when pgvector is enabled..."
echo -e "${GREEN}✓ pgvector enabled${NC}"
echo ""

echo -e "${YELLOW}Step 6: Starting backend service...${NC}"
cd dppm-service
npm run dev &
BACKEND_PID=$!
echo -e "${GREEN}✓ Backend started (PID: $BACKEND_PID)${NC}"
echo ""

# Wait for backend to be ready
echo "Waiting for backend to be ready..."
sleep 5

echo -e "${YELLOW}Step 7: Initializing starter Morgys...${NC}"
echo "Please provide your Supabase user ID:"
read -p "User ID: " USER_ID

if [ -z "$USER_ID" ]; then
    echo -e "${RED}Error: User ID is required${NC}"
    kill $BACKEND_PID
    exit 1
fi

echo "Initializing starter Morgys..."
RESPONSE=$(curl -s -X POST http://localhost:8080/api/admin/init-starters \
  -H "x-user-id: $USER_ID")

if echo "$RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✓ Starter Morgys initialized${NC}"
else
    echo -e "${RED}Error initializing starter Morgys:${NC}"
    echo "$RESPONSE"
fi
echo ""

echo -e "${YELLOW}Step 8: Running tests...${NC}"
echo "Testing chat endpoint..."
BILL_ID=$(curl -s http://localhost:8080/api/morgys/starters | jq -r '.[0].id')

if [ -z "$BILL_ID" ] || [ "$BILL_ID" = "null" ]; then
    echo -e "${RED}Error: Could not get Bill's ID${NC}"
else
    echo "Testing chat with Bill..."
    CHAT_RESPONSE=$(curl -s -X POST http://localhost:8080/api/morgys/$BILL_ID/chat \
      -H "Content-Type: application/json" \
      -H "x-user-id: $USER_ID" \
      -d '{"message":"Hello!","history":[],"mode":"auto"}')
    
    if echo "$CHAT_RESPONSE" | grep -q "response"; then
        echo -e "${GREEN}✓ Chat test passed${NC}"
    else
        echo -e "${RED}Chat test failed:${NC}"
        echo "$CHAT_RESPONSE"
    fi
fi
echo ""

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🎉 Morgy System Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Backend is running on http://localhost:8080"
echo ""
echo "Next steps:"
echo "  1. Test the API endpoints (see MORGY_TESTING_DEPLOYMENT_GUIDE.md)"
echo "  2. Start the frontend: cd console && npm start"
echo "  3. Visit http://localhost:3000/morgys"
echo ""
echo "To stop the backend: kill $BACKEND_PID"
echo ""
