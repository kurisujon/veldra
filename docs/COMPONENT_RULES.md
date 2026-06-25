# Component Rules

## General Enforcement
- **Strict Adherence**: No undocumented component may be introduced into the Veldra codebase.
- **Responsibility**: Components must do exactly one thing well.
- **Styling**: Must strictly consume the tokens defined in `DESIGN_SYSTEM.md`.

## Core Components Inventory

### Layout Elements
- `AppShell`: Application container
- `Sidebar`: Primary navigation
- `TopBar`: Action header
- `PageContainer`: Consistent page padding

### UI Elements
- `Button`: Primary/secondary actions
- `Card`: Content containment
- `Input`: Forms
- `Textarea`: Multi-line text
- `Badge`: Status indicators
- `Modal`: Accessible overlays for forms and actions

### 2. Input
- **Purpose**: Single-line text entry.
- **Responsibility**: Render label, input field, and error message.
- **Allowed Variants**: Default, Error, Disabled.

### 3. Textarea
- **Purpose**: Multi-line text entry.
- **Responsibility**: Render label, textarea, and error message.
- **Allowed Variants**: Default, Error.

### 4. Select
- **Purpose**: Option selection from a dropdown.
- **Responsibility**: Handle option lists, active states.
- **Allowed Variants**: Default.

### 5. Badge
- **Purpose**: Visual label for small data points.
- **Responsibility**: Render text with background.
- **Allowed Variants**: Neutral, Primary.

### 6. Card
- **Purpose**: Container for grouping content.
- **Responsibility**: Apply surface color, shadow, and 16px radius.
- **Allowed Variants**: Default, Interactive (hover state).

### 7. Modal
- **Purpose**: High-priority focused interaction.
- **Responsibility**: Overlay the screen, trap focus, apply 20px radius.
- **Allowed Variants**: Default, Alert.

### 8. Drawer
- **Purpose**: Slide-out panel for complex settings or details.
- **Responsibility**: Animate from side, manage scroll lock.
- **Allowed Variants**: Right-side.

### 9. Table
- **Purpose**: Display tabular data.
- **Responsibility**: Render headers, rows, and pagination.
- **Allowed Variants**: Default, Selectable Rows.

### 10. PageHeader
- **Purpose**: Consistent title area for pages.
- **Responsibility**: Render title, breadcrumbs, and primary action.
- **Allowed Variants**: Default, With Back Button.

### 11. StatusBadge
- **Purpose**: Indicate system status or Case status.
- **Responsibility**: Map status strings to specific Semantic colors (Success, Warning, Error).
- **Allowed Variants**: CaseStatus, FindingStatus.

### 12. DocumentViewer
- **Purpose**: Render PDFs or Images.
- **Responsibility**: Zoom, pan, and page navigation.
- **Allowed Variants**: Default.

### 13. FindingCard
- **Purpose**: Display a specific discrepancy.
- **Responsibility**: Show title, severity, and action buttons (Accept/Resolve).
- **Allowed Variants**: Open, Accepted, Resolved.

### 14. UploadZone
- **Purpose**: Accept file drops.
- **Responsibility**: Handle drag events, validate file types.
- **Allowed Variants**: Default.

### 15. DraftEditor
- **Purpose**: Edit generated drafts.
- **Responsibility**: Rich text editing, saving content.
- **Allowed Variants**: Default.

### 16. DocumentComparisonPanel
- **Purpose**: Side-by-side document viewing.
- **Responsibility**: Sync scrolling, highlight matching/mismatching fields.
- **Allowed Variants**: Dual-pane.
