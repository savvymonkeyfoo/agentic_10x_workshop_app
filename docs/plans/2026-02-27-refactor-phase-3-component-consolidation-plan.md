---
title: Complete Phase 3 - Component Consolidation & Design System
type: refactor
date: 2026-02-27
priority: P2
estimated_effort: 3-4 days
risk_level: medium-high
---

# Complete Phase 3: Component Consolidation & Design System

## Overview

Complete the remaining tasks from Phase 3 of the Security & Code Quality Implementation Plan. This phase focuses on UI consistency, component consolidation, and design system standardization to improve maintainability and reduce code duplication.

**Status:** Phases 1 and 2 are complete. Phase 3 modal consolidation and color token migration are done. This plan covers the remaining 6 tasks.

## Motivation

- **Current State:** 7 textarea implementations, 2 duplicate SpiderCharts, 20+ raw buttons, 3 spinner patterns, 23 arbitrary text sizes
- **Target State:** Unified component system with composable patterns, standardized design tokens, comprehensive documentation
- **Benefits:**
  - Reduce component library by ~500 LOC
  - Improve theme consistency across all 4 themes
  - Easier maintenance and feature additions
  - Better developer experience with clear patterns

## Prerequisites

### Branch Strategy

**IMPORTANT:** Create a new feature branch before starting implementation:

```bash
git checkout -b refactor/phase-3-component-consolidation
```

This keeps the work isolated and allows for easier review and testing before merging to main.

## Proposed Solution

Complete 6 remaining Phase 3 tasks plus README documentation update:

1. **Textarea Consolidation** - 7 implementations → 2 (base + smart)
2. **SpiderChart Deduplication** - Remove duplicate, keep shared version
3. **Button Standardization** - Replace 20+ raw `<button>` with Button component
4. **Spinner Component** - Create unified spinner, replace 3 patterns
5. **Text Size Cleanup** - Remove arbitrary sizes, use standard scale
6. **Design Token Documentation** - Create comprehensive design system docs
7. **README Update** - Document Phase 3 completion and new component patterns

## Technical Approach

### Task 1: Textarea Consolidation

**Goal:** Reduce 7 textarea implementations to 2 (base + composable smart variant)

#### Current Implementations

1. `/web/src/components/ui/textarea.tsx` (23 lines) - Base shadcn component ✓ Keep
2. `/web/src/components/ui/SmartListTextarea.tsx` (49 lines) - Auto-bullet insertion
3. `/web/src/components/ui/BulletListEditor.tsx` (138 lines) - Per-line array with bullets
4. `/web/src/components/ui/smart-bullet-editor.tsx` (128 lines) - Markdown parsing, colored bullets
5. `/web/src/components/workshop/input-canvas/SmartTextarea.tsx` (85 lines) - Auto-grow + bullets
6. `/web/src/components/ui/MarkdownTextarea.tsx` (84 lines) - Markdown preview toggle
7. `/web/src/components/workshop/input-canvas/TitleTextarea.tsx` (46 lines) - Auto-grow title input

**Total LOC to consolidate:** ~530 lines → ~150 lines (72% reduction)

#### Implementation Steps

**1.1 Create Unified SmartTextarea Component**

Create `/web/src/components/ui/smart-textarea.tsx`:

```typescript
import * as React from "react";
import { Textarea } from "./textarea";
import { cn } from "@/lib/utils";

interface SmartTextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  value: string;
  onValueChange: (value: string) => void;

  // Feature flags
  autoGrow?: boolean;
  bulletList?: "manual" | "auto" | false; // manual = user adds bullets, auto = starts with bullet on focus
  markdown?: boolean; // Toggle between markdown preview and edit
  variant?: "default" | "title"; // title = large text, no bullets

  // Styling
  label?: string;
  minHeight?: string;
  colorClass?: string; // For colored bullet dots
}

export const SmartTextarea = React.forwardRef<HTMLTextAreaElement, SmartTextareaProps>(
  ({
    value,
    onValueChange,
    autoGrow = false,
    bulletList = false,
    markdown = false,
    variant = "default",
    label,
    minHeight = "60px",
    colorClass,
    className,
    onFocus,
    onKeyDown,
    ...props
  }, ref) => {
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);
    const [isEditing, setIsEditing] = React.useState(!markdown);

    // Merge refs
    React.useImperativeHandle(ref, () => textareaRef.current!);

    // Auto-grow logic
    React.useLayoutEffect(() => {
      if (autoGrow && textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
    }, [value, autoGrow]);

    // Handle bullet list auto-start
    const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      if (bulletList === "auto" && value === "") {
        onValueChange("• ");
      }
      onFocus?.(e);
    };

    // Handle Enter key for bullet lists
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (bulletList && e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        const textarea = e.currentTarget;
        const { selectionStart, selectionEnd } = textarea;
        const lines = value.split('\n');
        const currentLineIndex = value.substring(0, selectionStart).split('\n').length - 1;
        const currentLine = lines[currentLineIndex];

        // If current line is just bullet, remove it and don't add new line
        if (currentLine.trim() === "•" || currentLine.trim() === "") {
          const newValue = lines.filter((_, i) => i !== currentLineIndex).join('\n');
          onValueChange(newValue);
          return;
        }

        // Add new line with bullet
        const beforeCursor = value.substring(0, selectionStart);
        const afterCursor = value.substring(selectionEnd);
        onValueChange(`${beforeCursor}\n• ${afterCursor}`);

        // Set cursor after bullet on next frame
        setTimeout(() => {
          if (textarea) {
            const newPosition = selectionStart + 3; // "\n• "
            textarea.setSelectionRange(newPosition, newPosition);
          }
        }, 0);
      }
      onKeyDown?.(e);
    };

    // Variant-specific classes
    const variantClasses = variant === "title"
      ? "text-2xl font-black uppercase tracking-tight"
      : "";

    // Markdown preview mode
    if (markdown && !isEditing) {
      return (
        <div className="space-y-2">
          {label && (
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              {label}
            </label>
          )}
          <div
            onClick={() => setIsEditing(true)}
            className={cn(
              "prose prose-sm max-w-none cursor-pointer rounded-md border border-input bg-muted/30 p-3 hover:bg-muted/50",
              className
            )}
          >
            {/* ReactMarkdown component would go here */}
            <div dangerouslySetInnerHTML={{ __html: value }} />
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {label && (
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {label}
          </label>
        )}
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          className={cn(variantClasses, className)}
          style={{ minHeight: autoGrow ? minHeight : undefined }}
          {...props}
        />
      </div>
    );
  }
);

SmartTextarea.displayName = "SmartTextarea";
```

