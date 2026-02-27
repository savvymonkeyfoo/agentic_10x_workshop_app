"use client";

import React, { useState } from 'react';
import { analyzeWorkshop } from '@/app/actions/analyze-workshop';
import { Button } from '@/components/ui/button';
import { AIStrategistPanel } from './AIStrategistPanel';
import StrategicMap from './StrategicMap';
import StrategicWaves from './StrategicWaves';
import { Grid3x3, Waves } from 'lucide-react';

// Types for node and opportunity data
interface NodeData {
    id: string;
    name: string;
    rank?: number;
    sequenceRank?: number;
    strategicRationale?: string;
    tShirtSize?: string;
    scoreValue?: number;
    scoreComplexity?: number;
}

interface OpportunityData {
    id: string;
    projectName: string;
    scoreValue: number;
    scoreComplexity: number;
    sequenceRank: number | null;
    benefitRevenue: number;
    benefitCostAvoidance: number;
}

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
    edges?: { from: string; to: string; reason?: string }[];
}

interface AnalysisDashboardProps {
    workshopId: string;
    nodes: NodeData[];
    opportunities: OpportunityData[];
    initialNarrative?: string;
    initialDependencies?: string;
    initialRisks?: string;
    initialEdges?: { from: string; to: string; reason?: string }[];
}

type ViewMode = 'MATRIX' | 'WAVES';

// ... imports ...

export default function AnalysisDashboard({
    workshopId,
    nodes,
    opportunities,
    initialNarrative = "",
    initialDependencies = "",
    initialRisks = "",
    initialEdges = []
}: AnalysisDashboardProps) {
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
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

    // Pass edges to StrategicMap
    const edges = analysis?.edges || initialEdges;

    return (
        <div className="flex h-screen w-screen bg-background">
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
                    edges={edges}
                />
            </div>

            {/* RIGHT: Strategy Visualization */}
            <div className="flex-1 h-full min-w-0 relative border-l border-border flex flex-col">
                {/* View Toggle Header */}
                <div className="absolute top-4 right-4 z-30 flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-card rounded-lg p-1 shadow-lg border border-border">
                        <Button
                            variant={viewMode === 'MATRIX' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('MATRIX')}
                            className="gap-2"
                        >
                            <Grid3x3 className="w-4 h-4" />
                            Matrix
                        </Button>
                        <Button
                            variant={viewMode === 'WAVES' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('WAVES')}
                            className="gap-2"
                        >
                            <Waves className="w-4 h-4" />
                            Waves
                        </Button>
                    </div>
                </div>

                {/* Conditional View Render */}
                {viewMode === 'MATRIX' ? (
                    <div className="pt-20 h-full">
                        <StrategicMap opportunities={opportunities} edges={edges} />
                    </div>
                ) : (
                    <StrategicWaves nodes={nodes} workshopId={workshopId} edges={edges} />
                )}
            </div>
        </div >
    );
}

