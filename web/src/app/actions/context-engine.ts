'use server';

import { prisma } from '@/lib/prisma';
import { getWorkshopNamespace } from '@/lib/pinecone';
import { google } from '@ai-sdk/google';
import { generateText, embed } from 'ai';
import { revalidatePath } from 'next/cache';

// =============================================================================
// TYPES
// =============================================================================

type AssetType = 'DOSSIER' | 'BACKLOG' | 'MARKET_SIGNAL';

interface RetrievedChunk {
    id: string;
    content: string;
    filename: string;
    type: AssetType;
    score: number;
}

interface RetrievalResult {
    chunks: RetrievedChunk[];
    documentCount: number;
    chunkCount: number;
}

interface AuditResult {
    techDNA: string;
    geoFence: string;
    securityAnalysis: string;
    strategicIntent: string;
    rawOutput: string;
}

interface GapAnalysisResult {
    architectureCollision: string;
    missingSignal: string;
    provocationPoints: string[];
    rawOutput: string;
}

// =============================================================================
// PINECONE RETRIEVAL
// =============================================================================

async function queryPinecone(
    workshopId: string,
    query: string,
    options: { topK?: number; filterType?: AssetType | AssetType[] } = {}
): Promise<RetrievalResult> {
    const { topK = 15, filterType } = options;

    console.log(`[ContextEngine] Querying Pinecone for workshop: ${workshopId}`);

    const { embedding } = await embed({
        model: google.textEmbeddingModel('text-embedding-004'),
        value: query,
    });

    let filter: Record<string, unknown> | undefined;
    if (filterType) {
        filter = Array.isArray(filterType)
            ? { type: { "$in": filterType } }
            : { type: { "$eq": filterType } };
    }

    const namespace = getWorkshopNamespace(workshopId);
    const results = await namespace.query({
        vector: embedding,
        topK,
        filter,
        includeMetadata: true,
    });

    const chunks: RetrievedChunk[] = results.matches.map(match => ({
        id: match.id,
        content: (match.metadata?.content as string) || '',
        filename: (match.metadata?.filename as string) || 'Unknown',
        type: (match.metadata?.type as AssetType) || 'DOSSIER',
        score: match.score || 0,
    }));

    const uniqueFiles = new Set(chunks.map(c => c.filename));
    console.log(`[ContextEngine] Retrieved ${chunks.length} chunks from ${uniqueFiles.size} documents`);

    return { chunks, documentCount: uniqueFiles.size, chunkCount: chunks.length };
}

function formatContext(chunks: RetrievedChunk[]): { dossierContext: string; backlogContext: string; sources: string[] } {
    const dossierChunks = chunks.filter(c => c.type === 'DOSSIER');
    const backlogChunks = chunks.filter(c => c.type === 'BACKLOG');
    const formatChunks = (arr: RetrievedChunk[]) =>
        arr.map(c => `[Source: ${c.filename}]\n${c.content}`).join('\n\n---\n\n');
    return {
        dossierContext: formatChunks(dossierChunks) || 'No enterprise context available.',
        backlogContext: formatChunks(backlogChunks) || 'No backlog items available.',
        sources: [...new Set(chunks.map(c => c.filename))],
    };
}

// =============================================================================
// STEP 1: THE TECHNICAL AUDITOR (Extraction Phase)
// =============================================================================

