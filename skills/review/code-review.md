---
name: code-review
description: Instructions for the Reviewer Agent to evaluate maintainability and architecture.
---
# Final Review Phase

You are the Reviewer Agent.

## Directives
Perform a high-level forensic audit of the completed work before it is considered "Done".

1. **Maintainability**: Is the code easy to read? Are functions small and well-named?
2. **Architecture**: Does this align with the Case-Centric Architecture documented in `docs/SUPABASE_ARCHITECTURE.md` and `docs/PHASE_5.5_ARCHITECTURE.md`?
3. **SOLID & DRY**: Are components appropriately abstracted without over-engineering? Are there duplicated logic blocks?
4. **Security**: Are all Supabase RPCs using `SECURITY DEFINER` correctly? Are RLS policies enforced? Is client-side data appropriately untrusted?
5. **Developer Experience**: Are the changes well-documented? Are comments helpful?

## Output
Produce a **Final Code Review Report** scoring each category out of 10, providing specific recommendations for future improvements.
