# # Executive Summary & Build Context

**To:** Engineering & Product Team **From:** Strategy Lead / Solution Architect **Subject:** Build Specifications for the Agentic 10x Protocol Application (v3.0)

**The Objective** We are building a high-fidelity "Command Center" for strategic AI workshops. This application replaces static slide decks with a live, interactive logic engine that guides Fortune 500 clients from "Idea" to a "Mathematically Prioritised Roadmap" in a single session.

**The Technical Core: Hybrid Neuro-Symbolic Architecture** This is not a standard CRUD application. It relies on a three-layer decision stack that combines deterministic code with probabilistic AI:

- **Layer 1 (The Guardrails):** Hard-coded graph theory logic that enforces dependencies (e.g., _“You cannot build the roof before the walls”_).
    
- **Layer 2 (The Strategist):** An LLM integration that analyses text to recommend risk profiles and identify "Safe Zone" pilots.
    
- **Layer 3 (The Ranking):** A weighted mathematical scoring system (VRCC) to visualise ROI velocity.
    

**Critical Development Constraints**

1. **Single View Architecture:** The laptop screen is mirrored to a large projector. The UI must be "Presentation Ready" at all times—no messy admin panels or raw error logs.
    
2. **Strict Logic Gates:** The system must proactively handle logic breaks (Circular Dependencies, Orphaned Tags) with specific resolution modals defined in **Section 4.3**. It cannot simply throw an error; it must offer a fix.
    
3. **Visual Precision:** The "Spider Chart" and "Matrix" are not generic visualisations. They must adhere to specific axis inversions (The "Kite" Logic) defined in **Section 4.4** to accurately represent the strategic value.
    

**Methodology Note** The logic in this PRD enforces specific consulting frameworks (The Autonomy Ladder, VRCC Scoring). These are not just labels; they are structural data requirements that drive the sequencing algorithm.

# Product Requirements Document (Master)

**Project:** Agentic 10x Protocol – Workshop Application **Version:** 3.0 (Build-Ready) **Target User:** Workshop Facilitators / Strategy Leads **Device Target:** Single View (Laptop mirrored to Large Display)

---

## 1. Product Vision & Methodology

To create a high-fidelity "Command Center" for the Agentic 10x Protocol Workshop. The application acts as a strict **Neuro-Symbolic Logic Engine**:

1. **Symbolic (Code):** Enforces hard technical constraints (Dependencies & Physics).
    
2. **Neural (AI):** Provides strategic reasoning (Risk & Commercial Viability).
    

**Core Constraint:** The system must prevent the "Pilot Trap" by identifying dependencies and sequencing projects logically.

---

## 2. Technical Architecture: The 3-Layer Logic Stack

_The system shall process all data through this strict hierarchy. Lower layers cannot be calculated until higher layers are valid._

### **Layer 1: The Hard Logic (Feasibility & Physics)**

- **Mechanism:** Deterministic Code (Graph Theory).
    
- **Rule A (The Feasibility Lock):** If _Opportunity B_ consumes a capability that _Opportunity A_ produces, _Opportunity A_ **MUST** mathematically precede _Opportunity B_.
    
- **Rule B (The Loop Breaker):** If the dependency graph detects a cycle (A → B → A), the system must **HALT**analysis and trigger the **Circular Dependency Modal** (See Section 4.3).
    

### **Layer 2: The AI Reasoning (Strategic Recommendation)**

- **Mechanism:** LLM (e.g., GPT-4o/Gemini) via API.
    
- **Trigger:** Asynchronous (See Screen 2 Logic).
    
- **Output:** **Recommendations Only**. The AI provides a "Draft View" (Ghost values) which the user must implicitly or explicitly accept.
    
- **Logic (Risk Staircasing):** If two projects share a capability, the AI checks the text descriptions. It recommends sequencing the **Internal/Low Risk** project _before_ the **External/High Risk** project.
    

### **Layer 3: Commercial Ranking (Maths)**

- **Mechanism:** Weighted Sorting Algorithm.
    
- **Formula:** Sort independent chains by **Efficiency Ratio** (Value Score / Complexity Score) to identify "Quick Wins".
    

---

