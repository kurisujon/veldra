# Development Rules

## 1. Strict TypeScript
- `strict: true` must be enabled in `tsconfig.json`.
- `any` types are strictly forbidden. Use `unknown` if truly unavoidable and type-narrow later.
- All component props, API responses, and state objects must have clearly defined Interfaces or Types.

## 2. Reusability
- Never duplicate UI patterns. If a card layout is needed in two places, abstract it into a generic `<Card>` component.
- Keep business logic separate from UI components using custom hooks.

## 3. Styling
- Use Tailwind CSS exclusively.
- No arbitrary styling (e.g., `h-[43px]`). Adhere to the design system spacing and sizing scales.
- Avoid inline `style={{}}` tags entirely.

## 4. State Management
- Prefer React Context or simple state management (e.g., Zustand) over overly complex Redux setups unless necessary.
- Keep local state local; do not hoist state globally if it's only used by a single component tree.

## 5. Next.js App Router
- Follow standard App Router conventions.
- Keep Server Components separate from Client Components (`'use client'`). Maximize the use of Server Components for performance.
