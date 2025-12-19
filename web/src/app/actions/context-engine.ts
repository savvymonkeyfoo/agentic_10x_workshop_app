'use server';

import { prisma } from '@/lib/prisma';
import { getWorkshopNamespace } from '@/lib/pinecone';
import { AI_CONFIG } from '@/lib/ai-config';
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

// Brief separator for array splitting
const BRIEF_SEPARATOR = '[---BRIEF_SEPARATOR---]';

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
        model: AI_CONFIG.embeddingModel,
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
// STEP 1: TECHNICAL AUDIT
// Role: Forensic Systems Architect
// Mission: Extract factual Tech DNA with zero interpretation
// Thinking Level: MEDIUM (balanced extraction with reasoning)
// =============================================================================

const TECHNICAL_AUDIT_PROMPT = `You are a forensic Systems Architect conducting a Technical Audit.

Your task is to extract ONLY hard data points from the enterprise documents. Map the following categories with precision:

**[TECH_DNA]**
- Cloud services (specific providers and services, e.g., AWS EKS, GCP BigQuery)
- Programming languages and frameworks
- ERP and legacy systems (with versions if stated)
- Integration layers and middleware
- Deployment and DevOps practices

**[GEO_COORDINATES]**
- Primary operating regions and markets
- International presence and logistics reach
- Regulatory jurisdictions

**[SECURITY_GUARDRAILS]**
- Compliance standards (Essential Eight, SOC2, ISO 27001, PCI-DSS)
- Security tools and practices
- Acknowledged risk areas

**[STRATEGIC_POSTURE]**
- Stated strategic priorities
- Transformation programs and investments
- Growth ambitions and timelines

**[OPERATIONAL_METRICS]**
- Scale indicators (volumes, transactions, workforce)
- Delivery and deployment frequency
- Performance benchmarks

**RULES:**
- Extract only explicitly stated facts
- If information is not present, mark as [UNKNOWN]
- Quote exact phrases where possible
- No interpretation, inference, or recommendations

**OUTPUT FORMAT:**
Provide a structured extraction using bullet points under each category heading.`;

async function technicalAudit(dossierContext: string, backlogContext: string): Promise<string> {
    console.log(`[SupremeScout] Step 1: Technical Audit (Gemini 3 Flash, Thinking: Medium)...`);

    const prompt = `${TECHNICAL_AUDIT_PROMPT}

══════════════════════════════════════════════════════════════
ENTERPRISE DOSSIER
══════════════════════════════════════════════════════════════
${dossierContext}

══════════════════════════════════════════════════════════════
CLIENT BACKLOG
══════════════════════════════════════════════════════════════
${backlogContext}

Conduct the Technical Audit now.`;

    const { text } = await generateText({
        model: AI_CONFIG.auditModel,
        prompt,
        providerOptions: AI_CONFIG.thinkingOptions.audit,
    });

    console.log(`[SupremeScout] Step 1 Complete: Technical Audit extracted`);
    return text;
}

// =============================================================================
// STEP 2: IDENTIFY STRATEGIC GAPS
// Role: Strategic Disruption Analyst
// Mission: Generate 3-5 disruption hypotheses
// Thinking Level: HIGH (maximum reasoning for hostile analysis)
// =============================================================================

const STRATEGIC_GAPS_PROMPT = `You are a Strategic Disruption Analyst retained by the Board.

Your task is to compare the Technical DNA against the Client Backlog and identify 3-5 "Strategic Collision Points" — areas where the organisation's internal architecture is too slow, too rigid, or too blind to survive 2026 market velocity.

**YOUR ANALYTICAL LENS:**
- Where does stated ambition exceed architectural capability?
- Where does operational friction indicate systemic constraints?
- Where are emerging market forces not being addressed?
- Where could a well-funded competitor exploit rigidity?

**FOR EACH COLLISION POINT, PROVIDE:**

1. **Collision Point Title**: A professional, descriptive title
2. **Internal Constraint**: The specific architectural or operational limitation
3. **External Pressure**: The market force or competitor threat this enables
4. **Disruption Hypothesis**: A single sentence framing what could go wrong

**EXAMPLE:**
**Collision Point: Real-Time Intelligence Gap**
- **Internal Constraint**: Batch-processed data pipelines with 24-hour latency
- **External Pressure**: Competitors deploying real-time predictive logistics
- **Disruption Hypothesis**: "The organisation's AI/ML ambitions will fail to materialise without streaming data infrastructure, leaving them 18 months behind market leaders."

**OUTPUT:**
Provide 3-5 Collision Points in the format above. Be specific. Be hostile. Be professional.`;

