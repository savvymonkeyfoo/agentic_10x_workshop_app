'use server';

import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { createWorkshopSchema, validateData } from '@/lib/validation';

export async function createWorkshop(formData: FormData) {
    const rawData = {
        clientName: formData.get('clientName') as string,
        clientLogoUrl: formData.get('clientLogoUrl') as string | null,
        workshopDate: (formData.get('workshopDate') as string) || new Date().toISOString(),
    };

    // Validate input data with Zod
    const validation = validateData(createWorkshopSchema, rawData);

    if (!validation.success) {
        throw new Error(`Validation failed: ${validation.errors?.join(', ')}`);
    }

    const validatedData = validation.data!;

    // Use validated data for workshop creation
    const workshopDate = new Date(validatedData.workshopDate);

    const workshop = await prisma.workshop.create({
        data: {
            clientName: validatedData.clientName,
            clientLogoUrl: validatedData.clientLogoUrl,
            workshopDate: workshopDate
        }
    });

    // Redirect to the new Research Interface
    redirect(`/workshop/${workshop.id}/research`);
}
