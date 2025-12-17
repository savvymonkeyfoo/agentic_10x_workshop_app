# Data Mapping Logic: Idea Card -> Opportunity

**Process:** Promotion (Screen 1.6 -> Screen 2)
**Status:** Mandatory Logic

---

## 1. Field-to-Field Mapping Table

When the user clicks **"Promote to Pipeline"**, the system creates a new `Opportunity` record.
The following mapping rules must be enforced by the Server Action (`actions/promote-idea.ts`).

| Source (`IdeaCard`) | Target (`Opportunity`) | Transformation Logic |
| :--- | :--- | :--- |
| `title` | `projectName` | Direct Copy. |
| `description` | `frictionStatement` | Direct Copy. |
| `tier` | `strategicHorizon` | **Enum Mapping:**<br>- `STRATEGIC_BET` -> `STRATEGY`<br>- `TABLE_STAKES` -> `OPS`<br>- `AGENTIC_AUTO` -> `GROWTH` |
| `source` | `whyDoIt` | **Prefix Injection:**<br>If source is `MARKET_SIGNAL`, prepend: *"Verified External Opportunity: "* |

---

## 2. AI Inference (The Auto-Fill)

The simple mapping above leaves many `Opportunity` fields empty (e.g., `impactedSystems`, `agentDirective`).
The system must run a **One-Shot Inference** using the `WorkshopContext`.

**Prompt:**
```text
Based on the project "[PROJECT_NAME]" and description "[DESCRIPTION]":

1. Scan the **Client Dossier** (Vector Context) to identify which systems are likely impacted.
   - *Target Field:* `impactedSystems` (Array).
   - *Constraint:* Only list systems explicitly found in the dossier (e.g., "SAP", "Salesforce").

2. Draft the "Agent Directive" (The Logic).
   - *Target Field:* `agentDirective` (JSON).
   - *Format:*
     {
       "trigger": "When [Event] happens...",
       "action": "The Agent will [Action]...",
       "guardrail": "Ensure [Safety Check]..."
     }

## 3. Status Handling
IdeaCard:

Set status = PROMOTED.

UI: The card remains on the board but is visually "dimmed" or marked with a "Checkmark" badge so it isn't promoted twice.

Opportunity:

The new Opportunity appears on Screen 2 (Input Canvas).

Completeness Ring: Will likely be "Amber" (Partially filled) because financial data (benefitRevenue) is missing.

User Task: The user must enter Screen 2 to add the specific $ and T-Shirt Size values.