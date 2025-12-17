# AI Prompts & Logic: Extension v1

This document defines the specific System Instructions and Prompt Templates used by the `Vercel AI SDK` to power the "Defensible Intelligence" features.

---

## 1. Research Brief Generator (Screen 1.5)

**Context:** The user has uploaded an *Enterprise Discovery Report* (Context) and a *Client Backlog* (Current Ideas).
**Trigger:** User clicks "Analyze & Generate Brief".
**Goal:** Direct the user (or an agent) to find specific "Outside-In" evidence that fills gaps in their current backlog.

### The Prompt Configuration

**System Role:**
> You are a Strategic Innovation Consultant. Your goal is to identify "Blind Spots" in a client's innovation backlog by comparing their internal ideas against their strategic priorities and global industry trends.

**Input Variables:**
* `{{CLIENT_STRATEGY}}`: Extracted from the Enterprise Report (e.g., "Post26 Strategy: Win in eCommerce").
* `{{TECH_STACK}}`: Summary of existing capabilities (e.g., "Azure, Salesforce, No Real-Time Streaming").
* `{{CLIENT_BACKLOG}}`: JSON list of current idea titles and descriptions.

**Prompt Template:**
> "Analyze the `{{CLIENT_BACKLOG}}` against the `{{CLIENT_STRATEGY}}`.
>
> **Task:**
> Identify **3 Critical Gaps** where the client is under-investing compared to global peers or where their backlog fails to leverage their `{{TECH_STACK}}`.
>
> **Output Format (Markdown):**
>
> ## 🎯 Research Brief: Strategic Blind Spots
>
> ### 1. The [Gap Name] Opportunity
> * **Observation:** You have 5 ideas for [Area A], but 0 for [Area B], despite it being a key part of your Strategy.
> * **Research Target:** Investigate how [Competitor/Peer Name] is utilizing [Specific Technology] to solve [Problem].
> * **Search Query:** "[Competitor] [Technology] case study"
>
> ### 2. The [Gap Name] Opportunity
> * **Observation:** ...
> * **Research Target:** ...
>
> ### 3. The [Gap Name] Opportunity
> * **Observation:** ...
> * **Research Target:** ..."

---

# Schema Reference

