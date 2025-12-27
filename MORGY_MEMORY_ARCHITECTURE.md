# 🧠 Agentic Morgy Memory System Architecture

## Executive Summary

A comprehensive, scalable, and privacy-focused memory system that enables Morgys to remember conversations, learn user preferences, and provide contextual assistance over time. The system uses a three-tier architecture combining short-term memory (Redis), long-term memory (Supabase), and semantic search (pgvector embeddings).

---

## 🎯 Design Goals

### **Functional Requirements:**
- Remember conversations across sessions
- Learn user preferences and patterns
- Provide contextual suggestions
- Search memories semantically
- Consolidate and summarize over time

### **Non-Functional Requirements:**
- **Scalability:** Support millions of users
- **Privacy:** User data isolation, encryption
- **Performance:** <100ms memory retrieval
- **Cost:** <$0.01 per user per month
- **Reliability:** 99.9% uptime

---

## 🏗️ Three-Tier Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      USER INTERACTION                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    MEMORY ORCHESTRATOR                       │
│  - Routes queries to appropriate memory tier                 │
│  - Manages memory lifecycle                                  │
│  - Handles consolidation                                     │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
                ▼             ▼             ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│  SHORT-TERM      │ │   LONG-TERM      │ │   SEMANTIC       │
│  MEMORY          │ │   MEMORY         │ │   SEARCH         │
│                  │ │                  │ │                  │
│  Redis           │ │   Supabase       │ │   pgvector       │
│  (Fast, Temp)    │ │   (Persistent)   │ │   (Embeddings)   │
└──────────────────┘ └──────────────────┘ └──────────────────┘
```

---

## 1️⃣ Short-Term Memory (Redis)

### **Purpose:**
Store recent conversation context for fast retrieval during active sessions.

### **Technology:**
- **Redis** (in-memory key-value store)
- **TTL:** 24 hours (auto-expire)
- **Capacity:** Last 50 messages per user

### **Data Structure:**

```typescript
interface ShortTermMemory {
  userId: string;
  morgyId: string;
  sessionId: string;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
    metadata?: Record<string, any>;
  }>;
  context: {
    currentTopic?: string;
    userIntent?: string;
    pendingActions?: string[];
  };
  createdAt: number;
  expiresAt: number;
}
```

### **Redis Keys:**

```
stm:{userId}:{morgyId}:{sessionId}
stm:{userId}:{morgyId}:latest  // Pointer to latest session
```

### **Operations:**

```typescript
// Add message to short-term memory
async addToSTM(userId: string, morgyId: string, message: Message): Promise<void>

// Get recent messages
async getRecentMessages(userId: string, morgyId: string, count: number): Promise<Message[]>

// Get current context
async getCurrentContext(userId: string, morgyId: string): Promise<Context>

// Clear session (on logout or explicit request)
async clearSession(userId: string, morgyId: string, sessionId: string): Promise<void>
```

### **Performance:**
- **Read:** <5ms
- **Write:** <10ms
- **Cost:** $0.001 per user per month

---

## 2️⃣ Long-Term Memory (Supabase + PostgreSQL)

### **Purpose:**
Store persistent memories, user preferences, and historical interactions.

### **Technology:**
- **Supabase** (PostgreSQL with Row Level Security)
- **Retention:** Indefinite (user-controlled)
- **Capacity:** Unlimited

### **Database Schema:**

```sql
-- Memories table
CREATE TABLE morgy_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  morgy_id UUID NOT NULL,
  
  -- Memory content
  content TEXT NOT NULL,
  summary TEXT,
  
  -- Memory type
  memory_type VARCHAR(50) NOT NULL CHECK (memory_type IN (
    'conversation',
    'preference',
    'fact',
    'task',
    'event',
    'relationship'
  )),
  
  -- Importance scoring
  importance_score FLOAT DEFAULT 0.5 CHECK (importance_score BETWEEN 0 AND 1),
  access_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,
  
  -- Temporal info
  occurred_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  
  -- Semantic search (vector embedding)
  embedding VECTOR(1536),  -- OpenAI ada-002 dimension
  
  -- Privacy
  is_private BOOLEAN DEFAULT TRUE,
  shared_with UUID[] DEFAULT '{}',
  
  -- Lifecycle
  expires_at TIMESTAMPTZ,
  is_archived BOOLEAN DEFAULT FALSE
);

