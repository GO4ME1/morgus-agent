# 🎯 Unified Notebooks Architecture

## Vision: One Notebooks System, Two Powerful Features

**Current State:**
- Morgus Notebooks (research, study guides, mindmaps)
- NotebookLM Integration (Google AI research)

**New Unified System:**
- **One Notebooks Panel** with both features integrated
- **Seamless workflow:** Chat → Save → Research → Generate → Insights

---

## 🏗️ Architecture

### **Notebooks Panel Structure:**

```
📓 Notebooks
├── 🔬 Morgus Notebooks (auto-generated)
│   ├── Deep Research
│   ├── Study Guides
│   ├── FAQs
│   ├── Timelines
│   └── Roadmaps
│
└── 💭 NotebookLM (Google AI)
    ├── Your Research Notebook
    ├── Team Notebooks (shared)
    └── Create New Notebook
```

### **Two Tabs in Notebooks Panel:**

**Tab 1: Morgus Notebooks** 📚
- Auto-generated from conversations
- Mindmaps, flowcharts, timelines
- Study guides, FAQs, roadmaps
- Visual assets (SVG, images)
- Daily limit: 5 free per day

**Tab 2: NotebookLM** 💭
- Google NotebookLM integration
- Manual save from chat (+ button)
- AI-powered insights (💭 cloud)
- Audio overviews, study guides
- Unlimited with subscription

---

## 🎨 UI Design

### **Unified Notebooks Panel:**

```
┌─────────────────────────────────────┐
│ 📓 Notebooks                    [×] │
├─────────────────────────────────────┤
│ [Morgus] [NotebookLM]              │ ← Tabs
├─────────────────────────────────────┤
│                                     │
│ Tab 1: Morgus Notebooks            │
│ ┌─────────────────────────────┐   │
│ │ 🔬 AI Trends Research       │   │
│ │ Deep Research • 2h ago      │   │
│ │ 15 sections, 3 assets       │   │
│ └─────────────────────────────┘   │
│                                     │
│ ┌─────────────────────────────┐   │
│ │ 📚 Marketing Study Guide    │   │
│ │ Study Guide • 1d ago        │   │
│ │ 8 sections, mindmap         │   │
│ └─────────────────────────────┘   │
│                                     │
│ Daily: 3/5 notebooks used          │
│                                     │
├─────────────────────────────────────┤
│                                     │
│ Tab 2: NotebookLM                  │
│ ┌─────────────────────────────┐   │
│ │ 💭 Your Research            │   │
│ │ Personal • 23 sources   [↗] │   │
│ └─────────────────────────────┘   │
│                                     │
│ ┌─────────────────────────────┐   │
│ │ 👥 Team Workspace           │   │
│ │ Shared • 12 sources     [↗] │   │
│ └─────────────────────────────┘   │
│                                     │
│ [+ Create New Notebook]            │
│                                     │
└─────────────────────────────────────┘
```

### **Message Actions:**

```
┌─────────────────────────────────────┐
│ User: "How do I grow my startup?"  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Morgus: "Here are 5 strategies..." │
│                                     │
│ [+] [💭] [📋] [🔊]                  │
│  ↑   ↑    ↑    ↑                   │
│  │   │    │    └─ Speak            │
│  │   │    └────── Copy             │
│  │   └─────────── Get NotebookLM   │
│  └─────────────── Save to NotebookLM│
└─────────────────────────────────────┘
```

---

## 🔄 User Workflows

### **Workflow 1: Morgus Notebooks (Auto-Generated)**

```
User: "Research AI trends for me"
Morgus: [Conducts deep research]
→ Auto-generates notebook with:
  - Summary
  - Sections with bullets
  - Mindmap
  - Timeline
  - Visual assets

User clicks notebook in panel
→ Views full notebook with all assets
→ Can export, share, or delete
```

### **Workflow 2: NotebookLM Integration (Manual Save)**

```
User: "How do I grow my startup?"
Morgus: "Here are 5 strategies..."

User clicks [+] button on message
→ Content copied to clipboard
→ NotebookLM opens in new tab
→ User pastes into NotebookLM
→ Success notification

Later: User has 20 saved messages
User clicks [💭] button
→ NotebookLM opens
→ User asks: "Summarize my learnings"
→ Gets comprehensive summary
→ Copies back to Morgus chat
```

### **Workflow 3: Hybrid (Best of Both)**

