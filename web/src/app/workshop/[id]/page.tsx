import { redirect } from 'next/navigation';

export default function WorkshopRoot({ params }: { params: { id: string } }) {
    redirect(`/workshop/${params.id}/ideation`);
}