**1.2 Migrate Components to Use SmartTextarea**

Update these files to use the new component:

- `/web/src/components/ui/SmartListTextarea.tsx` → Delete (use `<SmartTextarea bulletList="auto" />`)
- `/web/src/components/ui/BulletListEditor.tsx` → Delete (use `<SmartTextarea bulletList="manual" />`)
- `/web/src/components/ui/smart-bullet-editor.tsx` → Delete (use `<SmartTextarea bulletList="manual" autoGrow />`)
- `/web/src/components/workshop/input-canvas/SmartTextarea.tsx` → Delete (use new component)
- `/web/src/components/ui/MarkdownTextarea.tsx` → Delete (use `<SmartTextarea markdown />`)
- `/web/src/components/workshop/input-canvas/TitleTextarea.tsx` → Delete (use `<SmartTextarea variant="title" autoGrow />`)

**1.3 Update All Import Sites**

Search and replace imports across the codebase:

```bash
# Find all files importing old textarea variants
rg -l "from.*SmartListTextarea" web/src
rg -l "from.*BulletListEditor" web/src
rg -l "from.*smart-bullet-editor" web/src
rg -l "from.*MarkdownTextarea" web/src
rg -l "from.*input-canvas/SmartTextarea" web/src
rg -l "from.*TitleTextarea" web/src
```

Update each file to import and use `SmartTextarea` with appropriate props.

#### Acceptance Criteria

- [ ] SmartTextarea component created with all features (auto-grow, bullets, markdown, variants)
- [ ] All 6 old textarea implementations deleted
- [ ] All import sites updated to use SmartTextarea
- [ ] Auto-grow functionality works correctly
- [ ] Bullet list insertion works on Enter key
- [ ] Markdown preview toggle works (if used)
- [ ] Title variant renders with large text
- [ ] No visual regressions in InputCanvas or other components
- [ ] All existing tests pass

**Estimated Time:** 4-6 hours

---

### Task 2: SpiderChart Deduplication

**Goal:** Remove duplicate SpiderChart, keep the shared version with enhancements

#### Current State

Two implementations:
1. `/web/src/components/ui/SpiderChart.tsx` (154 lines) - Uses semantic color tokens
2. `/web/src/components/shared/SpiderChart.tsx` (130 lines) - More flexible API

**Decision:** Keep `/shared/` version, port semantic tokens from `/ui/` version

#### Implementation Steps

**2.1 Enhance Shared SpiderChart**

Update `/web/src/components/shared/SpiderChart.tsx`:

```typescript
// Replace hardcoded colors with semantic tokens
// OLD:
stroke: "var(--chart-stroke)"
fill: "var(--chart-fill)"

// NEW:
stroke: "hsl(var(--primary))"
fill: "hsl(var(--primary) / 0.2)"
```

Port these features from `/ui/SpiderChart.tsx`:
- Ghost state for empty data (opacity 30%, dashed stroke)
- Qualitative tooltip labels ("High Value", "Mature", "Risky")
- Semantic color token usage throughout

**2.2 Find and Update Import Sites**

```bash
# Find files importing the UI version
rg -l "from.*components/ui/SpiderChart" web/src
```

Update imports to use `/components/shared/SpiderChart` instead.

**2.3 Delete Duplicate**

```bash
rm web/src/components/ui/SpiderChart.tsx
```

#### Acceptance Criteria

- [x] Shared SpiderChart enhanced with semantic color tokens
- [x] Ghost state implemented for empty data
- [x] Qualitative tooltips implemented
- [x] All import sites updated to shared version
- [x] UI SpiderChart deleted
- [x] Charts render correctly in all 4 themes
- [x] No visual regressions in analysis/reporting pages

**Estimated Time:** 1-2 hours

---

### Task 3: Button Standardization

**Goal:** Replace 20+ raw `<button>` elements with Button component

#### Current State

18+ files use raw `<button>` elements with inline Tailwind classes instead of the unified Button component.

**Examples:**
- `/web/src/components/workshop/ScorecardModal.tsx`
- `/web/src/components/workshop/OpportunityModal.tsx`
- `/web/src/components/workshop/InputCanvas.tsx`
- `/web/src/components/ui/smart-bullet-editor.tsx` (line 116)

#### Implementation Steps

**3.1 Audit Raw Button Usage**

```bash
# Find all files with raw button elements
rg '<button' web/src/components --type tsx -l | sort
```

Create a checklist of files to update.

**3.2 Migration Pattern**

For each raw button, determine the appropriate variant:

```typescript
// OLD:
<button
  onClick={handleDelete}
  className="px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg"
>
  Delete
</button>

// NEW:
<Button
  variant="destructive"
  size="sm"
  onClick={handleDelete}
>
  Delete
</Button>
```

**Variant Mapping:**
- Red/destructive actions → `variant="destructive"`
- Primary actions → `variant="default"`
- Secondary actions → `variant="secondary"` or `variant="ghost"`
- AI-related actions → `variant="ai"`
- Outline style → `variant="outline"`
- Text-only → `variant="link"`

**Size Mapping:**
- Small compact buttons → `size="sm"`
- Icon-only → `size="icon"`
- Default → `size="default"` (can be omitted)
- Large → `size="lg"`

**3.3 Update Each File**

For each file in the audit list:
1. Import Button component
2. Replace raw button with Button component
3. Map classes to appropriate variant/size
4. Test functionality

**3.4 Add ESLint Rule (Optional)**

Consider adding an ESLint rule to warn on raw button usage:

