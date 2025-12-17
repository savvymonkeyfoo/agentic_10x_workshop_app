# UI Component Specifications: Ideation Board

**Framework:** React / Tailwind CSS / Shadcn UI
**Icon Set:** Lucide React

---

## 1. Component: `IdeaCard.tsx`

**Visual Structure:**
A "Post-it" style card with a distinct border color indicating strategic value.

### A. The Container (Tier Logic)
* **Tier 1 (Strategic Bet):**
    * Border: `border-amber-400 border-2`
    * Bg: `bg-amber-50/50` (Subtle warm tint)
    * Shadow: `shadow-md`
* **Tier 2 (Table Stakes):**
    * Border: `border-blue-200 border`
    * Bg: `bg-white`
    * Shadow: `shadow-sm`
* **Tier 3 (Agentic Auto):**
    * Border: `border-slate-200 border`
    * Bg: `bg-slate-50`
    * Shadow: `shadow-none`

### B. The Header
* **Title:** `font-bold text-sm text-slate-900` (Truncate after 2 lines).
* **Actions (Top Right):**
    * `HistoryIcon` (Clock): Opens version history side-sheet.
    * `DragHandle` (GripVertical): For `@dnd-kit` interaction.

### C. The Body
* **Description:** `text-xs text-slate-600 leading-relaxed`.
* **Max Height:** Clamp to 150px with a "Read More" fade if text is too long.

### D. The Footer (The Lenses)
* **Layout:** Flex row, justify-between, `border-t border-slate-100 pt-2 mt-2`.
* **Lens Buttons:** Small Icon Buttons (`h-6 w-6 rounded-full`).
    * *Infinite Capacity:* `Icon: Infinity` (Hover: Text "Scale").
    * *Constraints:* `Icon: Hourglass` (Hover: Text "Bottleneck").
    * *OODA:* `Icon: RefreshCw` (Hover: Text "Speed").
* **Interaction:** Clicking a lens triggers a "Pulse" animation on the card while AI generates the rewrite.

---

## 2. Component: `IdeationBoard.tsx`

**Layout Engine:** Masonry Grid
* **Library:** CSS Grid or `react-masonry-css` wrapper.
* **Columns:**
    * Desktop (lg): 4 Columns.
    * Tablet (md): 3 Columns.
    * Mobile (sm): 1 Column.

**Interaction: The "Merge" Zone**
* **Trigger:** User selects 2+ cards (Shift + Click).
* **Visual State:**
    * Selected cards get a `ring-2 ring-offset-2 ring-indigo-500`.
    * A **Floating Action Bar (FAB)** appears at the bottom center of the screen.
    * **FAB Content:** "Merge 2 Cards" (Button) | "Cancel" (Button).

**Loading State (AI Processing):**
* Do NOT freeze the UI.
* Show a **"Ghost Card"** (Skeleton Loader) at the top of the list with a "Shimmer" animation.
* Text Label: *"Synthesizing new concept..."*

---

## 3. Component: `ResearchInterface.tsx` (Screen 1.5)

**Layout:** Full-screen dashboard with a 3-stage progression state.

### Stage 1: Context Ingest
**Visuals:**
* **Two FileUploadZones (Side-by-Side):**
    1.  **Enterprise Report:** `bg-slate-50`, Icon: `FileText`, Label: "Upload Strategy Docs".
    2.  **Client Backlog:** `bg-slate-50`, Icon: `Table`, Label: "Upload CSV/Excel".
* **Action Button:** "Generate Research Brief" (Centered, Large).
    * *State:* Disabled until both zones have files.

### Stage 2: The Research Loop
**Layout:** Split View (50/50).
* **Left Panel (The Brief):**
    * Component: `ScrollArea` with Markdown rendering.
    * Content: AI-generated text listing specific research targets (e.g., "Find Competitor X's AI use case").
    * Style: Monospace font, "Terminal" aesthetic (`bg-slate-900 text-green-400` header).
* **Right Panel (The Evidence):**
    * **FileUploadZone:** Label: "Upload Outside-In Signals".
    * **Action Button:** "Synthesize & Enter Hub" (`bg-emerald-600`).

### Stage 3: The Intelligence Hub (Dashboard)
**Layout:** 3-Column Grid.

**A. The Blind Spot Radar (Left Col)**
* **Visual:** Vertical list of "Insight Cards".
* **Logic:** Comparison of `Market_Signals` vs. `Client_Backlog`.
* **States:**
    * **CRITICAL (Red):** High market activity / Zero client backlog.
    * **ALIGNED (Green):** Client backlog matches market trend.

**B. The Feasibility Heatmap (Center Col)**
* **Visual:** Compact list of backlog items.
* **Badges:**
    * `READY` (Green): Capabilities exist (from Enterprise Report).
    * `BLOCKED` (Red): Required tech is marked as "Gap" in Report.
    * `RISKY` (Orange): Tech exists but is low maturity.

**C. Strategic Clusters (Right Col)**
* **Visual:** Large "Folder" style cards.
* **Content:** Groups ideas by Strategic Horizon (Growth, Ops, Strategy).
* **Interaction:** Clicking a cluster filters the view or proceeds to the Sandbox.