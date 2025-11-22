# Morgus Architecture

## System Overview

Morgus is an autonomous agent system that can build, test, and deploy software projects end-to-end. It consists of three main components:

1. **Orchestrator** - Python backend that manages task execution
2. **Console** - React web UI for task management
3. **Sandbox** - Docker containers for isolated code execution

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        User Interface                        │
│                    (Cloudflare Pages)                        │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Dashboard   │  │   New Task   │  │ Task Detail  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└───────────────────────────┬─────────────────────────────────┘
                            │ Real-time updates
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Supabase Database                       │
│                                                              │
│  ┌──────────┐  ┌────────────┐  ┌────────────┐  ┌─────────┐│
│  │  Tasks   │  │ Task Steps │  │ Artifacts  │  │Knowledge││
│  └──────────┘  └────────────┘  └────────────┘  └─────────┘│
└───────────────────────────┬─────────────────────────────────┘
                            │ Poll for pending tasks
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Orchestrator Service                      │
│                      (Python Backend)                        │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Task Execution Loop                     │   │
│  │                                                       │   │
│  │  RESEARCH → PLAN → BUILD → EXECUTE → FINALIZE       │   │
│  └─────────────────────────────────────────────────────┘   │
│                            │                                 │
│  ┌──────────────┐  ┌──────┴──────┐  ┌──────────────┐      │
│  │ LLM Client   │  │ Tool System │  │ Sandbox Mgr  │      │
│  └──────────────┘  └─────────────┘  └──────────────┘      │
└───────────────────────────┬─────────────────────────────────┘
                            │ Spawn containers
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Docker Sandbox                            │
│                                                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐           │
│  │   Node.js  │  │   Python   │  │  Wrangler  │           │
│  └────────────┘  └────────────┘  └────────────┘           │
│                                                              │
│  /workspace (mounted volume)                                │
└───────────────────────────┬─────────────────────────────────┘
                            │ Deploy
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare Pages                          │
│                   (Deployed Projects)                        │
└─────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. Orchestrator

**Technology**: Python 3.11

**Responsibilities**:
- Poll Supabase for pending tasks
- Execute tasks through 5-phase workflow
- Manage LLM interactions (OpenAI API)
- Coordinate tool execution
- Manage Docker sandbox lifecycle
- Log all steps to database

**Key Modules**:
- `main.py` - Main orchestrator loop
- `llm.py` - LLM client with function calling
- `database.py` - Supabase client
- `sandbox.py` - Docker container management
- `tools/` - Tool implementations (file, shell, git, web, deploy)

### 2. Console

**Technology**: React + TypeScript + Vite

**Responsibilities**:
- Display task dashboard
- Create new tasks
- Show real-time task progress
- Display execution timeline
- Show artifacts and deployments

**Key Features**:
- Real-time updates via Supabase subscriptions
- Responsive design
- Task filtering and search
- Detailed execution logs

### 3. Sandbox

**Technology**: Docker + Ubuntu 22.04

**Responsibilities**:
- Provide isolated execution environment
- Execute shell commands safely
- Run build tools (npm, python, etc.)
- Deploy to Cloudflare via Wrangler

**Security Features**:
- Resource limits (CPU, memory, disk)
- Command whitelist/blacklist
- Network isolation
- No privileged access
- Automatic cleanup

## Data Flow

### Task Creation

1. User submits task via Console
2. Console writes to Supabase `tasks` table
3. Task status: `pending`

### Task Execution

1. Orchestrator polls Supabase for pending tasks
2. Updates task status to `running`
3. Creates Docker sandbox container
4. Executes 5-phase workflow:

#### Phase 1: RESEARCH
- LLM searches web for information
- Fetches documentation and examples
- Logs findings to task_steps

#### Phase 2: PLAN
- LLM creates implementation plan
- Breaks down into sub-tasks
- Identifies dependencies

#### Phase 3: BUILD
- LLM writes code files
- Installs dependencies
- Runs builds
- Fixes errors iteratively

#### Phase 4: EXECUTE
- Tests the application
- Builds production version
- Deploys to Cloudflare Pages
- Saves deployment URL as artifact

#### Phase 5: FINALIZE
- Commits code to git
- Pushes to remote (if configured)
- Sends final summary to user
- Updates task status to `completed`

### Real-time Updates

1. Orchestrator writes to Supabase (tasks, task_steps, artifacts)
2. Supabase broadcasts changes via Realtime
3. Console receives updates via subscription
4. UI updates automatically

## Tool System

Tools are Python classes that implement the `Tool` interface:

```python
class Tool(ABC):
    @property
    def name(self) -> str: ...
    
    @property
    def description(self) -> str: ...
    
    def get_schema(self) -> Dict[str, Any]: ...
    
    def execute(self, **kwargs) -> str: ...
```

