import { prisma } from '@/lib/prisma';
import { IdeationBoard } from '@/components/divergent/IdeationBoard';

export default async function IdeationPage({ params }: { params: { id: string } }) {
    const workshopId = params.id;

    const ideaCards = await prisma.ideaCard.findMany({
        where: { workshopId, status: 'ACTIVE' }
    });

    return <IdeationBoard workshopId={workshopId} initialIdeaCards={ideaCards} />;
}
