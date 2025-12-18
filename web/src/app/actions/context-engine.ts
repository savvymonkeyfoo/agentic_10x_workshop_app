'use server';

import { prisma } from '@/lib/prisma';
import { getWorkshopNamespace } from '@/lib/pinecone';
import { google } from '@ai-sdk/google';
import { generateText, embed } from 'ai';
import { revalidatePath } from 'next/cache';

// Types
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

/**
 * Query Pinecone for semantically relevant chunks.
 * Supports filtering by asset type for surgical retrieval.
 */
async function queryPinecone(
    workshopId: string,
    query: string,
    options: {
        topK?: number;
        filterType?: AssetType | AssetType[];
    } = {}
): Promise<RetrievalResult> {
    const { topK = 15, filterType } = options;

    console.log(`[ContextEngine] Querying Pinecone for workshop: ${workshopId}`);
    console.log(`[ContextEngine] Query: "${query.slice(0, 100)}..."`);

    // Generate embedding for the query
    const { embedding } = await embed({
        model: google.textEmbeddingModel('text-embedding-004'),
        value: query,
    });

    // Build filter
    let filter: Record<string, unknown> | undefined;
    if (filterType) {
        if (Array.isArray(filterType)) {
            filter = { type: { "$in": filterType } };
        } else {
            filter = { type: { "$eq": filterType } };
        }
    }

    // Query Pinecone namespace
    const namespace = getWorkshopNamespace(workshopId);
    const results = await namespace.query({
        vector: embedding,
        topK,
        filter,
        includeMetadata: true,
    });

    // Transform results
    const chunks: RetrievedChunk[] = results.matches.map(match => ({
        id: match.id,
        content: (match.metadata?.content as string) || '',
        filename: (match.metadata?.filename as string) || 'Unknown',
        type: (match.metadata?.type as AssetType) || 'DOSSIER',
        score: match.score || 0,
    }));

    // Count unique documents
    const uniqueFiles = new Set(chunks.map(c => c.filename));

    console.log(`[ContextEngine] Retrieved ${chunks.length} chunks from ${uniqueFiles.size} documents`);

    return {
        chunks,
        documentCount: uniqueFiles.size,
        chunkCount: chunks.length,
    };
}

/**
 * Format retrieved chunks into context sections for the prompt.
 */
function formatContext(chunks: RetrievedChunk[]): {
    dossierContext: string;
    backlogContext: string;
    sources: string[];
} {
    const dossierChunks = chunks.filter(c => c.type === 'DOSSIER');
    const backlogChunks = chunks.filter(c => c.type === 'BACKLOG');

    const formatChunks = (arr: RetrievedChunk[]) =>
        arr.map(c => `[Source: ${c.filename}]\n${c.content}`).join('\n\n---\n\n');

    const sources = [...new Set(chunks.map(c => c.filename))];

    return {
        dossierContext: formatChunks(dossierChunks) || 'No enterprise context available.',
        backlogContext: formatChunks(backlogChunks) || 'No backlog items available.',
        sources,
    };
}

/**
 * The Strategic Scout Master Prompt for Gap Analysis & Research Scoping.
 * 
 * This prompt analyzes "Inside-Out" knowledge to identify "Outside-In" research gaps.
 * Focus: What we DON'T know, not what we already know.
 */
