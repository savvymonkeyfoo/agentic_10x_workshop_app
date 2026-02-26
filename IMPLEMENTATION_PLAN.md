# Security & Code Quality Implementation Plan
**Date:** February 26, 2026
**Current Security Score:** 7.5/10
**Target Security Score:** 9.5/10
**Estimated Total Effort:** 2-3 weeks

---

## Phase 1: Critical Security Fixes (BEFORE PRODUCTION)
**Priority:** P0 - Required before deployment
**Estimated Effort:** 1 day
**Risk Level:** Low (additive changes only)

### Tasks

#### 1.1 Implement API Rate Limiting
**Files to modify:**
- `/web/src/app/api/upload/route.ts`
- `/web/src/app/api/index-rag/route.ts`
- Any AI-powered API endpoints

**Implementation:**
```typescript
import { apiRateLimiter } from '@/lib/rate-limit';

export async function POST(request: Request) {
    const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
    const { success } = await apiRateLimiter.limit(ip);

    if (!success) {
        return NextResponse.json(
            { error: 'Too many requests. Please try again later.' },
            { status: 429 }
        );
    }

    // ... existing handler logic
}
```

**Validation:** Test with rapid API calls, verify 429 responses after rate limit exceeded.

---

#### 1.2 Protect Seed Endpoint
**File:** `/web/src/app/api/seed-zurich/route.ts`

**Implementation:**
```typescript
export async function GET() {
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
            { error: 'Not available in production' },
            { status: 403 }
        );
    }

    // ... existing seeding logic
}
```

**Alternative:** Remove route entirely if not needed in production.

---

#### 1.3 Fix URL Path Bug
**File:** `/web/src/app/actions/analyze-workshop.ts:124`

**Current (broken):**
```typescript
revalidatePath(`/ workshop / ${workshopId}/analysis`);
```

**Fixed:**
```typescript
revalidatePath(`/workshop/${workshopId}/analysis`);
```

---

### Phase 1 Acceptance Criteria
- [ ] API endpoints return 429 status after rate limit exceeded
- [ ] Seed endpoint returns 403 in production environment
- [ ] URL revalidation path is correct (no spaces)
- [ ] All existing tests pass
- [ ] Manual smoke test: upload file, trigger rate limit

---

## Phase 2: Code Simplification & Cleanup
**Priority:** P1 - High impact on maintainability
**Estimated Effort:** 2-3 days
**Risk Level:** Medium (refactoring existing code)

### Tasks

#### 2.1 Remove `validateData` Wrapper (23 lines + 21 imports)
**File:** `/web/src/lib/validation.ts:196-218`

**Action:** Delete the `validateData` function entirely.

**Migration pattern for all action files:**
```typescript
// OLD:
const validation = validateData(schema, data);
if (!validation.success) {
    throw new Error(`Validation failed: ${validation.errors?.join(', ')}`);
}
const validatedData = validation.data;

// NEW:
const result = schema.safeParse(data);
if (!result.success) {
    throw new Error(`Validation failed: ${result.error.format()}`);
}
const validatedData = result.data;
```

**Files to update (21 files):**
- All files in `/web/src/app/actions/*.ts`

---

#### 2.2 Delete Unused `safeAction` Wrapper (26 lines)
**File:** `/web/src/lib/safe-action.ts`

**Action:**
1. Update `/web/src/app/actions/promotion.ts` to use direct try-catch
2. Delete `/web/src/lib/safe-action.ts`

---

#### 2.3 Standardize Error Responses
**Goal:** Single error response shape across all 20 action files

**Type definition to add to `/web/src/lib/types.ts`:**
```typescript
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };
```

**Update all action files to return this shape consistently.**

**Files affected:** All 20 files in `/web/src/app/actions/`

---

#### 2.4 Remove Legacy Function Aliases (17 lines)
**File:** `/web/src/app/actions/delete-opportunity.ts:44-59`

**Actions:**
1. Search codebase for calls to `deletePromotedOpportunity` and `deleteIdeationOpportunity`
2. Replace with direct `deleteOpportunity` calls
3. Delete the alias functions

---

#### 2.5 Strip Production Logging (15+ lines)
**Action:** Remove all `console.log` statements from action files.

**Keep:** `console.error` for actual error logging.

**Remove:** Debug logs, data dumps, "Processing..." logs.

**Files:** All `/web/src/app/actions/*.ts` files

---

#### 2.6 Remove Comment Noise (45 lines)
**File:** `/web/src/lib/validation.ts`

