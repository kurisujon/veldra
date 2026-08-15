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

*   **Phase 11 (Polish & QA) is Complete.** Codebase cleaned of type bypasses, Playwright E2E test suite generated (`e2e/`), loading/error boundaries and toast notifications verified.
*   **Phase 10 (Advanced Three-Stage Verification Engine) is Complete.** Applicant, Sponsor, and Relationship verification logic implemented with 3-tab `CaseFindingsWorkspace` UI and graph evidence chain tracking.
*   **Phase 8 (Dashboard & Analytics) is Complete.** `get_dashboard_analytics` RPC with scope filtering, sponsor-aware metrics, and analytics visual breakdown components.
*   **Gemini 2.5 Flash Document Extraction Integration is Complete.** Structured AI document extraction (covering PSA Birth Certificates, PSA Marriage Certificates, TOR, SF10, Diplomas, Sponsor ID/COE/ITR/Affidavit) is fully operational with automatic API key rotation on failover.
## 4. Workspace Skills & Commands

The following specialized skills are installed and available for this workspace:

*   **`demo-video-recorder`** (`/demo-video-recorder`): Generates a captioned demo video of a single Veldra UI flow using Playwright.
    *   *Trigger phrases*: `/demo-video-recorder`, `"record a demo for <flow>"`, `"make a walkthrough video of <flow>"`, `"generate a demo video for <flow>"`, or `Use the demo-video-recorder skill for <flow>`.
*   **`project-progress-docs`** (`/project-progress-docs`): Enforces progress reporting, zero-tolerance checks, and updates documentation set (`AGENTS.md`, `GEMINI.md`, `docs/`).
    *   *Trigger phrases*: `/project-progress-docs`, `"update project status"`, `"check repo state"`, or `Use the project-progress-docs skill`.


