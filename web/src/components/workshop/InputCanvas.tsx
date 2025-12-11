"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { Check, X, ArrowRight, Plus, Maximize2, Minimize2 } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
import { DeleteConfirmationModal } from '@/components/ui/DeleteConfirmationModal';
import CapabilitiesManager from './CapabilitiesManager';

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


// --- HELPER: Sortable Wrapper ---
const SortablePhaseCard = ({ id, children }: { id: string, children: React.ReactNode }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1, // Fade out the original while dragging
        zIndex: isDragging ? 50 : 'auto',
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="shrink-0 h-full">
            {children}
        </div>
    );
};

// --- HELPER COMPONENT: Auto-Growing Textarea with Smart Bullets ---
const SmartTextarea = ({
    value,
    onChange,
    placeholder,
    label
}: {
    value: string;
    onChange: (val: string) => void;
    placeholder: string;
    label: string;
}) => {
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    // 1. Auto-Resize on EVERY value change
    React.useLayoutEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [value]);

    // 2. Smart Bullet Logic
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const target = e.target as HTMLTextAreaElement;
            const start = target.selectionStart;
            const end = target.selectionEnd;

            // Insert newline + bullet
            const newValue = value.substring(0, start) + "\n• " + value.substring(end);

            onChange(newValue);

            // Restore cursor position after state update
            setTimeout(() => {
                if (textareaRef.current) {
                    textareaRef.current.selectionStart = start + 3;
                    textareaRef.current.selectionEnd = start + 3;
                }
            }, 0);
        }
    };

    return (
        <div className="flex flex-col gap-1" onPointerDown={(e) => e.stopPropagation()}>
            <span className="text-[10px] font-bold text-yellow-700 uppercase tracking-wider">
                {label}
            </span>
            <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={(e) => {
                    if (!value) onChange('• ');
                }}
                className="w-full text-sm leading-relaxed bg-yellow-50/50 border-b border-yellow-200 focus:border-yellow-500 outline-none resize-none overflow-hidden min-h-[28px] placeholder-yellow-600/40 text-slate-700 font-medium"
                placeholder={placeholder}
                rows={1}
            />
        </div>
    );
};

// --- Subcomponent: Phase Card (Deprecated/Unused if loop is inline, but kept for safety reference) ---
const AUTONOMY_LABELS: Record<string, string> = {
    'L1': 'Human executes, AI has no role.',
    'L2': 'Human executes, AI proposes drafts.',
    'L3': 'AI executes, Human reviews/approves.',
    'L4': 'AI executes, Human audits post-hoc.',
    'L5': 'AI autonomous, No human loop.',
};

