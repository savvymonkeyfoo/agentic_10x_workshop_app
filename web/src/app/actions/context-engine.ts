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

const RESEARCH_BRIEFS_PROMPT = `You are a Strategic Research Director preparing standalone Mission Mandates for an external agency.

**MISSION: COMPANY-AWARE TRANSLATION**
Your goal is to produce research briefs that a third party can execute without prior knowledge of the company's internal code-names.

**BRIEF STRUCTURE (MANDATORY):**

## Strategic Research Brief [N]: [Professional Title]
**Subject Company**: [CLIENT_NAME]
**Industry Context**: [e.g., National Logistics & Postal GBE]
**Transformation Pillar**: [Translate the internal goal into a plain-English business objective]

### Strategic Objective
A 2-3 sentence statement of the high-level "Why." What strategic question are we answering? What decision will this inform?

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
How will this challenge current executive thinking? What assumption does it test? What decision could it force?

---

**STRICT EXTERNAL-FACING RULES:**

1. **No Internal Jargon**: You must replace any internal project code-name with its functional description (e.g., 'The 2026 Logistics Strategy' or 'The Enterprise Point-of-Sale Modernization'). DO NOT use terms like "Post26", "POST+", or "CXT".

2. **Self-Contained**: Assume the researcher has never heard of the company. Define the industry and the scale of the challenge.

3. **Dynamic Inference**: Weigh the technical friction against market signals and decide how many briefs are required (4, 5, or 6). Do NOT follow a fixed template.

4. **Serendipity Brief**: Include ONE brief designated as "Serendipity Brief" — research into a completely unrelated industry (Gaming, Biotech, Aerospace, Hospitality, High-Frequency Trading). You MUST explain the **Analogous Reasoning** (e.g., "We are looking at High-Frequency Trading because their data-packet latency mirrors our physical parcel-sorting friction").

5. **Delimiter**: Separate each brief with: ${BRIEF_SEPARATOR}

6. **Tone**: Senior Strategic Partner to a Board of Directors. No jargon, no acronyms without explanation, no casual language.

7. **Word Count**: Each brief should be 150-200 words.

8. **Post-Processing Rule**: Final check: Read your own output. If you see a capitalized code-name that does not exist in the public domain, replace it.`;

interface ArchitectResult {
    briefs: string[];
    signature: string | null;
}

async function architectResearchBriefs(
    auditData: string,
    gapHypotheses: string,
    sources: string[],
    clientName: string
): Promise<ArchitectResult> {
    console.log(`[SupremeScout] Step 3: Architecting Mission Mandates for ${clientName}...`);

    // Inject Client Name into the prompt template
    const contextualPrompt = RESEARCH_BRIEFS_PROMPT.replace(/\[CLIENT_NAME\]/g, clientName);

    const prompt = `${contextualPrompt}

══════════════════════════════════════════════════════════════
CLIENT IDENTITY: ${clientName}
══════════════════════════════════════════════════════════════
[Instruction: Ensure every brief identifies this company and its industry context explicitly.]

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

    const result = await generateText({
        model: AI_CONFIG.strategicModel,
        prompt,
        providerOptions: {
            google: {
                thinkingConfig: {
                    thinkingLevel: AI_CONFIG.thinking.strategicLevel,
                    includeThoughts: true, // Required to get reasoning text
                },
            },
        },
    });

    // REASONING CAPTURE: Handoff for Research Team
    // 1. result.reasoning - PhD-level reasoning text (Gemini 3 first-class property)
    // 2. providerMetadata.google.thoughtSignature - Handoff signature for multi-turn
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const googleMetadata = result.providerMetadata?.google as any;
    const thoughtSignature = googleMetadata?.thoughtSignature;
    const reasoning = result.reasoning;

    // Use signature if available, fallback to reasoning summary
    const signature = thoughtSignature ||
        (reasoning ? `Reasoning captured (${reasoning.length} chars)` : null);

    // Split the single string into a cleaned array of briefs
    const briefArray = result.text
        .split(BRIEF_SEPARATOR)
        .map(b => b.trim())
        .filter(b => b.length > 0);

    console.log(`[SupremeScout] Step 3 Complete: ${briefArray.length} Research Briefs architected`);
    if (signature) {
        console.log(`[SupremeScout] Reasoning Signature captured for Research Team handoff`);
    }
    if (reasoning) {
        console.log(`[SupremeScout] Reasoning text: ${reasoning.slice(0, 100)}...`);
    }

    return { briefs: briefArray, signature };
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
        // 0a. Fetch Workshop details to get the Client Name
        const workshop = await prisma.workshop.findUnique({
            where: { id: workshopId },
            select: { clientName: true }
        });
        const clientName = workshop?.clientName || "The Client";
        console.log(`[SupremeScout] Client: ${clientName}`);

        // 0b. Retrieve context from Pinecone
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
        // Dynamic inference of 4-6 professional, company-aware, self-contained briefs
        const { briefs: researchBriefs, signature } = await architectResearchBriefs(
            auditData,
            gapHypotheses,
            sources,
            clientName
        );

        // Save to WorkshopContext with new schema fields
        await prisma.workshopContext.upsert({
            where: { workshopId },
            update: {
                researchBrief: researchBriefs.join('\n\n---\n\n'), // Legacy string format
                researchBriefs: researchBriefs, // New: JSON array for card-based UI
                reasoningSignature: signature, // Thought signature for Research Team handoff
            },
            create: {
                workshopId,
                researchBrief: researchBriefs.join('\n\n---\n\n'),
                researchBriefs: researchBriefs,
                reasoningSignature: signature,
            },
        });

        console.log(`[SupremeScout] ========== Pipeline Complete ==========`);
        console.log(`[SupremeScout] Generated ${researchBriefs.length} Strategic Research Briefs`);
        if (signature) {
            console.log(`[SupremeScout] Reasoning Signature stored for downstream agents`);
        }
        revalidatePath(`/workshop/${workshopId}`);

        return {
            success: true,
            briefs: researchBriefs,
            brief: researchBriefs.join('\n\n---\n\n'), // Legacy: combined string for backward compatibility
            documentCount: retrieval.documentCount,
            sources,
            hasSignature: !!signature,
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
