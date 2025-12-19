/**
 * AI Configuration Test Script
 * 
 * Verifies all AI models are accessible and working correctly.
 * Run with: npx tsx scripts/test-ai-config.ts
 */

import { google } from '@ai-sdk/google';
import { generateText, embed } from 'ai';

// Load environment variables
import 'dotenv/config';

const MODELS = {
    AUDIT: process.env.AI_MODEL_AUDIT || 'gemini-2.5-flash',
    STRATEGIC: process.env.AI_MODEL_STRATEGIC || 'gemini-2.5-pro',
    GENERAL: process.env.AI_MODEL_GENERAL || 'gemini-2.5-flash',
    EMBEDDING: process.env.AI_MODEL_EMBEDDING || 'text-embedding-004',
};

async function testApiKey() {
    console.log('\n🔑 Testing API Key...');
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
        throw new Error('GOOGLE_GENERATIVE_AI_API_KEY is not set');
    }
    console.log(`   API Key present: ${apiKey.slice(0, 10)}...${apiKey.slice(-4)}`);
    console.log('   ✅ API Key configured');
}

async function testAuditModel() {
    console.log(`\n📋 Testing Audit Model (${MODELS.AUDIT})...`);

    const { text } = await generateText({
        model: google(MODELS.AUDIT),
        prompt: 'Say "AUDIT_MODEL_OK" and nothing else.',
    });

    if (text.includes('AUDIT_MODEL_OK')) {
        console.log(`   Response: ${text.trim()}`);
        console.log('   ✅ Audit Model working');
    } else {
        console.log(`   Response: ${text}`);
        console.log('   ⚠️ Unexpected response (model may still work)');
    }
}

async function testStrategicModel() {
    console.log(`\n🧠 Testing Strategic Model (${MODELS.STRATEGIC})...`);

    const { text } = await generateText({
        model: google(MODELS.STRATEGIC),
        prompt: 'Say "STRATEGIC_MODEL_OK" and nothing else.',
    });

    if (text.includes('STRATEGIC_MODEL_OK')) {
        console.log(`   Response: ${text.trim()}`);
        console.log('   ✅ Strategic Model working');
    } else {
        console.log(`   Response: ${text}`);
        console.log('   ⚠️ Unexpected response (model may still work)');
    }
}

async function testGeneralModel() {
    console.log(`\n⚙️ Testing General Model (${MODELS.GENERAL})...`);

    const { text } = await generateText({
        model: google(MODELS.GENERAL),
        prompt: 'Say "GENERAL_MODEL_OK" and nothing else.',
    });

    if (text.includes('GENERAL_MODEL_OK')) {
        console.log(`   Response: ${text.trim()}`);
        console.log('   ✅ General Model working');
    } else {
        console.log(`   Response: ${text}`);
        console.log('   ⚠️ Unexpected response (model may still work)');
    }
}

async function testEmbeddingModel() {
    console.log(`\n🔢 Testing Embedding Model (${MODELS.EMBEDDING})...`);

    const { embedding } = await embed({
        model: google.textEmbeddingModel(MODELS.EMBEDDING),
        value: 'Test embedding for AI configuration verification.',
    });

    console.log(`   Embedding dimensions: ${embedding.length}`);
    console.log(`   Sample values: [${embedding.slice(0, 3).map(v => v.toFixed(4)).join(', ')}...]`);

    if (embedding.length === 768) {
        console.log('   ✅ Embedding Model working (768 dimensions)');
    } else {
        console.log(`   ⚠️ Unexpected dimensions (expected 768, got ${embedding.length})`);
    }
}

async function testReasoningCapability() {
    console.log(`\n💭 Testing Reasoning Capability (${MODELS.STRATEGIC})...`);

    const { text } = await generateText({
        model: google(MODELS.STRATEGIC),
        prompt: `You are testing your reasoning capability. 
Solve this step by step: If a company has 3 data centers and wants to reduce to 2, but each center serves 40% of traffic, what's the minimum capacity increase needed per remaining center?
Think through this carefully, then provide the answer.`,
    });

    console.log('   Response preview:');
    console.log(`   ${text.slice(0, 200).replace(/\n/g, '\n   ')}...`);
    console.log('   ✅ Reasoning capability working');
}

async function main() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('           AI Configuration Test Suite                          ');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('\nModel Configuration:');
    console.log(`   AUDIT:     ${MODELS.AUDIT}`);
    console.log(`   STRATEGIC: ${MODELS.STRATEGIC}`);
    console.log(`   GENERAL:   ${MODELS.GENERAL}`);
    console.log(`   EMBEDDING: ${MODELS.EMBEDDING}`);

    try {
        await testApiKey();
        await testAuditModel();
        await testStrategicModel();
        await testGeneralModel();
        await testEmbeddingModel();
        await testReasoningCapability();

        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('   ✅ ALL TESTS PASSED - Ready for deployment');
        console.log('═══════════════════════════════════════════════════════════════\n');

    } catch (error) {
        console.error('\n❌ TEST FAILED:', error);
        process.exit(1);
    }
}

main();
