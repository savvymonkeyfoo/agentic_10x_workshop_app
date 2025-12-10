import { OpportunityState } from '@/types/workshop';

/**
 * Calculates the completeness of the Opportunity based on strict "25% per Tab" logic.
 * 
 * Rules:
 * - Opportunity (Tab A) [25%]: Project Name (>2 chars) AND Friction Statement (>2 chars).
 * - The Workflow (Tab B) [25%]: At least one workflow phase defined.
 * - Execution (Tab C) [25%]: Definition of Done (>2 chars) AND Key Decisions (>2 chars).
 * - Business Case (Tab D) [25%]: DFV Assessment has any non-zero score OR Revenue > 0.
 */

export interface CompletenessStatus {
    total: number;
    tabs: {
        opportunity: boolean;
        workflow: boolean;
        execution: boolean;
        businessCase: boolean;
    }
}

export function calculateCompleteness(data: OpportunityState): CompletenessStatus {
    const tabs = {
        opportunity: false,
        workflow: false,
        execution: false,
        businessCase: false
    };

    // 1. Opportunity Tab Validation (Strict)
    if (
        (data.projectName || "").trim().length > 2 &&
        (data.frictionStatement || "").trim().length > 2
    ) {
        tabs.opportunity = true;
    }

    // 2. Workflow Tab Validation
    if (data.workflowPhases && data.workflowPhases.length > 0) {
        tabs.workflow = true;
    }

    // 3. Execution Tab Validation (Strict)
    // Must have Definition of Done AND Key Decisions
    if (
        (data.definitionOfDone || "").trim().length > 2 &&
        (data.keyDecisions || "").trim().length > 2
    ) {
        tabs.execution = true;
    }

    // 4. Business Case Validation
    // Check DFV (Desirability + Feasibility + Viability) > 0 OR Financial Benefit
    // Note: DFV object should always exist in state, but scores might be 0
    const hasStars = data.dfvAssessment && (
        data.dfvAssessment.desirability.score > 0 ||
        data.dfvAssessment.feasibility.score > 0 ||
        data.dfvAssessment.viability.score > 0
    );

    const hasRevenue = (data.benefitRevenue || 0) > 0;

    if (hasStars || hasRevenue) {
        tabs.businessCase = true;
    }

    // Calculate Total Percentage
    let score = 0;
    if (tabs.opportunity) score += 25;
    if (tabs.workflow) score += 25;
    if (tabs.execution) score += 25;
    if (tabs.businessCase) score += 25;

    return {
        total: score,
        tabs
    };
}
