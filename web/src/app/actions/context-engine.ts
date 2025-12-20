'use server';

import { prisma } from '@/lib/prisma';
import { AI_CONFIG } from '@/lib/ai-config';
import { generateText, embed } from 'ai';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';

// REMOVED: export const maxDuration = 300; (Moved to page.tsx)

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

const BRIEF_SEPARATOR = '[---BRIEF_SEPARATOR---]';

// =============================================================================
// PRE-WARM (RESTORES "SERVER START" CONNECTION)
// =============================================================================

export async function preWarmContext(workshopId: string) {
    try {
        console.log(`[SupremeScout] Pre-warming connection for ${workshopId}...`);
        // This forces the "Lazy Import" to execute NOW, not later.
        const { getWorkshopNamespace } = await import('@/lib/pinecone');

        // This forces the SSL Handshake with Pinecone
        const namespace = getWorkshopNamespace(workshopId);
        // Lightweight stats call to verify connection is alive
        await namespace.describeIndexStats();

        return { success: true };
    } catch (error) {
        console.error("[SupremeScout] Warmup failed (non-fatal)", error);
        return { success: false };
    }
}

// =============================================================================
// PINECONE RETRIEVAL (DYNAMIC IMPORT)
// =============================================================================

async function queryPinecone(
    workshopId: string,
    query: string,
    options: { topK?: number; filterType?: AssetType | AssetType[] } = {}
): Promise<RetrievalResult> {
    const { topK = 15, filterType } = options;

    console.log(`[SupremeScout] Querying Pinecone for workshop: ${workshopId}`);

    // Dynamic import ensures Client Bundle safety
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
// PROMPTS (VERBATIM & STRICT)
// =============================================================================

const BACKLOG_EXTRACTION_PROMPT = `You are a Data Entry Clerk.
Task: Extract the backlog items VERBATIM from the text.
CRITICAL RULE: Do not summarize. Do not reword. Do not fix typos.
Copy the 'Title' and 'Description' EXACTLY as they appear in the source text.
Return them as a clean JSON array.`;

const TECHNICAL_AUDIT_PROMPT = `You are a forensic Systems Architect. Extract ONLY hard data points.`;
const STRATEGIC_GAPS_PROMPT = `You are a Strategic Disruption Analyst. Identify 3-5 Strategic Collision Points.`;
const RESEARCH_BRIEFS_PROMPT = `You are a Strategic Research Director. Architect 4-6 Research Briefs.`;

const ENRICHMENT_PROMPT = `You are a Strategy Consultant.
Task: Enrich this Client Backlog Item without changing its core identity.
1. Title/Description: KEEP EXACTLY AS PROVIDED.
2. Friction: Analyze operational pain points.
3. Tech Alignment: Map to Technical DNA.
OUTPUT JSON: { "title", "description", "friction", "techAlignment", "source": "CLIENT_BACKLOG", "status", "horizon", "category", "originalId" }`;

const GENERATION_PROMPT = `You are a Chief Innovation Officer.
Task: Generate a BRAND NEW Strategic Opportunity based on Research.
Constraint: Must be totally different from Backlog.
OUTPUT JSON: { "title", "description", "friction", "techAlignment", "source": "MARKET_SIGNAL", "status", "horizon", "category", "originalId" }`;

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

        // CASTING TO STRING TO AVOID TS WARNINGS
        let techDNA = context?.dna || (dbContext?.extractedConstraints as string);
        let research = context?.research || (dbContext?.researchBrief as string) || "No specific research briefs.";

        // Lazy load context if missing
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

        let opportunity;
        try {
            opportunity = JSON.parse(cardJson.replace(/```json/g, '').replace(/```/g, '').trim());
        } catch (e) { return { success: false, error: "JSON Parse Error" }; }

        // FORCE FIDELITY (BACKEND OVERWRITE)
        if (!item.isSeed) {
            opportunity.title = item.title;
            opportunity.description = item.description;
            opportunity.source = 'CLIENT_BACKLOG';
        } else {
            opportunity.source = 'MARKET_SIGNAL';
        }
        opportunity.originalId = item.id;

        // Atomic DB Update
        const currentContext = await prisma.workshopContext.findUnique({ where: { workshopId }, select: { intelligenceAnalysis: true } });

        // --- CRITICAL FIX: EXPLICIT CASTING TO ANY TO FIX SPREAD ERROR ---
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

export async function hydrateBacklog(workshopId: string) {
    try {
        const context = await prisma.workshopContext.findUnique({ where: { workshopId } });

        // --- CRITICAL FIX: CAST TO ANY[] ---
        const rawBacklog = context?.rawBacklog as any[];

        // RETURN CACHED IF EXISTS
        if (rawBacklog && Array.isArray(rawBacklog) && rawBacklog.length > 0) {
            const researchSeeds = Array.from({ length: 5 }).map((_, i) => ({
                id: `seed-${i}`,
                title: `Strategic Opportunity Discovery ${i + 1}`,
                description: "Analyzing market signals...",
                isSeed: true
            }));
            return { success: true, items: [...rawBacklog, ...researchSeeds] };
        }

        // FETCH & EXTRACT (VERBATIM)
        const retrieval = await queryContext(workshopId, "backlog features", 'BACKLOG');
        const { backlogContext } = formatContext(retrieval.chunks);

        if (!backlogContext) return { success: false, error: "No backlog found" };

        const { text } = await generateText({
            model: AI_CONFIG.auditModel,
            prompt: `${BACKLOG_EXTRACTION_PROMPT}\n\nRAW BACKLOG:\n${backlogContext}`,
        });

        let items;
        try {
            const parsed = JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());
            items = parsed.items ? parsed.items : parsed;
        } catch (e) { return { success: false, error: "JSON Extraction Failed" }; }

        await prisma.workshopContext.upsert({
            where: { workshopId },
            update: { rawBacklog: items },
            create: { workshopId, rawBacklog: items }
        });

        const researchSeeds = Array.from({ length: 5 }).map((_, i) => ({
            id: `seed-${i}`,
            title: `Strategic Opportunity Discovery ${i + 1}`,
            description: "Analyzing market signals...",
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

    // --- CRITICAL FIX: CAST TO ANY[] ---
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
        // --- CRITICAL FIX: CAST TO ANY ---
        const data = context?.intelligenceAnalysis as any;
        return { success: true, opportunities: data?.opportunities || [] };
    } catch (error) {
        return { success: false, error: "Failed to load" };
    }
}

export async function generateBrief(workshopId: string) {
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
            update: { researchBrief: briefs.join('\n\n---\n\n'), researchBriefs: briefs as any, reasoningSignature: signature as any },
            create: { workshopId, researchBrief: briefs.join('\n\n---\n\n'), researchBriefs: briefs as any, reasoningSignature: signature as any },
        });
        revalidatePath(`/workshop/${workshopId}`);
        // FORCE RETURN SUCCESS
        return { success: true, briefs, brief: briefs.join('\n\n---\n\n') };
    } catch (error) {
        console.error("Brief Generation Failed", error);
        return { success: false, error: "Failed to generate brief" };
    }
}

export async function queryContext(workshopId: string, query: string, assetType?: AssetType) {
    return queryPinecone(workshopId, query, { topK: 10, filterType: assetType });
}

// =============================================================================
// RESET WORKFLOW (NUCLEAR CACHE CLEAR)
// =============================================================================

export async function resetWorkshopIntelligence(workshopId: string) {
    try {
        console.log(`[SupremeScout] Resetting intelligence for ${workshopId}...`);
        await prisma.workshopContext.update({
            where: { workshopId },
            data: {
                intelligenceAnalysis: { opportunities: [] },
                // THIS FIXES THE GHOST CACHE & FORCES RE-EXTRACTION
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
