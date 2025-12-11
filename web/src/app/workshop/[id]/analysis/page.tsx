import React from 'react';
import { prisma } from '@/lib/prisma';

// Prevent Next.js from caching dynamic data too aggressively
export const dynamic = 'force-dynamic';

async function getAnalysisData(workshopId: string) {
    const workshop = await prisma.workshop.findUnique({
        where: { id: workshopId },
        include: {
            opportunities: true
        }
    });

    if (!workshop) {
        return {
            nodes: [],
            strategyNarrative: null,
            strategyDependencies: null,
            strategyRisks: null
        };
    }

    // Map to Nodes for Matrix
    const nodes = workshop.opportunities.map((opp: typeof workshop.opportunities[number]) => {
        const financialImpact = (opp.benefitRevenue || 0) + (opp.benefitCostAvoidance || 0);
        const minSize = 400;
        const maxSize = 2000;
        const scaledSize = financialImpact > 0
            ? Math.min(maxSize, Math.max(minSize, Math.sqrt(financialImpact) * 10 + minSize))
            : minSize;

        return {
            id: opp.id,
            name: opp.projectName || "Untitled",
            x: opp.scoreComplexity,
            y: opp.scoreValue,
            z: scaledSize,
            risk: opp.scoreRiskFinal,
            rank: opp.sequenceRank || undefined,
            financialImpact: financialImpact,
            tShirtSize: opp.tShirtSize,
            strategicRationale: opp.strategicRationale
        };
    });

    return {
        nodes,
        strategyNarrative: workshop.strategyNarrative,
        strategyDependencies: workshop.strategyDependencies,
        strategyRisks: workshop.strategyRisks
    };
}

import AnalysisDashboard from '@/components/analysis/AnalysisDashboard';

export default async function AnalysisPage({ params }: { params: { id: string } }) {
    const data = await getAnalysisData(params.id);

    return (
        <AnalysisDashboard
            workshopId={params.id}
            nodes={data.nodes}
            initialNarrative={data.strategyNarrative || ""}
            initialDependencies={data.strategyDependencies || ""}
            initialRisks={data.strategyRisks || ""}
        />
    );
}
