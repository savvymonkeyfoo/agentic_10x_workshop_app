import React from 'react';
import { prisma } from '@/lib/prisma';
import { CanvasSidebar } from '@/components/reporting/CanvasSidebar';

async function getOpportunities(workshopId: string) {
    return await prisma.opportunity.findMany({
        where: { workshopId },
        select: {
            id: true,
            projectName: true,
            updatedAt: true,
            canvasLastGeneratedAt: true
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
        <div className="flex bg-slate-50 dark:bg-slate-900 min-h-[calc(100vh-80px)]">
            {/* Sidebar */}
            <div className="w-[250px] shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hidden lg:block">
                <CanvasSidebar opportunities={opportunities} />
            </div>
            {/* Main Content */}
            <div className="flex-1 overflow-auto p-4 md:p-8">
                {children}
            </div>
        </div>
    );
}
