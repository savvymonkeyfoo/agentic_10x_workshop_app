'use server';

import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

export async function createWorkshop(formData: FormData) {
    const clientName = formData.get('clientName') as string;
    const clientLogoUrl = formData.get('clientLogoUrl') as string | null;
    const workshopDateStr = formData.get('workshopDate') as string;

    // Default to now if not provided (though UI should provide it)
    const workshopDate = workshopDateStr ? new Date(workshopDateStr) : new Date();

    if (!clientName) {
        throw new Error('Client Name is required');
    }

    const workshop = await prisma.workshop.create({
        data: {
            clientName: clientName,
            clientLogoUrl: clientLogoUrl,
            workshopDate: workshopDate
        }
    });

    // Redirect to the new Research Interface
    redirect(`/workshop/${workshop.id}/research`);
}