function buildScopingPrompt(
    dossierContext: string,
    backlogContext: string,
    sources: string[]
): string {
    return `### ROLE
You are the "Strategic Scout." Your task is to analyze internal enterprise data and identify the "Knowledge Gaps" that must be filled with external market research.

You are NOT summarizing what we know. You are identifying what is MISSING — the blind spots that could blindside this organization.

══════════════════════════════════════════════════════════════
📁 ENTERPRISE DOSSIER (Architecture, Tech Stack, Geography, Strengths)
══════════════════════════════════════════════════════════════
${dossierContext}

══════════════════════════════════════════════════════════════
📋 CLIENT BACKLOG (Operational Friction & Strategic Priorities)
══════════════════════════════════════════════════════════════
${backlogContext}

══════════════════════════════════════════════════════════════
📖 SOURCE DOCUMENTS ANALYZED
══════════════════════════════════════════════════════════════
${sources.map((s, i) => `${i + 1}. ${s}`).join('\n')}

══════════════════════════════════════════════════════════════
🔍 ANALYSIS FRAMEWORK: The "Inside-Out" Lens
══════════════════════════════════════════════════════════════

Apply each lens to identify gaps:

1. **Architecture & Tech Stack**: Based on their current technology choices, what emerging technology shifts (e.g., edge computing, specific AI breakthroughs, new frameworks) are they currently ignoring?

2. **Geography & Market**: Given their operating geography, what "Outside-In" signals from nearby regions, emerging markets, or global competitors would threaten their business strategy?

3. **Security & Regulatory**: What hidden security risks or regulatory shifts in their industry are NOT mentioned in their internal documents?

4. **Innovation Counter-Signals**: For each strength they claim, find the "Counter-Signal"—a competitor or startup doing the exact opposite successfully.

══════════════════════════════════════════════════════════════
🎯 YOUR TASK: Generate a Targeted Research Mandate
══════════════════════════════════════════════════════════════

Produce a structured "Research Roadmap" with the following sections:

## 🎯 The Blind Spot Hypothesis
A 2-3 sentence summary of what is likely MISSING from their current perspective. What are they not seeing?

## 🔍 Priority Research Queries
Generate 5 highly specific, actionable search queries for an external research team:
1. **[Topic]**: "[Exact query text]" — *Why this matters: [brief rationale]*
2. **[Topic]**: "[Exact query text]" — *Why this matters: [brief rationale]*
3. **[Topic]**: "[Exact query text]" — *Why this matters: [brief rationale]*
4. **[Topic]**: "[Exact query text]" — *Why this matters: [brief rationale]*
5. **[Topic]**: "[Exact query text]" — *Why this matters: [brief rationale]*

## 🏢 Competitor Watchlist
Identify 3 specific companies they should be monitoring based on their current roadmap:
1. **[Company Name]**: [Why they matter to this client's strategy]
2. **[Company Name]**: [Why they matter to this client's strategy]
3. **[Company Name]**: [Why they matter to this client's strategy]

## ⚠️ Strategic Risk Signals
2 external forces that could disrupt their current trajectory:
1. **[Risk Category]**: [Specific threat and leading indicators to watch]
2. **[Risk Category]**: [Specific threat and leading indicators to watch]

## 📊 Recommended Market Signals
Suggest 2 specific data sources or publications to monitor:
1. **[Source/Publication]**: [What to look for]
2. **[Source/Publication]**: [What to look for]

---
**CRITICAL CONSTRAINTS:**
- Do NOT summarize what we already know from the dossier/backlog.
- Focus EXCLUSIVELY on what is NOT in the documents.
- Be highly specific (e.g., "Analyze [Competitor X]'s latest patent in [Technology Y]").
- Every query must be tied to a specific gap in their current knowledge.
- Ground your gap analysis in evidence from the context—explain WHY something is missing.
`;
}

/**
 * Generate Research Brief (Gap Analysis) using Pinecone RAG.
 * 
 * This function analyzes Inside-Out knowledge to scope Outside-In research.
 * Output: A Research Mandate with specific queries and competitor watchlist.
 */
export async function generateBrief(workshopId: string) {
    console.log(`[ContextEngine] ========== Generating Research Scope for ${workshopId} ==========`);

    try {
        // 1. Query Pinecone for relevant chunks - focus on architecture, strategy, geography
        const query = "Analyze the enterprise architecture, technology stack, geographic operations, strategic priorities, operational friction, and innovation capabilities";
        const retrieval = await queryPinecone(workshopId, query, {
            topK: 25, // More chunks for comprehensive gap analysis
            filterType: ['DOSSIER', 'BACKLOG'],
        });

        if (retrieval.chunkCount === 0) {
            return {
                success: false,
                brief: "No indexed documents found. Please upload and index assets first.",
                documentCount: 0,
            };
        }

        // 2. Format context for prompt
        const { dossierContext, backlogContext, sources } = formatContext(retrieval.chunks);

        // 3. Build the Strategic Scout Scoping Prompt
        const prompt = buildScopingPrompt(dossierContext, backlogContext, sources);

        console.log(`[ContextEngine] Generating research scope from ${retrieval.documentCount} documents...`);

        // 4. Generate with Gemini
        const { text } = await generateText({
            model: google('gemini-2.5-flash'),
            prompt,
        });

        // 5. Save to WorkshopContext
        await prisma.workshopContext.upsert({
            where: { workshopId },
            update: { researchBrief: text },
            create: { workshopId, researchBrief: text },
        });

        console.log(`[ContextEngine] Research scope generated successfully`);
        revalidatePath(`/workshop/${workshopId}`);

        return {
            success: true,
            brief: text,
            documentCount: retrieval.documentCount,
            sources,
        };

    } catch (error) {
        console.error("[ContextEngine] Research Scoping Error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to generate research scope.",
            documentCount: 0,
        };
    }
}

/**
 * Query Pinecone for specific asset type (for surgical retrieval).
 * Useful for targeted queries like "only backlog" or "only dossier".
 */
export async function queryContext(
    workshopId: string,
    query: string,
    assetType?: AssetType
): Promise<RetrievalResult> {
    return queryPinecone(workshopId, query, {
        topK: 10,
        filterType: assetType,
    });
}
