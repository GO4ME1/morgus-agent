# SQL Agent with Dynamic Context - Key Takeaways for Morgus

## Article Summary
From Ashpreet Bedi - December 15, 2025

## Core Architecture

The article describes a **self-improving Text-to-SQL agent** with two paths:

**Online Path (Query Time):** Retrieves schema and query patterns from a knowledge base using hybrid search, then generates and executes SQL.

**Offline Path (Learning):** After successful runs, stores queries in knowledge base for future use. Creates a self-improving feedback loop while keeping online path stable.

## Query Flow

The agent follows this sequence: User question → Retrieve context via hybrid search (question text, detected entities, database introspection) → Augment input with dynamic context (knowledge snippets, rules, constraints) → Generate SQL → Execute in safe environment → Analyze results → Return answer → Optionally save successful query to knowledge base.

## Knowledge Base Design

Three types of information stored:

**Table Information:** Schema, column metadata, query rules, common gotchas (e.g., "Use TO_DATE function when filtering by date").

**Sample Queries:** Common patterns, best practices, how to retrieve metrics/KPIs. Avoids reinventing the wheel.

**Business Semantics:** Maps organizational terminology to database structure. Critical for understanding user intent.

## Key Improvements Suggested

**Separate Learning Path:** Run continuous learning after every agent run to keep knowledge base current.

**Regression Harness:** Test knowledge base before/after updates to ensure it still works correctly.

## Applicability to Morgus

This pattern could enable Morgus to:
- Learn from successful tool executions
- Build a knowledge base of working code patterns
- Improve over time without retraining
- Handle database queries for full-stack apps (Supabase integration)
