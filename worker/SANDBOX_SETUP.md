# Sandbox Hardening - Quick Setup Guide

**Time Required:** ~10 minutes  
**Difficulty:** Easy

---

## Step 1: Verify Files (1 min)

Make sure these files exist in your `worker/src` directory:

```
worker/src/
├── sandbox/
│   ├── hardening.ts           ✅ Core hardening manager
│   └── monitoring-api.ts      ✅ Admin monitoring API
└── tools/
    └── execute-code-hardened.ts  ✅ Hardened execution tool
```

---

## Step 2: Update Tool Registry (2 min)

Edit `worker/src/tools.ts`:

```typescript
// Add import at top
import { hardenedExecuteCodeTool } from './tools/execute-code-hardened';

// In ToolRegistry constructor, replace the old execute_code tool:
export class ToolRegistry {
  private tools: Map<string, any> = new Map();
  
  constructor() {
    // Replace this line:
    // this.tools.set('execute_code', new ExecuteCodeTool());
    
    // With this:
    this.tools.set('execute_code', hardenedExecuteCodeTool);
    
    // ... rest of your tools
  }
  
  // Update execute method to pass userId
  async execute(toolName: string, args: any, env: any, userId: string): Promise<string> {
    const tool = this.tools.get(toolName);
    if (!tool) {
      throw new Error(`Tool not found: ${toolName}`);
    }
    
    // Pass userId to tool
    return tool.execute(args, env, userId);
  }
}
```

---

## Step 3: Add Monitoring Routes (2 min)

Edit `worker/src/index.ts`:

```typescript
// Add import at top
import { handleSandboxMonitoring } from './sandbox/monitoring-api';

// In your fetch handler, add this route:
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    // Add sandbox monitoring routes
    if (url.pathname.startsWith('/api/sandbox')) {
      return handleSandboxMonitoring(request, env);
    }
    
    // ... rest of your routes
  }
};
```

---

## Step 4: Set Environment Variables (2 min)

Add to `wrangler.toml`:

```toml
[vars]
# Existing vars...
E2B_API_KEY = "your-e2b-api-key"

# Add admin token for monitoring API
ADMIN_API_TOKEN = "generate-a-secure-random-token"
```

To generate a secure admin token:

```bash
openssl rand -hex 32
```

---

## Step 5: Update Agent to Pass User ID (2 min)

Edit `worker/src/agent.ts`:

Find where tools are executed and make sure `userId` is passed:

```typescript
// In executeTask method, when calling tools:
const toolResult = await this.toolRegistry.execute(
  toolCall.name,
  toolCall.arguments,
  env,
  userId  // Make sure this is passed
);
```

If `userId` is not available in the agent, extract it from the request context or auth token.

---

## Step 6: Deploy (1 min)

```bash
cd worker
pnpm install
pnpm run build
wrangler deploy
```

---

## Step 7: Test (2 min)

### Test Basic Execution

```bash
curl -X POST https://your-worker.workers.dev/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "message": "Execute this Python code: print(\"Hello from hardened sandbox!\")"
  }'
```

### Test Monitoring API

```bash
# Get system metrics
curl https://your-worker.workers.dev/api/sandbox/metrics \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Expected response:
# {
#   "activeExecutions": 0,
#   "totalUsers": 0,
#   "utilizationPercent": 0
# }
```

### Test Timeout

```bash
curl -X POST https://your-worker.workers.dev/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "message": "Execute this Python code with 5 second timeout: import time; time.sleep(10); print(\"done\")"
  }'

# Should timeout after 5 seconds
```

### Test Concurrency Limit

```bash
# Start 6 long-running executions (limit is 5 per user)
for i in {1..6}; do
  curl -X POST https://your-worker.workers.dev/api/chat \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -d '{"message":"Execute: import time; time.sleep(30)"}' &
done

# The 6th one should be rejected with "User has 5 active sandboxes"
```

---

## Verification Checklist

- [ ] All files are in place
- [ ] Tool registry updated
- [ ] Monitoring routes added
- [ ] Environment variables set
- [ ] Agent passes userId
- [ ] Deployment successful
- [ ] Basic execution works
- [ ] Monitoring API accessible
- [ ] Timeout enforcement works
- [ ] Concurrency limits enforced

---

## Troubleshooting

### Build Errors

If you get TypeScript errors:

```bash
cd worker
pnpm install
pnpm run build
```

### Runtime Errors

Check the logs:

```bash
wrangler tail
```

### Monitoring Not Working

Make sure `ADMIN_API_TOKEN` is set and you're using the correct token in the `Authorization` header.

---

## Next Steps

1. **Configure limits** - Adjust limits in `sandbox/hardening.ts` based on your needs
2. **Monitor usage** - Use the monitoring API to track sandbox usage
3. **Set up alerts** - Create alerts for high utilization or errors
4. **Review logs** - Regularly check execution logs for issues

---

**You're done! The sandbox hardening system is now active and protecting your Morgus deployment.**
