export const SCORING_DIMENSIONS = [
    {
        category: "System Type",
        id: "system",
        questions: [
            {
                id: "role",
                label: "Role of Agent",
                left: "Human Substitution",
                mid: "Workflow Support",
                right: "Human Augmentation",
                leftExplainer: "Substitutes human labor. Focus on efficiency and cost reduction.",
                midExplainer: "Supports human workflows. Balanced approach matching industry standards.",
                rightExplainer: "Augments human intelligence. Focus on differentiation and new value."
            },
            {
                id: "data",
                label: "Data Source",
                left: "Commoditized Data",
                mid: "Mixed Sources",
                right: "Unique Company Data",
                leftExplainer: "Uses publicly available, commoditized datasets.",
                midExplainer: "Combines external and internal data sources.",
                rightExplainer: "Leverages proprietary, high-value company data."
            },
            {
                id: "scope",
                label: "Operational Scope",
                left: "Single Process",
                mid: "Multi-Process",
                right: "End-to-End",
                leftExplainer: "Optimizes a single, isolated process.",
                midExplainer: "Spans multiple connected processes.",
                rightExplainer: "Cross-functional, end-to-end transformation."
            }
        ]
    },
    {
        category: "Value Potential",
        id: "value",
        questions: [
            {
                id: "goal",
                label: "Strategic Goal",
                left: "Productivity Play",
                mid: "Margin Expansion",
                right: "Revenue Play",
                leftExplainer: "Drives productivity gains and operational savings.",
                midExplainer: "Improves margins through efficiency and quality.",
                rightExplainer: "Unlocks new revenue streams or market opportunities."
            },
            {
                id: "advantage",
                label: "Competitive Advantage",
                left: "Low / None",
                mid: "Moderate Edge",
                right: "Unique Advantage",
                leftExplainer: "Minimal competitive differentiation.",
                midExplainer: "Creates moderate market positioning.",
                rightExplainer: "Builds sustainable, unique competitive moat."
            },
            {
                id: "roi",
                label: "Return on Investment",
                left: "< 3x ROI",
                mid: "3-10x ROI",
                right: "> 10x ROI",
                leftExplainer: "Standard returns, incremental value.",
                midExplainer: "Solid returns with proven payback.",
                rightExplainer: "Exceptional returns with exponential upside."
            }
        ]
    },
    {
        category: "Execution Complexity",
        id: "execution",
        questions: [
            {
                id: "complexity",
                label: "Technical Complexity",
                left: "Lower Complexity",
                mid: "Moderate Build",
                right: "Higher Complexity",
                leftExplainer: "Simple implementation with existing tools.",
                midExplainer: "Requires integration and custom configuration.",
                rightExplainer: "Complex, bespoke development required."
            },
            {
                id: "time",
                label: "Time to Value",
                left: "Rapid Deployment",
                mid: "Standard Timeline",
                right: "Long-Term Build",
                leftExplainer: "Quick wins within weeks.",
                midExplainer: "Steady progress over 3-6 months.",
                rightExplainer: "Strategic investment with 12+ month horizon."
            },
            {
                id: "build",
                label: "Build vs Buy",
                left: "Buy Standard",
                mid: "Configure / Extend",
                right: "Build Custom",
                leftExplainer: "Purchase off-the-shelf solution.",
                midExplainer: "Customize existing platforms.",
                rightExplainer: "Build proprietary, custom solution."
            }
        ]
    }
];

// Calculate average score from all dimension values
export function calculateAverageScore(scores: Record<string, number>): number {
    const values = Object.values(scores);
    if (values.length === 0) return 0;
    return Math.round(values.reduce((sum, val) => sum + val, 0) / values.length);
}

// Auto-tier based on average score
export function getTierFromScore(avg: number): string {
    if (avg >= 75) return 'STRATEGIC_BET';
    if (avg >= 40) return 'TABLE_STAKES';
    return 'AGENTIC_AUTO';
}

// Get all question IDs for initialization
export function getAllQuestionIds(): string[] {
    return SCORING_DIMENSIONS.flatMap(dim => dim.questions.map(q => q.id));
}