```prisma
// schema.prisma

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"] // Enable extensions for pgvector
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [vector] // Enable pgvector extension
}

// ==========================================
// 1. Workshop Container
// ==========================================
model Workshop {
  id                   String   @id @default(uuid())
  clientName           String
  clientLogoUrl        String?
  workshopDate         DateTime @default(now())
  createdAt            DateTime @default(now())
  status               String   @default("INPUT") // Draft, Input, Analysis
  
  // Analysis Outputs
  strategyNarrative    String?  @db.Text // Executive Summary
  strategyDependencies String?  @db.Text // The Architect's Analysis
  strategyRisks        String?  @db.Text // The Risk Officer's Analysis
  
  // Relations
  opportunities        Opportunity[]
  
  // Extension v1: Context & Ideation
  contextDocuments     WorkshopDocument[]
  ideaCards            IdeaCard[]
}

// ==========================================
// 2. The Context Engine (RAG)
// ==========================================
model WorkshopDocument {
  id          String   @id @default(uuid())
  workshopId  String
  workshop    Workshop @relation(fields: [workshopId], references: [id], onDelete: Cascade)
  
  fileName    String
  fileUrl     String   // Vercel Blob URL
  fileType    String   // "pdf", "md", "txt"
  category    String   // "CLIENT_DOSSIER" or "MARKET_RESEARCH"
  
  createdAt   DateTime @default(now())
  
  // The Vectors
  chunks      DocumentChunk[]
}

model DocumentChunk {
  id          String           @id @default(uuid())
  documentId  String
  document    WorkshopDocument @relation(fields: [documentId], references: [id], onDelete: Cascade)
  
  content     String                      @db.Text
  vector      Unsupported("vector(768)")? // Google Embedding Dimension (Gecko/Text-004)
  
  chunkIndex  Int
}

// ==========================================
// 3. The Ideation Sandbox
// ==========================================
model IdeaCard {
  id          String   @id @default(uuid())
  workshopId  String
  workshop    Workshop @relation(fields: [workshopId], references: [id], onDelete: Cascade)
  
  title       String
  description String   @db.Text
  source      String   // "CLIENT_BACKLOG", "MARKET_SIGNAL", "WORKSHOP_GEN"
  tier        String   // "STRATEGIC_BET", "TABLE_STAKES", "AGENTIC_AUTO"
  
  // Lens Expansions (JSON for flexibility)
  // { infiniteCapacity: string, oodaLoop: string, theoryOfConstraints: string }
  lenses      Json?
  
  isArchived  Boolean  @default(false)
  
  // For merged cards - tracks genealogy
  mergedFromIds String[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // History Tracking
  versions    IdeaVersion[]
}

model IdeaVersion {
  id                  String   @id @default(uuid())
  ideaId              String
  idea                IdeaCard @relation(fields: [ideaId], references: [id], onDelete: Cascade)
  
  createdAt           DateTime @default(now())
  descriptionSnapshot String   @db.Text
  changeReason        String?  // e.g. "Applied Infinite Capacity Lens"
}

// ==========================================
// 4. The Opportunity Asset (Core)
// ==========================================
model Opportunity {
  id                    String   @id @default(uuid())
  workshopId            String
  workshop              Workshop @relation(fields: [workshopId], references: [id])
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @default(now()) @updatedAt
  canvasLastGeneratedAt DateTime? // Tracks when the Strategy One-Pager was last generated

  // Tab A: Strategic Context
  projectName       String
  frictionStatement String
  strategicHorizon  String   // "GROWTH", "OPS", "STRATEGY"
  whyDoIt           String
  
  // Tab B: The Workflow
  workflowPhases    Json?    // Array of { name, autonomy, guardrail }
  agentDirective    Json?    // DEPRECATED: Kept optional for legacy schema sync
  
  // Tab C: Business Case (VRCC + Financials)
  scoreValue        Int
  scoreCapability   Int
  scoreComplexity   Int
  scoreRiskFinal    Int      @default(0)
  scoreRiskAI       Int      @default(0)
  riskOverrideLog   String?
  tShirtSize        String   // "XS", "S", "M", "L", "XL"
  
  benefitRevenue       Float?
  benefitCostAvoidance Float? // Renamed from benefitCost
  benefitEstCost       Float?   // One-Time Implementation Cost
  benefitEfficiency    Float?
  benefitTimeframe     String?  // "Monthly" or "Annually"
  
  // DFV Assessment
  dfvAssessment     Json?

  // Tab D: Execution
  definitionOfDone  String
  keyDecisions      String
  impactedSystems   String[]
  
  // New Execution Fields
  systemGuardrails     String?
  aiOpsRequirements    String?
  changeManagement     String?
  trainingRequirements String?

  // Capability Mapping
  capabilitiesExisting String[]
  capabilitiesMissing  String[]

  // Logic Engine
  capabilitiesConsumed CapabilityConsumed[]
  capabilitiesProduced CapabilityProduced[]
  
  // Outputs
  sequenceRank        Int?
  strategicRationale  String?   @db.Text
  matrixX             Float?
  matrixY             Float?
}

// ==========================================
// 5. Capabilities
// ==========================================
model CapabilityConsumed {
  id            String      @id @default(uuid())
  opportunityId String
  opportunity   Opportunity @relation(fields: [opportunityId], references: [id])
  name          String
  status        String      // "EXISTING" or "MISSING"
}

model CapabilityProduced {
  id            String      @id @default(uuid())
  opportunityId String
  opportunity   Opportunity @relation(fields: [opportunityId], references: [id])
  name          String
}