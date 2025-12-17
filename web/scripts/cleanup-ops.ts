import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🧹 Cleaning up "OPS" from Strategic Horizon data...');

    // Find all opportunities that have "OPS" in their strategicHorizon
    const opportunities = await prisma.opportunity.findMany({
        where: {
            strategicHorizon: {
                contains: 'OPS'
            }
        },
        select: {
            id: true,
            projectName: true,
            strategicHorizon: true
        }
    });

    console.log(`Found ${opportunities.length} opportunities with "OPS" in strategicHorizon`);

    for (const opp of opportunities) {
        // Split, filter out "OPS", and rejoin
        const horizons = opp.strategicHorizon?.split(',')
            .map(h => h.trim())
            .filter(h => h !== 'OPS' && h !== '')
            .join(', ') || '';

        console.log(`  - ${opp.projectName}: "${opp.strategicHorizon}" → "${horizons}"`);

        await prisma.opportunity.update({
            where: { id: opp.id },
            data: { strategicHorizon: horizons }
        });
    }

    console.log('✅ Cleanup complete!');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
