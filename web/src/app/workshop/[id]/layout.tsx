import { prisma } from '@/lib/prisma';
import { WorkshopHeader } from '@/components/workshop/WorkshopHeader';


async function getWorkshop(id: string) {
    const workshop = await prisma.workshop.findUnique({
        where: { id },
        select: {
            clientName: true,
            clientLogoUrl: true
        }
    });
    return workshop;
}

import { notFound } from 'next/navigation';

export default async function WorkshopLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: { id: string };
}) {
    const workshop = await getWorkshop(params.id);

    if (!workshop) {
        notFound();
    }

    return (
        <>
            <WorkshopHeader
                clientName={workshop.clientName}
                clientLogoUrl={workshop.clientLogoUrl}
            />
            {children}
        </>
    );

}
