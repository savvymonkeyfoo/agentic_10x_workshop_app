'use client';

import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { GripVertical, Infinity, AlertTriangle, RefreshCw, Trash2, Info, ShieldCheck, Zap, CheckCircle, ArrowRight } from 'lucide-react';

// ============================================================================
// CONFIGURATION
// ============================================================================

const TIER_CONFIG = {
    UNSCORED: { label: '❓ Needs Scoring', badgeClass: 'bg-white text-slate-500 border-slate-300', cardClass: 'border-2 border-dashed border-slate-300 bg-white shadow-sm' },
    AGENTIC_AUTO: { label: '🤖 Agentic Auto', badgeClass: 'bg-slate-100 text-slate-700 border-slate-300', cardClass: 'border border-slate-300 bg-slate-50 shadow-md' },
    TABLE_STAKES: { label: '🛡️ Table Stakes', badgeClass: 'bg-blue-100 text-blue-800 border-blue-300', cardClass: 'border border-blue-200 bg-blue-50/50 shadow-lg' },
    STRATEGIC_BET: { label: '🌟 Strategic Bet', badgeClass: 'bg-amber-100 text-amber-800 border-amber-300', cardClass: 'border-2 border-amber-400 bg-amber-50 shadow-lg' }
} as const;

const SOURCE_CONFIG = {
    MARKET_SIGNAL: { label: 'Market Signal', class: 'bg-purple-100 text-purple-700 border-purple-200', icon: <Zap className="w-3 h-3 mr-1" /> },
    CLIENT_BACKLOG: { label: 'Backlog Item', class: 'bg-slate-100 text-slate-700 border-slate-200', icon: <CheckCircle className="w-3 h-3 mr-1" /> },
    WORKSHOP_GENERATED: { label: 'Workshop Idea', class: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: <Info className="w-3 h-3 mr-1" /> }
} as const;

// ============================================================================
// TYPES
// ============================================================================

export interface IdeaCardProps {
    card: {
        id: string;
        title: string;
        description: string;
        source: string;
        // Ideation Fields
        tier?: string;
        score?: number | null;
        lenses?: string[];
        strategicCluster?: string;
        // Intelligence Fields (New)
        friction?: string;
        techAlignment?: string;
        horizon?: string;
        category?: string;
    };
    onClick?: () => void;
    onDelete?: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function IdeaCard({ card, onClick, onDelete }: IdeaCardProps) {
    // 1. Determine Tier Styling (Ideation Phase)
    const tierKey = (card.tier as keyof typeof TIER_CONFIG) || 'UNSCORED';
    const tierConfig = TIER_CONFIG[tierKey] || TIER_CONFIG.UNSCORED;

    // 2. Determine Source Styling
    const sourceKey = (card.source as keyof typeof SOURCE_CONFIG) || 'WORKSHOP_GENERATED';
    const sourceConfig = SOURCE_CONFIG[sourceKey] || SOURCE_CONFIG.WORKSHOP_GENERATED;

    // 3. Determine Category Styling (Intelligence Phase)
    // Overrides tier border if present, to show "Board" colors
    let borderColor: string = tierConfig.cardClass; // Default to Tier
    let borderStyle = {};

    if (card.category) {
        if (card.category === 'EFFICIENCY') borderStyle = { borderLeftColor: '#10b981', borderLeftWidth: '4px' }; // Emerald
        else if (card.category === 'GROWTH') borderStyle = { borderLeftColor: '#3b82f6', borderLeftWidth: '4px' }; // Blue
        else if (card.category === 'MOONSHOT') borderStyle = { borderLeftColor: '#9333ea', borderLeftWidth: '4px' }; // Purple

        // Use a clean base for Intelligence Cards
        borderColor = "shadow-sm hover:shadow-md cursor-pointer transition-all group mb-4 bg-white hover:border-l-8";
    }

    return (
        <Card
            onClick={onClick}
            className={cn("relative transition-all duration-200 group overflow-hidden", borderColor)}
            style={borderStyle}
        >
            <CardContent className="p-4 space-y-3">
                {/* HEADER: BADGES */}
                <div className="flex justify-between items-start gap-2">
                    <Badge variant="outline" className={cn("text-[10px] border px-2 py-0.5 font-bold tracking-wide", sourceConfig.class)}>
                        {sourceConfig.icon}
                        {sourceConfig.label}
                    </Badge>

                    {/* Show Horizon if present (Intelligence), otherwise Tier (Ideation) */}
                    {card.horizon ? (
                        <Badge variant="outline" className="text-[10px] uppercase bg-white text-slate-500 border-slate-200">
                            {card.horizon} Horizon
                        </Badge>
                    ) : (
                        <Badge variant="outline" className={cn("text-[10px] font-bold", tierConfig.badgeClass)}>
                            {tierConfig.label}
                        </Badge>
                    )}
                </div>

                {/* CONTENT */}
                <div>
                    <h4 className="font-bold text-slate-900 text-sm mb-1 leading-tight line-clamp-2">
                        {card.title}
                    </h4>
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                        {card.description}
                    </p>
                </div>

                {/* RICH DATA: FRICTION & TECH (Intelligence View) */}
                {(card.friction || card.techAlignment) && (
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-50">
                        {card.friction && (
                            <div className="bg-red-50 p-2 rounded text-[10px] text-red-700">
                                <div className="flex items-center gap-1 font-bold mb-0.5 text-red-800">
                                    <AlertTriangle className="w-3 h-3" /> Friction
                                </div>
                                <span className="line-clamp-2 opacity-80">{card.friction}</span>
                            </div>
                        )}
                        {card.techAlignment && (
                            <div className="bg-blue-50 p-2 rounded text-[10px] text-blue-700">
                                <div className="flex items-center gap-1 font-bold mb-0.5 text-blue-800">
                                    <ShieldCheck className="w-3 h-3" /> Tech DNA
                                </div>
                                <span className="line-clamp-2 opacity-80">{card.techAlignment}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* LENSES (Ideation View) */}
                {card.lenses && card.lenses.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-2">
                        {card.lenses.includes('infinite_capacity') && <Badge className="bg-indigo-50 text-indigo-600 border-indigo-100 text-[9px]"><Infinity size={10} className="mr-1" /> Scale</Badge>}
                        {card.lenses.includes('constraints') && <Badge className="bg-amber-50 text-amber-600 border-amber-100 text-[9px]"><AlertTriangle size={10} className="mr-1" /> Constraint</Badge>}
                        {card.lenses.includes('ooda_loop') && <Badge className="bg-cyan-50 text-cyan-600 border-cyan-100 text-[9px]"><RefreshCw size={10} className="mr-1" /> Velocity</Badge>}
                    </div>
                )}
            </CardContent>

            {/* FOOTER: Only show grip/trash if not in Intelligence Mode (Intelligence cards typically don't delete via card action yet) */}
            {!card.category && (
                <CardFooter className="p-2 bg-slate-50/50 flex items-center justify-between rounded-b-lg border-t border-slate-100">
                    <GripVertical size={14} className="text-slate-300 group-hover:text-slate-500" />
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-50 rounded-md group/trash"
                    >
                        <Trash2 size={16} className="text-slate-400 group-hover/trash:text-red-500" />
                    </button>
                </CardFooter>
            )}
        </Card>
    );
}
