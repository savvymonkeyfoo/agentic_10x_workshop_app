'use client';

import React from 'react';
import { motion } from 'framer-motion';

// --- Types ---
interface Opportunity {
    id: string;
    name: string;
    projectName?: string;
    x: number;
    y: number;
    tShirtSize?: string;
    rank?: number;
    financialImpact?: number;
    scoreValue?: number;
    scoreComplexity?: number;
    benefitRevenue?: number;
    benefitCostAvoidance?: number;
}

interface StrategicWavesProps {
    nodes: Opportunity[];
}

const waveHeaders = ["WAVE 1: MOBILIZE", "WAVE 2: SCALE", "WAVE 3: OPTIMIZE", "WAVE 4+: DEFER"];
const waveColors = ["border-emerald-500", "border-blue-500", "border-violet-500", "border-slate-400"];
const bgColors = ["bg-emerald-50/50", "bg-blue-50/50", "bg-violet-50/50", "bg-slate-50/50"];
const badgeColors = ["bg-emerald-500", "bg-blue-500", "bg-violet-500", "bg-slate-500"];

export default function StrategicWaves({ nodes }: StrategicWavesProps) {
    // Group by Rank (1, 2, 3, 4+)
    const waves = [1, 2, 3, 4].map(rank => {
        if (rank === 4) {
            // Wave 4+ includes rank 4 and above, plus unranked
            return nodes.filter(o => (o.rank || 99) >= 4);
        }
        return nodes.filter(o => o.rank === rank);
    });

    const formatCurrency = (val: number) => {
        if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
        if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
        return val > 0 ? `$${val}` : '$0';
    };

    return (
        <div className="h-full w-full flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
            {/* Header */}
            <header className="p-6 border-b border-slate-200/50">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Execution Waves</h1>
                <p className="text-sm text-slate-500 mt-1">Projects grouped by execution priority. Multiple projects in the same wave can run in parallel.</p>
            </header>

            {/* Waves Grid */}
            <main className="flex-1 p-6 overflow-hidden">
                <div className="h-full grid grid-cols-4 gap-4">
                    {waves.map((projects, i) => (
                        <div
                            key={i}
                            className={`flex flex-col h-full rounded-xl border-t-4 ${waveColors[i]} ${bgColors[i]} border border-slate-200/50 overflow-hidden`}
                        >
                            {/* Wave Header */}
                            <div className="p-4 border-b border-slate-200/30">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-bold tracking-widest text-slate-500 uppercase">
                                        {waveHeaders[i]}
                                    </h3>
                                    <span className={`${badgeColors[i]} text-white text-[10px] font-bold px-2 py-0.5 rounded-full`}>
                                        {projects.length}
                                    </span>
                                </div>
                            </div>

                            {/* Wave Cards */}
                            <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                                {projects.map((p, idx) => (
                                    <motion.div
                                        key={p.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow cursor-default"
                                    >
                                        {/* Card Header */}
                                        <div className="flex justify-between items-start mb-3">
                                            <span className="font-bold text-slate-800 dark:text-white text-sm leading-tight">
                                                {p.name || p.projectName}
                                            </span>
                                            {p.tShirtSize && (
                                                <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400">
                                                    {p.tShirtSize}
                                                </span>
                                            )}
                                        </div>

                                        {/* Card Stats */}
                                        <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                                            <div className="flex justify-between">
                                                <span>Value: {p.y || p.scoreValue || 0}/5</span>
                                                <span>Complexity: {p.x || p.scoreComplexity || 0}/5</span>
                                            </div>
                                            {(p.financialImpact || p.benefitRevenue || p.benefitCostAvoidance) && (
                                                <div className="pt-1 border-t border-slate-100 dark:border-slate-700 mt-1">
                                                    <span className="text-emerald-600 font-semibold">
                                                        ROI: {formatCurrency(p.financialImpact || ((p.benefitRevenue || 0) + (p.benefitCostAvoidance || 0)))}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}

                                {projects.length === 0 && (
                                    <div className="flex items-center justify-center h-32 text-slate-300 dark:text-slate-600 text-xs italic">
                                        No projects in this wave
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            {/* Footer */}
            <footer className="p-4 bg-white/70 dark:bg-slate-900/70 border-t border-slate-200/50 backdrop-blur-sm">
                <div className="flex justify-between items-center text-xs text-slate-500">
                    <span>{nodes.length} opportunities across {waves.filter(w => w.length > 0).length} waves</span>
                    <a href="/" className="font-bold text-blue-600 hover:underline">← Back to Dashboard</a>
                </div>
            </footer>
        </div>
    );
}
