
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const failedId = '91a09960-f20c-41a3-80f1-0f811c644a35';
    console.log(`Deleting failed workshop seed: ${failedId}`);

    await prisma.workshop.delete({
        where: { id: failedId }
    });

    console.log('✅ Deleted.');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
