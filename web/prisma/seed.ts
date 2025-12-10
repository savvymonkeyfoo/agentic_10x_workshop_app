import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

async function main() {
    console.log('Start seeding ...')

    // Read seed_data.json
    // Note: Adjust the path if necessary depending on where you run this script from
    const seedDataPath = path.join(process.cwd(), '../assets/seed_data.json')
    const rawData = fs.readFileSync(seedDataPath, 'utf8')
    const data = JSON.parse(rawData)

    // Create Workshop
    const workshop = await prisma.workshop.create({
        data: {
            id: data.workshop_id, // Use ID from seed data if permitted, otherwise let UUID generate and map it
            clientName: data.client_name,
            status: data.status,
        }
    })
    console.log(`Created Workshop: ${workshop.clientName} (${workshop.id})`)

    // Create Opportunities
    for (const opp of data.opportunities) {
        const createdOpp = await prisma.opportunity.create({
            data: {
                id: opp.opportunity_id,
                workshopId: workshop.id,
                projectName: opp.project_name,
                frictionStatement: opp.friction_statement,
                strategicHorizon: opp.strategic_horizon,
                whyDoIt: opp.why_do_it,
                tShirtSize: opp.t_shirt_size,

                // Agent Directive (JSON)
                agentDirective: opp.agent_directive,

                // Scores
                scoreValue: opp.vrcc_scores.value,
                scoreCapability: opp.vrcc_scores.capability,
                scoreComplexity: opp.vrcc_scores.complexity,
                scoreRiskFinal: opp.vrcc_scores.risk_final,
                scoreRiskAI: opp.vrcc_scores.risk_ai_recommended,
                riskOverrideLog: opp.vrcc_scores.risk_override_log,

                // Benefits
                benefitRevenue: opp.quantitative_benefits.annual_revenue,
                benefitCost: opp.quantitative_benefits.cost_reduction,
                benefitEfficiency: opp.quantitative_benefits.efficiency_hours_week,

                // DFV
                dfvDesirability: opp.dfv_assessment.desirability,
                dfvFeasibility: opp.dfv_assessment.feasibility,
                dfvViability: opp.dfv_assessment.viability,

                // Execution
                definitionOfDone: opp.execution_details.definition_of_done,
                keyDecisions: opp.execution_details.key_decisions,
                impactedSystems: opp.execution_details.impacted_systems,

                // UI State (Optional in schema, but defined in seed - we might ignore or add if schema supported)
            }
        })

        // Create Capabilities
        if (opp.capabilities.consumed_capabilities) {
            for (const cap of opp.capabilities.consumed_capabilities) {
                await prisma.capabilityConsumed.create({
                    data: {
                        opportunityId: createdOpp.id,
                        name: cap.name,
                        status: cap.status
                    }
                })
            }
        }

        if (opp.capabilities.produced_capabilities) {
            for (const capName of opp.capabilities.produced_capabilities) {
                await prisma.capabilityProduced.create({
                    data: {
                        opportunityId: createdOpp.id,
                        name: capName
                    }
                })
            }
        }

        console.log(`Created Opportunity: ${createdOpp.projectName}`)
    }

    console.log('Seeding finished.')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
