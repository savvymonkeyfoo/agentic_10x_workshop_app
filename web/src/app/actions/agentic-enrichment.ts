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

// Execution Parameters Schema (6 fields)
const ExecutionParamsSchema = z.object({
    definitionOfDone: z.string().describe("Bullet list of success metrics and definition of done. Use '• ' prefix for each item."),
    keyDecisions: z.string().describe("Bullet list of key decisions like build vs buy. Use '• ' prefix for each item."),
    changeManagement: z.string().describe("Bullet list of change management considerations. Use '• ' prefix for each item."),
    trainingRequirements: z.string().describe("Bullet list of training requirements. Use '• ' prefix for each item."),
    aiOpsRequirements: z.string().describe("Bullet list of AI ops and infrastructure needs. Use '• ' prefix for each item."),
    systemGuardrails: z.string().describe("Bullet list of system guardrails and safety checks. Use '• ' prefix for each item.")
});

// Business Case Parameters Schema (structured estimates)
const BusinessCaseParamsSchema = z.object({
    // T-shirt sizing
    tShirtSize: z.enum(['XS', 'S', 'M', 'L', 'XL']).nullable().describe("Estimated T-shirt size based on complexity and effort. Null if uncertain."),

    // Estimated Benefits (null if no data to support)
    benefitRevenue: z.number().nullable().describe("Estimated annual revenue uplift in dollars. Null if uncertain."),
    benefitCostAvoidance: z.number().nullable().describe("Estimated annual cost avoidance in dollars. Null if uncertain."),
    benefitEfficiency: z.number().nullable().describe("Estimated hours saved per year. Null if uncertain."),
    benefitEstCost: z.number().nullable().describe("Estimated implementation cost in dollars. Null if uncertain."),

    // VRCC Scores (1-5, null if uncertain)
    scoreValue: z.number().min(1).max(5).nullable().describe("Value score 1-5. Based on benefit potential. Null if uncertain."),
    scoreRisk: z.number().min(1).max(5).nullable().describe("Risk score 1-5. Based on autonomy levels and integration complexity. Null if uncertain."),
    scoreCapability: z.number().min(1).max(5).nullable().describe("Capability score 1-5. Based on existing vs missing capabilities. Null if uncertain."),
    scoreComplexity: z.number().min(1).max(5).nullable().describe("Complexity score 1-5. Based on integration count and workflow phases. Null if uncertain."),

    // DFV Ratings (1-5 stars, null if uncertain)
    dfvDesirability: z.number().min(1).max(5).nullable().describe("Desirability rating 1-5. Is this wanted by users? Null if uncertain."),
    dfvFeasibility: z.number().min(1).max(5).nullable().describe("Feasibility rating 1-5. Can this be built? Null if uncertain."),
    dfvViability: z.number().min(1).max(5).nullable().describe("Viability rating 1-5. Is this sustainable for the business? Null if uncertain."),

    // DFV Justifications (optional)
    dfvDesirabilityNote: z.string().nullable().describe("Brief justification for desirability rating."),
    dfvFeasibilityNote: z.string().nullable().describe("Brief justification for feasibility rating."),
    dfvViabilityNote: z.string().nullable().describe("Brief justification for viability rating.")
});

// --- PROMPTS ---

const SYSTEM_PROMPT = `You are an expert Solutions Architect and Business Strategist.
Your goal is to enrich early-stage opportunities with high-fidelity technical and strategic details.
You have access to Enterprise Context (RAG). Use it to ground your responses in reality.`;

// --- ACTION ---

