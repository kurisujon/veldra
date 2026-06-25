# Folder Structure

## Architecture Rule
Veldra strictly adheres to a feature-based folder architecture.

## Mandatory Directory Structure

```text
src/
├── app/
├── components/
│   ├── ui/
│   ├── layouts/
│   └── review/
├── features/
│   ├── cases/
│   ├── uploads/
│   ├── findings/
│   └── drafts/
├── hooks/
├── lib/
└── types/
```

## Directory Responsibilities

- **`src/app/`**: Next.js App Router routing. Only page files, layouts, and route handlers. Minimal logic.
- **`src/components/ui/`**: Generic, highly reusable design system components (Button, Input, Modal).
- **`src/components/layouts/`**: Structural layout wrappers (Sidebar, PageHeader).
- **`src/components/review/`**: Complex components specifically for the review workspace (DocumentViewer, DocumentComparisonPanel).
- **`src/features/`**: Domain-specific business logic, state, and feature-bound components. Grouped by domain (cases, uploads, findings, drafts).
- **`src/hooks/`**: Shared custom React hooks.
- **`src/lib/`**: Utility functions, API clients, formatters, and external service wrappers.
- **`src/types/`**: Global TypeScript definitions and shared interfaces.
