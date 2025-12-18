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

// =============================================================================
// PINECONE RETRIEVAL
// =============================================================================

async function queryPinecone(
    workshopId: string,
    query: string,
    options: { topK?: number; filterType?: AssetType | AssetType[] } = {}
): Promise<RetrievalResult> {
    const { topK = 15, filterType } = options;

    console.log(`[SupremeScout] Querying Pinecone for workshop: ${workshopId}`);

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
    console.log(`[SupremeScout] Retrieved ${chunks.length} chunks from ${uniqueFiles.size} documents`);

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
// STEP 1: THE TECHNICAL AUDITOR
// Persona: Cold, Precise Systems Architect
// Mission: Extract "Inside-Out" DNA without bias
// =============================================================================

const AUDITOR_PROMPT = `### ROLE
You are the Technical Auditor — a cold, precise Systems Architect.
Extract the "As-Is" DNA of the enterprise with 100% factual accuracy.

### EXTRACT THESE CATEGORIES
- [TECH_DNA]: Cloud services, ERP systems, integration layers, deployment practices
- [GEO_COORDINATES]: Jurisdictions, markets, regulatory environments
- [SECURITY_POSTURE]: Compliance frameworks, security tools, risk posture
- [STRATEGIC_BETS]: Top priorities, transformation programs, stated ambitions
- [OPERATIONAL_METRICS]: Scale numbers, transaction volumes, delivery metrics

### RULES
- Extract ONLY explicit facts. No interpretation.
- If missing, mark [UNKNOWN].
- Quote exact phrases when possible.

### OUTPUT
Provide a bullet-point extraction for each category.
`;

async function runTechnicalAudit(dossierContext: string, backlogContext: string): Promise<string> {
    console.log(`[SupremeScout] Step 1: Technical Audit...`);

    const prompt = `${AUDITOR_PROMPT}

══════════════════════════════════════════════════════════════
📁 ENTERPRISE DOSSIER
══════════════════════════════════════════════════════════════
${dossierContext}

══════════════════════════════════════════════════════════════
📋 CLIENT BACKLOG
══════════════════════════════════════════════════════════════
${backlogContext}

Extract the DNA now. Be forensic.`;

    const { text } = await generateText({
        model: google('gemini-2.5-flash'),
        prompt,
    });

    console.log(`[SupremeScout] Step 1 Complete`);
    return text;
}

// =============================================================================
// STEP 2: THE GAP DETECTIVE
// Persona: Hostile Skeptic
// Mission: Formulate 3 "Outside-In" Hypotheses for research
// =============================================================================

const DETECTIVE_PROMPT = `### ROLE
You are the Gap Detective — a Hostile Skeptic hired by their board.
Your job: Find the 3 "Outside-In" Hypotheses that could break their strategy.

### YOUR MINDSET
You are NOT here to summarize problems. You are here to formulate RESEARCH HYPOTHESES.
Each hypothesis is something that MIGHT be true in the market—and if true, destroys their current plan.

### TASK: FORMULATE 3 OUTSIDE-IN HYPOTHESES

For each hypothesis:
1. **THE BET THEY'RE MAKING**: What strategic assumption are they betting on?
2. **THE COUNTER-SIGNAL**: What market evidence would prove this bet is wrong?
3. **THE RESEARCH QUESTION**: What specific question must the research team answer?

### EXAMPLE
BET: "Centralized mega-hubs are the future of logistics."
COUNTER-SIGNAL: "Mobile micro-sorting on autonomous vehicles achieves lower cost-per-parcel."
RESEARCH QUESTION: "Find 3 pilots of sorting-on-wheels in Scandinavia or Asia."

### OUTPUT FORMAT
## HYPOTHESIS 1: [Title]
- **The Bet**: [Their assumption]
- **The Counter-Signal**: [What would break it]
- **The Research Question**: [Specific question to answer]

## HYPOTHESIS 2: [Title]
[Same format]

## HYPOTHESIS 3: [Title]
[Same format]
`;

async function runGapAnalysis(auditResult: string, backlogContext: string): Promise<string> {
    console.log(`[SupremeScout] Step 2: Gap Analysis...`);

    const prompt = `${DETECTIVE_PROMPT}

══════════════════════════════════════════════════════════════
🔬 TECHNICAL DNA
══════════════════════════════════════════════════════════════
${auditResult}

══════════════════════════════════════════════════════════════
📋 BACKLOG (Internal Friction)
══════════════════════════════════════════════════════════════
${backlogContext}

Formulate the 3 hypotheses now. Be hostile and specific.`;

    const { text } = await generateText({
        model: google('gemini-2.5-flash'),
        prompt,
    });

    console.log(`[SupremeScout] Step 2 Complete`);
    return text;
}

// =============================================================================
// STEP 3: THE MISSION DESIGNER
// Persona: Lead Research Director
// Mission: Create actionable Search Missions, not reports
// =============================================================================

const MISSION_PROMPT = `### ROLE
You are the Research Director — the Mission Designer.
Your job is NOT to write a report. Your job is to design THE HUNT.

The next agent (or human) who reads this must say:
"I have 3 targets to hit and 1 wildcard to find. I'm going in."

### THE MISSION BRIEF STRUCTURE

## 🎯 THE CORE MISSION
[ONE SENTENCE: The strategic "wall" we are trying to break through]

---

## 🔍 SEARCH MISSION 1: [Evocative Title, e.g., "The Death of the Sorting Center"]

**THE DEAD END**: [Why the client's current approach is a dead end—1-2 sentences max]

**THE HUNT**: [Specific command for the researcher. Be concrete:
- "Find 3 companies doing X in Y region"
- "Locate a patent for Z filed in the last 18 months"
- "Identify the cost-per-unit for approach X vs Y"]

**STIMULUS SIGNAL**: [What "weird" or "extreme" evidence should trigger excitement?
- Not "best practices"
- Look for: startups doing impossible things, failed experiments with lessons, cost breakdowns that defy logic]

---

## 🔍 SEARCH MISSION 2: [Title]

**THE DEAD END**: [1-2 sentences]

**THE HUNT**: [Specific command]

**STIMULUS SIGNAL**: [What weird evidence to find]

---

## 🔍 SEARCH MISSION 3: [Title]

**THE DEAD END**: [1-2 sentences]

**THE HUNT**: [Specific command]

**STIMULUS SIGNAL**: [What weird evidence to find]

---

## 🌀 SERENDIPITY WILDCARD

**THE ADJACENT INDUSTRY**: [Pick a COMPLETELY DIFFERENT industry: gaming, biotech, aerospace, hospitality, entertainment]

**THE HUNT**: [What technology, model, or approach from that industry could apply here? Be specific.]

**WHY THIS MATTERS**: [How could this break the ideation board wide open?]

---

## ⚡ HUNTING RULES FOR THE RESEARCH AGENT

1. **NO BEST PRACTICES** — Look for "Disruptive Deviations"
2. **EXTREME SUCCESSES** — Find the 10x examples, not the 10% improvements
3. **CATASTROPHIC FAILURES** — Find the $100M mistakes we can learn from
4. **WEIRD IS GOOD** — If it sounds impossible, investigate deeper
5. **SPECIFIC IS SUPREME** — Names, numbers, patents, GitHub repos, funding rounds

---

### CONSTRAINTS
- Total output: 400-500 words MAX
- No long paragraphs — use bullets and commands
- Every sentence should be actionable
- Tone: Military briefing, not McKinsey memo
`;

async function writeResearchMission(
    auditResult: string,
    gapResult: string,
    sources: string[]
): Promise<string> {
    console.log(`[SupremeScout] Step 3: Mission Design...`);

    const prompt = `${MISSION_PROMPT}

══════════════════════════════════════════════════════════════
🔬 TECHNICAL DNA
══════════════════════════════════════════════════════════════
${auditResult}

══════════════════════════════════════════════════════════════
⚡ RESEARCH HYPOTHESES
══════════════════════════════════════════════════════════════
${gapResult}

══════════════════════════════════════════════════════════════
📖 SOURCE DOCUMENTS
══════════════════════════════════════════════════════════════
${sources.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Design the Mission Brief now. Make it actionable. Make it Supreme.`;

    const { text } = await generateText({
        model: google('gemini-2.5-flash'),
        prompt,
    });

    console.log(`[SupremeScout] Step 3 Complete`);
    return text;
}

// =============================================================================
// MAIN ORCHESTRATOR: THE SUPREME SCOUT PIPELINE
// =============================================================================

/**
 * Generate Research Mission using the Supreme Scout 3-Step Pipeline.
 * 
 * Pipeline:
 * 1. Technical Auditor → Extract DNA
 * 2. Gap Detective → Formulate Hypotheses
 * 3. Mission Designer → Create Search Missions
 * 
 * Output: A Mission Brief with 3 targets + 1 wildcard.
 * NOT a report. A HUNT.
 */
export async function generateBrief(workshopId: string) {
    console.log(`[SupremeScout] ========== Starting Pipeline for ${workshopId} ==========`);

    try {
        // 0. Retrieve context from Pinecone
        const query = "Analyze enterprise architecture, technology, operations, strategy, transformation, scale, and competitive positioning";
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

        // STEP 1: THE TECHNICAL AUDITOR
        const auditResult = await runTechnicalAudit(dossierContext, backlogContext);

        // STEP 2: THE GAP DETECTIVE
        const gapResult = await runGapAnalysis(auditResult, backlogContext);

        // STEP 3: THE MISSION DESIGNER
        const mission = await writeResearchMission(auditResult, gapResult, sources);

        // Save to WorkshopContext
        await prisma.workshopContext.upsert({
            where: { workshopId },
            update: { researchBrief: mission },
            create: { workshopId, researchBrief: mission },
        });

        console.log(`[SupremeScout] ========== Pipeline Complete ==========`);
        revalidatePath(`/workshop/${workshopId}`);

        return {
            success: true,
            brief: mission,
            documentCount: retrieval.documentCount,
            sources,
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
 * Query Pinecone for specific asset type.
 */
export async function queryContext(
    workshopId: string,
    query: string,
    assetType?: AssetType
): Promise<RetrievalResult> {
    return queryPinecone(workshopId, query, { topK: 10, filterType: assetType });
}
