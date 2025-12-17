'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Upload, FileText, ArrowRight, CheckCircle, Search, AlertTriangle, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { MOCK_RESEARCH_BRIEF, MOCK_BLIND_SPOTS, MOCK_CLUSTERS, MOCK_FEASIBILITY } from '@/mocks/research-data';
import { useRouter, useSearchParams } from 'next/navigation';
import { WorkshopPageShell } from '@/components/layouts/WorkshopPageShell';

export function ResearchInterface({ workshopId }: { workshopId: string }) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [files, setFiles] = useState<{ dossier: boolean; backlog: boolean; market: boolean }>({
        dossier: false,
        backlog: false,
        market: false
    });
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [briefCopied, setBriefCopied] = useState(false);

    // Use URL param or default to "context"
    const stageParam = searchParams.get('stage');
    const defaultTab = stageParam === '3' ? 'intelligence' : 'context';
    const [activeTab, setActiveTab] = useState(defaultTab);

    useEffect(() => {
        if (stageParam === '3') setActiveTab('intelligence');
    }, [stageParam]);

    const handleGenerateBrief = () => {
        setIsAnalyzing(true);
        setTimeout(() => {
            setIsAnalyzing(false);
            setActiveTab('research');
        }, 2000);
    };

    const handleSynthesize = () => {
        setIsAnalyzing(true);
        setTimeout(() => {
            setIsAnalyzing(false);
            setActiveTab('intelligence');
        }, 1500);
    };

    const handleCopyBrief = () => {
        navigator.clipboard.writeText(MOCK_RESEARCH_BRIEF);
        setBriefCopied(true);
        setTimeout(() => setBriefCopied(false), 2000);
    };

    // Tab definitions
    const tabs = [
        { id: 'context', label: 'CONTEXT', disabled: false },
        { id: 'research', label: 'RESEARCH', disabled: !files.dossier || !files.backlog },
        { id: 'intelligence', label: 'INTELLIGENCE', disabled: !files.market }
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
            {/* Tabs Header (Matches InputCanvas style exactly) */}
            <div className="flex space-x-6 border-b border-[var(--glass-border)] mb-6 pb-2">
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

            {/* TAB CONTENT */}
            <div className="flex-1">
                {/* TAB 1: Context Ingestion */}
                {activeTab === 'context' && (
                    <div className="grid grid-cols-2 gap-6">
                        <UploadZone
                            label="Enterprise Dossier"
                            sub="Upload Strategy PDFs, Tech Stack, or Architecture docs."
                            icon={<FileText className="h-8 w-8 text-brand-blue" />}
                            isUploaded={files.dossier}
                            onUpload={() => setFiles(prev => ({ ...prev, dossier: true }))}
                        />
                        <UploadZone
                            label="Client Backlog"
                            sub="Upload CSV export of current Jira/Azure backlog."
                            icon={<Upload className="h-8 w-8 text-emerald-500" />}
                            isUploaded={files.backlog}
                            onUpload={() => setFiles(prev => ({ ...prev, backlog: true }))}
                        />
                        <div className="col-span-2 flex justify-center mt-8">
                            <Button
                                size="lg"
                                className="w-64"
                                disabled={!files.dossier || !files.backlog || isAnalyzing}
                                onClick={handleGenerateBrief}
                            >
                                {isAnalyzing ? "Analyzing Ecosystem..." : "Generate Research Brief"}
                            </Button>
                        </div>
                    </div>
                )}

                {/* TAB 2: Research Loop */}
                {activeTab === 'research' && (
                    <div className="grid grid-cols-2 gap-6 min-h-[600px]">
                        <Card className="bg-slate-900 border-slate-800 text-slate-100 flex flex-col h-full">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="text-green-400 font-mono flex items-center gap-2">
                                    <Search className="h-4 w-4" /> AI Research Brief
                                </CardTitle>
                                <Button variant="ghost" size="sm" onClick={handleCopyBrief} className="text-slate-400 hover:text-white">
                                    {briefCopied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                                </Button>
                            </CardHeader>
                            <CardContent className="overflow-y-auto flex-1 font-mono text-sm leading-relaxed">
                                <div className="prose prose-invert max-w-none">
                                    <ReactMarkdown>{MOCK_RESEARCH_BRIEF}</ReactMarkdown>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="flex flex-col h-full">
                            <CardHeader>
                                <CardTitle className="text-lg">Upload Market Signals</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col items-center justify-center text-center">
                                <p className="text-sm text-muted-foreground max-w-xs mb-4">
                                    Upload competitor reports or trend analysis articles based on the brief.
                                </p>
                                <Button
                                    variant={files.market ? "secondary" : "default"}
                                    onClick={() => setFiles(prev => ({ ...prev, market: true }))}
                                >
                                    {files.market ? <span className="flex items-center gap-2"><CheckCircle size={16} /> Signals Uploaded</span> : "Upload Evidence"}
                                </Button>
                            </CardContent>
                            <div className="p-6 pt-0">
                                <Button
                                    size="lg"
                                    className="w-full h-14 text-lg"
                                    disabled={!files.market || isAnalyzing}
                                    onClick={handleSynthesize}
                                >
                                    {isAnalyzing ? "Synthesizing Vectors..." : "Enter Intelligence Hub"} <ArrowRight className="ml-2" />
                                </Button>
                            </div>
                        </Card>
                    </div>
                )}

                {/* TAB 3: Intelligence Hub */}
                {activeTab === 'intelligence' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 min-h-[500px]">
                        {/* COL 1: Blind Spot Radar */}
                        <Card className="flex flex-col h-full">
                            <CardHeader>
                                <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Blind Spot Radar</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 flex-1 overflow-y-auto">
                                {MOCK_BLIND_SPOTS.map((spot, i) => (
                                    <Dialog key={i}>
                                        <DialogTrigger asChild>
                                            <div className="flex items-center justify-between p-3 bg-muted rounded-lg border cursor-pointer hover:bg-accent transition-colors group">
                                                <span className="font-semibold text-foreground text-sm group-hover:text-brand-blue underline-offset-4 group-hover:underline">{spot.name}</span>
                                                {spot.status === "CRITICAL" ? (
                                                    <Badge variant="destructive" className="flex gap-1 text-xs"><AlertTriangle size={10} /> Critical</Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="text-xs">Aligned</Badge>
                                                )}
                                            </div>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Market Evidence: {spot.name}</DialogTitle>
                                                <DialogDescription>Why this is a blind spot for your organization.</DialogDescription>
                                            </DialogHeader>
                                            <div className="mt-4 p-6 bg-muted rounded-lg border min-h-[150px]">
                                                <p className="text-base text-foreground leading-relaxed font-medium">{spot.evidence}</p>
                                            </div>
                                            <DialogFooter>
                                                <DialogClose asChild><Button variant="secondary">Close</Button></DialogClose>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                ))}
                            </CardContent>
                        </Card>

                        {/* COL 2: Feasibility Heatmap */}
                        <Card className="flex flex-col h-full">
                            <CardHeader>
                                <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Feasibility Heatmap</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 flex-1 overflow-y-auto">
                                {MOCK_FEASIBILITY.map((item, i) => {
                                    let badgeVariant: "default" | "secondary" | "destructive" | "outline" = "secondary";
                                    if (item.status === "BLOCKED") badgeVariant = "destructive";

                                    return (
                                        <Dialog key={i}>
                                            <DialogTrigger asChild>
                                                <div className="flex items-center justify-between p-3 border-b last:border-0 cursor-pointer hover:bg-accent transition-colors">
                                                    <span className="text-sm font-medium text-foreground truncate mr-2" title={item.name}>{item.name}</span>
                                                    <Badge variant={badgeVariant} className="text-xs uppercase">{item.status}</Badge>
                                                </div>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Feasibility Check: {item.name}</DialogTitle>
                                                    <DialogDescription>Technical constraints and capabilities.</DialogDescription>
                                                </DialogHeader>
                                                <div className="mt-4 p-6 bg-muted rounded-lg border min-h-[150px]">
                                                    <p className="text-base text-foreground leading-relaxed font-medium">{item.evidence}</p>
                                                </div>
                                                <DialogFooter>
                                                    <DialogClose asChild><Button variant="secondary">Close</Button></DialogClose>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    )
                                })}
                            </CardContent>
                        </Card>

                        {/* COL 3: Strategic Clusters */}
                        <Card className="flex flex-col h-full">
                            <CardHeader>
                                <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Strategic Clusters</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 space-y-4 overflow-y-auto">
                                {MOCK_CLUSTERS.map((cluster, i) => (
                                    <Card
                                        key={i}
                                        onClick={() => router.push(`/workshop/${workshopId}/ideation`)}
                                        className="group cursor-pointer p-4 hover:shadow-md transition-all hover:border-brand-blue"
                                    >
                                        <Badge variant="outline" className="mb-2 text-xs">🎯 {cluster.strategy}</Badge>
                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">{cluster.horizon}</p>
                                        <h4 className="text-lg font-bold text-foreground group-hover:text-brand-blue transition-colors">{cluster.name}</h4>
                                        <p className="text-sm font-medium text-brand-blue">{cluster.count} Opportunities</p>
                                    </Card>
                                ))}
                            </CardContent>
                            <div className="p-6 pt-0">
                                <Button size="lg" className="w-full" onClick={() => router.push(`/workshop/${workshopId}/ideation`)}>
                                    Enter Sandbox <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </Card>
                    </div>
                )}
            </div>
        </WorkshopPageShell>
    );
}

// Sub-component: UploadZone (uses Card primitive)
function UploadZone({ label, sub, icon, isUploaded, onUpload }: { label: string, sub: string, icon: React.ReactNode, isUploaded: boolean, onUpload: () => void }) {
    return (
        <Card
            onClick={onUpload}
            className={cn(
                "h-64 flex flex-col items-center justify-center cursor-pointer transition-all border-2 border-dashed",
                isUploaded
                    ? "border-emerald-500 bg-emerald-50/30 ring-2 ring-emerald-100"
                    : "border-border hover:border-brand-blue hover:bg-accent"
            )}
        >
            {isUploaded ? <CheckCircle className="h-12 w-12 text-emerald-500 mb-4" /> : <div className="mb-4">{icon}</div>}
            <h3 className="text-lg font-semibold text-foreground">{label}</h3>
            <p className="text-sm text-muted-foreground text-center max-w-xs mt-2 px-4">{sub}</p>
        </Card>
    )
}
