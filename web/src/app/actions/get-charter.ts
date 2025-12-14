'use server';

import { prisma } from '@/lib/prisma';

export async function getCharterData() {
    // Fetch the first Opportunity (Highest Rank) from 'Acme Global'
    // Strategy: Find workshop, then get opps.

    const workshop = await prisma.workshop.findFirst({
        where: { clientName: 'Acme Global Logistics' },
        include: {
            opportunities: {
                take: 1
            }
        }
    });

    if (!workshop || workshop.opportunities.length === 0) {
        throw new Error('No data found');
    }

    const opp = workshop.opportunities[0];

    return {
        id: opp.id,
        projectName: opp.projectName,
        tShirtSize: opp.tShirtSize || 'M',
        strategicHorizon: opp.strategicHorizon || 'OPS',
        frictionStatement: opp.frictionStatement || '',
        whyDoIt: opp.whyDoIt || '',
        agentDirective: {
            // @ts-ignore
            trigger: opp.agentDirective?.trigger || '',
            // @ts-ignore
            action: opp.agentDirective?.action || '',
            // @ts-ignore
            guardrail: opp.agentDirective?.guardrail || ''
        },
        financials: {
            revenue: opp.benefitRevenue || 0,
            costReduction: opp.benefitCostAvoidance || 0,
            hoursSaved: opp.benefitEfficiency || 0
        },
        vrcc: {
            value: opp.scoreValue,
            complexity: opp.scoreComplexity
        }
    };
}
