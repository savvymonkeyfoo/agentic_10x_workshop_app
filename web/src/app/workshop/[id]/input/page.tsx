"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { VRCCSlider } from '@/components/ui/VRCCSlider';
import { StrategicProfile } from '@/components/workshop/StrategicProfile';
import { analyzeRisk } from '@/app/actions/ai-risk';
import { saveOpportunity } from '@/app/actions/save-opportunity';

// --- Types & Initial State (Mirroring Schema) ---
interface WorkflowPhase {
    id: string; // purely for UI key
    name: string;
    autonomy: 'L0' | 'L1' | 'L2';
    guardrail: string;
}

interface OpportunityState {
    // Tab A
    projectName: string;
    frictionStatement: string;
    strategicHorizon: string[]; // Changed to array for multi-select, will join on save
    whyDoIt: string; // Stored concatenated string

    // Tab B (Refactored)
    workflowPhases: WorkflowPhase[];
    capabilitiesExisting: string[];
    capabilitiesMissing: string[];

    // Tab C
    vrcc: {
        value: number;
        capability: number;
        complexity: number;
        riskFinal: number;
        riskAI: number;
    };
    tShirtSize: 'XS' | 'S' | 'M' | 'L' | 'XL';
    benefitRevenue: number | undefined;
    benefitCost: number | undefined;
    benefitEfficiency: number | undefined;
    dfvDesirability: 'HIGH' | 'MED' | 'LOW';
    dfvFeasibility: 'HIGH' | 'MED' | 'LOW';
    dfvViability: 'HIGH' | 'MED' | 'LOW';

    // Tab D
    definitionOfDone: string;
    keyDecisions: string;
    impactedSystems: string[]; // Converted to string[] for UI, assumed CSV or Tag in future
}

const INITIAL_STATE: OpportunityState = {
    projectName: '',
    frictionStatement: '',
    strategicHorizon: [], // Default empty
    whyDoIt: '',

    workflowPhases: [], // Start empty or with 1 default? User said "Add Phase" button.
    capabilitiesExisting: [],
    capabilitiesMissing: [],

    vrcc: { value: 3, capability: 3, complexity: 3, riskFinal: 3, riskAI: 0 },
    tShirtSize: 'M',
    benefitRevenue: undefined,
    benefitCost: undefined,
    benefitEfficiency: undefined,
    dfvDesirability: 'MED',
    dfvFeasibility: 'MED',
    dfvViability: 'MED',
    definitionOfDone: '',
    keyDecisions: '',
    impactedSystems: []
};

// --- Config: Tabs ---
const TABS = [
    { id: 'A', label: 'OPPORTUNITY' },
    { id: 'B', label: 'THE WORKFLOW' },
    { id: 'C', label: 'BUSINESS CASE' }, // Renamed from VRCC SCORING
    { id: 'D', label: 'EXECUTION' }
] as const;

// --- Config: Strategic Horizons ---
const HORIZONS = [
    { id: 'Growth & Scalability', label: 'Growth & Scalability', color: 'bg-brand-cyan text-white', border: 'border-brand-cyan' },
    { id: 'Operational Throughput', label: 'Operational Throughput', color: 'bg-status-gap text-white', border: 'border-status-gap' }, // Amber
    { id: 'Strategic Advantage', label: 'Strategic Advantage', color: 'bg-status-risk text-white', border: 'border-status-risk' } // Red
] as const;

// --- Helper: Tab Validation ---
function isTabComplete(tabId: string, state: OpportunityState): boolean {
    switch (tabId) {
        case 'A':
            // Check horizon length > 0
            return !!(state.projectName && state.frictionStatement && state.strategicHorizon.length > 0 && state.whyDoIt);
        case 'B':
            // At least one phase
            return state.workflowPhases.length > 0 && state.workflowPhases.every(p => p.name);
        case 'C':
            // Check essential VRCC
            return !!(state.vrcc.value > 0 && state.vrcc.capability > 0 && state.vrcc.complexity > 0 && state.vrcc.riskFinal > 0);
        case 'D':
            return !!(state.definitionOfDone);
        default:
            return false;
    }
}

