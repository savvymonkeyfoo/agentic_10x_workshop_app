'use server';

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
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

// DEFINED RETURN TYPE FOR BRIEF GENERATION
interface GenerationResult {
    success: boolean;
    briefs: string[];
    brief?: string;
    error?: string;
}

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

    const { getWorkshopNamespace } = await import('@/lib/pinecone');

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
// PROMPTS (AUSTRALIAN SPELLING + BULLET POINTS)
// =============================================================================

const BACKLOG_EXTRACTION_PROMPT = `You are a Senior Business Analyst.
Task: Extract a structured backlog from the raw document text provided below.

INSTRUCTIONS:
1. Identify items: Look for bullet points, numbered lists, or sections that describe features, tasks, or user stories.
2. Extract Content: For each item, capture a clear 'Title' and a 'Description'.
   - If the title is not explicit, summarize the first sentence as the title.
   - If the description is missing, infer it from the context.
   - DO NOT return empty strings. If an item has no content, skip it.

OUTPUT FORMAT:
Return a clean JSON array of objects.
Example: [{"title": "Login Page", "description": "Allow users to log in via SSO."}]`;

const TECHNICAL_AUDIT_PROMPT = `You are a forensic Systems Architect. Extract ONLY hard data points.`;
const STRATEGIC_GAPS_PROMPT = `You are a Strategic Disruption Analyst. Identify 3-5 Strategic Collision Points.`;
const RESEARCH_BRIEFS_PROMPT = `You are a Strategic Research Director. Architect 4-6 Research Briefs.`;

const ENRICHMENT_PROMPT = `You are a Strategy Consultant.
Task: Enrich this Client Backlog Item.

STRICT RULES:
1. Language: Use Australian English spelling (e.g., 'optimise', 'centre', 'programme').
2. Title/Description: KEEP EXACTLY AS PROVIDED. Do not rewrite.
3. Formatting: 'Friction', 'Tech Alignment', and 'Strategy Alignment' MUST be formatted as Markdown Bullet Points.

ANALYSIS FIELDS:
- Friction: Analyze operational pain points (Bullet points).
- Tech Alignment: Map to Technical DNA (Bullet points).
- Strategy Alignment: Explain how this supports business goals (Bullet points).

OUTPUT JSON: { 
    "title": "string", 
    "description": "string", 
    "friction": "string", 
    "techAlignment": "string", 
    "strategyAlignment": "string", 
    "source": "CLIENT_BACKLOG", 
    "originalId": "string" 
}`;

const GENERATION_PROMPT = `You are a Chief Innovation Officer.
Task: Generate a BRAND NEW Strategic Opportunity based on Research.
Constraint: Must be totally different from Backlog.

STRICT RULES:
1. Language: Use Australian English spelling (e.g., 'optimise', 'centre').
2. Formatting: Output analysis fields as Markdown Bullet Points.

OUTPUT JSON: { 
    "title": "string", 
    "description": "string", 
    "friction": "string", 
    "techAlignment": "string", 
    "strategyAlignment": "string", 
    "source": "MARKET_SIGNAL", 
    "originalId": "string" 
}`;

// =============================================================================
// ANALYSIS FUNCTIONS
// =============================================================================

async function technicalAudit(dossierContext: string, backlogContext: string): Promise<string> {
    const { text } = await generateText({
        model: AI_CONFIG.auditModel,
        prompt: `${TECHNICAL_AUDIT_PROMPT}\n\nDOSSIER:\n${dossierContext}\n\nBACKLOG:\n${backlogContext}`,
        providerOptions: AI_CONFIG.thinkingOptions.audit,
    });
    return text;
}

async function identifyStrategicGaps(auditData: string, backlogContext: string): Promise<string> {
    const { text } = await generateText({
        model: AI_CONFIG.strategicModel,
        prompt: `${STRATEGIC_GAPS_PROMPT}\n\nDNA:\n${auditData}\n\nFRICTION:\n${backlogContext}`,
        providerOptions: AI_CONFIG.thinkingOptions.strategic,
    });
    return text;
}

async function architectResearchBriefs(auditData: string, gapHypotheses: string, sources: string[], clientName: string) {
    const result = await generateText({
        model: AI_CONFIG.strategicModel,
        prompt: `${RESEARCH_BRIEFS_PROMPT}\n\nCLIENT: ${clientName}\nDNA: ${auditData}\nGAPS: ${gapHypotheses}\nSOURCES: ${sources.join(', ')}`,
        providerOptions: { google: { thinkingConfig: { thinkingLevel: AI_CONFIG.thinking.strategicLevel, includeThoughts: true } } },
    });
    // @ts-ignore
    const signature = result.providerMetadata?.google?.thoughtSignature || null;
    const briefArray = result.text.split(BRIEF_SEPARATOR).map(b => b.trim()).filter(b => b.length > 0);
    return { briefs: briefArray, signature };
}

