# Operational Readiness Checklist

This checklist ensures the custom Morgy creator economy is ready for use.

---

## ✅ Phase 1: Environment Setup

### Database (Supabase)
- [ ] Supabase project created
- [ ] `SUPABASE_URL` set in `.env`
- [ ] `SUPABASE_ANON_KEY` set in `.env`
- [ ] `SUPABASE_SERVICE_KEY` set in `.env`
- [ ] Migration file applied: `supabase/migrations/20250127_creator_economy.sql`
- [ ] Tables verified: `morgy_knowledge`, `marketplace_listings`, `mcp_exports`
- [ ] pgvector extension enabled
- [ ] RLS policies active

**Test**: Run `SELECT * FROM morgy_knowledge LIMIT 1;` in Supabase SQL editor

---

### API Keys (Required)
- [ ] `OPENAI_API_KEY` set (for DALL-E 3 avatars)
- [ ] `OPENROUTER_API_KEY` set (for DPPM)
- [ ] `GEMINI_API_KEY` set (for DPPM)
- [ ] `STRIPE_SECRET_KEY` set (for marketplace)
- [ ] `STRIPE_PUBLISHABLE_KEY` set (for marketplace)
- [ ] `STRIPE_WEBHOOK_SECRET` set (for payment confirmation)

**Test**: Run `node -e "console.log(process.env.OPENAI_API_KEY?.substring(0, 10))"`

---

### API Keys (Optional)
- [ ] `ANTHROPIC_API_KEY` set (optional, for Claude in DPPM)
- [ ] `REDDIT_CLIENT_ID` set (for Reddit posting)
- [ ] `REDDIT_CLIENT_SECRET` set (for Reddit posting)
- [ ] `GMAIL_CLIENT_ID` set (for email sending)
- [ ] `GMAIL_CLIENT_SECRET` set (for email sending)
- [ ] `YOUTUBE_API_KEY` set (for YouTube search)
- [ ] `DID_API_KEY` set (for video creation)
- [ ] `LUMA_API_KEY` set (for video creation)

---

## ✅ Phase 2: Backend Setup

### Dependencies
- [ ] `cd dppm-service && npm install` completed
- [ ] `multer` installed (for file uploads)
- [ ] No dependency errors

**Test**: Run `npm list multer` in dppm-service directory

---

### Routes Registered
- [ ] Marketplace routes: `/api/marketplace/*`
- [ ] MCP routes: `/api/mcp/*`
- [ ] Knowledge routes: `/api/knowledge/*`
- [ ] OAuth routes: `/api/oauth/*`
- [ ] Avatar routes: `/api/avatar/*`
- [ ] Name generator routes: `/api/names/*`

**Test**: Check `dppm-service/src/index.ts` lines 1537-1540

---

### Services Implemented
- [ ] `marketplace-service.ts` exists
- [ ] `mcp-export-service.ts` exists
- [ ] `knowledge-base-service.ts` exists
- [ ] `oauth-manager.ts` exists
- [ ] `morgy-service.ts` exists

**Test**: Run `ls dppm-service/src/*-service.ts`

---

### Backend Running
- [ ] `cd dppm-service && npm run dev` starts without errors
- [ ] Server listening on port 8080
- [ ] Health check responds: `curl http://localhost:8080/health`
- [ ] Version shows: `2.5.0-creator-economy`

**Test**: `curl http://localhost:8080/health | jq .version`

---

## ✅ Phase 3: Frontend Setup

### Dependencies
- [ ] `cd console && npm install` completed
- [ ] No dependency errors

---

### Components Built
- [ ] `MorgyCreatorWizard.tsx` exists
- [ ] `MorgyKnowledgeStuffer.tsx` exists
- [ ] `MorgyTemplateSelector.tsx` exists
- [ ] `MorgyPathSelector.tsx` exists
- [ ] `MarketplaceBrowse.tsx` exists
- [ ] `MCPExportWizard.tsx` exists

**Test**: Run `ls console/src/components/Morgy*.tsx`

