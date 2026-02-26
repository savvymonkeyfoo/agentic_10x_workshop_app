'use client';

import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { GripVertical, Infinity, Trash2, Info, Zap, CheckCircle } from 'lucide-react';

const TIER_CONFIG = {
    UNSCORED: { label: '❓ Needs Scoring', badgeClass: 'bg-card text-muted-foreground border-border', cardClass: 'border border-border bg-card shadow-sm' },
    AGENTIC_AUTO: { label: '🤖 Agentic Auto', badgeClass: 'bg-muted text-muted-foreground border-border', cardClass: 'border border-border bg-muted/50 shadow-md' },
    TABLE_STAKES: { label: '🛡️ Table Stakes', badgeClass: 'bg-info/10 text-info border-info', cardClass: 'border border-info bg-info-subtle shadow-lg' },
    STRATEGIC_BET: { label: '🌟 Strategic Bet', badgeClass: 'bg-warning/10 text-warning border-warning', cardClass: 'border-2 border-warning bg-warning-subtle shadow-lg' }
} as const;

const SOURCE_CONFIG = {
    MARKET_SIGNAL: { label: 'Market Signal', class: 'bg-intelligence/10 text-intelligence border-intelligence', icon: <Zap className="w-3 h-3 mr-1" /> },
    CLIENT_BACKLOG: { label: 'Backlog Item', class: 'bg-muted text-muted-foreground border-border', icon: <CheckCircle className="w-3 h-3 mr-1" /> },
    WORKSHOP_GENERATED: { label: 'Workshop Idea', class: 'bg-success/10 text-success border-success', icon: <Info className="w-3 h-3 mr-1" /> }
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
    // Intelligence Mode: Clean white card, simple left border
    // WORKSHOP_GENERATED: now included to match Market Signal styling per user request
    const isIntelligenceCard = !!card.friction || !!card.strategyAlignment || card.source === 'WORKSHOP_GENERATED';

    // Base Style
    let cardStyle = isIntelligenceCard
        ? "shadow-sm hover:shadow-md transition-all group mb-4 bg-card border-l-4 border-l-border hover:border-l-primary"
        : tierConfig.cardClass;

    // Selection Overrides
    if (isSelectMode) {
        if (isSelected) {
            cardStyle = cn(cardStyle, "ring-4 ring-primary/20 border-primary bg-primary/5 z-10");
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
                            ? "bg-primary border-primary text-primary-foreground"
                            : "bg-card border-border text-transparent hover:border-primary/50"
                    )}>
                        <CheckCircle size={14} className="fill-current" />
                    </div>
                </div>
            )}

            <CardContent className="p-4 space-y-3">
                {/* HEADER: BADGES */}
                <div className="flex justify-between items-start gap-2 max-w-[85%]">
                    {isPromoted ? (
                        <Badge className="bg-muted text-muted-foreground border-border">
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
                    <h4 className="font-bold text-foreground text-sm mb-1 leading-tight line-clamp-2">{card.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{card.description}</p>
                </div>

                {/* IDEATION LENSES (Legacy Support) */}
                {!isIntelligenceCard && card.lenses && card.lenses.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-2">
                        {card.lenses.includes('infinite_capacity') && <Badge className="bg-intelligence-subtle/10 text-intelligence border-intelligence text-[9px]"><Infinity size={10} className="mr-1" /> Scale</Badge>}
                    </div>
                )}
            </CardContent>

            {/* FOOTER: Delete actions active for all cards unless promoted/selecting */}
            {!isPromoted && !isSelectMode && (
                <CardFooter className="p-2 bg-muted/30 flex items-center justify-between rounded-b-lg border-t border-border">
                    <GripVertical size={14} className="text-muted-foreground group-hover:text-foreground" />
                    <button onClick={(e) => { e.stopPropagation(); onDelete?.(); }} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded-md group/trash">
                        <Trash2 size={16} className="text-muted-foreground group-hover/trash:text-destructive" />
                    </button>
                </CardFooter>
            )}
        </Card>
    );
}
