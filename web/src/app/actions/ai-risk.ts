'use server';

export interface AgentDirectiveInput {
    trigger: string;
    action: string;
    guardrail: string;
}

export interface RiskAnalysisResult {
    suggested_risk_score: number;
    autonomy_level: 'L0' | 'L1' | 'L2';
    reasoning_short: string;
}

export async function analyzeRisk(input: AgentDirectiveInput): Promise<RiskAnalysisResult> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Logic from ai_config.md
    // 1. PII/Data Privacy: IF action uses personal data -> Min Score 4.
    // 2. Financial Execution: IF action moves money -> Min Score 3.
    // 3. Read-Only: IF action is retrieval only -> Max Score 1.
    // 4. Human-in-Loop: IF guardrail requires approval -> Reduce Score by 1.

    let score = 2; // Default baseline
    let reasoning = "Standard operational risk.";
    let autonomy: 'L0' | 'L1' | 'L2' = 'L1';

    const actionLower = input.action.toLowerCase();
    const guardrailLower = input.guardrail.toLowerCase();

    // Simple keyword matching for mock logic
    if (actionLower.includes('personal') || actionLower.includes('pii') || actionLower.includes('employee') || actionLower.includes('customer')) {
        score = Math.max(score, 4);
        reasoning = "High Risk: Potential PII involvement.";
    }

    if (actionLower.includes('money') || actionLower.includes('payment') || actionLower.includes('transfer') || actionLower.includes('invoice')) {
        score = Math.max(score, 3);
        reasoning = "Medium Risk: Financial transaction detected.";
    }

    if (actionLower.includes('read') || actionLower.includes('fetch') || actionLower.includes('get') || actionLower.includes('report')) {
        if (score < 3) {
            score = 1;
            reasoning = "Low Risk: Read-only operation.";
        }
    }

    if (guardrailLower.includes('approval') || guardrailLower.includes('review') || guardrailLower.includes('human')) {
        score = Math.max(1, score - 1);
        reasoning += " Mitigated by Human-in-the-Loop.";
        autonomy = 'L1';
    } else if (score <= 2) {
        autonomy = 'L2'; // Low risk implies higher autonomy potential
    } else {
        autonomy = 'L0'; // High risk defaults to Assist
    }

    return {
        suggested_risk_score: score,
        autonomy_level: autonomy,
        reasoning_short: reasoning
    };
}
