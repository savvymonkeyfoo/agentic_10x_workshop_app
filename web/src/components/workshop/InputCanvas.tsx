"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { VRCCSlider } from '@/components/ui/VRCCSlider';
import { StrategicProfile } from '@/components/workshop/StrategicProfile';
import { saveOpportunity } from '@/app/actions/save-opportunity';
import { getOpportunities } from '@/app/actions/get-opportunities';
import { deleteOpportunity } from '@/app/actions/delete-opportunity';
import { OpportunityTileNavigator } from '@/components/workshop/OpportunityTileNavigator';
import { TShirtSizeSelector } from '@/components/ui/TShirtSizeSelector';
import { DFVAssessment, DFVAssessmentInput, DEFAULT_DFV_ASSESSMENT } from '@/components/ui/DFVAssessmentInput';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { SmartListTextarea } from '@/components/ui/SmartListTextarea';

import { OpportunityState, WorkflowPhase } from '@/types/workshop';
import { calculateCompleteness } from '@/utils/completeness';

// --- Initial State (Mirroring Schema) ---

const INITIAL_STATE: OpportunityState = {
    projectName: '',
    frictionStatement: '',
    strategicHorizon: [], // Default empty
    whyDoIt: '',

    workflowPhases: [], // Start empty or with 1 default? User said "Add Phase" button.
    capabilitiesExisting: [],
    capabilitiesMissing: [],

    vrcc: {
        value: 3,
        capability: 3,
        complexity: 3,
        riskFinal: 3,
        riskAI: 0,
        riskOverrideLog: '',
    },
    tShirtSize: 'M',
    benefitRevenue: undefined,
    benefitCostAvoidance: undefined,
    benefitEstCost: undefined,
    benefitEfficiency: undefined,
    benefitTimeframe: 'Monthly',
    dfvAssessment: DEFAULT_DFV_ASSESSMENT,
    definitionOfDone: '',
    keyDecisions: '',
    impactedSystems: [],
    systemGuardrails: '',
    aiOpsRequirements: '',
    changeManagement: '',
    trainingRequirements: ''
};

// --- Config: Tabs ---
const TABS = [
    { id: 'A', label: 'OPPORTUNITY' },
    { id: 'B', label: 'THE WORKFLOW' },
    { id: 'C', label: 'EXECUTION' },
    { id: 'D', label: 'BUSINESS CASE' }
] as const;

// --- Config: Strategic Horizons ---
const HORIZONS = [
    { id: 'Growth & Scalability', label: 'Growth & Scalability', color: 'bg-brand-cyan text-white', border: 'border-brand-cyan' },
    { id: 'Operational Throughput', label: 'Operational Throughput', color: 'bg-status-gap text-white', border: 'border-status-gap' }, // Amber
    { id: 'Strategic Advantage', label: 'Strategic Advantage', color: 'bg-status-risk text-white', border: 'border-status-risk' } // Red
] as const;


// --- Subcomponent: Phase Card ---
const AUTONOMY_LABELS = {
    'L0': 'Autonomy - ASSIST (Human Initiates)',
    'L1': 'Autonomy - SUGGEST (Human Approves)',
    'L2': 'Autonomy - EXECUTE (Contextual Autonomy)',
    'L3': 'Autonomy - ORCHESTRATE (Multi-step Workflow)',
    'L4': 'Autonomy - OPTIMIZE (Domain Autonomy)',
    'L5': 'Autonomy - SELF-EVOLVE (Full Strategic Autonomy)'
};

