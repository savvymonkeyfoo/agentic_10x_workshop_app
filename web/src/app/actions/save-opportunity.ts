'use server';

import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

export async function saveOpportunity(workshopId: string, data: any, opportunityId?: string) {
    if (!workshopId) throw new Error("Workshop ID required");

    // Common data mapping
    const opportunityData = {
        workshopId,
        projectName: data.projectName || "Untitled Opportunity",
        frictionStatement: data.frictionStatement || "",
        strategicHorizon: data.strategicHorizon || "OPS",
        whyDoIt: data.whyDoIt || "",

        // New Workflow Data
        workflowPhases: data.workflowPhases || [],
        // Removed agentDirective

        scoreValue: Number(data.vrcc.value),
        scoreCapability: Number(data.vrcc.capability),
        scoreComplexity: Number(data.vrcc.complexity),
        scoreRiskFinal: Number(data.vrcc.riskFinal),
        scoreRiskAI: Number(data.vrcc.riskAI),

        tShirtSize: data.tShirtSize || "M",

        // Financials - Ensure numbers or null/undefined if empty
        benefitRevenue: data.benefitRevenue ? Number(data.benefitRevenue) : null,
        benefitCost: data.benefitCost ? Number(data.benefitCost) : null,
        benefitEfficiency: data.benefitEfficiency ? Number(data.benefitEfficiency) : null,

        dfvDesirability: data.dfvDesirability || "TBD",
        dfvFeasibility: data.dfvFeasibility || "TBD",
        dfvViability: data.dfvViability || "TBD",

        definitionOfDone: data.definitionOfDone || "",
        keyDecisions: data.keyDecisions || "",
        impactedSystems: Array.isArray(data.impactedSystems) ? data.impactedSystems : [],

        // Capability Mapping
        capabilitiesExisting: Array.isArray(data.capabilitiesExisting) ? data.capabilitiesExisting : [],
        capabilitiesMissing: Array.isArray(data.capabilitiesMissing) ? data.capabilitiesMissing : []
    };

    let result;

    if (opportunityId) {
        // Update existing
        result = await prisma.opportunity.update({
            where: { id: opportunityId },
            data: opportunityData
        });
    } else {
        // Create new
        result = await prisma.opportunity.create({
            data: {
                ...opportunityData,
                // Ensure required strings are present if they weren't in opportunityData (they are)
            }
        });
    }

    revalidatePath(`/workshop/${workshopId}`);

    // Return ID and success, do NOT redirect here (client handles navigation or autosave state)
    return { success: true, id: result.id };
}
