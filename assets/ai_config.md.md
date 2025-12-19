# AI Configuration: Supreme Scout & Risk Analysis

## 1. Risk & Autonomy Agent (Layer 2)

*Trigger:* On_Blur of 'Agent Directive' fields (Tab B).

### **Variable: `RISK_ANALYSIS_PROMPT`**

**System Prompt:**

```text
ROLE: You are a Senior Enterprise Risk Officer.
TASK: Analyze the provided 'Agent Directive' (Trigger/Action/Guardrail).
OUTPUT FORMAT: JSON Only.

RULES FOR RISK (1-5):
1. PII/Data Privacy: IF action uses personal data -> Min Score 4.
2. Financial Execution: IF action moves money -> Min Score 3.
3. Read-Only: IF action is retrieval only -> Max Score 1.
4. Human-in-Loop: IF guardrail requires approval -> Reduce Score by 1.

RULES FOR AUTONOMY (L0-L2):
- L0 (Assist): Human does the work (e.g., "Drafts email for review").
- L1 (Suggest): Agent proposes, Human approves (e.g., "Human approval required").
- L2 (Execute): Fully autonomous (e.g., "Sends email automatically").

JSON SCHEMA:
{
  "suggested_risk_score": Integer (1-5),
  "autonomy_level": "Enum ['L0', 'L1', 'L2']",
  "reasoning_short": "String (Max 15 words)"
}
```

### **Variable: `NARRATIVE_GENERATION_PROMPT`**

```text
ROLE: You are a Strategy Partner at a top-tier consulting firm.
TONE: Professional, authoritative, strategic.
FORBIDDEN WORDS: "Cool", "Nice", "App", "Bot".
REQUIRED VOCABULARY: "De-risking", "Commercial Velocity", "Foundational Capability", "Horizon 1/2/3".

TASK: Write a 2-sentence executive summary explaining the Project Sequence.
INPUT DATA: List of sequenced projects with their 'Risk' and 'Dependency' attributes.

LOGIC TO NARRATE:
- Highlight why the first project was chosen (e.g., "It builds the foundation").
- Highlight why risky projects are later (e.g., "De-risked by the pilot").

EXAMPLE OUTPUT:
"We have prioritised the 'Internal Knowledge Agent' (Seq #1) to establish the RAG foundation in a safe environment. This approach effectively de-risks the subsequent deployment of the 'Customer Support Agent' (Seq #2), ensuring core capabilities are proven before public exposure."
```

## 2. Final `schema.prisma` (Merged)

*Change:* Merged the Strategic, Quantitative, and Execution fields into the main model so the developer doesn't have to "Add snippet here."

```prisma
// schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// 1. Workshop Container
model Workshop {
  id           String        @id @default(uuid())
  clientName   String
  createdAt    DateTime      @default(now())
  status       String        @default("INPUT") // Draft, Input, Analysis
  opportunities Opportunity[]
}

// 2. The Opportunity Asset
model Opportunity {
  id                String   @id @default(uuid())
  workshopId        String
  workshop          Workshop @relation(fields: [workshopId], references: [id])
  // Tab A: Strategic Context
  projectName       String
  frictionStatement String
  strategicHorizon  String // "GROWTH", "OPS", "STRATEGY"
  whyDoIt           String   @db.Text
  // Tab B: The Agent
  agentDirective    Json // { "trigger": "...", "action": "...", "guardrail": "...", "autonomy": "L1" }

  // Tab C: Business Case (VRCC + Financials)
  scoreValue        Int
  scoreCapability   Int
  scoreComplexity   Int
  scoreRiskFinal    Int      @default(0)
  scoreRiskAI       Int      @default(0)
  tShirtSize        String // "XS", "S", "M", "L", "XL"
  benefitRevenue    Float?
  benefitCost       Float?
  benefitEfficiency Float?
  dfvDesirability   String // "HIGH", "MED", "LOW"
  dfvFeasibility    String
  dfvViability      String
  // Tab D: Execution
  definitionOfDone  String   @db.Text
  keyDecisions      String   @db.Text
  impactedSystems   String[] // Logic Engine
  capabilitiesConsumed CapabilityConsumed[]
  capabilitiesProduced CapabilityProduced[]
  // Outputs
  sequenceRank      Int?
  matrixX           Float?
  matrixY           Float?
}

// 3. Capabilities
model CapabilityConsumed {
  id            String      @id @default(uuid())
  opportunityId String
  opportunity   Opportunity @relation(fields: [opportunityId], references: [id])
  name          String
  status        String // "EXISTING" or "MISSING"
}

model CapabilityProduced {
  id            String      @id @default(uuid())
  opportunityId String
  opportunity   Opportunity @relation(fields: [opportunityId], references: [id])
  name          String
}
```