## 3. Data Schema Specification

_The database must strictly adhere to these definitions to support the logic._

### **A. Collection: `Workshops`**

- `workshop_id` (UUID): Primary Key.
    
- `client_name` (String): Required.
    
- `status`: Enum [`Draft`, `Input`, `Analysis_Complete`].
    

### **B. Collection: `Opportunities` (The Asset)**
* `opportunity_id` (UUID): Primary Key.
* `workshop_id` (UUID): Foreign Key.

**1. Tab A: Strategic Context**
* `project_name` (String).
* `friction_statement` (Text).
* `strategic_horizon` (Enum): Growth, Ops, Strategy.
* `why_do_it` (Text): Auto-drafted "Elevator Pitch".

**2. Tab B: The Agent Directive**
* `trigger` (Text).
* `action` (Text).
* `guardrail` (Text).
* `autonomy_level` (Enum): Derived from Guardrail.
    * **L0 (Assist):** Human does it.
    * **L1 (Suggest):** Human approves.
    * **L2 (Execute):** Autonomous.

**3. Tab C: Business Case (VRCC + Financials)**
* **VRCC Scores:** `score_value`, `score_capability`, `score_complexity`.
* **Risk Scores:** `score_risk_final` (User), `score_risk_ai` (Ghost), `risk_override_log`.
* **Sizing:** `t_shirt_size` (XS-XL).
* **Quantitative:** `benefit_revenue`, `benefit_cost`, `benefit_efficiency`.
* **DFV Scores:** `dfv_desirability`, `dfv_feasibility`, `dfv_viability` (High/Med/Low).

**4. Tab D: Execution**
* `definition_of_done` (Text).
* `key_decisions` (Text).
* `impacted_systems` (Array of Strings).

**5. Logic Engine & Outputs**
* `capabilities_consumed` (Array): Objects with Status (Existing/Missing).
* `capabilities_produced` (Array): Strings.
* `sequence_rank` (Int).
* `matrix_coordinates` (X, Y, R).
        

---

## 4. Screen-by-Screen Functional Requirements

### **Screen 1: Dashboard**

- **Function:** Standard CRUD for Workshops.
    
- **Validation:** Prevent creation if `Client Name` is null.
    

---

### **Screen 2: Opportunity Capture (The Logic Core)**
*Layout: Top Nav (Tiles) + Main Canvas (Split View).*

#### **4.1. The "Completeness Gate" (Validation Logic)**
* **Visual:** Each Opportunity Tile in the top navigation has a **Progress Ring**.
* **Logic:**
    * `Grey`: Empty / Not Started.
    * `Amber`: <100% fields filled across **ANY** of the 4 tabs.
    * `Green`: 100% filled (All mandatory fields in all tabs are valid).
* **Hard Stop:** The "Analyse" button (Screen 3 trigger) is **Disabled** unless *All Active Cards* are Green.
* **Tab Indicators:** The individual Tab Headers (A, B, C, D) inside the card also show a small green dot when that specific tab is complete, allowing users to hunt down missing data quickly.

#### **4.2. The Input Form (Left Panel - Tabbed)**
*To handle the dense strategic data required for the Charter, the Left Panel uses a 4-Tab Architecture.*

* **Tab A: Strategy (The Context)**
    * **Project Name:** String.
    * **Friction Statement:** Multi-line text.
    * **Strategic Horizon:** Selector [`Growth`, `Ops`, `Strategy`].
    * **Why Do It?**: Text Area. *AI Trigger:* Auto-drafted based on Friction + Agent Directive.
* **Tab B: The Agent (The Logic)**
    * **Agent Directive:** `Trigger`, `Action`, `Guardrail`.
    * **Autonomy Level:** Read-only display (Calculated from Guardrail).
* **Tab C: Business Case (The Value)**
    * **T-Shirt Size:** Selector [`XS` to `XL`].
    * **Quantitative Benefits:**
        * `Revenue ($)`: Number input.
        * `Cost ($)`: Number input.
        * `Efficiency (Hrs)`: Number input.
    * **DFV Assessment:** Three "Traffic Light" toggles (High/Med/Low) for Desirability, Feasibility, Viability.
* **Tab D: Execution (The Details)**
    * **Definition of Done:** Bulleted text list.
    * **Key Decisions:** Multi-line text.
    * **Impacted Systems:** Tagging field. *AI Trigger:* Auto-suggests systems based on Capability tags.

#### **4.3. Asynchronous AI Trigger (Risk & Drafts)**
* **Risk Recommendation:**
    * **Trigger:** `On_Blur` from "Agent Directive".
    * **Action:** AI assesses Risk (1-5) and displays a **"Ghost Thumb"** on the Risk Slider.
* **Smart Pre-fill:**
    * **Trigger:** When user completes Tab B (The Agent).
    * **Action:**
        1.  **Auto-Draft "Why Do It":** Generates *"As a [Role], I want to [Action] so that [Benefit]"*.
        2.  **Auto-Tag Systems:** Scans text for keywords (e.g., "Salesforce", "SAP") and suggests tags in Tab D.

#### **4.4. Capability Logic & Dependency Protection**
* **Input Component:** Type-ahead "Chip" Creator (Right Panel).
* **State Selection:** User MUST toggle:
    * **Green (Existing):** No Dependency.
    * **Amber (Missing):** **Creates Dependency**.
* **The Gap Resolver (Quick Fix):**
    * **Trigger:** User adds a "Missing" tag with no Producer.
    * **Action:** Offer **"Spawn Parent"** button to auto-create the enabling project.
* **The "Load Bearing" Guardrail:**
    * **Trigger:** User attempts to **Delete Card** OR **Remove Tag**.
    * **Logic:** If tag is consumed by another active card $\rightarrow$ **BLOCK ACTION** and Alert User.

#### **4.5. Visual Feedback**
* **Spider Chart (The "Kite" Logic):**
    * **Axis Mapping:** Value/Capability (5=Outer), Risk/Complexity (1=Outer).
    * **Visual:** "Good" projects look like large, expanded kites.
* **Mini-Matrix:** Updates `(x, y)` dot position in real-time.

---

### **Screen 3: Strategic Analysis (The Matrix)**

#### **4.5. The Analysis Execution Flow**

- **User Action:** Clicks "Analyse Opportunities".
    
- **Step 1 (Layer 1 Check):**
    
    - Build Graph.
        
    - **Circular Logic Check:** If Loop detected → Open **"Loop Breaker Modal"** (Shows the chain, forces user to delete one link).
        
- **Step 2 (Layer 2 AI):**
    
    - **Generate "Strategy Narrative" (Footer Text):**

		- **Prompt Instruction:** The AI must use professional "Consultant Speak" to justify the sequence. Avoid generic summaries.
    
		- **Required Terminology:** Use terms like _"De-risking"_, _"Foundational Capability"_, _"Commercial Velocity"_, and _"Safe Zone Pilot"_.
    
		- **Output Template:** _"We have prioritised [Project A] (Sequence #1) despite its lower ROI. This allows the team to build and test the [Capability X] in a low-risk environment before deploying it to [Project B] (Sequence #2), effectively de-risking the external launch."_
        
- **Step 3 (Render):**
    
    - Plot bubbles on Matrix (X=Complexity, Y=Value, Radius=Value).
        
    - Draw lines for dependencies.
        

#### **4.6. Manual Overrides & Transparency**

- **Action:** User drags a bubble to a new Sequence # or Matrix position.
    
- **Visual Indicator:** Any card with a Manual Override (Risk or Sequence) gets a small **"User Edit Avatar"** icon attached to the bubble.
    
- **Hard Logic Check:**
    
    - If user drags _Project B (Consumer)_ before _Project A (Producer)_:
        
    - **Action:** Snap back immediately.
        
    - **Error Toast:** _"Logic Violation: Dependency 'OCR' requires Project A first."_
        

---

### **Screen 4: The Charter (Output)**

- **Function:** Read-only render of the final Sequence and Logic Narrative.
    
- **Restriction:** Inputs are locked. "Edit" button redirects back to Screen 2 (requires re-analysis).
    

---

## 5. VRCC Scoring Rubric (Standardised)

_The developer must hard-code these definitions into the UI Tooltips._