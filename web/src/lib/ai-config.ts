import { google } from '@ai-sdk/google';

/**
 * CENTRAL AI CONFIGURATION HUB
 * 
 * Purpose: Abstract model selection to enable zero-downtime model upgrades.
 * 
 * Usage:
 * - Update models via environment variables (no code changes required)
 * - Toggle features like Deep Think mode for strategic reasoning
 * - Swap between Flash (speed/cost) and Pro (reasoning depth)
 * 
 * Environment Variables:
 * - AI_MODEL_AUDIT: Model for Technical Audit (default: gemini-2.5-flash)
 * - AI_MODEL_STRATEGIC: Model for Gap Analysis & Briefs (default: gemini-2.5-pro)
 * - AI_MODEL_EMBEDDING: Model for vector embeddings (default: text-embedding-004)
 * 
 * Recommended Settings:
 * - Development: gemini-2.5-flash for both (cost savings)
 * - Production: gemini-3-flash (audit) + gemini-3-pro (strategic)
 */

// =============================================================================
// MODEL IDENTIFIERS (from environment or defaults)
// =============================================================================

const MODEL_IDS = {
    // Audit Layer: Optimized for extraction accuracy and speed
    AUDIT: process.env.AI_MODEL_AUDIT || 'gemini-2.5-flash',

    // Strategic Layer: Optimized for complex problem-solving
    STRATEGIC: process.env.AI_MODEL_STRATEGIC || 'gemini-2.5-pro',

    // Embedding Layer: For vector search
    EMBEDDING: process.env.AI_MODEL_EMBEDDING || 'text-embedding-004',
} as const;

// =============================================================================
// CONFIGURED MODELS (ready to use in generateText/embed calls)
// =============================================================================

export const AI_CONFIG = {
    /**
     * Audit Model (gemini-3-flash or gemini-2.5-flash)
     * 
     * Used for: Technical Audit step
     * Optimized for: Speed, accuracy, factual extraction
     * 
     * Recommended:
     * - Dev/Preview: gemini-2.5-flash (cost savings)
     * - Production: gemini-3-flash (reasoning-native extraction)
     */
    auditModel: google(MODEL_IDS.AUDIT),

    /**
     * Strategic Model (gemini-3-pro or gemini-2.5-pro)
     * 
     * Used for: Gap Analysis, Brief Architecture
     * Optimized for: Deep reasoning, complex problem-solving
     * 
     * Recommended:
     * - Dev/Preview: gemini-2.5-flash (cost savings)
     * - Production: gemini-3-pro (Deep Think mode)
     */
    strategicModel: google(MODEL_IDS.STRATEGIC),

    /**
     * Embedding Model (text-embedding-004)
     * 
     * Used for: Vector search in Pinecone
     * Output: 768-dimensional embeddings
     */
    embeddingModel: google.textEmbeddingModel(MODEL_IDS.EMBEDDING),

    /**
     * Current model identifiers (for logging/debugging)
     */
    identifiers: MODEL_IDS,
} as const;

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type AuditModel = typeof AI_CONFIG.auditModel;
export type StrategicModel = typeof AI_CONFIG.strategicModel;
export type EmbeddingModel = typeof AI_CONFIG.embeddingModel;
