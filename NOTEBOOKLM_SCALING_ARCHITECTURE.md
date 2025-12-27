# 📈 NotebookLM Scaling Architecture

**Question:** Can it all happen through my 1 notebook?  
**Answer:** No - but we have a smart scaling strategy!

---

## 🎯 Scaling Strategy

### **Phase 1: Single Shared Notebook (Current - MVP)**

**Your Notebook:** `f3d3d717-6658-4d5b-9570-49c709a7d0fd`

**How It Works:**
- All Morgus users share ONE notebook (yours)
- Each user's content tagged with their user ID
- Sources organized by user
- Simple, works immediately

**Pros:**
- ✅ Works right now (no setup)
- ✅ Simple implementation
- ✅ No per-user notebook creation
- ✅ Centralized knowledge base

**Cons:**
- ❌ All content in one notebook (messy at scale)
- ❌ Privacy concerns (users see each other's sources)
- ❌ NotebookLM has limits (~50 sources per notebook)
- ❌ Slower as notebook grows

**When to Use:** MVP, testing, first 10-50 users

---

### **Phase 2: Per-User Notebooks (Recommended)**

**Architecture:**
```
User 1 → Notebook A (auto-created)
User 2 → Notebook B (auto-created)
User 3 → Notebook C (auto-created)
...
```

**How It Works:**
1. User signs up for Morgus
2. System auto-creates a NotebookLM notebook for them
3. Notebook ID stored in `user_profiles` table
4. All their research goes to their personal notebook

**Pros:**
- ✅ Complete privacy (each user has own notebook)
- ✅ No source limits (each notebook = 50 sources)
- ✅ Faster performance (smaller notebooks)
- ✅ User can access directly in NotebookLM
- ✅ Scalable to millions of users

**Cons:**
- ❌ Requires NotebookLM API (not available yet)
- ❌ More complex setup
- ❌ Need to manage notebook creation

**When to Use:** 50+ users, production launch

---

### **Phase 3: Hybrid Approach (Best of Both)**

**Architecture:**
```
User 1 → Personal Notebook + Shared Team Notebooks
User 2 → Personal Notebook + Shared Team Notebooks
User 3 → Personal Notebook + Shared Team Notebooks

Shared Notebooks:
- Morgus Knowledge Base (public)
- Team Workspaces (private groups)
- Project Notebooks (collaboration)
```

**How It Works:**
1. Each user gets personal notebook (private)
2. Users can create/join shared notebooks (teams, projects)
3. Morgus maintains public knowledge base (docs, guides)
4. Users choose which notebook to use per conversation

**Pros:**
- ✅ Privacy (personal notebooks)
- ✅ Collaboration (shared notebooks)
- ✅ Knowledge sharing (public base)
- ✅ Flexible and scalable
- ✅ Best user experience

**Cons:**
- ❌ Most complex to implement
- ❌ Requires full API integration
- ❌ Need permission management

**When to Use:** Mature product, 1000+ users, teams

---

## 🔢 Scaling Numbers

### **Single Notebook Limits:**
- **Max Sources:** ~50 (NotebookLM limit)
- **Max Users:** ~50-100 (before it gets messy)
- **Performance:** Degrades after 30+ sources

### **Per-User Notebooks:**
- **Max Users:** Unlimited (1 notebook per user)
- **Max Sources per User:** 50
- **Total System Capacity:** Users × 50 sources

### **Example Scaling:**
```
100 users × 50 sources = 5,000 total sources
1,000 users × 50 sources = 50,000 total sources
10,000 users × 50 sources = 500,000 total sources
```

---

## 🏗️ Implementation Roadmap

### **MVP (Now - Week 1):**
✅ Single shared notebook (yours)
- All users share `f3d3d717-6658-4d5b-9570-49c709a7d0fd`
- Tag sources with user IDs
- Simple, works immediately

### **Beta (Week 2-4):**
🚧 Per-user notebooks
- Auto-create notebook on signup
- Store notebook ID in database
- Update UI to show "Your Notebook"

### **Production (Month 2-3):**
🚧 Hybrid approach
- Personal + shared notebooks
- Team workspaces
- Public knowledge base
- Full collaboration features

---

## 💾 Database Schema

### **Add to `user_profiles` table:**

```sql
ALTER TABLE user_profiles
ADD COLUMN notebooklm_notebook_id TEXT,
ADD COLUMN notebooklm_created_at TIMESTAMP,
ADD COLUMN notebooklm_source_count INTEGER DEFAULT 0;
```

### **Create `notebooklm_notebooks` table:**

```sql
CREATE TABLE notebooklm_notebooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID REFERENCES auth.users(id),
  notebook_id TEXT NOT NULL, -- NotebookLM notebook ID
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL, -- 'personal', 'shared', 'public'
  source_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notebooklm_notebooks_owner ON notebooklm_notebooks(owner_user_id);
CREATE INDEX idx_notebooklm_notebooks_type ON notebooklm_notebooks(type);
```

### **Create `notebooklm_sources` table:**

```sql
CREATE TABLE notebooklm_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notebook_id UUID REFERENCES notebooklm_notebooks(id),
  user_id UUID REFERENCES auth.users(id),
  source_type TEXT NOT NULL, -- 'text', 'url', 'pdf', 'chat_message'
  title TEXT NOT NULL,
  content TEXT,
  url TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notebooklm_sources_notebook ON notebooklm_sources(notebook_id);
CREATE INDEX idx_notebooklm_sources_user ON notebooklm_sources(user_id);
```

---

## 🔐 Privacy & Security

### **Single Notebook (MVP):**
- ⚠️ All users share one notebook
- ⚠️ Potential to see each other's sources
- ✅ Mitigate: Tag sources with user IDs
- ✅ Mitigate: Filter in UI (don't show other users' sources)
- ✅ Mitigate: Use generic titles ("User Research #123")

### **Per-User Notebooks:**
- ✅ Complete privacy (each user = own notebook)
- ✅ No cross-user visibility
- ✅ User owns their data
- ✅ Can export/delete anytime

### **Shared Notebooks:**
- ✅ Explicit opt-in (user chooses to share)
- ✅ Permission levels (owner, editor, viewer)
- ✅ Audit trail (who added what)
- ✅ Can leave/delete anytime

---

## 🚀 Auto-Create Notebook Flow

### **When User Signs Up:**

```typescript
async function createUserNotebook(userId: string, userName: string) {
  // 1. Create notebook via NotebookLM API (when available)
  const notebookId = await notebookLMAPI.createNotebook({
    name: `${userName}'s Morgus Research`,
    description: 'Personal research notebook for Morgus'
  });

  // 2. Store in database
  await supabase.from('notebooklm_notebooks').insert({
    owner_user_id: userId,
    notebook_id: notebookId,
    name: `${userName}'s Research`,
    type: 'personal',
    source_count: 0
  });

  // 3. Update user profile
  await supabase.from('user_profiles').update({
    notebooklm_notebook_id: notebookId,
    notebooklm_created_at: new Date()
  }).eq('user_id', userId);

  return notebookId;
}
```

### **Fallback (No API):**

```typescript
async function createUserNotebookFallback(userId: string, userName: string) {
  // 1. Generate unique notebook ID (placeholder)
  const notebookId = `notebook-${userId}-${Date.now()}`;

  // 2. Store in database
  await supabase.from('notebooklm_notebooks').insert({
    owner_user_id: userId,
    notebook_id: notebookId,
    name: `${userName}'s Research`,
    type: 'personal',
    source_count: 0
  });

  // 3. Show instructions to user
  showNotification({
    title: 'Create Your Notebook',
    message: 'Please create a notebook at notebooklm.google.com and paste the ID',
    action: 'Open NotebookLM'
  });

  return notebookId;
}
```

---

## 📊 Monitoring & Limits

### **Track Usage:**

```sql
-- Sources per notebook
SELECT 
  notebook_id,
  COUNT(*) as source_count,
  MAX(created_at) as last_added