Available tools:
- `file_read`, `file_write`, `file_list` - File operations
- `shell_exec` - Execute shell commands
- `git_init`, `git_add`, `git_commit`, `git_push` - Git operations
- `search_web`, `fetch_url` - Web research
- `cloudflare_deploy` - Deploy to Cloudflare Pages
- `notify_user`, `ask_user` - User interaction

## LLM Integration

**Model Router**:
- Default: GPT-4
- Code-specific: GPT-4 (can be configured to use specialized models)

**Function Calling**:
- Tools are exposed as OpenAI functions
- LLM decides which tools to call and with what arguments
- Results are fed back to LLM for next iteration

**Conversation Management**:
- Maintains conversation history per task
- Includes system prompts for each phase
- Truncates history if token limit exceeded

## Database Schema

### tasks
- `id` (UUID, PK)
- `title` (TEXT)
- `description` (TEXT)
- `status` (TEXT) - pending, running, completed, error, waiting_for_input
- `phase` (TEXT) - RESEARCH, PLAN, BUILD, EXECUTE, FINALIZE
- `model` (TEXT)
- `created_at`, `updated_at`, `completed_at` (TIMESTAMPTZ)

### task_steps
- `id` (UUID, PK)
- `task_id` (UUID, FK)
- `phase` (TEXT)
- `type` (TEXT) - PHASE_START, LLM_RESPONSE, TOOL_CALL, TOOL_RESULT, etc.
- `content` (TEXT)
- `metadata` (JSONB)
- `created_at` (TIMESTAMPTZ)

### artifacts
- `id` (UUID, PK)
- `task_id` (UUID, FK)
- `type` (TEXT) - deployment, repository, file
- `name` (TEXT)
- `url` (TEXT)
- `path` (TEXT)
- `metadata` (JSONB)
- `created_at` (TIMESTAMPTZ)

### knowledge
- `id` (UUID, PK)
- `content` (TEXT)
- `embedding` (VECTOR) - For future semantic search
- `metadata` (JSONB)
- `created_at` (TIMESTAMPTZ)

## Security Model

### Sandbox Isolation

- Each task runs in a separate Docker container
- Containers have resource limits
- No network access to host
- Read-only root filesystem (except /workspace)
- Dropped Linux capabilities

### Command Filtering

- Whitelist of allowed commands
- Blacklist of dangerous commands (rm -rf /, dd, etc.)
- Path traversal prevention

### API Security

- Supabase Row Level Security (RLS)
- Service role key only in orchestrator
- Anon key in console (read-only)
- Cloudflare API token with minimal permissions

## Scalability

### Current Design
- Single orchestrator instance
- Sequential task processing
- Suitable for personal/small team use

### Future Enhancements
- Multiple orchestrator workers
- Task queue (Redis/RabbitMQ)
- Horizontal scaling
- Kubernetes deployment
- Distributed sandbox pool

## Monitoring & Logging

- All task steps logged to Supabase
- Orchestrator logs to stdout/systemd
- Docker container logs accessible via `docker logs`
- Real-time monitoring via Console UI

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  DigitalOcean Droplet                   │
│                                                         │
│  ┌──────────────────────────────────────────────────┐ │
│  │         Morgus Orchestrator (systemd)            │ │
│  └──────────────────────────────────────────────────┘ │
│                          │                             │
│  ┌──────────────────────┴──────────────────────────┐ │
│  │              Docker Engine                       │ │
│  │  ┌────────────┐  ┌────────────┐  ┌───────────┐ │ │
│  │  │ Sandbox 1  │  │ Sandbox 2  │  │ Sandbox N │ │ │
│  │  └────────────┘  └────────────┘  └───────────┘ │ │
│  └──────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│              Cloudflare Pages (Global CDN)              │
│  ┌──────────────┐  ┌──────────────┐                    │
│  │   Console    │  │  User Sites  │                    │
│  └──────────────┘  └──────────────┘                    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                  Supabase (Managed)                     │
│  ┌──────────────┐  ┌──────────────┐                    │
│  │  PostgreSQL  │  │   Realtime   │                    │
│  └──────────────┘  └──────────────┘                    │
└─────────────────────────────────────────────────────────┘
```

## Technology Stack Summary

| Component | Technology |
|-----------|------------|
| Orchestrator | Python 3.11 |
| Console | React 19 + TypeScript |
| Build Tool | Vite |
| Database | Supabase (PostgreSQL) |
| Real-time | Supabase Realtime |
| Sandbox | Docker + Ubuntu 22.04 |
| Deployment | Cloudflare Pages |
| LLM | OpenAI GPT-4 |
| Version Control | Git + GitHub |

## Extension Points

The system is designed to be extensible:

1. **New Tools**: Implement `Tool` interface and register in `ToolRegistry`
2. **New Models**: Add to `ModelRouter` in `llm.py`
3. **New Phases**: Extend `TaskPhase` and add to execution loop
4. **Custom Deployments**: Add new deployment tools (Vercel, Netlify, etc.)
5. **Vector Memory**: Use `knowledge` table for semantic search
