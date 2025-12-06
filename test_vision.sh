#!/bin/bash

# Read base64 image
BASE64_DATA=$(cat test_cat_base64.txt)

# Create data URL
DATA_URL="data:image/jpeg;base64,$BASE64_DATA"

# Test the MOE endpoint with vision
curl -X POST https://morgus-orchestrator.morgan-426.workers.dev/moe-chat \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"What do you see in this image? Describe it in detail.\",
    \"files\": [\"$DATA_URL\"]
  }" | jq -r '.message'
