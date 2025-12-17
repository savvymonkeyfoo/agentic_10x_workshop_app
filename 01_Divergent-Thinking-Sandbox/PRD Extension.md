# Product Requirements Document: Extension v1.2 (Context & Ideation)

**Project:** Agentic 10x Workshop App – Phase 1 Extension
**Module:** "The Sandbox" (Pre-Opportunity Logic)
**Version:** 1.2.1 (The Research Loop)
**Target User:** Workshop Facilitator / Strategy Lead

---

## 1. Vision & Methodology

**The "Diverge-Then-Converge" Architecture**
The current application (Screens 2-4) is a *convergence* engine—it takes structured ideas and forces them through strict logic to find the best sequence. This extension adds the necessary *divergence* phase upfront.

**The "Defensible Intelligence" Principles:**

1. **Grounding the AI:** Ingesting client-specific context (Files, Tech Stack, Backlog) so the AI stops hallucinating generic advice.
2. **Active Research:** The system doesn't just wait for files; it *reads* the client's backlog, identifies gaps (Blind Spots), and generates a "Research Brief" for the user to execute.
3. **The Sandbox:** A digital whiteboard where ideas are mashed up, stress-tested, and *simulated* by AI personas before they enter the rigorous pipeline.

---

## 2. New Data Models

*To be added to `prisma.schema`.*

### **A. Collection: `WorkshopContext`**

*Stores the "Brain" of the specific workshop.*

* `context_id` (UUID): PK.
* `workshop_id` (UUID): FK.
* `client_dossier` (Vector Store Ref): Uploaded Enterprise Report (PDF/MD).
* `raw_backlog` (JSON): The client's original list of ideas (imported).
* `market_research` (Vector Store Ref): Uploaded "Outside-In" signals (PDFs/News).
* `research_brief` (Text): **NEW** - The AI-generated instructions for the researcher (Output of Stage 1).
* `extracted_constraints` (JSON): List of strategic non-negotiables extracted from the dossier.

### **B. Collection: `IdeaCard`**

*The "Post-it Note" – lighter than an Opportunity.*

* `idea_id` (UUID): PK.
* `workshop_id` (UUID): FK.
* `title` (String).
* `description` (Text): The evolving definition of the idea.
* `tier` (Enum): `Strategic_Bet` (Tier 1), `Table_Stakes` (Tier 2), `Agentic_Auto` (Tier 3).
* `source` (Enum): `Client_Backlog`, `Market_Signal`, `Workshop_Generated`.
* `status`: `Active`, `Archived`, `Promoted`.
* `simulation_result` (JSON): Stores the output of the "Synthetic Stress Test".
* `genealogy_metadata` (JSON): Stores IDs of "Parent" cards if merged.

### **C. Collection: `IdeaVersion` (History)**

* `version_id` (UUID): PK.
* `idea_id` (UUID): FK.
* `timestamp`: DateTime.
* `description_snapshot`: Text.
* `change_reason`: e.g., "Applied Infinite Capacity Lens".

---

## 3. Screen-by-Screen Requirements

### **Screen 1.5: The Research Interface (formerly Context Injection)**

**Purpose:** Configure the AI's knowledge base via a staged "Research Loop."

**Functional Requirements:**

#### **Stage 1: Context Ingestion (Grounding)**
* **Input A (The Reality):** Drag & Drop for "Enterprise Discovery Report" (MD/PDF).
    * *System Action:* Vectorize text. Extract `Strategic_Horizon`, `Tech_Stack`, and `Stakeholder_Risks`.
* **Input B (The Wishlist):** Import Client Backlog (CSV/Text).
    * *System Action:* Convert rows into `IdeaCard` objects (Source: `Client_Backlog`).
* **Trigger:** User clicks **"Analyze & Generate Brief"**.

#### **Stage 2: The Research Agent (Gap Analysis)**
* **AI Logic:** Compare `Input A` (Capabilities) vs. `Input B` (Backlog) vs. `Global Industry Trends` (LLM Knowledge).
* **Output:** Display a **"Research Brief"** text block.
    * *Content:* "Your backlog focuses on Cost Savings, but competitors are investing in GenAI Customer Service. Research 'Competitor X' and 'Trend Y'."
