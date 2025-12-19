'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { FileText, ArrowRight, CheckCircle, Search, AlertTriangle, Copy, Check, UploadCloud, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { MOCK_RESEARCH_BRIEF, MOCK_BLIND_SPOTS, MOCK_CLUSTERS, MOCK_FEASIBILITY } from '@/mocks/research-data';
import { useRouter, useSearchParams } from 'next/navigation';
import { WorkshopPageShell } from '@/components/layouts/WorkshopPageShell';

import { Asset } from '@prisma/client';
import { AssetRegistry } from '@/components/workshop/AssetRegistry';
import { ResearchBriefButton } from './ResearchBriefButton';
import { generateBrief, generateIntelligence } from '@/app/actions/context-engine';
import { toast } from 'sonner';
import { ResearchBriefList } from './ResearchBriefList';

interface ResearchInterfaceProps {
    workshopId: string;
    assets: Asset[];
    initialBriefs?: string[];
}

export function ResearchInterface({ workshopId, assets, initialBriefs = [] }: ResearchInterfaceProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const dossierAssets = assets.filter(a => a.type === 'DOSSIER');
    const backlogAssets = assets.filter(a => a.type === 'BACKLOG');
    const marketAssets = assets.filter(a => a.type === 'MARKET_SIGNAL');

    // Count READY assets for the guardrail
    const dossierReadyCount = dossierAssets.filter(a => a.status === 'READY').length;
    const backlogReadyCount = backlogAssets.filter(a => a.status === 'READY').length;

    // Guardrail: Must have >= 1 READY asset in each category
    const isReadyForResearch = dossierReadyCount > 0 && backlogReadyCount > 0;

    // Derived state from real assets
    const hasDossier = dossierAssets.length > 0;
    const hasBacklog = backlogAssets.length > 0;
    const hasMarket = marketAssets.some(a => a.status === 'READY');

    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [briefCopied, setBriefCopied] = useState(false);
    const [generatedBriefs, setGeneratedBriefs] = useState<string[]>(initialBriefs);

    // Intelligence State
    const [intelligenceState, setIntelligenceState] = useState<'idle' | 'analyzing' | 'complete'>('idle');
    const [analysisData, setAnalysisData] = useState<{
        blindspots: any[];
        feasibility: any[];
        clusters: any[];
    } | null>(null);
    const [agentProgress, setAgentProgress] = useState(0); // 0-3 for step tracking

    // Use URL param or default to "context"
    const stageParam = searchParams.get('stage');
    const defaultTab = stageParam === '3' ? 'intelligence' : 'context';
    const [activeTab, setActiveTab] = useState(defaultTab);

    useEffect(() => {
        if (stageParam === '3') setActiveTab('intelligence');
    }, [stageParam]);

    const handleGenerateBrief = async () => {
        if (generatedBriefs.length > 0) {
            const confirmed = window.confirm(
                "⚠️ WARNING: This will overwrite your existing Research Briefs.\n\nAre you sure you want to generate new ones?"
            );
            if (!confirmed) return;
        }

        setIsAnalyzing(true);
        try {
            const result = await generateBrief(workshopId);
            if (result.success && result.brief) {
                // The current action returns a single string, wrap it in array for now or split if feasible
                // Assuming it returns one markdown blob which is the "brief"
                // Ideally backend should return array, but if string, treating as one card
                setGeneratedBriefs([result.brief]);
                setActiveTab('research');
                toast.success('Research Brief Generated');
            } else {
                toast.error(result.error || 'Failed to generate brief');
            }
        } catch (error) {
            console.error(error);
            toast.error('An unexpected error occurred');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleProcessSignals = async () => {
        if (intelligenceState === 'analyzing') return;

        setIntelligenceState('analyzing');
        setAgentProgress(0);

        // Simulation of steps for UX while waiting
        const progressInterval = setInterval(() => {
            setAgentProgress(prev => (prev < 2 ? prev + 1 : prev));
        }, 2500);

        try {
            console.log("Launching Triad Pipeline...");
            const result = await generateIntelligence(workshopId);

            clearInterval(progressInterval);
            setAgentProgress(3);

            if (result.success && result.data) {
                setAnalysisData(result.data);
                setTimeout(() => setIntelligenceState('complete'), 500);
                toast.success('Strategic Intelligence Generated');
            } else {
                toast.error(result.error || 'Pipeline failed');
                setIntelligenceState('idle');
            }
        } catch (e) {
            console.error(e);
            clearInterval(progressInterval);
            toast.error("Pipeline Error");
            setIntelligenceState('idle');
        }
    };

    const handleCopyBrief = () => {
        navigator.clipboard.writeText(generatedBriefs[0] || MOCK_RESEARCH_BRIEF);
        setBriefCopied(true);
        setTimeout(() => setBriefCopied(false), 2000);
    };

    // Tab definitions
    const tabs = [
        { id: 'context', label: 'CONTEXT', disabled: false },
        { id: 'research', label: 'RESEARCH', disabled: generatedBriefs.length === 0 && !isReadyForResearch },
        { id: 'intelligence', label: 'INTELLIGENCE', disabled: !hasMarket }
    ];

    // Header Component
    const header = (
        <div className="px-8 py-5 flex justify-between items-center">
            <div className="flex items-baseline gap-3">
                <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                    Research & Context Injection
                </h1>
            </div>
            <p className="text-sm text-slate-500">
                Ground the AI in your enterprise reality.
            </p>
        </div>
    );



    return (
        <WorkshopPageShell header={header}>
            {/* Tabs Header (Relocated Primary Action) */}
            <div className="flex justify-between items-center mb-6 pb-2">
                <div className="flex space-x-6">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => !tab.disabled && setActiveTab(tab.id)}
                            disabled={tab.disabled}
                            className={`pb-2 text-xs font-bold tracking-widest transition-colors relative ${activeTab === tab.id
                                ? 'text-brand-blue'
                                : tab.disabled
                                    ? 'text-slate-300 cursor-not-allowed'
                                    : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            {tab.label}
                            {activeTab === tab.id && (
                                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-blue" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Header Action Logic */}
                <div>
                    {activeTab === 'context' && (
                        <ResearchBriefButton
                            onClick={handleGenerateBrief}
                            isDisabled={!isReadyForResearch}
                            isLoading={isAnalyzing}
                            dossierCount={dossierReadyCount}
                            backlogCount={backlogReadyCount}
                        />
                    )}

                    {activeTab === 'research' && (
                        <Button
                            onClick={handleProcessSignals}
                            disabled={!hasMarket}
                            className={`
                                bg-purple-600 hover:bg-purple-700 text-white shadow-md transition-all 
                                flex items-center gap-2 px-4 py-2 rounded-md font-medium
                                ${!hasMarket ? 'opacity-50 cursor-not-allowed' : ''}
                            `}
                        >
                            Process Market Signals
                            <Zap className="w-4 h-4 ml-1" />
                        </Button>
                    )}

                    {activeTab === 'intelligence' && intelligenceState === 'complete' && (
                        <Button
                            className="bg-purple-600 hover:bg-purple-700 text-white shadow-md transition-all flex items-center gap-2 px-4 py-2 rounded-md font-medium"
                            onClick={() => router.push(`/workshop/${workshopId}/ideation`)}
                        >
                            Enter Ideation
                            <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                    )}
                </div>
            </div>

            {/* TAB CONTENT */}
            <div className="flex-1">
                {/* TAB 1: Context Ingestion */}
                {activeTab === 'context' && (
                    <div className="grid grid-cols-2 gap-6 h-[600px]">
                        <AssetRegistry
                            workshopId={workshopId}
                            type="DOSSIER"
                            title="Enterprise Dossier"
                            assets={dossierAssets}
                        />
                        <AssetRegistry
                            workshopId={workshopId}
                            type="BACKLOG"
                            title="Client Backlog"
                            assets={backlogAssets}
                        />


                    </div>
                )}

                {/* TAB 2: Research Loop */}
                {/* TAB 2: Research Loop */}
                {activeTab === 'research' && (
                    <div className="grid grid-cols-2 gap-6 min-h-[600px]">
                        <Card className="bg-slate-50 border-slate-200 text-slate-900 flex flex-col h-full shadow-inner">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-indigo-600 font-mono flex items-center gap-2 text-sm uppercase tracking-wider">
                                    <Search className="h-4 w-4" /> AI Research Briefs
                                </CardTitle>
                                <Badge variant="outline" className="text-xs bg-white">
                                    {generatedBriefs.length} Briefs Generated
                                </Badge>
                            </CardHeader>
                            <CardContent className="overflow-y-auto flex-1 font-mono text-sm leading-relaxed p-0">
                                {generatedBriefs.length > 0 ? (
                                    <div className="p-4">
                                        <ResearchBriefList briefs={generatedBriefs} />
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center">
                                        <Search className="h-12 w-12 mb-4 opacity-20" />
                                        <p>No research generated yet.</p>
                                        <p className="text-xs mt-2">Click "Generate" to analyze your assets.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Right Column: Market Signals Registry + Action */}
                        <div className="flex flex-col h-fit min-h-[300px] gap-6">
                            <AssetRegistry
                                workshopId={workshopId}
                                type="MARKET_SIGNAL"
                                title="Market Signals"
                                assets={marketAssets}
                            />
                        </div>
                    </div>
                )}

                {/* TAB 3: Intelligence Hub */}
                {activeTab === 'intelligence' && (
                    <div className="h-full min-h-[600px]">
                        {/* STATE 1: IDLE */}
                        {intelligenceState === 'idle' && (
                            <div className="flex flex-col items-center justify-center h-[500px] border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                                <Button
                                    size="lg"
                                    onClick={handleProcessSignals}
                                    className="h-16 px-8 text-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-xl"
                                >
                                    <Zap className="mr-2 h-6 w-6" /> Run Strategic Analysis
                                </Button>
                                <p className="mt-4 text-slate-500 font-medium tracking-wide text-sm">LAUNCH MULTI-AGENT PIPELINE</p>
                            </div>
                        )}

                        {/* STATE 2: ANALYZING */}
                        {intelligenceState === 'analyzing' && (
                            <div className="flex flex-col items-center justify-center h-[500px] space-y-8">
                                {/* Agent A */}
                                <div className={cn("flex items-center gap-4 transition-opacity duration-500", agentProgress >= 0 ? "opacity-100" : "opacity-30")}>
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                        {agentProgress > 0 ? <CheckCircle className="text-blue-600 w-6 h-6" /> : <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />}
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-bold text-slate-900">Agent A: Feasibility Auditor</h3>
                                        <p className="text-sm text-slate-500">Auditing technical constraints...</p>
                                    </div>
                                </div>

                                {/* Agent B */}
                                <div className={cn("flex items-center gap-4 transition-opacity duration-500", agentProgress >= 0 ? "opacity-100" : "opacity-30")}>
                                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                                        {agentProgress > 1 ? <CheckCircle className="text-purple-600 w-6 h-6" /> : <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />}
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-bold text-slate-900">Agent B: Market Scout</h3>
                                        <p className="text-sm text-slate-500">Scanning blindspots & trends...</p>
                                    </div>
                                </div>

                                {/* Agent C */}
                                <div className={cn("flex items-center gap-4 transition-opacity duration-500", agentProgress >= 1 ? "opacity-100" : "opacity-30")}>
                                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                                        {agentProgress > 2 ? <CheckCircle className="text-amber-600 w-6 h-6" /> : (agentProgress === 2 ? <div className="w-5 h-5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" /> : <div className="w-3 h-3 bg-amber-300 rounded-full" />)}
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-bold text-slate-900">Agent C: Opportunity Architect</h3>
                                        <p className="text-sm text-slate-500">Synthesizing strategic clusters...</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STATE 3: COMPLETE (DASHBOARD) */}
                        {intelligenceState === 'complete' && analysisData && (
                            <div className="grid grid-cols-12 gap-6 h-full">
                                {/* Row 1: Left (Blindspots) & Right (Feasibility) */}
                                <div className="col-span-4 h-[400px]">
                                    <Card className="flex flex-col h-full border-l-4 border-l-purple-500">
                                        <CardHeader>
                                            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Blind Spot Radar</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3 flex-1 overflow-y-auto">
                                            {analysisData.blindspots.map((spot, i) => (
                                                <div key={i} className="flex items-center justify-between p-3 bg-muted rounded-lg border">
                                                    <span className="font-semibold text-foreground text-sm">{spot.name}</span>
                                                    {spot.status === "CRITICAL" ? (
                                                        <Badge variant="destructive" className="flex gap-1 text-xs"><AlertTriangle size={10} /> Critical</Badge>
                                                    ) : (
                                                        <Badge variant="secondary" className="text-xs">Aligned</Badge>
                                                    )}
                                                </div>
                                            ))}
                                        </CardContent>
                                    </Card>
                                </div>

                                <div className="col-span-8 h-[400px]">
                                    <Card className="flex flex-col h-full">
                                        <CardHeader>
                                            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Feasibility Heatmap</CardTitle>
                                        </CardHeader>
                                        <CardContent className="grid grid-cols-2 gap-4 overflow-y-auto content-start">
                                            {analysisData.feasibility.map((item, i) => {
                                                const isBlocked = item.status === "BLOCKED";
                                                const isRisky = item.status === "RISKY";
                                                return (
                                                    <div key={i} className={cn("p-4 border rounded-lg flex justify-between items-center bg-white", isBlocked && "border-red-200 bg-red-50", isRisky && "border-orange-200 bg-orange-50")}>
                                                        <span className="font-medium text-sm truncate pr-2" title={item.name}>{item.name}</span>
                                                        <Badge variant={isBlocked ? "destructive" : (isRisky ? "outline" : "secondary")}>
                                                            {item.status}
                                                        </Badge>
                                                    </div>
                                                )
                                            })}
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Row 2: Clusters */}
                                <div className="col-span-12">
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 mt-2">Strategic Opportunity Clusters</h3>
                                    <div className="grid grid-cols-3 gap-6">
                                        {analysisData.clusters.map((cluster, i) => (
                                            <Card key={i} className="group p-5 hover:shadow-lg transition-all border-brand-blue/20 hover:border-brand-blue">
                                                <Badge variant="outline" className="mb-3 text-xs">{cluster.horizon}</Badge>
                                                <h4 className="text-lg font-bold text-slate-800 mb-1">{cluster.name}</h4>
                                                <p className="text-xs font-medium text-brand-blue uppercase tracking-wider mb-3">{cluster.strategy}</p>
                                                <div className="text-sm text-slate-500 font-medium">Derived from {cluster.count} insights</div>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </WorkshopPageShell>
    );
}


