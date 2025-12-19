'use server';
import { generateObject } from 'ai';
import { AI_CONFIG } from '@/lib/ai-config';
import { z } from 'zod';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function recommendCapabilities(workflowContext: any) {
    try {
        if (!workflowContext) return { success: false, data: [] };

        const contextString = JSON.stringify(workflowContext, null, 2);

        const result = await generateObject({
            model: AI_CONFIG.generalModel,
            schema: z.object({
                capabilities: z.array(z.string()).describe("List of 10-15 enterprise software, APIs, or data systems.")
            }),
            prompt: `
        ROLE: Enterprise Solution Architect. 
        TASK: Analyze the following business workflow and recommend the specific technology stack required.

        WORKFLOW CONTEXT:
        ${contextString}

        INSTRUCTIONS:
        1. Identify 10-15 specific capabilities (Systems, Tools, APIs, Data Sources).
        2. Focus on "Enabling Technology" (e.g. "OCR Engine", "Salesforce", "Vector Database", "Mainframe Gateway").
        3. Be specific but standard (e.g. use "Identity Provider (IdP)" or "Okta", not just "Login").
        4. Return ONLY the list of strings.
      `
        });

        return { success: true, data: result.object.capabilities };
    } catch (error) {
        console.error("AI Recommendation Failed:", error);
        return { success: false, data: [] };
    }
}
