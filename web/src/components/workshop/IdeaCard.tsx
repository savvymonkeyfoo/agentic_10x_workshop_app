'use client';

import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Maximize2, GripVertical } from 'lucide-react';

interface IdeaCardProps {
    id: string;
    title: string;
    description: string;
    tier: string; // 'STRATEGIC_BET' | 'TABLE_STAKES' | 'AGENTIC_AUTO' | 'UNSCORED'
    source: string;
    score?: number | null; // 0-100 score from scorecard
    strategicCluster?: string;
    rotation?: number;
    isSelected?: boolean;
    onSelect?: () => void;
    onExpand?: () => void;
}

// Get tier from score (auto-tiering)
function getTierFromScore(score: number | null | undefined): string {
    if (score === null || score === undefined || score === 0) return 'UNSCORED';
    if (score >= 75) return 'STRATEGIC_BET';
    if (score >= 40) return 'TABLE_STAKES';
    return 'AGENTIC_AUTO';
}

// Tier configuration with 4 visual states
const TIER_CONFIG = {
    UNSCORED: {
        label: '❓ Needs Scoring',
        badgeClass: 'bg-white text-slate-500 border-slate-300',
        cardClass: 'border-2 border-dashed border-slate-300 bg-white shadow-sm'
    },
    AGENTIC_AUTO: {
        label: '🤖 Agentic Auto',
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
        cardClass: 'border border-slate-300 bg-slate-50 shadow-md'
    },
    TABLE_STAKES: {
        label: '🛡️ Table Stakes',
        badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
        cardClass: 'border border-blue-200 bg-blue-50/50 shadow-lg'
    },
    STRATEGIC_BET: {
        label: '🌟 Strategic Bet',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
        cardClass: 'border-2 border-amber-400 bg-amber-50 shadow-lg'
    }
} as const;

// Source badge styling
const SOURCE_CONFIG = {
    MARKET_SIGNAL: { label: 'Market Signal', class: 'bg-purple-50 text-purple-700 border-purple-200' },
    CLIENT_BACKLOG: { label: 'Client Backlog', class: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
    WORKSHOP_GENERATED: { label: 'Workshop', class: 'bg-green-50 text-green-700 border-green-200' }
} as const;

export function IdeaCard({
    id,
    title,
    description,
    tier,
    source,
    score,
    strategicCluster,
    rotation = 0,
    isSelected,
    onSelect,
    onExpand
}: IdeaCardProps) {

    // Use score-based tier if score exists, otherwise fall back to manual tier
    const effectiveTier = score !== null && score !== undefined ? getTierFromScore(score) : tier;
    const tierConfig = TIER_CONFIG[effectiveTier as keyof typeof TIER_CONFIG] || TIER_CONFIG.UNSCORED;
    const sourceConfig = SOURCE_CONFIG[source as keyof typeof SOURCE_CONFIG] || { label: source, class: 'bg-slate-50 text-slate-600 border-slate-200' };

    return (
        <Card
            className={cn(
                "relative hover:shadow-xl transition-shadow duration-200 w-[300px]",
                tierConfig.cardClass,
                isSelected ? "ring-2 ring-offset-2 ring-indigo-500" : ""
            )}
            style={{ transform: `rotate(${rotation}deg)` }}
            onClick={onSelect}
        >
            {/* Header: Tier Badge (Left) + Source Badge (Right) */}
            <CardHeader className="p-3 pb-2">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className={cn("text-[10px] font-bold px-2 py-0.5", tierConfig.badgeClass)}>
                            {tierConfig.label}
                        </Badge>
                        {/* Score indicator */}
                        {score !== null && score !== undefined && score > 0 && (
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                {score}/100
                            </span>
                        )}
                    </div>
                    <Badge variant="outline" className={cn("text-[10px] px-2 py-0.5", sourceConfig.class)}>
                        {sourceConfig.label}
                    </Badge>
                </div>

                {/* Strategic Cluster Pill (if present) */}
                {strategicCluster && (
                    <div className="mt-2">
                        <span className="text-[10px] uppercase font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                            📍 {strategicCluster}
                        </span>
                    </div>
                )}

                {/* Title: Multi-line, prominent */}
                <h4 className="font-bold text-base text-slate-900 leading-tight line-clamp-3 break-words mt-2">
                    {title}
                </h4>
            </CardHeader>

            {/* Body: Description */}
            <CardContent className="p-3 pt-0">
                <p className="text-sm text-slate-600 leading-relaxed line-clamp-4">
                    {description}
                </p>
            </CardContent>

            {/* Footer: Drag Handle + Expand Button */}
            <CardFooter className="p-2 border-t border-slate-100 bg-white/50 flex justify-between items-center rounded-b-lg">
                <div className="text-slate-400 cursor-grab hover:text-slate-600">
                    <GripVertical size={16} />
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-slate-500 hover:text-brand-blue hover:bg-brand-blue/10"
                    onClick={(e) => {
                        e.stopPropagation();
                        onExpand?.();
                    }}
                >
                    <Maximize2 size={14} className="mr-1" />
                    <span className="text-xs">Expand</span>
                </Button>
            </CardFooter>
        </Card>
    );
}
