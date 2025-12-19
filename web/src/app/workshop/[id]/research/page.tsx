import { ResearchInterface } from '@/components/divergent/ResearchInterface';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

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
            <div className="flex h-screen w-full items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                    <p className="text-sm font-medium text-slate-500">Loading Research Data...</p>
                </div>
            </div>
        }>
            <ResearchDataLoader workshopId={params.id} />
        </Suspense>
    );
}
