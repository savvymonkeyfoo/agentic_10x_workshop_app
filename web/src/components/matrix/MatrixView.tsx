"use client";

import React, { useState } from 'react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, Cell, ReferenceLine, Label } from 'recharts';
import { motion } from 'framer-motion';

// --- Types ---
interface MatrixNode {
    id: string;
    name: string;
    x: number; // Complexity (Low is good/right? wait. X-Axis: Complexity. Y-Axis: Value.)
    // PRD 4.5: X=Complexity, Y=Value, Radius=Value.
    // Usually Complexity 1 (Low) is "Easy" -> Right? Or Left? 
    // Standard Matrix: Value (Y) vs Complexity (X).
    // High Value (Top), Low Complexity (Right) is "Quick Wins". 
    // Let's assume standard consulting matrix. 1=Low, 5=High.
    y: number; // Value (High is good)
    z: number; // Size (Value)
    risk: number; // For coloring or info
}

interface MatrixViewProps {
    nodes: MatrixNode[];
    hasCycle: boolean;
    cycleNodes?: string[]; // IDs of nodes involved in cycle
}

// --- Components ---

const LoopBreakerModal = ({ cycleNodes }: { cycleNodes: string[] }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-navy/80 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full border-2 border-status-risk">
            <div className="flex items-center gap-4 mb-6 text-status-risk">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h2 className="text-xl font-bold">Fatal Logic Error: Circular Dependency</h2>
            </div>

            <p className="text-slate-600 mb-6">
                The system detected a logic loop (The Ouroboros). You cannot proceed because the timeline ignores physics.
            </p>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
                <h3 className="text-xs font-bold uppercase text-slate-500 mb-3">Conflicting Chain</h3>
                <div className="flex items-center justify-center gap-2 text-sm font-semibold text-brand-navy">
                    {cycleNodes.map((node, i) => (
                        <React.Fragment key={node}>
                            <span>{node}</span>
                            {i < cycleNodes.length - 1 && <span className="text-slate-400">→</span>}
                        </React.Fragment>
                    ))}
                    <span className="text-slate-400">→</span>
                    <span className="text-status-risk">{cycleNodes[0]}</span>
                </div>
            </div>

            <button className="w-full py-3 bg-brand-navy text-white font-bold rounded-xl hover:bg-slate-800 transition-colors">
                Resolve Logic (Delete Link)
            </button>
        </div>
    </div>
);

const StrategyNarrative = () => (
    <div className="w-full bg-white/80 border-t border-[var(--glass-border)] p-6 backdrop-blur-lg">
        <h3 className="text-xs font-bold uppercase text-slate-500 mb-2">Strategy Narrative (AI Generated)</h3>
        <p className="text-brand-navy font-medium leading-relaxed">
            "We have prioritised <span className="text-brand-blue">Invoice Reconciliation Agent</span> (Seq #1) despite its moderate complexity. This allows the team to build the <span className="italic">SAP API Access</span> foundational capability in a controlled environment before deploying it to <span className="text-brand-blue">Supplier Negotiation Bot</span> (Seq #2), effectively de-risking the external commercial launch."
        </p>
    </div>
);

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-xl border border-slate-100 text-xs">
                <p className="font-bold text-brand-navy mb-1">{data.name}</p>
                <div className="space-y-1 text-slate-500">
                    <p>Value: {data.y}/5</p>
                    <p>Complexity: {data.x}/5</p>
                </div>
            </div>
        );
    }
    return null;
};

