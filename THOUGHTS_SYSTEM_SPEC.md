# 🧠 Morgus "Thoughts" System Specification

## Overview

The **Thoughts** system provides persistent, project-specific context for Morgus. Each "Thought" is like a dedicated workspace or mini-project with its own memory, tools, files, and conversation history.

**Inspired by**: Gemini Gems, but more powerful - each Thought is a complete project brain.

---

## Core Concept

A **Thought** = Persistent context container for a specific project, topic, or workflow

**Key Features**:
- Persistent conversation history (unlimited, not just last 10)
- Attached files and documents
- Custom instructions/personality
- Dedicated tools and resources
- Code snippets and artifacts
- Model preferences (GPT-4o-mini, Gemini, etc.)
- MoE settings

---

## Database Schema

### `thoughts` Table

```sql
CREATE TABLE thoughts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  system_prompt TEXT,  -- Custom instructions for this Thought
  model_preference VARCHAR(50) DEFAULT 'gpt-4o-mini',
  moe_enabled BOOLEAN DEFAULT false,
  moe_config JSONB,  -- MoE settings (models, voting method, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB  -- Custom user data
);

CREATE INDEX idx_thoughts_updated_at ON thoughts(updated_at DESC);
CREATE INDEX idx_thoughts_last_accessed ON thoughts(last_accessed_at DESC);
```

### `thought_messages` Table

```sql
CREATE TABLE thought_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thought_id UUID NOT NULL REFERENCES thoughts(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL,  -- 'user' | 'assistant' | 'system'
  content TEXT NOT NULL,
  attachments JSONB,  -- Array of file references
  metadata JSONB,  -- Tool calls, thinking process, etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_thought_messages_thought_id ON thought_messages(thought_id, created_at);
```

### `thought_files` Table

```sql
CREATE TABLE thought_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thought_id UUID NOT NULL REFERENCES thoughts(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  file_type VARCHAR(50),
  file_size INTEGER,
  storage_url TEXT NOT NULL,  -- Supabase Storage URL
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB
);

CREATE INDEX idx_thought_files_thought_id ON thought_files(thought_id);
```

### `thought_artifacts` Table

```sql
CREATE TABLE thought_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thought_id UUID NOT NULL REFERENCES thoughts(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,  -- 'code', 'document', 'image', 'data'
  title VARCHAR(255),
  content TEXT,
  language VARCHAR(50),  -- For code artifacts
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB
);

CREATE INDEX idx_thought_artifacts_thought_id ON thought_artifacts(thought_id);
```

---

## UI Design

### Sidebar Updates

```
┌─────────────────────────┐
│  M  Morgus              │
│  + New Chat             │
├─────────────────────────┤
│  💭 THOUGHTS            │
│  + New Thought          │
│                         │
│  📁 Project Alpha       │
│     Last: 2 hours ago   │
│                         │
│  📁 Research Notes      │
│     Last: 1 day ago     │
│                         │
│  📁 Code Review         │
│     Last: 3 days ago    │
├─────────────────────────┤
│  📋 RECENT CHATS        │
│  • Quick question       │
│  • Population query     │
└─────────────────────────┘
```

### Thought Detail View

When a Thought is selected:

```
┌─────────────────────────────────────────┐
│  📁 Project Alpha                  ⚙️ │
│  "Building autonomous agent system"     │
├─────────────────────────────────────────┤
│  Files (3)                              │
│  📎 spec.md                             │
│  📎 architecture.png                    │
│  📎 notes.txt                           │
├─────────────────────────────────────────┤
│  Model: GPT-4o-mini                     │
│  MoE: Enabled (Nash Tournament)         │
│  Messages: 47                           │
└─────────────────────────────────────────┘
```

---

## API Endpoints

### Worker API

```typescript
// Create new Thought
POST /thoughts
{
  name: string,
  description?: string,
  system_prompt?: string,
  model_preference?: string
}

// Get all Thoughts
GET /thoughts

// Get specific Thought with messages
GET /thoughts/:id

// Update Thought
PUT /thoughts/:id
{
  name?: string,
  description?: string,
  system_prompt?: string,
  model_preference?: string,
  moe_config?: object
}

// Delete Thought
DELETE /thoughts/:id

// Send message to Thought
POST /thoughts/:id/messages
{
  message: string,
  files?: File[]
}

// Upload file to Thought
POST /thoughts/:id/files
FormData with files

// Get Thought artifacts
GET /thoughts/:id/artifacts
```

---

## Frontend Components

### New Components Needed

1. **ThoughtsList.tsx** - Sidebar list of Thoughts
2. **ThoughtDetail.tsx** - Thought settings and info panel
3. **ThoughtCreator.tsx** - Modal for creating new Thought
4. **ThoughtSettings.tsx** - Edit Thought configuration
5. **FileManager.tsx** - Manage Thought files
6. **ArtifactViewer.tsx** - View code/documents generated

