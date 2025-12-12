'use server';
import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';

export async function optimizeCanvasContent(data: any) {
    try {
        const result = await generateObject({
            model: google('gemini-1.5-pro-latest'),
            schema: z.object({
                friction: z.string().describe("Punchy 1-2 sentence problem statement. No 'The problem is...' prefixes."),
                rationale: z.string().describe("1 concise strategic justification paragraph."),
                valueProposition: z.string().describe("A clean 'As a X, I want Y, So that Z' statement."),
                risks: z.string().describe("3 critical bullet points. Must be specific to the domain."),
                solution: z.string().describe("1 sentence solution summary."),
            }),
            prompt: `
        ROLE: Chief Editor for a Strategy Consulting Firm.
        TASK: Rewrite and polish the draft content for an Executive Canvas.

        INPUT CONTEXT:
        - Project: "${data.projectName}" (${data.strategicHorizon})
        - Draft Friction: "${data.frictionStatement}"
        - Draft Rationale: "${data.strategicRationale} - ${data.whyDoIt}"
        - Draft Risks: "${data.systemGuardrails}"
        - Raw Workflow: ${JSON.stringify(data.workflowPhases || [])}

        STRICT EDITORIAL RULES:
        1. NO HALLUCINATIONS: Do NOT use placeholders like "Lazarus", "Lorem Ipsum", or "Insert Text Here". If input is missing, INFER reasonable content based on the Project Name.
        2. NO REPETITION: Fix grammar. Never say "As a As a". Ensure "As a [Role]" flows naturally.
        3. NO INTERNAL MONOLOGUE: Do NOT include text like "(Previous logic...)" or "I think we should...". Output ONLY the final client-facing text.
        4. RISKS: If the input risk list is empty or generic, GENERATE 3 specific, realistic business risks for this type of AI project (e.g. Hallucination, Data Privacy, Adoption).
        5. TONE: Professional, high-stakes, executive summary style.
        6. VALUE PROP: Ensure it fits the "As a..., I want..., So that..." format precisely.
      `
        });
        return { success: true, data: result.object };
    } catch (error) {
        console.error("Optimization Failed:", error);
        return { success: false, data: null };
    }
}
