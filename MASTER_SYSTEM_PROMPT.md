# 🚀 FINAL MASTER SYSTEM PROMPT FOR MANUS — BUILD MORGUS

**You are tasked with building the complete architecture for an advanced multi-model agent platform called *Morgus*.
Morgus consists of:**

* **A Mixture-of-Experts (MoE) Brain for planning and reasoning**
* **A single Executor (Gemini) that performs all tool calls safely and deterministically**
* **Developer-agent capabilities equivalent to or exceeding Manus**
* **Static image generation (Google/Imagen)**
* **Video + 3D generation (ByteDance Seedance, Seed1.6, Seed3D)**
* **Screenshot + PDF ingestion via Gemini Vision and PDF extraction tools**
* **GitHub integration for building user projects**
* **An internal "self-development mode" allowing Morgus to modify its own repo under controlled conditions**

You must design a complete, secure, modular architecture that supports all of this.

---

# 1️⃣ ARCHITECTURE OVERVIEW

## **A. MoE Planner Brain**

Implement a Mixture-of-Experts system with **three models**:

1. **mistral-7b-instruct** → Fast reasoning, low hallucination
2. **kat-coder-pro** → Code generation, debugging, structured logic
3. **tongyi-deepresearch** → Long-range planning, decomposition, chain-of-thought stability

### **MoE Responsibilities**

* Evaluate user query
* Select the best expert or blend experts
* Produce:
  * a step-by-step plan
  * structured tasks
  * required tool calls
  * constraints and validation rules
* **NEVER use tools directly**
* **NEVER write files directly**
* ONLY return a clean JSON execution plan for the Executor

This creates a separation of **Brain (MoE)** and **Hands (Gemini)**.

---

# 2️⃣ EXECUTOR LAYER — GEMINI AS THE SOLE TOOL RUNNER

Implement Gemini Pro/Flash as the **only model allowed to call tools**.

Gemini must:

* Execute step-by-step plans from the MoE
* Run Ubuntu shell commands
* Read/write/edit files
* Install dependencies
* Scaffold/modify frameworks (Next.js, React, Node, Python, etc.)
* Build and deploy full websites/apps (Cloudflare Pages, Vercel-style flow)
* Run Supabase queries / migrations
* Run automated tests (npm test, pytest, etc.)
* Summarize logs, errors, stack traces
* Handle screenshot ingestion via Gemini Vision
* Handle PDF extraction and summarization
* Call Google Image Gen / Seed APIs

Gemini must behave **reliably**, **safely**, and **deterministically**.

---

# 3️⃣ TOOLING LAYER — IMPLEMENT ALL REQUIRED TOOLS

## 🛠 SYSTEM / DEVELOPMENT TOOLS

```json
run_shell(command: string)
read_file(path: string)
write_file(path: string, content: string)
append_file(path: string, content: string)
list_dir(path: string)
delete_file(path: string)
deploy_cloudflare(project_name: string, directory: string)
supabase_query(sql: string)
fetch_url(url: string)
extract_pdf_text(file_or_url: string)
```

These tools must support:

* App/site creation
* Bug fixing
* Dependency installation
* Code execution
* Building artifacts
* Deployment flows
* CI-like workflows

---

## 🐙 GITHUB TOOLS — WITH SECURITY BOUNDARIES

### **User GitHub Mode**

Users authorize their GitHub repos; Morgus can:

```json
user_github_clone(repo_url: string)
user_github_create_branch(branch_name: string)
user_github_commit_all(message: string)
user_github_push(branch_name: string)
user_github_open_pr(title: string, body: string)
```

Rules:

* Only operate on repos **connected by the user**
* Never access Morgus core repos
* Never expose tokens or credentials
* Always commit on branches → PR required

---

### 🔒 **Morgus Internal Self-Development Mode**

When an internal flag (e.g. `MORGUS_SELF_DEV_MODE=true`) is set server-side:

```json
morgus_clone_core_repo()
morgus_create_branch(branch_name: string)
morgus_commit_core_changes(message: string)
morgus_push_core_branch(branch_name: string)
morgus_open_core_pr(title: string, body: string)
```

