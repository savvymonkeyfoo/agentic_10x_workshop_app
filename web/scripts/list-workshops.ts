
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const workshops = await prisma.workshop.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            _count: {
                select: { opportunities: true }
            }
        }
    });

    console.log('Found workshops:', workshops.length);
    workshops.forEach(w => {
        console.log(`- ID: ${w.id}`);
        console.log(`  Name: ${w.clientName}`);
        console.log(`  Date: ${w.workshopDate}`);
        console.log(`  Opp Count: ${w._count.opportunities}`);
        console.log('---');
    });
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
