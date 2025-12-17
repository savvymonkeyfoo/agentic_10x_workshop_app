'use server';

import { prisma } from '@/lib/prisma';
import { put } from '@vercel/blob';
import pdf from 'pdf-parse';
import { google } from '@ai-sdk/google';
import { embedMany, generateText } from 'ai';
import { revalidatePath } from 'next/cache';

/**
 * 1. Upload & Vectorize Pipeline
 * Takes a file, persists it to Blob, extracts text, chunks it, embeds it, and saves to DB.
 */
export async function uploadContext(formData: FormData) {
    try {
        const file = formData.get('file') as File;
        const workshopId = formData.get('workshopId') as string;
        const category = formData.get('category') as string; // 'CLIENT_INTERNAL' | 'MARKET_EXTERNAL'

        if (!file || !workshopId || !category) {
            throw new Error('Missing required fields');
        }

        // A. Upload to Vercel Blob (The Archive)
        const blob = await put(file.name, file, {
            access: 'public',
        });

        // B. Parse Text (The ETL)
        // Convert File to Buffer for pdf-parse
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        let rawText = '';

        if (file.type === 'application/pdf') {
            const data = await pdf(buffer);
            rawText = data.text;
        } else {
            // Fallback for Markdown/Text
            rawText = buffer.toString('utf-8');
        }

        // C. Create Document Record
        const document = await prisma.workshopDocument.create({
            data: {
                workshopId,
                name: file.name,
                blobUrl: blob.url,
                category,
            },
        });

        // D. Chunking Strategy (1000 chars, 100 overlap)
        const chunkSize = 1000;
        const overlap = 100;
        const chunks: string[] = [];

        for (let i = 0; i < rawText.length; i += (chunkSize - overlap)) {
            chunks.push(rawText.slice(i, i + chunkSize));
        }

        // E. Embedding (The Brain) using Google text-embedding-004
        const { embeddings } = await embedMany({
            model: google.textEmbeddingModel('text-embedding-004'),
            values: chunks,
        });

        // F. Transactional Storage (Vectors as Float[])
        // We store them in bulk.
        await prisma.$transaction(
            chunks.map((content, index) =>
                prisma.documentChunk.create({
                    data: {
                        documentId: document.id,
                        content,
                        chunkIndex: index,
                        embedding: embeddings[index], // Stored as Float[] (Postgres Array)
                    },
                })
            )
        );

        revalidatePath(`/workshop/${workshopId}`);
        return { success: true, documentId: document.id, chunksProcessed: chunks.length };

    } catch (error) {
        console.error("Context Engine Error:", error);
        return { success: false, error: "Failed to process context." };
    }
}

/**
 * 2. Research Agent (Brief Generation)
 * Uses RAG to find gaps in the Client Backlog vs Market Signals (or generic knowledge).
 */
export async function generateBrief(workshopId: string) {
    try {
        // A. Retrieve Context
        // For now, we fetch ALL CLIENT_INTERNAL chunks. 
        // In a real huge app, we'd limit this or do a similarity search against a "strategy" query.
        const internalDocs = await prisma.workshopDocument.findMany({
            where: { workshopId, category: 'CLIENT_INTERNAL' },
            include: { chunks: true }
        });

        // Flatten chunks to plain text
        const contextText = internalDocs
            .flatMap(doc => doc.chunks)
            .map(chunk => chunk.content)
            .join('\n\n')
            .slice(0, 30000); // Token limit safety (approx 30k chars)

        if (!contextText) {
            return { success: false, brief: "No client context found. Please upload a dossier first." };
        }

        // B. Generate Research Brief
        const prompt = `
      You are a Strategic Research Lead.
      Analyze the following Client Dossier & Backlog context:
      "${contextText}"

      Your Goal: Identify "Blind Spots" - areas where the client is missing opportunities compared to modern industry standards (AI, Automation, Cloud).
      
      Output a structured "Research Brief" in Markdown:
      1. **Strategic Gaps**: 3 key areas missing from their backlog.
      2. **Competitor Recon**: Suggest 2 specific queries to research (e.g., "How is Competitor X using GenAI?").
      3. **Risk Warning**: One major risk in their current tech stack.

      Keep it concise and punchy.
    `;

        const { text } = await generateText({
            model: google('gemini-1.5-pro'),
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