```json
// .eslintrc.json
{
  "rules": {
    "no-restricted-syntax": [
      "warn",
      {
        "selector": "JSXOpeningElement[name.name='button']:not([name.name='Button'])",
        "message": "Use Button component from @/components/ui/button instead of raw <button> elements"
      }
    ]
  }
}
```

#### Acceptance Criteria

- [ ] All raw `<button>` elements identified (checklist created)
- [ ] All buttons migrated to Button component
- [ ] Correct variants applied for each button type
- [ ] Correct sizes applied based on context
- [ ] No visual regressions
- [ ] All button interactions work correctly
- [ ] Optional: ESLint rule added to prevent future raw buttons

**Estimated Time:** 3-4 hours

**Files to Update (Examples):**
- `/web/src/components/workshop/ScorecardModal.tsx`
- `/web/src/components/workshop/OpportunityModal.tsx`
- `/web/src/components/workshop/InputCanvas.tsx`
- `/web/src/components/ui/smart-bullet-editor.tsx`
- `/web/src/components/reporting/CanvasWorkspace.tsx`
- `/web/src/components/analysis/AIStrategistPanel.tsx`
- (Add others from audit)

---

### Task 4: Spinner Component Creation

**Goal:** Create unified Spinner component, replace 3 different patterns

#### Current State

Three different loading spinner patterns:
1. **Lucide Loader2** (8 files) - `<Loader2 className="animate-spin" />`
2. **Custom CSS** (1 file) - `<div className="border-2 border-primary border-t-transparent rounded-full animate-spin" />`
3. **RefreshCw icon** (1 file) - `<RefreshCw className="animate-spin" />`

#### Implementation Steps

**4.1 Create Spinner Component**

Create `/web/src/components/ui/spinner.tsx`:

```typescript
import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const spinnerVariants = cva(
  "animate-spin text-muted-foreground",
  {
    variants: {
      size: {
        sm: "w-3 h-3",
        md: "w-5 h-5",
        lg: "w-8 h-8",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

export interface SpinnerProps
  extends React.HTMLAttributes<SVGElement>,
    VariantProps<typeof spinnerVariants> {}

export const Spinner = React.forwardRef<SVGSVGElement, SpinnerProps>(
  ({ className, size, ...props }, ref) => {
    return (
      <Loader2
        ref={ref}
        className={cn(spinnerVariants({ size }), className)}
        {...props}
      />
    );
  }
);

Spinner.displayName = "Spinner";
```

**4.2 Migrate Inline Spinners**

Find all files using inline spinner patterns:

```bash
# Find Loader2 usage
rg 'Loader2.*animate-spin' web/src -l

# Find custom CSS spinners
rg 'border-t-transparent.*animate-spin' web/src -l

# Find RefreshCw spinners
rg 'RefreshCw.*animate-spin' web/src -l
```

Replace with Spinner component:

```typescript
// OLD:
<Loader2 className="w-3 h-3 animate-spin" />

// NEW:
<Spinner size="sm" />
```

```typescript
// OLD:
<div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />

// NEW:
<Spinner size="md" />
```

**4.3 Update Loading States**

Common pattern with text:

```typescript
// Example loading state
{isLoading ? (
  <div className="flex items-center gap-2">
    <Spinner size="sm" />
    <span>Loading...</span>
  </div>
) : (
  <span>Load More</span>
)}
```

#### Acceptance Criteria

- [x] Spinner component created with sm/md/lg sizes
- [x] All inline Loader2 usages migrated to Spinner
- [x] Custom CSS spinner replaced with Spinner
- [x] RefreshCw spinner replaced with Spinner
- [x] Size variants map correctly (sm=3, md=5, lg=8)
- [x] Spinner inherits text color (text-muted-foreground by default)
- [x] No visual regressions in loading states

**Estimated Time:** 1-2 hours

**Files to Update:**
- `/web/src/components/divergent/IdeaFocusView.tsx`
- `/web/src/components/workshop/ScorecardModal.tsx`
- `/web/src/components/workshop/AssetRegistry.tsx`
- `/web/src/components/analysis/AIStrategistPanel.tsx`
- `/web/src/components/reporting/CanvasWorkspace.tsx`
- (5-10 other files from search results)

---

### Task 5: Text Size Cleanup

**Goal:** Remove arbitrary text sizes (`text-[10px]`, `text-[11px]`), use standard Tailwind scale

#### Current State

- 20 instances of `text-[10px]`
- 3 instances of `text-[11px]`
- Used for: labels, small metadata, compact UI text

**Standard Tailwind Scale:**
- `text-xs` = 0.75rem (12px)
- `text-sm` = 0.875rem (14px)
- `text-base` = 1rem (16px)

#### Implementation Steps

**5.1 Audit Arbitrary Sizes**

```bash
# Find all arbitrary text sizes
rg 'text-\[10px\]' web/src -l
rg 'text-\[11px\]' web/src -l
```

**5.2 Migration Strategy**

For each instance, determine the appropriate replacement:

```typescript
// OLD: Field labels
className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider"

// NEW: Use text-xs with adjusted line-height
className="text-xs font-bold text-muted-foreground uppercase tracking-wider leading-tight"
```

```typescript
// OLD: Small status text
className="text-[11px] font-semibold"

// NEW:
className="text-xs font-semibold"
```

**5.3 Consider Custom Utility (Optional)**

If 10px is truly needed for dense UI, add to Tailwind config:

```javascript
// tailwind.config.ts
module.exports = {
  theme: {
    extend: {
      fontSize: {
        'xxs': '0.625rem', // 10px
      }
    }
  }
}
```

Then use `text-xxs` instead of `text-[10px]`.

**5.4 Update All Files**

For each file in the audit:
1. Replace `text-[10px]` with `text-xs` (or `text-xxs` if custom utility added)
2. Replace `text-[11px]` with `text-xs`
3. Adjust line-height/tracking if needed for visual balance
4. Test visual appearance

#### Acceptance Criteria

- [ ] All `text-[10px]` instances removed
- [ ] All `text-[11px]` instances removed
- [ ] Standard Tailwind sizes used throughout
- [ ] Optional: Custom `text-xxs` utility added if needed
- [ ] No visual regressions (labels still readable, UI not broken)
- [ ] Typography remains consistent across themes

