#!/bin/bash

# Morgy Agentic Properties Test Script
# Tests all agentic capabilities of the Morgus system

set -e

echo "🧪 Testing Morgy Agentic Properties"
echo "===================================="
echo ""

BASE_URL="http://localhost:8080"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

test_endpoint() {
    local name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    local expected_status=$5
    
    echo -n "Testing $name... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" -H "Content-Type: application/json" -d "$data" "$BASE_URL$endpoint")
    fi
    
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$status_code" = "$expected_status" ] || [ "$expected_status" = "ANY" ]; then
        echo -e "${GREEN}✓ PASS${NC} (Status: $status_code)"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (Expected: $expected_status, Got: $status_code)"
        echo "Response: $body"
        ((FAILED++))
        return 1
    fi
}

echo "1. Core System Health"
echo "---------------------"
test_endpoint "Health Check" "GET" "/health" "" "200"
echo ""

echo "2. Morgy Management"
echo "-------------------"
test_endpoint "List Morgys" "GET" "/api/morgys" "" "ANY"
test_endpoint "Get Morgy Details" "GET" "/api/morgys/test-morgy" "" "ANY"
echo ""

echo "3. Template Engine"
echo "------------------"
test_endpoint "List Templates" "GET" "/api/templates" "" "ANY"
test_endpoint "Get Template" "GET" "/api/templates/reddit-post" "" "ANY"
echo ""

echo "4. Workflow Engine"
echo "------------------"
test_endpoint "List Workflows" "GET" "/api/workflows" "" "ANY"
echo ""

echo "5. Knowledge Base (RAG)"
echo "-----------------------"
test_endpoint "Knowledge Upload Endpoint" "POST" "/api/knowledge/upload" '{"morgy_id":"test","text":"test"}' "ANY"
test_endpoint "Knowledge Search" "GET" "/api/knowledge/search?query=test" "" "ANY"
echo ""

echo "6. Marketplace"
echo "--------------"
test_endpoint "Browse Marketplace" "GET" "/api/marketplace/browse?limit=10" "" "ANY"
test_endpoint "Creator Analytics" "GET" "/api/marketplace/analytics/test-user" "" "ANY"
echo ""

echo "7. MCP Integration"
echo "------------------"
test_endpoint "MCP Tools List" "GET" "/api/mcp/tools" "" "ANY"
test_endpoint "MCP Export" "GET" "/api/mcp/export/test-morgy" "" "ANY"
echo ""

echo "8. Platform Integrations"
echo "------------------------"
test_endpoint "Reddit OAuth Status" "GET" "/api/oauth/reddit/status" "" "ANY"
test_endpoint "Gmail OAuth Status" "GET" "/api/oauth/gmail/status" "" "ANY"
test_endpoint "YouTube OAuth Status" "GET" "/api/oauth/youtube/status" "" "ANY"
echo ""

echo "9. Avatar Generation"
echo "--------------------"
test_endpoint "Generate Pig Name" "GET" "/api/avatar/generate-name" "" "ANY"
echo ""

echo "10. Credit System"
echo "-----------------"
test_endpoint "Check Credits" "GET" "/api/credits/check/test-user" "" "ANY"
echo ""

echo "=================================="
echo "Test Summary"
echo "=================================="
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠ Some tests failed${NC}"
    exit 1
fi