**Action:** Remove excessive banner comments like:
```typescript
// ============================================================================
// Workshop Validation Schemas
// ============================================================================
```

**Keep:** Meaningful JSDoc comments explaining complex validation logic.

---

#### 2.7 Consolidate Validation Schemas (30 lines saved)
**File:** `/web/src/lib/validation.ts:17-103`

**Refactor:**
```typescript
const opportunityBaseSchema = z.object({
    projectName: z.string().min(1).max(200),
    description: z.string(),
    // ... all shared fields
});

export const saveOpportunitySchema = opportunityBaseSchema;
export const updateOpportunitySchema = opportunityBaseSchema.partial().refine(...);
```

---

#### 2.8 Eliminate Defensive Duplication in save-opportunity.ts (25 lines saved)
**File:** `/web/src/app/actions/save-opportunity.ts:20-69`

**Current issue:** Validates with Zod, then re-validates every field with `|| ""` fallbacks.

**Fix:** Trust the Zod validation, use `validatedInput` directly without fallbacks.

---

### Phase 2 Acceptance Criteria
- [ ] All 20 action files use direct `safeParse()` calls
- [ ] All actions return standardized `ActionResult<T>` type
- [ ] No `console.log` statements in production code
- [ ] Legacy delete aliases removed and callers updated
- [ ] Validation schemas consolidated with shared base
- [ ] All existing tests pass
- [ ] No regressions in error handling

**Estimated LOC Reduction:** ~276 lines (12.6% of actions codebase)

---

## Phase 3: Component Consolidation & Design System
**Priority:** P2 - UI consistency and maintainability
**Estimated Effort:** 1 week
**Risk Level:** Medium-High (affects UI rendering)

### Tasks

#### 3.1 Consolidate Modal Components
**Current state:** 4 different modal implementations
- `/web/src/components/ui/DeleteConfirmationModal.tsx`
- `/web/src/components/ui/ConfirmationModal.tsx`
- `/web/src/components/ui/ActionConfirmationModal.tsx`
- `/web/src/components/workshop/DeleteConfirmationModal.tsx`

**Target:** Single `ConfirmationModal` component with variants

**New API:**
```typescript
interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void | Promise<void>;
    title: string;
    description: string;
    variant?: "default" | "destructive" | "warning";
    confirmLabel?: string;
    cancelLabel?: string;
    isLoading?: boolean;
}
```

**Migration:**
1. Create new unified `ConfirmationModal.tsx` in `/web/src/components/ui/`
2. Update all callers to use new component
3. Delete old modal files

**Files affected:** 15+ component files that use modals

---

#### 3.2 Consolidate Textarea Components
**Current state:** 7 textarea implementations
- `SmartListTextarea.tsx`
- `BulletListEditor.tsx`
- `smart-bullet-editor.tsx`
- `input-canvas/SmartTextarea.tsx`
- `MarkdownTextarea.tsx`
- `textarea.tsx` (base)
- `input-canvas/TitleTextarea.tsx`

**Target:** Composable textarea system
- Base: `textarea.tsx` (keep as-is)
- Extension: `SmartTextarea.tsx` with auto-grow, bullet list, markdown support

**New API:**
```typescript
interface SmartTextareaProps extends TextareaProps {
    autoGrow?: boolean;
    bulletList?: boolean | "auto";
    markdown?: boolean;
}
```

**Migration:**
1. Enhance base `textarea.tsx` with composable features
2. Update all callers to use new unified component
3. Delete redundant implementations

---

#### 3.3 Remove Duplicate SpiderChart
**Files:**
- `/web/src/components/ui/SpiderChart.tsx` (154 lines)
- `/web/src/components/shared/SpiderChart.tsx` (130 lines)

**Action:**
1. Compare feature parity between both implementations
2. Keep the more flexible one (likely `shared/SpiderChart.tsx`)
3. Update imports in calling components
4. Delete the other file

---

#### 3.4 Replace Hardcoded Colors with Theme Tokens
**Issue:** 37 hardcoded Tailwind colors break theme switching

**Migration pattern:**
```typescript
// OLD (breaks themes):
className="bg-blue-500 text-white"
className="bg-red-600 hover:bg-red-700"
className="border-amber-200"

// NEW (theme-aware):
className="bg-primary text-primary-foreground"
className="bg-destructive hover:bg-destructive/90"
className="border-muted"
```

**Files to update (15 files):**
- `/web/src/components/workshop/IdeaCard.tsx` (8 instances)
- `/web/src/components/reporting/CanvasWorkspace.tsx` (6 instances)
- `/web/src/components/analysis/AIStrategistPanel.tsx` (9 instances)
- `/web/src/components/divergent/IdeaFocusView.tsx` (6 instances)
- 11 other component files

