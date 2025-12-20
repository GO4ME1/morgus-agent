# Manus Context Engineering - Key Takeaways for Morgus

## Article Summary
From Manus team (Yichao 'Peak' Ji) - July 2025

## Key Principles

### 1. KV-Cache Optimization (CRITICAL)
- **Most important metric** for production AI agents
- Cached tokens cost 10x less than uncached (e.g., $0.30 vs $3.00/MTok on Claude)
- Practices:
  - Keep prompt prefix STABLE (no timestamps at start!)
  - Make context APPEND-ONLY (don't modify previous actions)
  - Ensure deterministic JSON serialization (key ordering matters)
  - Mark cache breakpoints explicitly

### 2. Tool Masking vs Removal
- DON'T dynamically add/remove tools mid-iteration
- Changing tools invalidates KV-cache
- Model gets confused when tools referenced in history disappear
- **Solution:** Use token logit masking to constrain action space
- Design tool names with consistent prefixes (browser_*, shell_*)

### 3. File System as Extended Context
- Use filesystem as "unlimited, persistent memory"
- Compression strategies should be RESTORABLE
- Keep URLs/paths even when dropping content
- Agent can read/write files on demand

### 4. Attention Manipulation via Recitation
- Manus creates/updates todo.md during tasks
- This "recites" objectives into recent context
- Prevents "lost-in-the-middle" attention issues
- Reduces goal drift in long tasks (~50 tool calls average)

### 5. Keep Errors in Context
- DON'T hide/clean up failed actions
- Leaving errors helps model learn and adapt
- Error recovery is key indicator of true agentic behavior
- Model updates beliefs when seeing failures

### 6. Avoid Few-Shot Traps
- Repetitive action patterns cause drift/hallucination
- Add structured variation in serialization
- Alternate phrasing, minor formatting noise
- Breaks pattern mimicry

## Applicability to Morgus
- [ ] Implement KV-cache optimization
- [ ] Add tool name prefixes
- [ ] Use file system for long context
- [ ] Add todo.md pattern for complex tasks
- [ ] Keep error traces in context
- [ ] Add variation to prevent few-shot traps
