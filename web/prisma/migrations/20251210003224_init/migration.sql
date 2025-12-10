-- CreateTable
CREATE TABLE "Workshop" (
    "id" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'INPUT',

    CONSTRAINT "Workshop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Opportunity" (
    "id" TEXT NOT NULL,
    "workshopId" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "frictionStatement" TEXT NOT NULL,
    "strategicHorizon" TEXT NOT NULL,
    "whyDoIt" TEXT NOT NULL,
    "agentDirective" JSONB NOT NULL,
    "scoreValue" INTEGER NOT NULL,
    "scoreCapability" INTEGER NOT NULL,
    "scoreComplexity" INTEGER NOT NULL,
    "scoreRiskFinal" INTEGER NOT NULL DEFAULT 0,
    "scoreRiskAI" INTEGER NOT NULL DEFAULT 0,
    "riskOverrideLog" TEXT,
    "tShirtSize" TEXT NOT NULL,
    "benefitRevenue" DOUBLE PRECISION,
    "benefitCost" DOUBLE PRECISION,
    "benefitEfficiency" DOUBLE PRECISION,
    "dfvDesirability" TEXT NOT NULL,
    "dfvFeasibility" TEXT NOT NULL,
    "dfvViability" TEXT NOT NULL,
    "definitionOfDone" TEXT NOT NULL,
    "keyDecisions" TEXT NOT NULL,
    "impactedSystems" TEXT[],
    "sequenceRank" INTEGER,
    "matrixX" DOUBLE PRECISION,
    "matrixY" DOUBLE PRECISION,

    CONSTRAINT "Opportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CapabilityConsumed" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "CapabilityConsumed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CapabilityProduced" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "CapabilityProduced_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_workshopId_fkey" FOREIGN KEY ("workshopId") REFERENCES "Workshop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapabilityConsumed" ADD CONSTRAINT "CapabilityConsumed_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapabilityProduced" ADD CONSTRAINT "CapabilityProduced_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
