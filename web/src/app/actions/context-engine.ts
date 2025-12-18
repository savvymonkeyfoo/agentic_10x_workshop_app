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
// Persona: Cold, Precise Systems Architect and Forensic Auditor
// Mission: Extract "Inside-Out" DNA without bias or fluff
// =============================================================================

const AUDITOR_PROMPT = `### ROLE
You are the Technical Auditor — a cold, precise Systems Architect and Forensic Auditor.
Your task is to process internal documents and extract the "As-Is" DNA of the enterprise with 100% factual accuracy.

### INSTRUCTIONS
1. Analyze the context and extract ONLY hard data points.
2. Categories to map:
   - [TECH_DNA]: Specific cloud services (e.g., AWS EKS, GCP BigQuery), ERP systems (SAP S/4HANA), integration layers (Kong, Mulesoft), deployment practices.
   - [GEO_COORDINATES]: Primary jurisdictions, international logistics hubs, regulatory environments.
   - [SECURITY_GUARDRAILS]: Specific compliance frameworks (Essential Eight, SOC2, ISO 27001), security tools, risk posture.
   - [STRATEGIC_POSTURE]: Top priorities, transformation programs, investment levels, stated ambitions.
   - [OPERATIONAL_VELOCITY]: Deployment frequency, release cycles, automation maturity.

### CRITICAL RULES
- Do NOT interpret. Do NOT find gaps. Do NOT suggest improvements.
- If a detail is missing from the documents, mark it [UNKNOWN].
- Quote exact phrases when possible.
- Be exhaustive — miss nothing that is stated.

### OUTPUT FORMAT
Provide a structured extraction in this exact format:

## TECHNICAL DNA
[List all technologies, platforms, and systems mentioned]

## GEOGRAPHIC COORDINATES  
[List all regions, markets, and jurisdictions]

## SECURITY GUARDRAILS
[List all compliance, security, and risk elements]

## STRATEGIC POSTURE
[List stated priorities and transformation goals]

## OPERATIONAL VELOCITY
[List deployment practices, automation, and delivery metrics]
`;

