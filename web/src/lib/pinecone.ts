import 'server-only'; // <--- FIREWALL ADDED

import { Pinecone } from '@pinecone-database/pinecone';

// Singleton pattern for Pinecone client to prevent connection exhaustion
let pineconeClient: Pinecone | null = null;

export function getPineconeClient(): Pinecone {
    if (!pineconeClient) {
        const apiKey = process.env.PINECONE_API_KEY;
        if (!apiKey) {
            throw new Error('PINECONE_API_KEY is not set in environment variables');
        }
        pineconeClient = new Pinecone({ apiKey });
    }
    return pineconeClient;
}

export function getWorkshopIndex() {
    const client = getPineconeClient();
    const indexName = process.env.PINECONE_INDEX_NAME || 'agentic-10x-workshop';
    return client.index(indexName);
}

export function getWorkshopNamespace(workshopId: string) {
    const index = getWorkshopIndex();
    return index.namespace(workshopId);
}
