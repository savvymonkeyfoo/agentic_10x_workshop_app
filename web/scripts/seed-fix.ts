
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Searching for "Zurich Insurance Australia"...');

    // 1. Find the specific workshop you are looking at
    const workshop = await prisma.workshop.findFirst({
        where: {
            clientName: {
                contains: 'Zurich'
            }
        },
        orderBy: {
            createdAt: 'desc'
        } // Get the most recent one
    });

    if (!workshop) {
        console.error('❌ Could not find any workshop with "Zurich" in the name.');
        return;
    }

    console.log(`✅ Found Workshop: ${workshop.clientName} (ID: ${workshop.id})`);

    // 2. The Data
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
            // Defaulting required fields missing in snippet
            tShirtSize: 'M',
            keyDecisions: 'Pending decision.',
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
            keyDecisions: 'Pending decision.',
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
            keyDecisions: 'Pending decision.',
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
            keyDecisions: 'Pending decision.',
        }
    ];

    // 3. Insert
    for (const op of opportunities) {
        await prisma.opportunity.create({
            data: {
                ...op,
                workshopId: workshop.id,
                // Fixing types for Prisma Schema compliance
                workflowPhases: [], // JSON
                capabilitiesExisting: [], // String[]
                capabilitiesMissing: [], // String[]
                dfvAssessment: {}, // JSON
                impactedSystems: [], // String[]
            }
        });
    }

    console.log(`✅ Successfully added 4 opportunities to ${workshop.clientName}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
