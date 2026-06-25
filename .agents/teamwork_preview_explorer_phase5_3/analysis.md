# Design System Audit & Styling Rules for Phase 5 Components

This report presents the findings of the Design System audit and outlines the styling rules for the new UI components in Phase 5: `FindingCard` and `DocumentComparisonPanel`. It ensures complete compliance with the Veldra Design System, mapping all styles strictly to the tokens registered in `tailwind.config.ts` and `docs/DESIGN_SYSTEM.md`.

---

## 1. Verified Design System Tokens

From the audit of `docs/DESIGN_SYSTEM.md`, `tailwind.config.ts`, and `src/app/globals.css`, the following tokens define the entirety of the allowed visual styles. **No arbitrary values or unregistered classes may be used.**

### A. Color Tokens & Tailwind Classes
| Semantic Token | Hex Value | Background Class | Text Class | Border Class |
| :--- | :--- | :--- | :--- | :--- |
| **Background** | `#FAFAF8` | `bg-background` | `text-background` | `border-background` |
| **Surface** | `#FFFFFF` | `bg-surface` | `text-surface` | `border-surface` |
| **Primary Text** | `#111827` | `bg-text-primary` | `text-text-primary` | `border-text-primary` |
| **Secondary Text** | `#6B7280` | `bg-text-secondary` | `text-text-secondary` | `border-text-secondary` |
| **Primary Accent** | `#5B6EF5` | `bg-accent` | `text-accent` | `border-accent` |
| **Success** | `#16A34A` | `bg-success` | `text-success` | `border-success` |
| **Warning** | `#D97706` | `bg-warning` | `text-warning` | `border-warning` |
| **Error** | `#DC2626` | `bg-error` | `text-error` | `border-error` |

*Note: For transparency/opacity, Tailwind's border/background opacity utility must be used, e.g., `border-text-secondary/10`, `bg-error/5`, or `bg-black/50` for overlays.*

### B. Radius Tokens
- **Button Radius (12px)**: `rounded-button`
- **Input Radius (12px)**: `rounded-input`
- **Card Radius (16px)**: `rounded-card`
- **Modal Radius (20px)**: `rounded-modal`

### C. Spacing Scale Tokens
Spacing must strictly map to the custom tokens registered in `theme.extend.spacing`. **Do not use default tailwind numeric scales (e.g. `p-4`, `gap-3`) or arbitrary values (e.g. `p-[10px]`).**
- **xs** (4px): `p-xs`, `m-xs`, `gap-xs`, `space-x-xs`
- **sm** (8px): `p-sm`, `m-sm`, `gap-sm`, `space-x-sm`
- **md** (12px): `p-md`, `m-md`, `gap-md`, `space-x-md`
- **lg** (16px): `p-lg`, `m-lg`, `gap-lg`, `space-y-lg`
- **xl** (24px): `p-xl`, `m-xl`, `gap-xl`, `space-y-xl`
- **2xl** (32px): `p-2xl`, `m-2xl`, `gap-2xl`
- **3xl** (48px): `p-3xl`, `m-3xl`
- **4xl** (64px): `p-4xl`, `m-4xl`

### D. Width & Height Sizing Tokens
The following custom widths and heights are configured:
- `w-sidebar` (`250px`)
- `h-topbar` (`64px`)
- `h-input` (`40px`)
- `min-h-textarea` (`80px`)
- `max-w-modal` (`500px`)
- *For general dimensions, use relative/flex layout classes: `w-full`, `h-full`, `w-screen`, `h-screen`, `max-w-7xl`, `flex-1`, `w-1/2`, `grid-cols-2`, etc.*

### E. Typography Tokens
- **Font Family**: `font-sans` (Inter)
- **Size**:
  - `text-small` (12px)
  - `text-body` (14px)
  - `text-heading` (16px)
  - `text-title` (24px)
- **Weight**: `font-normal`, `font-medium`, `font-semibold`, `font-bold`

---

## 2. Styling Rules for `FindingCard`

**Target Location**: `src/features/findings/components/FindingCard.tsx`
**Purpose**: Displays a specific discrepancy detected by the Comparison Engine.

### Structure & Styling Requirements
1. **Outer Container**:
   - Must extend or style `<Card>` to retain consistent shadow and 16px radius.
   - **Base styles**: `p-lg flex flex-col gap-md transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent`
   - **Default border**: `border-text-secondary/10`
   - **Hover border**: `hover:border-text-secondary/30`
   - **Selected / Active State**: `border-accent ring-1 ring-accent`