// --- Helper: Completeness Logic ---
function calculateCompleteness(state: OpportunityState): number {
    let filled = 0;
    let total = 0;

    // Tab A (4 fields)
    total += 4;
    if (state.projectName) filled++;
    if (state.frictionStatement) filled++;
    if (state.strategicHorizon.length > 0) filled++;
    if (state.whyDoIt) filled++;

    // Tab B (Workflow) - check for at least one valid phase
    total += 1;
    if (state.workflowPhases.length > 0 && state.workflowPhases[0].name) filled++;

    // Tab C (7 fields: 4 VRCC + TShirt + 3 DFV) - skipping financials as optional? No, PRD check implies important.
    // Let's stick to core VRCC + T-Shirt for "Blocking" completeness to keep it usable.
    total += 5;
    if (state.vrcc.value > 0) filled++;
    if (state.vrcc.capability > 0) filled++;
    if (state.vrcc.complexity > 0) filled++;
    if (state.vrcc.riskFinal > 0) filled++;
    if (state.tShirtSize) filled++;

    // Tab D (1 field core)
    total += 1;
    if (state.definitionOfDone) filled++;

    return (filled / total) * 100;
}

// --- Subcomponent: Phase Card ---
const AUTONOMY_LABELS = {
    'L0': 'Assist (Human does it)',
    'L1': 'Suggest (Human approves)',
    'L2': 'Execute (Autonomous)'
};

const PhaseCard = ({ phase, updatePhase, requestDelete }: {
    phase: WorkflowPhase,
    updatePhase: (id: string, field: keyof WorkflowPhase, val: any) => void,
    requestDelete: (id: string) => void
}) => {
    return (
        <Reorder.Item value={phase} id={phase.id} className="flex items-center cursor-grab active:cursor-grabbing">
            {/* Card */}
            <div className="w-72 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm hover:shadow-md transition-shadow p-4 relative group flex flex-col gap-3 shrink-0 mx-2 select-none">

                {/* Drag Handle & Delete (Top Row) */}
                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button
                        onClick={(e) => { e.stopPropagation(); requestDelete(phase.id); }}
                        className="text-slate-300 hover:text-red-500 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>

                {/* Header Input */}
                <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400">Phase Name</label>
                    <input
                        type="text"
                        value={phase.name}
                        onChange={(e) => updatePhase(phase.id, 'name', e.target.value)}
                        className="w-full bg-transparent border-b border-slate-200 dark:border-slate-700 focus:border-brand-blue outline-none py-1 font-bold text-slate-700 dark:text-slate-200 placeholder-slate-300"
                        placeholder="e.g. Ingestion"
                        onPointerDown={(e) => e.stopPropagation()} // Prevent drag start from input
                    />
                </div>

                {/* Autonomy Selector */}
                <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1 transition-all">
                        {AUTONOMY_LABELS[phase.autonomy]}
                    </label>
                    <div className="flex gap-1" onPointerDown={(e) => e.stopPropagation()}>
                        {(['L0', 'L1', 'L2'] as const).map(level => (
                            <button
                                key={level}
                                onClick={() => updatePhase(phase.id, 'autonomy', level)}
                                className={`flex-1 py-1 text-[10px] font-bold rounded transition-colors ${phase.autonomy === level
                                    ? (level === 'L0' ? 'bg-slate-200 text-slate-600' : level === 'L1' ? 'bg-brand-cyan text-white' : 'bg-status-value text-white')
                                    : 'bg-slate-50 dark:bg-black/20 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'}`}
                            >
                                {level}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Guardrail */}
                <div className="flex-1" onPointerDown={(e) => e.stopPropagation()}>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Guardrail</label>
                    <textarea
                        value={phase.guardrail}
                        onChange={(e) => updatePhase(phase.id, 'guardrail', e.target.value)}
                        className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-slate-700 rounded p-2 text-xs resize-none h-20 outline-none focus:ring-1 focus:ring-brand-blue"
                        placeholder="Constraints..."
                    />
                </div>
            </div>

            {/* Visual Link Arrow */}
            <div className="text-slate-300 dark:text-slate-600">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
            </div>
        </Reorder.Item>
    );
};

// --- Subcomponent: Tag Input for Capabilities ---
const TagInput = ({ tags, addTag, removeTag, placeholder, colorClass }: {
    tags: string[],
    addTag: (val: string) => void,
    removeTag: (val: string) => void,
    placeholder: string,
    colorClass: string
}) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
            addTag(e.currentTarget.value.trim());
            e.currentTarget.value = '';
        }
    };

    return (
        <div className="space-y-2">
            <div className="flex flex-wrap gap-2 min-h-[40px] p-2 bg-white/50 dark:bg-black/20 border border-slate-200 dark:border-slate-700 rounded-lg">
                {tags.map(tag => (
                    <span key={tag} className={`px-2 py-1 rounded text-xs font-bold text-white flex items-center gap-1 ${colorClass}`}>
                        {tag}
                        <button onClick={() => removeTag(tag)} className="hover:text-black/50">×</button>
                    </span>
                ))}
                <input
                    type="text"
                    onKeyDown={handleKeyDown}
                    className="bg-transparent outline-none text-xs min-w-[100px] flex-1"
                    placeholder={placeholder}
                />
            </div>
        </div>
    );
};

