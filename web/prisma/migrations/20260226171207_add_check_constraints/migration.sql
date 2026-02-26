-- Add CHECK constraints for score ranges
ALTER TABLE "Opportunity"
ADD CONSTRAINT "Opportunity_scoreValue_check"
CHECK ("scoreValue" >= 1 AND "scoreValue" <= 5);

ALTER TABLE "Opportunity"
ADD CONSTRAINT "Opportunity_scoreCapability_check"
CHECK ("scoreCapability" >= 1 AND "scoreCapability" <= 5);

ALTER TABLE "Opportunity"
ADD CONSTRAINT "Opportunity_scoreComplexity_check"
CHECK ("scoreComplexity" >= 1 AND "scoreComplexity" <= 5);

ALTER TABLE "Opportunity"
ADD CONSTRAINT "Opportunity_scoreRiskFinal_check"
CHECK ("scoreRiskFinal" >= 0 AND "scoreRiskFinal" <= 5);

ALTER TABLE "Opportunity"
ADD CONSTRAINT "Opportunity_scoreRiskAI_check"
CHECK ("scoreRiskAI" >= 0 AND "scoreRiskAI" <= 5);

-- Add CHECK constraints for enum-like fields
ALTER TABLE "Opportunity"
ADD CONSTRAINT "Opportunity_strategicHorizon_check"
CHECK ("strategicHorizon" IN ('GROWTH', 'OPS', 'STRATEGY', ''));

ALTER TABLE "Opportunity"
ADD CONSTRAINT "Opportunity_tShirtSize_check"
CHECK ("tShirtSize" IN ('XS', 'S', 'M', 'L', 'XL'));

ALTER TABLE "Opportunity"
ADD CONSTRAINT "Opportunity_boardStatus_check"
CHECK ("boardStatus" IS NULL OR "boardStatus" IN ('inbox', 'placed', 'archived'));

ALTER TABLE "Opportunity"
ADD CONSTRAINT "Opportunity_promotionStatus_check"
CHECK ("promotionStatus" IS NULL OR "promotionStatus" = 'PROMOTED');

-- Add CHECK constraints for financial fields (must be non-negative)
ALTER TABLE "Opportunity"
ADD CONSTRAINT "Opportunity_benefitRevenue_check"
CHECK ("benefitRevenue" IS NULL OR "benefitRevenue" >= 0);

ALTER TABLE "Opportunity"
ADD CONSTRAINT "Opportunity_benefitCostAvoidance_check"
CHECK ("benefitCostAvoidance" IS NULL OR "benefitCostAvoidance" >= 0);

ALTER TABLE "Opportunity"
ADD CONSTRAINT "Opportunity_benefitEstCost_check"
CHECK ("benefitEstCost" IS NULL OR "benefitEstCost" >= 0);

ALTER TABLE "Opportunity"
ADD CONSTRAINT "Opportunity_benefitEfficiency_check"
CHECK ("benefitEfficiency" IS NULL OR "benefitEfficiency" >= 0);

-- Add CHECK constraints for board coordinates (must be non-negative if set)
ALTER TABLE "Opportunity"
ADD CONSTRAINT "Opportunity_boardX_check"
CHECK ("boardX" IS NULL OR "boardX" >= 0);

ALTER TABLE "Opportunity"
ADD CONSTRAINT "Opportunity_boardY_check"
CHECK ("boardY" IS NULL OR "boardY" >= 0);
