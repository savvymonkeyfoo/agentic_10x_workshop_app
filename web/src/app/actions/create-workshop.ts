'use server';

import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { createWorkshopSchema } from '@/lib/validation';

export async function createWorkshop(formData: FormData) {
    try {
        const rawData = {
            clientName: formData.get('clientName') as string,
            clientLogoUrl: formData.get('clientLogoUrl') as string | null,
            workshopDate: (formData.get('workshopDate') as string) || new Date().toISOString(),
        };

        // Validate input data with Zod
        const validation = createWorkshopSchema.safeParse(rawData);

        if (!validation.success) {
            const errors = validation.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
            throw new Error(`Validation failed: ${errors}`);
        }

        const validatedData = validation.data;

        // Use validated data for workshop creation
        const workshopDate = new Date(validatedData.workshopDate);

        const workshop = await prisma.workshop.create({
            data: {
                clientName: validatedData.clientName,
                clientLogoUrl: validatedData.clientLogoUrl,
                workshopDate: workshopDate
            }
        });

        // Redirect to the new Research Interface (redirect throws to handle the redirect)
        redirect(`/workshop/${workshop.id}/research`);
    } catch (error) {
        // Re-throw redirect errors (they're not real errors, just Next.js control flow)
        if (error && typeof error === 'object' && 'digest' in error) {
            throw error;
        }
        console.error('Failed to create workshop:', error);
        throw new Error('Failed to create workshop');
    }
}
