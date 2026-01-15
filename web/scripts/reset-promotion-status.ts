
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Resetting promotion status for all opportunities...');

    const result = await prisma.opportunity.updateMany({
        data: {
            promotionStatus: null, // Reset to null (not promoted)
        },
    });

    console.log(`Updated ${result.count} opportunities. Promotion status reset to null.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
