# Morgus V2: System Architecture

This document outlines the canonical architecture of the Morgus V2 AI agent system. It is based on a four-block model of Perception, Reasoning, Memory, and Execution, which provides a robust and scalable framework for building advanced AI agents.

## 1. The Four-Block Architecture

The Morgus V2 architecture is composed of four distinct but interconnected blocks:

![Morgus V2 Architecture](https://i.imgur.com/8uEuFLUJKTnY.png)

*   **Perception:** The Perception block is responsible for gathering information from the outside world. This includes user input, web pages, documents, and other data sources.
*   **Reasoning:** The Reasoning block is the "brain" of the agent. It is responsible for planning, decision-making, and learning.
*   **Memory:** The Memory block is responsible for storing and retrieving information. This includes long-term knowledge, short-term working memory, and user-specific data.
*   **Execution:** The Execution block is responsible for carrying out actions in the real world. This includes interacting with web browsers, running code, and calling APIs.

## 2. Morgus Implementation

The following table maps each block of the architecture to its corresponding implementation in the Morgus V2 system:

| Architectural Block | Morgus Implementation |
| :--- | :--- |
| **Perception** | Browser interaction tools (Browserbase), screenshot analysis, HTML/DOM parsing, and API integration. |
| **Reasoning** | Mixture-of-Experts (MOE) model for high-level planning, the DPPM (Decompose, Plan in Parallel, Merge) workflow, and the reflection mechanism. |
| **Memory** | Supabase for long-term memory (RAG, workflow memory, user profiles, NotebookLM-generated notebooks) and a smart context window for short-term memory. |
| **Execution** | The full suite of tools available to Morgus, including the code sandbox, browser, social media APIs, and GitHub integration. |

## 3. The Compounding Learning Loop

A key feature of the Morgus V2 architecture is the compounding learning loop, which is enabled by the tight integration of the Memory and Reasoning blocks. The workflow is as follows:

1.  **RAG Retrieval:** Morgus retrieves relevant information from the RAG memory store.
2.  **Notebook Request:** Morgus constructs a `NotebookRequest` and sends it to the NotebookLM API.
3.  **Structured Output:** NotebookLM returns a `NotebookResponse` with summaries, diagrams, and infographics.
4.  **Storage:** The notebook is stored in the `notebooks` and `notebook_assets` tables.
5.  **RAG Update:** The notebook's summary and key sections are embedded and added back to the RAG store.
6.  **Morgy Training:** Notebooks can be assigned to Morgys, enhancing their domain expertise.

This virtuous cycle allows Morgus to continuously learn and improve over time, becoming more knowledgeable and capable with each task it performs.
