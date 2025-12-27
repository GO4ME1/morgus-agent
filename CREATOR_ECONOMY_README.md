# 🎨 Morgus Creator Economy

**Build, Sell, and Export Custom AI Agents**

The Morgus Creator Economy lets you create custom AI agents (Morgys), stuff them with knowledge, and choose how to use them: personally, sell on the marketplace, or export to other apps via MCP.

---

## 🚀 Features

### **1. Custom Morgy Creator** (5-Step Wizard)
- **Step 1: Basic Info** - Choose category, generate pig name, add description
- **Step 2: Personality** - Adjust 5 traits (energy, formality, humor, verbosity, emoji)
- **Step 3: Avatar** - Pick colors, generate DALL-E 3 avatar
- **Step 4: Knowledge** - Upload docs, scrape websites, paste text, test RAG
- **Step 5: Templates** - Enable workflows, connect platforms

### **2. Knowledge Stuffing**
- 📄 **Upload Documents** - PDF, Word, text files
- 🌐 **Scrape Websites** - Extract content from any URL
- ✍️ **Paste Text** - Add custom knowledge directly
- 🔍 **Test RAG** - Verify knowledge retrieval works
- 🧠 **Vector Search** - Semantic search with pgvector

### **3. Marketplace**
- 🏪 **Browse & Search** - Filter by category, tags, price
- 💰 **Sell Your Morgys** - List for free or paid
- 💵 **70% Revenue Share** - Industry-leading creator earnings
- ⭐ **Reviews & Ratings** - Build your reputation
- 📊 **Creator Analytics** - Track sales, revenue, ratings
- 🏆 **Tier System** - Bronze → Silver → Gold → Platinum

### **4. MCP Export**
- 📤 **Export to Claude Desktop** - One-click export
- 🔧 **Use in Cursor, Windsurf** - Any MCP-compatible app
- 🔗 **Share with Team** - Generate share links
- 📦 **Include Knowledge** - Export with custom knowledge
- ⚙️ **Config Generator** - Auto-generate MCP configs

### **5. Multiple Paths**
- ✅ **Use in Morgus** - Deploy as personal AI employee
- ✅ **Sell on Marketplace** - Earn passive income
- ✅ **Export via MCP** - Portable to any app
- ✅ **All of the Above!** - Use, sell, AND export!

---

## 📦 Tech Stack

### **Frontend**
- React + TypeScript
- Vite
- React Router
- TailwindCSS

### **Backend**
- Node.js + Express
- TypeScript
- Supabase (Postgres + Auth)
- pgvector (semantic search)

### **AI/ML**
- OpenAI (GPT-4, embeddings, DALL-E 3)
- RAG (Retrieval Augmented Generation)
- Vector similarity search

