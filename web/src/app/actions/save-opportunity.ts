'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

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
        riskOverrideLog: data.vrcc.riskOverrideLog || "",

        tShirtSize: data.tShirtSize || "M",

        // Financials - Ensure numbers or null/undefined if empty
        benefitRevenue: data.benefitRevenue ? Number(data.benefitRevenue) : null,
        benefitCostAvoidance: data.benefitCostAvoidance ? Number(data.benefitCostAvoidance) : null,
        benefitEstCost: data.benefitEstCost ? Number(data.benefitEstCost) : null,
        benefitEfficiency: data.benefitEfficiency ? Number(data.benefitEfficiency) : null,
        benefitTimeframe: data.benefitTimeframe || 'Monthly',

        // DFV Assessment (JSON)
        dfvAssessment: data.dfvAssessment || null,

        definitionOfDone: data.definitionOfDone || "",
        keyDecisions: data.keyDecisions || "",
        impactedSystems: Array.isArray(data.impactedSystems) ? data.impactedSystems : [],
        systemGuardrails: data.systemGuardrails || "",
        aiOpsRequirements: data.aiOpsRequirements || "",
        changeManagement: data.changeManagement || "",
        trainingRequirements: data.trainingRequirements || "",

        // Capability Mapping
        capabilitiesExisting: Array.isArray(data.capabilitiesExisting) ? data.capabilitiesExisting : [],
        capabilitiesMissing: Array.isArray(data.capabilitiesMissing) ? data.capabilitiesMissing : []
    };

    let result;

    if (opportunityId) {
        // Upsert: Update if exists, otherwise create with the SAME ID (restoring it)
        result = await prisma.opportunity.upsert({
            where: { id: opportunityId },
            update: opportunityData,
            create: {
                ...opportunityData,
                id: opportunityId // Force specific ID to keep client sync
            }
        });
    } else {
        // Create new (DB generates ID)
        result = await prisma.opportunity.create({
            data: opportunityData
        });
    }

    revalidatePath(`/workshop/${workshopId}`);

    // Return ID and success, do NOT redirect here (client handles navigation or autosave state)
    return { success: true, id: result.id };
}
