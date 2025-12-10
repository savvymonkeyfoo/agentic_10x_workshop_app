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
            trigger: opp.agentTrigger || '',
            action: opp.agentAction || '',
            guardrail: opp.agentGuardrail || ''
        },
        financials: {
            revenue: opp.estRevenueAnn,
            costReduction: opp.estCostReduction,
            hoursSaved: opp.estEfficiencyGains
        },
        vrcc: {
            value: opp.scoreValue,
            complexity: opp.scoreComplexity
        }
    };
}