**Test:** Switch between all 4 themes (Capgemini, Claude, Nexus, Aether) and verify colors update correctly.

---

#### 3.5 Replace Raw Buttons with Button Component
**Issue:** 20+ raw `<button>` elements with inline styles

**Migration pattern:**
```typescript
// OLD:
<button
    onClick={onClick}
    className="px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 rounded-lg"
>

// NEW:
<Button variant="destructive" size="sm" onClick={onClick}>
```

**Files affected:** 12+ component files with raw buttons

---

#### 3.6 Standardize Design Tokens

**Create:** `/web/src/styles/design-tokens.md` documentation

**Define standards:**
- **Border radius:** cards (`rounded-xl`), modals (`rounded-2xl`), buttons (`rounded-lg`), inputs (`rounded-md`)
- **Shadows:** cards (`shadow-sm hover:shadow-md`), modals (`shadow-xl`), elevated (`shadow-lg`)
- **Z-index:** modal (50), overlay (40), dropdown (30), tooltip (20), default (0)
- **Transitions:** default (`transition-colors`), movement (`transition-all duration-200`)

**Audit and update:** 114+ shadow usages, 21 z-index declarations, 136 transition declarations

---

#### 3.7 Create Reusable Spinner Component
**Current state:** 3 different loading spinner implementations

**Create:** `/web/src/components/ui/spinner.tsx`
```typescript
interface SpinnerProps {
    size?: "sm" | "md" | "lg";
    className?: string;
}
```

**Standardize on:** Lucide's `Loader2` with `animate-spin`

---

#### 3.8 Remove Arbitrary Text Sizes
**Issue:** `text-[10px]`, `text-[11px]` appear 15 times (non-standard)

**Migration:** Use standard Tailwind scale (`text-xs`, `text-sm`, etc.)

---

### Phase 3 Acceptance Criteria
- [ ] Single modal component used throughout app
- [ ] Single smart textarea system
- [ ] No duplicate SpiderChart
- [ ] Zero hardcoded color classes (all use theme tokens)
- [ ] All buttons use Button component (no raw elements)
- [ ] Design token documentation created
- [ ] Visual regression tests pass in all 4 themes
- [ ] Component library reduced by ~25-30% LOC

---

## Phase 4: Next.js Upgrade & Advanced Security
**Priority:** P3 - Dependency security and future-proofing
**Estimated Effort:** 3-5 days
**Risk Level:** High (breaking changes in framework)

### Tasks

#### 4.1 Upgrade Next.js (Fixes 2 High-severity DoS CVEs)
**Current version:** 14.2.35
**Target version:** 16.1.6+

**Breaking changes to address:**
- Server Components API changes
- Middleware signature updates
- App Router refinements
- Image optimization changes

**Migration steps:**
1. Read Next.js 15.x and 16.x migration guides
2. Update `package.json` dependencies
3. Run `npm install`
4. Fix TypeScript errors
5. Update middleware if needed
6. Update Server Components patterns
7. Test all routes and API endpoints
8. Run full test suite

**Rollback plan:** Keep backup branch before upgrade.

---

#### 4.2 Add Resource Ownership Authorization (If Multi-tenant)
**Current gap:** Server actions don't verify resource ownership

**If implementing multi-tenancy:**

**Add to middleware or create auth utility:**
```typescript
export async function verifyOwnership(
    resourceType: 'workshop' | 'opportunity',
    resourceId: string,
    userId: string
): Promise<boolean> {
    // Query DB to verify user owns this resource
}
```

**Update all 20 action files** to include ownership checks before CRUD operations.

**If single-tenant deployment:** Mark this as low priority / document as known limitation.

---

#### 4.3 Implement Centralized Audit Logging
**Goal:** Replace console.log with structured logging service

**Options:**
- Datadog APM
- Sentry
- AWS CloudWatch
- Self-hosted Loki/Grafana

**Implementation:**
1. Choose logging service
2. Install SDK
3. Create logger utility in `/web/src/lib/logger.ts`
4. Add audit trail for sensitive operations:
   - Login attempts (success/failure)
   - Workshop CRUD operations
   - Opportunity deletions
   - RAG indexing operations
5. Set up alerting for suspicious patterns

---

#### 4.4 Refine CSP Headers
**Goal:** Remove `unsafe-inline` and `unsafe-eval` from CSP