async function identifyStrategicGaps(auditData: string, backlogContext: string): Promise<string> {
    console.log(`[SupremeScout] Step 2: Identifying Strategic Gaps (Gemini 3 Pro, Thinking: High)...`);

    const prompt = `${STRATEGIC_GAPS_PROMPT}

══════════════════════════════════════════════════════════════
TECHNICAL DNA (From Audit)
══════════════════════════════════════════════════════════════
${auditData}

══════════════════════════════════════════════════════════════
CLIENT BACKLOG (Operational Friction)
══════════════════════════════════════════════════════════════
${backlogContext}

Identify the Strategic Collision Points now.`;

    const { text } = await generateText({
        model: AI_CONFIG.strategicModel,
        prompt,
        providerOptions: AI_CONFIG.thinkingOptions.strategic,
    });

    console.log(`[SupremeScout] Step 2 Complete: Strategic Gaps identified`);
    return text;
}

// =============================================================================
// STEP 3: ARCHITECT RESEARCH BRIEFS
// Role: Strategic Research Director
// Mission: Dynamic inference of 4-6 professional, self-contained briefs
// Thinking Level: HIGH (maximum reasoning for brief architecture)
// =============================================================================

const RESEARCH_BRIEFS_PROMPT = `You are a Strategic Research Director preparing briefs for an executive workshop.

Based on the Technical DNA and Strategic Collision Points, identify the 4-6 most critical areas requiring "Outside-In" stimulus. For each, generate a self-contained Strategic Research Brief.

**BRIEF STRUCTURE (MANDATORY):**

## Strategic Research Brief [N]: [Professional Title]

### Strategic Objective
A 2-3 sentence statement of the high-level "Why" of this research. What strategic question are we answering? What decision will this inform?

### Contextual Anchor
The specific internal facts (from the Technical DNA) that make this a priority. Ground the research in the organisation's reality.

### Scope of Investigation
2-3 precise areas for the research team to explore:
- Geographic focus (if applicable)
- Industry segments to examine
- Technology domains to investigate

### Desired Intelligence
The "Gold Standard" evidence required to provoke the workshop:
- Specific competitor capabilities or announcements
- Patent filings or technical documentation
- Unit economics or cost structure comparisons
- Case studies of success or failure

### Provocation Potential
How will this research challenge current executive thinking? What assumption does it test? What decision could it force?

---

**MANDATORY REQUIREMENTS:**

1. **Dynamic Inference**: Weigh the technical friction against market signals and decide how many briefs are required (4, 5, or 6). Do NOT follow a fixed template.

2. **Serendipity Brief**: Include ONE brief designated as "Serendipity Brief" — research into a completely unrelated industry (Gaming, Biotech, Aerospace, Hospitality, High-Frequency Trading) that could provide unexpected strategic stimulus.

3. **Delimiter**: You MUST separate each brief with the exact string:
${BRIEF_SEPARATOR}

4. **Professional Tone**: Strategic Partner preparing for Board presentation. No jargon, no acronyms without explanation, no casual language.

5. **Word Count**: Each brief should be 150-200 words.`;