**Estimated Time:** 2-3 hours

**Files to Update (Examples):**
- `/web/src/components/ui/BulletListEditor.tsx`
- `/web/src/components/workshop/InputCanvas.tsx`
- `/web/src/components/analysis/StrategicMap.tsx`
- `/web/src/components/divergent/IdeaFocusView.tsx`
- (20+ files total from search results)

---

### Task 6: Design Token Documentation

**Goal:** Create comprehensive design system documentation

#### Implementation Steps

**6.1 Create Design Tokens Documentation**

Create `/web/src/styles/design-tokens.md`:

```markdown
# Design System Tokens

**Date:** 2026-02-27
**Status:** Current

This document defines the design system tokens and patterns for the Agentic 10x Protocol Application.

---

## Color Tokens

### Semantic Colors

Use semantic color tokens for theme compatibility. All colors automatically adapt to the active theme (Capgemini, Claude, Nexus, Aether).

#### Usage Pattern

```typescript
// ✅ GOOD - Theme-aware semantic tokens
className="bg-primary text-primary-foreground"
className="bg-destructive hover:bg-destructive/90"
className="border-muted text-muted-foreground"

// ❌ BAD - Hardcoded colors break theme switching
className="bg-blue-500 text-white"
className="bg-red-600 border-red-700"
```

#### Available Semantic Tokens

| Token | Usage | Examples |
|-------|-------|----------|
| `primary` | Primary actions, key UI elements | Submit buttons, active states |
| `secondary` | Secondary actions | Cancel buttons, alternative options |
| `muted` | Backgrounds, subtle elements | Card backgrounds, disabled states |
| `destructive` | Destructive actions | Delete buttons, error states |
| `warning` | Warning states | Caution messages, risky actions |
| `success` | Success states | Confirmation messages, completed tasks |
| `info` | Informational content | Helper text, metadata |
| `intelligence` | AI-related features | AI analysis, strategist panel |

#### Color with Opacity

```typescript
// Primary with 20% opacity
className="bg-primary/20"

// Border with 50% opacity
className="border-border/50"
```

---

## Typography

### Type Scale

```typescript
// Display heading
className="text-3xl font-bold"              // H1 - 32px

// Section heading
className="text-2xl font-semibold"          // H2 - 24px

// Subsection heading
className="text-xl font-medium"             // H3 - 20px

// Body text (default)
className="text-base"                       // 16px

// Small text
className="text-sm"                         // 14px

// Extra small (labels, metadata)
className="text-xs"                         // 12px

// Title variant (InputCanvas)
className="text-2xl font-black uppercase"   // Large titles
```

### Font Weights

| Class | Weight | Usage |
|-------|--------|-------|
| `font-normal` | 400 | Body text |
| `font-medium` | 500 | Emphasis |
| `font-semibold` | 600 | Subheadings |
| `font-bold` | 700 | Labels, strong emphasis |
| `font-black` | 900 | Display titles |

### Text Styles

```typescript
// Labels (uppercase with tracking)
className="text-xs font-bold text-muted-foreground uppercase tracking-wider"

// Field labels
className="text-xs font-bold text-muted-foreground uppercase tracking-wider"

// Metadata text
className="text-sm text-muted-foreground"
```

---

## Spacing

### 8pt Grid System

```typescript
// Panel padding
className="p-8"              // 32px

// Gap between panels
className="gap-6"            // 24px

// Outer margins
className="m-12"             // 48px

// Component spacing
className="space-y-4"        // 16px vertical
className="gap-4"            // 16px gap
```

### Common Spacing Patterns

```typescript
// Card/panel padding
className="p-6 md:p-8"

// Section spacing
className="space-y-6"

// Inline element gaps
className="flex gap-2 items-center"
```

---

## Border Radius

### Standard Radii

```typescript
// Cards, panels
className="rounded-xl"        // 12px (0.75rem)

// Modals, dialogs
className="rounded-2xl"       // 16px (1rem)

// Buttons
className="rounded-lg"        // 8px (0.5rem)

// Inputs, textareas
className="rounded-md"        // 6px (0.375rem)

// Pills, badges
className="rounded-full"      // Fully rounded
```

---

## Shadows

### Elevation Levels

```typescript
// Card default
className="shadow-sm hover:shadow-md"

// Elevated cards
className="shadow-lg"

// Modals, overlays
className="shadow-xl"

// Dropdown menus
className="shadow-lg"
```

### Glass Morphism

```typescript
// Glass panel effect
className="bg-background/80 backdrop-blur-md border border-border/50"
```

---

## Z-Index Layers

### Stacking Order

```typescript
// Base layer
className="z-0"              // Default content

// Tooltip layer
className="z-20"             // Tooltips, badges

// Dropdown layer
className="z-30"             // Dropdown menus

// Overlay layer
className="z-40"             // Modal overlays

// Modal layer
className="z-50"             // Modal dialogs
```

---

## Transitions & Animation

### Standard Transitions

```typescript
// Color transitions (default)
className="transition-colors"

// All properties (movement)
className="transition-all duration-200"

// Opacity fades
className="transition-opacity duration-300"
```

### Loading States

```typescript
// Spinner animation
className="animate-spin"

// Pulse effect
className="animate-pulse"
```

---

## Component Patterns

### Button Patterns

```typescript
import { Button } from "@/components/ui/button";

// Primary action
<Button variant="default">Submit</Button>

// Destructive action
<Button variant="destructive">Delete</Button>

// Secondary action
<Button variant="secondary">Cancel</Button>

// Ghost button (subtle)
<Button variant="ghost">Learn More</Button>

// Outline style
<Button variant="outline">Edit</Button>

// AI-related action
<Button variant="ai">Analyze with AI</Button>

// Icon button
<Button variant="ghost" size="icon">
  <Icons.trash className="h-4 w-4" />
</Button>
```

### Card Patterns

```typescript
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Section Title</CardTitle>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

### Input Patterns

