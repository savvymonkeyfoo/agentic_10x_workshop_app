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
 * - AI_MODEL_GENERAL: Model for general AI tasks (default: gemini-2.5-flash)
 * - AI_MODEL_EMBEDDING: Model for vector embeddings (default: text-embedding-004)
 * 
 * Recommended Settings:
 * - Development: gemini-2.5-flash for all (cost savings)
 * - Production: gemini-3-flash (audit/general) + gemini-3-pro (strategic)
 */

// =============================================================================
// MODEL IDENTIFIERS (from environment or defaults)
// =============================================================================

export const MODEL_IDS = {
    // Audit Layer: Optimized for extraction accuracy and speed
    AUDIT: process.env.AI_MODEL_AUDIT || 'gemini-2.5-flash',

    // Strategic Layer: Optimized for complex problem-solving
    STRATEGIC: process.env.AI_MODEL_STRATEGIC || 'gemini-2.5-pro',

    // General Layer: For canvas optimization, workshop analysis, etc.
    GENERAL: process.env.AI_MODEL_GENERAL || 'gemini-2.5-flash',

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
     * Used for: Technical Audit step in Supreme Scout
     * Optimized for: Speed, accuracy, factual extraction
     */
    auditModel: google(MODEL_IDS.AUDIT),

    /**
     * Strategic Model (gemini-3-pro or gemini-2.5-pro)
     * 
     * Used for: Gap Analysis, Brief Architecture
     * Optimized for: Deep reasoning, complex problem-solving
     */
    strategicModel: google(MODEL_IDS.STRATEGIC),

    /**
     * General Model (gemini-2.5-flash or gemini-3-flash)
     * 
     * Used for: Canvas optimization, workshop analysis, recommendations
     * Optimized for: Speed, cost efficiency
     */
    generalModel: google(MODEL_IDS.GENERAL),

    /**
     * Embedding Model (text-embedding-004)
     * 
     * Used for: Vector search in Pinecone
     * Output: 768-dimensional embeddings
     */
    embeddingModel: google.textEmbeddingModel(MODEL_IDS.EMBEDDING),

    /**
     * Raw model identifiers (for logging/debugging or custom google() calls)
     */
    identifiers: MODEL_IDS,
} as const;

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type AuditModel = typeof AI_CONFIG.auditModel;
export type StrategicModel = typeof AI_CONFIG.strategicModel;
export type GeneralModel = typeof AI_CONFIG.generalModel;
export type EmbeddingModel = typeof AI_CONFIG.embeddingModel;
