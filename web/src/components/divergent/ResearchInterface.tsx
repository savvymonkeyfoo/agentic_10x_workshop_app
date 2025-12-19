'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, CheckCircle, Search, Zap, Loader2, Sparkles, BrainCircuit } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';
import { WorkshopPageShell } from '@/components/layouts/WorkshopPageShell';

import { Asset } from '@prisma/client';
import { AssetRegistry } from '@/components/workshop/AssetRegistry';
import { ResearchBriefButton } from './ResearchBriefButton';
import { generateBrief, analyzeBacklogItem, hydrateBacklog } from '@/app/actions/context-engine';
import { toast } from 'sonner';
import { ResearchBriefList } from './ResearchBriefList';

interface ResearchInterfaceProps {
    workshopId: string;
    assets: Asset[];
    initialBriefs?: string[];
}

// QUEUE ITEM TYPE
type QueueItem = {
    id: string;
    title: string;
    description: string;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETE' | 'FAILED';
};

// OPPORTUNITY CARD TYPE (Matches Server Output)
type OpportunityCard = {
    title: string;
    description: string;
    status: "READY" | "RISKY" | "BLOCKED";
    horizon: "NOW" | "NEXT" | "LATER";
    category: "EFFICIENCY" | "GROWTH" | "MOONSHOT";
    originalId: string;
};