const AUDITOR_PROMPT = `### MISSION
You are the Technical Auditor — a rigorous Systems Architect and Forensic Auditor.
Your task is to process internal documents and extract the "As-Is" DNA of the enterprise with 100% factual accuracy.

### INSTRUCTIONS
1. Analyze the context and extract ONLY hard data points.
2. Categories to map:
   - [TECH_DNA]: Exact versions, cloud services (e.g., AWS EKS vs. just "AWS"), languages, frameworks, and legacy anchors (e.g., SAP version).
   - [GEO_FENCE]: Exact operating regions, markets, and regulatory jurisdictions.
   - [SECURITY_ANALYSIS]: Specific compliance standards (Essential Eight, SOC2, ISO 27001, PCI-DSS) and acknowledged vulnerabilities.
   - [STRATEGIC_INTENT]: The top 3 priorities as explicitly stated by the business.

### CRITICAL RULES
- Do NOT interpret. Do NOT find gaps. Do NOT suggest improvements.
- If a detail is missing from the documents, mark it [UNKNOWN].
- Quote exact phrases when possible.
- Be exhaustive — miss nothing that is stated.

### OUTPUT FORMAT
\`\`\`json
{
  "TECH_DNA": {
    "cloud_providers": ["..."],
    "languages": ["..."],
    "frameworks": ["..."],
    "databases": ["..."],
    "legacy_systems": ["..."],
    "specific_versions": ["..."]
  },
  "GEO_FENCE": {
    "primary_regions": ["..."],
    "secondary_markets": ["..."],
    "regulatory_jurisdictions": ["..."]
  },
  "SECURITY_ANALYSIS": {
    "compliance_standards": ["..."],
    "acknowledged_risks": ["..."],
    "security_tools": ["..."]
  },
  "STRATEGIC_INTENT": {
    "priority_1": "...",
    "priority_2": "...",
    "priority_3": "..."
  }
}
\`\`\`
`;

async function runTechnicalAudit(dossierContext: string, backlogContext: string): Promise<AuditResult> {
    console.log(`[SupremeScout] Step 1: Running Technical Audit...`);

    const prompt = `${AUDITOR_PROMPT}

══════════════════════════════════════════════════════════════
📁 ENTERPRISE DOSSIER
══════════════════════════════════════════════════════════════
${dossierContext}

══════════════════════════════════════════════════════════════
📋 CLIENT BACKLOG
══════════════════════════════════════════════════════════════
${backlogContext}

Now extract the Technical DNA. Output ONLY the JSON block.`;

    const { text } = await generateText({
        model: google('gemini-2.5-flash'),
        prompt,
    });

    console.log(`[SupremeScout] Step 1 Complete: Audit extracted`);

    return {
        techDNA: text,
        geoFence: text,
        securityAnalysis: text,
        strategicIntent: text,
        rawOutput: text,
    };
}

// =============================================================================
// STEP 2: THE STRATEGIC GAP DETECTIVE (Inference Phase)
// =============================================================================

const DETECTIVE_PROMPT = `### MISSION
You are the Gap Detective — a Hostile Competitor and Disruptive Analyst.
You take a "Technical DNA Map" and look for the specific "Friction Points" that will cause the business to fail in a 2025-2026 market.

### YOUR ADVERSARIAL LENS
Think like a competitor who:
- Has just raised $50M to disrupt this exact market
- Has access to cutting-edge AI/ML capabilities they don't mention
- Operates with zero legacy constraints

### TASK: IDENTIFY THE "BLIND SPOTS"

1. **Architecture Collision**: How does their [TECH_DNA] prevent them from achieving their [STRATEGIC_INTENT]?
   - Example: "They want AI-driven routing, but their batch-processed SAP core creates 24-hour data latency"
   - Be SPECIFIC about the technical constraint and the business impact.

2. **The "Missing" Signal**: What is the ONE external threat that is NOT mentioned in their security or risk logs?
   - Look for: regulatory changes, emerging competitors, technology shifts, talent gaps

3. **Provocation Points**: Identify 2 specific scenarios that would embarrass the current leadership's strategy.
   - Frame as: "If [EXTERNAL_EVENT], their [CURRENT_APPROACH] would [FAILURE_MODE]"

### OUTPUT FORMAT
\`\`\`json
{
  "ARCHITECTURE_COLLISION": {
    "constraint": "...",
    "strategic_goal_blocked": "...",
    "technical_root_cause": "...",
    "business_impact": "..."
  },
  "MISSING_SIGNAL": {
    "threat_category": "...",
    "specific_threat": "...",
    "why_not_mentioned": "...",
    "potential_impact": "..."
  },
  "PROVOCATION_POINTS": [
    {
      "external_event": "...",
      "current_approach": "...",
      "failure_mode": "..."
    },
    {
      "external_event": "...",
      "current_approach": "...",
      "failure_mode": "..."
    }
  ]
}
\`\`\`
`;

