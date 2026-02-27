"use client";

import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import { Spinner } from '@/components/ui/spinner';

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
    edges?: { from: string; to: string; reason?: string }[];
}

export function AIStrategistPanel({
    analysis,
    isLoading,
    onAnalyze,
    initialNarrative = "",
    initialDependencies = "",
    initialRisks = "",
    nodes = [],
    edges = []
}: AIStrategistPanelProps) {
    // Use persisted data if no fresh analysis
    const displayNarrative = analysis?.narrative || initialNarrative;
    const displayDependencies = analysis?.dependencies || initialDependencies;
    const displayRisks = analysis?.risks || initialRisks;

    // LOCAL STATE: Manage sequence locally to handle both AI updates and DB refreshes (Drag-and-Drop)
    const [displaySequence, setDisplaySequence] = useState<SequenceItem[]>([]);

    // 1. Sync when Nodes change (Database Update / Initial Load)
    useEffect(() => {
        if (nodes.length > 0) {
            const derived = nodes
                .filter(n => n.rank)
                .sort((a, b) => (a.rank || 99) - (b.rank || 99))
                .map(n => ({
                    id: n.id,
                    projectName: n.name,
                    rank: n.rank!,
                    rationale: n.strategicRationale
                }));
            setDisplaySequence(derived);
        }
    }, [nodes]);

    // 2. Sync when Analysis changes (AI Agent Update)
    useEffect(() => {
        if (analysis?.sequence) {
            setDisplaySequence(analysis.sequence);
        }
    }, [analysis]);

    const hasData = displayNarrative || displaySequence.length > 0;

    const renderContent = (text: string) => {
        if (!text) return <p className="text-muted-foreground italic">No analysis available.</p>;

        // Convert inline bullet characters to paragraph breaks (no bullets, just spacing)
        // This handles cases where AI outputs "text. • Item1 • Item2" 
        const processedText = text
            .replace(/\s*•\s*/g, '\n\n')  // Convert inline bullets to paragraph breaks
            .trim();

        return (
            <article className="prose prose-sm prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-headings:text-foreground prose-p:my-3 prose-strong:text-foreground">
                <ReactMarkdown>{processedText}</ReactMarkdown>
            </article>
        );
    };

    return (
        <div className="flex flex-col h-full bg-card dark:bg-card border-l border-border dark:border-border shadow-2xl w-[420px] overflow-hidden">
            <header className="p-6 border-b border-border dark:border-border bg-muted/30">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shadow-sm border border-primary/20">
                        <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-foreground">Agentic Council Recommendation</h2>
                    </div>
                </div>

                {!hasData && !isLoading && (
                    <button
                        onClick={onAnalyze}
                        className="w-full mt-4 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
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
                        className="w-full mt-4 py-2 text-primary hover:bg-primary/10 font-semibold rounded-lg border border-primary/20 transition-all text-sm"
                    >
                        ↻ Re-analyse
                    </button>
                )}
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {isLoading && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 text-primary">
                            <Spinner size="md" className="text-primary" />
                            <span className="text-sm font-semibold">Analyzing portfolio...</span>
                        </div>
                        <div className="space-y-3 animate-pulse">
                            <div className="h-4 bg-muted rounded w-3/4"></div>
                            <div className="h-20 bg-muted/50 rounded-xl"></div>
                            <div className="h-20 bg-muted/50 rounded-xl"></div>
                        </div>
                    </div>
                )}

                {hasData && !isLoading && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

                        {/* Executive Summary */}
                        {displayNarrative && (
                            <div className="mb-6">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Executive Summary</h3>
                                <p className="text-sm text-foreground/90 leading-relaxed bg-muted/30 p-4 rounded-xl border border-border">
                                    {displayNarrative}
                                </p>
                            </div>
                        )}

                        {/* Council Analysis (Expandable) */}
                        {(displayDependencies || displayRisks) && (
                            <details className="mb-6 group">
                                <summary className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 cursor-pointer list-none flex items-center gap-2">
                                    <svg className="w-4 h-4 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                    Strategic Rationale
                                </summary>
                                <div className="space-y-4 mt-3 pl-6">
                                    {displayDependencies && (
                                        <div className="bg-info/10 border-l-4 border-info p-5 rounded-r-lg shadow-sm mb-4">
                                            <h4 className="text-info font-bold uppercase text-xs tracking-widest mb-3">Dependency Analysis</h4>
                                            <div className="text-sm">
                                                {renderContent(displayDependencies)}
                                            </div>
                                        </div>
                                    )}
                                    {displayRisks && (
                                        <div className="bg-warning/10 border-l-4 border-warning p-5 rounded-r-lg shadow-sm mb-6">
                                            <h4 className="text-warning font-bold uppercase text-xs tracking-widest mb-3">Risk Mitigation Strategy</h4>
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
                            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center justify-between">
                                <span>Execution Waves</span>
                                <span className="px-2 py-0.5 bg-success/10 text-success rounded text-[10px]">Optimised</span>
                            </h3>

                            {/* Group items by rank */}
                            {[1, 2, 3, 4].map(waveNum => {
                                const waveItems = displaySequence
                                    .filter((item: SequenceItem) => waveNum === 4 ? item.rank >= 4 : item.rank === waveNum)
                                    .sort((a: SequenceItem, b: SequenceItem) => a.rank - b.rank);

                                if (waveItems.length === 0) return null;

                                const waveColors = ['bg-success', 'bg-info', 'bg-intelligence', 'bg-muted'];
                                const waveNames = ['Wave 1: Mobilize', 'Wave 2: Scale', 'Wave 3: Optimise', 'Wave 4: Defer'];

                                return (
                                    <div key={waveNum} className="mb-4">
                                        {/* Wave Header */}
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className={`w-6 h-6 rounded-lg ${waveColors[waveNum - 1]} flex items-center justify-center text-primary-foreground text-xs font-bold`}>
                                                {waveNum}
                                            </div>
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                                {waveNames[waveNum - 1]}
                                            </span>
                                            {waveItems.length > 1 && (
                                                <span className="text-[10px] text-muted-foreground ml-auto">
                                                    ⇄ Parallel
                                                </span>
                                            )}
                                        </div>

                                        {/* Wave Items */}
                                        <div className="space-y-2 pl-2 border-l-2 border-border ml-3">
                                            {waveItems.map((item: SequenceItem, index: number) => {
                                                // Find dependencies
                                                const requires = edges
                                                    .filter(e => e.to === item.id)
                                                    .map(e => {
                                                        const node = nodes.find(n => n.id === e.from);
                                                        return {
                                                            name: node ? node.name : "Unknown Project",
                                                            reason: e.reason
                                                        };
                                                    });

                                                const enables = edges
                                                    .filter(e => e.from === item.id)
                                                    .map(e => {
                                                        const node = nodes.find(n => n.id === e.to);
                                                        return {
                                                            name: node ? node.name : "Unknown Project",
                                                            reason: e.reason
                                                        };
                                                    });

                                                return (
                                                    <motion.details
                                                        key={item.id}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: index * 0.05 }}
                                                        className="group bg-card rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                                                    >
                                                        <summary className="flex items-center gap-2 p-2.5 cursor-pointer list-none select-none">
                                                            <div className="flex-1 min-w-0">
                                                                <h4 className="font-semibold text-foreground text-sm truncate">{item.projectName}</h4>
                                                            </div>
                                                            <svg className="w-4 h-4 text-muted-foreground shrink-0 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7 7" />
                                                            </svg>
                                                        </summary>
                                                        <div className="px-3 pb-3 pt-1 bg-muted/30 border-t border-border">
                                                            {/* Dependency Links */}
                                                            {(requires.length > 0 || enables.length > 0) && (
                                                                <div className="mb-3 flex flex-col gap-2 pb-3 border-b border-border">
                                                                    {requires.length > 0 && (
                                                                        <div className="flex flex-col gap-1">
                                                                            <span className="text-[10px] font-bold text-warning bg-warning/10 px-1 py-0.5 rounded w-fit">REQUIRES</span>
                                                                            {requires.map((req, i) => (
                                                                                <div key={i} className="text-xs text-muted-foreground pl-1 border-l-2 border-warning/30 ml-1">
                                                                                    <span className="font-semibold">{req.name}</span>
                                                                                    {req.reason && <span className="block text-[10px] text-muted-foreground italic mt-0.5">"{req.reason}"</span>}
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                    {enables.length > 0 && (
                                                                        <div className="flex flex-col gap-1">
                                                                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-1 py-0.5 rounded w-fit">ENABLES</span>
                                                                            {enables.map((enb, i) => (
                                                                                <div key={i} className="text-xs text-muted-foreground pl-1 border-l-2 border-emerald-500/30 ml-1">
                                                                                    <span className="font-semibold">{enb.name}</span>
                                                                                    {enb.reason && <span className="block text-[10px] text-muted-foreground italic mt-0.5">"{enb.reason}"</span>}
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}

                                                            <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Strategic Logic</p>
                                                            <p className="text-xs text-muted-foreground leading-relaxed">
                                                                {item.rationale || "No rationale provided."}
                                                            </p>
                                                        </div>
                                                    </motion.details>
                                                );
                                            })}
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
