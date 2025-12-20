# Gemini Generative UI Research

## Source: Google Research Blog (November 18, 2025)

## What is Generative UI?

Generative UI is a capability where an AI model generates not only content but an **entire user experience**. It dynamically creates immersive visual experiences and interactive interfaces such as web pages, games, tools, and applications that are automatically designed and fully customized in response to any prompt.

## Two Implementations in Gemini App

### 1. Dynamic View
- Gemini designs and codes a **fully customized interactive response** for each prompt
- Uses Gemini's agentic coding capabilities
- Adapts content and features based on context (e.g., explaining microbiome to a 5-year-old vs adult)
- Creates completely different interfaces for different tasks (social media gallery vs trip planning)

**Use Cases:**
- Learning about probability (interactive simulations)
- Event planning (practical task tools)
- Fashion advice (visual galleries)
- Van Gogh gallery with life context
- Educational content with interactive elements

### 2. Visual Layout
- Magazine-style immersive content presentation
- Moves beyond plain text with rich visual formatting
- More focused on presentation than interactivity

## How It Works (Technical Implementation)

The system uses Gemini 3 Pro with three key additions:

1. **Tool Access**: Server provides access to image generation, web search, and other tools
2. **Crafted System Instructions**: Detailed instructions including goals, planning, examples, technical specs, formatting, tool manuals, and error avoidance tips
3. **Post-Processing**: Outputs pass through processors to address common issues

## Key Findings

- Human raters **strongly prefer** generative UI interfaces over standard LLM text outputs
- Performance strongly depends on the underlying model capability
- Newer models perform substantially better
- Can be configured for consistent styling across all outputs

## Opportunities for Morgus

### Skills to Add Based on This Research:

1. **Interactive Learning Generator**
   - Create educational simulations
   - Interactive explanations with visualizations
   - Adaptive content based on audience level

2. **Visual Gallery Creator**
   - Magazine-style content layouts
   - Image galleries with context
   - Portfolio presentations

3. **Interactive Tool Builder**
   - Calculators and converters
   - Planning tools
   - Decision-making interfaces

4. **Game/Simulation Generator**
   - Educational games
   - Interactive demonstrations
   - Probability/statistics visualizers

5. **Dashboard Generator**
   - Data dashboards
   - Analytics interfaces
   - Real-time monitoring displays


---

## Claude Artifacts Catalog - Inspiration for New Skills

The Claude Artifacts catalog organizes interactive tools into these categories:

| Category | Description | Example Artifacts |
|----------|-------------|-------------------|
| **Be Creative** | Art tools, design apps, AI-powered content generators | Mood canvas, Word cloud maker, Mood palette |
| **Learn** | Educational courses, tutorials, step-by-step guides | PyLingo, Molecule studio, Language learning tutor |
| **Life Hacks** | Calculators, productivity tools, everyday utilities | QR code generator, Meeting notes summary, 5 whys |
| **Data Analysis** | Charts, dashboards, data visualization tools | CSV Data Visualizer, Project dashboard generator |
| **Play a Game** | Games, puzzles, interactive entertainment | AI platformer, Slime soccer, Trivia, Join dots |
| **Code & Tech** | Programming tools, API clients, developer utilities | CodeVerter, Coding Coach, Color contrast checker |
| **Touch Grass** | Relaxation apps, calming experiences, mindfulness | Forest explorer, Sakura serenity, Stories in the sky |

### Notable Artifacts to Inspire Morgus Skills:

1. **PRD To Prototype** - Turn Product Requirements Docs into working prototypes
2. **Project Dashboard Generator** - Visual project status boards with Gantt charts
3. **CSV Data Visualizer** - Upload CSV and describe what you want to see
4. **CodeVerter** - Translate code between programming languages
5. **Coding Coach** - Analyze code and help write better code
6. **Interactive Drum Machine** - Describe a beat and generate drum patterns
7. **Bedtime Story Generator** - Personalized stories based on interests
8. **Raw Note Transformer** - Turn fragmented notes into polished language
9. **One-pager PRD Maker** - Turn vague thoughts into clear PRDs
10. **My Weekly Chronicle** - Turn your week into a personalized newspaper

---

## New Skills to Add to Morgus

Based on research from Gemini Generative UI and Claude Artifacts:

### High Priority (Unique & Powerful)

1. **Interactive Learning Generator** - Create educational simulations and interactive explanations
2. **Dashboard & Visualization Builder** - Generate project dashboards, Gantt charts, data visualizations
3. **PRD to Prototype** - Turn requirements docs into working prototypes instantly
4. **Code Translator** - Convert code between any programming languages
5. **Interactive Game Builder** - Create simple games, quizzes, and interactive experiences

### Medium Priority (Useful Utilities)

6. **QR Code Generator** - Generate QR codes for URLs, text, contact info
7. **Meeting Notes Transformer** - Turn raw notes into professional summaries
8. **Flashcard Generator** - Create study flashcards from any content
9. **Weekly/Daily Chronicle** - Turn activities into personalized newsletters
10. **Color Palette Generator** - Extract colors from images or generate palettes

### Creative/Fun

11. **Story Generator** - Personalized stories for any audience
12. **Trivia Game Creator** - Generate trivia questions on any topic
13. **Mood-Based Art Generator** - Create algorithmic art based on mood/input
14. **Interactive Music Tools** - Drum machines, chord progressions, etc.
