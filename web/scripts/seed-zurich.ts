import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    console.log("🚑 Starting Lazarus Protocol V6: I.P.O. Workflow...");

    // Clean up previous run if needed? No, create new workshop is fine.
    const workshop = await prisma.workshop.create({ data: { clientName: "Zurich Insurance Underwriting", status: "ANALYSIS" } });

    const opportunities = [
        {
            projectName: "Commercial Property AI Underwriter",
            frictionStatement: "Underwriters spend 4 hours per complex submission manually extracting data.",
            strategicHorizon: "Strategic Advantage",
            tShirtSize: "XL",
            scoreValue: 5, scoreComplexity: 5, scoreRiskFinal: 5, scoreCapability: 2,
            benefitRevenue: 2500000, benefitEstCost: 450000, benefitCostAvoidance: 0, benefitEfficiency: 0,
            capabilitiesMissing: ["Unstructured PDF Extraction", "Multi-Modal Reasoning"],
            capabilitiesExisting: ["Policy Admin System (Guidewire)", "Outlook Integration"],
            definitionOfDone: "• Extract 50 key data points with >95% accuracy.\n• Reduce quote turnaround to 4 hours.",
            keyDecisions: "• Build vs Buy for OCR engine?",
            changeManagement: "• High impact on underwriting workflows.",
            trainingRequirements: "• Train underwriters on AI confidence scores.",
            aiOpsRequirements: "• High inference compute (LLM).",
            systemGuardrails: "• No auto-declines on protected characteristics.",
            workflowPhases: [
                {
                    id: "p1-1", name: "Ingest Broker Email", autonomy: "L2",
                    inputs: "Raw Email (Outlook)",
                    actions: "Scan Attachments, Virus Check, Parse Body",
                    outputs: "Cleaned PDF, Metadata JSON"
                },
                {
                    id: "p1-2", name: "Extract Risk Data", autonomy: "L3",
                    inputs: "Cleaned PDF",
                    actions: "OCR Scan, LLM Entity Extraction, Confidence Scoring",
                    outputs: "Risk Data Object (JSON)"
                },
                {
                    id: "p1-3", name: "Validate Appetite", autonomy: "L4",
                    inputs: "Risk Data Object, Sanctions API",
                    actions: "Compare against Risk Rules Engine",
                    outputs: "Validation Flag (Pass/Refer)"
                },
                {
                    id: "p1-4", name: "Draft Quote", autonomy: "L2",
                    inputs: "Validation Flag, Rating Engine",
                    actions: "Generate Quote Letter, Calculate Premium",
                    outputs: "Draft Quote (Word)"
                }
            ],
            dfvAssessment: {
                desirability: { score: 5, justification: "High broker demand." },
                feasibility: { score: 3, justification: "Complex data." },
                viability: { score: 5, justification: "High GWP." }
            }
        },
        {
            projectName: "Internal Claims Mailbox Triager",
            frictionStatement: "Claims team is drowning in generic inbox emails.",
            strategicHorizon: "Operational Throughput",
            tShirtSize: "M",
            scoreValue: 3, scoreComplexity: 2, scoreRiskFinal: 1, scoreCapability: 3,
            benefitRevenue: 0, benefitEstCost: 75000, benefitCostAvoidance: 150000,
            definitionOfDone: "• Auto-categorize 90% of incoming emails.\n• Route to correct shared folders.",
            keyDecisions: "• Archive retention policy?",
            capabilitiesExisting: ["Exchange Server"],
            capabilitiesMissing: ["NLP Classification Service"],
            workflowPhases: [
                { id: "p2-1", name: "Monitor Mailbox", autonomy: "L3", inputs: "Inbox Stream", actions: "Listen for new events", outputs: "Email Event" },
                { id: "p2-2", name: "Classify Intent", autonomy: "L3", inputs: "Email Body", actions: "NLP Classification", outputs: "Category Tag" },
                { id: "p2-3", name: "Route Email", autonomy: "L3", inputs: "Category Tag", actions: "Move to Folder", outputs: "Routing Log" }
            ]
        },
        {
            projectName: "Renewals Churn Predictor",
            frictionStatement: "Blind renewal notices sent to high-risk churn customers.",
            strategicHorizon: "Growth & Scalability",
            tShirtSize: "L",
            scoreValue: 4, scoreComplexity: 1, scoreRiskFinal: 2, scoreCapability: 3,
            benefitRevenue: 800000, benefitEstCost: 40000, benefitCostAvoidance: 0,
            definitionOfDone: "• Predict churn probability for 100% of renewals.\n• Dashboard for Retention Team.",
            keyDecisions: "• Model selection (XGBoost vs Random Forest)?",
            capabilitiesExisting: ["Data Lake (Snowflake)"],
            capabilitiesMissing: ["Predictive Model Hosting"],
            workflowPhases: [
                { id: "p3-1", name: "Fetch History", autonomy: "L4", inputs: "Policy ID", actions: "Query Data Lake", outputs: "Customer Profile" },
                { id: "p3-2", name: "Predict Churn", autonomy: "L3", inputs: "Customer Profile", actions: "Run XGBoost Model", outputs: "Risk Score (0-100)" }
            ]
        },
        {
            projectName: "Legacy Mainframe Code Converter",
            frictionStatement: "40-year-old COBOL code is a black box and hard to maintain.",
            strategicHorizon: "Operational Throughput",
            tShirtSize: "XL",
            scoreValue: 2, scoreComplexity: 5, scoreRiskFinal: 5, scoreCapability: 1,
            benefitRevenue: 0, benefitEstCost: 1200000, benefitCostAvoidance: 200000,
            definitionOfDone: "• Convert Core Billing Module to Java.\n• Pass regression tests.",
            keyDecisions: "• Target architecture (Microservices vs Monolith)?",
            capabilitiesExisting: ["Mainframe Source Access"],
            capabilitiesMissing: ["GenAI Code Translator"],
            workflowPhases: [
                { id: "p4-1", name: "Ingest Code", autonomy: "L1", inputs: "COBOL Source", actions: "Static Analysis", outputs: "AST Tree" },
                { id: "p4-2", name: "Transpile", autonomy: "L1", inputs: "AST Tree", actions: "LLM Conversion", outputs: "Java Class" }
            ]
        }
    ];

    // WhyDoIt is required by schema, added here
    for (const opp of opportunities) {
        await prisma.opportunity.create({
            data: {
                ...opp,
                workshopId: workshop.id,
                whyDoIt: "Restored via Lazarus V6",
                agentDirective: {},
                // Fallbacks for any potentially missing optional arrays if typescript complains
                impactedSystems: [],
                systemGuardrails: "",
                aiOpsRequirements: "",
                changeManagement: "",
                trainingRequirements: ""
            }
        });
    }
    console.log("✅ All 4 I.P.O. Opportunities Restored.");
}
main().catch(e => console.error(e)).finally(async () => await prisma.$disconnect());