'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function updateWorkshop(formData: FormData) {
    const id = formData.get('id') as string;
    const clientName = formData.get('clientName') as string;
    const clientLogoUrl = formData.get('clientLogoUrl') as string | null;
    const workshopDateStr = formData.get('workshopDate') as string;

    if (!id || !clientName) {
        throw new Error('Workshop ID and Client Name are required');
    }

    // Only update date if provided
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dataToUpdate: any = {
        clientName,
        clientLogoUrl
    };

    if (workshopDateStr) {
        dataToUpdate.workshopDate = new Date(workshopDateStr);
    }

    await prisma.workshop.update({
        where: { id },
        data: dataToUpdate
    });

    revalidatePath('/');
}
