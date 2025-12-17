import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔧 Fixing Cost Data to align ROI...');

    // 1. Smart Claims Bot (Target ~7x ROI)
    // Benefit was set to ~1.2M. We need Cost to be ~170k.
    await prisma.opportunity.updateMany({
        where: { projectName: 'Smart Claims Triage Bot' },
        data: {
            benefitEstCost: 175000,
            tShirtSize: 'M'
        }
    });

    // 2. Underwriter Co-Pilot (Target ~10x ROI)
    // Benefit was 5M. Cost needs to be ~500k.
    await prisma.opportunity.updateMany({
        where: { projectName: 'Underwriter Co-Pilot' },
        data: {
            benefitEstCost: 500000,
            tShirtSize: 'L'
        }
    });

    // 3. Fraud Pattern Sentinel (Target ~15x ROI)
    // Benefit was 8M. Cost needs to be ~550k.
    await prisma.opportunity.updateMany({
        where: { projectName: 'Fraud Pattern Sentinel' },
        data: {
            benefitEstCost: 550000,
            tShirtSize: 'XL' // Testing the new font sizing!
        }
    });

    // 4. Policy Renewal Agent (Target ~20x ROI)
    // Benefit was 2.5M. Cost needs to be ~125k.
    await prisma.opportunity.updateMany({
        where: { projectName: 'Policy Renewal Agent' },
        data: {
            benefitEstCost: 125000,
            tShirtSize: 'S'
        }
    });

    console.log('✅ Costs updated. ROI should now reflect reality.');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