export default function MatrixView({ nodes, hasCycle, cycleNodes = [] }: MatrixViewProps) {

    if (hasCycle) {
        return <LoopBreakerModal cycleNodes={cycleNodes} />;
    }

    return (
        <div className="h-screen flex flex-col bg-[var(--bg-core)] relative overflow-hidden">
            {/* Background Zones */}
            {/* Background Zones & Labels */}
            <div className="absolute inset-0 z-0 flex flex-col p-12 pb-16">
                <div className="flex-1 flex border-b border-brand-cyan/10">
                    <div className="flex-1 border-r border-brand-cyan/10 p-4 flex justify-start items-start">
                        <span className="text-2xl font-bold text-slate-700 dark:text-white/10 uppercase tracking-widest opacity-30">Quick Win</span>
                    </div>
                    <div className="flex-1 p-4 flex justify-end items-start">
                        <span className="text-2xl font-bold text-slate-700 dark:text-white/10 uppercase tracking-widest opacity-30">Major Project</span>
                    </div>
                </div>
                <div className="flex-1 flex">
                    <div className="flex-1 border-r border-brand-cyan/10 p-4 flex justify-start items-end">
                        <span className="text-2xl font-bold text-slate-700 dark:text-white/10 uppercase tracking-widest opacity-30">Incremental</span>
                    </div>
                    <div className="flex-1 p-4 flex justify-end items-end">
                        <span className="text-2xl font-bold text-slate-700 dark:text-status-risk/20 uppercase tracking-widest opacity-30">Money Pit</span>
                    </div>
                </div>
            </div>

            {/* Axis Labels are dynamically rendered inside the Chart now */}
            <div className="absolute bottom-4 left-0 w-full text-center z-10">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Complexity / Effort &rarr;</span>
            </div>
            <div className="absolute top-0 left-4 h-full flex items-center z-10">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400 rotate-180" style={{ writingMode: 'vertical-rl' }}>Business Value &rarr;</span>
            </div>

            {/* Header */}
            <header className="relative z-10 p-8 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-brand-navy">Strategic Prioritisation Matrix</h1>
                <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-brand-blue"></span>
                        <span className="text-xs font-semibold text-slate-500">Producers</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-brand-cyan"></span>
                        <span className="text-xs font-semibold text-slate-500">Consumers</span>
                    </div>
                </div>
            </header>

            {/* Chart Area */}
            <main className="flex-1 relative z-10 p-8 pb-0 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
                        <XAxis type="number" dataKey="x" name="Complexity" unit="" domain={[1, 5]} tick={false} axisLine={false} padding={{ left: 20, right: 20 }}>
                            <Label value="Complexity / Effort →" position="insideBottomRight" offset={-5} className="fill-slate-900 dark:fill-white font-semibold text-[10px]" />
                        </XAxis>
                        <YAxis type="number" dataKey="y" name="Value" unit="" domain={[1, 5]} tick={false} axisLine={false} padding={{ top: 20, bottom: 20 }}>
                            <Label value="Business Value ↑" position="insideTopLeft" angle={-90} offset={10} className="fill-slate-900 dark:fill-white font-semibold text-[10px]" />
                        </YAxis>
                        <ZAxis type="number" dataKey="z" range={[100, 1000]} name="Value Score" />
                        <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />

                        {/* Quadrant Lines */}
                        <ReferenceLine x={3} stroke="var(--glass-border)" strokeDasharray="3 3" />
                        <ReferenceLine y={3} stroke="var(--glass-border)" strokeDasharray="3 3" />

                        <Scatter name="Opportunities" data={nodes} fill="#8884d8">
                            {nodes.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.y > 3 ? 'var(--brand-blue)' : 'var(--brand-cyan)'} />
                            ))}
                        </Scatter>
                    </ScatterChart>
                </ResponsiveContainer>
            </main>

            {/* Footer */}
            <div className="relative z-20 flex justify-between items-end">
                <div className="flex-1">
                    <StrategyNarrative />
                </div>
                <div className="p-6 bg-white/80 border-t border-l border-[var(--glass-border)] backdrop-blur-lg">
                    <a href="/charter" className="px-6 py-3 bg-brand-navy text-white font-bold rounded-xl shadow-lg hover:bg-brand-blue transition-colors block text-center">
                        View Charter &rarr;
                    </a>
                </div>
            </div>
        </div>
    );
}
