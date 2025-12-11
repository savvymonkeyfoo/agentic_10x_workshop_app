import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
    console.log("🔍 Verifying latest data...");

    // Fetch the most recently updated opportunity (The 'Golden Record')
    const opportunity = await prisma.opportunity.findFirst({
        orderBy: { updatedAt: 'desc' },
        include: { workshop: true }
    });

    if (!opportunity) {
        console.log("❌ No opportunities found in database.");
        return;
    }

    // Write to file
    const dumpPath = path.join(process.cwd(), 'verification-dump.json');
    fs.writeFileSync(dumpPath, JSON.stringify(opportunity, null, 2));

    console.log(`✅ Success! Data dumped to ${dumpPath}`);
    console.log(`----------------------------------------`);
    console.log(`🆔 ID:          ${opportunity.id}`);
    console.log(`📂 Project:     ${opportunity.projectName}`);
    console.log(`📅 Updated:     ${opportunity.updatedAt.toISOString()}`);
    console.log(`💰 Est. Cost:   ${opportunity.benefitEstCost}`);
    console.log(`🛡️ Cost Avoid:  ${opportunity.benefitCostAvoidance}`);
    console.log(`✅ Definition:  ${opportunity.definitionOfDone?.substring(0, 50)}...`);
    console.log(`----------------------------------------`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
