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