2. **Category and Severity Header**:
   - **Layout**: Flexbox container `flex justify-between items-center w-full`
   - **Category label**: `text-small font-semibold text-text-secondary uppercase tracking-wider`
   - **Severity badge** (maps to `<Badge>` variants):
     - *High*: `<Badge variant="error">High</Badge>`
     - *Medium*: `<Badge variant="warning">Medium</Badge>`
     - *Low*: `<Badge variant="neutral">Low</Badge>`
3. **Title and Description Area**:
   - **Title**: `<h4 className="text-heading font-semibold text-text-primary">`
   - **Description**: `<p className="text-small text-text-secondary leading-relaxed">`
4. **Status Indication**:
   - When not in `Open` state, display status using the `<Badge>` component:
     - *Accepted*: `<Badge variant="primary">Accepted</Badge>`
     - *Resolved*: `<Badge variant="success">Resolved</Badge>`
     - *Ignored*: `<Badge variant="neutral">Ignored</Badge>`
5. **Action Buttons (Only for `Open` status)**:
   - **Layout**: Flexbox alignment `flex gap-sm justify-end w-full mt-sm`
   - **Buttons**:
     - *Accept*: `<Button variant="primary" className="px-md py-xs text-small">Accept</Button>`
     - *Resolve*: `<Button variant="secondary" className="px-md py-xs text-small">Resolve</Button>`
     - *Ignore*: `<Button variant="ghost" className="px-md py-xs text-small text-text-secondary hover:text-text-primary">Ignore</Button>`

### Sample Tailwind Markup Reference
```tsx
import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { Database } from '@/types/database';

type Finding = Database['public']['Tables']['findings']['Row'];

interface FindingCardProps {
  finding: Finding;
  isSelected?: boolean;
  onSelect?: () => void;
  onAccept?: () => void;
  onResolve?: () => void;
  onIgnore?: () => void;
}

export function FindingCard({ finding, isSelected, onSelect, onAccept, onResolve, onIgnore }: FindingCardProps) {
  const isOpen = finding.status === 'Open';

  return (
    <Card 
      onClick={onSelect}
      className={`p-lg flex flex-col gap-md transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent ${
        isSelected ? 'border-accent ring-1 ring-accent' : 'hover:border-text-secondary/30'
      }`}
    >
      <div className="flex justify-between items-center w-full">
        <span className="text-small font-semibold text-text-secondary uppercase tracking-wider">
          {finding.category}
        </span>
        <Badge variant={finding.severity === 'High' ? 'error' : finding.severity === 'Medium' ? 'warning' : 'neutral'}>
          {finding.severity}
        </Badge>
      </div>

      <div className="flex flex-col gap-xs">
        <h4 className="text-heading font-semibold text-text-primary">{finding.title}</h4>
        <p className="text-small text-text-secondary leading-relaxed">{finding.description}</p>
      </div>

      <div className="flex items-center justify-between mt-xs">
        <div className="text-small text-text-secondary font-medium">
          Status: <Badge variant={isOpen ? 'warning' : finding.status === 'Accepted' ? 'primary' : finding.status === 'Resolved' ? 'success' : 'neutral'}>{finding.status}</Badge>
        </div>
        
        {isOpen && (
          <div className="flex gap-sm" onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" className="px-md py-xs text-small text-text-secondary hover:text-text-primary" onClick={onIgnore}>
              Ignore
            </Button>
            <Button variant="secondary" className="px-md py-xs text-small" onClick={onResolve}>
              Resolve
            </Button>
            <Button variant="primary" className="px-md py-xs text-small" onClick={onAccept}>
              Accept
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
```

---

## 3. Styling Rules for `DocumentComparisonPanel`

**Target Location**: `src/components/review/DocumentComparisonPanel.tsx`
**Purpose**: Dual-pane side-by-side display for synchronized scrolling and document field matching.

### Structure & Styling Requirements
1. **Outer Layout Container**:
   - Must use grid for exact side-by-side alignment.
   - **Classes**: `grid grid-cols-2 gap-lg w-full h-full min-h-0` (uses spacing scale `lg` and ensures scroll controls inside container work via `min-h-0`).
2. **Pane Wrapper (Left & Right Column)**:
   - Must use `<Card>` to contain content beautifully.
   - **Classes**: `flex flex-col h-full overflow-hidden bg-surface border border-text-secondary/10 rounded-card shadow-sm`