### **Payments**
- Stripe (marketplace transactions)
- 70% to creator, 30% to platform

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│          Frontend (React/TS)                │
│  - Creator Wizard                           │
│  - Marketplace Browse                       │
│  - Stats Dashboard                          │
│  - MCP Export Wizard                        │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│       Backend API (Express/TS)              │
│  - /api/marketplace/* (listings, purchase)  │
│  - /api/knowledge/* (upload, scrape, test)  │
│  - /api/mcp/* (export, config, share)       │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│      Database (Supabase/Postgres)           │
│  - morgy_knowledge (docs, embeddings)       │
│  - marketplace_listings (sales)             │
│  - mcp_exports (configs, shares)            │
│  - creator_analytics (stats)                │
└─────────────────────────────────────────────┘
```

---

## 🚀 Getting Started

### **1. Prerequisites**
- Node.js 18+
- Supabase account
- OpenAI API key
- Stripe account (for marketplace)

### **2. Setup**

```bash
# Clone the repo
git clone https://github.com/yourusername/morgus-agent.git
cd morgus-agent

# Install dependencies
cd dppm-service && npm install
cd ../console && npm install

# Set up environment variables
cp dppm-service/.env.example dppm-service/.env
# Edit .env with your API keys

# Run database migration
# (Use Supabase SQL Editor to run supabase/migrations/20250127_creator_economy.sql)

# Start backend
cd dppm-service && npm run dev

# Start frontend (in another terminal)
cd console && npm run dev
```

### **3. Access**
- Frontend: http://localhost:3000
- Backend: http://localhost:8080
- Creator: http://localhost:3000/create-morgy
- Marketplace: http://localhost:3000/marketplace

---

## 📊 Database Schema

### **morgy_knowledge**
```sql
- id (UUID)
- morgy_id (UUID, foreign key)
- title (TEXT)
- content (TEXT)
- source_type (TEXT: file, website, text, data_source)
- source_url (TEXT)
- chunks (INTEGER)
- metadata (JSONB)
- created_at, updated_at
```

### **marketplace_listings**
```sql
- id (UUID)
- morgy_id (UUID, foreign key)
- creator_id (UUID, foreign key)
- pricing_model (TEXT: free, one-time, monthly, annual)
- price (DECIMAL)
- visibility (TEXT: public, unlisted, private)
- views, purchases, rating, reviews (INTEGER)
- status (TEXT: active, paused, delisted)
- created_at, updated_at
```

### **mcp_exports**
```sql
- id (UUID)
- morgy_id (UUID, foreign key)
- user_id (UUID, foreign key)
- include_knowledge (BOOLEAN)
- include_templates (BOOLEAN)
- share_id (TEXT, unique)
- share_url (TEXT)
- downloads (INTEGER)
- created_at, expires_at
```

---

## 🎯 Key Endpoints

### **Marketplace API**
- `POST /api/marketplace/create` - Create listing
- `GET /api/marketplace/browse` - Browse listings
- `POST /api/marketplace/purchase` - Purchase Morgy
- `GET /api/marketplace/analytics` - Creator stats

### **Knowledge API**
- `POST /api/knowledge/upload` - Upload document
- `POST /api/knowledge/scrape` - Scrape website
- `POST /api/knowledge/text` - Add text knowledge
- `POST /api/knowledge/test` - Test RAG retrieval

### **MCP API**
- `POST /api/mcp/export` - Export to MCP
- `GET /api/mcp/config/:exportId` - Get config
- `POST /api/mcp/share` - Generate share link
- `GET /api/mcp/tools/:morgyId` - List MCP tools

---

## 💰 Revenue Model

### **Creator Earnings**
- **70%** of sale price goes to creator
- **30%** platform fee
- Monthly payouts via Stripe Connect

### **Pricing Tiers**
- **Free** - List for free, build reputation
- **One-time** - $5-$500 per purchase
- **Monthly** - $10-$100/month subscription
- **Annual** - $100-$1000/year subscription

### **Creator Tiers**
- **Bronze** (0-9 sales) - Standard features
- **Silver** (10-49 sales) - Priority support
- **Gold** (50-99 sales) - Featured listings
- **Platinum** (100+ sales) - Premium badge, top placement

---

## 📚 Documentation

- `CUSTOM_MORGY_CREATOR_SYSTEM.md` - Complete system design
- `TESTING_GUIDE.md` - Test scenarios
- `SETUP_GUIDE.md` - API key setup
- `OPERATIONAL_CHECKLIST.md` - Deployment checklist
- `SYSTEM_READY.md` - Current status

---

## 🤝 Contributing

We welcome contributions! Please:
1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📄 License

MIT License - see LICENSE file for details

---

## 🎉 What Makes This Special

1. **Zero Lock-In** - Export to Claude Desktop, Cursor, any MCP app
2. **Creator Economy** - 70% revenue share (industry-leading!)
3. **Knowledge-First** - Custom knowledge makes Morgys unique
4. **Multiple Paths** - Use personally, sell, export, or all three!
5. **Instant Success** - 5-minute setup with default templates

---

## 🚀 Roadmap

- [ ] Mobile app (React Native)
- [ ] More payment options (crypto, PayPal)
- [ ] Team collaboration features
- [ ] Advanced analytics dashboard
- [ ] Morgy marketplace categories
- [ ] Creator verification badges
- [ ] Affiliate program
- [ ] API for third-party integrations

---

## 📞 Support

- Email: support@morgus.ai
- Discord: https://discord.gg/morgus
- Twitter: @MorgusAI

---

**Built with ❤️ by the Morgus team**

🐷 **Create. Sell. Export. Repeat.** ✨
