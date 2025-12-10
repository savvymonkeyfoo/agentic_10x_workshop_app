**Project:** Agentic 10x Protocol Workshop App **Module:** Reporting Engine **Output Format:** A4 Landscape (PDF) & Interactive Web View

---

## 1. Data Schema Update (Revised)

_We must add these specific fields to the Input Schema (Document 1) and Prisma Schema._

### **A. Strategic Context**

- **Why Do It? (The Narrative):**
    
    - **Field:** `why_do_it` (Text / Multi-line).
        
    - **Prompt:** "Synthesize the Friction and the Outcome. Why is this urgent? e.g. 'As a [Customer], I want to [Outcome] so that [Benefit]'"
        
- **Strategic Horizon (The Category):**
    
    - **Field:** `strategic_horizon` (Enum).
        
    - **Options:** `Growth (Revenue)`, `Operational Capacity (Efficiency)`, `Strategy (Decision Speed)`.
        
- **T-Shirt Sizing (Effort/Scope):**
    
    - **Field:** `t_shirt_size` (Enum).
        
    - **Options:** `XS (Sprint)`, `S (Feature)`, `M (Module)`, `L (Platform)`, `XL (Transformation)`.
        

### **B. The Business Case (Quantitative)**

- **Quantitative Benefits (Hard Numbers):**
    
    - **Field:** `quantitative_benefits` (JSON/Structured).
        
    - **Inputs:**
        
        - `Annual Revenue Impact ($)`
            
        - `Cost Reduction ($)`
            
        - `Efficiency Improvement (Hrs/Week)`
            
- **DFV Assessment (Desirability, Feasibility, Viability):**
    
    - **Field:** `dfv_score` (Object).
        
    - **Inputs:** `Desirability (High/Med/Low)`, `Feasibility (High/Med/Low)`, `Viability (High/Med/Low)`.
        

### **C. Execution Details**

- **Definition of Done (The Success Criteria):**
    
    - **Field:** `definition_of_done` (Text / Bullet points).
        
    - **Prompt:** "What does 'Finished' look like? (e.g., 'Invoices paid in <2 mins', 'Accuracy >99%')."
        
- **Key Decisions & Dependencies:**
    
    - **Field:** `key_decisions` (Text).
        
    - **Prompt:** "What approvals or technical unlocks are required?"
        
- **Impacted Systems:**
    
    - **Field:** `impacted_systems` (Array of Strings).
        
    - **Prompt:** "What legacy systems will this agent touch? (e.g., SAP, Salesforce)."
        

---

## 2. The Visual Template (The "One-Pager" Layout)

_The Canvas is now a dense, high-value dashboard. It uses a **3-Column Grid**._

### **Column 1: The Strategic Why (30%)**

- **Header:** Project Name, ID, and **Strategic Horizon Badge** (Color-coded: Green/Growth, Blue/Ops, Purple/Strategy).
    
- **"Why Do It?" Block:** Large, narrative text block (The "Elevator Pitch").
    
- **The Agent Directive:** Trigger / Action / Guardrail / Autonomy Level.
    
- **DFV Assessment:** A simple "Traffic Light" row (D-F-V) visualized as 3 small circles.
    

### **Column 2: The Value Engine (40%)**

- **Quantitative Benefits:** Large KPI cards (e.g., **"$2M"** in big bold text).
    
- **VRCC Scorecard:** The 4 scores listed with their definitions.
    
- **Spider Chart:** High-res SVG render of the "Kite" shape (Value/Capability outward, Risk/Cost inward).
    
- **T-Shirt Size:** Visual Icon (e.g., a shirt outline with 'M').
    

### **Column 3: Technical Execution (30%)**

- **Definition of Done:** Bulleted checklist (The "Contract").
    
- **Capabilities Map:**
    
    - _Inputs (Consumed):_ Green/Amber Chips.
        
    - _Outputs (Produced):_ Blue Chips.
        
- **Impacted Systems:** List of System Icons/Tags (e.g., "SAP", "Salesforce").
    
- **Key Decisions:** Critical path text block.
    

---

## 3. Updated Prisma Schema Snippet

_Developer Instruction: Copy this model update to `schema.prisma`._

Code snippet

```
// Update to Model: Opportunity

model Opportunity {
  // ... existing fields ...

  // 1. Strategic Fields
  strategicHorizon   String   // "GROWTH", "OPS", "STRATEGY"
  whyDoIt            String   @db.Text
  tShirtSize         String   // "XS", "S", "M", "L", "XL"
  
  // 2. Quantitative Fields
  benefitRevenue     Float?   // Nullable (not every project has revenue)
  benefitCost        Float?
  benefitEfficiency  Float?
  
  // 3. DFV Assessment
  dfvDesirability    String   // "HIGH", "MED", "LOW"
  dfvFeasibility     String
  dfvViability       String
  
  // 4. Execution Fields
  definitionOfDone   String   @db.Text
  keyDecisions       String   @db.Text
  impactedSystems    String[] // Array of strings (e.g. ["SAP", "Jira"])
}
```

---

## 4. Export & Display Logic

- **PDF Export:** The PDF generator (`react-pdf`) must map these specific fields into the 3-column layout defined above.
    
- **Dynamic Resizing:** If "Why Do It?" text is long, Column 1 expands vertically, and the other columns align to the top.
    
- **Empty States:** If `benefitRevenue` is null, do not show "$0". Hide the card entirely to keep the layout clean.
    
- **System Tags:** If the user types "SAP", auto-detect and display the SAP logo (if available in icon set) or a generic database icon.