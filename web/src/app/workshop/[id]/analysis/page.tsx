import React from 'react';
import { prisma } from '@/lib/prisma';

// Prevent Next.js from caching dynamic data too aggressively
export const dynamic = 'force-dynamic';

async function getAnalysisData(workshopId: string) {
    // Get workshop for strategy data
    const workshop = await prisma.workshop.findUnique({
        where: { id: workshopId },
        select: {
            strategyNarrative: true,
            strategyDependencies: true,
            strategyRisks: true,
            dependencyGraph: true
        }
    });

    // Get only Capture opportunities (not all ideation items)
    const captureOpportunities = await prisma.opportunity.findMany({
        where: {
            workshopId,
            showInCapture: true  // Only show Capture opportunities
        }
    });

    if (!workshop) {
        return {
            nodes: [],
            opportunities: [],
            strategyNarrative: null,
            strategyDependencies: null,
            strategyRisks: null
        };
    }

    // Map to Nodes for AI Panel
    const nodes = captureOpportunities.map((opp) => {
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
            strategicRationale: opp.strategicRationale ?? undefined
        };
    });

    // Raw opportunities for StrategicMap
    const opportunities = captureOpportunities.map((opp) => ({
        id: opp.id,
        projectName: opp.projectName || "Untitled",
        scoreValue: opp.scoreValue || 0,
        scoreComplexity: opp.scoreComplexity || 0,
        sequenceRank: opp.sequenceRank,
        benefitRevenue: opp.benefitRevenue || 0,
        benefitCostAvoidance: opp.benefitCostAvoidance || 0
    }));



    return {
        nodes,
        opportunities,
        strategyNarrative: workshop.strategyNarrative,
        strategyDependencies: workshop.strategyDependencies,
        strategyRisks: workshop.strategyRisks,
        dependencyGraph: workshop.dependencyGraph as { from: string, to: string }[] | null
    };
}

import AnalysisDashboard from '@/components/analysis/AnalysisDashboard';

export default async function AnalysisPage({ params }: { params: { id: string } }) {
    const data = await getAnalysisData(params.id);

    return (
        <AnalysisDashboard
            workshopId={params.id}
            nodes={data.nodes}
            opportunities={data.opportunities}
            initialNarrative={data.strategyNarrative || ""}
            initialDependencies={data.strategyDependencies || ""}
            initialRisks={data.strategyRisks || ""}
            initialEdges={data.dependencyGraph || []}
        />
    );
}

