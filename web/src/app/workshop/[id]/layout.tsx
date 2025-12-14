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

export default async function WorkshopLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: { id: string };
}) {
    const workshop = await getWorkshop(params.id);

    return (
        <>
            {workshop && (
                <WorkshopHeader
                    clientName={workshop.clientName}
                    clientLogoUrl={workshop.clientLogoUrl}
                />
            )}
            {children}
        </>
    );

}