-- Indexes for performance
CREATE INDEX idx_memories_user_morgy ON morgy_memories(user_id, morgy_id);
CREATE INDEX idx_memories_type ON morgy_memories(memory_type);
CREATE INDEX idx_memories_importance ON morgy_memories(importance_score DESC);
CREATE INDEX idx_memories_occurred ON morgy_memories(occurred_at DESC);
CREATE INDEX idx_memories_tags ON morgy_memories USING GIN(tags);
CREATE INDEX idx_memories_embedding ON morgy_memories USING ivfflat(embedding vector_cosine_ops);

-- Memory consolidation log
CREATE TABLE morgy_memory_consolidations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  morgy_id UUID NOT NULL,
  
  -- Consolidation details
  source_memory_ids UUID[] NOT NULL,
  consolidated_memory_id UUID REFERENCES morgy_memories(id),
  consolidation_type VARCHAR(50) NOT NULL CHECK (consolidation_type IN (
    'merge',
    'summarize',
    'archive',
    'delete'
  )),
  
  -- Metadata
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User preferences table
CREATE TABLE morgy_user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  morgy_id UUID NOT NULL,
  
  -- Preference data
  preference_key VARCHAR(100) NOT NULL,
  preference_value JSONB NOT NULL,
  confidence_score FLOAT DEFAULT 0.5 CHECK (confidence_score BETWEEN 0 AND 1),
  
  -- Learning
  learned_from TEXT,  -- How was this preference learned?
  times_confirmed INTEGER DEFAULT 1,
  last_confirmed_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, morgy_id, preference_key)
);

-- Row Level Security
ALTER TABLE morgy_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE morgy_memory_consolidations ENABLE ROW LEVEL SECURITY;
ALTER TABLE morgy_user_preferences ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only access their own memories
CREATE POLICY "Users can view their own memories"
  ON morgy_memories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own memories"
  ON morgy_memories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own memories"
  ON morgy_memories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own memories"
  ON morgy_memories FOR DELETE
  USING (auth.uid() = user_id);
```

### **Memory Types:**

**1. Conversation Memories**
- Significant exchanges
- User questions and answers
- Decisions made
- Problems solved

**2. Preference Memories**
- Communication style preferences
- Tool preferences
- Topic interests
- Scheduling preferences

**3. Fact Memories**
- User-provided facts
- Verified information
- Personal details
- Professional info

**4. Task Memories**
- Completed tasks
- Ongoing projects
- Future goals
- Deadlines

**5. Event Memories**
- Important dates
- Milestones
- Achievements
- Failures (for learning)

**6. Relationship Memories**
- Connections between concepts
- User relationships
- Context links

### **Operations:**

```typescript
// Store long-term memory
async storeMemory(memory: MemoryInput): Promise<Memory>

// Retrieve memories by type
async getMemoriesByType(userId: string, morgyId: string, type: MemoryType): Promise<Memory[]>

// Update memory importance
async updateImportance(memoryId: string, score: number): Promise<void>

// Archive old memories
async archiveMemories(userId: string, morgyId: string, olderThan: Date): Promise<number>

// Get user preferences
async getPreferences(userId: string, morgyId: string): Promise<Preferences>

