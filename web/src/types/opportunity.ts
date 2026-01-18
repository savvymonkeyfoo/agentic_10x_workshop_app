/**
 * UnifiedOpportunity - The canonical type for opportunity data
 * 
 * This now aligns with the SQL Opportunity table structure.
 * The old JSON-based storage has been migrated to SQL.
 */
export interface UnifiedOpportunity {
    // Core Identity
    id: string;
    originalId: string;
    title: string;
    description: string; // The Problem / Friction Statement
    proposedSolution?: string | null; // The Proposed Solution
    notes?: string | null; // Facilitator Notes
    source?: string | null; // CLIENT_BACKLOG, MARKET_SIGNAL, WORKSHOP_GENERATED, MERGED

    // Intelligence Layer (Rich Text)
    friction?: string | null;
    techAlignment?: string | null;
    strategyAlignment?: string | null;

    // Visibility Flags (where does this item appear?)
    showInIdeation?: boolean;
    showInCapture?: boolean;

    // Ideation Layer (Spatial)
    boardPosition?: {
        x: number | null;
        y: number | null;
    };
    boardStatus?: string | null; // inbox, placed, archived

    // Prioritization Layer
    tier?: string | null; // UNSCORED, AGENTIC_AUTO, TABLE_STAKES, STRATEGIC_BET
    scores?: {
        desirability: number;
        feasibility: number;
        viability: number;
    };

    // Captured Data (Agentic Enrichment)
    businessCase?: string | null;
    workflowData?: any;
    executionPlan?: string | null;

    // Lineage
    originId?: string | null;
    promotionStatus?: string | null;
}

// Re-export as Opportunity for backward compatibility
export type Opportunity = UnifiedOpportunity;
