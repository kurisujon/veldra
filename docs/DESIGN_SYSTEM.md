# Design System

## Core Philosophy
Minimalist, professional, and human-centered. The UI must not feel "AI-generated". Veldra provides a clean and comfortable environment for long document review sessions.

## Mandatory Design Tokens
The following tokens are fixed. No alternatives or arbitrary values are permitted.

### Colors
- **Background**: `#FAFAF8`
- **Surface**: `#FFFFFF`
- **Primary Text**: `#111827`
- **Secondary Text**: `#6B7280`
- **Primary Accent**: `#800000`
- **Success**: `#16A34A`
- **Warning**: `#D97706`
- **Error**: `#DC2626`

### Radius Tokens
- **Button**: `12px`
- **Input**: `12px`
- **Card**: `16px`
- **Modal**: `20px`

### Spacing Scale
Must use strict values. No deviations.
- `4px`
- `8px`
- `12px`
- `16px`
- `24px`
- `32px`
- `48px`
- `64px`

## Token Enforcement
These tokens define the entirety of the Veldra visual language. Do not introduce new colors, radius values, or spacing increments without a formal update to this architecture document.

## Typography Recommendation
- **Primary UI Font**: Inter
- **Reading / Draft / Print Font**: Source Serif 4
- **Fallback strategy**: use system sans-serif and serif stacks if webfont loading fails.

### Usage rule
- Use `Inter` (`font-sans`) for all product interface elements and structured UI (dashboards, tables, forms, modals).
- Use `Source Serif 4` (`font-serif`) for document-like reading surfaces, generated drafts, and print-oriented content.
