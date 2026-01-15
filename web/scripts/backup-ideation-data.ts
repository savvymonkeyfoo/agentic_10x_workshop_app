import { prisma } from '../src/lib/prisma';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Pre-Migration Backup Script
 * 
 * Purpose: Export all Workshop intelligence data (JSON) to files
 * for verification before and after SQL migration.
 * 
 * Run: npx tsx scripts/backup-ideation-data.ts
 */

interface BackupRecord {
    workshopId: string;
    workshopName: string;
    opportunityCount: number;
    opportunities: any[];
    exportedAt: string;
}

async function backupIdeationData() {
    console.log('🔒 Starting Pre-Migration Backup...\n');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(__dirname, `../backups/ideation_${timestamp}`);

    // Create backup directory
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    // 1. Get all workshops with context
    const workshops = await prisma.workshop.findMany({
        select: {
            id: true,
            clientName: true,
            context: {
                select: {
                    intelligenceAnalysis: true
                }
            }
        }
    });

    console.log(`📊 Found ${workshops.length} workshops\n`);

    const summary: BackupRecord[] = [];
    let totalJsonOpportunities = 0;

    // 2. Export each workshop's JSON data
    for (const workshop of workshops) {
        const intelligenceData = workshop.context?.intelligenceAnalysis as any;
        const opportunities = intelligenceData?.opportunities || [];

        const record: BackupRecord = {
            workshopId: workshop.id,
            workshopName: workshop.clientName,
            opportunityCount: opportunities.length,
            opportunities: opportunities,
            exportedAt: new Date().toISOString()
        };

        summary.push(record);
        totalJsonOpportunities += opportunities.length;

        // Write individual workshop backup
        const workshopFile = path.join(backupDir, `workshop_${workshop.id}.json`);
        fs.writeFileSync(workshopFile, JSON.stringify(record, null, 2));

        console.log(`✅ ${workshop.clientName}: ${opportunities.length} ideas in JSON`);
    }

    // 3. Get SQL Opportunity counts for comparison
    const sqlOpportunities = await prisma.opportunity.findMany({
        select: {
            id: true,
            workshopId: true,
            projectName: true,
            originId: true,
            promotionStatus: true
        }
    });

    console.log(`\n📈 SQL Opportunity table: ${sqlOpportunities.length} records`);
    console.log(`📈 JSON intelligenceAnalysis: ${totalJsonOpportunities} records`);

    // 4. Write summary file
    const summaryData = {
        exportedAt: new Date().toISOString(),
        workshopCount: workshops.length,
        totalJsonOpportunities,
        totalSqlOpportunities: sqlOpportunities.length,
        workshopSummaries: summary.map(s => ({
            workshopId: s.workshopId,
            workshopName: s.workshopName,
            jsonCount: s.opportunityCount
        })),
        sqlOpportunities: sqlOpportunities
    };

    const summaryFile = path.join(backupDir, 'BACKUP_SUMMARY.json');
    fs.writeFileSync(summaryFile, JSON.stringify(summaryData, null, 2));

    console.log(`\n✅ Backup complete! Files saved to: ${backupDir}`);
    console.log(`📄 Summary file: ${summaryFile}\n`);

    // 5. Verification output
    console.log('='.repeat(50));
    console.log('VERIFICATION CHECKLIST');
    console.log('='.repeat(50));
    console.log(`☐ JSON opportunities backed up: ${totalJsonOpportunities}`);
    console.log(`☐ SQL opportunities recorded: ${sqlOpportunities.length}`);
    console.log(`☐ Backup directory: ${backupDir}`);
    console.log('='.repeat(50));

    await prisma.$disconnect();
}

backupIdeationData().catch(console.error);
