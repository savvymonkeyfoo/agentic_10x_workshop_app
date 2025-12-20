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

const RESEARCH_BRIEFS_PROMPT = `You are a Strategic Research Director preparing Mission Mandates for an external agency.

**MISSION: CONTEXTUAL BRIDGE**
Your goal is to translate internal strategic intent into clear external research directives.

**CRITICAL INSTRUCTION - ENTITY DETECTION:**
The "Client Name" provided below might be a codename (e.g., "Hobo Bacon Moose"). 
You must analyze the [TECHNICAL DNA] to identify the **Real Subject Company** (e.g., Australia Post, Qantas, a Mining GBE).
Use the **Real Subject Company** name in the brief headers.

**CRITICAL INSTRUCTION - JARGON DEFINITION:**
You MAY use internal project codes (e.g., "Post26", "POST+"), but you **MUST define them** immediately in parentheses.
- *Bad*: "Analyze the risks of Post26."
- *Good*: "Analyze the risks of Post26 (The 2026 Strategic Transformation Program)."
- *Good*: "Evaluate the POST+ rollout (The $250M Point-of-Sale Modernization)."

**BRIEF STRUCTURE (MANDATORY):**

## Strategic Research Brief [N]: [Professional Title]
**Subject Company**: [Real Entity Name detected from DNA]
**Industry Context**: [e.g., National Logistics GBE]
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

1. **Jargon Definitions**: NEVER use an internal project code (e.g., Post26) without its functional description in parentheses.

2. **Self-Contained**: Assume the researcher has never heard of the company. Define the industry and the scale of the challenge.

3. **Dynamic Inference**: Weigh the technical friction against market signals and decide how many briefs are required (4, 5, or 6). Do NOT follow a fixed template.

4. **Serendipity Brief**: Include ONE brief designated as "Serendipity Brief" — research into a completely unrelated industry (Gaming, Biotech, Aerospace, Hospitality, High-Frequency Trading). You MUST explain the **Analogous Reasoning** (e.g., "We are looking at High-Frequency Trading because their data-packet latency mirrors our physical parcel-sorting friction").

5. **Delimiter**: Separate each brief with: ${BRIEF_SEPARATOR}

6. **Tone**: Senior Strategic Partner to a Board of Directors. No jargon, no acronyms without explanation, no casual language.

7. **Word Count**: Each brief should be 150-200 words.

8. **Post-Processing Rule**: Final check: Read your own output. If you see a capitalized code-name that does not exist in the public domain and lacks a definition, replace or define it.`;

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

    const prompt = `${RESEARCH_BRIEFS_PROMPT}

══════════════════════════════════════════════════════════════
PROVIDED CLIENT LABEL: ${clientName} 
(NOTE: This may be a project codename. Trust the Audit Data for the true entity name.)
══════════════════════════════════════════════════════════════

══════════════════════════════════════════════════════════════
TECHNICAL DNA (Source of Truth)
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
// DEEP-CHAIN INTELLIGENCE ENGINE (The "10 Humans" Simulator)
// =============================================================================

// =============================================================================
// PROMPT REFINEMENT: SPECIFICITY & COMPLETENESS
// =============================================================================

const BACKLOG_EXTRACTION_PROMPT = `You are a Data Entry Clerk.
Task: Extract the backlog items VERBATIM from the text.
CRITICAL RULE: Do not summarize. Do not reword. Do not fix typos.
Copy the 'Title' and 'Description' EXACTLY as they appear in the source text.
Return them as a clean JSON array.`;

const ENRICHMENT_PROMPT = `You are a Strategy Consultant.
Task: Enrich this Client Backlog Item without changing its core identity.
1. **Title/Description**: KEEP EXACTLY AS PROVIDED. Do not rewrite.
2. **Friction**: Analyze the item to find the specific operational pain point it solves.
3. **Tech Alignment**: Map it to the Technical DNA (e.g. "Fits the Event Mesh strategy").

OUTPUT JSON FORMAT:
{
  "title": "Use Original Title",
  "description": "Use Original Description",
  "friction": "Specific technical/process bottleneck (e.g. 'Manual PII redaction adds 4h delay').",
  "techAlignment": "Specific architectural fit (e.g. 'Aligns with Post26 Event-Driven Architecture').",
  "source": "CLIENT_BACKLOG", 
  "provenance": "Derived from Client Backlog item and enhanced by Research.",
  "status": "READY" | "RISKY" | "BLOCKED",
  "horizon": "NOW" | "NEXT" | "LATER",
  "category": "EFFICIENCY" | "GROWTH" | "MOONSHOT",
  "originalId": "string"
}`;

const GENERATION_PROMPT = `You are a Chief Innovation Officer.
Task: Generate a BRAND NEW Strategic Opportunity based on the Research Briefs.
1. **Constraint**: It must be totally different from the Client Backlog.
2. **Focus**: Look for "Blue Ocean" workflows in the research (e.g. "Headless Logistics", "Predictive Rostering").
3. **Output**: A new Title, Description, and rationale.

