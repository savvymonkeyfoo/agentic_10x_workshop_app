import { Pinecone } from '@pinecone-database/pinecone';
import * as dotenv from 'dotenv';
import path from 'path';

// Load local environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testPineconeConnection() {
    console.log("🚀 Starting Pinecone Connection Test...");

    const apiKey = process.env.PINECONE_API_KEY;
    const indexName = process.env.PINECONE_INDEX_NAME;

    if (!apiKey || !indexName) {
        console.error("❌ Missing PINECONE_API_KEY or PINECONE_INDEX_NAME in .env.local");
        process.exit(1);
    }

    const pc = new Pinecone({ apiKey });
    const index = pc.index(indexName);

    const testNamespace = "test-verification-namespace";
    const testVectorId = "test-vector-001";

    try {
        // 1. Check Index Stats
        console.log(`--- Verifying Index: ${indexName} ---`);
        const stats = await index.describeIndexStats();
        console.log("✅ Connection Successful.");
        console.log(`📊 Index Dimensions: ${stats.dimension} (Expected: 768)`);

        if (stats.dimension !== 768) {
            console.warn("⚠️ WARNING: Index dimensions do not match the required 768 for Gemini.");
        }

        // 2. Test Upsert (768 Dimensions)
        console.log(`--- Testing Upsert in Namespace: ${testNamespace} ---`);
        const dummyVector = Array.from({ length: 768 }, () => Math.random());

        await index.namespace(testNamespace).upsert([{
            id: testVectorId,
            values: dummyVector,
            metadata: {
                test: true,
                timestamp: new Date().toISOString(),
                purpose: "verification"
            }
        }]);
        console.log("✅ Upsert Successful.");

        // 3. Test Retrieval
        console.log("--- Testing Vector Retrieval ---");
        const queryResponse = await index.namespace(testNamespace).query({
            id: testVectorId,
            topK: 1,
            includeMetadata: true
        });

        if (queryResponse.matches.length > 0) {
            console.log("✅ Retrieval Successful. Vector found in namespace.");
        } else {
            throw new Error("Vector upserted but not found during query.");
        }

        // 4. Cleanup
        console.log("--- Cleaning up test data ---");
        await index.namespace(testNamespace).deleteOne(testVectorId);
        console.log("✅ Cleanup Successful.");

        console.log("\n✨ PINECONE HYBRID BRIDGE VERIFIED: READY FOR RAG IMPLEMENTATION.");

    } catch (error) {
        console.error("❌ TEST FAILED:");
        console.error(error);
        process.exit(1);
    }
}

testPineconeConnection();
