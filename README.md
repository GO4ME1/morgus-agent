# Morgus Autonomous Agent System

Morgus is an autonomous end-to-end AI agent that can take high-level goals and deliver tangible results with minimal human intervention. Inspired by the capabilities of the Manus system, Morgus analyzes tasks, devises plans, and executes those plans to completion, including writing and deploying code.

## Overview

Morgus is designed to **deliver results** – producing running applications or completed projects autonomously. The system is hosted on a Linux (Ubuntu) server with a web-based console front-end on Cloudflare Pages and a Supabase backend for data storage.

### Key Features

- **5-Phase Workflow**: Research → Plan → Build → Execute → Finalize
- **Autonomous Execution**: Takes high-level goals and breaks them into actionable steps
- **Multi-Model Support**: Flexible model routing (GPT-4, GPT-5.1, future Gemini/Grok)
- **Sandbox Execution**: Secure Docker-based environment for code execution
- **Tool Integration**: File operations, shell commands, git, web search, deployment
- **Real-Time Updates**: Live task monitoring via Supabase subscriptions
- **Cloudflare Deployment**: Automated deployment to Cloudflare Pages/Workers
- **Knowledge Base**: Vector-based long-term memory using Supabase + pgvector

## Architecture

Morgus V2 is built on a **four-block architecture** that provides a robust and scalable framework for autonomous agent systems. This architecture is inspired by academic research on advanced AI agents and consists of four interconnected blocks: **Perception**, **Reasoning**, **Memory**, and **Execution**.

### The Four-Block Model

| Architectural Block | Morgus Implementation |
| :--- | :--- |
| **Perception** | Browser interaction tools (Browserbase), screenshot analysis, HTML/DOM parsing, and API integration. |
| **Reasoning** | Mixture-of-Experts (MOE) model for high-level planning, the DPPM (Decompose, Plan in Parallel, Merge) workflow, and the reflection mechanism. |
| **Memory** | Supabase for long-term memory (RAG, workflow memory, user profiles, NotebookLM-generated notebooks) and a smart context window for short-term memory. |
| **Execution** | The full suite of tools available to Morgus, including the code sandbox, browser, social media APIs, and GitHub integration. |

For a detailed explanation of the architecture, see [MORGUS_ARCHITECTURE.md](MORGUS_ARCHITECTURE.md).

### Core Components

#### LLM Orchestrator
The core controller that leverages a large language model to drive the task workflow. It interprets user goals, breaks them into sub-tasks using the DPPM (Decompose, Plan in Parallel, Merge) workflow, and executes them autonomously.

#### Tool System
A comprehensive set of callable functions that allow the AI to perform actions:
- **File System**: read, write, modify, list files
- **Shell Execution**: run commands with safety controls
- **Git Integration**: version control operations
- **Web Search**: fetch information from the internet
- **Cloudflare Deploy**: publish to Pages/Workers
- **Supabase**: database operations and backend functions
- **NotebookLM**: structured knowledge synthesis and diagram generation
- **User Interaction**: notifications and queries

#### Sandbox Environment
Docker-based isolated execution environment with:
- Pre-installed runtimes (Node.js, Python, etc.)
- Security controls (command whitelisting, file access restrictions)
- Resource limits (CPU, memory, disk, timeout)
- Network filtering for safe external access

#### Model Router
Abstraction layer that routes requests to different AI models based on task requirements, supporting multiple providers and specialized models for different phases.

#### Memory and Knowledge Base
- **Short-term memory**: Current task context and conversation
- **Long-term memory**: Supabase PostgreSQL with pgvector for embeddings
- **Notebooks**: NotebookLM-generated structured knowledge with diagrams and infographics
- **Workflows**: Reusable procedures learned from past tasks
- **Experiences**: Trajectories and reflections from completed tasks
- **Task history**: Complete audit trail of all actions and decisions

