import { Pinecone } from '@pinecone-database/pinecone';

// Singleton pattern for Pinecone client to prevent connection exhaustion
let pineconeClient: Pinecone | null = null;

/**
 * Get the singleton Pinecone client instance.
 * Uses PINECONE_API_KEY from environment.
 */
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

/**
 * Get the workshop index for vector operations.
 * Uses PINECONE_INDEX_NAME from environment (default: 'agentic-10x-workshop').
 */
export function getWorkshopIndex() {
    const client = getPineconeClient();
    const indexName = process.env.PINECONE_INDEX_NAME || 'agentic-10x-workshop';
    return client.index(indexName);
}

/**
 * Get a namespaced index for a specific workshop.
 * Namespaces isolate vectors by workshop for efficient querying.
 */
export function getWorkshopNamespace(workshopId: string) {
    const index = getWorkshopIndex();
    return index.namespace(workshopId);
}
