# Morgus Skill: Dynamic View & Interactive Experience Generator v2.0

## Description

This skill enables Morgus to generate **fully interactive, dynamic user experiences** in response to any prompt. Instead of just text, Morgus can create rich, visual, and interactive UIs, mini-apps, games, and simulations on the fly. This skill is inspired by Gemini's "Dynamic View" and Claude's "Artifacts" capabilities.

## Core Principles

- **Beyond Text**: Move beyond static text responses to create immersive, engaging experiences.
- **Context is King**: The generated UI is fully customized to the user's prompt, context, and intent.
- **Interactivity First**: Users can click, play, explore, and interact with the generated content.
- **Agentic Coding**: Morgus uses its agentic coding capabilities to design and code the UI in real-time.

## Step-by-Step Workflow

1.  **Deconstruct the Prompt**: Morgus analyzes the user's prompt to understand the core intent and desired experience.
2.  **Design the UI/UX**: Morgus designs the user interface and user experience, considering:
    - **Content**: What information needs to be displayed?
    - **Interactivity**: What actions can the user take?
    - **Visuals**: What is the appropriate style and layout?
    - **Audience**: Who is the target user (e.g., a child, an expert)?
3.  **Generate the Code**: Morgus writes the HTML, CSS, and JavaScript code for the interactive experience.
4.  **Render the Experience**: The code is rendered in a sandboxed environment within the chat.
5.  **Enable AI Feedback Loop (Optional)**: The generated UI can include AI-powered features that call back to Morgus for more information or actions.

## Key Capabilities & Use Cases

| Capability | Description | Example Use Cases |
|---|---|---|
| **Interactive Learning** | Create educational simulations and interactive tutorials | - "Explain how a car engine works" (interactive diagram)
- "Teach me about black holes" (visual simulation)
- "Create a quiz on World War II" (interactive quiz) |
| **Visual Galleries** | Generate magazine-style layouts and image galleries | - "Show me a gallery of Van Gogh's paintings" (interactive gallery)
- "Create a portfolio of my best photos" (visual portfolio)
- "Design a lookbook for a fashion brand" (magazine-style layout) |
| **Interactive Tools** | Build calculators, converters, and planning tools | - "Create a mortgage calculator"
- "Build a trip planner for my vacation to Japan"
- "Make a tool to help me choose a new laptop" |
| **Games & Simulations** | Generate simple games, puzzles, and simulations | - "Create a game of Snake"
- "Build a simulation of a double pendulum"
- "Make a word puzzle game" |
| **Data Dashboards** | Create interactive charts, graphs, and dashboards | - "Visualize my sales data for the last quarter"
- "Create a dashboard to track my fitness goals"
- "Show me a real-time map of global earthquakes" |

## Technical Implementation

- **Frontend**: HTML, CSS, JavaScript (React or Vue can be used for more complex UIs)
- **Backend**: Morgus's agentic coding capabilities
- **Sandboxing**: The generated code is rendered in a secure sandboxed iframe.
- **AI Callback**: The UI can use a `window.morgus.call()` function to communicate back with Morgus.

## Keyword Triggers

- "create an interactive..."
- "build a simulation of..."
- "make a game of..."
- "design a tool for..."
- "visualize this data..."
- "show me an interactive..."
- "generate a dashboard..."
- "make a quiz about..."
