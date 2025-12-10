
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const workshop = await prisma.workshop.findFirst();
        if (workshop) {
            console.log(`WORKSHOP_ID: ${workshop.id}`);
        } else {
            console.log('No workshops found.');
        }
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