#### Multi-Agent System (Morgys)
Specialized AI agents ("Morgys") that work alongside the main Morgus agent:
- **Bill**: Marketing & Distribution Expert
- **Sally**: Promotions & Influencer Outreach Expert
- **Dev Morgy**: Coding & DevOps Expert
- **Research Morgy**: Deep Research & RAG Expert

Each Morgy can be trained on specific notebooks to enhance their domain expertise.

#### Web Console
React-based dashboard hosted on Cloudflare Pages featuring:
- Task submission and monitoring
- Real-time progress updates
- Phase timeline visualization
- Notebooks viewer with interactive diagrams
- Morgy Pen for agent management
- Artifact and output display
- User interaction interface

## Technology Stack

- **Backend**: Python 3.11+ (orchestrator service)
- **Sandbox**: Docker with Node.js, Python, git, Wrangler CLI
- **Database**: Supabase (PostgreSQL + pgvector)
- **Frontend**: React + TypeScript
- **Deployment**: Cloudflare Pages (frontend), Ubuntu server (orchestrator)
- **AI Models**: OpenAI API (GPT-4, GPT-5.1)

## Project Structure

```
morgus-agent/
├── orchestrator/          # Python orchestrator service
│   ├── main.py           # Main orchestrator loop
│   ├── llm.py            # LLM integration and model router
│   ├── tools/            # Tool implementations
│   ├── sandbox.py        # Docker sandbox manager
│   └── config.py         # Configuration
├── console/              # React web console
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   └── services/     # API services
│   └── public/
├── database/             # Supabase schema and migrations
├── docker/               # Dockerfile for sandbox
└── docs/                 # Documentation
```

## Setup and Installation

### Prerequisites

- Ubuntu server (or DigitalOcean droplet)
- Docker installed
- Cloudflare account with Pages access
- Supabase project
- OpenAI API key

### Environment Variables

```bash
# OpenAI
OPENAI_API_KEY=sk-...

# Cloudflare
CLOUDFLARE_API_TOKEN=...
CLOUDFLARE_ACCOUNT_ID=...

# Supabase
SUPABASE_URL=https://...supabase.co
SUPABASE_SERVICE_KEY=...
SUPABASE_ANON_KEY=...

# GitHub (optional)
GITHUB_TOKEN=ghp_...
```

### Installation

1. Clone the repository
2. Set up environment variables
3. Initialize Supabase database schema
4. Build Docker sandbox image
5. Start orchestrator service
6. Deploy console to Cloudflare Pages

Detailed setup instructions are in the [Installation Guide](docs/installation.md).

## Usage

### Submitting a Task

Via the web console:
1. Navigate to the Morgus Console
2. Click "New Task"
3. Enter your goal (e.g., "Build a personal blog with Markdown CMS")
4. Submit and monitor progress in real-time

### Task Lifecycle

1. **Research**: Morgus gathers information and clarifies requirements
2. **Plan**: Creates a detailed implementation plan
3. **Build**: Generates code and configuration files
4. **Execute**: Tests and deploys the solution
5. **Finalize**: Commits to git, reports results, and cleans up

## Security

Morgus implements multiple layers of security:

- **Sandbox Isolation**: Docker containers with restricted privileges
- **Command Whitelisting**: Only approved commands can be executed
- **File Access Control**: Restricted to project directories
- **Secret Management**: API keys never exposed to LLM
- **Network Filtering**: Whitelist-based external access
- **Resource Limits**: CPU, memory, and disk quotas
- **Audit Logging**: Complete trail of all actions

## Future Enhancements

- Multi-agent parallelism for complex tasks
- Enhanced model specialization (coding, research, etc.)
- Learning and improvement loops
- Plugin ecosystem for custom tools
- IDE and CLI integrations
- Monitoring and analytics dashboard

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](docs/CONTRIBUTING.md) for guidelines.

## Acknowledgments

Based on the OpenAI Coding Agent cookbook: https://cookbook.openai.com/examples/build_a_coding_agent_with_gpt-5.1

Inspired by autonomous agent systems like Manus, AutoGPT, and LangChain.