async function runGapAnalysis(auditResult: AuditResult, backlogContext: string): Promise<GapAnalysisResult> {
    console.log(`[SupremeScout] Step 2: Running Gap Analysis...`);

    const prompt = `${DETECTIVE_PROMPT}

══════════════════════════════════════════════════════════════
🔬 TECHNICAL DNA MAP (From Auditor)
══════════════════════════════════════════════════════════════
${auditResult.rawOutput}

══════════════════════════════════════════════════════════════
📋 CLIENT BACKLOG (Internal Friction)
══════════════════════════════════════════════════════════════
${backlogContext}

Now identify the Friction Points. Output ONLY the JSON block.`;

    const { text } = await generateText({
        model: google('gemini-2.5-flash'),
        prompt,
    });

    console.log(`[SupremeScout] Step 2 Complete: Gaps identified`);

    return {
        architectureCollision: text,
        missingSignal: text,
        provocationPoints: [],
        rawOutput: text,
    };
}

// =============================================================================
// STEP 3: THE MANDATE ARCHITECT (Instruction Phase)
// =============================================================================

const ARCHITECT_PROMPT = `### MISSION
You are the Mandate Architect — the World's Greatest Research Scoping Specialist.
Your task is to convert the identified gaps and friction points into machine-ready "Agent-to-Agent" search payloads.

### YOUR CRAFT
You engineer search queries like a cybersecurity analyst engineers penetration tests:
- High precision, zero noise
- Target high-signal domains
- Use advanced search operators
- Define clear success criteria

### TASK: ENGINEER 10X SEARCH PAYLOADS

Generate exactly 5 surgical research queries. For EACH query, you MUST include:

1. **target_domain**: Force the next agent to look in high-signal zones:
   - Technical: github.com, stackoverflow.com, news.ycombinator.com
   - Business: sec.gov, crunchbase.com, linkedin.com/company
   - Community: reddit.com/r/sysadmin, reddit.com/r/devops, reddit.com/r/aws

2. **query_string**: Use Advanced Search Operators:
   - site:github.com [technology] migration
   - inurl:blog [tech_stack] "failure" OR "postmortem"
   - "[competitor_name]" API documentation filetype:pdf

3. **trigger_event**: Define the "Signal" that changes the strategy:
   - "If you find a competitor offering [FEATURE] via serverless-native API, STOP and report"
   - "If regulatory filing mentions [TECH] mandate, escalate immediately"

4. **grounded_in**: Which audit/gap finding this query addresses

### OUTPUT FORMAT (Markdown)

## 🎯 SUPREME SCOUT RESEARCH MANDATE

### The Blind Spot Hypothesis
[2-3 sentences synthesizing the audit + gap analysis into the core strategic risk]

---

### Search Payload 1: [Topic]
| Field | Value |
|-------|-------|
| **target_domain** | [domain] |
| **query_string** | \`[exact query]\` |
| **trigger_event** | [signal that changes strategy] |
| **grounded_in** | [TECH_DNA/SECURITY/GAP reference] |

### Search Payload 2: [Topic]
[Same format...]

### Search Payload 3: [Topic]
[Same format...]

### Search Payload 4: [Topic]
[Same format...]

### Search Payload 5: [Topic]
[Same format...]

---

### Competitor Watchlist

| Company | Why Monitor | Threat Vector | Watch Signal |
|---------|-------------|---------------|--------------|
| [Name] | [Rationale] | [Specific threat] | [Trigger] |
| [Name] | [...] | [...] | [...] |
| [Name] | [...] | [...] | [...] |

---

### Provocation Brief
[2 sentences that would make the CTO uncomfortable about their current trajectory]
`;