```typescript
// Standard textarea
<Textarea
  value={value}
  onChange={(e) => setValue(e.target.value)}
  placeholder="Enter text..."
/>

// Smart textarea with auto-grow and bullets
<SmartTextarea
  value={value}
  onValueChange={setValue}
  autoGrow
  bulletList="auto"
  placeholder="Add items..."
/>

// Title input
<SmartTextarea
  value={title}
  onValueChange={setTitle}
  variant="title"
  autoGrow
  placeholder="Project Title"
/>
```

### Loading States

```typescript
import { Spinner } from "@/components/ui/spinner";

// Small spinner with text
<div className="flex items-center gap-2">
  <Spinner size="sm" />
  <span>Loading...</span>
</div>

// Medium spinner (default)
<Spinner size="md" />

// Large spinner
<Spinner size="lg" />
```

---

## Best Practices

### Color Usage

1. **Always use semantic tokens** - Never hardcode color values
2. **Test in all themes** - Verify appearance in Capgemini, Claude, Nexus, Aether
3. **Use opacity modifiers** - `/20`, `/50`, `/80` for variants
4. **Consider accessibility** - Ensure sufficient contrast

### Typography

1. **Use standard scale** - Avoid arbitrary sizes like `text-[10px]`
2. **Consistent hierarchy** - H1 > H2 > H3 > body > small
3. **Line height for readability** - Add `leading-tight` or `leading-relaxed` as needed
4. **Uppercase labels with tracking** - `uppercase tracking-wider` for field labels

### Spacing

1. **Follow 8pt grid** - Use multiples of 4: 4, 8, 12, 16, 24, 32
2. **Consistent spacing** - Same spacing for similar elements
3. **Responsive padding** - Increase padding on larger screens: `p-4 md:p-6`

### Components

1. **Compose from primitives** - Build complex components from base components
2. **Use CVA for variants** - Class Variance Authority for type-safe styling
3. **Forward refs** - Always forward refs for form components
4. **TypeScript props** - Define clear prop interfaces

---

## Migration Checklist

When updating components to match design system:

- [ ] Replace hardcoded colors with semantic tokens
- [ ] Replace raw buttons with Button component
- [ ] Use standard typography scale (no arbitrary sizes)
- [ ] Apply consistent spacing (8pt grid)
- [ ] Use standard border radius values
- [ ] Apply appropriate z-index layers
- [ ] Use standard transitions
- [ ] Test in all 4 themes
- [ ] Verify accessibility (contrast, focus states)

---

## References

- **Color Tokens:** `/web/src/app/globals.css` (CSS custom properties)
- **Tailwind Config:** `/web/tailwind.config.ts`
- **Base Components:** `/web/src/components/ui/`
- **Utils:** `/web/src/lib/utils.ts` (cn function)

**Last Updated:** 2026-02-27
```

**6.2 Create Component Usage Guide**

Create `/web/docs/COMPONENT_USAGE.md`:

```markdown
# Component Usage Guide

Quick reference for using consolidated components in the Agentic 10x Protocol Application.

---

## SmartTextarea

### Basic Usage

```typescript
import { SmartTextarea } from "@/components/ui/smart-textarea";

<SmartTextarea
  value={description}
  onValueChange={setDescription}
  placeholder="Enter description..."
/>
```

### Auto-Growing Textarea

```typescript
<SmartTextarea
  value={notes}
  onValueChange={setNotes}
  autoGrow
  minHeight="100px"
  placeholder="Notes..."
/>
```

### Bullet List (Manual)

```typescript
<SmartTextarea
  value={items}
  onValueChange={setItems}
  bulletList="manual"
  placeholder="Add items..."
/>
```

### Bullet List (Auto-Start)

```typescript
<SmartTextarea
  value={items}
  onValueChange={setItems}
  bulletList="auto"
  autoGrow
  label="Key Points"
/>
```

### Title Variant

```typescript
<SmartTextarea
  value={title}
  onValueChange={setTitle}
  variant="title"
  autoGrow
  placeholder="Project Title"
  className="text-center"
/>
```

### Markdown Preview

```typescript
<SmartTextarea
  value={markdown}
  onValueChange={setMarkdown}
  markdown
  placeholder="Write markdown..."
/>
```

---

## Button

### Primary Actions

```typescript
import { Button } from "@/components/ui/button";

<Button onClick={handleSubmit}>
  Submit
</Button>
```

### Destructive Actions

```typescript
<Button
  variant="destructive"
  onClick={handleDelete}
>
  Delete Workshop
</Button>
```

### Secondary Actions

```typescript
<Button
  variant="secondary"
  onClick={handleCancel}
>
  Cancel
</Button>
```

### Ghost Buttons

```typescript
<Button
  variant="ghost"
  size="sm"
  onClick={handleEdit}
>
  Edit
</Button>
```

### AI-Related Actions

```typescript
<Button
  variant="ai"
  onClick={handleAnalyze}
>
  <Sparkles className="mr-2 h-4 w-4" />
  Analyze with AI
</Button>
```

### Icon Buttons

```typescript
<Button
  variant="ghost"
  size="icon"
  onClick={handleClose}
>
  <X className="h-4 w-4" />
</Button>
```

### Loading States

```typescript
<Button disabled={isLoading}>
  {isLoading ? (
    <>
      <Spinner size="sm" className="mr-2" />
      Saving...
    </>
  ) : (
    "Save Changes"
  )}
</Button>
```

---

## Spinner

### Basic Usage

```typescript
import { Spinner } from "@/components/ui/spinner";

<Spinner />
```

### Sizes

```typescript
// Small (12px)
<Spinner size="sm" />

// Medium (20px) - default
<Spinner size="md" />

// Large (32px)
<Spinner size="lg" />
```

### With Text

```typescript
<div className="flex items-center gap-2">
  <Spinner size="sm" />
  <span>Loading data...</span>
</div>
```

### Centered Loading State

```typescript
<div className="flex justify-center items-center min-h-[200px]">
  <Spinner size="lg" />
</div>
```

---

## SpiderChart

### Basic Usage

```typescript
import { SpiderChart } from "@/components/shared/SpiderChart";

<SpiderChart
  data={{
    value: 4,
    risk: 2,
    capability: 3,
    complexity: 2
  }}
/>
```

