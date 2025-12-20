# OpenAI Skills - Key Takeaways for Morgus

## Article Summary
From Simon Willison - December 12, 2025

## What Are Skills?

Skills are a lightweight mechanism for teaching AI agents specialized capabilities. A skill is simply a folder containing a Markdown file (SKILL.md) with instructions, plus optional extra resources and scripts. Any LLM tool that can navigate and read from a filesystem can use them.

## Key Insight

Simon Willison called this in October: "Claude Skills are awesome, maybe a bigger deal than MCP." The fact that OpenAI adopted them within two months validates this prediction.

## How Skills Work

**Structure:** A skill folder contains SKILL.md with instructions, plus optional scripts and resources. The agent reads the skill file and follows its guidance for specific tasks.

**Discovery:** Agents can list available skills and load them on demand. Skills are stored in a standard location (e.g., ~/.codex/skills or /home/oai/skills).

**Execution:** When a relevant task comes up, the agent reads the skill file and follows its instructions. Skills can include code templates, best practices, and step-by-step workflows.

## OpenAI's Implementation

**ChatGPT:** Code Interpreter now has /home/oai/skills folder with skills for spreadsheets, docx, and PDFs. For PDFs, they convert to per-page PNGs and use vision models to preserve layout/graphics.

**Codex CLI:** Skills stored in ~/.codex/skills. Run with --enable skills flag. Skills are discovered automatically and can be listed with "list skills" command.

## Example Skill Usage

Simon created a "datasette-plugin" skill that teaches Codex how to write Datasette plugins. When prompted to create a cowsay plugin, Codex used the skill and wrote working code on the first try.

## Why Skills Matter

Skills provide a standardized way to teach agents domain-specific knowledge without fine-tuning. They're portable across different AI platforms (Anthropic, OpenAI, potentially others). The specification is intentionally lightweight, making adoption easy.

## Applicability to Morgus

Morgus could implement a skills system to:
- Store domain-specific knowledge (website templates, code patterns)
- Learn user preferences over time
- Share skills between users
- Enable community-contributed capabilities
- Compete with Anthropic/OpenAI on agent extensibility
