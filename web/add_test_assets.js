
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const workshopId = 'WS-2025-SEED-001';

    console.log('Adding test assets to', workshopId);

    // 1. Add Dossier
    await prisma.asset.create({
        data: {
            workshopId,
            name: 'Test Dossier.pdf',
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Zurich_Insurance_Group_logo.svg/2560px-Zurich_Insurance_Group_logo.svg.png', // valid dummy url
            type: 'DOSSIER',
            status: 'READY',
            chunks: {
                create: [
                    { content: 'The client is Acme Global. They struggle with manual invoicing.', chunkIndex: 0, embedding: [] }
                ]
            }
        }
    });

    // 2. Add Backlog
    await prisma.asset.create({
        data: {
            workshopId,
            name: 'Test Backlog.pdf',
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Zurich_Insurance_Group_logo.svg/2560px-Zurich_Insurance_Group_logo.svg.png',
            type: 'BACKLOG',
            status: 'READY',
            chunks: {
                create: [
                    { content: 'Backlog Item 1: Automate PO matching.', chunkIndex: 0, embedding: [] }
                ]
            }
        }
    });

    console.log('Assets created.');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