### With Custom Size

```typescript
<SpiderChart
  data={scoreData}
  width={300}
  height={300}
/>
```

### With Tooltip

```typescript
<SpiderChart
  data={scoreData}
  showTooltip={true}
/>
```

---

## Best Practices

### When to Use SmartTextarea

- ✅ Multi-line text input
- ✅ Bullet point lists
- ✅ Auto-growing input fields
- ✅ Markdown content
- ✅ Large title inputs
- ❌ Single-line input (use `Input` component)
- ❌ Rich text editing (use dedicated editor)

### When to Use Button Variants

- `default` - Primary actions (submit, save, create)
- `destructive` - Delete, remove, dangerous actions
- `secondary` - Alternative primary actions
- `ghost` - Subtle actions, less emphasis
- `outline` - Border style for secondary actions
- `link` - Text-only button style
- `ai` - AI-powered features

### Performance Tips

1. **Memoize callbacks** - Use `useCallback` for SmartTextarea onChange handlers
2. **Debounce auto-save** - Don't save on every keystroke
3. **Lazy load charts** - Use dynamic imports for SpiderChart in large lists
4. **Avoid nested buttons** - Don't put buttons inside buttons or labels

---

## Migration Examples

### Old Textarea → SmartTextarea

```typescript
// OLD:
<textarea
  value={value}
  onChange={(e) => setValue(e.target.value)}
  className="w-full min-h-[100px] p-3 rounded-md border"
/>

// NEW:
<SmartTextarea
  value={value}
  onValueChange={setValue}
  autoGrow
/>
```

### Old Button → Button Component

```typescript
// OLD:
<button
  onClick={handleDelete}
  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
>
  Delete
</button>

// NEW:
<Button variant="destructive" onClick={handleDelete}>
  Delete
</Button>
```

### Old Spinner → Spinner Component

```typescript
// OLD:
<Loader2 className="w-5 h-5 animate-spin" />

// NEW:
<Spinner size="md" />
```

---

**Last Updated:** 2026-02-27
```

#### Acceptance Criteria

- [ ] Design tokens documentation created at `/web/src/styles/design-tokens.md`
- [ ] Component usage guide created at `/web/docs/COMPONENT_USAGE.md`
- [ ] All color tokens documented with examples
- [ ] Typography scale documented
- [ ] Spacing, border radius, shadows documented
- [ ] Z-index layers defined
- [ ] Component patterns with code examples
- [ ] Migration checklist included
- [ ] Best practices section included

**Estimated Time:** 2-3 hours

---

### Task 7: README Documentation Update

**Goal:** Update README.md to document Phase 3 completion and new component patterns

#### Implementation Steps

**7.1 Read Current README**

Read `/web/README.md` to understand current structure.

**7.2 Add Phase 3 Completion Section**

Add or update a "Recent Updates" or "Changelog" section:

```markdown
## Recent Updates

### Phase 3: Component Consolidation (February 2026) ✅

Completed comprehensive UI component consolidation and design system standardization:

- **Textarea Consolidation:** 7 implementations → 2 (base + SmartTextarea)
  - Auto-grow, bullet lists, markdown preview, title variant
  - ~380 LOC reduction
- **SpiderChart Deduplication:** Removed duplicate, unified with semantic tokens
- **Button Standardization:** Replaced 20+ raw `<button>` elements with Button component
- **Spinner Component:** Created unified Spinner with sm/md/lg sizes
- **Text Size Cleanup:** Removed arbitrary sizes, standardized to Tailwind scale
- **Design System Documentation:** Comprehensive design tokens and component usage guides

**Total LOC Reduction:** ~500+ lines
**Benefit:** Improved maintainability, theme consistency, developer experience
```

**7.3 Add Design System Section**

Add a new section documenting the design system:

```markdown
## Design System

This project uses a comprehensive design system with semantic color tokens, standardized components, and consistent patterns.

### Documentation

- **Design Tokens:** `/web/src/styles/design-tokens.md` - Color tokens, typography, spacing, shadows
- **Component Usage:** `/web/docs/COMPONENT_USAGE.md` - Quick reference for components

### Key Components

- **SmartTextarea** - Composable textarea with auto-grow, bullets, markdown
- **Button** - Unified button component with variants (default, destructive, ghost, ai)
- **Spinner** - Loading spinner with standardized sizes
- **SpiderChart** - Radar chart with semantic color tokens

### Themes

The application supports 4 themes with automatic color token adaptation:
- Capgemini (default)
- Claude
- Nexus
- Aether

All components use semantic color tokens for theme compatibility.
```

**7.4 Update Component Architecture Section**

If a component architecture section exists, update it to reflect the new structure:

```markdown
## Component Architecture

### Base Components (`/web/src/components/ui/`)

Foundational shadcn-based components:
- `button.tsx` - CVA-based button variants
- `textarea.tsx` - Base textarea primitive
- `smart-textarea.tsx` - Composable smart textarea (auto-grow, bullets, markdown)
- `spinner.tsx` - Loading spinner
- `card.tsx` - Card layout primitive
- (other base components...)

### Shared Components (`/web/src/components/shared/`)

Reusable components across domains:
- `SpiderChart.tsx` - VRCC radar visualization
- `DFVChart.tsx` - Desirability/Feasibility/Viability chart
- `MatrixChart.tsx` - 2x2 matrix visualization

### Domain Components

- `/web/src/components/workshop/` - Workshop-specific components
- `/web/src/components/analysis/` - Analysis and reporting
- `/web/src/components/divergent/` - Research interface
- `/web/src/components/reporting/` - PDF generation
```

**7.5 Add Development Guidelines**

Add or update development guidelines section:

```markdown
## Development Guidelines

### Component Usage

Always use base components instead of raw HTML elements:
- ✅ `<Button variant="destructive">` instead of `<button className="...">`
- ✅ `<SmartTextarea autoGrow />` instead of `<textarea className="...">`
- ✅ `<Spinner size="sm" />` instead of `<Loader2 className="animate-spin" />`

### Styling Best Practices

