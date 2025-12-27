# Changelog

All notable changes to the Morgus Autonomous Agent System will be documented in this file.

## [Unreleased]

### Added
- Sora 2 video generation framework (not yet enabled)
- Credit system architecture for images and videos
- User confirmation flow for video generation

### Changed
- Nothing yet

### Fixed
- Nothing yet

## [0.3.0] - 2025-12-26

### Added
- **Template System**: 18+ professional website templates
  - startup, saas, mobile-app, game, portfolio, ecommerce, restaurant, agency, blog, event
  - dating, creative, personal, product, nonprofit, education, healthcare, realestate, fitness, entertainment
- **Visual Style Variants**: 5 different visual styles per template type
  - modern-minimal, bold-dynamic, classic-professional, creative-artistic, elegant-luxury
- **Keyword-Based Detection**: Automatic template and style selection from user prompts
- **GPT-Image-1.5 Integration**: Updated from DALL-E 3 for image generation
- **Image Generator**: Automatic hero images and logos for all websites
- **Video Generator Framework**: Sora 2 integration structure (ready for opt-in)
- **Template Files**:
  - `dppm-service/src/template-generator.ts` - Main template generation logic
  - `dppm-service/src/templates/website-templates.ts` - 18+ website templates
  - `dppm-service/src/templates/website-styles.ts` - 5 visual style variants
  - `dppm-service/src/templates/app-templates.ts` - App templates
  - `dppm-service/src/image-generator.ts` - GPT-Image-1.5 integration
  - `dppm-service/src/video-generator.ts` - Sora 2 framework

### Changed
- **Image Generation Model**: Updated from DALL-E 3 to GPT-Image-1.5
- **Deployment Preference**: Now prefers Cloudflare Pages over GitHub Pages
- **Worker Response Format**: Shows clean deployment URLs instead of HTML code

### Fixed
- **Cloudflare Pages Hash Calculation**: Corrected to use SHA-256 of `(base64Content + extension)` truncated to 32 hex characters
- **Auth State Persistence**: Fixed auth state not persisting on page refresh in console
- **Recent Chats Loading**: Fixed recent chats not loading after navigation
- **User Filtering**: Added user_id filtering for better security

### Deployed
- **DPPM Service**: https://morgus-deploy.fly.dev (Fly.io)
- **Successful Websites**:
  - Sweet Dreams Bakery: https://sweet-dreams-bakery.pages.dev
  - Carl the Unicorn: https://create-a-landing-page-for-carl-mjnnw1n8.pages.dev

## [0.2.0] - 2025-12-24

### Added
- **Learning System**: Database schema and service-level updates
  - `dppm_reflections` table for task outcomes
  - `model_performance` table for aggregate metrics
  - `user_learning_preferences` table for personalized preferences
  - `task_patterns` table for successful patterns
- **Answer Caching**: Semantic search for frequently accessed answers
- **Privacy Controls**: Opt-in/opt-out for learning system

### Changed
- **Architecture**: Updated to four-block model (Perception, Reasoning, Memory, Execution)
- **Database**: Added pgvector for vector-based knowledge base

## [0.1.0] - 2025-12-20

### Added
- **Initial Release**: Basic autonomous agent system
- **5-Phase Workflow**: Research → Plan → Build → Execute → Finalize
- **Multi-Model Support**: GPT-4, GPT-5.1 routing
- **Sandbox Execution**: Docker-based secure environment
- **Tool Integration**: File operations, shell commands, git, web search
- **Real-Time Updates**: Live task monitoring via Supabase
- **Cloudflare Deployment**: Automated deployment to Cloudflare Pages/Workers
- **Web Console**: React-based UI for task management

### Technology Stack
- Backend: Python 3.11+ (orchestrator)
- Frontend: React + TypeScript
- Database: Supabase (PostgreSQL)
- Deployment: Cloudflare Pages, Fly.io
- AI Models: OpenAI API

---

## Version Numbering

Morgus follows [Semantic Versioning](https://semver.org/):
- **MAJOR**: Incompatible API changes
- **MINOR**: New functionality (backwards-compatible)
- **PATCH**: Bug fixes (backwards-compatible)

## Categories

- **Added**: New features
- **Changed**: Changes to existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Security vulnerability fixes
