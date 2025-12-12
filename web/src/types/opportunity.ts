export interface Opportunity {
    id: string;
    projectName: string;
    strategicHorizon: string | null;
    frictionStatement: string | null;
    whyDoIt: string;
    strategicRationale: string | null;
    
    scoreValue: number;
    scoreComplexity: number;
    scoreCapability: number;
    scoreRiskFinal: number;
    
    benefitRevenue: number | null;
    benefitCostAvoidance: number | null;
    benefitEfficiency: number | null;
    tShirtSize: string;
    
    dfvAssessment: any; // Json
    workflowPhases: any; // Json
    
    definitionOfDone: string;
    keyDecisions: string;
    systemGuardrails: string | null;
    
    capabilitiesMissing: string[];
    capabilitiesExisting: string[];
    
    canvasLastGeneratedAt: Date | null;
}