export function ResearchInterface({ workshopId, assets, initialBriefs = [] }: ResearchInterfaceProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // =========================================================================
    // ASSET DATA
    // =========================================================================
    const dossierAssets = assets.filter(a => a.type === 'DOSSIER');
    const backlogAssets = assets.filter(a => a.type === 'BACKLOG');
    const marketAssets = assets.filter(a => a.type === 'MARKET_SIGNAL');

    // Count READY assets
    const dossierReadyCount = dossierAssets.filter(a => a.status === 'READY').length;
    const backlogReadyCount = backlogAssets.filter(a => a.status === 'READY').length;
    const isReadyForResearch = dossierReadyCount > 0 && backlogReadyCount > 0;
    const hasBacklog = backlogAssets.length > 0;
    const hasMarket = marketAssets.some(a => a.status === 'READY');

    // =========================================================================
    // STATE
    // =========================================================================
    const [activeTab, setActiveTab] = useState('context');
    const [generatedBriefs, setGeneratedBriefs] = useState<string[]>(initialBriefs);

    // Research Generation State
    const [isGeneratingBriefs, setIsGeneratingBriefs] = useState(false);

    // INTELLIGENCE ENGINE STATE
    const [intelligenceState, setIntelligenceState] = useState<'idle' | 'initializing' | 'analyzing' | 'complete'>('idle');
    const [queue, setQueue] = useState<QueueItem[]>([]);
    const [completedCards, setCompletedCards] = useState<OpportunityCard[]>([]);
    const [currentLog, setCurrentLog] = useState<string>("Initializing Engine...");

    // Context Cache REMOVED - Handled Lazy-Load on Server
    // const contextCache = useRef<{ dna: string; research: string } | null>(null);

    // =========================================================================
    // EFFECTS
    // =========================================================================

    // Tab switching based on URL
    useEffect(() => {
        const stageParam = searchParams.get('stage');
        if (stageParam === '3') setActiveTab('intelligence');
        else if (stageParam === '2') setActiveTab('research');
    }, [searchParams]);

    // THE DAISY CHAIN ORCHESTRATOR
    useEffect(() => {
        const processNextItem = async () => {
            if (intelligenceState !== 'analyzing') return;

            // 1. Find next pending item
            const nextIdx = queue.findIndex(i => i.status === 'PENDING');

            // 2. CHECK FOR COMPLETION
            if (nextIdx === -1) {
                // If queue is not empty and no pending items, we are done
                if (queue.length > 0) {
                    // Small delay for UI polish
                    setTimeout(() => {
                        setIntelligenceState('complete');
                        toast.success("Intelligence Analysis Complete");
                    }, 1000);
                }
                return;
            }

            // 3. PREPARE ITEM
            const currentItem = queue[nextIdx];

            // Optimistic UI Update: Mark as Processing
            const newQueue = [...queue];
            newQueue[nextIdx].status = 'PROCESSING';
            setQueue(newQueue);

            // UI Log
            setCurrentLog(`Analyzing: ${currentItem.title}...`);

            try {
                // 4. CALL SERVER ACTION
                // Context is now Lazy-Loaded on the Server
                const result = await analyzeBacklogItem(
                    workshopId,
                    { id: currentItem.id, title: currentItem.title, description: currentItem.description }
                );

                if (result.success && result.opportunity) {
                    // 5. SUCCESS
                    setCompletedCards(prev => [...prev, result.opportunity]);

                    const successQueue = [...newQueue];
                    successQueue[nextIdx].status = 'COMPLETE';
                    setQueue(successQueue);

                    setCurrentLog(`Insights Generated for ${currentItem.title}`);
                } else {
                    // 6. FAILURE
                    const failQueue = [...newQueue];
                    failQueue[nextIdx].status = 'FAILED';
                    setQueue(failQueue);
                    setCurrentLog(`Failed to analyze ${currentItem.title}`);
                }

            } catch (error) {
                console.error("Daisy Chain Error", error);
                const failQueue = [...newQueue];
                failQueue[nextIdx].status = 'FAILED';
                setQueue(failQueue);
            }
        };

        // Run the processor when queue or state changes
        // Use a timeout to prevent rapid-fire loops if something breaks, serves as rate limiter
        const timer = setTimeout(() => {
            processNextItem();
        }, 100); // 100ms throttle

        return () => clearTimeout(timer);
    }, [queue, intelligenceState, workshopId]);


    // =========================================================================
    // HANDLERS
    // =========================================================================

    const handleGenerateBrief = async () => {
        if (generatedBriefs.length > 0) {
            const confirmed = window.confirm("⚠️ WARNING: Overwrite existing Research Briefs?");
            if (!confirmed) return;
        }

        setIsGeneratingBriefs(true);
        try {
            const result = await generateBrief(workshopId);
            if (result.success && result.brief) {
                setGeneratedBriefs(result.briefs || [result.brief]); // Handle array vs string
                setActiveTab('research');
                toast.success('Research Brief Generated');
            } else {
                toast.error(result.error || 'Failed to generate brief');
            }
        } catch (error) {
            toast.error('An unexpected error occurred');
        } finally {
            setIsGeneratingBriefs(false);
        }
    };

    const handleStartAnalysis = async () => {
        if (backlogAssets.length === 0) {
            toast.error("No backlog items to analyze");
            return;
        }

        setIntelligenceState('initializing');
        setCurrentLog("Hydrating Deep-Chain Context...");

        try {
            // 1. Fetch Backlog Items (Fast Hydration)
            const result = await hydrateBacklog(workshopId);

            if (!result.success || !result.items) {
                toast.error("Failed to load backlog Items");
                setIntelligenceState('idle');
                return;
            }

            // 2. Cache Context - REMOVED (Server Side)

            // 3. Hydrate Queue
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const initialQueue: QueueItem[] = result.items.map((i: any) => ({
                id: i.id,
                title: i.title,
                description: i.description,
                status: 'PENDING'
            }));

            setQueue(initialQueue);
            setCompletedCards([]);

            // 4. Start Daisy Chain
            setIntelligenceState('analyzing');

        } catch (error) {
            console.error(error);
            toast.error("Initialization Failed");
            setIntelligenceState('idle');
        }
    };

    // =========================================================================
    // UI COMPONENTS
    // =========================================================================

    const PizzaTracker = () => {
        const total = queue.length;
        const processed = completedCards.length;
        const percent = total > 0 ? Math.round((processed / total) * 100) : 0;

        // Circular Progress Math
        const radius = 30;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (percent / 100) * circumference;

        return (
            <div className="w-full max-w-4xl mx-auto bg-white rounded-xl shadow-lg border border-purple-100 p-6 mb-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gray-100">
                    <div
                        className="h-full bg-purple-600 transition-all duration-500 ease-out"
                        style={{ width: `${percent}%` }}
                    />
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        {/* Circular Progress */}
                        <div className="relative w-20 h-20 flex-shrink-0">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle
                                    cx="40" cy="40" r={radius}
                                    stroke="#f3f4f6" strokeWidth="6" fill="transparent"
                                />
                                <circle
                                    cx="40" cy="40" r={radius}
                                    stroke="currentColor" strokeWidth="6" fill="transparent"
                                    className="text-purple-600 transition-all duration-500"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={offset}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center flex-col">
                                <span className="text-xl font-bold text-purple-900">{percent}%</span>
                            </div>
                        </div>

                        {/* Status Text */}
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-lg text-gray-900">Deep-Chain Analysis Active</h3>
                                <Badge variant="secondary" className="bg-purple-100 text-purple-700 animate-pulse">
                                    Live
                                </Badge>
                            </div>
                            <p className="text-sm text-purple-600 font-mono flex items-center gap-2">
                                {intelligenceState === 'analyzing' && <Loader2 className="w-3 h-3 animate-spin" />}
                                {currentLog}
                            </p>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="text-right">
                        <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Items Processed</div>
                        <div className="text-3xl font-black text-gray-900 tracking-tight">
                            {processed} <span className="text-gray-300 text-xl font-normal">/ {total}</span>
                        </div>
                    </div>
                </div>

                {/* Recent Success Pop */}
                {processed > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-3 text-sm text-gray-600 animate-in fade-in slide-in-from-top-1">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Analysis complete: <span className="font-bold text-gray-800">{completedCards[processed - 1].title}</span></span>
                        <span className="ml-auto text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-500 font-mono">
                            {completedCards[processed - 1].category}
                        </span>
                    </div>
                )}
            </div>
        );
    };

    const Tabs = [
        { id: 'context', label: 'CONTEXT', disabled: false },
        { id: 'research', label: 'RESEARCH', disabled: generatedBriefs.length === 0 && !isReadyForResearch },
        { id: 'intelligence', label: 'INTELLIGENCE', disabled: !hasMarket } // Using existing flag logic
    ];

    // =========================================================================
    // RENDER
    // =========================================================================

    return (
        <WorkshopPageShell
            header={
                <div className="px-8 py-5 flex justify-between items-center bg-white/50 backdrop-blur-sm sticky top-0 z-10 border-b border-slate-100/50">
                    <div className="flex items-baseline gap-3">
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                            <BrainCircuit className="w-6 h-6 text-brand-blue" />
                            Deep-Chain Intelligence
                        </h1>
                    </div>
                </div>
            }
        >
            {/* TABS HEADER */}
            <div className="flex justify-between items-center mb-8 pb-2 border-b border-slate-100">
                <div className="flex space-x-8">
                    {Tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => !tab.disabled && setActiveTab(tab.id)}
                            disabled={tab.disabled}
                            className={cn(
                                "pb-4 text-xs font-bold tracking-widest transition-all relative",
                                activeTab === tab.id
                                    ? "text-brand-blue"
                                    : tab.disabled ? "text-slate-300 cursor-not-allowed" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            {tab.label}
                            {activeTab === tab.id && (
                                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-blue" />
                            )}
                        </button>
                    ))}
                </div>

                {/* HEADER ACTIONS */}
                <div>
                    {activeTab === 'context' && (
                        <ResearchBriefButton
                            onClick={handleGenerateBrief}
                            isDisabled={!isReadyForResearch}
                            isLoading={isGeneratingBriefs}
                            dossierCount={dossierReadyCount}
                            backlogCount={backlogReadyCount}
                        />
                    )}
                    {activeTab === 'intelligence' && intelligenceState === 'complete' && (
                        <Button onClick={() => router.push(`/workshop/${workshopId}/ideation`)}>
                            Proceeed to Ideation <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                    )}
                </div>
            </div>

            {/* TAB CONTENT */}
            <div className="flex-1">

                {/* 1. CONTEXT */}
                {activeTab === 'context' && (
                    <div className="grid grid-cols-2 gap-8 h-[600px]">
                        <AssetRegistry workshopId={workshopId} type="DOSSIER" title="Enterprise Dossier" assets={dossierAssets} />
                        <AssetRegistry workshopId={workshopId} type="BACKLOG" title="Client Backlog" assets={backlogAssets} />
                    </div>
                )}

                {/* 2. RESEARCH */}
                {activeTab === 'research' && (
                    <div className="grid grid-cols-2 gap-8 min-h-[600px]">
                        <Card className="bg-slate-50 border-slate-200 shadow-sm flex flex-col h-full">
                            <CardHeader className="flex flex-row items-center justify-between pb-2 bg-white border-b border-slate-100 rounded-t-xl">
                                <CardTitle className="text-indigo-600 font-mono flex items-center gap-2 text-sm uppercase tracking-wider">
                                    <Search className="h-4 w-4" /> AI Research Briefs
                                </CardTitle>
                                <Badge variant="outline">{generatedBriefs.length} Briefs</Badge>
                            </CardHeader>
                            <CardContent className="overflow-y-auto flex-1 p-0">
                                {generatedBriefs.length > 0 ? (
                                    <div className="p-4"><ResearchBriefList briefs={generatedBriefs} /></div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center">
                                        <p>No research generated yet.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Market Signals (Kept for reference, though less critical in Daisy Chain flow) */}
                        <div className="flex flex-col h-fit gap-6">
                            <AssetRegistry workshopId={workshopId} type="MARKET_SIGNAL" title="Market Signals" assets={marketAssets} />
                        </div>
                    </div>
                )}

                {/* 3. INTELLIGENCE (THE MAIN EVENT) */}
                {activeTab === 'intelligence' && (
                    <div className="min-h-[600px]">

                        {/* STATE: IDLE */}
                        {intelligenceState === 'idle' && (
                            <div className="flex flex-col items-center justify-center h-[500px] border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                                <div className="text-center max-w-lg space-y-6">
                                    <div className="w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center mx-auto text-purple-600">
                                        <Sparkles className="w-8 h-8" />
                                    </div>
                                    <h2 className="text-2xl font-black text-slate-800">Ready to Analyze Backlog?</h2>
                                    <p className="text-slate-500">
                                        The Deep-Chain Engine will forensically audit each item, cross-reference it with our research, and generate strategic opportunity cards.
                                    </p>
                                    <Button
                                        size="lg"
                                        onClick={handleStartAnalysis}
                                        className="h-14 px-8 text-lg bg-purple-600 hover:bg-purple-700 shadow-xl shadow-purple-200 transition-all hover:scale-105"
                                    >
                                        <Zap className="mr-2 h-5 w-5" /> Initialize Deep-Chain Sequence
                                    </Button>
                                    <div className="flex items-center justify-center gap-4 text-xs font-mono text-slate-400">
                                        <span>{backlogAssets.length} Items Queued</span>
                                        <span>•</span>
                                        <span>{dossierReadyCount > 0 ? "DNA Loaded" : "No DNA"}</span>
                                        <span>•</span>
                                        <span>{generatedBriefs.length} Research Briefs</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STATE: INITIALIZING */}
                        {intelligenceState === 'initializing' && (
                            <div className="flex flex-col items-center justify-center h-[500px]">
                                <Loader2 className="w-12 h-12 text-purple-600 animate-spin mb-4" />
                                <h3 className="font-bold text-lg text-slate-700">Hydrating Deep-Chain Context...</h3>
                                <p className="text-slate-500 text-sm">Parsing backlog logic and loading technical DNA</p>
                            </div>
                        )}

                        {/* STATE: ACTIVE OR COMPLETE */}
                        {(intelligenceState === 'analyzing' || intelligenceState === 'complete') && (
                            <div className="space-y-8 animate-in fade-in duration-500">
                                {/* PIZZA TRACKER */}
                                <PizzaTracker />

                                {/* KANBAN BOARD */}
                                <div className="grid grid-cols-3 gap-6">
                                    {/* COL 1: EFFICIENCY */}
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                            Efficiency (Now)
                                        </h3>
                                        {completedCards.filter(c => c.category === 'EFFICIENCY').map((card, i) => (
                                            <Card key={i} className="border-l-4 border-l-emerald-500 shadow-sm animate-in slide-in-from-bottom-2 fade-in hover:shadow-md transition-all">
                                                <CardContent className="p-4">
                                                    <h4 className="font-bold text-slate-800 text-sm mb-2">{card.title}</h4>
                                                    <p className="text-xs text-slate-500 leading-relaxed mb-3">{card.description}</p>
                                                    <Badge variant="outline" className="text-[10px] text-emerald-700 bg-emerald-50 border-emerald-100">
                                                        {card.status}
                                                    </Badge>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>

                                    {/* COL 2: GROWTH */}
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                                            Growth (Next)
                                        </h3>
                                        {completedCards.filter(c => c.category === 'GROWTH').map((card, i) => (
                                            <Card key={i} className="border-l-4 border-l-blue-500 shadow-sm animate-in slide-in-from-bottom-2 fade-in hover:shadow-md transition-all">
                                                <CardContent className="p-4">
                                                    <h4 className="font-bold text-slate-800 text-sm mb-2">{card.title}</h4>
                                                    <p className="text-xs text-slate-500 leading-relaxed mb-3">{card.description}</p>
                                                    <Badge variant="outline" className="text-[10px] text-blue-700 bg-blue-50 border-blue-100">
                                                        {card.status}
                                                    </Badge>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>

                                    {/* COL 3: MOONSHOT */}
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-bold text-purple-600 uppercase tracking-widest flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-purple-500" />
                                            Moonshot (Later)
                                        </h3>
                                        {completedCards.filter(c => c.category === 'MOONSHOT').map((card, i) => (
                                            <Card key={i} className="border-l-4 border-l-purple-500 shadow-sm animate-in slide-in-from-bottom-2 fade-in hover:shadow-md transition-all">
                                                <CardContent className="p-4">
                                                    <h4 className="font-bold text-slate-800 text-sm mb-2">{card.title}</h4>
                                                    <p className="text-xs text-slate-500 leading-relaxed mb-3">{card.description}</p>
                                                    <Badge variant="outline" className="text-[10px] text-purple-700 bg-purple-50 border-purple-100">
                                                        {card.status}
                                                    </Badge>
                                                </CardContent>
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
