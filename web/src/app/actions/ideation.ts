'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function updateIdeaCard(id: string, updates: any) {
    try {
        // Filter updates to only allowed fields
        const allowed = {
            title: updates.title,
            description: updates.description,
            tier: updates.tier,
            status: updates.status,
            xPosition: updates.xPosition,
            yPosition: updates.yPosition,
            source: updates.source
        };

        // Remove undefined keys
        Object.keys(allowed).forEach(key => allowed[key as keyof typeof allowed] === undefined && delete allowed[key as keyof typeof allowed]);

        // If ID is temporary (starts with "card-"), create new
        if (id.startsWith('card-')) {
            // For creation, we need workshopId. But here I only have updates.
            // Ideally we create on "Add New" or handle creation differently.
            // Simplest: If ID is fake, do nothing until "real" creation happens, OR create now if we had workshopId.
            // Since handleAddNew creates a client-side only ID, we should probably have a create action called then.
            // BUT, the goal is SYNC.
            return { success: false, error: "Cannot update temporary card. Create it first." };
        }

        await prisma.ideaCard.update({
            where: { id },
            data: allowed
        });

        // revalidatePath(`/workshop/${updates.workshopId}`); // Optional/Expensive
        return { success: true };
    } catch (error) {
        console.error("Update IdeaCard Error:", error);
        return { success: false, error: "Update failed" };
    }
}

export async function createIdeaCard(workshopId: string, data: any) {
    try {
        const card = await prisma.ideaCard.create({
            data: {
                workshopId,
                title: data.title || 'New Idea',
                description: data.description || '',
                tier: data.tier || 'UNSCORED',
                source: data.source || 'WORKSHOP_GENERATED',
                xPosition: data.x || 400,
                yPosition: data.y || 300,
                status: 'ACTIVE'
            }
        });
        revalidatePath(`/workshop/${workshopId}/ideation`);
        return { success: true, card };
    } catch (error) {
        console.error("Create IdeaCard Error:", error);
        return { success: false, error: "Creation failed" };
    }
}

export async function deleteIdeaCard(id: string) {
    try {
        await prisma.ideaCard.delete({ where: { id } });
        return { success: true };
    } catch (error) {
        return { success: false, error: "Delete failed" };
    }
}
