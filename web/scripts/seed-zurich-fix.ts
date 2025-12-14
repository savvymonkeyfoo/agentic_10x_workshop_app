
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Hunting for "Zurich Insurance Australia"...');

    // 1. Find the EXACT record the user is looking at
    let workshop = await prisma.workshop.findFirst({
        where: {
            clientName: 'Zurich Insurance Australia'
        }
    });

    if (!workshop) {
        console.log('⚠️ Could not find "Zurich Insurance Australia". Creating it now...');

        workshop = await prisma.workshop.create({
            data: {
                clientName: 'Zurich Insurance Australia',
                workshopDate: new Date(),
                status: 'IN_PROGRESS',
                clientLogoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Zurich_Insurance_Group_logo.svg/2560px-Zurich_Insurance_Group_logo.svg.png',
                strategyNarrative: 'Zurich is pivoting to an "AI-First" claims processing model to reduce cycle times by 40%.',
                strategyRisks: 'Data privacy compliance (GDPR) and legacy mainframe integration.',
                strategyDependencies: 'Availability of Azure OpenAI instances and cleanup of historical claims data.'
            }
        });
        console.log(`✅ Created "Zurich Insurance Australia" (ID: ${workshop.id})`);
    } else {
        console.log(`✅ Found Target: "${workshop.clientName}" (ID: ${workshop.id})`);
    }

    // Check if opportunities already exist to avoid duplicates if running multiple times on the right DB
    const count = await prisma.opportunity.count({
        where: { workshopId: workshop.id }
    });

    if (count > 0) {
        console.log(`ℹ️ Workshop already has ${count} opportunities. Deleting them to ensure fresh seed...`);
        await prisma.opportunity.deleteMany({
            where: { workshopId: workshop.id }
        });
    }

    // 2. The 4 Opportunities to Inject
    const opportunities = [
        {
            projectName: 'Smart Claims Triage Bot',
            frictionStatement: 'Claims adjusters spend 40% of their day categorizing inbound emails.',
            strategicHorizon: 'Operational Throughput',
            whyDoIt: 'Reduce FNOL processing time from 3 days to 30 minutes.',
            scoreValue: 5,
            scoreComplexity: 3,
            scoreCapability: 4,
            scoreRiskFinal: 2,
            benefitCostAvoidance: 1200000,
            definitionOfDone: 'Automated classification of 90% of inbound claims.',
            tShirtSize: 'M',
            keyDecisions: 'Buy vs Build',
        },
        {
            projectName: 'Underwriter Co-Pilot',
            frictionStatement: 'Underwriters drown in 50+ page PDFs.',
            strategicHorizon: 'Strategic Advantage',
            whyDoIt: 'Quote 2x more policies per week.',
            scoreValue: 5,
            scoreComplexity: 4,
            scoreCapability: 2,
            scoreRiskFinal: 3,
            benefitRevenue: 5000000,
            definitionOfDone: 'Assistant successfully summarizes 50-page PDF in <30s.',
            tShirtSize: 'L',
            keyDecisions: 'Model Selection',
        },
        {
            projectName: 'Fraud Pattern Sentinel',
            frictionStatement: 'Fraud rings evolving faster than rules engines.',
            strategicHorizon: 'Growth & Scalability',
            whyDoIt: 'Reduce leakage by identifying cross-claim patterns.',
            scoreValue: 5,
            scoreComplexity: 5,
            scoreCapability: 3,
            scoreRiskFinal: 4,
            benefitCostAvoidance: 8000000,
            definitionOfDone: 'Identify 10 previous known fraud rings in test data.',
            tShirtSize: 'XL',
            keyDecisions: 'Graph DB Selection',
        },
        {
            projectName: 'Policy Renewal Agent',
            frictionStatement: 'Small business policies churn due to lack of engagement.',
            strategicHorizon: 'Growth & Scalability',
            whyDoIt: 'Increase retention by 15% via proactive outreach.',
            scoreValue: 4,
            scoreComplexity: 2,
            scoreCapability: 5,
            scoreRiskFinal: 2,
            benefitRevenue: 2500000,
            definitionOfDone: 'Auto-send renewal emails to 100% of expiring SME policies.',
            tShirtSize: 'S',
            keyDecisions: 'Integraion Strategy',
        }
    ];

    // 3. Inject
    for (const op of opportunities) {
        await prisma.opportunity.create({
            data: {
                ...op,
                workshopId: workshop.id,
                // Default empty JSON fields to prevent crashes
                workflowPhases: [],
                capabilitiesExisting: [],
                capabilitiesMissing: [],
                dfvAssessment: {},
                impactedSystems: []
            }
        });
    }

    console.log(`🚀 Successfully injected 4 opportunities into ${workshop.clientName}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
