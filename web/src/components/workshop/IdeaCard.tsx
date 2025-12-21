'use client';

import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { GripVertical, Infinity, AlertTriangle, RefreshCw, Trash2, Info, ShieldCheck, Zap, CheckCircle, Target } from 'lucide-react';

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
        // Ideation Fields
        tier?: string;
        score?: number | null;
        lenses?: string[];
        strategicCluster?: string;
        // Intelligence Fields
        friction?: string;
        techAlignment?: string;
        strategyAlignment?: string; // NEW FIELD
    };
    onClick?: () => void;
    onDelete?: () => void;
}

export function IdeaCard({ card, onClick, onDelete }: IdeaCardProps) {
    const tierKey = (card.tier as keyof typeof TIER_CONFIG) || 'UNSCORED';
    const tierConfig = TIER_CONFIG[tierKey] || TIER_CONFIG.UNSCORED;

    const sourceKey = (card.source as keyof typeof SOURCE_CONFIG) || 'WORKSHOP_GENERATED';
    const sourceConfig = SOURCE_CONFIG[sourceKey] || SOURCE_CONFIG.WORKSHOP_GENERATED;

    // INTELLIGENCE PHASE: Use a unified clean style (no Horizon/Category colors yet)
    // If it has 'friction', it's an Intelligence Card.
    const isIntelligenceCard = !!card.friction;

    const cardStyle = isIntelligenceCard
        ? "shadow-sm hover:shadow-md cursor-pointer transition-all group mb-4 bg-white border-l-4 border-l-slate-400"
        : tierConfig.cardClass;

    return (
        <Card onClick={onClick} className={cn("relative transition-all duration-200 group overflow-hidden", cardStyle)}>
            <CardContent className="p-4 space-y-3">
                {/* HEADER: BADGES */}
                <div className="flex justify-between items-start gap-2">
                    <Badge variant="outline" className={cn("text-[10px] border px-2 py-0.5 font-bold tracking-wide", sourceConfig.class)}>
                        {sourceConfig.icon} {sourceConfig.label}
                    </Badge>

                    {/* Only show Tier in Ideation Phase */}
                    {!isIntelligenceCard && (
                        <Badge variant="outline" className={cn("text-[10px] font-bold", tierConfig.badgeClass)}>
                            {tierConfig.label}
                        </Badge>
                    )}
                </div>

                {/* CONTENT */}
                <div>
                    <h4 className="font-bold text-slate-900 text-sm mb-1 leading-tight line-clamp-2">{card.title}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">{card.description}</p>
                </div>

                {/* RICH DATA: THE STRATEGIC TRIAD */}
                {(card.friction || card.techAlignment || card.strategyAlignment) && (
                    <div className="space-y-2 pt-2 border-t border-slate-50">
                        {/* 1. Friction (Red) */}
                        {card.friction && (
                            <div className="bg-red-50 p-2 rounded text-[10px] text-red-700">
                                <div className="flex items-center gap-1 font-bold mb-0.5 text-red-800">
                                    <AlertTriangle className="w-3 h-3" /> Friction
                                </div>
                                <span className="line-clamp-2 opacity-80">{card.friction}</span>
                            </div>
                        )}
                        {/* 2. Tech (Blue) */}
                        {card.techAlignment && (
                            <div className="bg-blue-50 p-2 rounded text-[10px] text-blue-700">
                                <div className="flex items-center gap-1 font-bold mb-0.5 text-blue-800">
                                    <ShieldCheck className="w-3 h-3" /> Tech DNA
                                </div>
                                <span className="line-clamp-2 opacity-80">{card.techAlignment}</span>
                            </div>
                        )}
                        {/* 3. Strategy (Amber - NEW) */}
                        {card.strategyAlignment && (
                            <div className="bg-amber-50 p-2 rounded text-[10px] text-amber-700">
                                <div className="flex items-center gap-1 font-bold mb-0.5 text-amber-800">
                                    <Target className="w-3 h-3" /> Strategy
                                </div>
                                <span className="line-clamp-2 opacity-80">{card.strategyAlignment}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* IDEATION LENSES (Legacy Support) */}
                {!isIntelligenceCard && card.lenses && card.lenses.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-2">
                        {card.lenses.includes('infinite_capacity') && <Badge className="bg-indigo-50 text-indigo-600 border-indigo-100 text-[9px]"><Infinity size={10} className="mr-1" /> Scale</Badge>}
                    </div>
                )}
            </CardContent>

            {/* FOOTER: Delete actions for Ideation Phase only */}
            {!isIntelligenceCard && (
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
