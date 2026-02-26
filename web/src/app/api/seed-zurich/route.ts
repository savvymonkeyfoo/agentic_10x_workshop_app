
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Assuming this exists, based on earlier file reads

export async function GET() {
    // Security: Block seed endpoint in production to prevent data deletion
    if (process.env.NODE_ENV === 'production') {
        console.warn('[seed-zurich] Attempted access in production environment - blocked');
        return NextResponse.json(
            {
                error: 'Seed endpoint not available in production',
                details: 'This endpoint is only available in development environments'
            },
            { status: 403 }
        );
    }

    try {
        console.log('🚑 Starting Surgical Data Repair for "Zurich Insurance Australia"...');

        // 1. Find the target workshop
        const workshop = await prisma.workshop.findFirst({
            where: {
                clientName: 'Zurich Insurance Australia'
            }
        });

        if (!workshop) {
            return NextResponse.json({ error: 'Could not find "Zurich Insurance Australia"' }, { status: 404 });
        }

        // 2. Define High-Fidelity Data
        const opportunities = [
            {
                projectName: 'Smart Claims Triage Bot',
                frictionStatement: 'Claims adjusters spend 40% of their day categorizing inbound emails.',
                strategicHorizon: 'Operational Throughput',
                whyDoIt: 'Reduce FNOL processing time from 3 days to 30 minutes.',

                scoreValue: 5, scoreComplexity: 3, scoreCapability: 4, scoreRiskFinal: 2,
                benefitCostAvoidance: 1200000, benefitEfficiency: 8000,

                dfvAssessment: {
                    desirability: { score: 5, justification: "Adjusters are begging for this." },
                    feasibility: { score: 5, justification: "Azure OpenAI is approved." },
                    viability: { score: 5, justification: "ROI in < 3 months." }
                },
                workflowPhases: [
                    { name: "Ingest", description: "Monitor inbound claims@zurich.com.au inbox." },
                    { name: "Classify", description: "LLM extracts Policy Number and Incident Type." },
                    { name: "Route", description: "API pushes ticket to Claims Center queue." }
                ],
                capabilitiesExisting: ["Outlook 365 API", "Claims Center DB"],
                capabilitiesMissing: ["Azure OpenAI GPT-4", "Sentiment Analysis Model"],
                definitionOfDone: "90% of inbound emails classified correctly without human touch.",
                keyDecisions: "Build vs Buy: Build using Azure stack to keep data local.",
                aiOpsRequirements: "Standard Tier GPU instance for inference.",
                changeManagement: "Update SOPs for adjusters to stop checking shared inboxes.",
                trainingRequirements: "1-hour workshop for Claims Leads.",
                systemGuardrails: "If confidence < 85%, route to 'Manual Review' queue.",
                tShirtSize: "M",
                strategicRationale: "AS A Claims Adjuster, I WANT TO have emails auto-sorted, SO THAT I can focus on complex cases."
            },
            {
                projectName: 'Underwriter Co-Pilot',
                frictionStatement: 'Underwriters drown in 50+ page PDFs.',
                strategicHorizon: 'Strategic Advantage',
                whyDoIt: 'Quote 2x more policies per week.',

                scoreValue: 5, scoreComplexity: 4, scoreCapability: 2, scoreRiskFinal: 3,
                benefitRevenue: 5000000, benefitEfficiency: 15000,
                dfvAssessment: {
                    desirability: { score: 5, justification: "Critical for reducing backlog." },
                    feasibility: { score: 4, justification: "Need to validate OCR accuracy." },
                    viability: { score: 5, justification: "Direct impact on GWP." }
                },
                workflowPhases: [
                    { name: "Upload", description: "Underwriter uploads Broker submission PDF." },
                    { name: "Analyze", description: "Agent extracts risk factors (flood, fire)." },
                    { name: "Draft", description: "System proposes clauses and pricing." }
                ],
                capabilitiesExisting: ["SharePoint", "Rating Engine"],
                capabilitiesMissing: ["Vector Database", "RAG Pipeline"],
                definitionOfDone: "Summarize 50-page risk report in under 30 seconds.",
                keyDecisions: "Model: Use Claude 3.5 Sonnet for better reasoning.",
                aiOpsRequirements: "Pinecone Vector DB.",
                changeManagement: "Shift from 'Data Entry' to 'Risk Review' mindset.",
                trainingRequirements: "Prompt Engineering basics for Underwriters.",
                systemGuardrails: "Copilot cannot issue quote—only Human can approve.",
                tShirtSize: "L",
                strategicRationale: "AS AN Underwriter, I WANT TO instantly see risk highlights, SO THAT I can quote faster."
            },
            {
                projectName: 'Fraud Pattern Sentinel',
                frictionStatement: 'Fraud rings evolving faster than rules engines.',
                strategicHorizon: 'Growth & Scalability',
                whyDoIt: 'Reduce leakage by identifying cross-claim patterns.',

                scoreValue: 5, scoreComplexity: 5, scoreCapability: 3, scoreRiskFinal: 4,
                benefitCostAvoidance: 8000000,
                dfvAssessment: {
                    desirability: { score: 4, justification: "Fraud team is interested." },
                    feasibility: { score: 3, justification: "Complex graph data required." },
                    viability: { score: 5, justification: "Massive cost saving potential." }
                },
                workflowPhases: [
                    { name: "Scan", description: "Ingest daily claim transaction logs." },
                    { name: "Graph", description: "Link entities by IP, Phone, and Device ID." },
                    { name: "Alert", description: "Flag connected clusters > 3 nodes." }
                ],
                capabilitiesExisting: ["Data Lake", "Splunk"],
                capabilitiesMissing: ["Neo4j Graph DB", "Real-time Inference"],
                definitionOfDone: "Identify 10 known fraud rings in historical test data.",
                keyDecisions: "Privacy: How to handle PII in graph analysis.",
                aiOpsRequirements: "High Memory nodes for Graph processing.",
                changeManagement: "New workflow for SIU (Special Investigations Unit).",
                trainingRequirements: "Graph visualization tool training.",
                systemGuardrails: "Human review required before freezing payments.",
                tShirtSize: "XL",
                strategicRationale: "AS A Fraud Analyst, I WANT TO see hidden connections, SO THAT I can stop syndicates."
            },
            {
                projectName: 'Policy Renewal Agent',
                frictionStatement: 'Small business policies churn due to lack of engagement.',
                strategicHorizon: 'Growth & Scalability',
                whyDoIt: 'Increase retention by 15% via proactive outreach.',

                scoreValue: 4, scoreComplexity: 2, scoreCapability: 5, scoreRiskFinal: 2,
                benefitRevenue: 2500000, benefitEfficiency: 2000,
                dfvAssessment: {
                    desirability: { score: 3, justification: "Brokers might resist automation." },
                    feasibility: { score: 5, justification: "Email APIs already exist." },
                    viability: { score: 5, justification: "Low cost, high return." }
                },
                workflowPhases: [
                    { name: "Trigger", description: "Identify policy expiring in 60 days." },
                    { name: "Draft", description: "Generate personalized renewal offer." },
                    { name: "Send", description: "Email Broker with pre-filled renewal." }
                ],
                capabilitiesExisting: ["Salesforce", "SendGrid"],
                capabilitiesMissing: ["None"],
                definitionOfDone: "Auto-send 100% of SME renewal emails.",
                keyDecisions: "Opt-out mechanism for Brokers.",
                aiOpsRequirements: "Serverless functions.",
                changeManagement: "Sales team to focus on 'at-risk' clients only.",
                trainingRequirements: "None.",
                systemGuardrails: "Max 1 email per week per client.",
                tShirtSize: "S",
                strategicRationale: "AS A Retention Lead, I WANT TO auto-engage small clients, SO THAT they don't churn."
            }
        ];

        // 3. Inject Data
        await prisma.opportunity.deleteMany({
            where: { workshopId: workshop.id }
        });

        for (const op of opportunities) {
            await prisma.opportunity.create({
                data: {
                    ...op,
                    workshopId: workshop.id,
                    impactedSystems: []
                }
            });
        }

        return NextResponse.json({ success: true, message: `Successfully fully restored ${workshop.clientName}` });
    } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : 'Unknown error';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
