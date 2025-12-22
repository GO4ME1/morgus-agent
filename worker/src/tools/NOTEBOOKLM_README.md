# NotebookLM Integration for Morgus

This module provides browser automation for Google NotebookLM, allowing Morgus to create structured knowledge notebooks programmatically.

## Overview

The NotebookLM integration uses browser automation (via Browserbase) to interact with Google's NotebookLM service through your Google account. All automation happens server-side, and users never see your account details.

## Features

- **Multiple Source Types**: URLs, YouTube videos, raw text, and files
- **Content Generation**: Study guides, FAQs, timelines, infographics, and deep research reports
- **Structured Output**: Parsed sections, summaries, and visual assets
- **Database Integration**: Automatically stores notebooks in Supabase
- **Morgy Training**: Notebooks can be assigned to Morgys for domain expertise

## Setup

### 1. Prerequisites

- Browserbase account with API key
- Google account with NotebookLM access
- Supabase database with memory system tables (see `002_memory_system.sql`)

### 2. Environment Variables

Add these to your `.env` file:

```bash
# Browserbase (already configured)
BROWSERBASE_API_KEY=your_api_key
BROWSERBASE_PROJECT_ID=your_project_id

# Google Authentication
GOOGLE_EMAIL=your_google_email@gmail.com
GOOGLE_SESSION_STATE=<generated_by_setup_script>
```

### 3. Authentication Setup

Run the authentication setup script once to capture your Google session:

```bash
cd worker
npx tsx src/tools/notebooklm-auth-setup.ts
```

This will:
1. Open a browser window
2. Prompt you to log in to Google
3. Capture your session state
4. Output the `GOOGLE_SESSION_STATE` value to add to your environment

### 4. Add to Tools Registry

The tool is automatically registered in `tools.ts` as `callNotebookLM`.

## Usage

### From the Morgus Agent

The agent can call the tool directly:

```typescript
{
  "name": "callNotebookLM",
  "input": {
    "purpose": "deep_research",
    "title": "AI Agent Architecture Research",
    "sources": [
      {
        "type": "url",
        "content": "https://example.com/ai-agents",
        "label": "AI Agents Overview"
      },
      {
        "type": "youtube",
        "content": "https://youtube.com/watch?v=...",
        "label": "Agent Architecture Talk"
      }
    ],
    "customInstructions": "Focus on the four-block architecture model"
  }
}
```

### Purpose Types

- `deep_research`: Comprehensive research report with citations
- `study_guide`: Educational content with key concepts
- `faq`: Frequently asked questions from sources
- `timeline`: Chronological timeline of events
- `infographic_generation`: Visual summary with diagrams
- `roadmap`: Strategic roadmap or plan

### Response Format

```typescript
{
  "notebookId": "nb_1234567890_abc123",
  "title": "AI Agent Architecture Research",
  "summary": "This notebook explores...",
  "sections": [
    {
      "title": "Introduction",
      "bullets": [
        "AI agents are autonomous systems...",
        "The four-block architecture consists of..."
      ]
    }
  ],
  "mindmap": { /* structured mindmap data */ },
  "flowchart": { /* structured flowchart data */ },
  "assets": [
    {
      "type": "infographic_svg",
      "label": "Architecture Diagram",
      "content": "<svg>...</svg>"
    }
  ],
  "rawNotebook": "<html>...</html>"
}
```

## Database Storage

After generating a notebook, store it in Supabase:

```typescript
// Insert notebook
const { data: notebook } = await supabase
  .from('notebooks')
  .insert({
    user_id: userId,
    purpose: request.purpose,
    title: response.title,
    summary: response.summary,
    raw_notebook: response.rawNotebook,
    sections: response.sections,
    mindmap: response.mindmap,
    flowchart: response.flowchart
  })
  .select()
  .single();

// Insert assets
for (const asset of response.assets) {
  await supabase
    .from('notebook_assets')
    .insert({
      notebook_id: notebook.id,
      type: asset.type,
      label: asset.label,
      content: asset.content
    });
}
```

## Morgy Training

Assign notebooks to Morgys for training:

```typescript
await supabase
  .from('morgy_notebooks')
  .insert({
    user_id: userId,
    morgy_id: 'research', // or 'bill', 'sally', 'dev'
    notebook_id: notebook.id
  });
```

## Workflow Integration

### RAG → NotebookLM → Storage → RAG Loop

1. **RAG Retrieval**: Morgus retrieves relevant information from the RAG store
2. **Notebook Request**: Constructs a `NotebookLMRequest` with sources
3. **Generation**: Calls `createNotebook()` to generate structured content
4. **Storage**: Saves notebook to Supabase
5. **RAG Update**: Embeds notebook summary and adds back to RAG store
6. **Morgy Training**: Optionally assigns notebook to a Morgy

This creates a compounding learning loop where Morgus gets smarter with each task.

## Rate Limiting

NotebookLM has usage limits. Implement rate limiting:

- Track notebook creation count per user per day
- Use XP cost to naturally limit usage
- Implement queue system for multiple concurrent requests
- Consider multiple Google accounts for higher throughput

## Troubleshooting

### Authentication Expired

If you see authentication errors, re-run the setup script:

```bash
npx tsx src/tools/notebooklm-auth-setup.ts
```

### Browser Automation Failures

- Check Browserbase API key and project ID
- Verify Google session state is valid
- Check NotebookLM UI hasn't changed (may need selector updates)

### Parsing Errors

If notebook data isn't parsing correctly:
- Check the HTML structure in `rawNotebook`
- Update selectors in `extractNotebookData()`
- Add more robust error handling

## Future Enhancements

- [ ] Audio overview generation (NotebookLM's AI podcast feature)
- [ ] Automatic source discovery from RAG
- [ ] Visual diagram generation with mermaid.js
- [ ] Notebook sharing and collaboration
- [ ] Batch notebook creation
- [ ] Notebook versioning and updates

## Security Notes

- **Never expose Google credentials** to users or logs
- Store `GOOGLE_SESSION_STATE` securely in environment variables
- Implement proper error handling to avoid leaking session data
- Monitor for unusual activity on the Google account
- Consider using a dedicated Google account for Morgus
