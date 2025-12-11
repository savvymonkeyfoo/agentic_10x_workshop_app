import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { calculateCompleteness } from '@/utils/completeness';
import { OpportunityState } from '@/types/workshop';

interface OpportunitySummary {
    id: string;
    projectName: string;
    // We can add completeness score if available, or calculate a rough one
    updatedAt: Date;
    [key: string]: any;
}

interface OpportunityTileNavigatorProps {
    opportunities: OpportunitySummary[];
    activeId: string | undefined;
    onSelect: (id: string) => void;
    onAdd: () => void;
    onDelete: (id: string) => void;
}

export const OpportunityTileNavigator = ({
    opportunities,
    activeId,
    onSelect,
    onAdd,
    onDelete
}: OpportunityTileNavigatorProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    return (
        <motion.div
            initial={false}
            animate={{ height: isExpanded ? 240 : 48 }} // 48px collapsed (Sun Visor)
            // REMOVED: position:sticky - Navigator now scrolls with content per user request
            className={`w-full transition-all duration-300 ease-in-out flex flex-col ${isExpanded ? 'bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-md shadow-xl border-b' : 'bg-transparent hover:bg-slate-50/50 backdrop-blur-sm'} border-slate-200/50 dark:border-slate-800/50`}
        >
            {/* Header / Toggle Bar */}
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-[48px] flex items-center justify-between px-6 cursor-pointer w-full group"
            >
                <div className="flex items-center gap-3">
                    {/* Icon */}
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${isExpanded ? 'bg-brand-blue text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 group-hover:bg-brand-blue group-hover:text-white'}`}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                    </div>

                    {/* Label */}
                    <div className="flex flex-col">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 group-hover:text-brand-blue transition-colors">
                            {opportunities.length} Opportunities
                        </span>
                        {!isExpanded && activeId && (
                            <span className="text-[10px] text-slate-400">
                                Active: {opportunities.find(o => o.id === activeId)?.projectName || 'Untitled'}
                            </span>
                        )}
                    </div>
                </div>

                {/* Chevron */}
                <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    className="text-slate-400 group-hover:text-brand-blue"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </motion.div>
            </div>

            {/* Expanded Content: Scrollable Tiles */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex-1 overflow-x-auto flex items-center gap-4 px-6 pb-4 scroll-smooth custom-scrollbar"
                        ref={scrollRef}
                    >
                        {/* New Opportunity Tile (First) */}
                        <button
                            onClick={(e) => { e.stopPropagation(); onAdd(); }}
                            className="min-w-[160px] w-[160px] h-[140px] rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-brand-blue hover:border-brand-blue hover:bg-brand-blue/5 transition-all group shrink-0"
                        >
                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-brand-blue group-hover:text-white transition-colors">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                            </div>
                            <span className="text-xs font-bold">New Opportunity</span>
                        </button>

                        {/* Existing Tiles */}
                        {opportunities.map((opp) => {
                            const isActive = opp.id === activeId;

                            // Eager Calculation
                            // We cast to any/OpportunityState because the summary actually has all fields from parent
                            const stats = calculateCompleteness(opp as unknown as OpportunityState);
                            const isComplete = stats.total === 100;

                            return (
                                <motion.div
                                    key={opp.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    onClick={(e) => { e.stopPropagation(); onSelect(opp.id); }}
                                    className={`
                                        relative min-w-[160px] w-[160px] h-[140px] rounded-2xl p-4 flex flex-col justify-between cursor-pointer transition-all duration-300 shrink-0
                                        ${isActive
                                            ? 'bg-white dark:bg-slate-800 shadow-xl shadow-brand-cyan/40 border-[3px] border-brand-cyan scale-105 z-10'
                                            : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:shadow-md hover:border-brand-blue/30'
                                        }
                                    `}
                                >
                                    {/* Delete Button (Top Right) */}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onDelete(opp.id); }}
                                        className="absolute top-2 right-2 text-slate-300 hover:text-red-500 p-1 opacity-100 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-all z-20"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                    </button>

                                    {/* Status Dot */}
                                    <div className="flex justify-between items-start">
                                        <div className={`w-3 h-3 rounded-full mr-2 transition-colors duration-300 ${isComplete
                                                ? 'bg-emerald-500 shadow-sm shadow-emerald-200'
                                                : isActive ? 'bg-status-safe' : 'bg-slate-300 dark:bg-slate-600'
                                            }`} />
                                    </div>

                                    {/* Content */}
                                    <div>
                                        <h3 className={`text-sm font-bold leading-tight line-clamp-4 ${isActive ? 'text-brand-blue' : 'text-slate-600 dark:text-slate-300'}`}>
                                            {opp.projectName || "Untitled"}
                                        </h3>
                                    </div>

                                    {/* Active Indicator Glow (if active) */}
                                    {isActive && (
                                        <div className="absolute inset-0 rounded-2xl shadow-[0_0_20px_rgba(6,182,212,0.15)] pointer-events-none" />
                                    )}
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