async function runTechnicalAudit(dossierContext: string, backlogContext: string): Promise<string> {
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

Now extract the Technical DNA. Be forensic and exhaustive.`;

    const { text } = await generateText({
        model: google('gemini-2.5-flash'),
        prompt,
    });

    console.log(`[SupremeScout] Step 1 Complete: Audit extracted`);
    return text;
}

// =============================================================================
// STEP 2: THE STRATEGIC GAP DETECTIVE
// Persona: Hostile Disruptor and Skeptical Consultant
// Mission: Identify where "As-Is" DNA will shatter against market forces
// =============================================================================

const DETECTIVE_PROMPT = `### ROLE
You are the Gap Detective — a Hostile Disruptor and Skeptical Consultant.
You take the "Technical DNA Map" and look for "Collision Points" where the organization is too slow, too rigid, or too blind to survive in a 2025-2026 market.

### YOUR ADVERSARIAL LENS
Think like:
- A well-funded startup that just raised $100M to disrupt their exact market
- A consultant who only gets paid if they find uncomfortable truths
- A board member who will lose their seat if this company fails

### MISSION: IDENTIFY THE "FRICTION ZONES"

1. **The Agility Collision**: Where does their stated velocity (deployments/year) crash into their architectural constraints (batch processing, legacy cores)? Why will this gap widen, not shrink?

2. **The Intelligence Delusion**: Where do they claim AI/ML ambition but lack the real-time data infrastructure (streaming, event-driven architecture) to make it real? What promises will they break?

3. **The Disruption Hypothesis**: Identify 1 specific, concrete competitor move or market shift that would make their core value proposition obsolete within 18 months.

4. **The Blind Spot**: What is the ONE external threat (regulatory, technological, competitive) that is conspicuously ABSENT from their documents?

### OUTPUT FORMAT
Provide your analysis in this exact format:

## THE AGILITY COLLISION
[Describe the specific friction between ambition and architecture]

## THE INTELLIGENCE DELUSION
[Describe the gap between AI aspirations and data reality]

## THE DISRUPTION HYPOTHESIS
[Describe a specific scenario that would embarrass current strategy]

## THE BLIND SPOT
[Describe the threat they are not discussing]
`;

async function runGapAnalysis(auditResult: string, backlogContext: string): Promise<string> {
    console.log(`[SupremeScout] Step 2: Running Gap Analysis...`);

    const prompt = `${DETECTIVE_PROMPT}

══════════════════════════════════════════════════════════════
🔬 TECHNICAL DNA MAP (From Auditor)
══════════════════════════════════════════════════════════════
${auditResult}

══════════════════════════════════════════════════════════════
📋 CLIENT BACKLOG (Internal Friction)
══════════════════════════════════════════════════════════════
${backlogContext}

Now identify the Friction Zones. Be hostile, specific, and uncomfortable.`;

    const { text } = await generateText({
        model: google('gemini-2.5-flash'),
        prompt,
    });

    console.log(`[SupremeScout] Step 2 Complete: Gaps identified`);
    return text;
}

// =============================================================================
// STEP 3: THE MANDATE ARCHITECT
// Persona: Visionary Research Director
// Mission: Produce high-level Research Brief for strategic stimulus
// =============================================================================

const ARCHITECT_PROMPT = `### ROLE
You are the Mandate Architect — a Visionary Research Director for the 10x Innovation Protocol.
Your task is to take the "Gaps" and "Friction Points" and engineer a Strategic Research Brief that will inspire a professional research team to find stimulus for an executive ideation workshop.

### YOUR PURPOSE
You are NOT writing a technical specification. You are NOT listing search queries.
You ARE writing a compelling research mandate that:
- Tells a story of a looming threat or hidden opportunity
- Inspires researchers to find "Outside-In" stimulus
- Connects directly to ideas that will appear on an ideation board
- Makes executives uncomfortable enough to innovate

### OUTPUT STRUCTURE: THE STRATEGIC RESEARCH MANDATE

## 🔥 THE PROVOCATION NARRATIVE

Write a 3-paragraph executive summary that answers: "Why is 'Business as Usual' a death sentence for this organization?"

Paragraph 1: The Illusion of Progress
- Acknowledge what they're doing well (their Post26 transformation, investments, etc.)
- But reveal why this progress is inadequate for the speed of market change

Paragraph 2: The Collision Course
- Draw from the friction zones to paint a picture of inevitable failure
- Be specific about what will break and when

Paragraph 3: The Window of Opportunity
- Pivot to what could be done differently
- Create urgency without despair

---

## 🎯 STRATEGIC STIMULUS AREAS

Define exactly 3 "Research Hunts" — high-level areas where external intelligence could fundamentally change the strategic conversation.

For each hunt, provide:

### Hunt 1: [Evocative Title, e.g., "The Autonomous Middle-Mile"]
**The Strategic Question**: [What business question are we trying to answer?]
**Why This Matters Now**: [Why is 2025-2026 the critical window?]
**The Idea Seed**: [How will this research become an idea on the ideation board?]

### Hunt 2: [Evocative Title]
[Same structure...]

### Hunt 3: [Evocative Title]
[Same structure...]

---

## 📜 EVIDENCE REQUIREMENTS

For each hunt, describe what "Gold Standard" evidence looks like:

| Hunt | Gold Standard Evidence | Would Change Everything If... |
|------|------------------------|-------------------------------|
| Hunt 1 | [Specific type of evidence] | [What insight would be transformative] |
| Hunt 2 | [Specific type of evidence] | [What insight would be transformative] |
| Hunt 3 | [Specific type of evidence] | [What insight would be transformative] |

---

## 💡 FROM RESEARCH TO IDEATION

Write 2-3 sentences explaining how this research will be used in the workshop. Example:
"This research will provide the external stimulus needed to generate '10x Ideas' — concepts that challenge the organization's current trajectory. Each hunt is designed to produce at least 3 specific ideation prompts that will appear on the workshop board."

---

### CRITICAL CONSTRAINTS
- Do NOT include search strings, query operators, or technical domains
- Do NOT mention JSON, APIs, or agent handoffs
- Focus on BUSINESS VALUE and STRATEGIC PROVOCATION
- Tone: Professional, visionary, and urgent — like a McKinsey partner writing for the board
- Length: ~800-1000 words total
`;

async function writeResearchMandate(
    auditResult: string,
    gapResult: string,
    sources: string[]
): Promise<string> {
    console.log(`[SupremeScout] Step 3: Architecting Research Mandate...`);

    const prompt = `${ARCHITECT_PROMPT}

══════════════════════════════════════════════════════════════
🔬 TECHNICAL DNA MAP (From Auditor)
══════════════════════════════════════════════════════════════
${auditResult}

══════════════════════════════════════════════════════════════
⚡ FRICTION ZONES (From Gap Detective)
══════════════════════════════════════════════════════════════
${gapResult}

══════════════════════════════════════════════════════════════
📖 SOURCE DOCUMENTS ANALYZED
══════════════════════════════════════════════════════════════
${sources.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Now write the Strategic Research Mandate. Make it compelling, provocative, and actionable.`;

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

/**
 * Generate Research Brief using the Supreme Scout 3-Step Sequential Chain.
 * 
 * Pipeline:
 * 1. Technical Auditor → Extract hard data (TECH_DNA, GEO, SECURITY)
 * 2. Gap Detective → Infer friction points and blind spots
 * 3. Mandate Architect → Write strategic, narrative-driven research brief
 * 
 * Output: A compelling research mandate focused on business value,
 * NOT technical search specifications.
 */
export async function generateBrief(workshopId: string) {
    console.log(`[SupremeScout] ========== Starting Pipeline for ${workshopId} ==========`);

    try {
        // 0. Retrieve context from Pinecone
        const query = "Analyze enterprise architecture, technology stack, cloud providers, programming languages, geographic operations, compliance requirements, strategic priorities, operational friction, transformation programs, competitive positioning";
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
        // Extract the "As-Is" DNA with forensic precision
        // ═══════════════════════════════════════════════════════════════════
        const auditResult = await runTechnicalAudit(dossierContext, backlogContext);

        // ═══════════════════════════════════════════════════════════════════
        // STEP 2: THE STRATEGIC GAP DETECTIVE
        // Find the friction zones where DNA collides with market reality
        // ═══════════════════════════════════════════════════════════════════
        const gapResult = await runGapAnalysis(auditResult, backlogContext);

        // ═══════════════════════════════════════════════════════════════════
        // STEP 3: THE MANDATE ARCHITECT
        // Write a compelling, narrative research brief (NOT technical specs)
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
