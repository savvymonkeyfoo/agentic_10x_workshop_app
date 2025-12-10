```
import React from 'react';
import { prisma } from '@/lib/prisma';
import MatrixView from '@/components/matrix/MatrixView';
import { detectCircularDependency, LogicOpportunity } from '@/lib/logic/graph';

// Prevent Next.js from caching dynamic data too aggressively
export const dynamic = 'force-dynamic';


async function getAnalysisData() {
    // Fetch the "Acme Global" workshop (Assuming seeded)
    // In a real app, we'd pull ID from params.
    const workshop = await prisma.workshop.findFirst({
        where: { clientName: 'Acme Global Logistics' },
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

    // Map to Logic Nodes
    const logOps: LogicOpportunity[] = workshop.opportunities.map((opp: any) => ({
        id: opp.id,
        projectName: opp.projectName,
        capabilitiesConsumed: opp.capabilitiesConsumed.map((c: any) => ({
            name: c.name,
            status: c.status as 'EXISTING' | 'MISSING'
        })),
        capabilitiesProduced: opp.capabilitiesProduced.map((c: any) => ({
            name: c.name
        }))
    }));

    // Run Logic Gate
    const hasCycle = detectCircularDependency(logOps);

    // TODO: `detectCircularDependency` currently returns boolean. 
    // To identify *which* nodes are in the cycle for the modal, we'd need a robust cycle path finder.
    // For this phase, we'll assume if check fails, we show a generic or mock cycle path 
    // (or update graph.ts to return path, but prompt says "returns True/False").
    // I will fallback to showing all node names if cycle detected for now or mock the "A->B" display if true.

    const nodes = workshop.opportunities.map((opp: any) => ({
        id: opp.id,
        name: opp.projectName,
        x: opp.scoreComplexity,
        y: opp.scoreValue,
        z: opp.scoreValue,
        risk: opp.scoreRiskFinal
    }));

    return {
        hasCycle,
        cycleNodes: hasCycle ? logOps.map(o => o.projectName) : [], // Show all as placeholders if cycle
        nodes
    };
}

export default async function AnalysisPage() {
    const data = await getAnalysisData();

    return (
        <MatrixView
            nodes={data.nodes}
            hasCycle={data.hasCycle}
            cycleNodes={data.cycleNodes}
        />
    );
}