* **Action:** User uploads "Outside-In Signals" (PDF/News) based on this brief.
    * *System Action:* Vectorize and tag as `Market_Research`.

#### **Stage 3: The Intelligence Hub (Dashboard)**
* **Transition:** Automatically unlocked once Stage 2 is complete.
* **Visual Components:**
    1.  **Blind Spot Radar:** Venn diagram showing overlap between "Client Backlog" and "Market Signals." Highlights missed opportunities.
    2.  **Feasibility Heatmap:** List of Backlog items tagged with traffic lights based on the Enterprise Report (e.g., "Idea requires Kafka, but Kafka is missing in Tech Stack" -> **Red**).
    3.  **Strategic Clusters:** Auto-grouping of all ideas into themes (e.g., "Logistics Optimization", "Customer Self-Service").
* **Exit Action:** **"Enter Ideation Sandbox"** (Proceeds to Screen 1.6).

---

### **Screen 1.6: The Ideation Board (The Sandbox)**

**Purpose:** Divergent thinking, merging, simulation, and stress-testing.
**Layout:** Masonry Grid (Pinterest-style) of "Idea Cards".

#### **Feature A: The Portfolio Triage (Tiers)**
* **Visual Logic:** Gold Border (Tier 1), Blue Border (Tier 2), Grey Border (Tier 3).
* **Interaction:** Right-click or Dropdown to set Tier. Optimistic UI update.

#### **Feature B: The Agentic Merge (Synthesis)**
* **User Action:** Multi-select 2+ cards $\rightarrow$ Click **"Merge"**.
* **AI Logic (RAG-Enabled):**
    * *Prompt:* "Combine [Card A] and [Card B]. Reference [Client Dossier] for technical fit. Ensure compliance with [Extracted Constraints]."
* **Outcome:** Parent cards archived; New card created with `genealogy_metadata`.

#### **Feature C: The Synthetic Stress Test (Simulation)**
* **UI Component:** "Lightning Bolt" icon on card.
* **Logic:** AI assumes a specific persona from the Enterprise Report (e.g., "Conservative CFO" or "Union Rep") and critiques the idea.
* **Output:** Pass (Green Badge) or Risk Warning (Red Badge with reason).

#### **Feature D: The 3 Strategic Lenses (Expansion)**
* **UI Components:** Lens Icons (Infinity, Hourglass, Cycle).
* **Logic:** Rewrite the description applying the specific mental model.
* **Safety:** Version history enabled (Revert to previous).

---

## 4. The Exit Gate: Promotion Logic

**Transition:** From "Idea Card" (Screen 1.6) to "Opportunity" (Screen 2).

**User Action:**
1. Select "Winner" cards.
2. Click **"Promote to Pipeline"**.

**System Logic (The AI Bridge):**
* **Mapping:**
    * `Idea.Title` $\rightarrow$ `Opportunity.Project_Name`
    * `Idea.Description` $\rightarrow$ `Opportunity.Friction_Statement`
    * `Idea.Tier` $\rightarrow$ `Opportunity.Strategic_Horizon`
* **AI Inference:**
    * Use `WorkshopContext` to draft `Agent_Directive` and `Impacted_Systems`.
    * *Constraint:* Only list systems explicitly found in the `Tech_Stack_Assessment`.

**Result:**
* Redirect to Screen 2.
* New Opportunities appear with "Amber" completeness rings (requiring financial inputs).

---

## 5. Technical Constraints

1. **Vector Isolation:** The RAG engine must distinguish between `CLIENT_INTERNAL` (Dossier) and `MARKET_EXTERNAL` (Signals) context to power the "Blind Spot Radar."
2. **Latency:** Stage 2 (Brief Generation) takes ~5-10s. UI must show a "Thinking..." state (e.g., "Analyzing 50 Backlog Items...").
3. **Data Persistence:** The "Research Brief" must be saved to the DB so it isn't lost on refresh.