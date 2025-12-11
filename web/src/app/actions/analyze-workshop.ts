'use server';

import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function analyzeWorkshop(workshopId: string) {
    try {
        // 1. Fetch RICH Data (Now including Risk, Horizon, and Description)
        const opportunities = await prisma.opportunity.findMany({
            where: { workshopId },
            select: {
                id: true,
                projectName: true,
                frictionStatement: true, // Context is key
                scoreValue: true,
                scoreComplexity: true,
                scoreRiskFinal: true, // CRITICAL for Staircasing
                strategicHorizon: true,
                capabilitiesMissing: true,
                capabilitiesExisting: true
            }
        });

        if (opportunities.length === 0) {
            throw new Error("No opportunities to analyze.");
        }

        // 2. Format as a 'Strategic Dossier'
        const context = opportunities.map((o: typeof opportunities[number]) =>
            `PROJECT: ${o.projectName} (ID: ${o.id})
- GOAL: ${o.frictionStatement || 'Not specified'}
- STATS: Value=${o.scoreValue}/5, Complexity=${o.scoreComplexity}/5, RISK=${o.scoreRiskFinal}/5
- HORIZON: ${o.strategicHorizon || 'Unassigned'}
- NEEDS: [${(o.capabilitiesMissing || []).join(', ') || 'None'}]
- HAS: [${(o.capabilitiesExisting || []).join(', ') || 'None'}]`
        ).join('\n\n');

        console.log("[Analyze] Strategic Dossier:\n", context);

        // 3. The 'Council of Agents' Prompt
        const { object } = await generateObject({
            model: google('gemini-2.5-flash'),
            schema: z.object({
                strategy: z.object({
                    // Force the model to output 'thinking steps' first (Chain of Thought)
                    dependency_analysis: z.string().describe("Identify which projects build capabilities that others need."),
                    risk_analysis: z.string().describe("Identify High-Risk projects that share capabilities with Low-Risk projects."),
                    final_narrative: z.string().describe("The executive summary of the strategy in 2-3 sentences."),
                    sequence: z.array(z.object({
                        id: z.string().describe("The exact project ID from the input."),
                        rank: z.number().describe("Execution order starting from 1."),
                        rationale: z.string().describe("Brief reason for this position.")
                    }))
                })
            }),
            prompt: `You are a Board-Level Strategic Advisor presenting to C-Suite executives. Review these projects and determine the optimal execution sequence using structured risk management principles.

DATA DOSSIER:
${context}

PROTOCOL (ANALYZE STEP-BY-STEP):

1. DEPENDENCY ANALYSIS: Identify semantic overlaps in capabilities. If Project A requires 'Data Extraction' and Project B develops 'Document Processing', they share a dependency chain.

2. RISK MITIGATION: Apply the 'Risk Staircase' principle. High-Risk projects (Risk > 3) should NEVER precede Lower-Risk projects that share the same capabilities. The lower-risk initiative serves as the validation pilot.

3. STRATEGIC SEQUENCING:
   - Rank 1: Foundation Enablers (Low Risk projects that build capabilities required by others).
   - Rank 2: High-Value Accelerators (Projects that leverage newly validated capabilities).
   - Rank 3+: Parallel Quick Wins (High Value / Low Complexity projects that are independent. Note: These can often execute in parallel with Rank 1 if resources permit).
   - Final Priority: Strategic Deprioritization (High Effort / Low Yield initiatives requiring further justification).

TONE: Use professional, board-ready language. Avoid informal terms. Use precise business terminology.

CRITICAL: You MUST return exactly ${opportunities.length} items in the sequence array. Use the EXACT IDs from the data dossier.`
        });

        console.log("[Analyze] AI Response:", JSON.stringify(object, null, 2));

        // 4. Update Database (Sequential to prevent race conditions)
        for (const item of object.strategy.sequence) {
            console.log(`[Analyze] Updating ${item.id} to rank ${item.rank}`);
            await prisma.opportunity.update({
                where: { id: item.id },
                data: {
                    sequenceRank: item.rank,
                    strategicRationale: item.rationale
                }
            });
        }

        revalidatePath(`/workshop/${workshopId}/analysis`);

        // 5. Enrich with project names for UI
        const enrichedSequence = object.strategy.sequence.map(s => {
            const op = opportunities.find((o: typeof opportunities[number]) => o.id === s.id);
            return {
                id: s.id,
                rank: s.rank,
                rationale: s.rationale,
                projectName: op?.projectName || "Unknown"
            };
        });

        // Return the full analysis
        return {
            narrative: object.strategy.final_narrative,
            dependencyAnalysis: object.strategy.dependency_analysis,
            riskAnalysis: object.strategy.risk_analysis,
            sequence: enrichedSequence
        };

    } catch (error) {
        console.error("[Analyze] Failure:", error);
        throw new Error("Strategy Engine Failed. Check server logs.");
    }
}