// Learn preference
async learnPreference(userId: string, morgyId: string, key: string, value: any): Promise<void>
```

### **Performance:**
- **Read:** <50ms
- **Write:** <100ms
- **Cost:** $0.005 per user per month

---

## 3️⃣ Semantic Search (pgvector + OpenAI Embeddings)

### **Purpose:**
Enable natural language search across memories using vector similarity.

### **Technology:**
- **pgvector** (PostgreSQL extension for vector similarity)
- **OpenAI text-embedding-ada-002** (1536 dimensions)
- **Similarity:** Cosine similarity

### **How It Works:**

```
User Query: "What did I say about my startup idea?"
     ↓
Generate Embedding (OpenAI ada-002)
     ↓
Vector: [0.123, -0.456, 0.789, ...]  (1536 dimensions)
     ↓
Search Memories (pgvector cosine similarity)
     ↓
Top 10 Most Similar Memories
     ↓
Re-rank by Importance + Recency
     ↓
Return Top 5 Results
```

### **Embedding Generation:**

```typescript
import OpenAI from 'openai';

async function generateEmbedding(text: string): Promise<number[]> {
  const openai = new OpenAI();
  
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: text,
  });
  
  return response.data[0].embedding;
}
```

### **Semantic Search Query:**

```sql
-- Find similar memories
SELECT
  id,
  content,
  summary,
  memory_type,
  importance_score,
  occurred_at,
  1 - (embedding <=> $1::vector) AS similarity
FROM morgy_memories
WHERE user_id = $2
  AND morgy_id = $3
  AND is_archived = FALSE
