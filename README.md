# Morgus Autonomous Agent System

**Morgus** is an autonomous end-to-end AI agent that can take high-level goals and deliver tangible results with minimal human intervention. Inspired by the capabilities of the Manus system, Morgus analyzes tasks, devises plans, and executes those plans to completion, including writing and deploying code.

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
- **Learning System**: Continuously improves from user interactions and task outcomes

## Learning System

The Morgus learning system enables the agent to learn from its experiences and improve over time. It consists of a database schema, service-level updates, and UI components that work together to create a feedback loop.

### Database Schema

Four new tables have been added to the Supabase database:

1.  **`dppm_reflections`**: Stores the outcome of each DPPM (Decompose-Plan-Prioritize-Monitor) task execution, including the goal, success rate, model performance, and lessons learned.
2.  **`model_performance`**: Tracks aggregate performance metrics for each model by task category, automatically updated via a database trigger.
3.  **`user_learning_preferences`**: Stores personalized preferences learned from user interactions.
4.  **`task_patterns`**: Remembers successful task decomposition patterns for reuse.

### Answer Caching

To improve performance and reduce costs, the learning system includes an answer caching mechanism:

- **`answer_cache` table**: Stores frequently accessed answers for fast retrieval.
- **Semantic Search**: Uses vector embeddings to find similar questions and return cached answers.
- **Personal & Global Caches**: Caches can be specific to a user or shared across all users.

### Privacy & Opt-Out

The learning system respects user privacy. Data is only collected if the user has opted in. The `allow_learning` flag is checked before any data is stored.

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

## Technology Stack

- **Backend**: Python 3.11+ (orchestrator service)
- **Sandbox**: Docker with Node.js, Python, git, Wrangler CLI
- **Database**: Supabase (PostgreSQL + pgvector)
- **Frontend**: React + TypeScript
- **Deployment**: Cloudflare Pages (frontend), Fly.io (backend)
- **AI Models**: OpenAI API (GPT-4, GPT-5.1)

## Project Structure

```
morgus-agent/
├── dppm-service/         # Node.js DPPM service with learning system
├── console/              # React web console
├── supabase/             # Supabase schema and migrations
└── worker/               # Cloudflare Worker for other services
```

## Setup and Installation

Detailed setup instructions are in the [Installation Guide](docs/installation.md).

## Development Status

The project is under active development. The learning system is the latest major feature to be implemented and deployed.
