"use client";
import React, { useState, useEffect } from 'react';
import { Opportunity } from '@prisma/client';
import { EditableText } from './EditableText';
import { Download, RefreshCw, CheckSquare, BrainCircuit, Activity, Layers } from 'lucide-react';
import { updateOpportunity } from '@/app/actions/update-opportunity';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { SpiderChart } from '@/components/shared/SpiderChart';
import { MatrixChart } from '@/components/shared/MatrixChart';
import { DfvChartSmall } from '@/components/shared/DFVChart';
import { WorkshopCard } from '@/components/ui/WorkshopCard';
import { StaticWorkflow } from './charts/StaticWorkflow';
import { useArtDirector, cleanText } from './hooks/useArtDirector';

// Type for DFV assessment JSON field
interface DFVAssessmentData {
    desirability?: { score?: number } | number;
    feasibility?: { score?: number } | number;
    viability?: { score?: number } | number;
}

// Type for workflow phase
interface WorkflowPhase {
    name?: string;
    [key: string]: unknown;
}

export function CanvasWorkspace({ data }: { data: Opportunity }) {
    const [isExporting, setIsExporting] = useState(false);
    const [showSyncModal, setShowSyncModal] = useState(false);
    const [scale, setScale] = useState(1);

    // AI Art Director - currently unused but keep for future use
    useArtDirector(data);

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

    const handleGenerateTimestamp = async () => {
        setShowSyncModal(false);
        await updateOpportunity(data.id, { canvasLastGeneratedAt: new Date() });
    };

    const handleExportPDF = async () => {
        setIsExporting(true);
        try {
            // Dynamically import heavy libraries only when needed
            const [
                { default: html2canvas },
                { pdf },
                { StrategyMapDocument },
                { saveAs }
            ] = await Promise.all([
                import('html2canvas'),
                import('@react-pdf/renderer'),
                import('./pdf/StrategyMapDocument'),
                import('file-saver')
            ]);

            // 1. Chart Capture Engine (with Manual Resize)
            const getChartImg = async (id: string) => {
                const el = document.getElementById(id);
                if (!el) return null;

                // 1. Capture High-Res (for clarity)
                // html2canvas types are outdated, using type assertion for extended options
                const html2canvasOptions = {
                    scale: 3,
                    backgroundColor: '#ffffff',
                    useCORS: true,
                    logging: false,
                    onclone: (clonedDoc: Document) => {
                        // Force Arial on EVERYTHING to prevent text corruption
                        const all = clonedDoc.querySelectorAll('*');
                        all.forEach((node: Element) => {
                            if ((node as HTMLElement).style) {
                                (node as HTMLElement).style.fontFamily = 'Arial, sans-serif';
                            }
                        });
                    }
                } as Parameters<typeof html2canvas>[1];
                const canvas = await html2canvas(el, html2canvasOptions);

                // 2. MANUAL RESIZE (The Fix for "Too Big")
                // We create a new, smaller canvas to "bake" the image at the correct size
                // This prevents the PDF from trying (and failing) to resize a 3000px image
                const resizedCanvas = document.createElement('canvas');
                const targetWidth = 600; // Optimal width for PDF column
                const targetHeight = (canvas.height / canvas.width) * targetWidth;

                resizedCanvas.width = targetWidth;
                resizedCanvas.height = targetHeight;

                const ctx = resizedCanvas.getContext('2d');
                if (ctx) {
                    // Smooth scaling
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(canvas, 0, 0, targetWidth, targetHeight);
                    return resizedCanvas.toDataURL('image/png');
                }

                return canvas.toDataURL('image/png');
            };

            const chartImages = {
                radar: await getChartImg('print-radar'),
                matrix: await getChartImg('print-matrix'),
                dfv: await getChartImg('print-dfv'),
            };

            // 2. Prepare Data (Explicit PDFData shape to satisfy TypeScript)
            const pdfData = {
                projectName: data.projectName ?? undefined,
                frictionStatement: data.frictionStatement ?? undefined,
                strategicHorizon: data.strategicHorizon ?? undefined,
                whyDoIt: data.whyDoIt ?? undefined,
                strategicRationale: data.strategicRationale ?? undefined,
                efficiencyDisplay: efficiencyDisplay,
                workflowSteps: Array.isArray(data.workflowPhases) ? data.workflowPhases as { name?: string }[] : [],
                definitionOfDone: data.definitionOfDone ?? undefined,
                keyDecisions: data.keyDecisions ?? undefined,
                keyRisks: data.systemGuardrails ?? undefined,
                capabilitiesMissing: data.capabilitiesMissing || [],
                capabilitiesExisting: data.capabilitiesExisting || [],
            };

            // 3. Generate PDF
            const blob = await pdf(
                <StrategyMapDocument data={pdfData} chartImages={chartImages} />
            ).toBlob();

            saveAs(blob, `${data.projectName || 'Canvas'}_Strategy_Map.pdf`);

        } catch (err) {
            console.error('PDF Gen Error:', err);
            alert("Export failed. Please check console.");
        } finally {
            setIsExporting(false);
        }
    };

    // Define the Efficiency Lookup based on VRCC Value Score (1-5)
    const efficiencyMap: Record<number, string> = {
        1: '1.7x',
        2: '2.5x',
        3: '4.0x',
        4: '7.0x',
        5: '10.0x'
    };

    // Lookup the efficiency value based on the VRCC Score (Default to 0 if missing)
    const score = data.scoreValue || 0;
    const efficiencyDisplay = efficiencyMap[score] || '0.0x';

    // Helper function for Strategic Horizon pill colors
    const getHorizonStyle = (horizon: string) => {
        const h = horizon.toLowerCase();
        if (h.includes('growth')) return 'bg-blue-100 text-blue-800 border-blue-200';
        if (h.includes('operational')) return 'bg-amber-100 text-amber-800 border-amber-200';
        if (h.includes('strategic')) return 'bg-purple-100 text-purple-800 border-purple-200';
        return 'bg-gray-100 text-gray-800 border-gray-200';
    };

    const sectionTitleClass = "text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 border-b border-border pb-1 block";
    const bodyTextClass = "text-sm leading-relaxed text-foreground";

    return (
        <div id="workspace-wrapper" className="w-full flex flex-col items-center py-8 bg-muted/20 min-h-full overflow-hidden relative font-sans">




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
                    id="canvas-export-target"
                    className="w-full h-full bg-card shadow-2xl grid grid-cols-[380px_1fr] overflow-hidden text-card-foreground border border-border"
                >
                    {/* --- LEFT SIDEBAR --- */}
                    <div className="bg-muted/50 border-r border-border p-10 flex flex-col gap-10">
                        <div className="shrink-0 w-full pr-4">
                            <EditableText
                                id={data.id}
                                field="projectName"
                                value={data.projectName}
                                className="text-3xl font-black uppercase tracking-tight text-primary block leading-tight text-left break-words whitespace-normal"
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

                        {/* --- STRATEGIC HORIZON SECTION --- */}
                        {data.strategicHorizon && data.strategicHorizon.length > 0 && (
                            <div>
                                {/* Standardized Title Style matches 'THE FRICTION' */}
                                <span className={sectionTitleClass}>Strategic Horizon</span>

                                {/* Dynamic Pills */}
                                <div className="flex flex-wrap gap-2">
                                    {data.strategicHorizon.split(',').map((rawItem: string, idx: number) => {
                                        const item = rawItem.trim();
                                        if (!item) return null;
                                        return (
                                            <span
                                                key={idx}
                                                className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${getHorizonStyle(item)}`}
                                            >
                                                {item}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Value Prop (Cleaned) */}
                        <div>
                            <span className={sectionTitleClass}>Value Proposition</span>
                            <EditableText
                                id={data.id}
                                field="whyDoIt"
                                value={cleanText(data.whyDoIt)}
                                className="text-base leading-relaxed text-slate-700"
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

                        {/* --- TOP DASHBOARD: 4-Column Strategic Profile (Height: 220px) --- */}
                        <div className="h-[220px] border-b border-border p-4">
                            <div className="text-[9px] font-bold text-muted-foreground uppercase mb-3">Strategic Profile</div>

                            {/* Main Container: 4 Columns, Equal Height */}
                            <div className="grid grid-cols-4 gap-4 h-[170px] items-stretch">

                                {/* COLUMN 1: Kite Chart */}
                                <WorkshopCard title="STRATEGIC FIT">
                                    <div id="print-radar" className="flex h-full items-center justify-center">
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
                                </WorkshopCard>

                                {/* COLUMN 2: Prioritisation Matrix */}
                                <WorkshopCard title="PRIORITISATION">
                                    <div id="print-matrix" className="w-full h-full">
                                        <MatrixChart x={data.scoreComplexity || 0} y={data.scoreValue || 0} />
                                    </div>
                                </WorkshopCard>

                                {/* COLUMN 3: DFV Score */}
                                <WorkshopCard title="DFV SCORE">
                                    <div id="print-dfv" className="w-full h-full">
                                        <DfvChartSmall
                                            data={{
                                                scoreDesirability: (data.dfvAssessment as DFVAssessmentData)?.desirability,
                                                scoreFeasibility: (data.dfvAssessment as DFVAssessmentData)?.feasibility,
                                                scoreViability: (data.dfvAssessment as DFVAssessmentData)?.viability
                                            }}
                                        />
                                    </div>
                                </WorkshopCard>

                                {/* COLUMN 4: Metrics (Stacked) */}
                                <div className="flex flex-col gap-3">
                                    {/* Row 1: Efficiency */}
                                    <WorkshopCard title="EFFICIENCY" className="flex-1" noPadding>
                                        <div className="flex h-full items-center justify-center p-2">
                                            <span className="text-2xl font-black text-orange-500">
                                                {efficiencyDisplay}
                                            </span>
                                        </div>
                                    </WorkshopCard>

                                    {/* Row 2: T-Shirt Size */}
                                    <WorkshopCard title="T-SHIRT SIZE" className="flex-1" noPadding>
                                        <div className="flex h-full items-center justify-center p-2">
                                            <div className="relative flex items-center justify-center">
                                                <svg viewBox="0 0 24 24" className="h-12 w-12 text-blue-600 drop-shadow-sm" fill="currentColor">
                                                    <path d="M20.9 4.6c-1.3-.5-2.7-.8-4.1-.8-.7 0-1.4.1-2 .3l-1.6.5-1.6-.5c-.6-.2-1.3-.3-2-.3-1.4 0-2.8.3-4.1.8L2 5.9l2.5 6.6 2.1-.8.9 7.8c.1.9.9 1.6 1.8 1.6h5.4c.9 0 1.7-.7 1.8-1.6l.9-7.8 2.1.8 2.5-6.6-3.1-1.3z" />
                                                </svg>
                                                <span className={`absolute inset-0 flex items-center justify-center pt-1 font-black text-white ${(data.tShirtSize || '').length > 1 ? 'text-[10px]' : 'text-sm'}`}>
                                                    {data.tShirtSize || 'M'}
                                                </span>
                                            </div>
                                        </div>
                                    </WorkshopCard>
                                </div>
                            </div>
                        </div>

                        {/* Row 2: Workflow (Post-its) */}
                        <div className="h-[240px] border-b border-border bg-muted/30 p-6 flex flex-col">
                            <div className="flex items-center gap-2 mb-2 px-4">
                                <Layers size={16} className="text-muted-foreground" />
                                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">The Workflow Engine</h3>
                            </div>
                            <div className="flex-1 w-full overflow-hidden">
                                <StaticWorkflow phases={data.workflowPhases as WorkflowPhase[]} />
                            </div>
                        </div>

                        {/* Row 3: The Bento Box */}
                        <div className="flex-1 grid grid-cols-4 divide-x bg-card border-b border-border">
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
                                            <span className="text-xs text-muted-foreground italic">None</span>
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
                                            <span className="text-xs text-muted-foreground italic">None</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Export PDF Button - Fixed Floating */}
            <div className="fixed bottom-8 right-8 z-50">
                <button
                    onClick={handleExportPDF}
                    disabled={isExporting}
                    className="flex items-center rounded-md bg-blue-600 px-6 py-3 font-bold text-white shadow-xl transition-colors hover:bg-blue-700 disabled:opacity-50"
                >
                    {isExporting ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                    {isExporting ? 'Generating...' : 'Export'}
                </button>
            </div>

            <ConfirmModal
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