1. **Use semantic color tokens:**
   ```typescript
   // ✅ Good
   className="bg-primary text-primary-foreground"

   // ❌ Bad
   className="bg-blue-500 text-white"
   ```

2. **Use standard typography scale:**
   ```typescript
   // ✅ Good
   className="text-xs font-bold uppercase tracking-wider"

   // ❌ Bad
   className="text-[10px] font-bold uppercase"
   ```

3. **Follow 8pt grid spacing:**
   ```typescript
   // ✅ Good
   className="p-4 gap-6 space-y-8"

   // ❌ Bad
   className="p-3 gap-5 space-y-7"
   ```

### Testing Components

After making component changes:
1. Test in all 4 themes (Capgemini, Claude, Nexus, Aether)
2. Test responsive behavior (mobile, tablet, desktop)
3. Test accessibility (keyboard navigation, screen readers)
4. Run existing test suite: `npm test`
```

#### Acceptance Criteria

- [ ] README.md updated with Phase 3 completion section
- [ ] Design System section added with links to documentation
- [ ] Component Architecture section updated to reflect new structure
- [ ] Development Guidelines added or updated
- [ ] Key components documented with brief descriptions
- [ ] Theme support mentioned
- [ ] Styling best practices included

**Estimated Time:** 1 hour

---

## Testing Strategy

### Visual Regression Testing

**Theme Testing:**
```bash
# Test in all 4 themes
# 1. Capgemini (default)
# 2. Claude
# 3. Nexus
# 4. Aether
```

For each theme, verify:
- [ ] All buttons render with correct colors
- [ ] SpiderChart uses theme colors
- [ ] Textareas have appropriate borders/backgrounds
- [ ] Spinners are visible
- [ ] No hardcoded colors break the theme

**Component Testing:**
- [ ] SmartTextarea auto-grow works
- [ ] SmartTextarea bullet list insertion works on Enter
- [ ] SmartTextarea markdown preview toggles correctly
- [ ] All Button variants render correctly
- [ ] Spinner sizes render correctly (sm=12px, md=20px, lg=32px)
- [ ] SpiderChart renders with data
- [ ] SpiderChart ghost state works (empty data)

### Functional Testing

**User Flows:**
1. Create workshop with InputCanvas (uses SmartTextarea)
2. Edit opportunity with bullet lists
3. Delete workshop (Button variant="destructive")
4. Analyze workshop (loading with Spinner)
5. View analysis with SpiderChart
6. Switch themes and verify visual consistency

### Automated Testing

```bash
# Run existing test suite
npm test

# Run type checking
npm run type-check

