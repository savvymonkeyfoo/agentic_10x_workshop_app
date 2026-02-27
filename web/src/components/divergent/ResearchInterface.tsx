'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, CheckCircle, Search, Zap, Sparkles, BrainCircuit } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';
import { WorkshopPageShell } from '@/components/layouts/WorkshopPageShell';

import { Asset } from '@prisma/client';
import { AssetRegistry } from '@/components/workshop/AssetRegistry';
import { ResearchBriefButton } from './ResearchBriefButton';
import { generateBrief, analyzeBacklogItem, hydrateBacklog, getWorkshopIntelligence, resetWorkshopIntelligence, preWarmContext, updateOpportunity, deleteIdeationOpportunity } from '@/app/actions/context-engine';
import { toast } from 'sonner';
import { ResearchBriefList } from './ResearchBriefList';
import { OpportunityModal, OpportunityCardData } from '@/components/workshop/OpportunityModal';
// Dialog components removed - not currently used
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { RotateCcw } from 'lucide-react';
import { IdeaCard } from '@/components/workshop/IdeaCard';

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
    isSeed?: boolean;
};

// OPPORTUNITY CARD TYPE
type OpportunityCard = {
    title: string;
    description: string;
    friction?: string;
    techAlignment?: string;
    strategyAlignment?: string;
    source?: string;
    provenance?: string;
    originalId: string;
    // Legacy fields for compat
    category?: string;
    horizon?: string;
};

