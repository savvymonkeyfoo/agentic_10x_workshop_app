import { DEFAULT_DFV_ASSESSMENT } from '@/components/ui/DFVAssessmentInput';
import { OpportunityState } from '@/types/workshop';

// --- Initial State (Mirroring Schema) ---
export const INITIAL_STATE: OpportunityState = {
    projectName: '',
    description: '',
    notes: '',
    frictionStatement: '',
    strategicHorizon: [],
    whyDoIt: '',
    workflowPhases: [],
    capabilitiesExisting: [],
    capabilitiesMissing: [],
    vrcc: {
        value: 3,
        capability: 3,
        complexity: 3,
        riskFinal: 3,
        riskAI: 0,
        riskOverrideLog: '',
    },
    tShirtSize: 'M',
    benefitRevenue: undefined,
    benefitCostAvoidance: undefined,
    benefitEstCost: undefined,
    benefitEfficiency: undefined,
    benefitTimeframe: 'Monthly',
    dfvAssessment: DEFAULT_DFV_ASSESSMENT,
    definitionOfDone: '',
    keyDecisions: '',
    impactedSystems: [],
    systemGuardrails: '',
    aiOpsRequirements: '',
    changeManagement: '',
    trainingRequirements: '',
    businessCase: '',
    executionPlan: '',
    techAlignment: '',
    strategyAlignment: ''
};

// --- Config: Tabs ---
export const TABS = [
    { id: 'A', label: 'OPPORTUNITY' },
    { id: 'B', label: 'THE WORKFLOW' },
    { id: 'C', label: 'EXECUTION' },
    { id: 'D', label: 'BUSINESS CASE' }
] as const;

// --- Config: Strategic Horizons ---
export const HORIZONS = [
    { id: 'Growth & Scalability', label: 'Growth & Scalability', color: 'bg-info-subtle text-white', border: 'border-info' },
    { id: 'Operational Throughput', label: 'Operational Throughput', color: 'bg-warning-subtle text-white', border: 'border-warning' },
    { id: 'Strategic Advantage', label: 'Strategic Advantage', color: 'bg-intelligence text-white', border: 'border-intelligence' }
] as const;

export const AUTONOMY_LABELS: Record<string, string> = {
    MANUAL: "Manual / Human-Led",
    ASSISTED: "AI-Assisted (Copilot)",
    AUTONOMOUS: "Autonomous Agent"
};

export type TabId = typeof TABS[number]['id'];
