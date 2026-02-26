import { z } from 'zod';

// ============================================================================
// Reusable Schema Components
// ============================================================================

// UUID validators
const uuidSchema = z.string().uuid();

// Enum schemas
const strategicHorizonEnum = z.enum(['GROWTH', 'OPS', 'STRATEGY'], {
  message: 'Strategic horizon must be GROWTH, OPS, or STRATEGY',
});

const tShirtSizeEnum = z.enum(['XS', 'S', 'M', 'L', 'XL'], {
  message: 'T-shirt size must be XS, S, M, L, or XL',
});

const boardStatusEnum = z.enum(['inbox', 'placed', 'archived']);

// Workflow phase schema (reusable)
const workflowPhaseSchema = z.object({
  name: z.string(),
  autonomy: z.string().optional(),
  guardrail: z.string().optional(),
});

// Score validators (1-5 range)
const scoreSchema = z.number().int().min(1).max(5);
const riskScoreSchema = z.number().int().min(0).max(5);

// ============================================================================
// Workshop Validation Schemas
// ============================================================================

export const createWorkshopSchema = z.object({
  clientName: z.string().min(1, 'Client name is required').max(100, 'Client name too long'),
  clientLogoUrl: z.string().url('Invalid URL').optional().nullable(),
  workshopDate: z.string().datetime('Invalid date format'),
});

// ============================================================================
// Opportunity Validation Schemas
// ============================================================================

export const saveOpportunitySchema = z.object({
  workshopId: uuidSchema,
  projectName: z.string().min(1, 'Project name is required').max(200, 'Project name too long'),
  description: z.string().optional(),
  frictionStatement: z.string().optional(),
  strategicHorizon: strategicHorizonEnum.optional(),
  whyDoIt: z.string().optional(),
  notes: z.string().optional(),

  // VRCC Scores (Value, Capability, Complexity, Risk) - optional for initial save
  vrcc: z.object({
    value: scoreSchema,
    capability: scoreSchema,
    complexity: scoreSchema,
    riskFinal: riskScoreSchema,
    riskAI: riskScoreSchema.optional(),
    riskOverrideLog: z.string().optional(),
  }).optional(),

  tShirtSize: tShirtSizeEnum.optional(),

  // Financials
  benefitRevenue: z.number().nonnegative('Revenue must be positive').optional().nullable(),
  benefitCostAvoidance: z.number().nonnegative('Cost avoidance must be positive').optional().nullable(),
  benefitEstCost: z.number().nonnegative('Estimated cost must be positive').optional().nullable(),
  benefitEfficiency: z.number().nonnegative('Efficiency must be positive').optional().nullable(),
  benefitTimeframe: z.enum(['Monthly', 'Annually']).optional(),

  // Execution Fields - optional for initial save
  definitionOfDone: z.string().optional(),
  keyDecisions: z.string().optional(),
  impactedSystems: z.array(z.string()).optional(),
  systemGuardrails: z.string().optional(),
  aiOpsRequirements: z.string().optional(),
  changeManagement: z.string().optional(),
  trainingRequirements: z.string().optional(),

  // Capabilities
  capabilitiesExisting: z.array(z.string()).optional(),
  capabilitiesMissing: z.array(z.string()).optional(),

  // Workflow Phases (JSON array)
  workflowPhases: z.array(workflowPhaseSchema).optional(),

  // Narrative Fields
  businessCase: z.string().optional(),
  executionPlan: z.string().optional(),
  techAlignment: z.string().optional(),
  strategyAlignment: z.string().optional(),
});

// ============================================================================
// Update Opportunity Schema (for partial updates)
// ============================================================================

export const updateOpportunitySchema = z.object({
  projectName: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  frictionStatement: z.string().optional(),
  strategicHorizon: strategicHorizonEnum.optional(),
  whyDoIt: z.string().optional(),
  notes: z.string().optional(),

  // Scores (all optional for partial updates)
  scoreValue: scoreSchema.optional(),
  scoreCapability: scoreSchema.optional(),
  scoreComplexity: scoreSchema.optional(),
  scoreRiskFinal: riskScoreSchema.optional(),
  scoreRiskAI: riskScoreSchema.optional(),

  // Other fields
  tShirtSize: tShirtSizeEnum.optional(),
  sequenceRank: z.number().int().min(1).optional(),
  boardX: z.number().optional(),
  boardY: z.number().optional(),
  boardStatus: boardStatusEnum.optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: "At least one field must be provided for update"
});

// ============================================================================
// Canvas Optimization Schema
// ============================================================================

export const optimizeCanvasSchema = z.object({
  projectName: z.string().min(1),
  strategicHorizon: z.string(),
  frictionStatement: z.string(),
  strategicRationale: z.string().optional(),
  whyDoIt: z.string().optional(),
  systemGuardrails: z.string().optional(),
  workflowPhases: z.array(workflowPhaseSchema).optional(),
});

// ============================================================================
// Execution Plan Schema
// ============================================================================

export const draftExecutionSchema = z.object({
  name: z.string().optional(),
  friction: z.string().optional(),
  strategy: z.string().optional(),
  revenue: z.union([z.number(), z.string()]).optional(),
  costAvoidance: z.union([z.number(), z.string()]).optional(),
  phases: z.array(z.any()).optional(),
});

// ============================================================================
// Capability Recommendation Schema
// ============================================================================

export const recommendCapabilitiesSchema = z.object({
  projectName: z.string().optional(),
  frictionStatement: z.string().optional(),
  strategicHorizon: z.string().optional(),
  workflowPhases: z.array(workflowPhaseSchema).optional(),
}).passthrough(); // Allow additional properties for flexibility

// ============================================================================
// Board Position Update Schema
// ============================================================================

export const updateBoardPositionSchema = z.object({
  workshopId: uuidSchema,
  opportunityId: uuidSchema,
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
});

// ============================================================================
// Wave Update Schema
// ============================================================================

export const updateWaveSchema = z.object({
  id: uuidSchema,
  newRank: z.number().int().min(1),
  justification: z.string().min(1),
  workshopId: uuidSchema,
});

// ============================================================================
// Promotion Schema
// ============================================================================

export const promotionSchema = z.object({
  workshopId: uuidSchema,
  opportunityIds: z.array(uuidSchema).min(1),
  keepInIdeation: z.boolean().optional(),
});

// ============================================================================
// Delete Schemas
// ============================================================================

export const deleteOpportunitySchema = z.object({
  opportunityId: uuidSchema,
  workshopId: uuidSchema,
});

export const deleteWorkshopSchema = z.object({
  id: uuidSchema,
});

// ============================================================================
// Helper Functions
// ============================================================================