const PhaseCard = ({ phase, updatePhase, requestDelete }: {
    phase: WorkflowPhase,
    updatePhase: (id: string, field: keyof WorkflowPhase, val: any) => void,
    requestDelete: (id: string) => void
}) => {
    return (
        <Reorder.Item value={phase} id={phase.id} className="flex items-center cursor-grab active:cursor-grabbing">
            <div className="bg-[#fff9c4] rounded-sm shadow-md border-t border-yellow-200 p-4 w-[320px] shrink-0 flex flex-col gap-3 group hover:rotate-1 hover:scale-[1.01] transition-transform duration-200 origin-top mx-2 select-none">
                {/* Header (Phase Name) */}
                <div className="flex justify-between items-start border-b border-yellow-200/50 pb-2 mb-1">
                    <input
                        type="text"
                        value={phase.name}
                        onChange={(e) => updatePhase(phase.id, 'name', e.target.value)}
                        className="font-bold text-slate-800 text-lg bg-transparent border-none focus:ring-0 outline-none w-full placeholder-yellow-600/50"
                        placeholder="Phase Name..."
                        onPointerDown={(e) => e.stopPropagation()}
                    />
                    <button onClick={(e) => { e.stopPropagation(); requestDelete(phase.id); }} className="text-yellow-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        <X size={16} />
                    </button>
                </div>

                {/* I.P.O. Section - The "Post-it" Content */}
                <div className="space-y-3">

                    {/* INPUTS: "Triggers" */}
                    <div className="flex flex-col gap-1" onPointerDown={(e) => e.stopPropagation()}>
                        <span className="text-[10px] font-bold text-yellow-700 uppercase tracking-wider">Trigger / Input</span>
                        <textarea
                            value={phase.inputs || ''}
                            onChange={(e) => {
                                updatePhase(phase.id, 'inputs', e.target.value);
                                // Auto-grow height logic
                                e.target.style.height = 'auto';
                                e.target.style.height = e.target.scrollHeight + 'px';
                            }}
                            className="w-full text-sm leading-relaxed bg-yellow-50/50 border-b border-yellow-200 focus:border-yellow-500 outline-none resize-none overflow-hidden min-h-[28px] placeholder-yellow-600/40 text-slate-700"
                            placeholder="e.g. Email received, End of Month..."
                            rows={1}
                        />
                    </div>

                    {/* ACTIONS: "Doing" */}
                    <div className="flex flex-col gap-1" onPointerDown={(e) => e.stopPropagation()}>
                        <span className="text-[10px] font-bold text-yellow-700 uppercase tracking-wider">Actions Taken</span>
                        <textarea
                            value={phase.actions || ''}
                            onChange={(e) => {
                                updatePhase(phase.id, 'actions', e.target.value);
                                e.target.style.height = 'auto';
                                e.target.style.height = e.target.scrollHeight + 'px';
                            }}
                            className="w-full text-sm leading-relaxed bg-yellow-50/50 border-b border-yellow-200 focus:border-yellow-500 outline-none resize-none overflow-hidden min-h-[28px] placeholder-yellow-600/40 text-slate-700"
                            placeholder="e.g. Validate data, Calculate score..."
                            rows={1}
                        />
                    </div>

                    {/* OUTPUTS: "Results" */}
                    <div className="flex flex-col gap-1" onPointerDown={(e) => e.stopPropagation()}>
                        <span className="text-[10px] font-bold text-yellow-700 uppercase tracking-wider">Artifact / Output</span>
                        <textarea
                            value={phase.outputs || ''}
                            onChange={(e) => {
                                updatePhase(phase.id, 'outputs', e.target.value);
                                e.target.style.height = 'auto';
                                e.target.style.height = e.target.scrollHeight + 'px';
                            }}
                            className="w-full text-sm leading-relaxed bg-yellow-50/50 border-b border-yellow-200 focus:border-yellow-500 outline-none resize-none overflow-hidden min-h-[28px] placeholder-yellow-600/40 text-slate-700"
                            placeholder="e.g. PDF Report, Approval flag..."
                            rows={1}
                        />
                    </div>
                </div>

                {/* Autonomy Footer (Subtle) */}
                <div className="pt-3 mt-auto">
                    <div className="flex gap-1 justify-between bg-white/30 p-1 rounded-full" onPointerDown={(e) => e.stopPropagation()}>
                        {['L1', 'L2', 'L3', 'L4', 'L5'].map((level) => (
                            <button
                                key={level}
                                onClick={() => updatePhase(phase.id, 'autonomy', level as any)}
                                className={`w-8 h-6 flex items-center justify-center text-[9px] font-bold rounded-full transition-all ${phase.autonomy === level
                                    ? 'bg-slate-800 text-white shadow-sm scale-110'
                                    : 'text-yellow-800 hover:bg-yellow-200'
                                    }`}
                            >
                                {level}
                            </button>
                        ))}
                    </div>
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
    const [isGlobalReady, setIsGlobalReady] = useState(false);
    const [globalCompleteness, setGlobalCompleteness] = useState(0);
    const [opportunityToDelete, setOpportunityToDelete] = useState<any | null>(null);
    const [isDeletingOpportunity, setIsDeletingOpportunity] = useState(false);

    // Zoom / View Mode State
    const [isZoomedOut, setIsZoomedOut] = useState(false);
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);

    // Smart Navigator State
    const [isNavOpen, setIsNavOpen] = useState(true); // Default open
    const navTimerRef = React.useRef<NodeJS.Timeout | null>(null);

    const handleSmartSelect = (opp: any) => {
        // 1. Perform the normal selection
        handleSelectOpportunity(opp.id);

        // 2. Manage the Timer
        if (navTimerRef.current) clearTimeout(navTimerRef.current);

        // 3. Set new Auto-Close Timer (5 seconds)
        navTimerRef.current = setTimeout(() => {
            setIsNavOpen(false);
        }, 5000);
    };

    // Scroll Handling: (Removed Auto-Scroll to allow context retention)

    const router = useRouter();

    const completenessStatus = calculateCompleteness(data);
    const completeness = completenessStatus.total;
    const isComplete = completenessStatus.total === 100;

    // --- Global Completeness Check (Auto-Calculate on Load) ---
    useEffect(() => {
        if (allOpportunities && allOpportunities.length > 0) {
            let totalScore = 0;

            allOpportunities.forEach(opp => {
                // Map partial DB data to state shape for calculator
                const mockState = {
                    projectName: opp.projectName,
                    frictionStatement: opp.frictionStatement,
                    workflowPhases: Array.isArray(opp.workflowPhases) ? opp.workflowPhases : [],
                    definitionOfDone: opp.definitionOfDone,
                    keyDecisions: opp.keyDecisions,
                    dfvAssessment: opp.dfvAssessment,
                    benefitRevenue: opp.benefitRevenue,
                    // Defaults
                    strategicHorizon: [],
                    whyDoIt: '',
                    capabilitiesExisting: [],
                    capabilitiesMissing: [],
                    vrcc: {},
                    tShirtSize: 'M'
                } as unknown as OpportunityState;

                totalScore += calculateCompleteness(mockState).total;
            });

            const avgCompleteness = Math.round(totalScore / allOpportunities.length);
            setGlobalCompleteness(avgCompleteness);

            // Enable if everything is effectively complete (or >90% to be forgiving?)
            // Following strict user request:
            if (avgCompleteness === 100) {
                setIsGlobalReady(true);
            }
        }
    }, [allOpportunities]);


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

    const handleDeleteOpportunity = (id: string) => {
        const opp = allOpportunities.find(o => o.id === id);
        if (opp) {
            setOpportunityToDelete(opp);
        }
    };

    const confirmDeleteOpportunity = async () => {
        if (!opportunityToDelete) return;
        setIsDeletingOpportunity(true);
        try {
            await deleteOpportunity(opportunityToDelete.id, workshopId);

            // Refresh list
            const updatedList = allOpportunities.filter(o => o.id !== opportunityToDelete.id);
            setAllOpportunities(updatedList);

            // If currently selected, reset
            if (opportunityId === opportunityToDelete.id) {
                handleAddOpportunity();
            }
            setOpportunityToDelete(null);
        } catch (error) {
            console.error("Delete failed", error);
            alert("Failed to delete opportunity");
        } finally {
            setIsDeletingOpportunity(false);
        }
    };

    // -- App Handlers --
    const handleAnalyse = async () => {
        // If current data is NOT complete but we are globally read, just redirect
        if (!isComplete && isGlobalReady) {
            router.push(`/workshop/${workshopId}/analysis`);
            return;
        }

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

    // --- DRAG & DROP SENSORS ---
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Require 8px movement before drag starts (allows clicking inputs)
            },
        }),
        // FIX: Configure Keyboard to only start dragging on "Enter", never "Space"
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
            keyboardCodes: {
                start: ['Enter'],
                cancel: ['Escape'],
                end: ['Enter', 'Space'],
            },
        })
    );

    const handleDragEnd = (event: any) => {
        const { active, over } = event;

        if (active && over && active.id !== over.id) {
            setData((prev) => {
                const oldIndex = prev.workflowPhases.findIndex((p) => p.id === active.id);
                const newIndex = prev.workflowPhases.findIndex((p) => p.id === over.id);

                // Reorder Array
                const newPhases = arrayMove(prev.workflowPhases, oldIndex, newIndex);
                return { ...prev, workflowPhases: newPhases };
            });
        }
    };

    // --- Workflow Handlers ---
    const addPhase = () => {
        setSaveStatus('idle');
        const newPhase: WorkflowPhase = {
            id: crypto.randomUUID(),
            name: '',
            autonomy: 'L0',
            inputs: '',
            actions: '',
            outputs: '',
            guardrail: '' // deprecated
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

            {/* Confirmation Modal (Opportunity) */}
            <DeleteConfirmationModal
                isOpen={!!opportunityToDelete}
                title="Delete Opportunity?"
                description={`Are you sure you want to remove "${opportunityToDelete?.projectName || 'this item'}"? This action cannot be undone.`}
                onClose={() => setOpportunityToDelete(null)}
                onConfirm={confirmDeleteOpportunity}
                isDeleting={isDeletingOpportunity}
            />

            {/* Confirmation Modal (Phase) */}
            <AnimatePresence>
                {/* Delete Confirmation Modal */}
                {deleteModalId && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                        onClick={() => setDeleteModalId(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            className="bg-white p-6 rounded-lg shadow-xl w-[400px]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="text-xl font-bold mb-2">Delete Phase?</h3>
                            <p className="text-slate-600 mb-6">Are you sure you want to delete this phase? This action cannot be undone.</p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setDeleteModalId(null)}
                                    className="px-4 py-2 rounded text-slate-500 hover:bg-slate-100 font-medium"
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

            {/* --- HEADER SECTION --- */}
            <div className="bg-white border-b border-slate-200 px-8 py-5 flex justify-between items-center sticky top-0 z-30">
                <div className="flex items-baseline gap-3">
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                        Opportunity Capture
                    </h1>
                    {/* DYNAMIC TITLE */}
                    {data.projectName && (
                        <span className="text-xl font-medium text-slate-400 border-l border-slate-300 pl-3 animate-in fade-in">
                            {data.projectName}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    {/* Autosave Indicator */}
                    <div className="text-xs font-medium text-slate-400 w-20 text-right">
                        {saveStatus === 'saving' && <span className="animate-pulse">Saving...</span>}
                        {saveStatus === 'saved' && <span className="text-status-safe">Saved</span>}
                        {saveStatus === 'error' && <span className="text-status-risk">Error</span>}
                    </div>

                    {/* Completeness Ring */}
                    <div className={`h-9 w-9 rounded-full border-4 flex items-center justify-center transition-all duration-300 ${isComplete || isGlobalReady
                        ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-200'
                        : 'bg-transparent border-slate-200 dark:border-slate-700 text-emerald-600'
                        }`}>
                        {isComplete || isGlobalReady ? (
                            <Check className="w-5 h-5 text-white" strokeWidth={3} />
                        ) : (
                            <span className="text-[10px] font-bold">
                                {Math.round(isGlobalReady ? 100 : completeness)}%
                            </span>
                        )}
                    </div>
                    <button
                        disabled={!isComplete && !isGlobalReady}
                        onClick={handleAnalyse}
                        className={`px-6 py-2 rounded-full font-semibold transition-all ${isComplete || isGlobalReady ? 'bg-brand-blue text-white shadow-lg hover:shadow-xl hover:scale-105' : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'}`}
                    >
                        Analyse
                    </button>
                </div>
            </div>

            {/* --- NAVIGATOR (Controlled) --- */}
            <OpportunityTileNavigator
                opportunities={allOpportunities}
                selectedId={opportunityId || null}
                onSelect={handleSmartSelect} // Use the new smart handler
                onCreate={handleAddOpportunity}
                onDelete={handleDeleteOpportunity}
                isOpen={isNavOpen}
                onToggle={() => setIsNavOpen(!isNavOpen)}
            />

            {/* Main Split Grid - Dynamic width based on tab */}
            <main className={`grid gap-6 flex-1 pb-8 pt-8 px-8 transition-all duration-300 ${activeTab === 'D' ? 'grid-cols-[3fr_1fr]' : 'grid-cols-1'}`}>

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
                                        {/* --- SECTION HEADER --- */}
                                        <div className="flex justify-between items-end mb-4 px-1">
                                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                                Workflow Definition (Phase Cards)
                                            </h3>

                                            {/* VIEW TOGGLE (Replaces old Add Button) */}
                                            <button
                                                onClick={() => setIsZoomedOut(!isZoomedOut)}
                                                className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors bg-slate-50 hover:bg-blue-50 px-3 py-1.5 rounded border border-slate-200"
                                            >
                                                {isZoomedOut ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
                                                {isZoomedOut ? "Zoom In (Detail)" : "Zoom Out (Overview)"}
                                            </button>
                                        </div>

                                        {/* --- WORKFLOW SCROLL CONTAINER --- */}
                                        <div
                                            ref={scrollContainerRef}
                                            className={`flex gap-4 overflow-x-auto pb-6 px-1 items-start scroll-smooth transition-all duration-500 custom-scrollbar ${isZoomedOut ? 'min-h-[200px]' : 'min-h-[440px]'}`}
                                        >

                                            <DndContext
                                                sensors={sensors}
                                                collisionDetection={closestCenter}
                                                onDragEnd={handleDragEnd}
                                            >
                                                <SortableContext
                                                    items={data.workflowPhases.map((p: any) => p.id)}
                                                    strategy={horizontalListSortingStrategy}
                                                >
                                                    {data.workflowPhases?.map((phase, index) => (
                                                        <SortablePhaseCard key={phase.id} id={phase.id}>
                                                            <div
                                                                onClick={() => {
                                                                    if (isZoomedOut) setIsZoomedOut(false);
                                                                }}
                                                                className={`bg-[#fff9c4] rounded-sm shadow-md border-t border-yellow-200 flex flex-col gap-3 group hover:rotate-1 hover:scale-[1.01] transition-all duration-300 origin-top cursor-grab active:cursor-grabbing select-none
                                                                    ${isZoomedOut
                                                                        ? 'w-[150px] h-[150px] p-3 justify-center items-center text-center cursor-pointer hover:shadow-lg hover:border-blue-400' // OVERVIEW STYLE
                                                                        : 'w-[320px] p-4' // DETAIL STYLE
                                                                    }`}
                                                            >

                                                                {/* HEADER (Title) */}
                                                                <div className={`w-full ${isZoomedOut ? 'flex items-center justify-center h-full' : 'border-b border-yellow-200/50 pb-2 mb-1 flex justify-between items-start'}`}>
                                                                    {isZoomedOut ? (
                                                                        <div className="font-kalam font-bold text-slate-800 text-sm leading-tight line-clamp-4 select-none">
                                                                            {phase.name || "Untitled Phase"}
                                                                        </div>
                                                                    ) : (
                                                                        <>
                                                                            <input
                                                                                type="text"
                                                                                value={phase.name}
                                                                                onChange={(e) => updatePhase(phase.id, 'name', e.target.value)}
                                                                                className="font-bold text-slate-800 text-lg bg-transparent border-none focus:ring-0 outline-none w-full placeholder-yellow-600/50"
                                                                                placeholder="Phase Name..."
                                                                                onPointerDown={(e) => e.stopPropagation()}
                                                                            />
                                                                            <button
                                                                                onPointerDown={(e) => e.stopPropagation()}
                                                                                onClick={() => requestDeletePhase(phase.id)}
                                                                                className="text-yellow-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                            >
                                                                                <X size={16} />
                                                                            </button>
                                                                        </>
                                                                    )}
                                                                </div>

                                                                {/* DETAILS (Hidden in Zoom Out) */}
                                                                <div className={`space-y-3 transition-opacity duration-200 ${isZoomedOut ? 'hidden opacity-0' : 'block opacity-100'}`}>
                                                                    <SmartTextarea
                                                                        label="Trigger / Input"
                                                                        value={phase.inputs || ''}
                                                                        onChange={(val) => updatePhase(phase.id, 'inputs', val)}
                                                                        placeholder="• List items..."
                                                                    />
                                                                    <SmartTextarea
                                                                        label="Actions Taken"
                                                                        value={phase.actions || ''}
                                                                        onChange={(val) => updatePhase(phase.id, 'actions', val)}
                                                                        placeholder="• List items..."
                                                                    />
                                                                    <SmartTextarea
                                                                        label="Artifact / Output"
                                                                        value={phase.outputs || ''}
                                                                        onChange={(val) => updatePhase(phase.id, 'outputs', val)}
                                                                        placeholder="• List items..."
                                                                    />

                                                                    {/* Autonomy Footer */}
                                                                    <div className="pt-3 mt-auto" onPointerDown={(e) => e.stopPropagation()}>
                                                                        <div className="flex flex-col gap-2">
                                                                            <div className="flex gap-1 justify-between bg-white/30 p-1 rounded-full">
                                                                                {['L1', 'L2', 'L3', 'L4', 'L5'].map((level) => (
                                                                                    <button
                                                                                        key={level}
                                                                                        onClick={() => updatePhase(phase.id, 'autonomy', level as any)}
                                                                                        className={`w-8 h-6 flex items-center justify-center text-[9px] font-bold rounded-full transition-all ${phase.autonomy === level
                                                                                            ? 'bg-slate-800 text-white shadow-sm scale-110'
                                                                                            : 'text-yellow-800 hover:bg-yellow-200'
                                                                                            }`}
                                                                                    >
                                                                                        {level}
                                                                                    </button>
                                                                                ))}
                                                                            </div>
                                                                            <div className="text-[10px] text-center text-yellow-800/80 font-medium h-4">
                                                                                {AUTONOMY_LABELS[phase.autonomy] || 'Select autonomy level'}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                            </div>
                                                        </SortablePhaseCard>
                                                    ))}
                                                </SortableContext>
                                            </DndContext>

                                            {/* --- GHOST ADD BUTTON (Resizes dynamically) --- */}
                                            <button
                                                onClick={addPhase}
                                                className={`shrink-0 rounded-lg border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/30 flex flex-col items-center justify-center gap-3 text-slate-400 hover:text-blue-500 transition-all group
                                                    ${isZoomedOut
                                                        ? 'w-[150px] h-[150px]' // Small Square
                                                        : 'w-[320px] h-[420px]' // Full Size
                                                    }`}
                                            >
                                                <div className="w-12 h-12 rounded-full bg-white border border-slate-200 group-hover:border-blue-300 flex items-center justify-center shadow-sm">
                                                    <Plus size={24} />
                                                </div>
                                                <span className="font-semibold text-sm">{isZoomedOut ? "Add" : "Add Next Phase"}</span>
                                            </button>

                                        </div>
                                    </div>

                                    {/* --- CAPABILITY MANAGER --- */}
                                    <div className="mt-8 pt-8 border-t border-slate-100">
                                        <CapabilitiesManager
                                            existingCaps={data.capabilitiesExisting || []}
                                            missingCaps={data.capabilitiesMissing || []}
                                            onUpdate={(field, newVal) => setData(prev => ({ ...prev, [field]: newVal }))}
                                            workflowContext={{
                                                name: data.projectName,
                                                friction: data.frictionStatement,
                                                phases: data.workflowPhases
                                            }}
                                        />
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
                                            {/* --- T-SHIRT SIZE SELECTOR (Clean, Centered, Scaled) --- */}
                                            <div className="flex flex-col h-full min-h-[160px]">
                                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                                                    T-Shirt Size (Estimate)
                                                </h3>

                                                {/* Container: Flex-1 pushes content to vertical center */}
                                                <div className="flex-1 flex items-center justify-center w-full">
                                                    <div className="grid grid-cols-5 gap-4 w-full items-end justify-items-center">
                                                        {['XS', 'S', 'M', 'L', 'XL'].map((size) => {
                                                            const isSelected = data.tShirtSize === size;

                                                            // Proportional Sizing (Bigger Base)
                                                            const scaleMap: Record<string, number> = {
                                                                'XS': 32,
                                                                'S': 42,
                                                                'M': 52,
                                                                'L': 64,
                                                                'XL': 76
                                                            };
                                                            const iconSize = scaleMap[size];

                                                            return (
                                                                <button
                                                                    key={size}
                                                                    onClick={() => handleInputChange('tShirtSize', size)}
                                                                    className="group flex flex-col items-center gap-2 transition-all duration-200 outline-none"
                                                                >
                                                                    {/* Icon Wrapper - No Border, Just the Shirt */}
                                                                    <div
                                                                        className={`transition-all duration-300 ${isSelected ? 'scale-110 drop-shadow-md' : 'scale-100 opacity-40 group-hover:opacity-100'}`}
                                                                    >
                                                                        <svg
                                                                            viewBox="0 0 24 24"
                                                                            fill="currentColor"
                                                                            className={isSelected ? 'text-blue-600' : 'text-slate-600'}
                                                                            width={iconSize}
                                                                            height={iconSize}
                                                                        >
                                                                            <path d="M20.38 3.55a.8.8 0 0 0-.46-.17h-.06l-4.5.56a6.23 6.23 0 0 1-6.72 0l-4.5-.56h-.06a.8.8 0 0 0-.46.17L.55 6.27a.8.8 0 0 0-.21 1l2.4 4.8a.8.8 0 0 0 1.25.17l1-1V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8.73l1 1a.8.8 0 0 0 1.25-.17l2.4-4.8a.8.8 0 0 0-.21-1z" />
                                                                        </svg>
                                                                    </div>

                                                                    {/* Label */}
                                                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'text-blue-600' : 'text-slate-300 group-hover:text-slate-500'}`}>
                                                                        {size}
                                                                    </span>

                                                                    {/* Active Dot (Subtle Indicator) */}
                                                                    <div className={`w-1.5 h-1.5 rounded-full mt-1 transition-colors ${isSelected ? 'bg-blue-600' : 'bg-transparent'}`} />
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
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
