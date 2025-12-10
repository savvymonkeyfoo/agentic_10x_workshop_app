
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    try {
        const workshops = await prisma.workshop.findMany();
        workshops.forEach(w => console.log(`ID: ${w.id}`));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
