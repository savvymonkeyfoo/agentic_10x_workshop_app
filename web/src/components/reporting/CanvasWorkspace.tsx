"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Opportunity } from '@prisma/client';
import { EditableText } from './EditableText';
import { Download, RefreshCw, Sparkles, Loader2, CheckSquare, BrainCircuit, Activity, Layers } from 'lucide-react';
import { updateOpportunity } from '@/app/actions/update-opportunity';
import { optimizeCanvasContent } from '@/app/actions/optimize-canvas';
import { ActionConfirmationModal } from '@/components/ui/ActionConfirmationModal';
import { SpiderChart } from '@/components/shared/SpiderChart';
import { MatrixChart } from '@/components/shared/MatrixChart';
import { DFVChart } from '@/components/shared/DFVChart';
import { StaticWorkflow } from './charts/StaticWorkflow';
import { useArtDirector, cleanText } from './hooks/useArtDirector';

export function CanvasWorkspace({ data }: { data: Opportunity }) {
    const router = useRouter();
    const [isExporting, setIsExporting] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [showSyncModal, setShowSyncModal] = useState(false);
    const [scale, setScale] = useState(1);

    // AI Art Director
    const styles = useArtDirector(data);

    // Auto-Scale Logic
    useEffect(() => {
        const handleResize = () => {
            const container = document.getElementById('workspace-wrapper');
            if (container) {
                const TARGET_WIDTH = 1580; // A3 width
                const availableWidth = container.offsetWidth - 64; // Padding
                const newScale = Math.min(1, availableWidth / TARGET_WIDTH);
                setScale(newScale);
            }
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        setTimeout(handleResize, 100);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleSyncClick = () => {
        if (data.canvasLastGeneratedAt) {
            setShowSyncModal(true);
        } else {
            handleGenerateTimestamp();
        }
    };

    const handleGenerateTimestamp = async () => {
        setShowSyncModal(false);
        setIsSyncing(true);
        await updateOpportunity(data.id, { canvasLastGeneratedAt: new Date() });
        setIsSyncing(false);
    };

    const handleOptimize = async () => {
        setIsOptimizing(true);
        try {
            const res = await optimizeCanvasContent(data);
            if (res.success && res.data) {
                await updateOpportunity(data.id, {
                    frictionStatement: res.data.friction,
                    strategicRationale: res.data.rationale,
                    systemGuardrails: res.data.risks,
                    whyDoIt: cleanText(res.data.valueProposition)
                });
                router.refresh();
            }
        } catch (e) {
            console.error(e);
            alert("Optimization failed");
        }
        finally { setIsOptimizing(false); }
    };

    const handleExportPDF = async () => {
        setIsExporting(true);
        try {
            const { default: html2canvas } = await import('html2canvas');
            const jsPDFModule = await import('jspdf');
            const jsPDF = (jsPDFModule as any).default || (jsPDFModule as any).jsPDF;

            const element = document.getElementById('canvas-a3-map');
            if (!element) return;

            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
                logging: false,
                width: 1580,
                height: 1120
            } as any);
            const imgData = canvas.toDataURL('image/png');

            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a3'
            });

            pdf.addImage(imgData, 'PNG', 0, 0, 420, 297);
            pdf.save(`${data.projectName.replace(/\s+/g, '_')}_Strategy_Map.pdf`);
        } catch (e) {
            console.error("PDF Export failed", e);
            alert("Failed to export PDF: " + e);
        } finally {
            setIsExporting(false);
        }
    };

    // Efficiency ROI Calculation
    const rev = data.benefitRevenue || 0;
    const avoid = data.benefitCostAvoidance || 0;
    const cost = data.benefitEstCost || 1; // avoid div/0
    // Calculate ROI (e.g. 5.5x). If cost is 0, show 0.0x
    const efficiencyScore = data.benefitEstCost && data.benefitEstCost > 0
        ? ((rev + avoid) / cost).toFixed(1)
        : (data.benefitEfficiency ? data.benefitEfficiency.toFixed(1) : "1.0");

    const sectionTitleClass = "text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 border-b border-slate-200 pb-1 block";
    const bodyTextClass = "text-sm leading-relaxed text-slate-700";

    return (
        <div id="workspace-wrapper" className="w-full flex flex-col items-center py-8 bg-slate-100/50 dark:bg-black/20 min-h-full overflow-hidden relative font-sans">



            {/* Toolbar */}
            <div className="flex items-center gap-3 mb-8 bg-white dark:bg-slate-800 p-2 rounded-full shadow-sm border border-slate-200 dark:border-slate-700 sticky top-4 z-40">
                <button
                    onClick={handleSyncClick}
                    disabled={isSyncing}
                    className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                >
                    <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} />
                    {data.canvasLastGeneratedAt ? "Mark as Updated" : "Mark as Generated"}
                </button>

                <div className="h-4 w-px bg-slate-300 mx-1" />

                <button
                    onClick={handleExportPDF}
                    disabled={isExporting}
                    className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold bg-brand-navy text-white hover:bg-brand-navy/90 transition-colors shadow-md"
                >
                    {isExporting ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
                    Export A3 PDF
                </button>
            </div>

            {/* Scalable Container */}
            <div style={{
                width: '1580px',
                height: '1120px',
                transform: `scale(${scale})`,
                transformOrigin: 'top center',
                transition: 'transform 0.2s ease-out'
            }}>
                {/* A3 Content */}
                <div
                    id="canvas-a3-map"
                    className="w-full h-full bg-white shadow-2xl grid grid-cols-[380px_1fr] overflow-hidden text-slate-800 border border-slate-200"
                >
                    {/* --- LEFT SIDEBAR --- */}
                    <div className="bg-slate-50 border-r border-slate-200 p-10 flex flex-col gap-10">
                        <div className="shrink-0">
                            <EditableText
                                id={data.id}
                                field="projectName"
                                value={data.projectName}
                                className={`${styles.titleClass} font-black uppercase tracking-tight text-brand-navy block leading-[0.9] text-left`}
                                placeholder="UNTITLED PROJECT"
                            />
                        </div>

                        <div>
                            <span className={sectionTitleClass}>The Friction</span>
                            <EditableText
                                id={data.id}
                                field="frictionStatement"
                                value={data.frictionStatement}
                                className="text-lg leading-relaxed text-slate-700"
                                placeholder="What is the core problem?"
                            />
                        </div>

                        {/* Horizon (Pills) */}
                        <div>
                            {data.strategicHorizon ? (
                                <div className="flex flex-wrap gap-2">
                                    {data.strategicHorizon.split(',').map((h: string, i: number) => (
                                        <span key={i} className="inline-block px-3 py-1 bg-brand-blue/10 text-brand-blue border border-brand-blue/20 text-xs font-bold uppercase tracking-widest rounded-full">
                                            {h.trim()}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <span className="inline-block px-3 py-1 bg-brand-blue/10 text-brand-blue border border-brand-blue/20 text-xs font-bold uppercase tracking-widest rounded-full">
                                    UNKNOWN HORIZON
                                </span>
                            )}
                        </div>

                        {/* Value Prop (Cleaned) */}
                        <div>
                            <span className={sectionTitleClass}>Value Proposition</span>
                            <EditableText
                                id={data.id}
                                field="whyDoIt"
                                value={cleanText(data.whyDoIt)}
                                className="text-base italic leading-relaxed text-slate-700 font-serif"
                                placeholder="As a User, I want..."
                            />
                        </div>

                        <div className="flex-1">
                            <span className={sectionTitleClass}>Strategic Rationale</span>
                            <EditableText
                                id={data.id}
                                field="strategicRationale"
                                value={data.strategicRationale}
                                className={bodyTextClass}
                                placeholder="Why this? Why now?"
                            />
                        </div>
                    </div>

                    {/* --- MAIN BODY --- */}
                    <div className="flex flex-col h-full">

                        {/* --- TOP DASHBOARD (Height: 220px) --- */}
                        <div className="flex gap-4 h-[220px] border-b border-slate-200">
                            {/* ZONE 1: THE HERO KITE (40%) */}
                            <div className="w-[40%] flex flex-col p-4 relative">
                                <div className="text-[9px] font-bold text-slate-400 uppercase mb-2">Strategic Profile</div>
                                {/* HERO KITE CONTAINER - constrained height */}
                                <div className="flex-1 w-full flex items-center justify-center">
                                    <div className="w-full h-[160px]">
                                        <SpiderChart
                                            data={{
                                                value: data.scoreValue || 0,
                                                complexity: data.scoreComplexity || 0,
                                                capability: data.scoreCapability || 0,
                                                risk: data.scoreRiskFinal || 0
                                            }}
                                            showTooltip={false}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* ZONE 2: THE 2x2 GRID (60%) */}
                            <div className="w-[60%] grid grid-cols-2 grid-rows-2 gap-2 p-2">
                                {/* Cell 1: Matrix */}
                                <div className="bg-white border border-slate-200 rounded-lg p-2 relative">
                                    <MatrixChart x={data.scoreComplexity || 0} y={data.scoreValue || 0} />
                                    <span className="absolute bottom-1 right-2 text-[8px] text-slate-300 font-bold uppercase">Value/Effort</span>
                                </div>
                                {/* Cell 2: Efficiency + T-Shirt */}
                                <div className="bg-white border border-slate-200 rounded-lg flex items-center justify-around p-2">
                                    {/* Efficiency */}
                                    <div className="text-center">
                                        <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400">ROI</div>
                                        <div className="text-2xl font-black text-amber-500">
                                            {efficiencyScore}x
                                        </div>
                                    </div>
                                    {/* T-Shirt Icon */}
                                    <div className="relative flex flex-col items-center justify-center">
                                        <svg viewBox="0 0 24 24" fill="currentColor" className="text-blue-600 w-12 h-12">
                                            <path d="M20.38 3.55a.8.8 0 0 0-.46-.17h-.06l-4.5.56a6.23 6.23 0 0 1-6.72 0l-4.5-.56h-.06a.8.8 0 0 0-.46.17L.55 6.27a.8.8 0 0 0-.21 1l2.4 4.8a.8.8 0 0 0 1.25.17l1-1V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8.73l1 1a.8.8 0 0 0 1.25-.17l2.4-4.8a.8.8 0 0 0-.21-1z" />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-sm font-black text-white drop-shadow-md">{data.tShirtSize || "-"}</span>
                                        </div>
                                        <div className="text-[8px] font-bold uppercase text-slate-400 mt-[-2px]">Size</div>
                                    </div>
                                </div>
                                {/* Cell 3: DFV Assessment (Spans 2 columns) */}
                                <div className="col-span-2 bg-white border border-slate-200 rounded-lg p-2 flex items-center justify-between px-4">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase mr-2">DFV</span>
                                    {/* DFV CONTAINER - constrained size */}
                                    <div className="w-[80px] h-[60px]">
                                        <DFVChart scores={data.dfvAssessment as any} showLegend={false} />
                                    </div>
                                    {/* Legend/Labels */}
                                    <div className="flex gap-3 text-[8px] font-bold text-slate-500">
                                        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-500" /> Des</div>
                                        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Feas</div>
                                        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500" /> Via</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Row 2: Workflow (Post-its) */}
                        <div className="h-[240px] border-b border-slate-200 bg-slate-50/50 p-6 flex flex-col">
                            <div className="flex items-center gap-2 mb-2 px-4">
                                <Layers size={16} className="text-slate-400" />
                                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">The Workflow Engine</h3>
                            </div>
                            <div className="flex-1 w-full overflow-hidden">
                                <StaticWorkflow phases={data.workflowPhases as any[]} />
                            </div>
                        </div>

                        {/* Row 3: The Bento Box */}
                        <div className="flex-1 grid grid-cols-4 divide-x bg-white border-b border-slate-200">
                            {/* Box 1: DoD */}
                            <div className="p-8 flex flex-col gap-2">
                                <div className="flex items-center gap-2 text-green-600 mb-2">
                                    <CheckSquare size={16} strokeWidth={2.5} />
                                    <span className={sectionTitleClass + " border-none mb-0 pb-0"}>Definition of Done</span>
                                </div>
                                <EditableText
                                    id={data.id}
                                    field="definitionOfDone"
                                    value={data.definitionOfDone}
                                    className={bodyTextClass}
                                    placeholder="What does success look like?"
                                    isList={true}
                                />
                            </div>

                            {/* Box 2: Decisions */}
                            <div className="p-8 flex flex-col gap-2">
                                <div className="flex items-center gap-2 text-amber-600 mb-2">
                                    <BrainCircuit size={16} strokeWidth={2.5} />
                                    <span className={sectionTitleClass + " border-none mb-0 pb-0"}>Key Decisions</span>
                                </div>
                                <EditableText
                                    id={data.id}
                                    field="keyDecisions"
                                    value={data.keyDecisions}
                                    className={bodyTextClass}
                                    placeholder="Required approvals..."
                                    isList={true}
                                />
                            </div>

                            {/* Box 3: Risks */}
                            <div className="p-8 flex flex-col gap-2 bg-red-50/10">
                                <div className="flex items-center gap-2 text-red-600 mb-2">
                                    <Activity size={16} strokeWidth={2.5} />
                                    <span className={sectionTitleClass + " border-none mb-0 pb-0"}>Key Risks</span>
                                </div>
                                <EditableText
                                    id={data.id}
                                    field="systemGuardrails"
                                    value={data.systemGuardrails}
                                    className={bodyTextClass}
                                    placeholder="Identify risks..."
                                    isList={true}
                                />
                            </div>

                            {/* Box 4: Capabilities (Split) */}
                            <div className="p-8 flex flex-col gap-4">
                                <div className="flex items-center gap-2 text-blue-600 mb-1">
                                    <Layers size={16} strokeWidth={2.5} />
                                    <span className={sectionTitleClass + " border-none mb-0 pb-0"}>Capabilities</span>
                                </div>

                                {/* Missing */}
                                <div>
                                    <span className="text-[9px] font-bold text-orange-600 uppercase mb-2 block tracking-wider">Missing (Gap)</span>
                                    <div className="flex flex-wrap gap-2">
                                        {data.capabilitiesMissing?.map((cap: string) => (
                                            <span key={cap} className="px-2 py-1 bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold rounded">
                                                {cap}
                                            </span>
                                        ))}
                                        {(!data.capabilitiesMissing || data.capabilitiesMissing.length === 0) && (
                                            <span className="text-xs text-slate-300 italic">None</span>
                                        )}
                                    </div>
                                </div>

                                {/* Existing */}
                                <div>
                                    <span className="text-[9px] font-bold text-emerald-600 uppercase mb-2 block tracking-wider">Existing</span>
                                    <div className="flex flex-wrap gap-2">
                                        {data.capabilitiesExisting?.map((cap: string) => (
                                            <span key={cap} className="px-2 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium rounded">
                                                {cap}
                                            </span>
                                        ))}
                                        {(!data.capabilitiesExisting || data.capabilitiesExisting.length === 0) && (
                                            <span className="text-xs text-slate-300 italic">None</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating Optimize Button */}
            <button
                onClick={handleOptimize}
                disabled={isOptimizing}
                className="fixed bottom-8 right-8 bg-violet-600 text-white px-6 py-3 rounded-full shadow-2xl hover:scale-105 hover:bg-violet-700 transition-all flex items-center gap-2 font-bold z-50 text-sm"
            >
                {isOptimizing ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} fill="currentColor" />}
                {isOptimizing ? "AI Designer Working..." : "Auto-Fit & Summarize"}
            </button>

            <ActionConfirmationModal
                isOpen={showSyncModal}
                onClose={() => setShowSyncModal(false)}
                onConfirm={handleGenerateTimestamp}
                title="Confirm Update"
                description="This will update the generation timestamp. Input data will optionally overwrite the Canvas."
                confirmLabel="Update Timestamp"
            />
        </div>
    );
}
