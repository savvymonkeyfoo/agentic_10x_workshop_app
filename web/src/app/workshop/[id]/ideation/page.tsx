import { IdeationBoard } from '@/components/divergent/IdeationBoard';

export default function IdeationPage({ params }: { params: { id: string } }) {
    return <IdeationBoard workshopId={params.id} />;
}