3. **Pane Header**:
   - **Classes**: `flex items-center justify-between p-md border-b border-text-secondary/10 bg-background/50 rounded-t-card` (separates metadata header, rounded-t-card matches card rounding style).
   - **Filename / Label**: `<span className="font-semibold text-text-primary text-body truncate">`
   - **Type Tag**: `<Badge variant="primary">{documentType}</Badge>`
4. **Pane Content Area (Scroll Container)**:
   - **Classes**: `flex-1 overflow-y-auto p-lg bg-surface` (allows separate scrollable areas).
5. **Comparison Field Row**:
   - **Layout**: `flex flex-col gap-xs py-sm border-b border-text-secondary/5 last:border-0`
   - **Header label**: `<span className="text-small text-text-secondary font-medium uppercase tracking-wider">FieldName</span>`
   - **Value Container**:
     - *Default / Matching state*: `p-sm bg-background border border-text-secondary/10 rounded-input text-body text-text-primary font-medium`
     - *Mismatch / Discrepancy state*: `p-sm bg-error/5 border border-error/20 rounded-input text-body text-error font-medium`
   - **Comparison Badge Indicator (optional)**:
     - Match: `<Badge variant="success">Match</Badge>`
     - Mismatch: `<Badge variant="error">Mismatch</Badge>` or `<Badge variant="warning">Conflict</Badge>`

### Sample Tailwind Markup Reference
```tsx
import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface FieldComparison {
  fieldName: string;
  leftValue: string;
  rightValue: string;
  isMatch: boolean;
}

interface DocumentComparisonPanelProps {
  leftDocName: string;
  leftDocType: string;
  rightDocName: string;
  rightDocType: string;
  comparisons: FieldComparison[];
}

export function DocumentComparisonPanel({ 
  leftDocName, 
  leftDocType, 
  rightDocName, 
  rightDocType, 
  comparisons 
}: DocumentComparisonPanelProps) {
  return (
    <div className="grid grid-cols-2 gap-lg w-full h-full min-h-0">
      {/* Left Document Pane */}
      <Card className="flex flex-col h-full overflow-hidden">
        <div className="flex items-center justify-between p-md border-b border-text-secondary/10 bg-background/50 rounded-t-card">
          <span className="font-semibold text-text-primary text-body truncate max-w-[70%]" title={leftDocName}>
            {leftDocName}
          </span>
          <Badge variant="primary">{leftDocType}</Badge>
        </div>
        <div className="flex-1 overflow-y-auto p-lg bg-surface flex flex-col gap-md">
          {comparisons.map((item, idx) => (
            <div key={idx} className="flex flex-col gap-xs py-sm border-b border-text-secondary/5 last:border-0">
              <div className="flex justify-between items-center">
                <span className="text-small text-text-secondary font-medium uppercase tracking-wider">
                  {item.fieldName}
                </span>
                {!item.isMatch && <Badge variant="error">Conflict</Badge>}
              </div>
              <div className={`p-sm border rounded-input text-body font-medium ${
                item.isMatch 
                  ? 'bg-background border-text-secondary/10 text-text-primary' 
                  : 'bg-error/5 border-error/20 text-error'
              }`}>
                {item.leftValue || <span className="italic text-text-secondary">Missing Field</span>}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Right Document Pane */}
      <Card className="flex flex-col h-full overflow-hidden">
        <div className="flex items-center justify-between p-md border-b border-text-secondary/10 bg-background/50 rounded-t-card">
          <span className="font-semibold text-text-primary text-body truncate max-w-[70%]" title={rightDocName}>
            {rightDocName}
          </span>
          <Badge variant="primary">{rightDocType}</Badge>
        </div>
        <div className="flex-1 overflow-y-auto p-lg bg-surface flex flex-col gap-md">
          {comparisons.map((item, idx) => (
            <div key={idx} className="flex flex-col gap-xs py-sm border-b border-text-secondary/5 last:border-0">
              <div className="flex justify-between items-center">
                <span className="text-small text-text-secondary font-medium uppercase tracking-wider">
                  {item.fieldName}
                </span>
                {!item.isMatch && <Badge variant="error">Conflict</Badge>}
              </div>
              <div className={`p-sm border rounded-input text-body font-medium ${
                item.isMatch 
                  ? 'bg-background border-text-secondary/10 text-text-primary' 
                  : 'bg-error/5 border-error/20 text-error'
              }`}>
                {item.rightValue || <span className="italic text-text-secondary">Missing Field</span>}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
```