export async function analyzeBacklogItem(
    workshopId: string,
    item: { id: string; title: string; description: string; isSeed?: boolean },
    context?: { dna: string; research: string }
) {
    try {
        const dbContext = await prisma.workshopContext.findUnique({ where: { workshopId } });
        // @ts-ignore
        let techDNA = context?.dna || dbContext?.extractedConstraints as string;
        let research = context?.research || dbContext?.researchBrief || "No specific research briefs.";

        if (!techDNA) {
            const retrieval = await queryContext(workshopId, "technical architecture", 'DOSSIER');
            const { dossierContext, backlogContext } = formatContext(retrieval.chunks);
            techDNA = await technicalAudit(dossierContext, backlogContext);
            await prisma.workshopContext.update({ where: { workshopId }, data: { extractedConstraints: techDNA } });
        }

        let prompt;
        if (item.isSeed) {
            prompt = `${GENERATION_PROMPT}\n\nRESEARCH: ${research}`;
        } else {
            prompt = `${ENRICHMENT_PROMPT}\n\nITEM: ${item.title}\nDESC: ${item.description}\nDNA: ${techDNA}`;
        }

        const { text: cardJson } = await generateText({
            model: AI_CONFIG.strategicModel,
            prompt,
            // @ts-ignore
            response_format: { type: "json_object" }
        });

        const opportunity = JSON.parse(cardJson.replace(/```json/g, '').replace(/```/g, '').trim());

        // FORCE VERBATIM FIDELITY
        // We purposefully overwrite whatever description the AI generated 
        // with the original one from the file to prevent rewriting/hallucination.
        if (!item.isSeed) {
            opportunity.title = item.title;
            opportunity.description = item.description;
            opportunity.source = 'CLIENT_BACKLOG';
        } else {
            opportunity.source = 'MARKET_SIGNAL';
        }
        opportunity.originalId = item.id;

        // Ensure defaults
        opportunity.strategyAlignment = opportunity.strategyAlignment || "- Aligns with core modernisation goals.";

        const currentContext = await prisma.workshopContext.findUnique({ where: { workshopId }, select: { intelligenceAnalysis: true } });

        const currentData = (currentContext?.intelligenceAnalysis as any) || { opportunities: [] };
        const cleanOpportunities = (currentData.opportunities || []).filter((o: any) => o.originalId !== item.id);

        await prisma.workshopContext.update({
            where: { workshopId },
            data: {
                intelligenceAnalysis: {
                    ...currentData,
                    opportunities: [...cleanOpportunities, opportunity]
                }
            }
        });

        return { success: true, opportunity };

    } catch (error) {
        console.error("Analysis Failed", error);
        return { success: false, error: "Analysis failed" };
    }
}

// =============================================================================
// MANUAL UPDATE (AUTO-SAVE HANDLER)
// =============================================================================

export async function updateOpportunity(workshopId: string, opportunity: any) {
    try {
        const currentContext = await prisma.workshopContext.findUnique({ where: { workshopId }, select: { intelligenceAnalysis: true } });
        const currentData = (currentContext?.intelligenceAnalysis as any) || { opportunities: [] };

        // Remove old version, add new version
        const otherOpportunities = (currentData.opportunities || []).filter((o: any) => o.originalId !== opportunity.originalId);

        await prisma.workshopContext.update({
            where: { workshopId },
            data: {
                intelligenceAnalysis: {
                    ...currentData,
                    opportunities: [...otherOpportunities, opportunity]
                }
            }
        });

        // Silent revalidate
        revalidatePath(`/workshop/${workshopId}`);
        return { success: true };
    } catch (error) {
        console.error("Update Failed", error);
        return { success: false };
    }
}

// =============================================================================
// HYDRATION, ETC. (Keep remaining functions exactly as they were)
// =============================================================================

