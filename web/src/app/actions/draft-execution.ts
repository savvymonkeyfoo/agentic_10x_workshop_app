'use server';
import { generateObject } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

const google = createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY,
});
import { z } from 'zod';

export async function draftExecutionPlan(context: any) {
    try {
        // 1. GROUNDING CHECK: Is there actually enough data to generate a plan?
        const hasWorkflow = context.phases && Array.isArray(context.phases) && context.phases.length > 0;
        const hasGoal = context.friction && context.friction.length > 5;

        // If no context exists, return "Holding Pattern" text instead of hallucinations.
        if (!hasWorkflow && !hasGoal) {
            return {
                success: true,
                data: {
                    definitionOfDone: "• Pending workflow definition.\n• Please define the 'Workflow' and 'Opportunity' tabs first.",
                    keyDecisions: "• Pending scope definition.",
                    changeManagement: "• Pending stakeholder identification.",
                    trainingRequirements: "• Pending capability assessment.",
                    aiOpsRequirements: "• Pending technical scope.",
                    systemGuardrails: "• Pending risk profile."
                }
            };
        }

        // 2. GENERATION: Run the Executive Strategist Persona
        const result = await generateObject({
            model: google('gemini-2.5-flash'),
            schema: z.object({
                definitionOfDone: z.string().describe("Bulleted list of business-critical success metrics (e.g. Accuracy, Adoption, Speed)."),
                keyDecisions: z.string().describe("Bulleted list of high-level strategic trade-offs (e.g. Build vs Buy, Compliance Strategy)."),
                changeManagement: z.string().describe("Bulleted list of cultural and process impacts on staff."),
                trainingRequirements: z.string().describe("Bulleted list of upskilling needs for business users (not engineers)."),
                aiOpsRequirements: z.string().describe("Bulleted list of ongoing operational costs/risks (e.g. Human-in-the-loop, Token Costs)."),
                systemGuardrails: z.string().describe("Bulleted list of brand safety, compliance, and hallucination controls."),
            }),
            prompt: `
        ROLE: Chief Strategy Officer / Executive Business Consultant.
        TARGET AUDIENCE: The Investment Board and Non-Technical Stakeholders.
        
        TASK: Draft a high-level Execution Strategy for this AI Opportunity.

        INPUT CONTEXT:
        - Opportunity Name: "${context.name}"
        - Problem/Goal: "${context.friction}"
        - Strategic Horizon: "${context.strategy}"
        - Estimated Benefit: $${context.revenue} Revenue / $${context.costAvoidance} Cost Avoidance
        - Proposed Workflow: ${JSON.stringify(context.phases)}

        STRICT RULES:
        1. GROUNDING: Do NOT invent features. If the workflow says "Email Triage", do NOT invent a "Mobile App".
        2. TONE: High-Level Business Strategy. 
           - BAD: "Implement CI/CD pipelines with Terraform and Kubernetes."
           - GOOD: "Ensure robust audit trails and automated deployment governance."
           - BAD: "Use Python 3.9 and PyTorch."
           - GOOD: "Leverage enterprise-grade, supported AI frameworks."
        3. CONTENT GUIDANCE:
           - 'Definition of Done': Focus on Business Value (e.g. "Reduction in processing time by 50%"), not code coverage.
           - 'System Guardrails': Focus on Brand Reputation, GDPR/Privacy, and Financial Risk.
           - 'AI Ops': Focus on "Cost of Ownership" and "Human Oversight", not server specs.
        4. FORMATTING: Return clean bullet points (start with •).
      `
        });

        return { success: true, data: result.object };

    } catch (error) {
        console.error("Draft Execution Failed:", error);
        return { success: false, data: null };
    }
}