export function ResearchInterface({ workshopId, assets, initialBriefs = [] }: ResearchInterfaceProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // ASSET DATA
    const dossierAssets = assets.filter(a => a.type === 'DOSSIER');
    const backlogAssets = assets.filter(a => a.type === 'BACKLOG');
    const marketAssets = assets.filter(a => a.type === 'MARKET_SIGNAL');

    const dossierReadyCount = dossierAssets.filter(a => a.status === 'READY').length;
    const backlogReadyCount = backlogAssets.filter(a => a.status === 'READY').length;
    const isReadyForResearch = dossierReadyCount > 0 && backlogReadyCount > 0;
    const hasBacklog = backlogAssets.length > 0;

    // STATE
    const [activeTab, setActiveTab] = useState('context');
    const [generatedBriefs, setGeneratedBriefs] = useState<string[]>(initialBriefs);
    const [isGeneratingBriefs, setIsGeneratingBriefs] = useState(false);

    // INTELLIGENCE ENGINE STATE
    const [intelligenceState, setIntelligenceState] = useState<'idle' | 'initializing' | 'analyzing' | 'complete'>('idle');
    const [queue, setQueue] = useState<QueueItem[]>([]);
    const [completedCards, setCompletedCards] = useState<OpportunityCard[]>([]);
    const [selectedCard, setSelectedCard] = useState<OpportunityCard | null>(null);
    const [isResetting, setIsResetting] = useState(false);
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);

    // FIX 1: Change default state from "Initializing..." to "System Ready"
    const [currentLog, setCurrentLog] = useState<string>("System Ready");

    // EFFECTS
    useEffect(() => {
        const stageParam = searchParams.get('stage');
        if (stageParam === '1') setActiveTab('context');
        else if (stageParam === '2') setActiveTab('research');
        else if (stageParam === '3') setActiveTab('intelligence');
    }, [searchParams]);

    useEffect(() => {
        if (activeTab === 'intelligence') {
            preWarmContext(workshopId).catch(err => console.error("Warmup silent fail", err));
        }
    }, [activeTab, workshopId]);

    // Navigation warning during analysis
    useEffect(() => {
        const isAnalyzing = intelligenceState === 'analyzing' || intelligenceState === 'initializing';

        if (!isAnalyzing) return;

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = 'Analysis in progress. Results will be saved, but you may miss real-time updates.';
            return e.returnValue;
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [intelligenceState]);

    // HANDLERS
    const handleResetAnalysis = async () => {
        setIsResetting(true);
        await resetWorkshopIntelligence(workshopId);
        setCompletedCards([]);
        setQueue([]);
        setIntelligenceState('idle');
        setIsResetting(false);
        setIsResetModalOpen(false);
        setCurrentLog("System Reset Complete");
    };

    const handleCardUpdate = async (updatedCard: OpportunityCardData) => {
        setCompletedCards(prev => prev.map(c => c.originalId === updatedCard.originalId ? { ...c, ...updatedCard } : c));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await updateOpportunity(workshopId, updatedCard as any);
    };

    // HANDLE DELETE
    const handleDelete = async (card: OpportunityCardData) => {
        // Optimistic UI Update
        setCompletedCards(prev => prev.filter(c => c.originalId !== card.originalId));
        setSelectedCard(null);
        toast.success("Opportunity Deleted");

        // Server Update
        await deleteIdeationOpportunity({ workshopId, originalId: card.originalId });
    };

    // AUTO-HYDRATION
    useEffect(() => {
        if (activeTab === 'intelligence') {
            const checkSavedData = async () => {
                if (completedCards.length > 0) return;
                const saved = await getWorkshopIntelligence(workshopId);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                if (saved.success && saved.opportunities && (saved.opportunities as any[]).length > 0) {
                    setCompletedCards(saved.opportunities as OpportunityCard[]);
                    setIntelligenceState('complete');

                    // FIX 2: Explicitly set log when data is found
                    setCurrentLog("Analysis Restored");

                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    setQueue(saved.opportunities.map((op: any) => ({
                        id: op.originalId || 'restored',
                        title: op.title,
                        description: op.description,
                        status: 'COMPLETE'
                    })));
                }
            };
            checkSavedData();
        }
    }, [activeTab, workshopId, completedCards.length]);

    // DAISY CHAIN
    useEffect(() => {
        const processNextItem = async () => {
            if (intelligenceState !== 'analyzing') return;
            const isBusy = queue.some(i => i.status === 'PROCESSING');
            if (isBusy) return;

            const nextIdx = queue.findIndex(i => i.status === 'PENDING');
            if (nextIdx === -1) {
                if (queue.length > 0) {
                    setTimeout(() => {
                        setIntelligenceState('complete');
                        toast.success("Intelligence Analysis Complete");
                        setCurrentLog("Analysis Complete");
                    }, 1000);
                }
                return;
            }

            const currentItem = queue[nextIdx];
            setQueue(prev => {
                const updated = [...prev];
                updated[nextIdx] = { ...updated[nextIdx], status: 'PROCESSING' };
                return updated;
            });
            setCurrentLog(`Analysing: ${currentItem.title}...`);

            try {
                const result = await analyzeBacklogItem(workshopId, {
                    id: currentItem.id,
                    title: currentItem.title,
                    description: currentItem.description,
                    isSeed: currentItem.isSeed
                });

                if (result.success && result.opportunity) {
                    setCompletedCards(prev => [...prev, result.opportunity]);
                    setQueue(prev => {
                        const updated = [...prev];
                        updated[nextIdx] = { ...updated[nextIdx], status: 'COMPLETE' };
                        return updated;
                    });
                    setCurrentLog(`Insights Generated for ${currentItem.title}`);
                } else {
                    setQueue(prev => {
                        const updated = [...prev];
                        updated[nextIdx] = { ...updated[nextIdx], status: 'FAILED' };
                        return updated;
                    });
                    setCurrentLog(`Failed to analyse ${currentItem.title}`);
                }
            } catch (error) {
                console.error("Daisy Chain Error", error);
                setQueue(prev => {
                    const updated = [...prev];
                    updated[nextIdx] = { ...updated[nextIdx], status: 'FAILED' };
                    return updated;
                });
            }
        };

        const timer = setTimeout(() => { processNextItem(); }, 100);
        return () => clearTimeout(timer);
    }, [queue, intelligenceState, workshopId]);

    // GENERATE BRIEF
    const handleGenerateBrief = async () => {
        if (generatedBriefs.length > 0) {
            const confirmed = window.confirm("Overwrite existing Research Briefs?");
            if (!confirmed) return;
        }
        setIsGeneratingBriefs(true);
        try {
            const result = await generateBrief(workshopId);
            if (result.success && result.brief) {
                setGeneratedBriefs(result.briefs || [result.brief]);
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

    // START ANALYSIS
    const handleStartAnalysis = async () => {
        if (backlogAssets.length === 0) {
            toast.error("No backlog items to analyse");
            return;
        }
        setIntelligenceState('initializing');
        setCurrentLog("Hydrating Deep-Chain Context...");

        try {
            const result = await hydrateBacklog(workshopId);
            if (!result.success || !result.items) {
                toast.error("Failed to load backlog Items");
                setIntelligenceState('idle');
                return;
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const initialQueue: QueueItem[] = result.items.map((i: any) => ({
                id: i.id,
                title: i.title,
                description: i.description,
                status: 'PENDING',
                isSeed: i.isSeed
            }));
            setQueue(initialQueue);
            setCompletedCards([]);
            setIntelligenceState('analyzing');
        } catch (error) {
            console.error(error);
            toast.error("Initialization Failed");
            setIntelligenceState('idle');
        }
    };

    // TRACKER
    const DualStreamTracker = () => {
        const backlogQueue = queue.filter(q => !q.id || !q.id.startsWith('seed-'));
        const researchQueue = queue.filter(q => q.id && q.id.startsWith('seed-'));
        const backlogComplete = completedCards.filter(c => c.source === 'CLIENT_BACKLOG').length;
        const researchComplete = completedCards.filter(c => c.source === 'MARKET_SIGNAL').length;

        const renderProgressBar = (total: number, current: number, colorClass: string, label: string, icon: React.ReactNode) => {
            const percent = total > 0 ? Math.round((current / total) * 100) : 0;
            return (
                <div className="space-y-2">
                    <div className="flex justify-between items-end">
                        <div className="flex items-center gap-2 text-sm font-bold text-primary uppercase tracking-wider">
                            {icon} {label}
                        </div>
                        <div className="text-xs font-mono text-tertiary">
                            {current} / {total} Items
                        </div>
                    </div>
                    <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                        <div className={cn("h-full transition-all duration-500 ease-out", colorClass)} style={{ width: `${percent}%` }} />
                    </div>
                </div>
            );
        };

        return (
            <div className="w-full max-w-4xl mx-auto bg-white rounded-xl shadow-lg border border-muted p-6 mb-8">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-muted">
                    <div className="flex items-center gap-3">
                        <div className={cn("w-3 h-3 rounded-full", intelligenceState === 'analyzing' ? "bg-success animate-pulse" : "bg-muted")} />
                        <h3 className="font-bold text-primary flex items-center gap-2">
                            Deep-Chain Analysis Engine
                            {intelligenceState === 'analyzing' && <Spinner size="sm" className="text-emerald-500 ml-2" />}
                        </h3>
                    </div>
                    <div className="flex gap-3">
                        <Badge variant="outline" className="font-mono bg-white">{completedCards.length} Generated</Badge>
                        <div className="font-mono text-xs text-secondary bg-surface-subtle px-3 py-1 rounded-md border border-muted">
                            {currentLog}
                        </div>
                    </div>
                </div>
                <div className="grid gap-8">
                    {renderProgressBar(backlogQueue.length, backlogComplete, "bg-info", "Backlog Enrichment", <div className="p-1 bg-info-subtle text-info rounded"><CheckCircle className="w-3 h-3" /></div>)}
                    {renderProgressBar(researchQueue.length, researchComplete, "bg-intelligence", "Strategic Ideation", <div className="p-1 bg-intelligence-subtle text-intelligence rounded"><Zap className="w-3 h-3" /></div>)}
                </div>
            </div>
        );
    };

    const Tabs = [
        { id: 'context', label: 'CONTEXT', disabled: false },
        { id: 'research', label: 'RESEARCH', disabled: generatedBriefs.length === 0 && !isReadyForResearch },
        { id: 'intelligence', label: 'INTELLIGENCE', disabled: !hasBacklog }
    ];

    return (
        <WorkshopPageShell
            header={
                <div className="px-8 py-5 flex justify-between items-center bg-white/50 backdrop-blur-sm sticky top-0 z-10 border-b border-muted/50">
                    <div className="flex items-baseline gap-3">
                        <h1 className="text-2xl font-black text-primary tracking-tight flex items-center gap-2">
                            <BrainCircuit className="w-6 h-6 text-brand-blue" />
                            Deep-Chain Intelligence
                        </h1>
                    </div>
                </div>
            }
        >
            <div className="flex justify-between items-center mb-8 pb-2">
                <div className="flex space-x-8">
                    {Tabs.map((tab) => (
                        <Button
                            key={tab.id}
                            variant="ghost"
                            onClick={() => !tab.disabled && setActiveTab(tab.id)}
                            disabled={tab.disabled}
                            className={cn(
                                "pb-4 text-xs font-bold tracking-widest transition-all relative h-auto px-0",
                                activeTab === tab.id ? "text-brand-blue" : tab.disabled ? "text-disabled cursor-not-allowed" : "text-tertiary hover:text-secondary"
                            )}
                        >
                            {tab.label}
                            {activeTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-blue" />}
                        </Button>
                    ))}
                </div>
                <div>
                    {activeTab === 'context' && (
                        <ResearchBriefButton onClick={handleGenerateBrief} isDisabled={!isReadyForResearch} isLoading={isGeneratingBriefs} dossierCount={dossierReadyCount} backlogCount={backlogReadyCount} briefCount={generatedBriefs.length} />
                    )}
                    {activeTab === 'intelligence' && intelligenceState === 'complete' && (
                        <div className="flex gap-2">
                            <Button variant="outline" size="icon" className="h-10 w-10 text-tertiary hover:text-destructive hover:bg-destructive/10 border-muted" disabled={isResetting} onClick={() => setIsResetModalOpen(true)}>
                                <RotateCcw className="w-4 h-4" />
                            </Button>
                            <ConfirmModal isOpen={isResetModalOpen} onClose={() => setIsResetModalOpen(false)} onConfirm={handleResetAnalysis} title="Rerun Deep-Chain Analysis?" description="Permanently delete generated opportunities and reset the board." confirmLabel="Yes, Overwrite Data" isLoading={isResetting} variant="danger" />
                            <Button onClick={() => router.push(`/workshop/${workshopId}/ideation`)}>
                                Proceed to Ideation <ArrowRight className="w-4 h-4 ml-1" />
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1">
                {activeTab === 'context' && (
                    <div className="grid grid-cols-2 gap-8 h-[600px]">
                        <AssetRegistry workshopId={workshopId} type="DOSSIER" title="Enterprise Dossier" assets={dossierAssets} />
                        <AssetRegistry workshopId={workshopId} type="BACKLOG" title="Client Backlog" assets={backlogAssets} />
                    </div>
                )}

                {activeTab === 'research' && (
                    <div className="grid grid-cols-2 gap-8 min-h-[600px]">
                        <Card className="bg-surface-subtle border-muted shadow-sm flex flex-col h-full">
                            <CardHeader className="flex flex-row items-center justify-between pb-2 bg-white border-b border-muted rounded-t-xl">
                                <CardTitle className="text-intelligence font-mono flex items-center gap-2 text-sm uppercase tracking-wider">
                                    <Search className="h-4 w-4" /> AI Research Briefs
                                </CardTitle>
                                <Badge variant="outline">{generatedBriefs.length} Briefs</Badge>
                            </CardHeader>
                            <CardContent className="overflow-y-auto flex-1 p-0">
                                {generatedBriefs.length > 0 ? (
                                    <div className="p-4"><ResearchBriefList briefs={generatedBriefs} /></div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-tertiary p-8 text-center"><p>No research generated yet.</p></div>
                                )}
                            </CardContent>
                        </Card>
                        <div className="flex flex-col h-fit gap-6">
                            <AssetRegistry workshopId={workshopId} type="MARKET_SIGNAL" title="Market Signals" assets={marketAssets} />
                        </div>
                    </div>
                )}

                {activeTab === 'intelligence' && (
                    <div className="min-h-[600px]">
                        {intelligenceState === 'idle' && (
                            <div className="flex flex-col items-center justify-center h-[500px] border-2 border-dashed border-muted rounded-xl bg-surface-subtle/50">
                                <div className="text-center max-w-lg space-y-6">
                                    <div className="w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center mx-auto text-intelligence"><Sparkles className="w-8 h-8" /></div>
                                    <h2 className="text-2xl font-black text-primary">Ready to Analyse Backlog?</h2>
                                    <p className="text-secondary">The Deep-Chain Engine will forensically audit each item, cross-reference it with our research, and generate strategic opportunity cards.</p>
                                    <Button variant="ai" size="lg" onClick={handleStartAnalysis} className="h-14 px-8 text-lg shadow-xl shadow-purple-500/20 hover:scale-105 transition-all">
                                        <Zap className="mr-2 h-5 w-5" /> Initialize Deep-Chain Sequence
                                    </Button>
                                    <div className="flex items-center justify-center gap-4 text-xs font-mono text-tertiary">
                                        <span>{backlogAssets.length} Items Queued</span><span>•</span><span>{dossierReadyCount > 0 ? "DNA Loaded" : "No DNA"}</span><span>•</span><span>{generatedBriefs.length} Research Briefs</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        {intelligenceState === 'initializing' && (
                            <div className="flex flex-col items-center justify-center h-[500px]">
                                <Spinner size="lg" className="text-intelligence mb-4" /><h3 className="font-bold text-lg text-primary">Hydrating Deep-Chain Context...</h3><p className="text-secondary text-sm">Parsing backlog logic and loading technical DNA</p>
                            </div>
                        )}
                        {(intelligenceState === 'analyzing' || intelligenceState === 'complete') && (
                            <div className="space-y-8 animate-in fade-in duration-500">
                                <DualStreamTracker />
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {completedCards.map((card, i) => (
                                        <IdeaCard
                                            key={i}
                                            card={{
                                                ...card,
                                                id: card.originalId,
                                                source: card.source || 'WORKSHOP_GENERATED'
                                            }}
                                            onClick={() => setSelectedCard(card)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <OpportunityModal
                card={selectedCard}
                isOpen={!!selectedCard}
                onClose={() => setSelectedCard(null)}
                onSave={handleCardUpdate}
                onDelete={handleDelete}
            />
        </WorkshopPageShell>
    );
}
