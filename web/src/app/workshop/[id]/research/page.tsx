import { ResearchInterface } from '@/components/divergent/ResearchInterface';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// 1. TIMEOUT CONFIG: Allow this route (and its actions) 5 minutes
export const maxDuration = 300;

async function ResearchDataLoader({ workshopId }: { workshopId: string }) {
    const workshop = await prisma.workshop.findUnique({
        where: { id: workshopId },
        include: { assets: { orderBy: { createdAt: 'desc' } } }
    });

    if (!workshop) {
        notFound();
    }

    const context = await prisma.workshopContext.findUnique({
        where: { workshopId },
        select: { researchBriefs: true }
    });

    const initialBriefs = (context?.researchBriefs as string[]) || [];

    return <ResearchInterface workshopId={workshopId} assets={workshop.assets} initialBriefs={initialBriefs} />;
}

export default function ResearchPage({ params }: { params: { id: string } }) {
    return (
        <Suspense fallback={
            <div className="flex h-screen w-full items-center justify-center bg-surface-subtle">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-intelligence" />
                    <p className="text-sm font-medium text-secondary">Loading Research Data...</p>
                </div>
            </div>
        }>
            <ResearchDataLoader workshopId={params.id} />
        </Suspense>
    );
}