ORDER BY embedding <=> $1::vector
LIMIT 10;
```

### **Re-Ranking Algorithm:**

```typescript
function reRankMemories(memories: Memory[], query: string): Memory[] {
  return memories
    .map(memory => ({
      ...memory,
      score: calculateScore(memory, query),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

function calculateScore(memory: Memory, query: string): number {
  const similarityScore = memory.similarity; // From pgvector
  const importanceScore = memory.importance_score;
  const recencyScore = calculateRecencyScore(memory.occurred_at);
  const accessScore = Math.log(memory.access_count + 1) / 10;
  
  // Weighted combination
  return (
    similarityScore * 0.4 +
    importanceScore * 0.3 +
    recencyScore * 0.2 +
    accessScore * 0.1
  );
}

function calculateRecencyScore(occurredAt: Date): number {
  const now = Date.now();
  const ageInDays = (now - occurredAt.getTime()) / (1000 * 60 * 60 * 24);
  
  // Exponential decay: recent memories score higher
  return Math.exp(-ageInDays / 30); // Half-life of 30 days
}
```

### **Operations:**

```typescript
// Semantic search
async searchMemories(userId: string, morgyId: string, query: string): Promise<Memory[]>

// Find related memories
async findRelated(memoryId: string, limit: number): Promise<Memory[]>

// Cluster memories by topic
async clusterMemories(userId: string, morgyId: string): Promise<MemoryCluster[]>
```

### **Performance:**
- **Search:** <100ms (with ivfflat index)
- **Embedding:** <200ms (OpenAI API)
- **Cost:** $0.0001 per search (embedding cost)

---

## 🔄 Memory Lifecycle & Consolidation

### **Memory Consolidation Process:**

```
New Memory Created
     ↓
Store in Short-Term (Redis)
     ↓
[After 24 hours OR Session End]
     ↓
Evaluate Importance
     ↓
Important? ─YES→ Store in Long-Term (Supabase)
     │            Generate Embedding
     │            Index for Search
     │
     NO
     ↓
Discard (Expire from Redis)
```

### **Importance Scoring:**

```typescript
function calculateImportance(message: Message, context: Context): number {
  let score = 0.5; // Base score
  
  // User explicitly saved it
  if (message.metadata?.userSaved) {
    score += 0.3;
  }
  
  // Contains personal information
  if (containsPersonalInfo(message.content)) {
    score += 0.2;
  }
  
  // User asked a question
  if (message.role === 'user' && isQuestion(message.content)) {
    score += 0.1;
  }
  
  // Decision was made
  if (containsDecision(message.content)) {
    score += 0.15;
  }
  
  // Long message (more effort = more important)
  if (message.content.length > 500) {
    score += 0.05;
  }
  
  // Referenced previous conversation
  if (message.metadata?.referencesMemory) {
    score += 0.1;
  }
  
  return Math.min(score, 1.0);
}
```

### **Consolidation Strategies:**

**1. Merge Similar Memories**
```typescript
// If two memories are >90% similar, merge them
async mergeSimilarMemories(userId: string, morgyId: string): Promise<void> {
  const memories = await getRecentMemories(userId, morgyId, 100);
  
  for (let i = 0; i < memories.length; i++) {
    for (let j = i + 1; j < memories.length; j++) {
      const similarity = cosineSimilarity(memories[i].embedding, memories[j].embedding);
      
      if (similarity > 0.9) {
        await mergeMemories(memories[i], memories[j]);
      }
    }
  }
}
```

**2. Summarize Old Conversations**
```typescript
// After 30 days, summarize detailed conversations
async summarizeOldMemories(userId: string, morgyId: string): Promise<void> {
  const oldMemories = await getMemoriesOlderThan(userId, morgyId, 30);
  
  for (const memory of oldMemories) {
    if (memory.memory_type === 'conversation' && !memory.summary) {
      const summary = await generateSummary(memory.content);
      await updateMemory(memory.id, { summary });
    }
  }
}
```

**3. Archive Unused Memories**
```typescript
// After 90 days with no access, archive low-importance memories
async archiveUnusedMemories(userId: string, morgyId: string): Promise<void> {
  const cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  
  await supabase
    .from('morgy_memories')
    .update({ is_archived: true })
    .eq('user_id', userId)
    .eq('morgy_id', morgyId)
    .lt('importance_score', 0.3)
    .lt('last_accessed_at', cutoffDate.toISOString());
}
```

---

## 🔒 Privacy & Security

### **Data Isolation:**
- **Row Level Security (RLS):** Users can only access their own memories
- **Encryption at Rest:** All data encrypted in Supabase
- **Encryption in Transit:** TLS 1.3 for all connections

### **User Controls:**

```typescript
interface MemoryPrivacySettings {
  // Global settings
  enableMemory: boolean;
  retentionDays: number | null; // null = indefinite
  
  // Memory types
  allowConversationMemory: boolean;
  allowPreferenceMemory: boolean;
  allowFactMemory: boolean;
  
  // Sharing
  allowSharing: boolean;
  sharedWith: string[]; // User IDs
  
  // Deletion
  autoDeleteAfterDays: number | null;
}
```

### **GDPR Compliance:**

```typescript
// Right to Access
async exportUserMemories(userId: string): Promise<MemoryExport>

// Right to Erasure
async deleteAllUserMemories(userId: string): Promise<void>

// Right to Portability
async downloadUserData(userId: string): Promise<Blob>

// Right to Rectification
async updateMemory(memoryId: string, updates: Partial<Memory>): Promise<void>
```

---

## 📊 Scalability & Performance

### **Capacity Planning:**

| Users | Memories/User | Total Memories | Storage | Cost/Month |
|-------|---------------|----------------|---------|------------|
| 1K | 1,000 | 1M | 10 GB | $25 |
| 10K | 1,000 | 10M | 100 GB | $250 |
| 100K | 1,000 | 100M | 1 TB | $2,500 |
| 1M | 1,000 | 1B | 10 TB | $25,000 |

### **Optimization Strategies:**

**1. Sharding by User**
```sql
-- Partition memories by user_id hash
CREATE TABLE morgy_memories_0 PARTITION OF morgy_memories
  FOR VALUES WITH (MODULUS 10, REMAINDER 0);
  
CREATE TABLE morgy_memories_1 PARTITION OF morgy_memories
  FOR VALUES WITH (MODULUS 10, REMAINDER 1);
  
-- ... up to 10 partitions
```

**2. Caching Layer**
```typescript
// Cache frequently accessed memories in Redis
const cache = new Redis();

async function getMemory(memoryId: string): Promise<Memory> {
  // Check cache first
  const cached = await cache.get(`memory:${memoryId}`);
  if (cached) return JSON.parse(cached);
  
  // Fetch from database
  const memory = await supabase
    .from('morgy_memories')
    .select('*')
    .eq('id', memoryId)
    .single();
  
  // Cache for 1 hour
  await cache.setex(`memory:${memoryId}`, 3600, JSON.stringify(memory));
  
  return memory;
}
```

**3. Async Consolidation**
```typescript
// Run consolidation in background jobs
import { Queue } from 'bullmq';

const consolidationQueue = new Queue('memory-consolidation');

// Schedule daily consolidation
await consolidationQueue.add(
  'consolidate',
  { userId, morgyId },
  { repeat: { cron: '0 2 * * *' } } // 2 AM daily
);
```

---

## 🎯 API Interface

```typescript
class MemorySystem {
  // Short-term memory
  async addMessage(userId: string, morgyId: string, message: Message): Promise<void>
  async getRecentMessages(userId: string, morgyId: string, count: number): Promise<Message[]>
  async getCurrentContext(userId: string, morgyId: string): Promise<Context>
  
  // Long-term memory
  async storeMemory(memory: MemoryInput): Promise<Memory>
  async getMemory(memoryId: string): Promise<Memory>
  async updateMemory(memoryId: string, updates: Partial<Memory>): Promise<Memory>
  async deleteMemory(memoryId: string): Promise<void>
  
  // Semantic search
  async searchMemories(userId: string, morgyId: string, query: string): Promise<Memory[]>
  async findRelated(memoryId: string, limit: number): Promise<Memory[]>
  
  // Preferences
  async getPreferences(userId: string, morgyId: string): Promise<Preferences>
  async learnPreference(userId: string, morgyId: string, key: string, value: any): Promise<void>
  
  // Consolidation
  async consolidateMemories(userId: string, morgyId: string): Promise<ConsolidationReport>
  
  // Privacy
  async exportMemories(userId: string): Promise<MemoryExport>
  async deleteAllMemories(userId: string): Promise<void>
}
```

---

## 📈 Success Metrics

**Performance:**
- Short-term memory retrieval: <5ms
- Long-term memory retrieval: <50ms
- Semantic search: <100ms
- Memory consolidation: <1s

**Quality:**
- Search relevance: >80% user satisfaction
- Memory retention: >95% important memories saved
- Consolidation accuracy: >90% correct merges

**Cost:**
- Per-user cost: <$0.01/month
- Total infrastructure: <$25K/month at 1M users

---

## 🚀 Implementation Phases

### **Phase 1: MVP (Week 1-2)**
- ✅ Short-term memory (Redis)
- ✅ Long-term memory (Supabase)
- ✅ Basic CRUD operations
- ✅ RLS policies

### **Phase 2: Semantic Search (Week 3-4)**
- ✅ pgvector integration
- ✅ Embedding generation
- ✅ Similarity search
- ✅ Re-ranking algorithm

### **Phase 3: Consolidation (Week 5-6)**
- ✅ Importance scoring
- ✅ Memory merging
- ✅ Summarization
- ✅ Archival

### **Phase 4: Privacy & Scale (Week 7-8)**
- ✅ GDPR compliance
- ✅ User controls
- ✅ Sharding
- ✅ Caching

---

## 🎊 Summary

This memory system provides:

✅ **Fast Access** - <100ms retrieval  
✅ **Scalable** - Supports millions of users  
✅ **Private** - RLS, encryption, GDPR compliant  
✅ **Smart** - Semantic search, consolidation  
✅ **Cost-Effective** - <$0.01 per user per month  

**Ready to implement!** 🚀