---

### Pages Created
- [ ] `CreateMorgyPage.tsx` exists
- [ ] `MarketplacePage.tsx` exists

**Test**: Run `ls console/src/pages/*.tsx`

---

### API Client
- [ ] `api-client.ts` exists
- [ ] Knowledge API methods implemented
- [ ] Marketplace API methods implemented
- [ ] MCP API methods implemented
- [ ] Morgy API methods implemented

**Test**: Run `grep -c "export async function" console/src/lib/api-client.ts`

---

### Frontend Running
- [ ] `cd console && npm run dev` starts without errors
- [ ] Vite dev server on port 3000 (or 5173)
- [ ] No TypeScript errors
- [ ] Can access http://localhost:3000

**Test**: Open browser to http://localhost:3000

---

## ✅ Phase 4: Integration Testing

### Knowledge API
- [ ] Upload document: `POST /api/knowledge/upload`
- [ ] Scrape website: `POST /api/knowledge/scrape`
- [ ] Add text: `POST /api/knowledge/text`
- [ ] Get knowledge: `GET /api/knowledge/:morgyId`
- [ ] Test RAG: `POST /api/knowledge/test`
- [ ] Delete knowledge: `DELETE /api/knowledge/:id`

**Test**: See `test-api.sh` script below

---

### Marketplace API
- [ ] Create listing: `POST /api/marketplace/create`
- [ ] Browse listings: `GET /api/marketplace/browse`
- [ ] Get listing: `GET /api/marketplace/listing/:id`
- [ ] Purchase Morgy: `POST /api/marketplace/purchase`
- [ ] Get my listings: `GET /api/marketplace/my-listings`
- [ ] Get analytics: `GET /api/marketplace/analytics`

**Test**: See `test-api.sh` script below

---

### MCP API
- [ ] Export to MCP: `POST /api/mcp/export`
- [ ] Get config: `GET /api/mcp/config/:morgyId`
- [ ] Test MCP: `POST /api/mcp/test`
- [ ] Get tools: `GET /api/mcp/tools`

**Test**: See `test-api.sh` script below

---

## ✅ Phase 5: End-to-End Testing

### Scenario 1: Create & Use Personally
- [ ] Navigate to `/create-morgy`
- [ ] Complete Step 1: Basic Info
- [ ] Complete Step 2: Personality
- [ ] Complete Step 3: Avatar (DALL-E 3 generation works)
- [ ] Complete Step 4: Knowledge (upload, scrape, test)
- [ ] Complete Step 5: Templates (enable templates)
- [ ] Select "Use in Morgus" path
- [ ] Morgy created successfully
- [ ] Morgy appears in chat interface
- [ ] Can chat with Morgy
- [ ] Knowledge retrieval works

---

### Scenario 2: Create & Sell
- [ ] Create Morgy (steps 1-5)
- [ ] Select "Sell on Marketplace" path
- [ ] Configure pricing (e.g., $29/month)
- [ ] Listing created successfully
- [ ] Listing appears in `/marketplace`
- [ ] Can view listing details
- [ ] Purchase flow works (Stripe checkout)
- [ ] Morgy cloned to buyer account
- [ ] Creator analytics updated

---

### Scenario 3: Create & Export
- [ ] Create Morgy (steps 1-5)
- [ ] Select "Export via MCP" path
- [ ] Configure export options
- [ ] Export files generated
- [ ] Download config JSON
- [ ] Download macOS installer
- [ ] Download instructions
- [ ] (Optional) Test in Claude Desktop

---

### Scenario 4: All Paths
- [ ] Create Morgy (steps 1-5)
- [ ] Select all three paths
- [ ] Morgy usable in Morgus
- [ ] Morgy listed on marketplace
- [ ] MCP export available
- [ ] All three work simultaneously

---

## ✅ Phase 6: Production Readiness

### Security
- [ ] RLS policies tested
- [ ] API authentication working
- [ ] CORS configured correctly
- [ ] Environment variables not committed
- [ ] Stripe webhook signature verified
- [ ] Rate limiting configured (optional)

