import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🚑 Starting Lazarus Protocol V5: The Golden Record...');

    // 1. Create (or Find) the Zurich Workshop
    const workshop = await prisma.workshop.create({
        data: {
            clientName: 'Zurich Insurance',
            workshopDate: new Date(),
            status: 'IN_PROGRESS',
            clientLogoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Zurich_Insurance_Group_logo.svg/2560px-Zurich_Insurance_Group_logo.svg.png', // Public logo
            strategyNarrative: 'Zurich is pivoting to an "AI-First" claims processing model to reduce cycle times by 40%.',
            strategyRisks: 'Data privacy compliance (GDPR) and legacy mainframe integration.',
            strategyDependencies: 'Availability of Azure OpenAI instances and cleanup of historical claims data.'
        }
    });

    console.log(`✅ Workshop Created: ${workshop.id}`);

    // 2. Define the 4 Opportunities
    const opportunities = [
        {
            projectName: 'Smart Claims Triage Bot',
            frictionStatement: 'Claims adjusters spend 40% of their day categorizing inbound emails and PDFs instead of adjusting.',
            strategicHorizon: 'Operational Throughput',
            whyDoIt: 'Reduce "First Notice of Loss" (FNOL) processing time from 3 days to 30 minutes.',

            // Business Case
            tShirtSize: 'M',
            benefitRevenue: 0,
            benefitCostAvoidance: 1200000, // $1.2M saved
            benefitEfficiency: 8000, // Hours saved
            benefitEstCost: 150000,
            benefitTimeframe: 'Annually',

            // VRCC Scores (1-5)
            scoreValue: 5,      // High Impact
            scoreComplexity: 3, // Medium Complexity
            scoreCapability: 4, // Good existing data
            scoreRiskFinal: 2,  // Low Risk (Human in loop)

            // Deep Dive
            workflowPhases: [
                { name: 'Ingest', description: 'Monitor inbox for new claims' },
                { name: 'Classify', description: 'LLM extracts Policy ID and Loss Type' },
                { name: 'Route', description: 'Assign to correct adjuster queue' }
            ],
            capabilitiesExisting: ['Outlook API', 'Policy Database'],
            capabilitiesMissing: ['OCR for Handwriting', 'Sentiment Analysis'],

            // Governance
            keyDecisions: 'Buy vs Build: Use Azure Document Intelligence.',
            definitionOfDone: 'Fully automated classification and routing of email claims with 90% accuracy.',
            impactedSystems: ['Exchange Server', 'Claims Management System'],
            aiOpsRequirements: 'Standard GPU instance.',
            systemGuardrails: 'Confidence score < 90% must go to human.',

            dfvAssessment: { desirability: 5, feasibility: 5, viability: 5 }
        },
        {
            projectName: 'Underwriter Co-Pilot',
            frictionStatement: 'Underwriters drown in 50+ page PDFs for every commercial property application.',
            strategicHorizon: 'Strategic Advantage',
            whyDoIt: 'Allow underwriters to quote 2x more policies per week by summarizing risk factors instantly.',

            // Business Case
            tShirtSize: 'L',
            benefitRevenue: 5000000, // $5M new business
            benefitCostAvoidance: 0,
            benefitEfficiency: 15000, // Hours saved
            benefitEstCost: 250000,
            benefitTimeframe: 'Annually',

            // VRCC Scores
            scoreValue: 5,
            scoreComplexity: 4, // Hard (Unstructured data)
            scoreCapability: 2, // Low (No existing vector DB)
            scoreRiskFinal: 3,

            // Deep Dive
            workflowPhases: [
                { name: 'Upload', description: 'User uploads risk report' },
                { name: 'Analyze', description: 'Agent identifies fire/flood risks' },
                { name: 'Suggest', description: 'Drafts coverage exclusions' }
            ],
            capabilitiesExisting: ['SharePoint'],
            capabilitiesMissing: ['Vector Database', 'RAG Pipeline'],

            // Governance
            keyDecisions: 'Model Selection: GPT-4 vs Claude 3.5 Sonnet.',
            definitionOfDone: 'Underwriters can generate risk summaries and exclusion drafts from raw PDFs in under 1 minute.',
            impactedSystems: ['Policy Admin System', 'SharePoint'],
            aiOpsRequirements: 'Vector Store (Pinecone)',
            systemGuardrails: 'Never auto-deny coverage. Only suggest.',

            dfvAssessment: { desirability: 5, feasibility: 4, viability: 5 }
        },
        {
            projectName: 'Fraud Pattern Sentinel',
            frictionStatement: 'Fraud rings are evolving faster than our static rules engines can catch up.',
            strategicHorizon: 'Growth & Scalability',
            whyDoIt: 'Reduce leakage by identifying subtle cross-claim patterns.',

            // Business Case
            tShirtSize: 'XL',
            benefitRevenue: 0,
            benefitCostAvoidance: 8000000, // $8M fraud stopped
            benefitEfficiency: 0,
            benefitEstCost: 500000,
            benefitTimeframe: 'Annually',

            // VRCC Scores
            scoreValue: 5,
            scoreComplexity: 5, // Very Complex
            scoreCapability: 3,
            scoreRiskFinal: 4,  // High Risk (False positives)

            // Deep Dive
            workflowPhases: [
                { name: 'Scan', description: 'Ingest daily transaction logs' },
                { name: 'Cluster', description: 'Identify linked entities (same IP, device)' },
                { name: 'Alert', description: 'Flag high-probability rings' }
            ],
            capabilitiesExisting: ['Data Lake', 'Transaction Logs'],
            capabilitiesMissing: ['Graph Database', 'Real-time Inference'],

            // Governance
            keyDecisions: 'Graph DB: Neo4j vs Amazon Neptune.',
            definitionOfDone: 'Graph-based detection of fraud rings identifying >$1M in recoverable leakage.',
            impactedSystems: ['Data Lake', 'Claims DB'],
            aiOpsRequirements: 'High Memory Nodes.',
            systemGuardrails: 'Human Review Board for all fraud flags.',

            dfvAssessment: { desirability: 4, feasibility: 3, viability: 5 }
        },
        {
            projectName: 'Policy Renewal Agent',
            frictionStatement: 'Small business policies churn because we fail to engage them before expiry.',
            strategicHorizon: 'Growth & Scalability',
            whyDoIt: 'Increase retention by 15% through personalized, proactive outreach.',

            // Business Case
            tShirtSize: 'S',
            benefitRevenue: 2500000,
            benefitCostAvoidance: 0,
            benefitEfficiency: 2000,
            benefitEstCost: 50000,
            benefitTimeframe: 'Annually',

            // VRCC Scores
            scoreValue: 4,
            scoreComplexity: 2, // Easy
            scoreCapability: 5, // Data exists
            scoreRiskFinal: 2,

            // Deep Dive
            workflowPhases: [
                { name: 'Trigger', description: 'Identifies expiry - 60 days' },
                { name: 'Draft', description: 'Generates personalized renewal offer' },
                { name: 'Send', description: 'E-mails broker or customer' }
            ],
            capabilitiesExisting: ['CRM (Salesforce)', 'Email Gateway'],
            capabilitiesMissing: ['None'],

            // Governance
            keyDecisions: 'Integration method: Salesforce API.',
            definitionOfDone: 'Automated renewal outreach deployed to 100% of SME customers 60 days prior to expiry.',
            impactedSystems: ['Salesforce', 'SendGrid'],
            aiOpsRequirements: 'Serverless Functions.',
            systemGuardrails: 'Rate limit emails to avoid spam filters.',

            dfvAssessment: { desirability: 3, feasibility: 5, viability: 5 }
        }
    ];

    // 3. Insert them into the DB
    for (const op of opportunities) {
        await prisma.opportunity.create({
            data: {
                ...op,
                workshopId: workshop.id
            }
        });
    }

    console.log(`✅ All 4 Opportunities Fully Restored.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });