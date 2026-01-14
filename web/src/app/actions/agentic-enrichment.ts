'use server';

import { generateText, generateObject } from 'ai';
import { z } from 'zod';
import { AI_CONFIG } from '@/lib/ai-config';
import { queryContext } from './context-engine';

// --- SCHEMAS ---

// Workflow Schema matching Frontend Interface
const WorkflowPhaseSchema = z.object({
    id: z.string().describe("Unique ID for the phase (e.g. 'phase-1')"),
    name: z.string().describe("Name of the phase (e.g. 'Ingestion', 'Processing')"),
    autonomy: z.enum(['L0', 'L1', 'L2', 'L3', 'L4', 'L5']).describe("Autonomy level"),
    inputs: z.string().describe("Data or trigger inputs"),
    actions: z.string().describe("Key actions performed in this phase"),
    outputs: z.string().describe("Deliverables or state changes"),
    guardrail: z.string().describe("Safety check or validation step")
});

const WorkflowResponseSchema = z.object({
    phases: z.array(WorkflowPhaseSchema)
});

// Analysis Schema
const AnalysisResponseSchema = z.object({
    frictionStatement: z.string(),
    strategyAlignment: z.string(),
    techAlignment: z.string(),
    impactedSystems: z.array(z.string()).describe("List of systems (e.g. 'CRM', 'Data Lake')")
});

const ValuePropResponseSchema = z.object({
    role: z.string().describe("The user role (e.g. 'Claims Adjuster')"),
    outcome: z.string().describe("What they want to achieve (e.g. 'auto-sort emails')"),
    solution: z.string().describe("The proposed solution (e.g. 'an AI Triage Bot')"),
    need: z.string().describe("The underlying need/benefit (e.g. 'I can focus on complex cases')")
});

// --- PROMPTS ---

const SYSTEM_PROMPT = `You are an expert Solutions Architect and Business Strategist.
Your goal is to enrich early-stage opportunities with high-fidelity technical and strategic details.
You have access to Enterprise Context (RAG). Use it to ground your responses in reality.`;

// --- ACTION ---

export type EnrichmentMode = 'ANALYSIS' | 'WORKFLOW' | 'EXECUTION' | 'BUSINESS_CASE' | 'VALUE_PROP';

export async function agenticEnrichment(
    workshopId: string,
    mode: EnrichmentMode,
    context: { title: string; description: string; currentData?: any }
) {
    try {
        console.log(`[AgenticEnrichment] Mode: ${mode} for "${context.title}"`);

        // 1. RAG Retrieval
        // We query Pinecone for relevant context based on the mode and title
        const query = `${context.title} ${context.description} ${mode}`;
        const retrieval = await queryContext(workshopId, query);
        const ragContext = retrieval.chunks.map(c => c.content).join('\n\n');

        // 2. Generation Logic
        switch (mode) {
            case 'ANALYSIS':
                return await generateAnalysis(ragContext, context);
            case 'WORKFLOW':
                return await generateWorkflow(ragContext, context);
            case 'EXECUTION':
                return await generateExecutionPlan(ragContext, context);
            case 'BUSINESS_CASE':
                return await generateBusinessCase(ragContext, context);
            case 'VALUE_PROP':
                return await generateValueProp(ragContext, context);
            default:
                throw new Error("Invalid Mode");
        }

    } catch (error) {
        console.error("[AgenticEnrichment] Error:", error);
        return { success: false, error: "AI Generation Failed" };
    }
}

// --- GENERATORS ---

async function generateAnalysis(ragContext: string, context: any) {
    const prompt = `
    Based on the Opportunity "${context.title}" and the Enterprise Context below, generate a technical and strategic analysis.
    
    CONTEXT:
    ${ragContext}
    
    OPPORTUNITY DESC:
    ${context.description}
    `;

    const { object } = await generateObject({
        model: AI_CONFIG.strategicModel,
        prompt,
        schema: AnalysisResponseSchema
    });

    return { success: true, type: 'json', data: object };
}

async function generateWorkflow(ragContext: string, context: any) {
    const prompt = `
    Design a logical 3-5 step workflow for the Opportunity "${context.title}".
    Use the Enterprise Context to identify likely systems and guardrails.
    
    CONTEXT:
    ${ragContext}
    
    OPPORTUNITY DESC:
    ${context.description}
    `;

    const { object } = await generateObject({
        model: AI_CONFIG.strategicModel,
        prompt,
        schema: WorkflowResponseSchema
    });

    return { success: true, type: 'json', data: object.phases };
}

async function generateExecutionPlan(ragContext: string, context: any) {
    const prompt = `
    Draft a high-level Execution Plan for "${context.title}".
    Include:
    - Key Milestones
    - Technical Dependencies
    - Risk Mitigation
    - Definition of Done
    
    Format as CLEAN MARKTOWN (headers, bullets). Keep it concise but professional.
    
    CONTEXT:
    ${ragContext}
    `;

    const { text } = await generateText({
        model: AI_CONFIG.strategicModel, // Use strategicModel for narrative
        prompt
    });

    return { success: true, type: 'markdown', data: text };
}

async function generateBusinessCase(ragContext: string, context: any) {
    const prompt = `
    Write a compelling Business Case for "${context.title}".
    Focus on:
    - The Problem (Friction)
    - The Solution (Value)
    - Expected ROI (Efficiency/Revenue)
    - Strategic Alignment
    
    Format as CLEAN MARKDOWN.
    
    CONTEXT:
    ${ragContext}
    `;

    const { text } = await generateText({
        model: AI_CONFIG.strategicModel, // Use strategicModel
        prompt
    });

    return { success: true, type: 'markdown', data: text };
}

async function generateValueProp(ragContext: string, context: any) {
    const prompt = `
    Generate a formatted Customer Value Proposition for "${context.title}" using the standard structure:
    "As a [Role], I want to [Outcome], with [Solution], so that [Need]."

    Focus on the primary user persona.
    
    CONTEXT:
    ${ragContext}
    
    OPPORTUNITY DESC:
    ${context.description}
    `;

    const { object } = await generateObject({
        model: AI_CONFIG.strategicModel,
        prompt,
        schema: ValuePropResponseSchema
    });

    return { success: true, type: 'json', data: object };
}