---

### Performance
- [ ] Avatar generation <30 seconds
- [ ] Knowledge upload <10 seconds
- [ ] Marketplace browse <2 seconds
- [ ] MCP export <30 seconds
- [ ] DPPM response <60 seconds

---

### Monitoring
- [ ] Error logging configured
- [ ] Analytics tracking setup
- [ ] Stripe webhook logs monitored
- [ ] Database query performance checked

---

### Documentation
- [ ] `CUSTOM_MORGY_CREATOR_SYSTEM.md` reviewed
- [ ] `TESTING_GUIDE.md` followed
- [ ] `SETUP_GUIDE.md` API keys obtained
- [ ] `DEPLOYMENT_GUIDE.md` deployment steps ready

---

## 🧪 Quick Test Script

Save as `test-api.sh` and run with `bash test-api.sh`:

```bash
#!/bin/bash

# Test API Endpoints
API_URL="http://localhost:8080"
USER_ID="test-user-123"

echo "🧪 Testing Morgus Creator Economy API"
echo "======================================"

# Health check
echo -e "\n1. Health Check"
curl -s "$API_URL/health" | jq .

# Test knowledge upload (requires file)
echo -e "\n2. Knowledge Upload (skipped - requires file)"

# Test knowledge text
echo -e "\n3. Add Text Knowledge"
curl -s -X POST "$API_URL/api/knowledge/text" \
  -H "Content-Type: application/json" \
  -H "x-user-id: $USER_ID" \
  -d '{
    "morgyId": "test-morgy-id",
    "title": "Test Knowledge",
    "content": "This is test knowledge content."
  }' | jq .

# Test marketplace browse
echo -e "\n4. Browse Marketplace"
curl -s "$API_URL/api/marketplace/browse" | jq .

# Test MCP tools
echo -e "\n5. Get MCP Tools"
curl -s "$API_URL/api/mcp/tools" \
  -H "x-user-id: $USER_ID" | jq .

echo -e "\n✅ API tests complete!"
```

---

## 📊 Success Criteria

### Minimum Viable Product (MVP)
- ✅ Users can create custom Morgys (5 steps)
- ✅ Users can upload knowledge (3 methods)
- ✅ Users can list Morgys for sale
- ✅ Users can purchase Morgys
- ✅ Users can export to MCP
- ✅ All API routes respond correctly
- ✅ Database operations work
- ✅ Frontend components render

### Full Launch Ready
- ✅ All MVP criteria met
- ✅ Stripe payments working end-to-end
- ✅ OAuth flows tested (Reddit, Gmail)
- ✅ Avatar generation working (DALL-E 3)
- ✅ Knowledge RAG working (pgvector)
- ✅ MCP export tested in Claude Desktop
- ✅ Performance benchmarks met
- ✅ Security audit passed
- ✅ Documentation complete

---

## 🚀 Launch Checklist

When all above items are checked:

- [ ] Run full test suite: `TESTING_GUIDE.md`
- [ ] Deploy backend to production
- [ ] Deploy frontend to production
- [ ] Run database migrations on production
- [ ] Configure production environment variables
- [ ] Test production deployment
- [ ] Monitor error logs
- [ ] Announce launch! 🎉

---

## 🆘 Common Issues

### "Cannot connect to database"
→ Check Supabase URL and keys in `.env`

### "Unauthorized" errors
→ Verify user is logged in and `x-user-id` header is set

### "Stripe webhook failed"
→ Use Stripe CLI for local testing: `stripe listen --forward-to localhost:8080/api/webhooks/stripe`

### "Avatar generation failed"
→ Check OpenAI API key and quota

### "Knowledge upload failed"
→ Check file size (<10MB) and multer configuration

---

## 📞 Support

- Documentation: See all `*.md` files in repo
- Issues: https://github.com/morgus/issues
- Help: https://help.manus.im
- Discord: https://discord.gg/morgus

**System is operational when all Phase 1-4 items are checked!** ✅
