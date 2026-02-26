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
    errorMap: () => ({ message: 'Strategic horizon must be GROWTH, OPS, or STRATEGY' }),
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
    errorMap: () => ({ message: 'T-shirt size must be XS, S, M, L, or XL' }),
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
      errors: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
    };
  }
}
