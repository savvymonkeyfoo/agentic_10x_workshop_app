'use server';

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
// REMOVED STATIC IMPORT: import { getWorkshopNamespace } from '@/lib/pinecone'; 
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

const BRIEF_SEPARATOR = '[---BRIEF_SEPARATOR---]';

// =============================================================================
// PINECONE RETRIEVAL (DYNAMIC / LAZY LOAD)
// =============================================================================

async function queryPinecone(
    workshopId: string,
    query: string,
    options: { topK?: number; filterType?: AssetType | AssetType[] } = {}
): Promise<RetrievalResult> {
    const { topK = 15, filterType } = options;

    console.log(`[SupremeScout] Querying Pinecone for workshop: ${workshopId}`);

    // DYNAMIC IMPORT: Hides Pinecone from the Client Bundle
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
// PROMPTS (UPDATED: SMART EXTRACTION)
// =============================================================================

// CHANGED: From "Data Entry Clerk" to "Business Analyst" to handle messy PDF text better
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

        if (!item.isSeed) {
            opportunity.title = item.title;
            opportunity.description = item.description;
            opportunity.source = 'CLIENT_BACKLOG';
        } else {
            opportunity.source = 'MARKET_SIGNAL';
        }
        opportunity.originalId = item.id;

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

// =============================================================================
// HYDRATION (UPDATED WITH ROBUST LOGIC)
// =============================================================================

export async function hydrateBacklog(workshopId: string) {
    try {
        console.log(`[SupremeScout] Hydrating backlog for ${workshopId}...`);

        // 1. Check DB Cache
        const context = await prisma.workshopContext.findUnique({ where: { workshopId } });
        // @ts-ignore
        const rawBacklog = context?.rawBacklog;

        if (rawBacklog && Array.isArray(rawBacklog) && rawBacklog.length > 0) {
            const researchSeeds = Array.from({ length: 5 }).map((_, i) => ({
                id: `seed-${i}`,
                title: `Strategic Opportunity Discovery ${i + 1}`,
                description: "Analyzing market signals...",
                isSeed: true
            }));
            return { success: true, items: [...rawBacklog, ...researchSeeds] };
        }

        // 2. Fetch Context
        const retrieval = await queryContext(workshopId, "backlog features", 'BACKLOG');
        const { backlogContext } = formatContext(retrieval.chunks);

        // DEBUG: Check if we actually have text
        console.log(`[SupremeScout] Backlog Context Length: ${backlogContext?.length || 0}`);
        if (!backlogContext || backlogContext.length < 50) {
            console.warn("[SupremeScout] Backlog context is empty or too short!");
            // return { success: false, error: "No backlog found" }; // OPTIONAL: Could return error here
        }

        // 3. Generate (Smart Extraction)
        const { text } = await generateText({
            model: AI_CONFIG.auditModel,
            prompt: `${BACKLOG_EXTRACTION_PROMPT}\n\nRAW BACKLOG:\n${backlogContext}`,
        });

        // 4. Safe Parsing
        let items = [];
        try {
            const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleanJson);
            const parsedItems = parsed.items ? parsed.items : parsed;

            if (!Array.isArray(parsedItems)) throw new Error("AI returned non-array");

            items = parsedItems.map((item: any, index: number) => ({
                id: item.id || `backlog-${Date.now()}-${index}`,
                // Fallback to other common keys if 'title' is missing
                title: item.title || item.feature || item.requirement || item.name || "Untitled Item",
                // Fallback to other common keys if 'description' is missing
                description: item.description || item.details || item.summary || item.text || "No description provided",
                isSeed: false
            }));

        } catch (e) {
            console.error("[SupremeScout] JSON Parsing Failed:", text);
            return { success: false, error: "JSON Extraction Failed" };
        }

        // 5. Save to DB
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

export async function generateBrief(workshopId: string) {
    const workshop = await prisma.workshop.findUnique({ where: { id: workshopId }, select: { clientName: true } });
    const clientName = workshop?.clientName || "The Client";
    const retrieval = await queryPinecone(workshopId, "Analyse enterprise architecture...", { topK: 25, filterType: ['DOSSIER', 'BACKLOG'] });
    const { dossierContext, backlogContext, sources } = formatContext(retrieval.chunks);
    const auditData = await technicalAudit(dossierContext, backlogContext);
    const gapHypotheses = await identifyStrategicGaps(auditData, backlogContext);
    const { briefs, signature } = await architectResearchBriefs(auditData, gapHypotheses, sources, clientName);

    await prisma.workshopContext.upsert({
        where: { workshopId },
        update: { researchBrief: briefs.join('\n\n---\n\n'), researchBriefs: briefs as any, reasoningSignature: signature as string | null },
        create: { workshopId, researchBrief: briefs.join('\n\n---\n\n'), researchBriefs: briefs as any, reasoningSignature: signature as string | null },
    });
    revalidatePath(`/workshop/${workshopId}`);
    return { success: true, briefs, brief: briefs.join('\n\n---\n\n') };
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
