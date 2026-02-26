'use client';
import React from 'react';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react';

import { calculateCompleteness } from '@/utils/completeness';

// Type definition for opportunity (aligned with completeness check)
interface Opportunity {
    id: string;
    projectName?: string | null;
    frictionStatement?: string | null;
    workflowPhases?: unknown[];
    definitionOfDone?: string | null;
    keyDecisions?: string | null;
    benefitRevenue?: number | null;
    benefitCostAvoidance?: number | null;
    benefitEfficiency?: number | null;
    benefitEstCost?: number | null;
    dfvAssessment?: any; // JSON type in Prisma
}

export const OpportunityTileNavigator = ({
    opportunities,
    selectedId,
    onSelect,
    onCreate,
    onDelete,
    isOpen,        // <--- New Prop
    onToggle       // <--- New Prop
}: {
    opportunities: Opportunity[],
    selectedId: string | null,
    onSelect: (opp: Opportunity) => void,
    onCreate: () => void,
    onDelete: (id: string) => void,
    isOpen: boolean,
    onToggle: () => void
}) => {

    return (
        <div className="bg-background border-b border-border shadow-sm relative z-20">
            {/* Header / Toggle Bar */}
            <div
                onClick={onToggle}
                className="px-8 py-3 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <div className="bg-primary text-primary-foreground p-1 rounded">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="7" height="7"></rect>
                            <rect x="14" y="3" width="7" height="7"></rect>
                            <rect x="14" y="14" width="7" height="7"></rect>
                            <rect x="3" y="14" width="7" height="7"></rect>
                        </svg>
                    </div>
                    <span className="text-xs font-bold text-muted-foreground tracking-widest uppercase">
                        {opportunities.length} Opportunities
                    </span>
                </div>
                <div className="text-muted-foreground/70">
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
            </div>

            {/* Dropdown Content */}
            <div
                className={`overflow-hidden bg-background border-t border-border shadow-inner transition-all duration-300 ${
                    isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                }`}
            >
                {/* FIX: Changed p-6 to px-8 py-8 to match page container alignment */}
                <div className="flex gap-4 px-8 py-8 overflow-x-auto">

                    {/* New Opportunity Button */}
                    <button
                        onClick={(e) => { e.stopPropagation(); onCreate(); }}
                        className="shrink-0 w-[160px] h-[100px] border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-3 text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-card transition-all group"
                    >
                        <div className="w-10 h-10 rounded-full bg-muted group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                            <Plus size={20} />
                        </div>
                        <span className="text-xs font-bold">New Opportunity</span>
                    </button>

                    {/* Opportunity Cards */}
                    {opportunities.map((opp) => {
                        const isComplete = calculateCompleteness(opp as any).total === 100;
                        const isSelected = selectedId === opp.id;

                        return (
                            <div
                                key={opp.id}
                                onClick={() => onSelect(opp)}
                                className={`
                                    relative shrink-0 w-[200px] h-[100px] bg-card rounded-xl border-2 p-4 cursor-pointer hover:shadow-md transition-all flex flex-col justify-between group
                                    ${isSelected ? 'border-primary ring-4 ring-primary/10' : 'border-border hover:border-primary/30'}
                                `}
                            >
                                {/* Top Row: Status Icon + Delete */}
                                <div className="flex justify-between items-start">
                                    {/* Completion Status (NOT Selection) */}
                                    <div className={`w-3 h-3 rounded-full ${isComplete ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`} />
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onDelete(opp.id); }}
                                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 text-muted-foreground/50 hover:text-destructive rounded transition-all"
                                    >
                                        <XIcon size={14} />
                                    </button>
                                </div>

                                {/* Title Only */}
                                <div className="font-bold text-foreground text-sm leading-tight line-clamp-2">
                                    {opp.projectName || "Untitled Opportunity"}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

// Simple X Icon helper
const XIcon = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);
