import React from 'react';
import { prisma } from '@/lib/prisma';
import MatrixView from '@/components/matrix/MatrixView';
// import { detectCircularDependency, LogicOpportunity } from '@/lib/logic/graph'; 
// Temporarily disabling complex graph logic to focus on Matrix visualization first as per user request.

// Prevent Next.js from caching dynamic data too aggressively
export const dynamic = 'force-dynamic';



async function getAnalysisData(workshopId: string) {
    const workshop = await prisma.workshop.findUnique({
        where: { id: workshopId },
        include: {
            opportunities: {
                include: {
                    capabilitiesConsumed: true,
                    capabilitiesProduced: true
                }
            }
        }
    });

    if (!workshop) {
        return { hasCycle: false, nodes: [], cycleNodes: [] };
    }

    // Map to Nodes for Matrix
    // X = Complexity, Y = Value, Z = Value (Size)
    const nodes = workshop.opportunities.map((opp) => ({
        id: opp.id,
        name: opp.projectName || "Untitled",
        x: opp.scoreComplexity,
        y: opp.scoreValue,
        z: opp.scoreValue,
        risk: opp.scoreRiskFinal
    }));

    return {
        hasCycle: false, // Placeholder
        cycleNodes: [],
        nodes
    };
}

export default async function AnalysisPage({ params }: { params: { id: string } }) {
    const data = await getAnalysisData(params.id);

    return (
        <MatrixView
            nodes={data.nodes}
            hasCycle={data.hasCycle}
            cycleNodes={data.cycleNodes}
        />
    );
}
