import React from 'react';
import { prisma } from '@/lib/prisma';
import { CanvasSidebar } from '@/components/reporting/CanvasSidebar';

async function getOpportunities(workshopId: string) {
    return await prisma.opportunity.findMany({
        where: {
            workshopId,
            showInCapture: true  // Only show Capture opportunities
        },
        select: {
            id: true,
            projectName: true,
            updatedAt: true,
            canvasLastGeneratedAt: true,
            scoreValue: true,
            frictionStatement: true
        },
        orderBy: { updatedAt: 'desc' }
    });
}

export default async function ReportingLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: { id: string };
}) {
    const opportunities = await getOpportunities(params.id);

    return (
        <div className="flex bg-surface-subtle dark:bg-background min-h-[calc(100vh-80px)]">
            {/* Sidebar */}
            <div className="w-[250px] shrink-0 border-r border-muted dark:border-border bg-white dark:bg-background hidden lg:block">
                <CanvasSidebar opportunities={opportunities} />
            </div>
            {/* Main Content */}
            <div className="flex-1 overflow-auto p-4 md:p-8">
                {children}
            </div>
        </div>
    );
}
