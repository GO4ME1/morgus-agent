# Testing Guide: Custom Morgy Creator Economy

## 🎯 Complete Flow Testing

This guide walks through testing the entire custom Morgy creation system:
1. Create custom Morgy
2. Stuff with knowledge
3. Train with templates/workflows
4. Choose path(s): Use, Sell, Export

---

## ✅ Prerequisites

Before testing, ensure:

1. **Backend running**: `cd dppm-service && npm run dev`
2. **Frontend running**: `cd console && npm run dev`
3. **Database migrated**: Supabase migrations applied
4. **API keys set**: See `.env.example` for required keys
5. **User logged in**: Create account or use test user

---

## 🧪 Test Scenario 1: Create & Use Personally

**Goal**: Create a custom Morgy and use it in Morgus

### Step 1: Create Morgy
1. Navigate to `/create-morgy`
2. **Basic Info**:
   - Category: Business
   - Click "Generate Clever Pig Names"
   - Select or enter: "Professor Snoutsworth"
   - Description: "Expert business strategist specializing in startup growth"
3. **Personality**:
   - Energy: 7/10
   - Formality: 8/10
   - Humor: 5/10
   - Verbosity: 6/10
   - Emoji: 3/10
4. **Avatar**:
   - Base Color: Purple
   - Character Type: Business
   - Accessories: Glasses
   - Clothing: Suit
   - Vibe: Professional
   - Click "Generate Avatar" (wait 30s)
5. **Knowledge** (Step 4):
   - Upload: `test-docs/business-strategy.pdf`
   - Scrape: `https://example.com/startup-guide`
   - Paste: "Our company focuses on B2B SaaS..."
   - Verify: 3 items added, embeddings generated
6. **Templates** (Step 5):
   - Enable: `post_to_reddit`, `send_email`
   - Enable workflow: `bill_market_research`
   - Connect: Reddit, Gmail (OAuth flows)
7. Click "Create Morgy"

### Step 2: Choose Path - Use in Morgus
1. Path selector appears
2. Select: **"Use in Morgus"** (already selected by default)
3. Deselect: Sell, Export
4. Click "Complete Setup"

### Step 3: Test Usage
1. Navigate to `/chat`
2. Select "Professor Snoutsworth" from Morgy list
3. Test chat: "What's your expertise?"
4. Test knowledge: "What does our company focus on?"
5. Test template: "Post about startup growth to r/startups"
6. Verify: Response uses personality, retrieves knowledge, executes template

**Expected Results**:
- ✅ Morgy created successfully
- ✅ Knowledge searchable via RAG
- ✅ Templates executable
- ✅ Personality reflected in responses
- ✅ Available in chat interface

---

## 🧪 Test Scenario 2: Create & Sell on Marketplace

**Goal**: Create a Morgy and list it for sale

### Step 1: Create Morgy
Follow "Test Scenario 1: Step 1" but with:
- Name: "Marketing Maven"
- Category: Social Media
- Knowledge: Upload marketing playbooks, brand guidelines

### Step 2: Choose Path - Sell on Marketplace
1. Path selector appears
2. Select: **"Sell on Marketplace"**
3. Configure:
   - Pricing Model: Monthly
   - Price: $29/month
   - Visibility: Public
   - License:
     - ✅ Personal use
     - ✅ Commercial use
     - ❌ Resale
     - ✅ Modification
4. Click "Complete Setup"

### Step 3: Verify Listing
1. Navigate to `/marketplace`
2. Search for "Marketing Maven"
3. Verify listing appears with:
   - Correct price ($29/month)
   - Correct description
   - Tags visible
   - Stats: 0 purchases, 0 rating

### Step 4: Test Purchase Flow (as different user)
1. Log out and create new test user
2. Navigate to `/marketplace`
3. Find "Marketing Maven"
4. Click listing card
5. Click "Purchase" button
6. Verify Stripe checkout opens
7. Complete test payment (use Stripe test card: 4242 4242 4242 4242)
8. Verify redirect back to Morgus
9. Navigate to `/morgys`
10. Verify "Marketing Maven" appears in user's Morgy list

### Step 5: Verify Creator Analytics
1. Log back in as creator
2. Navigate to `/creator-dashboard`
3. Verify:
   - Total Sales: 1
   - Total Revenue: $20.30 (70% of $29)
   - "Marketing Maven" appears in top Morgys

**Expected Results**:
- ✅ Listing created successfully
- ✅ Appears in marketplace browse
- ✅ Purchase flow works
- ✅ Morgy cloned to buyer
- ✅ Creator receives 70% revenue
- ✅ Analytics updated

---

## 🧪 Test Scenario 3: Create & Export via MCP

**Goal**: Create a Morgy and export to Claude Desktop

### Step 1: Create Morgy
Follow "Test Scenario 1: Step 1" but with:
- Name: "Research Rabbit"
- Category: Research
- Knowledge: Upload academic papers, research methodologies

### Step 2: Choose Path - Export via MCP
1. Path selector appears
2. Select: **"Export via MCP"**
3. Configure:
   - ✅ Include Knowledge Base
   - ✅ Include Templates & Workflows
   - ✅ Generate Shareable Link
4. Click "Complete Setup"

### Step 3: MCP Export Wizard
1. **Step 1: Configure Export**
   - Options already selected
   - Click "Generate MCP Export"
