import { z } from 'zod';

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
  workshopId: z.string().uuid('Invalid workshop ID'),
  projectName: z.string().min(1, 'Project name is required').max(200, 'Project name too long'),
  description: z.string().optional(),
  frictionStatement: z.string().min(1, 'Friction statement is required'),
  strategicHorizon: z.enum(['GROWTH', 'OPS', 'STRATEGY'], {
    message: 'Strategic horizon must be GROWTH, OPS, or STRATEGY',
  }),
  whyDoIt: z.string().min(1, 'Why do it is required'),
  notes: z.string().optional(),

  // VRCC Scores (Value, Capability, Complexity, Risk)
  vrcc: z.object({
    value: z.number().int().min(1).max(5, 'Value score must be between 1-5'),
    capability: z.number().int().min(1).max(5, 'Capability score must be between 1-5'),
    complexity: z.number().int().min(1).max(5, 'Complexity score must be between 1-5'),
    riskFinal: z.number().int().min(0).max(5, 'Risk final score must be between 0-5'),
    riskAI: z.number().int().min(0).max(5, 'Risk AI score must be between 0-5').optional(),
    riskOverrideLog: z.string().optional(),
  }),

  tShirtSize: z.enum(['XS', 'S', 'M', 'L', 'XL'], {
    message: 'T-shirt size must be XS, S, M, L, or XL',
  }),

  // Financials
  benefitRevenue: z.number().nonnegative('Revenue must be positive').optional().nullable(),
  benefitCostAvoidance: z.number().nonnegative('Cost avoidance must be positive').optional().nullable(),
  benefitEstCost: z.number().nonnegative('Estimated cost must be positive').optional().nullable(),
  benefitEfficiency: z.number().nonnegative('Efficiency must be positive').optional().nullable(),
  benefitTimeframe: z.enum(['Monthly', 'Annually']).optional(),

  // Execution Fields
  definitionOfDone: z.string().min(1, 'Definition of done is required'),
  keyDecisions: z.string().min(1, 'Key decisions are required'),
  impactedSystems: z.array(z.string()).optional(),
  systemGuardrails: z.string().optional(),
  aiOpsRequirements: z.string().optional(),
  changeManagement: z.string().optional(),
  trainingRequirements: z.string().optional(),

  // Capabilities
  capabilitiesExisting: z.array(z.string()).optional(),
  capabilitiesMissing: z.array(z.string()).optional(),

  // Workflow Phases (JSON array)
  workflowPhases: z.array(z.object({
    name: z.string(),
    autonomy: z.string().optional(),
    guardrail: z.string().optional(),
  })).optional(),

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
  strategicHorizon: z.enum(['GROWTH', 'OPS', 'STRATEGY']).optional(),
  whyDoIt: z.string().optional(),
  notes: z.string().optional(),

  // Scores (all optional for partial updates)
  scoreValue: z.number().int().min(1).max(5).optional(),
  scoreCapability: z.number().int().min(1).max(5).optional(),
  scoreComplexity: z.number().int().min(1).max(5).optional(),
  scoreRiskFinal: z.number().int().min(0).max(5).optional(),
  scoreRiskAI: z.number().int().min(0).max(5).optional(),

  // Other fields
  tShirtSize: z.enum(['XS', 'S', 'M', 'L', 'XL']).optional(),
  sequenceRank: z.number().int().min(1).optional(),
  boardX: z.number().optional(),
  boardY: z.number().optional(),
  boardStatus: z.enum(['inbox', 'placed', 'archived']).optional(),
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
  workflowPhases: z.array(z.object({
    name: z.string(),
    autonomy: z.string().optional(),
    guardrail: z.string().optional(),
  })).optional(),
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

export const recommendCapabilitiesSchema = z.any().refine(
  (data) => data !== null && data !== undefined && typeof data === 'object',
  { message: 'Workflow context must be a valid object' }
);

// ============================================================================
// Board Position Update Schema
// ============================================================================

export const updateBoardPositionSchema = z.object({
  workshopId: z.string().uuid(),
  opportunityId: z.string().uuid(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
});

// ============================================================================
// Wave Update Schema
// ============================================================================

export const updateWaveSchema = z.object({
  id: z.string().uuid(),
  newRank: z.number().int().min(1),
  justification: z.string().min(1),
  workshopId: z.string().uuid(),
});

// ============================================================================
// Promotion Schema
// ============================================================================

export const promotionSchema = z.object({
  workshopId: z.string().uuid(),
  opportunityIds: z.array(z.string().uuid()).min(1),
  keepInIdeation: z.boolean().optional(),
});

// ============================================================================
// Delete Schemas
// ============================================================================

export const deleteOpportunitySchema = z.object({
  opportunityId: z.string().uuid(),
  workshopId: z.string().uuid(),
});

export const deleteWorkshopSchema = z.object({
  id: z.string().uuid(),
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Validate data against a Zod schema and return structured result
 *
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Validation result with success flag, data, and errors
 */
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  errors?: string[];
} {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return {
      success: false,
      errors: result.error.issues.map(e => `${e.path.join('.')}: ${e.message}`),
    };
  }
}
