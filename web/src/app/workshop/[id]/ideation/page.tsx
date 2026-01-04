import { IdeationBoard } from '@/components/divergent/IdeationBoard';

export default async function IdeationPage({ params }: { params: { id: string } }) {
    const workshopId = params.id;
    // Data is now fetched internally by the board from the Intelligence Blob (SSOT)
    return <IdeationBoard workshopId={workshopId} />;
}
