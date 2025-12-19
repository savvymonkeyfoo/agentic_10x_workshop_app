import { google } from '@ai-sdk/google';

/**
 * CENTRAL AI CONFIGURATION HUB
 * 
 * GEMINI 3 SUPREME SCOUT ARCHITECTURE
 * 
 * Model Strategy:
 * - Flash: PhD-level reasoning with 3x speed (audit, extraction)
 * - Pro: Deep Think mode for extended reasoning chains (strategy, briefs)
 * 
 * Thinking Levels (Gemini 3):
 * - minimal: No thinking, fastest (Flash only)
 * - low: Minimal reasoning, reduced latency
 * - medium: Balanced reasoning (Flash only)
 * - high: Maximum reasoning depth (default for strategic)
 * 
 * Environment Variables:
 * - AI_MODEL_AUDIT: Technical Audit (default: gemini-3-flash-preview)
 * - AI_MODEL_STRATEGIC: Gap Analysis & Briefs (default: gemini-3-pro-preview)
 * - AI_MODEL_GENERAL: Canvas/Workshop tasks (default: gemini-3-flash-preview)
 * - AI_MODEL_EMBEDDING: Vector search (default: text-embedding-004)
 * - AI_THINKING_LEVEL: Reasoning depth (default: high)
 */

// =============================================================================
// MODEL IDENTIFIERS (from environment or defaults)
// =============================================================================

export const MODEL_IDS = {
    // Audit Layer: Gemini 3 Flash for reasoning-native extraction
    AUDIT: process.env.AI_MODEL_AUDIT || 'gemini-3-flash-preview',

    // Strategic Layer: Gemini 3 Pro for Deep Think reasoning
    STRATEGIC: process.env.AI_MODEL_STRATEGIC || 'gemini-3-pro-preview',

    // General Layer: For canvas optimization, workshop analysis
    GENERAL: process.env.AI_MODEL_GENERAL || 'gemini-3-flash-preview',

    // Embedding Layer: For vector search
    EMBEDDING: process.env.AI_MODEL_EMBEDDING || 'text-embedding-004',
} as const;

// =============================================================================
// THINKING LEVEL CONFIGURATION
// =============================================================================

export type ThinkingLevel = 'minimal' | 'low' | 'medium' | 'high';

export const THINKING_CONFIG = {
    // Current thinking level from environment (default: high for strategic work)
    level: (process.env.AI_THINKING_LEVEL || 'high') as ThinkingLevel,

    // Audit thinking level (medium for balanced extraction)
    auditLevel: 'medium' as ThinkingLevel,

    // Strategic thinking level (high for deep reasoning)
    strategicLevel: (process.env.AI_THINKING_LEVEL || 'high') as ThinkingLevel,

    // Budget presets for different thinking levels
    budgets: {
        minimal: 1000,
        low: 3000,
        medium: 6000,
        high: 10000,
    } as const,

    // Get the thinking budget for current level
    get budget() {
        return this.budgets[this.level];
    }
} as const;

// =============================================================================
// PROVIDER OPTIONS WITH THINKING CONFIG
// =============================================================================

/**
 * Generate providerOptions for Gemini 3 with thinking_level
 */
export function getThinkingOptions(level: ThinkingLevel) {
    return {
        google: {
            thinkingConfig: {
                thinkingLevel: level,
            },
        },
    };
}

// Pre-configured options for common use cases
export const THINKING_OPTIONS = {
    audit: getThinkingOptions(THINKING_CONFIG.auditLevel),
    strategic: getThinkingOptions(THINKING_CONFIG.strategicLevel),
    minimal: getThinkingOptions('minimal'),
    high: getThinkingOptions('high'),
} as const;

// =============================================================================
// CONFIGURED MODELS (ready to use in generateText/embed calls)
// =============================================================================

export const AI_CONFIG = {
    /**
     * Audit Model (gemini-3-flash-preview)
     * 
     * Used for: Technical Audit step in Supreme Scout
     * Thinking Level: medium (balanced extraction with reasoning)
     */
    auditModel: google(MODEL_IDS.AUDIT),

    /**
     * Strategic Model (gemini-3-pro-preview)
     * 
     * Used for: Gap Analysis, Brief Architecture
     * Thinking Level: high (maximum reasoning depth)
     */
    strategicModel: google(MODEL_IDS.STRATEGIC),

    /**
     * General Model (gemini-3-flash-preview)
     * 
     * Used for: Canvas optimization, workshop analysis, recommendations
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
     * Thinking configuration and provider options
     */
    thinking: THINKING_CONFIG,
    thinkingOptions: THINKING_OPTIONS,

    /**
     * Raw model identifiers (for logging/debugging)
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
