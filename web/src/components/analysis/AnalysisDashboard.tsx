"use client";

import React, { useState } from 'react';
import { analyzeWorkshop } from '@/app/actions/analyze-workshop';
import { AIStrategistPanel } from './AIStrategistPanel';
import StrategicMap from './StrategicMap';
import StrategicWaves from './StrategicWaves';

interface AnalysisDashboardProps {
    workshopId: string;
    nodes: any[];
    initialNarrative?: string;
    initialDependencies?: string;
    initialRisks?: string;
}

type ViewMode = 'MATRIX' | 'WAVES';

export default function AnalysisDashboard({
    workshopId,
    nodes,
    initialNarrative = "",
    initialDependencies = "",
    initialRisks = ""
}: AnalysisDashboardProps) {
    const [analysis, setAnalysis] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>('MATRIX');

    const handleAnalyze = async () => {
        setLoading(true);
        try {
            const result = await analyzeWorkshop(workshopId);
            setAnalysis(result);
        } catch (e) {
            console.error(e);
            alert("Analysis failed. Check console for details.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen w-screen bg-[var(--bg-core)] overflow-hidden">
            {/* LEFT: AI Strategist Panel (F-Pattern: Read first) */}
            <div className="h-full z-20 shrink-0">
                <AIStrategistPanel
                    analysis={analysis}
                    isLoading={loading}
                    onAnalyze={handleAnalyze}
                    initialNarrative={initialNarrative}
                    initialDependencies={initialDependencies}
                    initialRisks={initialRisks}
                    nodes={nodes}
                />
            </div>

            {/* RIGHT: Strategy Visualization */}
            <div className="flex-1 h-full min-w-0 relative border-l border-slate-200 dark:border-slate-800 flex flex-col">
                {/* View Toggle Header */}
                <div className="absolute top-4 right-4 z-30 flex items-center gap-1 bg-white dark:bg-slate-800 rounded-lg p-1 shadow-lg border border-slate-200 dark:border-slate-700">
                    <button
                        onClick={() => setViewMode('MATRIX')}
                        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'MATRIX'
                            ? 'bg-blue-500 text-white shadow'
                            : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700'
                            }`}
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <circle cx="8" cy="8" r="3" strokeWidth={2} />
                            <circle cx="16" cy="16" r="4" strokeWidth={2} />
                            <circle cx="17" cy="7" r="2" strokeWidth={2} />
                        </svg>
                        Matrix
                    </button>
                    <button
                        onClick={() => setViewMode('WAVES')}
                        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'WAVES'
                            ? 'bg-blue-500 text-white shadow'
                            : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700'
                            }`}
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                        </svg>
                        Waves
                    </button>
                </div>

                {/* Conditional View Render */}
                {viewMode === 'MATRIX' ? (
                    <StrategicMap nodes={nodes} />
                ) : (
                    <StrategicWaves nodes={nodes} />
                )}
            </div>
        </div>
    );
}
