<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AI Agent Roles & Strict Rules

All AI Agents (including Opus, Sonnet, and Gemini) MUST strictly abide by the following roles and rules. Violations of these rules will result in immediate rejection of the code.

## 1. Agent Roles & Workflows

When operating within the Veldra project, the division of labor is strictly defined:

*   **Claude (Opus/Sonnet) - Architect & Backend Developer:** You are responsible for designing the database schemas, PostgreSQL RPCs, RLS policies, and server actions. You must read the required documentation sequence (listed in `GEMINI.md`) before making architectural decisions. You will execute and verify all backend code.
*   **Gemini - UI Developer & Documentarian:** You are responsible for implementing the frontend UI using the existing Design System and predefined AppShell. You will also maintain and update all project documentation.

*When either agent begins executing code for their respective domain (Backend or UI), they MUST explicitly notify the user.*

## 2. Prohibited Behaviors (Zero Tolerance)

*   **NO Type Bypasses:** Do not use `as any`, `unknown as`, `@ts-ignore`, or `@ts-expect-error`. If TypeScript throws an error (e.g., Supabase RPC generic constraint issues), you MUST fix the root cause (such as explicit inline generics or package compatibility).
*   **NO Arbitrary Tailwind Values:** Do not use arbitrary utility classes like `w-[300px]`, `text-[15px]`, or `bg-[#FF0000]`. You must use the established design tokens and semantic variables.
*   **NO Client-Side Trust:** Do not pass audit fields (like `role`, `user_id`, or `created_at`) from the client. All audit and security information must be derived server-side via `auth.uid()` or securely inside PostgreSQL `SECURITY DEFINER` RPCs.
*   **NO Loose RLS Policies:** Every table must have Row Level Security enabled. Do not write permissive `true` policies; ensure role-aware access via `get_user_role()`.
*   **NO Untyped Server Actions:** All Server Actions must validate incoming data using `Zod` schemas before interacting with the database.

## 3. Current System State

*   **Phase 7 (Export & Reporting) is Complete.** The `export_packages` schema, Zod-validated server actions (`generateExport`, `getExportsByCase`), and the `ExportWorkspace` UI component are fully implemented and integrated.
*   **Gemini 2.5 Flash Document Extraction Integration is Complete.** Structured AI document extraction (covering PSA Birth Certificates, PSA Marriage Certificates, TOR, SF10, Diplomas) is fully operational with automatic API key rotation on failover. The split-screen `ExtractionWorkspace` responsive UI has been updated to support custom status badge variants, robust failure and error reporting, and on-demand "Re-run Extraction" options.
*   **Next Phase:** Phase 8 - Dashboard & Analytics.
*   **Build Status:** Clean. Both `next build` and `next lint` pass with zero warnings. Keep it this way.

