import { DFVAssessment } from '@/components/ui/DFVAssessmentInput';

export interface WorkflowPhase {
    id: string; // purely for UI key
    name: string;
    autonomy: 'L0' | 'L1' | 'L2' | 'L3' | 'L4' | 'L5';
    inputs?: string;
    actions?: string;
    outputs?: string;
    guardrail?: string;
}

export interface OpportunityState {
    // Tab A
    projectName: string;
    frictionStatement: string;
    strategicHorizon: string[]; // Changed to array for multi-select, will join on save
    whyDoIt: string; // Stored concatenated string

    // Tab B (Refactored)
    workflowPhases: WorkflowPhase[];
    capabilitiesExisting: string[];
    capabilitiesMissing: string[];

    // Tab C (Execution)
    definitionOfDone: string;
    keyDecisions: string;
    impactedSystems: string[];
    systemGuardrails: string;
    aiOpsRequirements: string;
    changeManagement: string;
    trainingRequirements: string;

    // Tab D (Business Case)
    vrcc: {
        value: number;
        capability: number;
        complexity: number;
        riskFinal: number;
        riskAI: number;
        riskOverrideLog: string;
    };
    tShirtSize: 'XS' | 'S' | 'M' | 'L' | 'XL';
    benefitRevenue: number | undefined;
    benefitCostAvoidance: number | undefined; // was benefitCost
    benefitEstCost: number | undefined; // new Implementation Cost
    benefitEfficiency: number | undefined;
    benefitTimeframe: 'Monthly' | 'Annually';
    dfvAssessment: DFVAssessment;
}