export async function hydrateBacklog(workshopId: string) {
    try {
        console.log(`[SupremeScout] Hydrating backlog for ${workshopId}...`);

        const context = await prisma.workshopContext.findUnique({ where: { workshopId } });
        // @ts-ignore
        const rawBacklog = context?.rawBacklog;

        if (rawBacklog && Array.isArray(rawBacklog) && rawBacklog.length > 0) {
            const researchSeeds = Array.from({ length: 5 }).map((_, i) => ({
                id: `seed-${i}`,
                title: `Strategic Opportunity Discovery ${i + 1}`,
                description: "Analysing market signals...",
                isSeed: true
            }));
            return { success: true, items: [...rawBacklog, ...researchSeeds] };
        }

        const retrieval = await queryContext(workshopId, "backlog features", 'BACKLOG');
        const { backlogContext } = formatContext(retrieval.chunks);

        if (!backlogContext || backlogContext.length < 50) {
            console.warn("[SupremeScout] Backlog context is empty or too short!");
        }

        const { text } = await generateText({
            model: AI_CONFIG.auditModel,
            prompt: `${BACKLOG_EXTRACTION_PROMPT}\n\nRAW BACKLOG:\n${backlogContext}`,
        });

        let items = [];
        try {
            const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleanJson);
            const parsedItems = parsed.items ? parsed.items : parsed;

            if (!Array.isArray(parsedItems)) throw new Error("AI returned non-array");

            items = parsedItems.map((item: any, index: number) => ({
                id: item.id || `backlog-${Date.now()}-${index}`,
                title: item.title || item.feature || item.name || "Untitled Item",
                description: item.description || item.details || item.summary || item.text || "No description provided",
                isSeed: false
            }));

        } catch (e) {
            console.error("[SupremeScout] JSON Parsing Failed:", text);
            return { success: false, error: "JSON Extraction Failed" };
        }

        await prisma.workshopContext.upsert({
            where: { workshopId },
            update: { rawBacklog: items },
            create: { workshopId, rawBacklog: items }
        });

        const researchSeeds = Array.from({ length: 5 }).map((_, i) => ({
            id: `seed-${i}`,
            title: `Strategic Opportunity Discovery ${i + 1}`,
            description: "Analysing market signals...",
            isSeed: true
        }));

        return { success: true, items: [...items, ...researchSeeds] };

    } catch (e) {
        console.error("Hydration Failed", e);
        return { success: false, error: "Failed to hydrate" };
    }
}

export async function fetchAnalysisContext(workshopId: string) {
    const workshopContext = await prisma.workshopContext.findUnique({ where: { workshopId } });
    const retrieval = await queryPinecone(workshopId, "Architecture and Strategy", { topK: 20 });
    const { dossierContext, backlogContext } = formatContext(retrieval.chunks);
    const dna = await technicalAudit(dossierContext, backlogContext);
    const research = workshopContext?.researchBrief || "No research briefs found.";

    // @ts-ignore
    const items = (workshopContext?.rawBacklog as any[]) || [];

    return {
        success: true,
        context: { dna, research },
        items: items.map((i: any) => ({
            id: i.id || Math.random().toString(36).substring(7),
            title: i.title || "Untitled",
            description: i.description || "",
            isSeed: i.isSeed
        }))
    };
}

export async function getWorkshopIntelligence(workshopId: string) {
    try {
        const context = await prisma.workshopContext.findUnique({
            where: { workshopId },
            select: { intelligenceAnalysis: true }
        });
        // @ts-ignore
        const data = context?.intelligenceAnalysis as any;
        return { success: true, opportunities: data?.opportunities || [] };
    } catch (error) {
        return { success: false, error: "Failed to load" };
    }
}

export async function generateBrief(workshopId: string): Promise<GenerationResult> {
    try {
        const workshop = await prisma.workshop.findUnique({ where: { id: workshopId }, select: { clientName: true } });
        const clientName = workshop?.clientName || "The Client";
        const retrieval = await queryPinecone(workshopId, "Analyse enterprise architecture...", { topK: 25, filterType: ['DOSSIER', 'BACKLOG'] });
        const { dossierContext, backlogContext, sources } = formatContext(retrieval.chunks);
        const auditData = await technicalAudit(dossierContext, backlogContext);
        const gapHypotheses = await identifyStrategicGaps(auditData, backlogContext);
        const { briefs, signature } = await architectResearchBriefs(auditData, gapHypotheses, sources, clientName);

        await prisma.workshopContext.upsert({
            where: { workshopId },
            update: { researchBrief: briefs.join('\n\n---\n\n'), researchBriefs: briefs, reasoningSignature: signature as string | null },
            create: { workshopId, researchBrief: briefs.join('\n\n---\n\n'), researchBriefs: briefs, reasoningSignature: signature as string | null },
        });
        revalidatePath(`/workshop/${workshopId}`);
        return { success: true, briefs, brief: briefs.join('\n\n---\n\n') };
    } catch (error) {
        console.error("Brief Generation Failed", error);
        return {
            success: false,
            briefs: [],
            error: "Failed to generate brief"
        };
    }
}

export async function queryContext(workshopId: string, query: string, assetType?: AssetType) {
    return queryPinecone(workshopId, query, { topK: 10, filterType: assetType });
}

export async function resetWorkshopIntelligence(workshopId: string) {
    try {
        console.log(`[SupremeScout] Resetting intelligence for ${workshopId}...`);
        await prisma.workshopContext.update({
            where: { workshopId },
            data: {
                intelligenceAnalysis: { opportunities: [] },
                rawBacklog: Prisma.DbNull
            }
        });

        revalidatePath(`/workshop/${workshopId}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to reset intelligence", error);
        return { success: false, error: "Failed to reset data" };
    }
}

export async function preWarmContext(workshopId: string) {
    // Simply ensure connection is alive
    try {
        await prisma.workshopContext.findUnique({ where: { workshopId }, select: { id: true } });
        return { success: true };
    } catch (e) {
        return { success: false };
    }
}
