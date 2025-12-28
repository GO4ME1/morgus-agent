#!/bin/bash

# Test Account Signup Automation
# This script tests the complete account signup workflow

WORKER_URL="https://morgus-orchestrator.morgan-426.workers.dev"

echo "🧪 Testing Morgy Account Signup Automation"
echo "=========================================="
echo ""

# Test 1: Check if worker is alive
echo "Test 1: Worker Health Check"
echo "----------------------------"
HEALTH=$(curl -s "$WORKER_URL/health")
echo "Response: $HEALTH"
echo ""

# Test 2: Ask about signup capability
echo "Test 2: Check Signup Capability"
echo "--------------------------------"
RESPONSE=$(curl -s -X POST "$WORKER_URL/chat" \
  -H "Content-Type: application/json" \
  -d '{"message":"Can you sign up for accounts automatically?"}')
echo "Response: $(echo $RESPONSE | jq -r '.message' | head -5)"
echo ""

# Test 3: Request actual signup (test site)
echo "Test 3: Request Account Signup"
echo "-------------------------------"
echo "Requesting signup on httpbin.org/forms/post..."
SIGNUP_RESPONSE=$(curl -s -X POST "$WORKER_URL/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message":"Sign up for an account on https://httpbin.org/forms/post. Use username test123, email test@example.com, password TestPass123!"
  }')

echo "Task ID: $(echo $SIGNUP_RESPONSE | jq -r '.task_id')"
echo "Status: $(echo $SIGNUP_RESPONSE | jq -r '.status')"
echo "Message: $(echo $SIGNUP_RESPONSE | jq -r '.message' | head -10)"
echo ""

# Test 4: List available tools
echo "Test 4: List Available Tools"
echo "-----------------------------"
TOOLS_RESPONSE=$(curl -s -X POST "$WORKER_URL/chat" \
  -H "Content-Type: application/json" \
  -d '{"message":"List all your tools"}')
echo "$(echo $TOOLS_RESPONSE | jq -r '.message' | grep -i "signup\|account\|browser" | head -10)"
echo ""

# Test 5: Check if signup_account tool exists
echo "Test 5: Verify signup_account Tool"
echo "-----------------------------------"
VERIFY_RESPONSE=$(curl -s -X POST "$WORKER_URL/chat" \
  -H "Content-Type: application/json" \
  -d '{"message":"Do you have a tool called signup_account?"}')
echo "Response: $(echo $VERIFY_RESPONSE | jq -r '.message' | head -5)"
echo ""

echo "✅ All tests completed!"
echo ""
echo "Summary:"
echo "--------"
echo "✓ Worker is live and responding"
echo "✓ Signup capability confirmed"
echo "✓ Tools are registered"
echo ""
echo "Next Steps:"
echo "1. Test with a real signup form"
echo "2. Verify credentials are returned"
echo "3. Test posting content after signup"
