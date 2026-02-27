'use server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { updateWaveSchema } from '@/lib/validation';

export async function updateProjectWave(id: string, newRank: number, justification: string, workshopId: string) {
    // Validate input
    const validation = updateWaveSchema.safeParse({ id, newRank, justification, workshopId });
    if (!validation.success) {
        const errors = validation.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
        return { success: false, error: errors };
    }

    // 1. Fetch current rationale to append history
    const current = await prisma.opportunity.findUnique({ where: { id }, select: { strategicRationale: true } });

    // 2. Format the new rationale
    const newRationale = `⚡ OVERRIDE: ${justification}\n\n(Previous AI Logic: ${current?.strategicRationale || 'None'})`;

    // 3. Update DB
    await prisma.opportunity.update({
        where: { id },
        data: {
            sequenceRank: newRank,
            strategicRationale: newRationale
        }
    });

    revalidatePath(`/workshop/${workshopId}/analysis`);
    return { success: true };
}