// --- Component: Value Prop Builder ---
const ValuePropBuilder = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
    // Attempt to parse existing value
    const [parts, setParts] = useState({
        role: '',
        outcome: '',
        solution: '',
        need: ''
    });

    useEffect(() => {
        if (!value) return;
        // Logic to pre-fill parts if needed, omitted for now to keep it simple
    }, []);

    const updatePart = (key: keyof typeof parts, val: string) => {
        const newParts = { ...parts, [key]: val };
        setParts(newParts);
        const pitch = `As a ${newParts.role || '[Role]'}, I want to ${newParts.outcome || '[Outcome]'}, with ${newParts.solution || '[Solution]'}, so that ${newParts.need || '[Need]'}.`;
        onChange(pitch);
    };

    // Auto-resize helper
    const adjustHeight = (el: HTMLTextAreaElement) => {
        el.style.height = 'auto';
        el.style.height = el.scrollHeight + 'px';
    };

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>, key: keyof typeof parts) => {
        adjustHeight(e.target);
        updatePart(key, e.target.value);
    };

    return (
        <div className="space-y-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
            {/* Live Preview (Moved to Top) */}
            <div className="text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-black/20 p-4 rounded border border-slate-200 dark:border-slate-700 leading-relaxed shadow-sm">
                "{value || <span className="text-slate-400 italic font-normal">Start typing below to build your value proposition...</span>}"
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">As a [Role]...</label>
                    <textarea
                        rows={1}
                        value={parts.role}
                        onChange={(e) => handleInput(e, 'role')}
                        className="w-full bg-white dark:bg-black/20 border border-slate-200 dark:border-slate-600 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue outline-none resize-none overflow-hidden min-h-[38px]"
                        placeholder="e.g. Insurance Broker"
                    />
                </div>
                <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">I want to [Outcome]...</label>
                    <textarea
                        rows={1}
                        value={parts.outcome}
                        onChange={(e) => handleInput(e, 'outcome')}
                        className="w-full bg-white dark:bg-black/20 border border-slate-200 dark:border-slate-600 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue outline-none resize-none overflow-hidden min-h-[38px]"
                        placeholder="e.g. Submit a request via email..."
                    />
                </div>
                <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">With [Solution]...</label>
                    <textarea
                        rows={1}
                        value={parts.solution}
                        onChange={(e) => handleInput(e, 'solution')}
                        className="w-full bg-white dark:bg-black/20 border border-slate-200 dark:border-slate-600 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue outline-none resize-none overflow-hidden min-h-[38px]"
                        placeholder="e.g. an Agentic Workflow"
                    />
                </div>
                <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">So that [Need]...</label>
                    <textarea
                        rows={1}
                        value={parts.need}
                        onChange={(e) => handleInput(e, 'need')}
                        className="w-full bg-white dark:bg-black/20 border border-slate-200 dark:border-slate-600 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue outline-none resize-none overflow-hidden min-h-[38px]"
                        placeholder="e.g. I have a quote in under 2 hours."
                    />
                </div>
            </div>
        </div>
    );
};

