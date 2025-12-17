import { ResearchInterface } from '@/components/divergent/ResearchInterface';

export default function ResearchPage({ params }: { params: { id: string } }) {
    return <ResearchInterface workshopId={params.id} />;
}