### Updated Components

1. **App.tsx** - Add Thought selection state
2. **Sidebar.tsx** - Add Thoughts section
3. **ChatArea.tsx** - Show current Thought context

---

## Workflow

### Creating a Thought

1. User clicks "+ New Thought"
2. Modal appears with fields:
   - Name (required)
   - Description (optional)
   - System Prompt (optional)
   - Model Preference (dropdown)
3. Thought created in database
4. User redirected to Thought chat

### Using a Thought

1. User selects Thought from sidebar
2. Frontend loads:
   - All messages (paginated)
   - Attached files
   - Thought settings
3. User sends message
4. Worker receives:
   - Message content
   - Thought ID
   - Full conversation history from DB
   - System prompt from Thought
5. Agent responds with Thought context
6. Message saved to `thought_messages`

### Switching Thoughts

1. User clicks different Thought
2. Current chat state saved
3. New Thought loaded
4. Chat area updates with new context

---

## Implementation Phases

### Phase 1: Database Setup
- Create tables in Supabase
- Set up storage bucket for files
- Add RLS policies

### Phase 2: Backend API
- Add Thought CRUD endpoints to worker
- Implement message loading with pagination
- Add file upload handling

### Phase 3: Frontend UI
- Build Thought list component
- Add Thought creation modal
- Update chat to use Thought context

### Phase 4: File Management
- Implement file upload to Supabase Storage
- Add file viewer/downloader
- Link files to messages

### Phase 5: Advanced Features
- Artifact system (code, documents)
- MoE configuration per Thought
- Thought templates
- Export/import Thoughts

---

## Example Use Cases

### Use Case 1: Software Project

**Thought**: "Morgus Agent Development"
- **Files**: spec.md, architecture.png, todo.txt
- **System Prompt**: "You are helping build an autonomous AI agent. Focus on TypeScript, Cloudflare Workers, and modern web development."
- **Model**: GPT-4o-mini
- **Messages**: 150+ over 2 weeks
- **Artifacts**: 20 code snippets, 5 documents

### Use Case 2: Research Project

**Thought**: "Climate Change Analysis"
- **Files**: data.csv, papers.pdf, notes.md
- **System Prompt**: "You are a research assistant specializing in climate science. Be precise and cite sources."
- **Model**: Gemini 2.0 Flash (for multimodal)
- **MoE**: Enabled (majority voting)
- **Messages**: 80+
- **Artifacts**: 10 data visualizations, 3 reports

### Use Case 3: Learning Project

**Thought**: "Learning Rust"
- **Files**: rust-book.pdf, exercises.rs
- **System Prompt**: "You are a patient Rust programming tutor. Explain concepts clearly and provide examples."
- **Model**: GPT-4o-mini
- **Messages**: 200+
- **Artifacts**: 50 code examples

---

## Benefits

1. **Persistent Context** - Never lose track of complex projects
2. **Organization** - Separate concerns into dedicated Thoughts
3. **Efficiency** - No need to re-explain context every time
4. **Collaboration** - Share Thoughts with others (future)
5. **Flexibility** - Different models/settings per Thought
6. **Traceability** - Complete history of all interactions

---

## Technical Considerations

### Performance
- Paginate message loading (50 per page)
- Lazy load files and artifacts
- Cache frequently accessed Thoughts
- Index by last_accessed for quick retrieval

### Storage
- Supabase Storage for files (5GB free tier)
- Compress large files before upload
- Set retention policies for old Thoughts

### Security
- Row Level Security (RLS) on all tables
- User-specific Thoughts only
- Secure file upload validation
- Rate limiting on API endpoints

### Scalability
- Partition messages by thought_id
- Archive old Thoughts after 90 days
- Implement Thought export/backup

---

## Future Enhancements

1. **Thought Templates** - Pre-configured Thoughts for common tasks
2. **Thought Sharing** - Collaborate with others
3. **Thought Branching** - Fork a Thought for experimentation
4. **Thought Analytics** - Usage stats, token costs, etc.
5. **Thought Search** - Full-text search across all Thoughts
6. **Thought Tags** - Categorize and filter Thoughts
7. **Thought Automation** - Scheduled tasks within Thoughts

---

## Success Metrics

- **Adoption**: % of users creating Thoughts
- **Engagement**: Average messages per Thought
- **Retention**: Thoughts accessed >1 week after creation
- **Value**: User feedback on context persistence

---

**Status**: Ready for implementation  
**Priority**: High - Foundation for all advanced features  
**Estimated Time**: 2-3 hours for MVP
