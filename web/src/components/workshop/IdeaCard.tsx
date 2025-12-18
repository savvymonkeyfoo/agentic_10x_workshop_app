'use client';

import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { GripVertical, Infinity, AlertTriangle, RefreshCw, Trash2, Info } from 'lucide-react';

const TIER_CONFIG = {
    UNSCORED: { label: '❓ Needs Scoring', badgeClass: 'bg-white text-slate-500 border-slate-300', cardClass: 'border-2 border-dashed border-slate-300 bg-white shadow-sm' },
    AGENTIC_AUTO: { label: '🤖 Agentic Auto', badgeClass: 'bg-slate-100 text-slate-700 border-slate-300', cardClass: 'border border-slate-300 bg-slate-50 shadow-md' },
    TABLE_STAKES: { label: '🛡️ Table Stakes', badgeClass: 'bg-blue-100 text-blue-800 border-blue-300', cardClass: 'border border-blue-200 bg-blue-50/50 shadow-lg' },
    STRATEGIC_BET: { label: '🌟 Strategic Bet', badgeClass: 'bg-amber-100 text-amber-800 border-amber-300', cardClass: 'border-2 border-amber-400 bg-amber-50 shadow-lg' }
} as const;

const SOURCE_CONFIG = {
    MARKET_SIGNAL: { label: 'Market Signal', class: 'bg-purple-50 text-purple-700 border-purple-200' },
    CLIENT_BACKLOG: { label: 'Client Backlog', class: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
    WORKSHOP_GENERATED: { label: 'Workshop', class: 'bg-green-50 text-green-700 border-green-200' }
} as const;

export function IdeaCard({ title, description, tier, source, score, strategicCluster, rotation = 0, isSelected, isRecommended, recommendationReason, onExpand, onDelete, lenses = [] }: any) {
    const tierConfig = TIER_CONFIG[tier as keyof typeof TIER_CONFIG] || TIER_CONFIG.UNSCORED;
    const sourceConfig = SOURCE_CONFIG[source as keyof typeof SOURCE_CONFIG] || { label: source, class: 'bg-slate-50 text-slate-600 border-slate-200' };

    return (
        <Card
            className={cn(
                "relative hover:shadow-xl transition-all duration-200 w-[320px] cursor-pointer group",
                tierConfig.cardClass,
                isSelected ? "ring-2 ring-offset-2 ring-indigo-500" : "",
                isRecommended ? "ring-2 ring-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)]" : ""
            )}
            style={{ transform: `rotate(${rotation}deg)` }}
            onClick={(e) => { e.stopPropagation(); onExpand?.(); }} // GLOBAL CLICK
        >
            {/* RECOMMENDED BADGE */}
            {isRecommended && (
                <div className="absolute -top-3 right-4 z-10 flex items-center gap-1.5 bg-indigo-600 text-white px-2 py-0.5 rounded-full shadow-md animate-in fade-in slide-in-from-bottom-2">
                    <span className="text-[10px] font-black uppercase tracking-wider">Recommended</span>
                    {recommendationReason && (
                        <div className="group/info relative flex items-center justify-center">
                            <Info size={12} className="cursor-help opacity-90 hover:opacity-100" />
                            {/* TOOLTIP */}
                            <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-slate-800 text-white text-[10px] leading-tight rounded-lg shadow-xl opacity-0 group-hover/info:opacity-100 transition-opacity pointer-events-none z-50">
                                {recommendationReason}
                                <div className="absolute -bottom-1 right-1 w-2 h-2 bg-slate-800 rotate-45" />
                            </div>
                        </div>
                    )}
                </div>
            )}

            <CardHeader className="p-4 pb-1">
                <h4 className="font-black text-lg text-slate-900 leading-tight tracking-tight group-hover:text-brand-blue transition-colors">
                    {title}
                </h4>
            </CardHeader>

            <CardContent className="p-4 pt-2 space-y-4">
                <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
                    {description}
                </p>

                {/* PILLS & LENS TAGS */}
                <div className="space-y-2 pt-3 border-t border-slate-100">
                    <div className="flex flex-wrap gap-1.5">
                        <Badge className={cn("text-[9px] font-black uppercase px-2 py-0.5", tierConfig.badgeClass)}>
                            {tierConfig.label}
                        </Badge>
                        <Badge variant="outline" className={cn("text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider", sourceConfig.class)}>
                            {sourceConfig.label}
                        </Badge>
                        {lenses.includes('infinite_capacity') && <Badge className="bg-indigo-50 text-indigo-600 border-indigo-100 text-[9px]"><Infinity size={10} className="mr-1" /> Scale</Badge>}
                        {lenses.includes('constraints') && <Badge className="bg-amber-50 text-amber-600 border-amber-100 text-[9px]"><AlertTriangle size={10} className="mr-1" /> Constraint</Badge>}
                        {lenses.includes('ooda_loop') && <Badge className="bg-cyan-50 text-cyan-600 border-cyan-100 text-[9px]"><RefreshCw size={10} className="mr-1" /> Velocity</Badge>}
                    </div>
                </div>
            </CardContent>

            <CardFooter className="p-2 bg-slate-50/50 flex items-center justify-between rounded-b-lg border-t border-slate-100">
                <GripVertical size={14} className="text-slate-300 group-hover:text-slate-500" />

                {/* DELETE TRIGGER */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete?.();
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-50 rounded-md group/trash"
                >
                    <Trash2 size={16} className="text-slate-400 group-hover/trash:text-red-500 transition-colors" />
                </button>
            </CardFooter>
        </Card>
    );
}
