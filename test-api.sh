#!/bin/bash

# Quick API Test Script
# Tests all creator economy endpoints

API_URL="http://localhost:8080"
USER_ID="test-user-123"

echo "🧪 Testing Morgus Creator Economy API"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test function
test_endpoint() {
  local name=$1
  local method=$2
  local endpoint=$3
  local data=$4
  
  echo -n "Testing $name... "
  
  if [ "$method" = "GET" ]; then
    response=$(curl -s -w "\n%{http_code}" "$API_URL$endpoint" -H "x-user-id: $USER_ID")
  else
    response=$(curl -s -w "\n%{http_code}" -X "$method" "$API_URL$endpoint" \
      -H "Content-Type: application/json" \
      -H "x-user-id: $USER_ID" \
      -d "$data")
  fi
  
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')
  
  if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
    echo -e "${GREEN}✓${NC} ($http_code)"
  else
    echo -e "${RED}✗${NC} ($http_code)"
    echo "  Response: $body"
  fi
}

# Health Check
echo "=== Core API ==="
test_endpoint "Health Check" "GET" "/health"
echo ""

# Knowledge API
echo "=== Knowledge API ==="
test_endpoint "Add Text Knowledge" "POST" "/api/knowledge/text" '{
  "morgyId": "test-morgy-id",
  "title": "Test Knowledge",
  "content": "This is test knowledge content for testing RAG."
}'

test_endpoint "Get Knowledge" "GET" "/api/knowledge/test-morgy-id"

test_endpoint "Test Knowledge RAG" "POST" "/api/knowledge/test" '{
  "morgyId": "test-morgy-id",
  "query": "test"
}'
echo ""

# Marketplace API
echo "=== Marketplace API ==="
test_endpoint "Browse Marketplace" "GET" "/api/marketplace/browse"

test_endpoint "Get My Listings" "GET" "/api/marketplace/my-listings"

test_endpoint "Get Creator Analytics" "GET" "/api/marketplace/analytics"
echo ""

# MCP API
echo "=== MCP API ==="
test_endpoint "Get MCP Tools" "GET" "/api/mcp/tools"

test_endpoint "Test MCP Connection" "POST" "/api/mcp/test" '{
  "morgyId": "test-morgy-id"
}'
echo ""

# OAuth API
echo "=== OAuth API ==="
test_endpoint "Get OAuth Status" "GET" "/api/oauth/status"
echo ""

# Avatar API
echo "=== Avatar API ==="
test_endpoint "Generate Pig Names" "POST" "/api/names/generate" '{
  "category": "business"
}'
echo ""

echo "======================================"
echo "✅ API tests complete!"
echo ""
echo "Note: Some tests may fail if:"
echo "  - Database is not migrated"
echo "  - API keys are not configured"
echo "  - Test data doesn't exist"
echo ""
echo "For full testing, see TESTING_GUIDE.md"
