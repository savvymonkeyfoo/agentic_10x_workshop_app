export interface UnifiedOpportunity {
    // Core Identity
    id: string; // The "card-id" used in the UI
    originalId: string; // The ID from the Analysis or Backlog
    title: string;
    description: string;
    source: "CLIENT_BACKLOG" | "MARKET_SIGNAL" | "WORKSHOP_GENERATED" | "MERGED";

    // Intelligence Layer (Rich Text)
    // Optional because early stage ideas might not have them
    friction?: string;
    techAlignment?: string;
    strategyAlignment?: string;

    // Ideation Layer (Spatial)
    // Optional specifically for the "Type Guard" migration (legacy data compatibility)
    boardPosition?: {
        x: number;
        y: number
    };
    boardStatus?: "inbox" | "placed" | "archived"; // Default to 'inbox' if undefined

    // Prioritization Layer (Future Proofing)
    tier?: "UNSCORED" | "AGENTIC_AUTO" | "TABLE_STAKES" | "STRATEGIC_BET";
    scores?: {
        desirability: number;
        feasibility: number;
        viability: number;
    };

    // Legacy / Extra Fields (Preserved for compatibility if needed)
    lenses?: string[];

    // Captured Data (Agentic Enrichment)
    businessCase?: string;
    workflowData?: any;
    executionPlan?: string;

    // Lineage
    originId?: string;
    promotionStatus?: string;
}

// Re-export as Opportunity for backward compatibility if needed, 
// though we should migrate calls to use UnifiedOpportunity
export type Opportunity = UnifiedOpportunity;
