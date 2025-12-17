import React from 'react';
import { prisma } from '@/lib/prisma';
import { CanvasWorkspace } from '@/components/reporting/CanvasWorkspace';

// Force dynamic rendering to prevent stale cache
export const dynamic = 'force-dynamic';

async function getOpportunity(id: string) {
    if (!id) return null;
    return await prisma.opportunity.findUnique({
        where: { id },
        select: {
            id: true,
            projectName: true,
            strategicHorizon: true,
            frictionStatement: true,
            whyDoIt: true,
            strategicRationale: true,

            // Scores (Explicit Selection)
            scoreValue: true,
            scoreComplexity: true,
            scoreCapability: true,
            scoreRiskFinal: true, // Used by Kite

            // Financials
            benefitRevenue: true,
            benefitCostAvoidance: true,
            benefitEfficiency: true, // Critical for Dashboard
            tShirtSize: true,

            // Complex Fields
            dfvAssessment: true, // Used by Venn
            workflowPhases: true,

            // Execution
            definitionOfDone: true,
            keyDecisions: true,
            systemGuardrails: true, // Risks
            capabilitiesMissing: true,
            capabilitiesExisting: true,

            // Meta
            canvasLastGeneratedAt: true,
            createdAt: true,
            updatedAt: true
        }
    });
}

export default async function ReportingPage({
    params: _params,
    searchParams
}: {
    params: { id: string };
    searchParams: { opportunityId?: string };
}) {
    const opportunity = searchParams.opportunityId
        ? await getOpportunity(searchParams.opportunityId)
        : null;

    if (opportunity) {
        // @ts-expect-error - Prisma Partial types might mismatch full Opportunity type but fields align
        return <CanvasWorkspace data={opportunity} />;
    }

    return (
        <div className="max-w-screen-xl mx-auto p-12 flex h-full items-center justify-center">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center shadow-sm max-w-2xl w-full">
                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><path d="M16 13H8" /><path d="M16 17H8" /><path d="M10 9H8" /></svg>
                </div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Select an Opportunity</h2>
                <p className="text-slate-500 max-w-md mx-auto leading-relaxed">
                    Choose a project from the sidebar to generate and view its Strategy One-Pager canvas.
                </p>
            </div>
        </div>
    );
}
