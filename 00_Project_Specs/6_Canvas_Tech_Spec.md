# Technical Specification: Opportunity Canvas & Reporting Engine

**Target Module:** `src/app/workshop/[id]/reporting`
**Goal:** Create a "Strategy One-Pager" generator that synthesizes data from the 4 workshop panels into a boardroom-ready PDF/Markdown artifact.

---

## 0. Navigation & Entry Point

**Goal:** Accessible navigation from the Workshop Header.

### **Update `src/components/workshop/WorkshopHeader.tsx` (or Main Layout)**
* **Action:** Add a 3rd Primary Navigation Tab/Button.
* **Label:** "Reporting" or "Canvas".
* **Icon:** `FileText` or `Presentation` (Lucide React).
* **Path:** Link to `/workshop/[id]/reporting`.
* **Visuals:** Ensure it shares the active state styling (e.g. blue underline/text) when on the reporting route.

### **Update `src/app/workshop/[id]/analysis/page.tsx` (Optional)**
* **Action:** Add a "Next Step" Call-to-Action at the top right.
* **Button:** "Go to Reporting" (ArrowRight icon).
* **Logic:** Guides the user naturally from the Analysis Matrix to the Output generation.

## 1. Architecture & Routing

### **New Route Structure**
* **Path:** `/workshop/[id]/reporting`
* **Layout:**
    * **Left Sidebar (250px):** Project Navigation & Status.
    * **Main Content (Flex-1):** The "Canvas Workspace" (A4 Preview Area).

### **Data Model Updates (Prisma)**
* **Update `Opportunity` Model:**
    * Add `canvasLastGeneratedAt` (DateTime, nullable).
    * *Rationale:* Used to track "Generated" vs "Outdated" status.
    * *Logic:* If `updatedAt > canvasLastGeneratedAt`, status is "Outdated".

---

## 2. Component Specifications

### **A. The Project Sidebar (`CanvasSidebar.tsx`)**
* **Data Source:** List of all Opportunities in the current Workshop.
* **Visual Item:**
    * **Name:** Project Title.
    * **Status Dot:**
        * ⚪ **Grey:** Not Generated (`canvasLastGeneratedAt` is null).
        * 🟢 **Green:** Up to Date.
        * 🟡 **Amber:** Outdated (Data changed since last generation).
* **Action:** Clicking an item loads it into the Main Canvas view.

### **B. The Main Canvas (`CanvasWorkspace.tsx`)**
* **Layout:** A4 Landscape Aspect Ratio (297mm x 210mm).
* **Grid System:** CSS Grid with 3 Columns (30% / 35% / 35%).
* **Responsiveness:** Scale content using `transform: scale()` to fit the viewport, but strictly maintain A4 proportions for PDF consistency.

#### **Section Mapping (Data Injection)**

| Canvas Section | Source Data (Opportunity Model) | Component Type |
| :--- | :--- | :--- |
| **HEADER** | `projectName`, `strategicHorizon` | `EditableText` |
| **THE FRICTION** | `frictionStatement` | `EditableText` (Multi-line) |
| **THE SOLUTION** | *Derived* (Agent Directive or Summary) | `EditableText` |
| **STRATEGIC FIT** | **Chart:** Value/Effort Matrix | `StaticImage` (Re-render existing chart) |
| **FINANCIALS** | `benefitRevenue`, `benefitCostAvoidance` | `BigNumberDisplay` |
| **EFFORT** | `tShirtSize` | `IconDisplay` |
| **SCORES** | `vrccScore`, `dfvScore` | `ScoreCard` / `SpiderChart` |
| **WORKFLOW** | `workflowPhases` | `PhaseCardMiniMap` (Simplified horizontal view) |
| **RISKS** | `systemGuardrails` | `EditableList` |
| **CAPABILITIES** | `capabilitiesMissing` | `TagCloud` |

### **C. The "Editable" Logic**
* **Requirement:** The user must be able to refine the text *on the canvas* before exporting.
* **Implementation:**
    * Use "Transparent Textareas".
    * **On Change:** Update the local state AND trigger a `debouncedSave` to the Database.
    * *Note:* This means editing the Canvas *updates the source of truth*.

---

## 3. The "Generate" Workflow

1.  **User Clicks "Generate" (Sidebar):**
    * Check `canvasLastGeneratedAt`.
    * **If Exists:** Show `ActionConfirmationModal`: "A canvas exists. Re-generating will update the timestamp. Continue?"
    * **On Confirm:**
        * Fetch latest data.
        * Update `canvasLastGeneratedAt = new Date()`.
        * Render the A4 view.

---

## 4. Export Engine Specifications

### **A. PDF Export (`html2canvas` + `jspdf`)**
* **Trigger:** "Export PDF" Button (Top Right).
* **Process:**
    1.  Target the DOM Element ID `canvas-a4-container`.
    2.  Use `html2canvas` to capture a high-res bitmap (scale: 2).
    3.  Use `jspdf` to place that image into an A4 Landscape PDF.
    4.  Trigger Browser Download: `[ProjectName]_Canvas.pdf`.

### **B. Markdown Export**
* **Trigger:** "Export Markdown" Button.
* **Process:**
    * Construct a template string injecting the current data fields.
    * Format: Standard Headers (`#`), Bullet Points (`-`), and Bold (`**`).
    * Trigger Download: `[ProjectName].md`.

---

## 5. Implementation Plan (Phased)

* **Phase 1:** Scaffold the `/reporting` page and Sidebar logic.
* **Phase 2:** Build the `CanvasWorkspace` layout (The 3-Column Grid).
* **Phase 3:** Wire up the "Editable" fields to the Database.
* **Phase 4:** Implement the "Generate/Update" timestamp logic.
* **Phase 5:** Build the PDF/Markdown Export functions.