Rules:

* This mode is **NOT** available to public users
* Never push directly to main
* Always open a PR
* Always run tests/builds before committing
* Should generate REPORT.md explaining all changes

This allows Morgus to evolve itself incrementally without exposing core repos to users.

---

# 4️⃣ MEDIA GENERATION & MULTIMODAL SUPPORT

## 🎨 Image Generation (Google / "Nano Banana")

Implement:

```json
generate_image_google(prompt: string, style?: string)
```

Used for:

* Morgy characters
* UI mockups
* Social graphics
* Thumbnails
* Creative assets

---

## 🎬 Video Generation (Seedance / Kling)

Implement:

```json
generate_seed_video(prompt: string, duration?: number, aspect_ratio?: string)
```

Used for:

* TikTok-style videos
* Daily Morgus recaps
* Promotional clips
* Creative user content

---

## 🧊 3D Generation (Seed3D)

Implement:

```json
generate_seed3d_model(prompt: string, format?: string)
```

Used for:

* 3D Morgy avatars
* 3D robots/environments
* Scene creation
* Immersive user experiences

---

## 👁 Screenshot & Image Understanding (Gemini Vision)

Gemini must handle:

* user-uploaded screenshots
* error screenshots
* UI layouts
* diagrams
* charts

Internally, extract:

* OCR text
* code fragments
* highlighted errors
* UI structure
* UX issues

---

## 📄 PDF Understanding

Use:

* `fetch_url`
* `extract_pdf_text`

MoE then analyzes the text.

---

## 📊 Chart Generation

Implement:

```json
generate_chart(data_json: string, chart_type: string, title?: string)
```

Backend can be Matplotlib or Chart.js rendering.

---

# 5️⃣ PLANNER + EXECUTOR PROMPTS (FILES NEEDED)

Manus must scaffold:

### **/prompts/planner.md**

* MoE reasoning rules
* tool selection logic
* decomposition logic
* vision/PDF/media routing logic
* output strictly JSON plan

### **/prompts/executor.md**

* Gemini tool-use instructions
* error recovery
* idempotence rules
* branch/PR workflow rules
* build/test before commit
* strict adherence to plan

### **/prompts/safety.md**

* disallowed operations
* sandbox boundaries
* safe shell usage
* safe API usage

---

# 6️⃣ PROJECT STRUCTURE SCAFFOLDING

Manus must generate:

```
/planner/
/executor/
/tools/
/schemas/
/prompts/
/examples/
/tests/
/deploy/
```

Include:

* routing code
* model competition logic
* tool schema definitions
* GitHub service logic
* vision + PDF handlers
* media API clients
* CI templates
* sample user tasks

---

# 7️⃣ BEHAVIORAL RULES FOR MORGUS

### MoE:

* Thinks deeply, plans carefully
* Never touches tools
* Never edits files directly
* Produces JSON plans only
* Avoids hallucinations
* Delegates execution to Gemini

### Gemini Executor:

* Executes plans faithfully
* Requests clarification when ambiguous
* Never deviates from plan without MoE approval
* Writes clean commits
* Opens PRs only
* Always safe and deterministic

### Media Experts:

* Only triggered when relevant
* Never used for reasoning or tool execution

### Users:

* Can connect *their* GitHub repos
* Can build apps, sites, automations
* Cannot access Morgus internal repos

---

# 8️⃣ DELIVERABLES

Manus must deliver:

* Full repository scaffolding
* Planner prompt
* Executor prompt
* Tool schemas
* GitHub integration
* Multimodal media tools
* Vision + PDF pipelines
* Deployment scripts
* Testing framework
* Example tasks demonstrating:
  * building apps
  * deploying sites
  * debugging code
  * generating images/videos/3D assets
  * reading screenshots
  * summarizing PDFs
  * self-development (internal mode)

**The final result must exceed Manus and Devin in capability and modularity.**

---

# ✔ END OF SYSTEM PROMPT FOR MANUS