**Next.js 16+ feature:** CSP nonces for inline scripts

**Implementation:**
1. Enable nonce-based CSP in `next.config.js`
2. Test all pages and components
3. Update any third-party scripts to use nonces
4. Remove `unsafe-inline` and `unsafe-eval` directives

**Fallback:** If nonces cause issues, document as technical debt for Next.js 17+.

---

#### 4.5 Migrate to Secret Management Service
**Current:** `.env` files in local directory

**Target:** Vercel environment variables or AWS Secrets Manager

**Benefits:**
- Centralized secret rotation
- Audit trail for secret access
- No local `.env` files to accidentally commit
- Team collaboration without sharing secrets

**Implementation:**
1. Export all secrets from `.env` to chosen service
2. Update deployment pipeline to inject secrets
3. Test in staging environment
4. Update documentation
5. Delete local `.env` files (keep `.env.example`)

---

### Phase 4 Acceptance Criteria
- [ ] Next.js upgraded to 16.1.6+ with no regressions
- [ ] All tests pass on new Next.js version
- [ ] Structured logging implemented (if chosen)
- [ ] CSP headers refined (or documented as future work)
- [ ] Secret management service configured (optional)
- [ ] Security score reaches 9.5/10
- [ ] Full production smoke test completed

---

## Testing Strategy

### Phase 1 Testing
- **Manual:** Test rate limiting with rapid API calls
- **Manual:** Verify seed endpoint blocked in production
- **Manual:** Test workshop analysis flow (URL revalidation)

### Phase 2 Testing
- **Automated:** Run existing test suite after each refactor
- **Manual:** Test all CRUD operations (create/update/delete for workshops, opportunities, assets)
- **Manual:** Verify error messages display correctly

### Phase 3 Testing
- **Visual:** Screenshot testing in all 4 themes
- **Manual:** Test all modal flows (delete confirmations, warnings)
- **Manual:** Test textarea components (bullet lists, markdown, auto-grow)
- **Automated:** Add component tests for new unified components

### Phase 4 Testing
- **Automated:** Full regression test suite
- **Manual:** Complete user journey testing (signup → workshop → analysis → export)
- **Performance:** Load testing for API rate limits
- **Security:** Re-run security audit

---

## Rollback Plans

### Phase 1
- **Risk:** Low (additive changes only)
- **Rollback:** Revert commits, no data loss

### Phase 2
- **Risk:** Medium (refactoring existing code)
- **Rollback:** Git revert to before phase
- **Mitigation:** Make changes in small, reviewable commits

### Phase 3
- **Risk:** Medium-High (UI changes visible to users)
- **Rollback:** Revert to previous component implementations
- **Mitigation:** Deploy to staging first, get user feedback

### Phase 4
- **Risk:** High (framework upgrade)
- **Rollback:** Maintain backup branch before upgrade
- **Mitigation:** Test thoroughly in staging, have downtime window planned

---

## Success Metrics

### Security
- [ ] Security audit score: 7.5/10 → 9.5/10
- [ ] Zero Critical or High severity vulnerabilities
- [ ] All API endpoints rate-limited
- [ ] 100% theme token usage (no hardcoded colors)

### Code Quality
- [ ] LOC reduction: ~276 lines from actions, ~500+ lines from components
- [ ] Single modal component (from 4)
- [ ] Single textarea system (from 7)
- [ ] Standardized error handling across all actions

### Maintainability
- [ ] Design system documentation created
- [ ] Component library 25-30% smaller
- [ ] Zero duplicate components
- [ ] Consistent styling patterns

---

## Timeline

| Phase | Duration | Dependencies | Can Start |
|-------|----------|--------------|-----------|
| **Phase 1** | 1 day | None | Immediately |
| **Phase 2** | 2-3 days | Phase 1 complete | After Phase 1 |
| **Phase 3** | 1 week | Phase 2 complete | After Phase 2 |
| **Phase 4** | 3-5 days | Phase 3 complete | After Phase 3 |

**Total Timeline:** 2-3 weeks for all phases

**Can be parallelized:** Phase 3 (UI) and Phase 2 (backend actions) could run in parallel if working with multiple developers.

---

## Notes

- Each phase builds on the previous one
- Phase 1 is **required** before production deployment
- Phase 2-3 improve maintainability but are not blocking
- Phase 4 addresses dependency security (Next.js CVEs) and can be scheduled within 30 days
- All changes should be reviewed and tested in staging before production
- Create pull requests for each phase for reviewability

---

**Last Updated:** February 26, 2026
**Status:** Ready for Phase 1 execution