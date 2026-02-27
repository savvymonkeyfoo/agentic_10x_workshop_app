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