export type EnrichmentMode = 'ANALYSIS' | 'WORKFLOW' | 'EXECUTION' | 'EXECUTION_PARAMS' | 'BUSINESS_CASE' | 'VALUE_PROP';

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
            case 'EXECUTION_PARAMS':
                return await generateExecutionParams(ragContext, context);
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
    // 1. Generate the narrative markdown
    const narrativePrompt = `
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
        model: AI_CONFIG.strategicModel,
        prompt: narrativePrompt
    });

    // 2. Generate structured parameters
    const paramsPrompt = `
    Based on the Opportunity "${context.title}" and the available context, estimate the following parameters.

    CRITICAL RULES:
    - ONLY provide values you can confidently estimate from the context
    - Return null for ANY field you cannot confidently estimate
    - Do NOT invent or guess numbers without grounding
    - Base estimates on the workflow phases, integrations, and capabilities provided

    AVAILABLE DATA:
    - Title: ${context.title}
    - Description: ${context.description}
    - Workflow Phases: ${context.currentData?.workflowPhases?.length || 0} phases
    - Phase Details: ${context.currentData?.workflowPhases?.map((p: any) => `${p.name} (${p.autonomy})`).join(', ') || 'Not defined'}
    - Impacted Systems: ${context.currentData?.impactedSystems?.join(', ') || 'Not defined'}
    - Existing Capabilities: ${context.currentData?.capabilitiesExisting?.join(', ') || 'None listed'}
    - Missing Capabilities: ${context.currentData?.capabilitiesMissing?.join(', ') || 'None listed'}
    - Strategy Alignment: ${context.currentData?.strategyAlignment || 'Not defined'}
    - Tech Alignment: ${context.currentData?.techAlignment || 'Not defined'}
    
    ENTERPRISE CONTEXT:
    ${ragContext}

    ESTIMATION GUIDANCE:
    - T-shirt Size: XS (<1 week), S (1-2 weeks), M (1 month), L (2-3 months), XL (>3 months)
    - VRCC Scores: 1=Low, 3=Medium, 5=High
    - DFV: Consider user demand (D), technical feasibility (F), business sustainability (V)
    - Benefits: Only estimate if you have concrete data to support
    `;

    try {
        const { object: params } = await generateObject({
            model: AI_CONFIG.strategicModel,
            prompt: paramsPrompt,
            schema: BusinessCaseParamsSchema
        });

        return {
            success: true,
            type: 'business_case_full',
            data: text,
            params: params
        };
    } catch (error) {
        // If params generation fails, still return the markdown
        console.error("[AgenticEnrichment] Params generation failed:", error);
        return { success: true, type: 'markdown', data: text };
    }
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

async function generateExecutionParams(ragContext: string, context: any) {
    const prompt = `
    Based on the Opportunity "${context.title}" and the Enterprise Context below, generate execution parameters for implementation.

    IMPORTANT RULES:
    - ONLY include information you can reasonably infer from the context provided
    - DO NOT invent specific numbers, dates, or details that are not grounded in the data
    - If you cannot determine something with confidence, leave it brief or omit it
    - Use bullet format with "• " prefix for each item
    - Do NOT use markdown formatting (no **, ##, etc.)
    - Keep each field practical and actionable

    CONTEXT:
    ${ragContext}
    
    OPPORTUNITY DESCRIPTION:
    ${context.description}
    
    CURRENT DATA (if available):
    Title: ${context.title}
    Workflow Phases: ${context.currentData?.workflowPhases?.map((p: any) => p.name).join(', ') || 'Not defined'}
    Impacted Systems: ${context.currentData?.impactedSystems?.join(', ') || 'Not defined'}
    
    Generate practical execution parameters for each of the 6 fields:
    1. definitionOfDone - Success metrics and completion criteria
    2. keyDecisions - Build vs buy, technology choices
    3. changeManagement - Organizational change considerations
    4. trainingRequirements - Skills and training needs
    5. aiOpsRequirements - Infrastructure and operational needs
    6. systemGuardrails - Safety checks and limitations
    `;

    const { object } = await generateObject({
        model: AI_CONFIG.strategicModel,
        prompt,
        schema: ExecutionParamsSchema
    });

    return { success: true, type: 'json', data: object };
}