```
Day 1: User researches "AI trends"
→ Morgus generates notebook (auto)
→ User saves key insights to NotebookLM (manual)

Day 2: User researches "AI business models"
→ Morgus generates another notebook (auto)
→ User saves to same NotebookLM (manual)

Day 3: User wants big picture
→ Views Morgus notebooks for structured summaries
→ Clicks [💭] on NotebookLM for AI synthesis
→ Gets comprehensive analysis from both sources
```

---

## 💾 Data Model

### **Morgus Notebooks (Existing):**

```typescript
interface MorgusNotebook {
  id: string;
  user_id: string;
  purpose: 'deep_research' | 'study_guide' | 'faq' | 'timeline' | 'roadmap';
  title: string;
  summary: string;
  sections: {
    title: string;
    bullets: string[];
  }[];
  mindmap: any;
  flowchart: any;
  created_at: string;
  updated_at: string;
}
```

### **NotebookLM Integration (New):**

```typescript
interface NotebookLMNotebook {
  id: string;
  owner_user_id: string;
  notebook_id: string; // Google NotebookLM ID
  name: string;
  description: string;
  type: 'personal' | 'shared' | 'public';
  source_count: number;
  created_at: string;
  updated_at: string;
}

interface NotebookLMSource {
  id: string;
  notebook_id: string;
  user_id: string;
  source_type: 'text' | 'url' | 'pdf' | 'chat_message';
  title: string;
  content: string;
  created_at: string;
}
```

---

## 🎯 Implementation Plan

### **Phase 1: Merge UI Components** ✅

**Update NotebooksPanel.tsx:**
- Add tabs: "Morgus" and "NotebookLM"
- Tab 1: Existing Morgus notebooks (keep as-is)
- Tab 2: NotebookLM integration (new)
- Share same panel, same styling

**Files to Update:**
- `console/src/components/NotebooksPanel.tsx` - Add tabs
- `console/src/components/NotebooksPanel.css` - Add tab styles

### **Phase 2: Add Message Actions** ✅

**Update App.tsx:**
- Add [+] button to each message (save to NotebookLM)
- Add [💭] button to each message (get insights)
- Wire up to NotebookLM service

**Files to Update:**
- `console/src/App.tsx` - Add buttons to message rendering
- `console/src/App.css` - Style buttons

### **Phase 3: Connect Services** ✅

**Use existing NotebookLM service:**
- `console/src/services/notebooklm.ts` - Already created
- `console/src/config/notebooklm.ts` - Already configured

**Wire up:**
- [+] button → `addMessageToNotebook()`
- [💭] button → `getNotebookInsights()`
- Notebook list → `getSources()`

### **Phase 4: Testing** 🚧

**Test Morgus Notebooks:**
- Generate deep research notebook
- View sections, mindmap, assets
- Delete notebook

**Test NotebookLM:**
- Select NotebookLM tab
- See your notebook listed
- Click [+] on message → Content copied → NotebookLM opens
- Click [💭] → NotebookLM opens for insights
- Create new notebook

**Test Integration:**
- Switch between tabs
- Use both features in same session
- Verify no conflicts

---

## 🚀 Benefits of Unified System

### **For Users:**
- ✅ One place for all notebooks
- ✅ Clear distinction (auto vs manual)
- ✅ Complementary features
- ✅ Seamless workflow

### **For Development:**
- ✅ Less code duplication
- ✅ Consistent UI/UX
- ✅ Easier to maintain
- ✅ Shared styling and logic

### **For Marketing:**
- ✅ "Complete notebook system"
- ✅ "Auto-generated + AI-powered"
- ✅ Unique differentiator
- ✅ Clear value proposition

---

## 📊 Feature Comparison

| Feature | Morgus Notebooks | NotebookLM |
|---------|------------------|------------|
| **Generation** | Auto (AI creates) | Manual (user saves) |
| **Content** | Structured (sections, bullets) | Flexible (any text) |
| **Visuals** | Mindmaps, flowcharts, timelines | None (text-based) |
| **AI Analysis** | Built-in (summary, structure) | External (Google AI) |
| **Limits** | 5 per day (free) | Unlimited (with sub) |
| **Collaboration** | No | Yes (shared notebooks) |
| **Export** | Coming soon | Via NotebookLM |
| **Audio** | No | Yes (audio overviews) |

**Together:** Complete research and knowledge management system!

---

## 🎉 Summary

**Unified Notebooks = Morgus Notebooks + NotebookLM**

**Architecture:**
- One panel, two tabs
- Complementary features
- Seamless integration

**User Experience:**
- Clear and intuitive
- Best of both worlds
- Powerful workflow

**Implementation:**
- Merge UI components ✅
- Add message actions ✅
- Connect services ✅
- Test thoroughly 🚧

**Ready to implement!** 🚀
