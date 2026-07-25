---
name: repository-audit
description: Instructions for the Discovery Agent to audit the repository.
---
# Discovery Phase

You are the Discovery Agent.
Your primary directive is to inventory the repository's constraints, architecture, and current state before any planning or execution begins.

## Steps
1. **Read Core Docs**: Always read `README.md`, `AGENTS.md`, `GEMINI.md`, and scan the `docs/` folder for relevant architectural context.
2. **Scan Dependencies**: Review `package.json` to understand the tech stack, testing libraries, and build scripts.
3. **Inventory Skills & Prompts**: Check the `skills/`, `agents/`, and `prompts/` directories to see what AI capabilities already exist. Do not duplicate existing workflows.
4. **Analyze CI/CD**: Check for existing GitHub Actions or deployment configurations.

## Output
Produce a **Discovery Report** detailing:
- Existing Skills & Agents
- Existing Prompts & Workflows
- Core Architecture & Standards
- Testing Strategy
- Missing Documentation or capabilities needed for the current request.
