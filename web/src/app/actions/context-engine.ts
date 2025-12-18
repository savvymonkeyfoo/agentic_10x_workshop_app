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
 * Few-Shot Exemplars for Query Calibration.
 * Demonstrates the difference between generic and 10x scouting queries.
 */
const FEW_SHOT_EXEMPLARS = `
══════════════════════════════════════════════════════════════
📚 FEW-SHOT CALIBRATION: What "10x" Research Looks Like
══════════════════════════════════════════════════════════════

EXAMPLE 1:
- INPUT_CONTEXT: Client uses AWS/Java but backlog mentions 3-week deployment cycles.
- ❌ POOR_QUERY: "How to improve AWS deployment?"
- ✅ 10X_QUERY: "Analyze open-source Terraform modules for AWS serverless that reduce cold-start latency in Java-based financial microservices."
- WHY_BETTER: Specific tech stack, specific metric, specific domain.

EXAMPLE 2:
- INPUT_CONTEXT: Operates in Australia/NZ, no mention of APAC expansion or regional competitors.
- ❌ POOR_QUERY: "APAC fintech trends 2025"
- ✅ 10X_QUERY: "Compare regulatory sandbox requirements for PSD2-equivalent APIs in Singapore vs Australia for cross-border B2B payment corridors."
- WHY_BETTER: Geographic specificity, regulatory angle, business model focus.

EXAMPLE 3:
- INPUT_CONTEXT: Dossier mentions SOC2 compliance but no recent security audit or threat modeling.
- ❌ POOR_QUERY: "Cloud security best practices"
- ✅ 10X_QUERY: "Identify CVEs disclosed in the last 6 months affecting Java Spring Boot microservices on AWS EKS with emphasis on supply chain attacks."
- WHY_BETTER: CVE-specific, time-bound, architecture-matched.
`;

/**
 * The Strategic Scout Master Prompt for Gap Analysis & Research Scoping.
 * 
 * Enhanced with:
 * 1. Structural Anchor (TECH_STACK, GEOGRAPHY, SECURITY categorization)
 * 2. Few-Shot Exemplars (Poor vs 10x query calibration)
 * 3. JSON-Ready Output (Search API Payloads for agentic handoff)
 */
function buildScopingPrompt(
    dossierContext: string,
    backlogContext: string,
    sources: string[]
): string {
    return `### ROLE
You are the "Strategic Scout" — an elite research scoping agent for the 10x Innovation Protocol.
Your task: Analyze internal enterprise data and generate a RESEARCH MANDATE for an external agentic research team.

You are NOT summarizing what we know. You are identifying KNOWLEDGE GAPS that require external market intelligence.

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

${FEW_SHOT_EXEMPLARS}

══════════════════════════════════════════════════════════════
🔍 STEP 1: CATEGORIZE THE INSIDE (Extract Before You Scope)
══════════════════════════════════════════════════════════════

Before generating research queries, you MUST first extract and list these elements from the context:

- **[TECH_STACK]**: Primary languages, cloud providers, frameworks, and legacy constraints mentioned.
- **[GEOGRAPHY]**: Primary and secondary operating regions/markets.
- **[SECURITY_POSTURE]**: Any mentioned compliance (SOC2, GDPR, PCI-DSS) or security concerns.
- **[STRATEGIC_PILLARS]**: Top 3 strategic priorities from the Dossier.
- **[OPERATIONAL_FRICTION]**: Key blockers or pain points from the Backlog.

══════════════════════════════════════════════════════════════
🎯 STEP 2: GENERATE THE RESEARCH MANDATE
══════════════════════════════════════════════════════════════

Using the extracted categories, produce this structured output:

---

## 📊 INSIDE-OUT CATEGORIZATION

### Tech Stack
\`\`\`
[List extracted technologies, languages, cloud providers, frameworks]
\`\`\`

### Geography
\`\`\`
[List operating regions and markets]
\`\`\`

### Security Posture
\`\`\`
[List compliance standards and security concerns]
\`\`\`

### Strategic Pillars
\`\`\`
[List top 3 priorities]
\`\`\`

### Operational Friction
\`\`\`
[List key blockers from backlog]
\`\`\`

---

## 🎯 THE BLIND SPOT HYPOTHESIS

Write 2-3 sentences describing the friction between their current architecture/posture and market velocity. What are they NOT seeing?

---

## 🔍 SEARCH API PAYLOADS

Generate exactly 5 high-intent research queries. For each:

### Query 1: [Topic Name]
- **query_string**: "[Exact text for search engine]"
- **intent**: [Why we are searching - e.g., "Architecture Validation", "Competitive Intelligence", "Regulatory Scan"]
- **expected_signal**: [What specific evidence would change our strategy]
- **grounded_in**: [Which [TECH_STACK], [GEOGRAPHY], or [SECURITY] element this targets]

### Query 2: [Topic Name]
[Same structure...]

### Query 3: [Topic Name]
[Same structure...]

### Query 4: [Topic Name]
[Same structure...]

### Query 5: [Topic Name]
[Same structure...]

---

## 🏢 COMPETITOR WATCHLIST

Identify 3 specific companies to monitor:

| Company | Why Monitor | Threat Vector |
|---------|-------------|---------------|
| [Name] | [Rationale tied to client's [TECH_STACK] or [GEOGRAPHY]] | [Specific threat: e.g., "Alternative API", "Pricing pressure"] |
| [Name] | [...] | [...] |
| [Name] | [...] | [...] |

---

## ⚠️ PROVOCATION TARGETS

2 "Inside-Out" threats that directly challenge their tech stack or security posture:

1. **[Threat Name]**: [How this specifically threatens their [TECH_STACK] or [SECURITY_POSTURE]]
2. **[Threat Name]**: [How this specifically threatens their [GEOGRAPHY] or [STRATEGIC_PILLARS]]

---

**CRITICAL CONSTRAINTS:**
- Every query MUST reference a specific [TECH_STACK], [GEOGRAPHY], or [SECURITY] element.
- Do NOT produce generic queries. Use the few-shot examples as your quality bar.
- The output must be actionable for an agentic research team.
- Ground every insight in evidence from the source documents.
`;
}

/**
 * Generate Research Brief (Gap Analysis) using Pinecone RAG.
 * 
 * Enhanced with few-shot prompting and tech-stack grounding.
 * Output: A Research Mandate with Search API Payloads for agentic handoff.
 */
export async function generateBrief(workshopId: string) {
    console.log(`[ContextEngine] ========== Generating Research Scope for ${workshopId} ==========`);

    try {
        // 1. Query Pinecone for relevant chunks - focus on architecture, strategy, geography
        const query = "Analyze the enterprise architecture, technology stack, cloud providers, programming languages, geographic operations, compliance requirements, strategic priorities, operational friction, and innovation capabilities";
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

        // 3. Build the Strategic Scout Scoping Prompt (with few-shot exemplars)
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
