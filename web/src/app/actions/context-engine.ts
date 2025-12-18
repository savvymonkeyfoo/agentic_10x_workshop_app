'use server';

import { prisma } from '@/lib/prisma';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { revalidatePath } from 'next/cache';

/**
 * 2. Research Agent (Brief Generation)
 * Uses RAG to find gaps in the Client Backlog vs Market Signals (or generic knowledge).
 */
export async function generateBrief(workshopId: string) {
    try {
        // A. Retrieve Context
        // Fetch Ready Assets (Dossier & Backlog)
        const assets = await prisma.asset.findMany({
            where: {
                workshopId,
                status: 'READY',
                type: { in: ['DOSSIER', 'BACKLOG'] }
            },
            include: { chunks: true }
        });

        // Flatten chunks to plain text
        const contextText = assets
            .flatMap((asset: any) => asset.chunks)
            .map((chunk: any) => chunk.content)
            .join('\n\n')
            .slice(0, 30000); // Token limit safety (approx 30k chars)

        if (!contextText) {
            return { success: false, brief: "No client context found. Please upload a dossier or backlog first." };
        }

        // B. Generate Research Brief
        const prompt = `
      You are a Strategic Research Lead.
      Analyze the following Client Dossier & Backlog context:
      "${contextText}"

      Your Goal: Identify "Blind Spots" - areas where the client is missing opportunities compared to modern industry standards (AI, Automation, Cloud).
      
      CRITICAL INSTRUCTION: You MUST use the provided context chunks above to ground your analysis. Do NOT halluciation generic advice. Reference specific details from the context where possible.

      Output a structured "Research Brief" in Markdown:
      1. **Strategic Gaps**: 3 key areas missing from their backlog.
      2. **Competitor Recon**: Suggest 2 specific queries to research (e.g., "How is Competitor X using GenAI?").
      3. **Risk Warning**: One major risk in their current tech stack.

      Keep it concise and punchy.
    `;

        const { text } = await generateText({
            model: google('gemini-2.5-flash'),
            prompt,
        });

        // C. Save to WorkshopContext
        await prisma.workshopContext.upsert({
            where: { workshopId },
            update: { researchBrief: text },
            create: { workshopId, researchBrief: text }
        });

        revalidatePath(`/workshop/${workshopId}`);
        return { success: true, brief: text };

    } catch (error) {
        console.error("Brief Generation Error:", error);
        return { success: false, error: "Failed to generate brief." };
    }
}