async function writeResearchMandate(
    auditResult: AuditResult,
    gapResult: GapAnalysisResult,
    sources: string[]
): Promise<string> {
    console.log(`[SupremeScout] Step 3: Architecting Research Mandate...`);

    const prompt = `${ARCHITECT_PROMPT}

══════════════════════════════════════════════════════════════
🔬 TECHNICAL DNA MAP (From Auditor)
══════════════════════════════════════════════════════════════
${auditResult.rawOutput}

══════════════════════════════════════════════════════════════
⚡ FRICTION POINTS (From Gap Detective)
══════════════════════════════════════════════════════════════
${gapResult.rawOutput}

══════════════════════════════════════════════════════════════
📖 SOURCE DOCUMENTS
══════════════════════════════════════════════════════════════
${sources.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Now architect the Research Mandate. Output the full Markdown format.`;

    const { text } = await generateText({
        model: google('gemini-2.5-flash'),
        prompt,
    });

    console.log(`[SupremeScout] Step 3 Complete: Mandate written`);

    return text;
}

// =============================================================================
// MAIN ORCHESTRATOR: THE SUPREME SCOUT PIPELINE
// =============================================================================

export interface BriefGenerationProgress {
    step: 'auditing' | 'detecting' | 'architecting' | 'complete' | 'error';
    message: string;
}

/**
 * Generate Research Brief using the Supreme Scout 3-Step Sequential Chain.
 * 
 * Pipeline:
 * 1. Technical Auditor → Extract hard data (TECH_DNA, GEO_FENCE, SECURITY)
 * 2. Gap Detective → Infer friction points and blind spots
 * 3. Mandate Architect → Engineer agent-ready search payloads
 */
export async function generateBrief(workshopId: string) {
    console.log(`[SupremeScout] ========== Starting Pipeline for ${workshopId} ==========`);

    try {
        // 0. Retrieve context from Pinecone
        const query = "Analyze enterprise architecture, technology stack, cloud providers, programming languages, geographic operations, compliance requirements, strategic priorities, operational friction";
        const retrieval = await queryPinecone(workshopId, query, {
            topK: 30,
            filterType: ['DOSSIER', 'BACKLOG'],
        });

        if (retrieval.chunkCount === 0) {
            return {
                success: false,
                brief: "No indexed documents found. Please upload and index assets first.",
                documentCount: 0,
            };
        }

        const { dossierContext, backlogContext, sources } = formatContext(retrieval.chunks);

        // ═══════════════════════════════════════════════════════════════════
        // STEP 1: THE TECHNICAL AUDITOR
        // ═══════════════════════════════════════════════════════════════════
        const auditResult = await runTechnicalAudit(dossierContext, backlogContext);

        // ═══════════════════════════════════════════════════════════════════
        // STEP 2: THE STRATEGIC GAP DETECTIVE
        // ═══════════════════════════════════════════════════════════════════
        const gapResult = await runGapAnalysis(auditResult, backlogContext);

        // ═══════════════════════════════════════════════════════════════════
        // STEP 3: THE MANDATE ARCHITECT
        // ═══════════════════════════════════════════════════════════════════
        const mandate = await writeResearchMandate(auditResult, gapResult, sources);

        // Save to WorkshopContext
        await prisma.workshopContext.upsert({
            where: { workshopId },
            update: { researchBrief: mandate },
            create: { workshopId, researchBrief: mandate },
        });

        console.log(`[SupremeScout] ========== Pipeline Complete ==========`);
        revalidatePath(`/workshop/${workshopId}`);

        return {
            success: true,
            brief: mandate,
            documentCount: retrieval.documentCount,
            sources,
            pipeline: {
                audit: auditResult.rawOutput,
                gaps: gapResult.rawOutput,
            },
        };

    } catch (error) {
        console.error("[SupremeScout] Pipeline Error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Pipeline failed.",
            documentCount: 0,
        };
    }
}

/**
 * Query Pinecone for specific asset type (for surgical retrieval).
 */
export async function queryContext(
    workshopId: string,
    query: string,
    assetType?: AssetType
): Promise<RetrievalResult> {
    return queryPinecone(workshopId, query, { topK: 10, filterType: assetType });
}