async function architectResearchBriefs(
    auditData: string,
    gapHypotheses: string,
    sources: string[]
): Promise<string[]> {
    console.log(`[SupremeScout] Step 3: Architecting Research Briefs (Gemini 3 Pro, Thinking: High)...`);

    const prompt = `${RESEARCH_BRIEFS_PROMPT}

══════════════════════════════════════════════════════════════
TECHNICAL DNA
══════════════════════════════════════════════════════════════
${auditData}

══════════════════════════════════════════════════════════════
STRATEGIC COLLISION POINTS & DISRUPTION HYPOTHESES
══════════════════════════════════════════════════════════════
${gapHypotheses}

══════════════════════════════════════════════════════════════
SOURCE DOCUMENTS ANALYSED
══════════════════════════════════════════════════════════════
${sources.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Generate the Strategic Research Briefs now. Remember to separate each brief with ${BRIEF_SEPARATOR}`;

    const { text } = await generateText({
        model: AI_CONFIG.strategicModel,
        prompt,
        providerOptions: AI_CONFIG.thinkingOptions.strategic,
    });

    // Split the single string into a cleaned array of briefs
    const briefArray = text
        .split(BRIEF_SEPARATOR)
        .map(b => b.trim())
        .filter(b => b.length > 0);

    console.log(`[SupremeScout] Step 3 Complete: ${briefArray.length} Research Briefs architected`);
    return briefArray;
}

// =============================================================================
// MAIN ORCHESTRATOR: THE SUPREME SCOUT PIPELINE
// =============================================================================

/**
 * Generate Strategic Research Briefs using the Supreme Scout Pipeline.
 * 
 * Pipeline Architecture:
 * 1. technicalAudit() → Extract factual Tech DNA (Flash, Thinking: Medium)
 * 2. identifyStrategicGaps() → Generate disruption hypotheses (Pro, Thinking: High)
 * 3. architectResearchBriefs() → Dynamic inference of 4-6 briefs (Pro, Thinking: High)
 * 
 * Output: An array of standalone Strategic Research Briefs suitable for
 * Board presentation or distribution to specialist research teams.
 */
export async function generateBrief(workshopId: string) {
    console.log(`[SupremeScout] ========== Starting Pipeline for ${workshopId} ==========`);
    console.log(`[SupremeScout] Configuration: Thinking Level = ${AI_CONFIG.thinking.level}`);

    try {
        // 0. Retrieve context from Pinecone
        const query = "Analyse enterprise architecture, technology, operations, strategy, transformation, compliance, and competitive positioning";
        const retrieval = await queryPinecone(workshopId, query, {
            topK: 25,
            filterType: ['DOSSIER', 'BACKLOG'],
        });

        if (retrieval.chunkCount === 0) {
            return {
                success: false,
                briefs: [],
                brief: "No indexed documents found. Please upload and index assets first.",
                documentCount: 0,
            };
        }

        const { dossierContext, backlogContext, sources } = formatContext(retrieval.chunks);

        // STEP 1: TECHNICAL AUDIT
        // Extract the factual DNA with zero interpretation
        const auditData = await technicalAudit(dossierContext, backlogContext);

        // STEP 2: IDENTIFY STRATEGIC GAPS
        // Generate 3-5 disruption hypotheses with hostile analysis
        const gapHypotheses = await identifyStrategicGaps(auditData, backlogContext);

        // STEP 3: ARCHITECT RESEARCH BRIEFS
        // Dynamic inference of 4-6 professional, self-contained briefs
        const researchBriefs = await architectResearchBriefs(auditData, gapHypotheses, sources);

        // Save to WorkshopContext (store as JSON array)
        const briefsJson = JSON.stringify(researchBriefs);
        await prisma.workshopContext.upsert({
            where: { workshopId },
            update: { researchBrief: briefsJson },
            create: { workshopId, researchBrief: briefsJson },
        });

        console.log(`[SupremeScout] ========== Pipeline Complete ==========`);
        console.log(`[SupremeScout] Generated ${researchBriefs.length} Strategic Research Briefs`);
        revalidatePath(`/workshop/${workshopId}`);

        return {
            success: true,
            briefs: researchBriefs,
            brief: researchBriefs.join('\n\n---\n\n'), // Legacy: combined string for backward compatibility
            documentCount: retrieval.documentCount,
            sources,
        };

    } catch (error) {
        console.error("[SupremeScout] Pipeline Error:", error);
        return {
            success: false,
            briefs: [],
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