FROM notebooklm_sources
GROUP BY notebook_id
ORDER BY source_count DESC;

-- Users approaching limit
SELECT 
  u.email,
  n.name,
  n.source_count
FROM notebooklm_notebooks n
JOIN auth.users u ON u.id = n.owner_user_id
WHERE n.source_count >= 45 -- 90% of 50 limit
ORDER BY n.source_count DESC;

-- System-wide stats
SELECT 
  COUNT(DISTINCT notebook_id) as total_notebooks,
  COUNT(*) as total_sources,
  AVG(source_count) as avg_sources_per_notebook
FROM notebooklm_notebooks;
```

### **Alerts:**

```typescript
// Warn user when approaching limit
if (sourceCount >= 45) {
  showWarning({
    title: 'Notebook Almost Full',
    message: `You have ${sourceCount}/50 sources. Consider creating a new notebook.`,
    action: 'Create New Notebook'
  });
}

// Block when at limit
if (sourceCount >= 50) {
  throw new Error('Notebook is full. Please create a new notebook or delete old sources.');
}
```

---

## 🎯 Recommended Approach

### **For MVP (This Week):**
✅ **Use single shared notebook**
- Your notebook: `f3d3d717-6658-4d5b-9570-49c709a7d0fd`
- Tag sources with user IDs in title: `[User ${userId}] ${title}`
- Filter in UI to show only user's sources
- Monitor source count

### **For Beta (Next Month):**
🚧 **Transition to per-user notebooks**
- Add database tables
- Implement auto-create flow (manual fallback)
- Migrate existing users
- Update UI to show "Your Notebook"

### **For Production (3 Months):**
🚧 **Add shared notebooks**
- Team workspaces
- Public knowledge base
- Collaboration features
- Permission management

---

## 💡 Smart Optimizations

### **1. Lazy Notebook Creation**
Don't create notebook on signup - create when user first uses NotebookLM feature
- Saves API calls
- Only active users get notebooks

### **2. Notebook Rotation**
When user hits 50 sources, auto-create new notebook and archive old one
- User has multiple notebooks
- Organized by time period
- Can search across all

### **3. Shared Knowledge Base**
Maintain 1 public notebook with Morgus docs, guides, FAQs
- All users can pull from it
- Reduces duplicate sources
- Centralized knowledge

### **4. Smart Source Deduplication**
Before adding source, check if it already exists
- Compare URLs
- Compare content hashes
- Reuse existing sources

---

## 🎉 Summary

**Can it scale with 1 notebook?**
- ✅ Yes for MVP (50-100 users)
- ❌ No for production (need per-user notebooks)

**Best Architecture:**
- **Now:** Single shared notebook (simple, works)
- **Soon:** Per-user notebooks (scalable, private)
- **Future:** Hybrid (personal + shared + public)

**Database Changes Needed:**
- Add `notebooklm_notebook_id` to user profiles
- Create `notebooklm_notebooks` table
- Create `notebooklm_sources` table

**Implementation Priority:**
1. ✅ MVP with shared notebook (done!)
2. 🚧 Database schema (next)
3. 🚧 Per-user notebooks (when API available)
4. 🚧 Shared notebooks (later)

---

**Let's implement the database schema now, then continue with Agentic Morgys!** 🚀
