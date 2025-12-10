**Project:** Agentic 10x Protocol Workshop App **Purpose:** Defines the exact "Definition of Done" for every feature.

## 1. Core User Stories (The Work Breakdown)

_These stories define the specific functional units of work for the development sprints._

### **Epic 1: The Input Experience (Screen 2)**

| **ID**     | **User Story**                                                                         | **Acceptance Criteria (Must Pass)**                                                                                                                                                                                                                                                                                            |
| ---------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **US-1.5** | As a Strategist, I need to quantify benefits ($) to prove ROI.                         | • Number inputs accept currency formatting (e.g., "1,000,000").<br><br>  <br><br>• Empty fields do not save as "$0", they save as `null`.                                                                                                                                                                                      |
| **US-1.6** | As a Facilitator, I need to quickly assess DFV (Desirability, Feasibility, Viability). | • The "Traffic Light" toggle allows single-click selection.<br><br>  <br><br>• Default state is "Unselected" (forcing a choice).                                                                                                                                                                                               |
| **US-1.7** | As a Facilitator, I want the AI to write the "Elevator Pitch" for me.                  | • Completing the "Agent Directive" auto-populates the "Why Do It" field.<br><br>  <br><br>• User can edit/overwrite the AI draft.                                                                                                                                                                                              |
| **US-1.8** | As a User, I need to tag "Impacted Systems" without typing duplicates.                 | • Type-ahead suggests previously used systems (e.g., "SAP").<br><br>  <br><br>• AI suggests systems based on the Agent Description.                                                                                                                                                                                            |
| **US-1.9** | As a User, I need intuitive navigation between views.                                  | • **Dashboard -> Canvas:** Clicking a "Resume" button on a Workshop Card opens Screen 2.<br><br>• **Canvas -> Dashboard:** A "Home" icon in the top-left corner returns to Screen 1.<br><br>• **Tile Navigation:** Clicking a Tile in the top bar instantly updates the Main Canvas state (Client-side transition, no reload). |

### **Epic 2: The Logic Engine (Screen 3)**

|ID|User Story|Acceptance Criteria (Must Pass)|
|---|---|---|
|**US-2.1**|As a System, I need to prevent circular logic crashes.|• Creating a dependency loop (A->B->A) immediately triggers the "Loop Breaker" modal.<br><br>  <br><br>• The "Analyse" button is disabled until the loop is resolved.|
|**US-2.2**|As a Strategist, I need to override the AI's sequencing.|• Dragging a card updates its Sequence Number.<br><br>  <br><br>• Dragging a Consumer before a Producer snaps it back and shows an error toast.|
|**US-2.3**|As a Client, I need to understand _why_ a project is sequenced first.|• The narrative footer uses the specific "Consultant Speak" defined in `ai_config.md`.<br><br>  <br><br>• It explicitly references "De-risking" or "Foundation Building".|

Export to Sheets

---

## 2. The "Ironclad" Testing Regime

_The developer must run these specific tests before handing over the build._

### **2.1 Performance Stress Test (The "Projector" Check)**

_Glassmorphism is computationally expensive. It can lag on large 4K screens._

- **Test:** Open the app on a 4K monitor.
    
- **Action:** Rapidly drag the "Value" slider back and forth.
    
- **Pass Condition:** The "Spider Chart" animation stays at 60fps. If it drops below 30fps, the "Blur" effect must be optimized (or reduced).
    

### **2.2 The "Fat Finger" Test (Input Resilience)**

- **Action:** Click the "Analyse" button repeatedly (spam click) while data is still loading.
    
- **Pass Condition:** The system processes only **one** request. No duplicate Matrix bubbles appear.
    

### **2.3 The "Offline" Test**

- **Action:** Disconnect Internet. Enter data into the fields.
    
- **Pass Condition:**
    
    - App does **not crash**.
        
    - AI "Ghost Thumbs" simply fail to appear (silent failure).
        
    - Data is saved locally (`local_storage`) so nothing is lost.
        

---

## 3. The "Definition of Done" Checklist

_Developer must check these boxes before zipping the final file._

- [ ] **Data Validation:** App loads successfully with the provided `seed_data.json`.
    
- [ ] **Visual Integrity:** Light/Dark toggle works instantly with no color flashing.
    
- [ ] **Logic Lock:** I cannot force a "Consumer" card before a "Producer" card.
    
- [ ] **AI Config:** The System Prompts match `ai_config.md` exactly.
    
- [ ] **Safety:** Deleting a "Parent" card is blocked by the system.