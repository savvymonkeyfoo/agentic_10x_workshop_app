"use client";

import React, { useState } from 'react';
import { analyzeWorkshop } from '@/app/actions/analyze-workshop';
import { AIStrategistPanel } from './AIStrategistPanel';
import StrategicMap from './StrategicMap';

interface AnalysisDashboardProps {
    workshopId: string;
    nodes: any[];
}

export default function AnalysisDashboard({ workshopId, nodes }: AnalysisDashboardProps) {
    const [analysis, setAnalysis] = useState<any>(null);
    const [loading, setLoading] = useState(false);

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
                />
            </div>

            {/* RIGHT: Strategic Map (Pure SVG) */}
            <div className="flex-1 h-full min-w-0 relative border-l border-slate-200 dark:border-slate-800">
                <StrategicMap nodes={nodes} />
            </div>
        </div>
    );
}
