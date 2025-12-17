'use client';
import React from 'react';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Type definition for opportunity
interface Opportunity {
    id: string;
    projectName?: string | null;
    frictionStatement?: string | null;
    workflowPhases?: unknown[];
    benefitRevenue?: number | null;
    benefitCostAvoidance?: number | null;
    benefitEstCost?: number | null;
}

// Helper: Check if opportunity has sufficient data
const checkCompletion = (opp: Opportunity): boolean => {
    const hasStrategy = opp.projectName && opp.frictionStatement;
    const hasWorkflow = opp.workflowPhases && Array.isArray(opp.workflowPhases) && opp.workflowPhases.length > 0;
    const hasBusiness = opp.benefitRevenue || opp.benefitCostAvoidance || opp.benefitEstCost;
    return !!(hasStrategy && hasWorkflow && hasBusiness);
};

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
        <div className="bg-white border-b border-slate-200 shadow-sm relative z-20">
            {/* Header / Toggle Bar */}
            <div
                onClick={onToggle}
                className="px-8 py-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <div className="bg-blue-600 text-white p-1 rounded">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="7" height="7"></rect>
                            <rect x="14" y="3" width="7" height="7"></rect>
                            <rect x="14" y="14" width="7" height="7"></rect>
                            <rect x="3" y="14" width="7" height="7"></rect>
                        </svg>
                    </div>
                    <span className="text-xs font-bold text-slate-600 tracking-widest uppercase">
                        {opportunities.length} Opportunities
                    </span>
                </div>
                <div className="text-slate-400">
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
            </div>

            {/* Dropdown Content */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden bg-slate-50 border-t border-slate-100 shadow-inner"
                    >
                        {/* FIX: Changed p-6 to px-8 py-8 to match page container alignment */}
                        <div className="flex gap-4 px-8 py-8 overflow-x-auto">

                            {/* New Opportunity Button */}
                            <button
                                onClick={(e) => { e.stopPropagation(); onCreate(); }}
                                className="shrink-0 w-[160px] h-[100px] border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center gap-3 text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-white transition-all group"
                            >
                                <div className="w-10 h-10 rounded-full bg-slate-200 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                                    <Plus size={20} />
                                </div>
                                <span className="text-xs font-bold">New Opportunity</span>
                            </button>

                            {/* Opportunity Cards */}
                            {opportunities.map((opp) => {
                                const isComplete = checkCompletion(opp);
                                const isSelected = selectedId === opp.id;

                                return (
                                    <div
                                        key={opp.id}
                                        onClick={() => onSelect(opp)}
                                        className={`
                                            relative shrink-0 w-[200px] h-[100px] bg-white rounded-xl border-2 p-4 cursor-pointer hover:shadow-md transition-all flex flex-col justify-between group
                                            ${isSelected ? 'border-blue-500 ring-4 ring-blue-50' : 'border-slate-200 hover:border-blue-300'}
                                        `}
                                    >
                                        {/* Top Row: Status Icon + Delete */}
                                        <div className="flex justify-between items-start">
                                            {/* Completion Status (NOT Selection) */}
                                            <div className={`w-3 h-3 rounded-full ${isComplete ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onDelete(opp.id); }}
                                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded transition-all"
                                            >
                                                <XIcon size={14} />
                                            </button>
                                        </div>

                                        {/* Title Only */}
                                        <div className="font-bold text-slate-700 text-sm leading-tight line-clamp-2">
                                            {opp.projectName || "Untitled Opportunity"}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
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
