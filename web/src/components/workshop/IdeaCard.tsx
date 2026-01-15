'use client';

import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { GripVertical, Infinity, Trash2, Info, Zap, CheckCircle } from 'lucide-react';

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

export interface IdeaCardProps {
    card: {
        id: string;
        title: string;
        description: string;
        source: string;
        tier?: string;
        score?: number | null;
        lenses?: string[];
        strategicCluster?: string;
        // Data fields exist in DB but hidden from this view
        friction?: string;
        techAlignment?: string;
        strategyAlignment?: string;
        promotionStatus?: string; // Add check for lock icon
    };
    onClick?: () => void;
    onDelete?: () => void;

    // Selection Mode Props
    isSelectMode?: boolean;
    isSelected?: boolean;
    onToggleSelect?: () => void;
}

export function IdeaCard({ card, onClick, onDelete, isSelectMode, isSelected, onToggleSelect }: IdeaCardProps) {
    const tierKey = (card.tier as keyof typeof TIER_CONFIG) || 'UNSCORED';
    const tierConfig = TIER_CONFIG[tierKey] || TIER_CONFIG.UNSCORED;

    const sourceKey = (card.source as keyof typeof SOURCE_CONFIG) || 'WORKSHOP_GENERATED';
    const sourceConfig = SOURCE_CONFIG[sourceKey] || SOURCE_CONFIG.WORKSHOP_GENERATED;

    const isPromoted = card.promotionStatus === 'PROMOTED';
    // Intelligence Mode: Clean white card, simple left border
    // Ideation Mode: Tier-based styling
    const isIntelligenceCard = !!card.friction || !!card.strategyAlignment;

    // Base Style
    let cardStyle = isIntelligenceCard
        ? "shadow-sm hover:shadow-md transition-all group mb-4 bg-white border-l-4 border-l-slate-300 hover:border-l-brand-blue"
        : tierConfig.cardClass;

    // Selection Overrides
    if (isSelectMode) {
        if (isSelected) {
            cardStyle = cn(cardStyle, "ring-4 ring-blue-500/20 border-blue-500 bg-blue-50/10 z-10");
        } else {
            // Dim unselected
            cardStyle = cn(cardStyle, "opacity-50 grayscale-[0.8] hover:opacity-100 hover:grayscale-0");
        }
    }

    // Logic for Click: If SelectMode, toggle. If Promoted, do nothing (or show toast). Else open modal.
    const handleClick = (e: React.MouseEvent) => {
        if (isSelectMode) {
            e.stopPropagation();
            onToggleSelect?.();
        } else if (isPromoted) {
            // Maybe show a tooltip or prevent click? 
            // PRD: "Render a 'Lock' icon... They can no longer be edited"
            // But maybe allow read-only? For now, we just pass onClick which is the Modal opener.
            // The Modal itself might read-only if promoted?
            onClick?.();
        } else {
            onClick?.();
        }
    };

    return (
        <Card onClick={handleClick} className={cn("relative transition-all duration-200 group overflow-hidden cursor-pointer", cardStyle)}>

            {/* SELECTION OVERLAY */}
            {isSelectMode && (
                <div className="absolute top-2 right-2 z-50">
                    <div className={cn(
                        "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shadow-sm",
                        isSelected
                            ? "bg-blue-600 border-blue-600 text-white"
                            : "bg-white border-slate-300 text-transparent hover:border-blue-400"
                    )}>
                        <CheckCircle size={14} className="fill-current" />
                    </div>
                </div>
            )}

            <CardContent className="p-4 space-y-3">
                {/* HEADER: BADGES */}
                <div className="flex justify-between items-start gap-2 max-w-[85%]">
                    {isPromoted ? (
                        <Badge className="bg-slate-100 text-slate-500 border-slate-200">
                            🔒 Promoted
                        </Badge>
                    ) : (
                        <Badge variant="outline" className={cn("text-[10px] border px-2 py-0.5 font-bold tracking-wide", sourceConfig.class)}>
                            {sourceConfig.icon} {sourceConfig.label}
                        </Badge>
                    )}

                    {/* Only show Tier in Ideation Phase (and if not promoted/intelligence mode hidden logic) */}
                    {!isIntelligenceCard && !isPromoted && (
                        <Badge variant="outline" className={cn("text-[10px] font-bold", tierConfig.badgeClass)}>
                            {tierConfig.label}
                        </Badge>
                    )}
                </div>

                {/* CONTENT */}
                <div className={cn(isPromoted && "opacity-70")}>
                    <h4 className="font-bold text-slate-900 text-sm mb-1 leading-tight line-clamp-2">{card.title}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">{card.description}</p>
                </div>

                {/* IDEATION LENSES (Legacy Support) */}
                {!isIntelligenceCard && card.lenses && card.lenses.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-2">
                        {card.lenses.includes('infinite_capacity') && <Badge className="bg-indigo-50 text-indigo-600 border-indigo-100 text-[9px]"><Infinity size={10} className="mr-1" /> Scale</Badge>}
                    </div>
                )}
            </CardContent>

            {/* FOOTER: Delete actions for Ideation Phase only */}
            {!isIntelligenceCard && !isPromoted && !isSelectMode && (
                <CardFooter className="p-2 bg-slate-50/50 flex items-center justify-between rounded-b-lg border-t border-slate-100">
                    <GripVertical size={14} className="text-slate-300 group-hover:text-slate-500" />
                    <button onClick={(e) => { e.stopPropagation(); onDelete?.(); }} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-50 rounded-md group/trash">
                        <Trash2 size={16} className="text-slate-400 group-hover/trash:text-red-500" />
                    </button>
                </CardFooter>
            )}
        </Card>
    );
}
