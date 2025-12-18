import { prisma } from '@/lib/prisma';
import { google } from '@ai-sdk/google';
import { embedMany } from 'ai';
import { NextResponse } from 'next/server';
const pdf = require('pdf-parse');

// Use Node.js runtime because pdf-parse relies on Buffer/fs which are not fully supported in Edge
// Increase maxDuration to prevent timeouts for large PDFs
export const maxDuration = 60;
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const { assetId } = await request.json();

        if (!assetId) {
            return NextResponse.json({ error: 'Asset ID required' }, { status: 400 });
        }

        const asset = await prisma.asset.findUnique({
            where: { id: assetId }
        });

        if (!asset) {
            return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
        }

        // 1. Fetch File
        const response = await fetch(asset.url);
        if (!response.ok) {
            throw new Error(`Failed to fetch file: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // 2. Parse Text
        let rawText = '';
        if (asset.name.toLowerCase().endsWith('.pdf')) {
            const data = await pdf(buffer);
            rawText = data.text;
        } else {
            rawText = buffer.toString('utf-8');
        }

        // 3. Chunking
        const chunkSize = 1000;
        const overlap = 100;
        const chunks: string[] = [];

        for (let i = 0; i < rawText.length; i += (chunkSize - overlap)) {
            chunks.push(rawText.slice(i, i + chunkSize));
        }

        // 4. Embedding
        // Note: Check if chunks exist to avoid empty embedding error
        if (chunks.length > 0) {
            const { embeddings } = await embedMany({
                model: google.textEmbeddingModel('text-embedding-004'),
                values: chunks,
            });

            // 5. Store Chunks
            await prisma.$transaction(
                chunks.map((content, index) =>
                    prisma.documentChunk.create({
                        data: {
                            assetId: asset.id,
                            content,
                            chunkIndex: index,
                            embedding: embeddings[index],
                        },
                    })
                )
            );
        }

        // 6. Update Status
        await prisma.asset.update({
            where: { id: assetId },
            data: { status: 'READY' }
        });

        return NextResponse.json({ success: true, chunksProcessed: chunks.length });

    } catch (error) {
        console.error("RAG Indexing Error:", error);

        // Update status to ERROR so UI knows
        // Need to parse ID again or pass it down, but for now simple error return
        // Ideally we'd update the asset status here if we have reference

        return NextResponse.json({ error: 'Indexing failed' }, { status: 500 });
    }
}
