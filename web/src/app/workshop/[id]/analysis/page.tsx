import React from 'react';
import { prisma } from '@/lib/prisma';
// import MatrixView from '@/components/matrix/MatrixView'; 
// Temporarily disabling complex graph logic to focus on Matrix visualization first as per user request.

// Prevent Next.js from caching dynamic data too aggressively
export const dynamic = 'force-dynamic';



async function getAnalysisData(workshopId: string) {
    const workshop = await prisma.workshop.findUnique({
        where: { id: workshopId },
        include: {
            opportunities: true // Fetch all scalar fields
        }
    });

    if (!workshop) {
        return { nodes: [] };
    }

    // Map to Nodes for Matrix
    // X = Complexity, Y = Value, Z = Financial Impact (Revenue + Cost Avoidance)
    const nodes = workshop.opportunities.map((opp: typeof workshop.opportunities[number]) => {
        // Calculate financial impact for bubble size
        const financialImpact = (opp.benefitRevenue || 0) + (opp.benefitCostAvoidance || 0);

        // Scale to appropriate range (min 400, max 2000 for bubble area)
        // Using sqrt scale for better visual balance
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
            financialImpact: financialImpact
        };
    });

    return { nodes };
}

import AnalysisDashboard from '@/components/analysis/AnalysisDashboard';

export default async function AnalysisPage({ params }: { params: { id: string } }) {
    const data = await getAnalysisData(params.id);

    return (
        <AnalysisDashboard
            workshopId={params.id}
            nodes={data.nodes}
        />
    );
}
