# Multi-Agent Orchestration Framework

This document outlines the architecture and workflows of the Veldra Engineering Operating System, an adaptive, self-discovering multi-agent orchestration framework.

## Core Philosophy
1. **Discovery First**: No planning or execution happens until the repository is fully audited for existing documentation, skills, prompts, agents, and workflows.
2. **Reuse over Creation**: Existing skills and prompts are leveraged whenever possible. New skills are only created when a gap is identified.
3. **Strict Delegation**: Planners do not execute. QA does not fix code. Roles are strictly modularized.
4. **Continuous Learning**: The framework bootstraps itself and learns from repeated patterns to create new reusable skills.

## Agent Roles
- **Discovery Agent**: Audits the repository and inventories existing capabilities (docs, skills, prompts).
- **Knowledge Agent**: Indexes and retrieves documentation, prompts, skills, and architectural contexts.
- **Planner Agent**: Decomposes work into specific milestones, tasks, and dependencies based on Discovery output.
- **Orchestrator Agent**: Schedules, delegates, and monitors the specialist executor agents. 
- **Executor Agents**: Implement the assigned tasks.
  - *Backend (Claude)*: PostgreSQL RPCs, RLS, DB schemas, server actions (as strictly defined in `AGENTS.md`).
  - *Frontend (Gemini)*: UI components, pages, design system integration (as strictly defined in `GEMINI.md`).
- **QA Agent**: Validates functionality, builds, linting, tests, and requirements. *Never modifies code.*
- **Reviewer Agent**: Evaluates maintainability, readability, SOLID principles, DRY, security, and performance.
- **Learning Agent**: Monitors workflows to identify patterns, recommending or scaffolding new reusable skills.

## Bootstrap Sequence (The Orchestrator Loop)
Every complex task begins with this self-improving sequence:
1. **Repository Audit**: Scan for system state and constraints.
2. **Skill Discovery**: Inventory what the framework can already do.
3. **Agent Discovery**: Inventory available specialists.
4. **Prompt Discovery**: Inventory existing templates.
5. **Workflow Discovery**: Map existing processes.
6. **Gap Analysis**: Determine what new skills/agents are needed to solve the current problem.
7. **Build Missing Pieces**: Have the Learning Agent scaffold the missing requirements.
8. **Execute Task**: Delegate to Planner and Executors.

## Directory Layout
- `skills/`: Modular instruction sets categorized by lifecycle phase (`discovery`, `planning`, `execution`, `qa`, `review`, `orchestration`).
- `agents/`: Specialized agent definitions (`knowledge-agent`, `learning-agent`).
- `prompts/`: Reusable generative text prompts.