const PhaseCard = ({ phase, updatePhase, requestDelete }: {
    phase: WorkflowPhase,
    updatePhase: (id: string, field: keyof WorkflowPhase, val: any) => void,
    requestDelete: (id: string) => void
}) => {
    return (
        <Reorder.Item value={phase} id={phase.id} className="flex items-center cursor-grab active:cursor-grabbing">
            {/* Card */}
            <div className={`w-72 bg-white dark:bg-slate-800 border rounded-xl transition-all p-4 relative group flex flex-col gap-3 shrink-0 mx-2 select-none ${['L4', 'L5'].includes(phase.autonomy)
                ? 'shadow-[0_0_20px_rgba(27,177,231,0.25)] border-brand-cyan/60'
                : 'border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md'
                }`}>

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
                        {(['L0', 'L1', 'L2', 'L3', 'L4', 'L5'] as const).map(level => (
                            <button
                                key={level}
                                onClick={() => updatePhase(phase.id, 'autonomy', level)}
                                className={`flex-1 py-1 text-[9px] font-bold rounded transition-colors ${phase.autonomy === level
                                    ? (
                                        level === 'L0' ? 'bg-slate-200 text-slate-700' :
                                            level === 'L1' ? 'bg-brand-cyan text-white' :
                                                level === 'L2' ? 'bg-status-safe text-white' :
                                                    level === 'L3' ? 'bg-purple-500 text-white' :
                                                        level === 'L4' ? 'bg-orange-500 text-white' :
                                                            'bg-yellow-500 text-white'
                                    )
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

export default function InputCanvas({ initialOpportunities, workshopId }: { initialOpportunities: any[], workshopId: string }) {
    const [activeTab, setActiveTab] = useState<'A' | 'B' | 'C' | 'D'>('A');
    const [data, setData] = useState<OpportunityState>(INITIAL_STATE);
    // Phase 29: Opportunity List State
    const [allOpportunities, setAllOpportunities] = useState<any[]>(initialOpportunities);
    const [opportunityId, setOpportunityId] = useState<string | undefined>(undefined);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [deleteModalId, setDeleteModalId] = useState<string | null>(null);
    const router = useRouter();

    const completenessStatus = calculateCompleteness(data);
    const completeness = completenessStatus.total;
    const isComplete = completenessStatus.total === 100;

    // --- Data Fetching ---
    // Kept to allow refreshing list after updates
    const fetchOpportunities = async () => {
        if (workshopId) {
            console.log("Refreshing opportunities for:", workshopId);
            const opps = await getOpportunities(workshopId);
            setAllOpportunities(opps);
        }
    };

    // --- Autosave Logic ---
    useEffect(() => {
        // Better: trigger on any change after mount.
        const timer = setTimeout(async () => {
            // Only autosave if we have a project name (minimal entry) to avoid ghost records on new
            if (data.projectName) {
                await performSave(data);
            }
        }, 1500);

        return () => clearTimeout(timer);
    }, [data]);

    const performSave = async (currentData: OpportunityState) => {
        setSaveStatus('saving');
        try {
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
                fetchOpportunities(); // Refresh list to match
            } else {
                setSaveStatus('error');
            }
        } catch (e) {
            console.error("Autosave failed", e);
            setSaveStatus('error');
        }
    };

    // --- Navigator Handlers ---
    const handleSelectOpportunity = (id: string) => {
        setSaveStatus('idle'); // Stop any pending autosave from previous state
        const selected = allOpportunities.find(o => o.id === id);
        if (selected) {
            setOpportunityId(selected.id);
            // Map DB to State
            setData({
                projectName: selected.projectName || '',
                frictionStatement: selected.frictionStatement || '',
                strategicHorizon: selected.strategicHorizon ? selected.strategicHorizon.split(',') : [],
                whyDoIt: selected.whyDoIt || '',
                // @ts-ignore
                workflowPhases: Array.isArray(selected.workflowPhases) ? selected.workflowPhases : [],
                capabilitiesExisting: selected.capabilitiesExisting || [],
                capabilitiesMissing: selected.capabilitiesMissing || [],
                vrcc: {
                    value: selected.scoreValue || 3,
                    capability: selected.scoreCapability || 3,
                    complexity: selected.scoreComplexity || 3,
                    riskFinal: selected.scoreRiskFinal || 3,
                    riskAI: selected.scoreRiskAI || 0,
                    riskOverrideLog: selected.riskOverrideLog || '',
                },
                tShirtSize: selected.tShirtSize || 'M',
                benefitRevenue: selected.benefitRevenue || undefined,
                benefitCostAvoidance: selected.benefitCostAvoidance || undefined,
                benefitEstCost: selected.benefitEstCost || undefined,
                benefitEfficiency: selected.benefitEfficiency || undefined,
                benefitTimeframe: selected.benefitTimeframe || 'Monthly',
                dfvAssessment: selected.dfvAssessment || DEFAULT_DFV_ASSESSMENT,
                definitionOfDone: selected.definitionOfDone || '',
                keyDecisions: selected.keyDecisions || '',
                impactedSystems: selected.impactedSystems || [],
                systemGuardrails: selected.systemGuardrails || '',
                aiOpsRequirements: selected.aiOpsRequirements || '',
                changeManagement: selected.changeManagement || '',
                trainingRequirements: selected.trainingRequirements || ''
            });
        }
    };

    const handleAddOpportunity = () => {
        setSaveStatus('idle');
        setOpportunityId(undefined); // New ID
        setData(INITIAL_STATE);
        setActiveTab('A');
    };

    const handleDeleteOpportunity = async (id: string) => {
        if (!confirm("Are you sure you want to delete this opportunity?")) return;

        await deleteOpportunity(id, workshopId);

        // Refresh list
        const updatedList = allOpportunities.filter(o => o.id !== id);
        setAllOpportunities(updatedList);

        // If currently selected, reset
        if (opportunityId === id) {
            handleAddOpportunity();
        }
    };

    // -- App Handlers --
    const handleAnalyse = async () => {
        // Force immediate save then redirect
        setSaveStatus('saving');
        try {
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



    return (
        <div className="min-h-screen bg-[var(--bg-core)] text-[var(--text-primary)] font-sans flex flex-col relative">

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

            {/* Sun Visor Navigator (Sticky Top) */}
            <OpportunityTileNavigator
                opportunities={allOpportunities}
                activeId={opportunityId}
                onSelect={handleSelectOpportunity}
                onAdd={handleAddOpportunity}
                onDelete={handleDeleteOpportunity}
            />

            {/* Header / Nav */}
            <header className="flex flex-col gap-6 mb-8 px-8 pt-4">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold tracking-tight">Opportunity Capture</h1>

                    <div className="flex items-center gap-4">
                        {/* Autosave Indicator */}
                        <div className="text-xs font-medium text-slate-400 w-20 text-right">
                            {saveStatus === 'saving' && <span className="animate-pulse">Saving...</span>}
                            {saveStatus === 'saved' && <span className="text-status-safe">Saved</span>}
                            {saveStatus === 'error' && <span className="text-status-risk">Error</span>}
                        </div>

                        {/* Completeness Ring */}
                        <div className={`h-8 w-8 rounded-full border-4 flex items-center justify-center text-[10px] font-bold transition-all duration-300 ${isComplete ? 'border-status-safe text-status-safe' : 'border-slate-200 dark:border-slate-700 text-slate-400'}`} style={{ borderColor: isComplete ? '#10B981' : undefined }}>
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
                </div>
            </header>

            {/* Main Split Grid - Dynamic width based on tab */}
            <main className={`grid gap-6 flex-1 pb-8 px-8 transition-all duration-300 ${activeTab === 'D' ? 'grid-cols-[3fr_1fr]' : 'grid-cols-1'}`}>

                {/* Left Panel: Input Tabs */}
                <div className="glass-panel p-8 flex flex-col h-full">
                    {/* Tabs Header */}
                    <div className="flex space-x-6 border-b border-[var(--glass-border)] mb-6 pb-2">
                        {TABS.map((tab) => {
                            let isTabValid = false;
                            if (tab.id === 'A') isTabValid = completenessStatus.tabs.opportunity;
                            if (tab.id === 'B') isTabValid = completenessStatus.tabs.workflow;
                            if (tab.id === 'C') isTabValid = completenessStatus.tabs.execution;
                            if (tab.id === 'D') isTabValid = completenessStatus.tabs.businessCase;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`pb-2 text-xs font-bold tracking-widest transition-colors relative flex items-center gap-2 ${activeTab === tab.id ? 'text-brand-blue' : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'}`}
                                >
                                    {tab.label}
                                    {isTabValid && <span className="w-1.5 h-1.5 rounded-full bg-status-safe" />}

                                    {activeTab === tab.id && <motion.div layoutId="underline" className="absolute bottom-0 left-0 w-full h-0.5" style={{ backgroundColor: tab.id === 'A' ? '#0070AD' : tab.id === 'B' ? '#1BB1E7' : tab.id === 'C' ? '#F59E0B' : '#EF4444' }} />}
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
                                        <div className="mb-6">
                                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Strategic Horizon</label>
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
                                        {/* Systems & Capabilities Sync */}
                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Impacted Systems (Existing)</label>
                                                <TagInput
                                                    tags={data.capabilitiesExisting}
                                                    addTag={(v) => addCapability('existing', v)}
                                                    removeTag={(v) => removeCapability('existing', v)}
                                                    placeholder="Add system..."
                                                    colorClass="bg-status-safe"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Required Capabilities (Gap)</label>
                                                <TagInput
                                                    tags={data.capabilitiesMissing}
                                                    addTag={(v) => addCapability('missing', v)}
                                                    removeTag={(v) => removeCapability('missing', v)}
                                                    placeholder="Add capability..."
                                                    colorClass="bg-status-gap"
                                                />
                                            </div>
                                        </div>

                                        {/* 3x2 Manual Execution Grid */}
                                        <div className="grid grid-cols-2 gap-4">
                                            {/* Row 1 */}
                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Success Metrics / Definition of Done</label>
                                                <SmartListTextarea
                                                    value={data.definitionOfDone}
                                                    onValueChange={(val) => handleInputChange('definitionOfDone', val)}
                                                    className="w-full bg-white/50 dark:bg-black/20 border border-slate-200 dark:border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-inset focus:ring-brand-cyan outline-none h-32 transition-all resize-none"
                                                    placeholder="Success criteria..."
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Key Decisions</label>
                                                <SmartListTextarea
                                                    value={data.keyDecisions}
                                                    onValueChange={(val) => handleInputChange('keyDecisions', val)}
                                                    className="w-full bg-white/50 dark:bg-black/20 border border-slate-200 dark:border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-inset focus:ring-brand-cyan outline-none h-32 transition-all resize-none"
                                                    placeholder="Architectural or Policy decisions..."
                                                />
                                            </div>

                                            {/* Row 2 */}
                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Change Management</label>
                                                <SmartListTextarea
                                                    value={data.changeManagement}
                                                    onValueChange={(val) => handleInputChange('changeManagement', val)}
                                                    className="w-full bg-white/50 dark:bg-black/20 border border-slate-200 dark:border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-inset focus:ring-brand-cyan outline-none h-32 transition-all resize-none"
                                                    placeholder="Staff impact, Process changes..."
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Training Requirements</label>
                                                <SmartListTextarea
                                                    value={data.trainingRequirements}
                                                    onValueChange={(val) => handleInputChange('trainingRequirements', val)}
                                                    className="w-full bg-white/50 dark:bg-black/20 border border-slate-200 dark:border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-inset focus:ring-brand-cyan outline-none h-32 transition-all resize-none"
                                                    placeholder="Upskilling needs..."
                                                />
                                            </div>

                                            {/* Row 3 */}
                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">AI Ops / Infra</label>
                                                <SmartListTextarea
                                                    value={data.aiOpsRequirements}
                                                    onValueChange={(val) => handleInputChange('aiOpsRequirements', val)}
                                                    className="w-full bg-white/50 dark:bg-black/20 border border-slate-200 dark:border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-inset focus:ring-brand-cyan outline-none h-32 transition-all resize-none"
                                                    placeholder="Compute, Hosting, Latency..."
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">System Guardrails</label>
                                                <SmartListTextarea
                                                    value={data.systemGuardrails}
                                                    onValueChange={(val) => handleInputChange('systemGuardrails', val)}
                                                    className="w-full bg-white/50 dark:bg-black/20 border border-slate-200 dark:border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-inset focus:ring-brand-cyan outline-none h-32 transition-all resize-none"
                                                    placeholder="Global AI boundaries..."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'D' && (
                                <motion.div key="D" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }}>
                                    <div className="space-y-6">
                                        {/* 2-Column Grid: T-Shirt Size | Estimated Benefit */}
                                        <div className="grid grid-cols-2 gap-8 mb-6">
                                            {/* Left Column: T-Shirt Size */}
                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">T-Shirt Size (Estimate)</label>
                                                <TShirtSizeSelector
                                                    value={data.tShirtSize}
                                                    onChange={(size) => handleInputChange('tShirtSize', size)}
                                                />
                                            </div>

                                            {/* Right Column: Estimated Benefit */}
                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Estimated Benefit</label>

                                                {/* Timeframe Toggle */}
                                                <div className="flex gap-1 mb-4 bg-slate-100 dark:bg-slate-800 rounded-full p-1 w-fit">
                                                    {['Monthly', 'Annually'].map((tf) => (
                                                        <button
                                                            key={tf}
                                                            onClick={() => handleInputChange('benefitTimeframe', tf)}
                                                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${data.benefitTimeframe === tf
                                                                ? 'bg-brand-cyan text-white shadow-md'
                                                                : 'text-slate-500 hover:text-slate-700'
                                                                }`}
                                                        >
                                                            {tf}
                                                        </button>
                                                    ))}
                                                </div>

                                                {/* Stacked Benefit Inputs */}
                                                <div className="space-y-3">
                                                    <div>
                                                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Rev. Uplift ($)</label>
                                                        <CurrencyInput
                                                            value={data.benefitRevenue}
                                                            onChange={(val) => handleInputChange('benefitRevenue', val)}
                                                            className="w-full bg-white/50 dark:bg-black/20 border border-slate-200 dark:border-slate-700 rounded p-2 text-sm outline-none focus:ring-2 focus:ring-brand-cyan"
                                                            placeholder="0"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Cost Avoid. ($)</label>
                                                        <CurrencyInput
                                                            value={data.benefitCostAvoidance}
                                                            onChange={(val) => handleInputChange('benefitCostAvoidance', val)}
                                                            className="w-full bg-white/50 dark:bg-black/20 border border-slate-200 dark:border-slate-700 rounded p-2 text-sm outline-none focus:ring-2 focus:ring-brand-cyan"
                                                            placeholder="0"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Hrs Saved</label>
                                                        <CurrencyInput
                                                            value={data.benefitEfficiency}
                                                            onChange={(val) => handleInputChange('benefitEfficiency', val)}
                                                            prefix=""
                                                            suffix="hrs"
                                                            className="w-full bg-white/50 dark:bg-black/20 border border-slate-200 dark:border-slate-700 rounded p-2 text-sm outline-none focus:ring-2 focus:ring-brand-cyan"
                                                            placeholder="0"
                                                        />
                                                    </div>
                                                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 mt-2">
                                                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Est. Implementation Cost ($)</label>
                                                        <CurrencyInput
                                                            value={data.benefitEstCost}
                                                            onChange={(val) => handleInputChange('benefitEstCost', val)}
                                                            className="w-full bg-white/50 dark:bg-black/20 border border-slate-200 dark:border-slate-700 rounded p-2 text-sm outline-none focus:ring-2 focus:ring-brand-cyan"
                                                            placeholder="One-time cost..."
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* VRCC Sliders - UNCHANGED */}
                                        <div className="space-y-2">
                                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">VRCC Scores</label>
                                            <VRCCSlider label="Value" value={data.vrcc.value} onChange={(val) => setData(prev => ({ ...prev, vrcc: { ...prev.vrcc, value: val } }))} />
                                            <div>
                                                <VRCCSlider
                                                    label="Risk"
                                                    value={data.vrcc.riskFinal}
                                                    onChange={(val) => setData(prev => ({ ...prev, vrcc: { ...prev.vrcc, riskFinal: val } }))}
                                                />
                                            </div>
                                            <VRCCSlider label="Capability" value={data.vrcc.capability} onChange={(val) => setData(prev => ({ ...prev, vrcc: { ...prev.vrcc, capability: val } }))} />
                                            <VRCCSlider label="Complexity" value={data.vrcc.complexity} onChange={(val) => setData(prev => ({ ...prev, vrcc: { ...prev.vrcc, complexity: val } }))} />
                                        </div>


                                        {/* DFV Assessment - Star Rating */}
                                        <DFVAssessmentInput
                                            value={data.dfvAssessment}
                                            onChange={(assessment) => setData(prev => ({ ...prev, dfvAssessment: assessment }))}
                                        />

                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Right Panel: Visualization - Only visible on Business Case tab */}
                <AnimatePresence>
                    {activeTab === 'D' && (
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 50 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="flex-shrink-0 min-w-[280px] w-[280px] xl:w-[420px] h-full shrink-0"
                            style={{ minWidth: '280px', flexShrink: 0 }}
                        >
                            <StrategicProfile data={data.vrcc} dfvAssessment={data.dfvAssessment} />
                        </motion.div>
                    )}
                </AnimatePresence>

            </main>
        </div>
    );
}