OUTPUT JSON FORMAT:
{
  "title": "The Workflow Name (Action-Oriented)",
  "description": "2-sentence summary of the end-to-end automation.",
  "friction": "The market problem or internal gap this solves.",
  "techAlignment": "How it leverages the Technical DNA.",
  "source": "MARKET_SIGNAL", 
  "provenance": "Generated purely from Market Research Signals.",
  "status": "READY" | "RISKY" | "BLOCKED",
  "horizon": "NOW" | "NEXT" | "LATER",
  "category": "EFFICIENCY" | "GROWTH" | "MOONSHOT",
  "originalId": "string"
}`;

export async function analyzeBacklogItem(
    workshopId: string,
    item: { id: string; title: string; description: string; isSeed?: boolean },
    context?: { dna: string; research: string }
) {
    try {
        // 0. LOAD DB CONTEXT (Required for Backlog Summary & Fallbacks)
        const dbContext = await prisma.workshopContext.findUnique({ where: { workshopId } });

        let techDNA = context?.dna;
        // @ts-ignore
        if (!techDNA) techDNA = dbContext?.extractedConstraints as string;

        let research = context?.research;
        if (!research) research = dbContext?.researchBrief || "No specific research briefs available.";

        // JIT DNA Generation if still missing
        if (!techDNA) {
            console.log(`[DeepChain] DNA missing. Running Just-in-Time Audit...`);
            const retrieval = await queryContext(workshopId, "technical architecture legacy systems", 'DOSSIER');
            const { dossierContext, backlogContext } = formatContext(retrieval.chunks);
            techDNA = await technicalAudit(dossierContext, backlogContext);
            await prisma.workshopContext.update({
                where: { workshopId },
                data: { extractedConstraints: techDNA }
            });
        }

        let prompt;

        // 1. SELECT PROMPT MODE
        if (item.isSeed) {
            console.log(`[DeepChain] Generating New Idea for Seed ${item.id}...`);
            prompt = `${GENERATION_PROMPT}\n\nRESEARCH BRIEFS: ${research}\n\n(Avoid duplicates of existing backlog)`;
        } else {
            console.log(`[DeepChain] Enriching Backlog Item: ${item.title}...`);
            prompt = `${ENRICHMENT_PROMPT}\n\nITEM: ${item.title}\nDESC: ${item.description}\nDNA: ${techDNA}`;
        }

        // 2. RUN AI GENERATION
        const { text: cardJson } = await generateText({
            model: AI_CONFIG.strategicModel,
            prompt,
            // @ts-ignore
            response_format: { type: "json_object" } // Ensure JSON output
        });

        // 3. PARSE AI OUTPUT
        let opportunity;
        try {
            const jsonStr = cardJson.replace(/```json/g, '').replace(/```/g, '').trim();
            opportunity = JSON.parse(jsonStr);
        } catch (e) {
            console.error("Failed to parse Card JSON", e);
            return { success: false, error: "Failed to parse AI output" };
        }

        // =====================================================================
        // CRITICAL FIX: FORCE BACKLOG FIDELITY & SOURCE TRUTH
        // =====================================================================
        if (!item.isSeed) {
            // BACKLOG MODE: Reject AI rewrites for Title/Desc
            opportunity.title = item.title;
            opportunity.description = item.description;
            opportunity.source = 'CLIENT_BACKLOG';
        } else {
            // INNOVATION MODE: Accept AI creativity
            opportunity.source = 'MARKET_SIGNAL';
        }

        // Always pass through the ID
        opportunity.originalId = item.id;

        // 4. ATOMIC DB UPDATE
        const currentContext = await prisma.workshopContext.findUnique({
            where: { workshopId },
            select: { intelligenceAnalysis: true }
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const currentData = (currentContext?.intelligenceAnalysis as any) || { opportunities: [] };
        // Remove old entry with same ID if exists (to avoid duplicates on re-runs)
        const cleanOpportunities = (currentData.opportunities || []).filter((o: any) => o.originalId !== item.id);
        const newOpportunities = [...cleanOpportunities, opportunity];

        await prisma.workshopContext.update({
            where: { workshopId },
            data: {
                intelligenceAnalysis: {
                    ...currentData,
                    opportunities: newOpportunities
                }
            }
        });

        return { success: true, opportunity };

    } catch (error) {
        console.error(`[DeepChain] Failed to analyze item ${item.id}`, error);
        return { success: false, error: "Analysis failed" };
    }
}

// =============================================================================
// MAIN ORCHESTRATOR FOR RESEARCH BRIEFS
// =============================================================================



export async function hydrateBacklog(workshopId: string) {
    console.log(`[SupremeScout] Hydrating Backlog for ${workshopId}...`);
    try {
        const context = await prisma.workshopContext.findUnique({ where: { workshopId } });

        // 1. Fast Path: Return Cached
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawBacklog = context?.rawBacklog as any;

        if (rawBacklog && Array.isArray(rawBacklog) && rawBacklog.length > 0) {
            // INJECT RESEARCH SEEDS (AGI-02)
            const researchSeeds = Array.from({ length: 5 }).map((_, i) => ({
                id: `seed-${i}`,
                title: `Strategic Opportunity Discovery ${i + 1}`,
                description: "Analyzing market signals to generate a net-new opportunity...",
                isSeed: true
            }));

            return { success: true, items: [...rawBacklog, ...researchSeeds] };
        }

        // 2. Slow Path: Extract from Text
        const retrieval = await queryContext(workshopId, "backlog features requirements", 'BACKLOG');
        const { backlogContext } = formatContext(retrieval.chunks);

        if (!backlogContext) return { success: false, error: "No backlog content found" };

        const { text } = await generateText({
            model: AI_CONFIG.auditModel, // Flash is fast
            prompt: `${BACKLOG_EXTRACTION_PROMPT}\n\nRAW BACKLOG:\n${backlogContext}`,
        });

        let items;
        try {
            // Handle potential backticks or plain json
            const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
            items = JSON.parse(jsonStr);
            if (items.items) items = items.items; // Handle wrapped object
        } catch (e) {
            console.error("Failed to parse backlog extraction", e);
            return { success: false, error: "Failed to parse backlog JSON" };
        }

        // Save Cache
        await prisma.workshopContext.upsert({
            where: { workshopId },
            update: { rawBacklog: items },
            create: { workshopId, rawBacklog: items }
        });

        // 3. INJECT RESEARCH SEEDS (AGI-02 Hybrid Pipeline)
        const researchSeeds = Array.from({ length: 5 }).map((_, i) => ({
            id: `seed-${i}`,
            title: `Strategic Opportunity Discovery ${i + 1}`,
            description: "Analyzing market signals to generate a net-new opportunity...",
            isSeed: true
        }));

        const finalQueue = [...items, ...researchSeeds];

        return { success: true, items: finalQueue };

    } catch (e) {
        console.error("Backlog Hydration Failed", e);
        return { success: false, error: "Failed to parse backlog" };
    }
}

export async function fetchAnalysisContext(workshopId: string) {
    try {
        const workshopContext = await prisma.workshopContext.findUnique({
            where: { workshopId }
        });

        // 1. Get DNA & Research
        const retrieval = await queryPinecone(workshopId, "Architecture and Strategy", { topK: 20 });
        const { dossierContext, backlogContext } = formatContext(retrieval.chunks);

        const dna = await technicalAudit(dossierContext, backlogContext); // Or cache this too?
        // Ideally verify if we have cached constraints, but re-generating is safer for now.

        const research = workshopContext?.researchBrief || "No research briefs found.";

        // 2. Get Backlog Items (Discrete)
        let items: any[] = [];

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawBacklog = workshopContext?.rawBacklog as any;

        if (rawBacklog && Array.isArray(rawBacklog) && rawBacklog.length > 0) {
            items = rawBacklog;
        } else {
            // AUTO-EXTRACT
            console.log("[SupremeScout] parsing raw backlog from text...");
            const { text } = await generateText({
                model: AI_CONFIG.auditModel,
                prompt: `${BACKLOG_EXTRACTION_PROMPT}\n\nRAW BACKLOG:\n${backlogContext}`
            });

            try {
                const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
                items = JSON.parse(jsonStr);

                // Cache it
                await prisma.workshopContext.update({
                    where: { workshopId },
                    data: { rawBacklog: items }
                });
            } catch (e) {
                console.error("Failed to parse backlog extraction", e);
            }
        }


        return {
            success: true,
            context: { dna, research },
            items: items.map((i: any) => ({
                id: i.id || Math.random().toString(36).substring(7),
                title: i.title || "Untitled",
                description: i.description || ""
            }))
        };

    } catch (e) {
        console.error("fetchAnalysisContext failed", e);
        return { success: false, error: "Failed to load context" };
    }
}

// =============================================================================
// NEW: HYDRATION (THE PERSISTENCE FIX)
// =============================================================================

export async function getWorkshopIntelligence(workshopId: string) {
    try {
        const context = await prisma.workshopContext.findUnique({
            where: { workshopId },
            // @ts-ignore - Field exists in schema
            select: { intelligenceAnalysis: true }
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        // @ts-ignore - Field exists
        const data = context?.intelligenceAnalysis as any;

        if (data && data.opportunities && Array.isArray(data.opportunities) && data.opportunities.length > 0) {
            return { success: true, opportunities: data.opportunities };
        }
        return { success: false, opportunities: [] };
    } catch (error) {
        console.error("Hydration Failed", error);
        return { success: false, error: "Failed to load intelligence" };
    }
}

/**
 * Main Orchestrator for Research Briefs
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
// =============================================================================
// RESET WORKFLOW (RED BUTTON)
// =============================================================================

export async function resetWorkshopIntelligence(workshopId: string) {
    try {
        console.log(`[SupremeScout] Resetting intelligence for ${workshopId}...`);
        await prisma.workshopContext.update({
            where: { workshopId },
            data: {
                // @ts-ignore - intelligenceAnalysis is valid in schema but inference is stale
                intelligenceAnalysis: { opportunities: [] } // Clear the array
            }
        });

        revalidatePath(`/workshop/${workshopId}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to reset intelligence", error);
        return { success: false, error: "Failed to reset data" };
    }
}
