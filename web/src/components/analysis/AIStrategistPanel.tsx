"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface SequenceItem {
    id: string;
    projectName: string;
    rank: number;
    rationale?: string;
}

interface AnalysisResult {
    narrative: string;
    dependencies?: string;
    risks?: string;
    sequence: SequenceItem[];
}

interface NodeData {
    id: string;
    name: string;
    rank?: number;
    strategicRationale?: string;
}

interface AIStrategistPanelProps {
    analysis: AnalysisResult | null;
    isLoading: boolean;
    onAnalyze: () => void;
    initialNarrative?: string;
    initialDependencies?: string;
    initialRisks?: string;
    nodes?: NodeData[];
}

export function AIStrategistPanel({
    analysis,
    isLoading,
    onAnalyze,
    initialNarrative = "",
    initialDependencies = "",
    initialRisks = "",
    nodes = []
}: AIStrategistPanelProps) {
    // Use persisted data if no fresh analysis
    const displayNarrative = analysis?.narrative || initialNarrative;
    const displayDependencies = analysis?.dependencies || initialDependencies;
    const displayRisks = analysis?.risks || initialRisks;

    // Build sequence from nodes if no analysis
    const displaySequence = analysis?.sequence || nodes
        .filter(n => n.rank)
        .sort((a, b) => (a.rank || 99) - (b.rank || 99))
        .map(n => ({
            id: n.id,
            projectName: n.name,
            rank: n.rank!,
            rationale: n.strategicRationale
        }));

    const hasData = displayNarrative || displaySequence.length > 0;

    const renderContent = (text: string) => {
        if (!text) return <p className="text-slate-400 italic">No analysis available.</p>;

        // Check if the text actually contains bullets
        if (text.includes('•')) {
            const items = text.split('•').map(t => t.trim()).filter(t => t.length > 0);
            return (
                <ul className="space-y-3 list-disc pl-5">
                    {items.map((item, i) => (
                        <li key={i} className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed pl-1">
                            {item}
                        </li>
                    ))}
                </ul>
            );
        }

        // Fallback for paragraphs (if AI forgets bullets)
        return (
            <div className="space-y-3">
                {text.split('\n').map((line, i) => (
                    <p key={i} className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                        {line}
                    </p>
                ))}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 shadow-2xl w-[420px] overflow-hidden">
            <header className="p-6 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-slate-800">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white">Agentic Council Recommendation</h2>
                    </div>
                </div>

                {!hasData && !isLoading && (
                    <button
                        onClick={onAnalyze}
                        className="w-full mt-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
                    >
                        <span>Generate Strategy</span>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </button>
                )}

                {hasData && (
                    <button
                        onClick={onAnalyze}
                        className="w-full mt-4 py-2 text-indigo-600 hover:bg-indigo-50 font-semibold rounded-lg border border-indigo-200 transition-all text-sm"
                    >
                        ↻ Re-analyse
                    </button>
                )}
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {isLoading && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 text-indigo-600">
                            <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-sm font-semibold">Analyzing portfolio...</span>
                        </div>
                        <div className="space-y-3 animate-pulse">
                            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                            <div className="h-20 bg-slate-100 rounded-xl"></div>
                            <div className="h-20 bg-slate-100 rounded-xl"></div>
                        </div>
                    </div>
                )}

                {hasData && !isLoading && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

                        {/* Executive Summary */}
                        {displayNarrative && (
                            <div className="mb-6">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Executive Summary</h3>
                                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-slate-800 p-4 rounded-xl border border-indigo-100 dark:border-slate-700">
                                    "{displayNarrative}"
                                </p>
                            </div>
                        )}

                        {/* Council Analysis (Expandable) */}
                        {(displayDependencies || displayRisks) && (
                            <details className="mb-6 group">
                                <summary className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 cursor-pointer list-none flex items-center gap-2">
                                    <svg className="w-4 h-4 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                    Strategic Rationale
                                </summary>
                                <div className="space-y-4 mt-3 pl-6">
                                    {displayDependencies && (
                                        <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-5 rounded-r-lg shadow-sm mb-4">
                                            <h4 className="text-blue-700 dark:text-blue-400 font-bold uppercase text-xs tracking-widest mb-3">Dependency Analysis</h4>
                                            <div className="text-sm">
                                                {renderContent(displayDependencies)}
                                            </div>
                                        </div>
                                    )}
                                    {displayRisks && (
                                        <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-5 rounded-r-lg shadow-sm mb-6">
                                            <h4 className="text-amber-700 dark:text-amber-400 font-bold uppercase text-xs tracking-widest mb-3">Risk Mitigation Strategy</h4>
                                            <div className="text-sm">
                                                {renderContent(displayRisks)}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </details>
                        )}

                        {/* Execution Sequence - Grouped by Wave */}
                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
                                <span>Execution Waves</span>
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-[10px]">Optimized</span>
                            </h3>

                            {/* Group items by rank */}
                            {[1, 2, 3, 4].map(waveNum => {
                                const waveItems = displaySequence
                                    .filter((item: any) => waveNum === 4 ? item.rank >= 4 : item.rank === waveNum)
                                    .sort((a: any, b: any) => a.rank - b.rank);

                                if (waveItems.length === 0) return null;

                                const waveColors = ['bg-emerald-500', 'bg-blue-500', 'bg-violet-500', 'bg-slate-500'];
                                const waveNames = ['Wave 1: Mobilize', 'Wave 2: Scale', 'Wave 3: Optimize', 'Wave 4: Defer'];

                                return (
                                    <div key={waveNum} className="mb-4">
                                        {/* Wave Header */}
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className={`w-6 h-6 rounded-lg ${waveColors[waveNum - 1]} flex items-center justify-center text-white text-xs font-bold`}>
                                                {waveNum}
                                            </div>
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                {waveNames[waveNum - 1]}
                                            </span>
                                            {waveItems.length > 1 && (
                                                <span className="text-[10px] text-slate-400 ml-auto">
                                                    ⇄ Parallel
                                                </span>
                                            )}
                                        </div>

                                        {/* Wave Items */}
                                        <div className="space-y-2 pl-2 border-l-2 border-slate-100 dark:border-slate-700 ml-3">
                                            {waveItems.map((item: any, index: number) => (
                                                <motion.details
                                                    key={item.id}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    className="group bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                                                >
                                                    <summary className="flex items-center gap-2 p-2.5 cursor-pointer list-none select-none">
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="font-semibold text-slate-800 dark:text-gray-100 text-sm truncate">{item.projectName}</h4>
                                                        </div>
                                                        <svg className="w-4 h-4 text-slate-400 shrink-0 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                    </summary>
                                                    <div className="px-3 pb-3 pt-1 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700">
                                                        <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Strategic Logic</p>
                                                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                                            {item.rationale || "No rationale provided."}
                                                        </p>
                                                    </div>
                                                </motion.details>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
