# NotebookLM Console Integration Guide

This guide shows how to integrate the NotebookLM components into the Morgus console.

---

## 📁 Files Created

### **Components:**
- `src/components/NotebooksSidebar.tsx` - Left sidebar with notebooks list
- `src/components/NotebooksSidebar.css` - Sidebar styles
- `src/components/NotebookLMActions.tsx` - + button and 💭 thought cloud
- `src/components/NotebookLMActions.css` - Action button styles

### **Services:**
- `src/services/notebooklm.ts` - API client for NotebookLM
- `src/config/notebooklm.ts` - Configuration (notebook ID: f3d3d717-6658-4d5b-9570-49c709a7d0fd)

---

## 🔧 Integration Steps

### **Step 1: Add NotebooksSidebar to Main Layout**

Find your main chat layout component (e.g., `src/pages/Chat.tsx` or `src/App.tsx`) and add:

```typescript
import { NotebooksSidebar } from '../components/NotebooksSidebar';
import { useState } from 'react';

function ChatPage() {
  const [selectedNotebookId, setSelectedNotebookId] = useState<string>();

  return (
    <div className="chat-layout">
      {/* Add Notebooks Sidebar */}
      <NotebooksSidebar
        onSelectNotebook={setSelectedNotebookId}
        selectedNotebookId={selectedNotebookId}
      />
      
      {/* Your existing chat interface */}
      <div className="chat-main">
        {/* ... */}
      </div>
    </div>
  );
}
```

### **Step 2: Add NotebookLM Actions to Chat Messages**

In your message component (e.g., `src/components/Message.tsx`):

```typescript
import { NotebookLMActions } from '../components/NotebookLMActions';
import { addMessageToNotebook, getNotebookInsights } from '../services/notebooklm';

function Message({ message, currentNotebookId }) {
  const handleAddToNotebook = async (messageId: string, notebookId: string) => {
    await addMessageToNotebook(message.content, notebookId, `Chat message from ${message.sender}`);
  };

  const handlePullFromNotebook = async (notebookId: string) => {
    const insights = await getNotebookInsights(notebookId, message.content);
    // Insert insights into chat
    return insights;
  };

  return (
    <div className="message">
      <div className="message-content">{message.content}</div>
      
      {/* Add NotebookLM Actions */}
      <NotebookLMActions
        messageId={message.id}
        messageContent={message.content}
        currentNotebookId={currentNotebookId}
        onAddToNotebook={handleAddToNotebook}
        onPullFromNotebook={handlePullFromNotebook}
      />
    </div>
  );
}
```

### **Step 3: Add Thought Cloud to Input Area**

In your chat input component (e.g., `src/components/ChatInput.tsx`):

```typescript
import { NotebookLMInputActions } from '../components/NotebookLMActions';
import { getNotebookInsights } from '../services/notebooklm';

function ChatInput({ currentNotebookId, onInsertMessage }) {
  const handlePullFromNotebook = async (notebookId: string) => {
    const insights = await getNotebookInsights(notebookId);
    // Insert into input or send as message
    onInsertMessage(insights);
    return insights;
  };

  return (
    <div className="chat-input">
      <input type="text" placeholder="Type a message..." />
      
      {/* Add Thought Cloud Button */}
      <NotebookLMInputActions
        currentNotebookId={currentNotebookId}
        onPullFromNotebook={handlePullFromNotebook}
      />
      
      <button>Send</button>
    </div>
  );
}
```

### **Step 4: Update Layout CSS**

Add to your main layout CSS:

```css
.chat-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Mobile: Hide sidebar by default */
@media (max-width: 768px) {
  .notebooks-sidebar {
    position: absolute;
    left: -280px;
    transition: left 0.3s;
    z-index: 100;
  }
  
  .notebooks-sidebar.open {
    left: 0;
  }
}
```

---

## 🎨 UI Features

### **Notebooks Sidebar:**
- ✅ List of user's notebooks
- ✅ Select active notebook
- ✅ Create new notebook
- ✅ Open in NotebookLM (↗ button)
- ✅ Shows source count

### **Message Actions:**
- ✅ **+ Button** - Add message to notebook
- ✅ **💭 Thought Cloud** - Get insights from notebook
- ✅ Confirmation dialogs
- ✅ Success feedback

### **Input Actions:**
- ✅ **💭 Button** - Pull insights into chat
- ✅ Disabled when no notebook selected

---

## 🔄 How It Works

### **Current Implementation (MVP):**
1. User selects a notebook from sidebar
2. Clicks **+** on a message → Content copied to clipboard → NotebookLM opens
3. User manually pastes into NotebookLM
4. Clicks **💭** → NotebookLM opens → User asks question → Copies response back

### **Future Enhancement (API Integration):**
1. Backend MCP server running
2. Direct API calls to NotebookLM
3. Automatic source addition
4. Real-time chat responses
5. No manual copy/paste needed

---

## 🧪 Testing

### **Test Notebooks Sidebar:**
```typescript
// Should show default notebook
localStorage.getItem('morgus_notebooks');

// Should create new notebook
// Click + button, enter name, click Create
```

### **Test Add to Notebook:**
```typescript
// Click + on any message
// Should copy content and open NotebookLM
```

### **Test Pull from Notebook:**
```typescript
// Click 💭 on any message
// Should open NotebookLM for insights
```

---

## 📊 Data Storage

### **LocalStorage Keys:**
- `morgus_notebooks` - List of notebooks
- `notebook_{id}_sources` - Sources for each notebook

### **Default Notebook:**
```json
{
  "id": "f3d3d717-6658-4d5b-9570-49c709a7d0fd",
  "name": "Morgus Research",
  "description": "Main research notebook",
  "createdAt": "2024-12-26T...",
  "updatedAt": "2024-12-26T...",
  "sourceCount": 0
}
```

---

## 🚀 Deployment

### **Environment Variables:**
Add to `.env`:
```bash
REACT_APP_DPPM_URL=https://morgus-deploy.fly.dev
REACT_APP_NOTEBOOKLM_NOTEBOOK_ID=f3d3d717-6658-4d5b-9570-49c709a7d0fd
```

### **Build and Deploy:**
```bash
cd console
npm install
npm run build
# Deploy to Cloudflare Pages (auto-deploy via GitHub)
```

---

## 🎯 Next Steps

1. **Integrate components** into existing chat UI
2. **Test user flow** (select notebook → add message → get insights)
3. **Deploy to console** (Cloudflare Pages)
4. **User feedback** and iteration
5. **Backend API** (when MCP server is stable)

---

## 📚 Resources

- **Your Notebook:** https://notebooklm.google.com/notebook/f3d3d717-6658-4d5b-9570-49c709a7d0fd
- **NotebookLM:** https://notebooklm.google.com
- **MCP Server:** `/home/ubuntu/notebooklm-env` (for future backend integration)

---

**Ready to integrate! 🎊**
