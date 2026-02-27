# Color Token Migration Guide

## Semantic Token System

This guide documents the migration from hardcoded Tailwind colors to semantic design tokens.

### Token Categories

#### State Colors
```typescript
// Warning/Caution (replaces yellow-* and amber-*)
bg-warning-subtle     // bg-yellow-50, bg-amber-50
bg-warning            // bg-yellow-500, bg-amber-500
text-warning          // text-yellow-500, text-amber-600
text-warning-muted    // text-yellow-300, text-amber-400
border-warning        // border-yellow-200, border-amber-200

// Success (replaces green-*)
bg-success-subtle     // bg-green-50
bg-success            // bg-green-500
text-success          // text-green-500, text-green-600
text-success-muted    // text-green-400
border-success        // border-green-200

// Info (replaces blue-*)
bg-info-subtle        // bg-blue-50, bg-blue-100
bg-info               // bg-blue-500, bg-blue-600
text-info             // text-blue-400, text-blue-500
text-info-muted       // text-blue-300
border-info           // border-blue-200

// Intelligence/AI (replaces indigo-* and purple-*)
bg-intelligence-subtle // bg-indigo-50, bg-purple-50
bg-intelligence        // bg-indigo-600, bg-purple-600
text-intelligence      // text-indigo-600, text-purple-600
text-intelligence-muted // text-indigo-500, text-purple-500
border-intelligence    // border-indigo-200, border-purple-200

// Destructive/Danger (replaces red-*)
bg-destructive         // bg-red-500
text-destructive       // text-red-600, text-red-400
hover:bg-destructive/10 // hover:bg-red-50
```

#### Text Emphasis
```typescript
// For user input (textareas, inputs) - use foreground for readability
text-foreground       // Main input text (dark, readable)
text-primary          // Headings, important labels (text-slate-900, text-slate-800)

// For secondary content (labels, captions, metadata)
text-secondary        // Labels, timestamps (text-slate-600, text-slate-500)
text-tertiary         // De-emphasized text (text-slate-400)
text-disabled         // Disabled state (text-slate-300)

⚠️ IMPORTANT: Never use text-secondary for input field text - it's too light!
```

#### Surfaces
```typescript
// Replaces slate-* backgrounds
bg-surface-subtle     // bg-slate-50
bg-surface-hover      // bg-slate-100
border-muted          // border-slate-200, border-slate-100
```

### Migration Examples

#### Before & After

**Text Colors:**
```tsx
// Before
className="text-slate-700"      // → text-primary
className="text-slate-500"      // → text-secondary
className="text-slate-400"      // → text-tertiary

// Warning states
className="text-amber-600"      // → text-warning
className="text-yellow-500"     // → text-warning

// Success states
className="text-green-500"      // → text-success

// Intelligence/AI features
className="text-indigo-600"     // → text-intelligence
className="text-purple-600"     // → text-intelligence
```

**Background Colors:**
```tsx
// Before
className="bg-amber-50"         // → bg-warning-subtle
className="bg-indigo-50"        // → bg-intelligence-subtle
className="bg-slate-50"         // → bg-surface-subtle
className="hover:bg-yellow-50"  // → hover:bg-warning-subtle
```

**Border Colors:**
```tsx
// Before
className="border-amber-200"    // → border-warning
className="border-slate-100"    // → border-muted
```

### Benefits

1. **Theme Consistency**: All colors automatically adapt to light/dark mode
2. **Design System**: Semantic names express intent, not visual appearance
3. **Maintainability**: Change theme colors in one place (globals.css)
4. **Accessibility**: Guaranteed contrast ratios across themes
5. **Flexibility**: Easy to add new themes without updating components

### Migration Status

- [x] Token system created in globals.css
- [x] Tailwind config updated
- [x] Component migration (**COMPLETE - 100%**)

**Migration Complete!** 🎉

- **Initial hardcoded colors:** 164 occurrences
- **Final hardcoded colors:** 0 occurrences
- **Components migrated:** 44 files
- **Completion rate:** 100%

#### Migration Batches

**Batch 1 (High-Impact):** 5 components, 77 occurrences

- CapabilitiesManager.tsx (16)
- AssetRegistry.tsx (16)
- IdeaCardDetail.tsx (15)
- IdeationBoard.tsx (15)
- charter/page.tsx (15)

**Batch 2 (Medium-Impact):** 3 components, 25 occurrences

- login/page.tsx (10)
- AIStrategistPanel.tsx (8)
- CanvasSidebar.tsx (7)

**Batch 3 (Final Cleanup):** 36 components, 62 occurrences

- All remaining components including charts, pages, and utilities
- Bulk migrations with automated sed replacements
- Dark mode variant standardization
- Token name corrections (e.g., bg-info-subtle0 → bg-info-subtle)