# Run linting
npm run lint
```

**New Tests to Add:**
- `smart-textarea.test.tsx` - Unit tests for SmartTextarea features
- `spinner.test.tsx` - Unit tests for Spinner component
- `button.test.tsx` - Update tests for new button usage patterns

### Performance Testing

- [ ] No significant performance regression in InputCanvas
- [ ] SmartTextarea auto-grow doesn't cause jank
- [ ] SpiderChart renders quickly (<100ms)
- [ ] Page load times remain acceptable

---

## Rollback Plan

### Git Strategy

All work on feature branch: `refactor/phase-3-component-consolidation`

**Rollback Steps:**
1. Identify failing task
2. Revert specific commits for that task
3. Test in isolation
4. Investigate issue
5. Fix and re-commit

**Full Rollback:**
```bash
# If major issues found
git checkout main
git branch -D refactor/phase-3-component-consolidation
```

### Component Rollback

Each task is atomic - can revert individual tasks:
- Task 1 rollback: Restore old textarea files, revert imports
- Task 2 rollback: Restore UI SpiderChart, revert imports
- Task 3 rollback: Revert button migrations
- Task 4 rollback: Revert spinner component
- Task 5 rollback: Revert text size changes
- Task 6 rollback: Delete documentation files
- Task 7 rollback: Revert README changes

### Mitigation

- **Make small, focused commits** for each file change
- **Test after each task** before moving to next
- **Document any breaking changes** immediately
- **Keep screenshots** of before/after for visual comparison

---

## Success Metrics

### Quantitative Metrics

- [ ] **LOC Reduction:** ~500+ lines removed from component library
- [ ] **File Count Reduction:** 7 textarea files → 2 files
- [ ] **Consistency:** 100% button usage through Button component
- [ ] **Consistency:** 100% spinner usage through Spinner component
- [ ] **Consistency:** 0 arbitrary text sizes remaining
- [ ] **Theme Coverage:** All components tested in 4 themes

### Qualitative Metrics

- [ ] **Maintainability:** Easier to update common component patterns
- [ ] **Developer Experience:** Clear documentation, easy to find components
- [ ] **Code Quality:** Consistent patterns, no duplication
- [ ] **Visual Consistency:** Uniform styling across all UI elements
- [ ] **Theme Support:** Seamless switching between themes

### Before/After Comparison

| Metric | Before Phase 3 | After Phase 3 | Improvement |
|--------|----------------|---------------|-------------|
| Textarea implementations | 7 | 2 | 71% reduction |
| SpiderChart implementations | 2 | 1 | 50% reduction |
| Raw button elements | 20+ | 0 | 100% removal |
| Spinner patterns | 3 | 1 | 67% reduction |
| Arbitrary text sizes | 23 | 0 | 100% removal |
| Component documentation | None | 2 comprehensive guides | ✅ |

---

## Dependencies & Prerequisites

### Technical Dependencies

- **Node.js:** 18+ (current version)
- **React:** 18.3.1
- **Next.js:** 14.2.35
- **Tailwind CSS:** 3.4.1
- **shadcn/ui:** Latest
- **Lucide React:** ^0.462.0 (for icons)
- **Recharts:** ^2.14.1 (for SpiderChart)

### Human Dependencies

- **Designer Review:** Visual review of theme consistency (optional but recommended)
- **QA Testing:** Full regression testing after completion
- **Team Communication:** Notify team of new component patterns

### Knowledge Prerequisites

- Understanding of React component composition
- Familiarity with Tailwind CSS
- Knowledge of TypeScript
- Experience with shadcn/ui patterns

---

## Timeline

### Task Breakdown

| Task | Description | Estimated Time | Dependencies |
|------|-------------|----------------|--------------|
| **0** | Create feature branch | 5 min | None |
| **1** | Textarea consolidation | 4-6 hours | None |
| **2** | SpiderChart deduplication | 1-2 hours | None |
| **3** | Button standardization | 3-4 hours | None |
| **4** | Spinner component | 1-2 hours | None |
| **5** | Text size cleanup | 2-3 hours | None |
| **6** | Design token docs | 2-3 hours | Tasks 1-5 complete |
| **7** | README update | 1 hour | Task 6 complete |
| **Testing** | Full regression testing | 2-3 hours | All tasks complete |

**Total Estimated Time:** 16-24 hours (2-3 days)

### Suggested Schedule

**Day 1:**
- Morning: Tasks 1-2 (Textarea, SpiderChart)
- Afternoon: Tasks 3-4 (Buttons, Spinner)
- EOD: Test and commit

**Day 2:**
- Morning: Task 5 (Text sizes)
- Afternoon: Task 6 (Documentation)
- EOD: Task 7 (README), test in all themes

**Day 3:**
- Morning: Final testing and fixes
- Afternoon: Create PR, team review
- EOD: Merge if approved

---

## Implementation Order

### Recommended Sequence

1. **Create branch** (Task 0) - Start clean
2. **Task 4 (Spinner)** - Smallest, builds confidence
3. **Task 2 (SpiderChart)** - Low risk, clear path
4. **Task 5 (Text sizes)** - Mostly find-and-replace
5. **Task 1 (Textarea)** - Largest, most complex
6. **Task 3 (Buttons)** - Many files, but straightforward
7. **Task 6 (Docs)** - Requires completion of 1-5
8. **Task 7 (README)** - Final touch

**Rationale:** Start with quick wins (Tasks 4, 2, 5) to build momentum, then tackle larger tasks (1, 3), and finish with documentation (6, 7).

---

## Risks & Mitigation

### Risk Matrix

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Visual regression in InputCanvas | Medium | High | Test thoroughly, incremental changes |
| Theme incompatibility | Low | Medium | Test all 4 themes after each task |
| Breaking existing functionality | Low | High | Run test suite after each task |
| Performance degradation | Low | Medium | Benchmark before/after |
| Missed raw buttons/spinners | Medium | Low | Use comprehensive search, manual audit |

### Specific Mitigations

**InputCanvas (2,024 lines):**
- This component is complex and central to the app
- Make textarea changes conservatively
- Test all InputCanvas features after Task 1
- Have rollback plan ready

**Theme Switching:**
- Test theme switching frequently during development
- Keep browser DevTools open to catch color issues
- Take screenshots in each theme for comparison

**Import Updates:**
- Use IDE's rename/refactor feature when possible
- Search globally before deleting old files
- Verify no broken imports with TypeScript

---

## Post-Implementation

### After Merge

1. **Monitor production** for any visual issues
2. **Gather team feedback** on new component patterns
3. **Update team wiki** with design system links
4. **Schedule design system training** for new team members

### Future Improvements

Consider for future phases:
- ESLint rules to enforce component usage
- Storybook for component showcase
- Visual regression testing automation
- Component performance monitoring
- Design system versioning

---

## References

### Internal Documentation

- [IMPLEMENTATION_PLAN.md](../IMPLEMENTATION_PLAN.md) - Full security & quality plan
- [AUDIT_SUMMARY.md](../AUDIT_SUMMARY.md) - Original audit findings
- [COLOR_TOKEN_MIGRATION.md](../00_Project_Specs/COLOR_TOKEN_MIGRATION.md) - Color token work (completed)

### Component Files

- `/web/src/components/ui/button.tsx` - Button component reference
- `/web/src/components/ui/textarea.tsx` - Base textarea
- `/web/src/components/shared/SpiderChart.tsx` - SpiderChart to keep
- `/web/tailwind.config.ts` - Tailwind configuration

### External Resources

- [shadcn/ui Documentation](https://ui.shadcn.com) - Base component patterns
- [Tailwind CSS](https://tailwindcss.com/docs) - Styling system
- [Class Variance Authority](https://cva.style/docs) - CVA for variants

---

## Appendix: File Checklist

### Files to Create

- [ ] `/web/src/components/ui/smart-textarea.tsx`
- [ ] `/web/src/components/ui/spinner.tsx`
- [ ] `/web/src/styles/design-tokens.md`
- [ ] `/web/docs/COMPONENT_USAGE.md`

### Files to Delete

- [ ] `/web/src/components/ui/SmartListTextarea.tsx`
- [ ] `/web/src/components/ui/BulletListEditor.tsx`
- [ ] `/web/src/components/ui/smart-bullet-editor.tsx`
- [ ] `/web/src/components/workshop/input-canvas/SmartTextarea.tsx`
- [ ] `/web/src/components/ui/MarkdownTextarea.tsx`
- [ ] `/web/src/components/workshop/input-canvas/TitleTextarea.tsx`
- [ ] `/web/src/components/ui/SpiderChart.tsx`

### Files to Modify

**Textarea imports (Task 1):**
- Find with: `rg -l "SmartListTextarea|BulletListEditor|smart-bullet-editor|MarkdownTextarea|input-canvas/SmartTextarea|TitleTextarea" web/src`

**SpiderChart imports (Task 2):**
- `/web/src/components/shared/SpiderChart.tsx` (enhance)
- Find imports: `rg -l "from.*components/ui/SpiderChart" web/src`

**Raw buttons (Task 3):**
- Find with: `rg '<button' web/src/components --type tsx -l`

**Inline spinners (Task 4):**
- Find with: `rg 'Loader2.*animate-spin|RefreshCw.*animate-spin|border-t-transparent.*animate-spin' web/src -l`

**Arbitrary text sizes (Task 5):**
- Find with: `rg 'text-\[10px\]|text-\[11px\]' web/src -l`

**README (Task 7):**
- [ ] `/web/README.md`

---

**Plan Created:** 2026-02-27
**Status:** Ready for Implementation
**Next Step:** Create feature branch and begin with Task 4 (Spinner Component)
