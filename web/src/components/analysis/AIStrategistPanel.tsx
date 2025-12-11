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
    dependencyAnalysis?: string;
    riskAnalysis?: string;
    sequence: SequenceItem[];
}

interface AIStrategistPanelProps {
    analysis: AnalysisResult | null;
    isLoading: boolean;
    onAnalyze: () => void;
}

export function AIStrategistPanel({ analysis, isLoading, onAnalyze }: AIStrategistPanelProps) {
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
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white">AI Strategist</h2>
                        <p className="text-xs text-slate-500">Strategic Analysis · Gemini 2.5</p>
                    </div>
                </div>

                {!analysis && !isLoading && (
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

                {analysis && (
                    <button
                        onClick={onAnalyze}
                        className="w-full mt-4 py-2 text-indigo-600 hover:bg-indigo-50 font-semibold rounded-lg border border-indigo-200 transition-all text-sm"
                    >
                        ↻ Re-analyze
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

                {analysis && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

                        {/* Executive Summary */}
                        <div className="mb-6">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Executive Summary</h3>
                            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-slate-800 p-4 rounded-xl border border-indigo-100 dark:border-slate-700">
                                "{analysis.narrative}"
                            </p>
                        </div>

                        {/* Council Analysis (Expandable) */}
                        {(analysis.dependencyAnalysis || analysis.riskAnalysis) && (
                            <details className="mb-6 group">
                                <summary className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 cursor-pointer list-none flex items-center gap-2">
                                    <svg className="w-4 h-4 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                    Strategic Rationale
                                </summary>
                                <div className="space-y-3 mt-3 pl-6">
                                    {analysis.dependencyAnalysis && (
                                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                                            <p className="text-[10px] font-bold uppercase text-blue-600 mb-1">Dependency Analysis</p>
                                            <p className="text-xs text-slate-600 dark:text-slate-400">{analysis.dependencyAnalysis}</p>
                                        </div>
                                    )}
                                    {analysis.riskAnalysis && (
                                        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border-l-4 border-amber-500">
                                            <p className="text-[10px] font-bold uppercase text-amber-600 mb-1">Risk Mitigation Strategy</p>
                                            <p className="text-xs text-slate-600 dark:text-slate-400">{analysis.riskAnalysis}</p>
                                        </div>
                                    )}
                                </div>
                            </details>
                        )}

                        {/* Execution Sequence */}
                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
                                <span>Execution Sequence</span>
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-[10px]">Optimized</span>
                            </h3>
                            <div className="space-y-2">
                                {analysis.sequence.sort((a, b) => a.rank - b.rank).map((item, index) => (
                                    <motion.details
                                        key={item.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="group bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                                    >
                                        <summary className="flex items-center gap-3 p-3 cursor-pointer list-none select-none">
                                            {/* Rank Badge */}
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-lg shrink-0 ${item.rank === 1 ? 'bg-emerald-500' :
                                                    item.rank === 2 ? 'bg-blue-500' :
                                                        item.rank === 3 ? 'bg-violet-500' :
                                                            'bg-slate-500'
                                                }`}>
                                                {item.rank}
                                            </div>
                                            {/* Project Name */}
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-slate-800 dark:text-gray-100 truncate">{item.projectName}</h4>
                                                <p className="text-xs text-slate-400 mt-0.5">Click to view rationale</p>
                                            </div>
                                            {/* Chevron */}
                                            <svg className="w-5 h-5 text-slate-400 shrink-0 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </summary>

                                        {/* Expandable Rationale */}
                                        <div className="px-4 pb-4 pt-2 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700">
                                            <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Strategic Logic</p>
                                            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                                {item.rationale || "No rationale provided. Re-run analysis to generate."}
                                            </p>
                                        </div>
                                    </motion.details>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
