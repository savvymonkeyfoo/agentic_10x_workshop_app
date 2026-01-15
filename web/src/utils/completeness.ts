interface OpportunityForCompleteness {
    projectName?: string;
    frictionStatement?: string;
    workflowPhases?: unknown[];
    definitionOfDone?: string;
    keyDecisions?: string;
    benefitRevenue?: number | null;
    benefitCostAvoidance?: number | null;
    benefitEfficiency?: number | null;
    dfvAssessment?: {
        desirability?: { score?: number };
        feasibility?: { score?: number };
        viability?: { score?: number };
    } | null;
}

export function calculateCompleteness(opportunity: OpportunityForCompleteness | null | undefined) {
    // 1. Safety Check: Handle null/undefined gracefully
    if (!opportunity) return { total: 0, tabs: { opportunity: false, workflow: false, execution: false, businessCase: false } };

    // --- TAB 1: OPPORTUNITY (25%) ---
    // Must have a real name (not just empty string) and a friction statement
    const hasOpportunity =
        (opportunity.projectName && opportunity.projectName.trim().length > 2) &&
        (opportunity.frictionStatement && opportunity.frictionStatement.trim().length > 2);

    // --- TAB 2: WORKFLOW (25%) ---
    // Must have at least one defined phase in the array
    const phases = opportunity.workflowPhases;
    const hasWorkflow = Array.isArray(phases) && phases.length > 0;

    // --- TAB 3: EXECUTION (25%) ---
    // Must have Definition of Done AND Key Decisions
    const hasExecution =
        (opportunity.definitionOfDone && opportunity.definitionOfDone.trim().length > 0) &&
        (opportunity.keyDecisions && opportunity.keyDecisions.trim().length > 0);

    // --- TAB 4: BUSINESS CASE (25%) ---
    // Must have Financials OR Strategic Scores

    // Financials: Check for ANY defined numeric impact (0 is a valid "No Impact" assessment)
    const hasFinancials =
        (opportunity.benefitRevenue !== undefined && opportunity.benefitRevenue !== null) ||
        (opportunity.benefitCostAvoidance !== undefined && opportunity.benefitCostAvoidance !== null) ||
        (opportunity.benefitEfficiency !== undefined && opportunity.benefitEfficiency !== null);

    // DFV: Check if assessment exists and has scores (1-5, so >0 check is generally correct, but safe to just check existence)
    const hasDFV = opportunity.dfvAssessment && (
        (opportunity.dfvAssessment.desirability?.score ?? 0) > 0 ||
        (opportunity.dfvAssessment.feasibility?.score ?? 0) > 0 ||
        (opportunity.dfvAssessment.viability?.score ?? 0) > 0
    );

    const hasBusinessCase = hasFinancials || hasDFV;

    // --- TOTAL CALCULATION ---
    let score = 0;
    if (hasOpportunity) score += 25;
    if (hasWorkflow) score += 25;
    if (hasExecution) score += 25;
    if (hasBusinessCase) score += 25;

    // Return Boolean states for UI indicators (Green Dots)
    return {
        total: score,
        tabs: {
            opportunity: Boolean(hasOpportunity),
            workflow: Boolean(hasWorkflow),
            execution: Boolean(hasExecution),
            businessCase: Boolean(hasBusinessCase)
        }
    };
}
