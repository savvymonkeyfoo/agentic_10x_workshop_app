// -----------------------------------------------------------------------------
// SERVER COMPONENT (page.tsx)
// -----------------------------------------------------------------------------
// This component runs on the server. It fetches the initial data and passes it
// to the interactive Client Component (InputCanvas.tsx).
// This prevents Prisma from running in the browser and ensures fast initial load.
// -----------------------------------------------------------------------------

import React, { Suspense } from 'react';
import { getOpportunities } from '@/app/actions/get-opportunities';
import InputCanvas from '@/components/workshop/InputCanvas';

interface PageProps {
    params: { id: string };
}

export default async function InputPage({ params }: PageProps) {
    const workshopId = params.id;
    
    // Fetch data directly on the server
    const opportunities = await getOpportunities(workshopId);

    return (
        <div className="h-full w-full">
            <Suspense fallback={<div className="p-8 text-slate-400">Loading workspace...</div>}>
                <InputCanvas 
                    initialOpportunities={opportunities} 
                    workshopId={workshopId} 
                />
            </Suspense>
        </div>
    );
}
