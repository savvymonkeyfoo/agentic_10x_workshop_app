import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("🚑 Starting Lazarus Protocol V5: The Golden Record...");

    // 1. Re-Create the Workshop
    const workshop = await prisma.workshop.create({
        data: {
            clientName: "Zurich Insurance Underwriting",
            status: "ANALYSIS",
        }
    });
    console.log(`✅ Workshop Created: ${workshop.id}`);

    // 2. The Golden Data Payload (All 4 Opportunities)
    const opportunities = [
        {
            // --- OPPORTUNITY 1: THE FLAGSHIP ---
            projectName: "Commercial Property AI Underwriter",
            frictionStatement: "Underwriters spend 4 hours per complex submission manually extracting data from unstructured broker PDF packages.",
            strategicHorizon: "Strategic Advantage",
            tShirtSize: "XL",

            // VRCC Scores
            scoreValue: 5,
            scoreComplexity: 5,
            scoreRiskFinal: 5,
            scoreCapability: 2,

            // Financials
            benefitRevenue: 2500000,
            benefitEstCost: 450000,
            benefitCostAvoidance: 0,
            benefitEfficiency: 0, // Hours saved

            // Lists & Arrays
            capabilitiesMissing: ["Unstructured PDF Extraction", "Multi-Modal Reasoning"],
            capabilitiesExisting: ["Policy Admin System (Guidewire)", "Outlook Integration"],

            // Execution
            definitionOfDone: "• Extract 50 key data points with >95% accuracy.\n• Reduce quote turnaround from 4 days to 4 hours.",
            keyDecisions: "• Build vs Buy for OCR engine?\n• Human-in-the-loop threshold?",
            changeManagement: "• High impact on underwriting workflows.\n• Requires trust-building workshops.",
            trainingRequirements: "• Train underwriters on AI confidence scores.",
            aiOpsRequirements: "• High inference compute (LLM).\n• Low latency required.",
            systemGuardrails: "• No auto-declines on protected characteristics.",

            // Workflow (JSON)
            workflowPhases: [
                { id: "p1-1", name: "Ingest Broker Email", autonomy: "L2", guardrail: "Verify sender domain" },
                { id: "p1-2", name: "Extract Risk Data from PDF", autonomy: "L3", guardrail: "Human review if confidence < 80%" },
                { id: "p1-3", name: "Check Sanctions/Risk Appetite", autonomy: "L4", guardrail: "Legal sign-off for red flags" },
                { id: "p1-4", name: "Draft Quote Letter", autonomy: "L2", guardrail: "Underwriter final approval" }
            ],

            // DFV (JSON)
            dfvAssessment: {
                desirability: { score: 5, justification: "High broker demand for speed." },
                feasibility: { score: 3, justification: "Complex unstructured data." },
                viability: { score: 5, justification: "Massive GWP uplift." }
            }
        },
        {
            // --- OPPORTUNITY 2: THE PILOT (INTERNAL) ---
            projectName: "Internal Claims Mailbox Triager",
            frictionStatement: "Claims team is drowning in generic inbox emails. They waste 30% of the day just categorizing attachments.",
            strategicHorizon: "Operational Throughput",
            tShirtSize: "M",

            scoreValue: 3,
            scoreComplexity: 2,
            scoreRiskFinal: 1,
            scoreCapability: 3,

            benefitRevenue: 0,
            benefitEstCost: 75000,
            benefitCostAvoidance: 150000, // Increased to show significance
            benefitEfficiency: 800, // Hours

            capabilitiesMissing: ["Unstructured PDF Extraction"],
            capabilitiesExisting: ["Outlook Integration", "Document Storage"],

            definitionOfDone: "• 90% auto-classification rate.\n• Zero lost emails.",
            keyDecisions: "• Handling encrypted attachments?",
            changeManagement: "• Low impact. Invisible background process.",
            trainingRequirements: "• None. Automated routing.",
            aiOpsRequirements: "• Standard text classification model.",
            systemGuardrails: "• Default to 'Manual' queue if unsure.",

            workflowPhases: [
                { id: "p2-1", name: "Monitor Shared Mailbox", autonomy: "L3", guardrail: "Read-only access" },
                { id: "p2-2", name: "Classify Attachment Type", autonomy: "L3", guardrail: "Default to 'Manual' if unknown" },
                { id: "p2-3", name: "Route to Claims Folder", autonomy: "L3", guardrail: "Log all routing actions" }
            ],

            dfvAssessment: {
                desirability: { score: 4, justification: "Staff burnout is high." },
                feasibility: { score: 5, justification: "Standard text classification." },
                viability: { score: 4, justification: "Clear efficiency gains." }
            }
        },
        {
            // --- OPPORTUNITY 3: THE QUICK WIN ---
            projectName: "Renewals Churn Predictor",
            frictionStatement: "We blindly send renewal notices to everyone. We don't know who is shopping around until they cancel.",
            strategicHorizon: "Growth & Scalability",
            tShirtSize: "S",

            scoreValue: 4,
            scoreComplexity: 1,
            scoreRiskFinal: 2,
            scoreCapability: 3,

            benefitRevenue: 800000,
            benefitEstCost: 40000,
            benefitCostAvoidance: 0,
            benefitEfficiency: 0,

            capabilitiesMissing: ["Predictive Analytics Model"],
            capabilitiesExisting: ["Customer Data Lake", "CRM"],

            definitionOfDone: "• Identify 80% of churners before they leave.",
            keyDecisions: "• Privacy approval?",
            changeManagement: "• Sales team dashboard training.",
            trainingRequirements: "• How to interpret 'Churn Risk Score'.",
            aiOpsRequirements: "• Nightly batch processing.",
            systemGuardrails: "• No pricing bias based on postcode.",

            workflowPhases: [
                { id: "p3-1", name: "Analyze Policyholder History", autonomy: "L4", guardrail: "Anonymize PII data" },
                { id: "p3-2", name: "Flag 'At Risk' Customers", autonomy: "L3", guardrail: "Threshold > 70% probability" },
                { id: "p3-3", name: "Generate Discount Offer", autonomy: "L2", guardrail: "Sales manager approval" }
            ],

            dfvAssessment: {
                desirability: { score: 5, justification: "Sales team requested this." },
                feasibility: { score: 5, justification: "Data is ready." },
                viability: { score: 5, justification: "High retention value." }
            }
        },
        {
            // --- OPPORTUNITY 4: THE MONEY PIT ---
            projectName: "Legacy Mainframe Code Converter",
            frictionStatement: "We have 40-year-old COBOL code running the billing engine. No one knows how to fix it.",
            strategicHorizon: "Operational Throughput",
            tShirtSize: "XL",

            scoreValue: 2,
            scoreComplexity: 5,
            scoreRiskFinal: 5,
            scoreCapability: 1,

            benefitRevenue: 0,
            benefitEstCost: 1200000,
            benefitCostAvoidance: 200000,
            benefitEfficiency: 0,

            capabilitiesMissing: ["Legacy Code Translator", "Automated QA Rig"],
            capabilitiesExisting: ["Github Enterprise"],

            definitionOfDone: "• 100% functional parity with mainframe.",
            keyDecisions: "• Big Bang switch over or phased?",
            changeManagement: "• IT Dept panic management.",
            trainingRequirements: "• Java/Python upskilling for COBOL devs.",
            aiOpsRequirements: "• Private LLM hosting (Code privacy).",
            systemGuardrails: "• Human review of EVERY line of code.",

            workflowPhases: [
                { id: "p4-1", name: "Ingest COBOL Codebase", autonomy: "L1", guardrail: "Read-only source access" },
                { id: "p4-2", name: "Translate to Java/Python", autonomy: "L1", guardrail: "Human review of all logic" },
                { id: "p4-3", name: "Unit Test Generation", autonomy: "L2", guardrail: "100% coverage required" }
            ],

            dfvAssessment: {
                desirability: { score: 1, justification: "Invisible to customer." },
                feasibility: { score: 2, justification: "High technical risk." },
                viability: { score: 2, justification: "Long payback period." }
            }
        }
    ];

    // 3. Insert Loop
    for (const opp of opportunities) {
        await prisma.opportunity.create({
            data: {
                ...opp,
                workshopId: workshop.id,
                whyDoIt: "Restored via Lazarus Script V5",
                agentDirective: {}
            }
        });
    }
    console.log("✅ All 4 Opportunities Fully Restored.");
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());