2. **Step 2: Download Files**
   - Download: `claude_desktop_config.json`
   - Download: `install-macos.sh`
   - Download: `INSTRUCTIONS.md`
   - Copy: Shareable link
3. **Step 3: Install in Claude Desktop**
   - Follow instructions
   - Locate config directory
   - Edit `claude_desktop_config.json`
   - Restart Claude Desktop
4. **Step 4: Test**
   - Open Claude Desktop
   - Type: `@Research Rabbit help`
   - Verify: Morgy responds

### Step 4: Test in Claude Desktop
1. Chat: `@Research Rabbit What's your expertise?`
2. Knowledge: `@Research Rabbit Search your knowledge for methodology`
3. Verify: Personality and knowledge work

**Expected Results**:
- ✅ Export files generated
- ✅ Config file valid JSON
- ✅ Installer script works (macOS)
- ✅ Claude Desktop loads MCP server
- ✅ Morgy responds in Claude
- ✅ Knowledge base accessible
- ✅ Personality maintained

---

## 🧪 Test Scenario 4: All Three Paths!

**Goal**: Use personally, sell, AND export

### Step 1: Create Morgy
Follow "Test Scenario 1: Step 1" but with:
- Name: "Sales Superstar"
- Category: Business
- Knowledge: Upload sales scripts, objection handlers

### Step 2: Choose All Paths
1. Path selector appears
2. Select: **"Use in Morgus"** ✅
3. Select: **"Sell on Marketplace"** ✅
   - Price: $49 one-time
   - Visibility: Public
4. Select: **"Export via MCP"** ✅
   - Include knowledge: ✅
   - Include templates: ✅
   - Share with team: ✅
5. Click "Complete Setup"

### Step 3: Verify All Paths Work
1. **Personal Use**:
   - Navigate to `/chat`
   - Verify "Sales Superstar" available
   - Test chat and templates
2. **Marketplace**:
   - Navigate to `/marketplace`
   - Verify "Sales Superstar" listed
   - Test purchase flow (as different user)
3. **MCP Export**:
   - Download export files
   - Install in Claude Desktop
   - Test in Claude

**Expected Results**:
- ✅ Morgy usable in Morgus
- ✅ Morgy listed on marketplace
- ✅ Morgy exportable to Claude
- ✅ All three paths work simultaneously
- ✅ Creator earns revenue from sales
- ✅ Buyers can also export their purchased Morgy

---

## 🔍 Edge Cases to Test

### Knowledge Stuffing
- [ ] Upload large PDF (10MB)
- [ ] Scrape website with lots of content
- [ ] Paste very long text (100KB)
- [ ] Upload multiple files at once
- [ ] Test knowledge search with no results
- [ ] Test knowledge search with multiple matches

### Marketplace
- [ ] Free listing (no payment required)
- [ ] Purchase own listing (should fail)
- [ ] Purchase already-owned Morgy (should fail)
- [ ] Refund request
- [ ] Update listing price
- [ ] Delist Morgy

### MCP Export
- [ ] Export without knowledge
- [ ] Export without templates
- [ ] Export with shareable link disabled
- [ ] Import from shareable link (team member)
- [ ] Export same Morgy twice
- [ ] Test in Cursor IDE (not just Claude)

### Platform Integrations
- [ ] Reddit OAuth flow
- [ ] Gmail OAuth flow
- [ ] YouTube API connection
- [ ] D-ID video creation
- [ ] Luma AI video creation
- [ ] Token refresh after expiry

---

## 🐛 Known Issues & Limitations

### Current Limitations
1. **Platform integrations don't work in Claude Desktop** - This is expected. Only chat and knowledge base work in external MCP apps.
2. **Video creation limited to 50/month** - 20 D-ID + 30 Luma on free tiers
3. **Reddit posting requires approval** - Reddit API approval pending
4. **MCP export requires NPM** - Users need Node.js installed for Claude Desktop

### Workarounds
1. For platform integrations in Claude: Use Morgus web app instead
2. For video creation limits: Upgrade to paid tiers or use multiple accounts
3. For Reddit posting: Use manual posting until API approved
4. For MCP without NPM: Provide standalone binary (future enhancement)

---

## 📊 Success Metrics

After testing, verify:

### Creator Metrics
- [ ] Can create custom Morgy in <5 minutes
- [ ] Knowledge stuffing works for 3+ sources
- [ ] Templates/workflows selectable
- [ ] Avatar generation <30 seconds
- [ ] Personality reflected in responses

### Marketplace Metrics
- [ ] Listing creation <2 minutes
- [ ] Purchase flow <1 minute
- [ ] Morgy cloning <10 seconds
- [ ] Revenue share calculated correctly (70%)
- [ ] Analytics update in real-time

### MCP Export Metrics
- [ ] Export generation <30 seconds
- [ ] Config file valid JSON
- [ ] Claude Desktop setup <5 minutes
- [ ] Morgy responds in Claude
- [ ] Knowledge base works in Claude

---

## 🎉 Testing Complete!

If all scenarios pass, the custom Morgy creator economy is ready for launch! 🚀

**Next Steps**:
1. Deploy to production
2. Announce to users
3. Monitor analytics
4. Gather feedback
5. Iterate and improve

**Support**:
- Issues: https://github.com/morgus/issues
- Help: https://help.manus.im
- Discord: https://discord.gg/morgus