export default function InputCanvas() {
    const [activeTab, setActiveTab] = useState<'A' | 'B' | 'C' | 'D'>('A');
    const [data, setData] = useState<OpportunityState>(INITIAL_STATE);
    const [opportunityId, setOpportunityId] = useState<string | undefined>(undefined);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [deleteModalId, setDeleteModalId] = useState<string | null>(null);
    const router = useRouter();

    const completeness = calculateCompleteness(data);
    const isComplete = completeness === 100;

    // --- Autosave Logic ---
    useEffect(() => {
        // Skip initial mount or empty data if desired, but user wants full persistence.
        // We'll skip if it's purely default data maybe? 
        // Better: trigger on any change after mount.
        const timer = setTimeout(async () => {
            await performSave(data);
        }, 1500);

        return () => clearTimeout(timer);
    }, [data]);

    const performSave = async (currentData: OpportunityState) => {
        setSaveStatus('saving');
        try {
            // @ts-ignore
            const workshopId = window.location.pathname.split('/')[2];

            // Format data for DB (join strategicHorizon)
            const payload = {
                ...currentData,
                strategicHorizon: currentData.strategicHorizon.join(',')
            };

            // Call server action with current opportunityId (if any)
            const result = await saveOpportunity(workshopId, payload, opportunityId);

            if (result.success) {
                // If we didn't have an ID, we do now.
                if (!opportunityId) {
                    setOpportunityId(result.id);
                }
                setSaveStatus('saved');
            } else {
                setSaveStatus('error');
            }
        } catch (e) {
            console.error("Autosave failed", e);
            setSaveStatus('error');
        }
    };

    // -- Handlers --
    const handleAnalyse = async () => {
        // Force immediate save then redirect
        setSaveStatus('saving');
        try {
            // @ts-ignore
            const workshopId = window.location.pathname.split('/')[2];
            const payload = { ...data, strategicHorizon: data.strategicHorizon.join(',') };

            const result = await saveOpportunity(workshopId, payload, opportunityId);

            if (result.success) {
                // Redirect to analysis
                router.push(`/workshop/${workshopId}/analysis`);
            }
        } catch (e) {
            console.error(e);
            alert("Failed to save opportunity.");
        }
    };

    const handleInputChange = (field: keyof OpportunityState, value: any) => {
        setSaveStatus('idle'); // Reset status on type
        setData(prev => ({ ...prev, [field]: value }));
    };

    const toggleHorizon = (horizonId: string) => {
        setSaveStatus('idle');
        setData(prev => {
            const current = prev.strategicHorizon;
            if (current.includes(horizonId)) {
                return { ...prev, strategicHorizon: current.filter(h => h !== horizonId) };
            } else {
                return { ...prev, strategicHorizon: [...current, horizonId] };
            }
        });
    };

    // --- Workflow Handlers ---
    const addPhase = () => {
        setSaveStatus('idle');
        const newPhase: WorkflowPhase = {
            id: crypto.randomUUID(),
            name: '',
            autonomy: 'L0',
            guardrail: ''
        };
        setData(prev => ({ ...prev, workflowPhases: [...prev.workflowPhases, newPhase] }));
    };

    const updatePhase = (id: string, field: keyof WorkflowPhase, val: any) => {
        setSaveStatus('idle');
        setData(prev => ({
            ...prev,
            workflowPhases: prev.workflowPhases.map(p => p.id === id ? { ...p, [field]: val } : p)
        }));
    };

    const handleReorder = (newOrder: WorkflowPhase[]) => {
        setSaveStatus('idle');
        setData(prev => ({ ...prev, workflowPhases: newOrder }));
    };

    const requestDeletePhase = (id: string) => {
        setDeleteModalId(id);
    };

    const confirmDeletePhase = () => {
        if (!deleteModalId) return;
        setSaveStatus('idle');
        setData(prev => ({
            ...prev,
            workflowPhases: prev.workflowPhases.filter(p => p.id !== deleteModalId)
        }));
        setDeleteModalId(null);
    };

    // --- Capability Handlers ---
    const addCapability = (type: 'existing' | 'missing', val: string) => {
        setSaveStatus('idle');
        setData(prev => ({
            ...prev,
            [type === 'existing' ? 'capabilitiesExisting' : 'capabilitiesMissing']: [
                ...(type === 'existing' ? prev.capabilitiesExisting : prev.capabilitiesMissing),
                val
            ]
        }));
    };

    const removeCapability = (type: 'existing' | 'missing', val: string) => {
        setSaveStatus('idle');
        setData(prev => ({
            ...prev,
            [type === 'existing' ? 'capabilitiesExisting' : 'capabilitiesMissing']:
                (type === 'existing' ? prev.capabilitiesExisting : prev.capabilitiesMissing).filter(t => t !== val)
        }));
    };

    const handleSystemAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && e.currentTarget.value) {
            const sys = e.currentTarget.value;
            if (!data.impactedSystems.includes(sys)) {
                setSaveStatus('idle');
                setData(prev => ({ ...prev, impactedSystems: [...prev.impactedSystems, sys] }));
            }
            e.currentTarget.value = '';
        }
    };

    const removeSystem = (sys: string) => {
        setSaveStatus('idle');
        setData(prev => ({ ...prev, impactedSystems: prev.impactedSystems.filter(s => s !== sys) }));
    };

    return (
        <div className="min-h-screen bg-[var(--bg-core)] text-[var(--text-primary)] font-sans p-8 pb-10 flex flex-col relative">

            {/* Confirmation Modal */}
            <AnimatePresence>
                {deleteModalId && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                        onClick={() => setDeleteModalId(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.95 }}
                            className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-2xl max-w-sm w-full border border-slate-200 dark:border-slate-700"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="text-lg font-bold mb-2">Delete Phase?</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Are you sure you want to delete this phase? This action cannot be undone.</p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setDeleteModalId(null)}
                                    className="px-4 py-2 rounded text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDeletePhase}
                                    className="px-4 py-2 rounded text-sm font-bold bg-status-risk text-white hover:bg-red-600"
                                >
                                    Delete
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header / Nav Placeholder */}
            <header className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold tracking-tight">Opportunity Capture</h1>

                <div className="flex items-center gap-4">
                    {/* Autosave Indicator */}
                    <div className="text-xs font-medium text-slate-400 w-20 text-right">
                        {saveStatus === 'saving' && <span className="animate-pulse">Saving...</span>}
                        {saveStatus === 'saved' && <span className="text-status-safe">Saved</span>}
                        {saveStatus === 'error' && <span className="text-status-risk">Error</span>}
                    </div>

                    {/* Completeness Ring */}
                    <div className={`h-8 w-8 rounded-full border-4 flex items-center justify-center text-[10px] font-bold transition-all duration-300 ${isComplete ? 'border-status-safe text-status-safe' : 'border-slate-200 dark:border-slate-700 text-slate-400'}`}>
                        {isComplete ? (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        ) : (
                            `${Math.round(completeness)}%`
                        )}
                    </div>
                    <button
                        disabled={!isComplete}
                        onClick={handleAnalyse}
                        className={`px-6 py-2 rounded-full font-semibold transition-all ${isComplete ? 'bg-brand-blue text-white shadow-lg hover:shadow-xl hover:scale-105' : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'}`}
                    >
                        Analyse
                    </button>
                </div>
            </header>

            {/* Main Split Grid */}
            <main className="grid grid-cols-[3fr_1fr] gap-6 flex-1 pb-8">

                {/* Left Panel: Input Tabs */}
                <div className="glass-panel p-8 flex flex-col h-full">
                    {/* Tabs Header */}
                    <div className="flex space-x-6 border-b border-[var(--glass-border)] mb-6 pb-2">
                        {TABS.map((tab) => {
                            const isTabValid = isTabComplete(tab.id, data);
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`pb-2 text-xs font-bold tracking-widest transition-colors relative flex items-center gap-2 ${activeTab === tab.id ? 'text-brand-blue' : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'}`}
                                >
                                    {tab.label}
                                    {isTabValid && <span className="w-1.5 h-1.5 rounded-full bg-status-safe" />}

                                    {activeTab === tab.id && <motion.div layoutId="underline" className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-blue" />}
                                </button>
                            );
                        })}
                    </div>

                    {/* Tabs Content */}
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        <AnimatePresence mode="wait">
                            {activeTab === 'A' && (
                                <motion.div key="A" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }}>
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Opportunity Name</label>
                                            <input
                                                type="text"
                                                value={data.projectName}
                                                onChange={(e) => handleInputChange('projectName', e.target.value)}
                                                className="w-full bg-white/50 dark:bg-black/20 border border-slate-200 dark:border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-inset focus:ring-brand-cyan outline-none transition-all"
                                                placeholder="e.g. Invoice Reconciliation Bot"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Friction Statement</label>
                                            <textarea
                                                value={data.frictionStatement}
                                                onChange={(e) => handleInputChange('frictionStatement', e.target.value)}
                                                className="w-full bg-white/50 dark:bg-black/20 border border-slate-200 dark:border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-inset focus:ring-brand-cyan outline-none h-24 transition-all resize-none"
                                                placeholder="What is the problem?"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Strategic Horizon</label>
                                            <div className="flex gap-2 flex-wrap">
                                                {HORIZONS.map(h => (
                                                    <button
                                                        key={h.id}
                                                        onClick={() => toggleHorizon(h.id)}
                                                        className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${data.strategicHorizon.includes(h.id)
                                                            ? `${h.color} border-transparent shadow-md`
                                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}
                                                    >
                                                        {h.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Customer Value Proposition</label>
                                            <ValuePropBuilder
                                                value={data.whyDoIt}
                                                onChange={(val) => handleInputChange('whyDoIt', val)}
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'B' && (
                                <motion.div key="B" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }} className="space-y-8">
                                    {/* Workflow Builder Section */}
                                    <div>
                                        <div className="flex justify-between items-center mb-4">
                                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Workflow Definition (Phase Cards)</label>
                                            <button
                                                onClick={addPhase}
                                                className="text-xs font-bold text-brand-blue hover:text-brand-cyan flex items-center gap-1"
                                            >
                                                + Add Phase
                                            </button>
                                        </div>

                                        {/* Horizontal Scrollable Canvas */}
                                        <div className="overflow-x-auto pb-4 items-stretch min-h-[240px] bg-slate-50/50 dark:bg-black/10 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                                            {data.workflowPhases.length === 0 ? (
                                                <div className="w-full flex flex-col items-center justify-center text-slate-400 italic text-sm border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg min-h-[200px]">
                                                    Start by adding a phase to your workflow...
                                                    <button onClick={addPhase} className="mt-2 px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-300">Add Phase</button>
                                                </div>
                                            ) : (
                                                <Reorder.Group
                                                    axis="x"
                                                    values={data.workflowPhases}
                                                    onReorder={handleReorder}
                                                    className="flex gap-0 items-center h-full"
                                                >
                                                    {data.workflowPhases.map((phase) => (
                                                        <PhaseCard
                                                            key={phase.id}
                                                            phase={phase}
                                                            updatePhase={updatePhase}
                                                            requestDelete={requestDeletePhase}
                                                        />
                                                    ))}
                                                </Reorder.Group>
                                            )}
                                        </div>
                                    </div>

                                    {/* Capability Map Section (Side-by-Side) */}
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Existing Capabilities (Safe)</label>
                                            <TagInput
                                                tags={data.capabilitiesExisting}
                                                addTag={(v) => addCapability('existing', v)}
                                                removeTag={(v) => removeCapability('existing', v)}
                                                placeholder="Add capability (Enter)..."
                                                colorClass="bg-status-safe"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Missing Capabilities (Gap)</label>
                                            <TagInput
                                                tags={data.capabilitiesMissing}
                                                addTag={(v) => addCapability('missing', v)}
                                                removeTag={(v) => removeCapability('missing', v)}
                                                placeholder="Add dependency (Enter)..."
                                                colorClass="bg-status-gap"
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'C' && (
                                <motion.div key="C" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }}>
                                    <div className="space-y-6">
                                        {/* T-Shirt Size */}
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">T-Shirt Size (Estimate)</label>
                                            <div className="flex gap-2">
                                                {['XS', 'S', 'M', 'L', 'XL'].map((s) => (
                                                    <button
                                                        key={s}
                                                        onClick={() => handleInputChange('tShirtSize', s)}
                                                        className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${data.tShirtSize === s ? 'bg-brand-blue text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}
                                                    >
                                                        {s}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* VRCC Sliders */}
                                        <div className="space-y-2">
                                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">VRCC Scores</label>
                                            <VRCCSlider label="Value" value={data.vrcc.value} onChange={(val) => setData(prev => ({ ...prev, vrcc: { ...prev.vrcc, value: val } }))} />
                                            <VRCCSlider label="Risk" value={data.vrcc.riskFinal} aiValue={data.vrcc.riskAI} onChange={(val) => setData(prev => ({ ...prev, vrcc: { ...prev.vrcc, riskFinal: val } }))} />
                                            <VRCCSlider label="Capability" value={data.vrcc.capability} onChange={(val) => setData(prev => ({ ...prev, vrcc: { ...prev.vrcc, capability: val } }))} />
                                            <VRCCSlider label="Complexity" value={data.vrcc.complexity} onChange={(val) => setData(prev => ({ ...prev, vrcc: { ...prev.vrcc, complexity: val } }))} />
                                        </div>

                                        {/* Financials (Rows) */}
                                        <div className="grid grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Rev. Uplift ($)</label>
                                                <input type="number" value={data.benefitRevenue || ''} onChange={(e) => handleInputChange('benefitRevenue', parseFloat(e.target.value))} className="w-full bg-white/50 dark:bg-black/20 border border-slate-200 dark:border-slate-700 rounded p-2 text-sm outline-none" placeholder="0.00" />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Cost Avoid. ($)</label>
                                                <input type="number" value={data.benefitCost || ''} onChange={(e) => handleInputChange('benefitCost', parseFloat(e.target.value))} className="w-full bg-white/50 dark:bg-black/20 border border-slate-200 dark:border-slate-700 rounded p-2 text-sm outline-none" placeholder="0.00" />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Hrs Saved</label>
                                                <input type="number" value={data.benefitEfficiency || ''} onChange={(e) => handleInputChange('benefitEfficiency', parseFloat(e.target.value))} className="w-full bg-white/50 dark:bg-black/20 border border-slate-200 dark:border-slate-700 rounded p-2 text-sm outline-none" placeholder="0" />
                                            </div>
                                        </div>

                                        {/* DFV Assessment */}
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">DFV Assessment</label>
                                            <div className="grid grid-cols-3 gap-4">
                                                {['Desirability', 'Feasibility', 'Viability'].map((dim) => {
                                                    const key = `dfv${dim}` as keyof OpportunityState;
                                                    const val = data[key];
                                                    return (
                                                        <div key={dim} className="space-y-1">
                                                            <div className="text-[10px] font-bold text-slate-400 uppercase">{dim}</div>
                                                            <div className="flex gap-1">
                                                                {['LOW', 'MED', 'HIGH'].map(lvl => (
                                                                    <button
                                                                        key={lvl}
                                                                        onClick={() => handleInputChange(key, lvl)}
                                                                        className={`flex-1 py-1 text-[8px] font-bold rounded ${val === lvl
                                                                            ? (lvl === 'HIGH' ? 'bg-status-safe text-white' : lvl === 'LOW' ? 'bg-status-risk text-white' : 'bg-status-value text-white')
                                                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                                                                            }`}
                                                                    >
                                                                        {lvl[0]}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'D' && (
                                <motion.div key="D" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }}>
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Definition of Done</label>
                                            <textarea
                                                value={data.definitionOfDone}
                                                onChange={(e) => handleInputChange('definitionOfDone', e.target.value)}
                                                className="w-full bg-white/50 dark:bg-black/20 border border-slate-200 dark:border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-inset focus:ring-brand-cyan outline-none h-24 transition-all resize-none"
                                                placeholder="Success criteria..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Key Decisions</label>
                                            <textarea
                                                value={data.keyDecisions}
                                                onChange={(e) => handleInputChange('keyDecisions', e.target.value)}
                                                className="w-full bg-white/50 dark:bg-black/20 border border-slate-200 dark:border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-inset focus:ring-brand-cyan outline-none h-24 transition-all resize-none"
                                                placeholder="Architectural or Policy decisions..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Impacted Systems</label>
                                            <div className="flex flex-wrap gap-2 mb-2 p-2 min-h-[40px] bg-white/50 dark:bg-black/20 rounded border border-slate-200 dark:border-slate-700">
                                                {data.impactedSystems.map(sys => (
                                                    <span key={sys} className="px-2 py-1 bg-slate-200 dark:bg-slate-700 text-xs rounded flex items-center gap-2">
                                                        {sys}
                                                        <button onClick={() => removeSystem(sys)} className="text-slate-500 hover:text-red-500">×</button>
                                                    </span>
                                                ))}
                                                <input
                                                    onKeyDown={handleSystemAdd}
                                                    className="bg-transparent outline-none text-sm min-w-[100px] flex-1"
                                                    placeholder="Type & Enter..."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Right Panel: Visualization */}
                <div className="min-w-[420px] h-full">
                    <StrategicProfile data={data.vrcc} />
                </div>

            </main>
        </div>
    );
}
