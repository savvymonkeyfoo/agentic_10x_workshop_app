"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Plus, Maximize2, Minimize2, Sparkles } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { VRCCSlider } from '@/components/ui/VRCCSlider';
import { StrategicProfile } from '@/components/workshop/StrategicProfile';
import { saveOpportunity } from '@/app/actions/save-opportunity';
import { getOpportunities } from '@/app/actions/get-opportunities';
import { deleteOpportunity } from '@/app/actions/delete-opportunity';
import { demoteFromCapture } from '@/app/actions/promotion';
import { OpportunityTileNavigator } from '@/components/workshop/OpportunityTileNavigator';
import { DEFAULT_DFV_ASSESSMENT, DFVAssessmentInput } from '@/components/ui/DFVAssessmentInput';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Button } from '@/components/ui/button';
import { draftExecutionPlan } from '@/app/actions/draft-execution';
import { SmartTextarea } from '@/components/ui/smart-textarea';
import CapabilitiesManager from './CapabilitiesManager';

import { OpportunityState, WorkflowPhase } from '@/types/workshop';
import { calculateCompleteness } from '@/utils/completeness';
import { agenticEnrichment, EnrichmentMode } from '@/app/actions/agentic-enrichment';
import { recommendCapabilities } from '@/app/actions/recommend-capabilities';
import { toast } from 'sonner';

// --- Initial State (Mirroring Schema) ---

const INITIAL_STATE: OpportunityState = {
    projectName: '',
    description: '', // [NEW] Description specific to the opportunity
    notes: '', // [NEW] Facilitator Notes
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
    trainingRequirements: '',

    // Narrative Fields
    businessCase: '',
    executionPlan: '',
    techAlignment: '',
    strategyAlignment: ''
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
    { id: 'Growth & Scalability', label: 'Growth & Scalability', color: 'bg-info text-white', border: 'border-info' },
    { id: 'Operational Throughput', label: 'Operational Throughput', color: 'bg-warning-subtle text-white', border: 'border-warning' },
    { id: 'Strategic Advantage', label: 'Strategic Advantage', color: 'bg-intelligence text-white', border: 'border-intelligence' }
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

// --- HELPER COMPONENT: Simple Auto-Growing Textarea for Titles ---
const TitleTextarea = ({
    value,
    onChange,
    placeholder,
    className
}: {
    value: string;
    onChange: (val: string) => void;
    placeholder: string;
    className?: string;
}) => {
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    // Auto-Resize on EVERY value change
    React.useLayoutEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'; // Reset to shrink if needed
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [value]);

    return (
        <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={className}
            placeholder={placeholder}
            rows={1}
            onPointerDown={(e) => e.stopPropagation()} // Important for dnd-kit dragging
        />
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

/*
const PhaseCard = ({ phase, updatePhase, requestDelete }: {
    phase: WorkflowPhase,
    updatePhase: (id: string, field: keyof WorkflowPhase, val: any) => void,
    requestDelete: (id: string) => void
}) => {
    return (
        <Reorder.Item value={phase} id={phase.id} className="flex items-center cursor-grab active:cursor-grabbing">
            <div className="bg-warning-subtle rounded-sm shadow-md border-t border-warning-subtle p-4 w-[320px] shrink-0 flex flex-col gap-3 group hover:rotate-1 hover:scale-[1.01] transition-transform duration-200 origin-top mx-2 select-none">
                <div className="flex justify-between items-start border-b border-warning-subtle/50 pb-2 mb-1">
                    <input
                        type="text"
                        value={phase.name}
                        onChange={(e) => updatePhase(phase.id, 'name', e.target.value)}
                        className="font-bold text-primary text-lg bg-transparent border-none focus:ring-0 outline-none w-full placeholder-yellow-600/50"
                        placeholder="Phase Name..."
                        onPointerDown={(e) => e.stopPropagation()}
                    />
                    <button onClick={(e) => { e.stopPropagation(); requestDelete(phase.id); }} className="text-warning hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                        <X size={16} />
                    </button>
                </div>

                <div className="space-y-3">

                    <div className="flex flex-col gap-1" onPointerDown={(e) => e.stopPropagation()}>
                        <span className="text-xs font-bold text-warning uppercase tracking-wider">Trigger / Input</span>
                        <textarea
                            value={phase.inputs || ''}
                            onChange={(e) => {
                                updatePhase(phase.id, 'inputs', e.target.value);
                                // Auto-grow height logic
                                e.target.style.height = 'auto';
                                e.target.style.height = e.target.scrollHeight + 'px';
                            }}
                            className="w-full text-sm leading-relaxed bg-warning-subtle/50 border-b border-warning-subtle focus:border-warning outline-none resize-none overflow-hidden min-h-[28px] placeholder-yellow-600/40 text-primary"
                            placeholder="e.g. Email received, End of Month..."
                            rows={1}
                        />
                    </div>

                    <div className="flex flex-col gap-1" onPointerDown={(e) => e.stopPropagation()}>
                        <span className="text-xs font-bold text-warning uppercase tracking-wider">Actions Taken</span>
                        <textarea
                            value={phase.actions || ''}
                            onChange={(e) => {
                                updatePhase(phase.id, 'actions', e.target.value);
                                e.target.style.height = 'auto';
                                e.target.style.height = e.target.scrollHeight + 'px';
                            }}
                            className="w-full text-sm leading-relaxed bg-warning-subtle/50 border-b border-warning-subtle focus:border-warning outline-none resize-none overflow-hidden min-h-[28px] placeholder-yellow-600/40 text-primary"
                            placeholder="e.g. Validate data, Calculate score..."
                            rows={1}
                        />
                    </div>

                    <div className="flex flex-col gap-1" onPointerDown={(e) => e.stopPropagation()}>
                        <span className="text-xs font-bold text-warning uppercase tracking-wider">Artifact / Output</span>
                        <textarea
                            value={phase.outputs || ''}
                            onChange={(e) => {
                                updatePhase(phase.id, 'outputs', e.target.value);
                                e.target.style.height = 'auto';
                                e.target.style.height = e.target.scrollHeight + 'px';
                            }}
                            className="w-full text-sm leading-relaxed bg-warning-subtle/50 border-b border-warning-subtle focus:border-warning outline-none resize-none overflow-hidden min-h-[28px] placeholder-yellow-600/40 text-primary"
                            placeholder="e.g. PDF Report, Approval flag..."
                            rows={1}
                        />
                    </div>
                </div>

                <div className="pt-3 mt-auto">
                    <div className="flex gap-1 justify-between bg-white/30 p-1 rounded-full" onPointerDown={(e) => e.stopPropagation()}>
                        {['L1', 'L2', 'L3', 'L4', 'L5'].map((level) => (
                            <button
                                key={level}
                                onClick={() => updatePhase(phase.id, 'autonomy', level as any)}
                                className={`w-8 h-6 flex items-center justify-center text-[9px] font-bold rounded-full transition-all ${phase.autonomy === level
                                    ? 'bg-card text-white shadow-sm scale-110'
                                    : 'text-warning hover:bg-warning-subtle'
                                    }`}
                            >
                                {level}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="text-disabled dark:text-secondary">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
            </div>
        </Reorder.Item>
    );
};
*/

// --- Subcomponent: Tag Input for Capabilities ---


// --- Component: Value Prop Builder ---
const ValuePropBuilder = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
    // Attempt to parse existing value - REFINED REGEX for strict structure
    const [parts, setParts] = useState({
        role: '',
        outcome: '',
        solution: '',
        need: ''
    });

    // Sync local state when external value changes matches the pattern
    // This allows unique updates from AI to populate the boxes
    useEffect(() => {
        // Regex to parse: "As a [Role], I want to [Outcome], with [Solution], so that [Need]."
        const regex = /As a\s+(.+?),\s+I want to\s+(.+?),\s+with\s+(.+?),\s+so that\s+(.+?)[.]?$/i;

        if (!value) {
            // Case 1: Empty value - RESET internal state to prevent "phantom" data
            setParts({
                role: '',
                outcome: '',
                solution: '',
                need: ''
            });
            return;
        }

        const match = value.match(regex);

        if (match) {
            // Case 2: Valid match - SYNC internal state with prop
            setParts({
                role: match[1],
                outcome: match[2],
                solution: match[3],
                need: match[4]
            });
        }
        // Case 3: Non-matching valid string - Keep current state or deciding to let it be 'raw' text?
        // For now, if it doesn't match, we assume the user might be free-text editing in the main box
        // or it's legacy data. Use caution not to wipe user's work if they are typing manually.
        // We do NOT reset here to avoid clearing inputs while user is typing a sentence that momentarily breaks regex.
    }, [value]);

    const updatePart = (key: keyof typeof parts, val: string) => {
        const newParts = { ...parts, [key]: val };
        setParts(newParts);
        const pitch = `As a ${newParts.role || '[Role]'}, I want to ${newParts.outcome || '[Outcome]'}, with ${newParts.solution || '[Solution]'}, so that ${newParts.need || '[Need]'}.`;
        onChange(pitch);
    };

    // Refs for auto-resize on state change
    const roleRef = React.useRef<HTMLTextAreaElement>(null);
    const outcomeRef = React.useRef<HTMLTextAreaElement>(null);
    const solutionRef = React.useRef<HTMLTextAreaElement>(null);
    const needRef = React.useRef<HTMLTextAreaElement>(null);

    // Auto-resize helper
    const adjustHeight = (el: HTMLTextAreaElement | null) => {
        if (el) {
            el.style.height = 'auto';
            el.style.height = el.scrollHeight + 'px';
        }
    };

    // Auto-resize ALL textareas when parts change (e.g., from AI generation)
    React.useLayoutEffect(() => {
        adjustHeight(roleRef.current);
        adjustHeight(outcomeRef.current);
        adjustHeight(solutionRef.current);
        adjustHeight(needRef.current);
    }, [parts]);

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>, key: keyof typeof parts) => {
        adjustHeight(e.target);
        updatePart(key, e.target.value);
    };

    return (
        <div className="space-y-4 bg-muted/10 dark:bg-muted/10 p-4 rounded-xl border border-dashed border-border">
            {/* Live Preview (Moved to Top) */}
            <div className="text-sm font-medium text-foreground bg-card p-4 rounded border border-border leading-relaxed shadow-sm">
                &quot;{value || <span className="text-muted-foreground italic font-normal">Start typing below to build your value proposition...</span>}&quot;
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="vp_role" className="block text-xs uppercase font-bold text-muted-foreground mb-1">As a [Role]...</label>
                    <textarea
                        ref={roleRef}
                        id="vp_role"
                        name="vp_role"
                        rows={1}
                        value={parts.role}
                        onChange={(e) => handleInput(e, 'role')}
                        className="w-full bg-input border border-input rounded px-3 py-2 text-sm focus:ring-2 focus:ring-ring outline-none resize-none overflow-hidden min-h-[38px] placeholder:text-muted-foreground"
                        placeholder="e.g. Insurance Broker"
                    />
                </div>
                <div>
                    <label htmlFor="vp_outcome" className="block text-xs uppercase font-bold text-muted-foreground mb-1">I want to [Outcome]...</label>
                    <textarea
                        ref={outcomeRef}
                        id="vp_outcome"
                        name="vp_outcome"
                        rows={1}
                        value={parts.outcome}
                        onChange={(e) => handleInput(e, 'outcome')}
                        className="w-full bg-input border border-input rounded px-3 py-2 text-sm focus:ring-2 focus:ring-ring outline-none resize-none overflow-hidden min-h-[38px] placeholder:text-muted-foreground"
                        placeholder="e.g. Submit a request via email..."
                    />
                </div>
                <div>
                    <label htmlFor="vp_solution" className="block text-xs uppercase font-bold text-muted-foreground mb-1">With [Solution]...</label>
                    <textarea
                        ref={solutionRef}
                        id="vp_solution"
                        name="vp_solution"
                        rows={1}
                        value={parts.solution}
                        onChange={(e) => handleInput(e, 'solution')}
                        className="w-full bg-input border border-input rounded px-3 py-2 text-sm focus:ring-2 focus:ring-ring outline-none resize-none overflow-hidden min-h-[38px] placeholder:text-muted-foreground"
                        placeholder="e.g. an Agentic Workflow"
                    />
                </div>
                <div>
                    <label htmlFor="vp_need" className="block text-xs uppercase font-bold text-muted-foreground mb-1">So that [Need]...</label>
                    <textarea
                        ref={needRef}
                        id="vp_need"
                        name="vp_need"
                        rows={1}
                        value={parts.need}
                        onChange={(e) => handleInput(e, 'need')}
                        className="w-full bg-input border border-input rounded px-3 py-2 text-sm focus:ring-2 focus:ring-ring outline-none resize-none overflow-hidden min-h-[38px] placeholder:text-muted-foreground"
                        placeholder="e.g. I have a quote in under 2 hours."
                    />
                </div>
            </div>
        </div>
    );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function InputCanvas({ initialOpportunities, workshopId }: { initialOpportunities: any[], workshopId: string }) {
    const [activeTab, setActiveTab] = useState<'A' | 'B' | 'C' | 'D'>('A');
    const [data, setData] = useState<OpportunityState>(INITIAL_STATE);
    // Phase 29: Opportunity List State
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [allOpportunities, setAllOpportunities] = useState<any[]>(initialOpportunities);
    const [opportunityId, setOpportunityId] = useState<string | undefined>(undefined);

    // Ref that mirrors opportunityId - solves stale closure issue in autosave timer
    const opportunityIdRef = React.useRef<string | undefined>(undefined);
    React.useEffect(() => {
        opportunityIdRef.current = opportunityId;
    }, [opportunityId]);

    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [deleteModalId, setDeleteModalId] = useState<string | null>(null);
    const [isGlobalReady, setIsGlobalReady] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [opportunityToDelete, setOpportunityToDelete] = useState<any | null>(null);
    const [isDeletingOpportunity, setIsDeletingOpportunity] = useState(false);

    // Ref to prevent double-save (blur + autosave race condition)
    const isSavingRef = React.useRef(false);

    // Zoom / View Mode State
    const [isZoomedOut, setIsZoomedOut] = useState(false);
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);

    // Smart Navigator State
    const [isNavOpen, setIsNavOpen] = useState(true); // Default open
    const navTimerRef = React.useRef<NodeJS.Timeout | null>(null);

    // AI Execution Drafter State
    const [isDraftingExec, setIsDraftingExec] = useState(false);
    const [showOverwriteModal, setShowOverwriteModal] = useState(false);
    const [isEnriching, setIsEnriching] = useState<EnrichmentMode | null>(null);
    const [_suggestedCapabilities, setSuggestedCapabilities] = useState<string[]>([]);

    const handleEnrichment = async (mode: EnrichmentMode, e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        setIsEnriching(mode);
        try {
            const result = await agenticEnrichment(workshopId, mode, {
                title: data.projectName || "Untitled Opportunity",
                description: data.whyDoIt || "No description provided",
                currentData: data
            });

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const res = result as any;

            if (res.success && res.data) {
                if (mode === 'VALUE_PROP' && res.type === 'json') {
                    const vp = res.data as any; // role, outcome, solution, need
                    const sentence = `As a ${vp.role}, I want to ${vp.outcome}, with ${vp.solution}, so that ${vp.need}.`;
                    setData(prev => ({
                        ...prev,
                        whyDoIt: sentence
                    }));
                    toast.success("CVP Drafted ✨");

                } else if (mode === 'WORKFLOW' && res.type === 'json') {
                    setData(prev => ({ ...prev, workflowPhases: res.data }));
                    toast.success("Workflow Generated ✨");
                } else if (mode === 'EXECUTION' && res.type === 'markdown') {
                    setData(prev => ({ ...prev, executionPlan: res.data }));
                    toast.success("Execution Plan Drafted ✨");
                } else if (mode === 'BUSINESS_CASE' && (res.type === 'markdown' || res.type === 'business_case_full')) {
                    // Always update the business case narrative
                    setData(prev => ({ ...prev, businessCase: res.data }));

                    // If we have structured params, merge non-null values
                    if (res.type === 'business_case_full' && res.params) {
                        const p = res.params as any;
                        setData(prev => ({
                            ...prev,
                            // T-shirt size
                            tShirtSize: p.tShirtSize ?? prev.tShirtSize,
                            // Benefits
                            benefitRevenue: p.benefitRevenue ?? prev.benefitRevenue,
                            benefitCostAvoidance: p.benefitCostAvoidance ?? prev.benefitCostAvoidance,
                            benefitEfficiency: p.benefitEfficiency ?? prev.benefitEfficiency,
                            benefitEstCost: p.benefitEstCost ?? prev.benefitEstCost,
                            // VRCC scores
                            vrcc: {
                                ...prev.vrcc,
                                value: p.scoreValue ?? prev.vrcc.value,
                                riskFinal: p.scoreRisk ?? prev.vrcc.riskFinal,
                                capability: p.scoreCapability ?? prev.vrcc.capability,
                                complexity: p.scoreComplexity ?? prev.vrcc.complexity
                            },
                            // DFV Assessment (nested DFVDimension structure)
                            dfvAssessment: {
                                desirability: {
                                    score: p.dfvDesirability ?? prev.dfvAssessment.desirability.score,
                                    justification: p.dfvDesirabilityNote ?? prev.dfvAssessment.desirability.justification
                                },
                                feasibility: {
                                    score: p.dfvFeasibility ?? prev.dfvAssessment.feasibility.score,
                                    justification: p.dfvFeasibilityNote ?? prev.dfvAssessment.feasibility.justification
                                },
                                viability: {
                                    score: p.dfvViability ?? prev.dfvAssessment.viability.score,
                                    justification: p.dfvViabilityNote ?? prev.dfvAssessment.viability.justification
                                }
                            }
                        }));
                        toast.success("Business Case & Estimates Drafted ✨");
                    } else {
                        toast.success("Business Case Drafted ✨");
                    }
                } else if (mode === 'EXECUTION_PARAMS' && res.type === 'json') {
                    const params = res.data as any;
                    setData(prev => ({
                        ...prev,
                        definitionOfDone: params.definitionOfDone || prev.definitionOfDone,
                        keyDecisions: params.keyDecisions || prev.keyDecisions,
                        changeManagement: params.changeManagement || prev.changeManagement,
                        trainingRequirements: params.trainingRequirements || prev.trainingRequirements,
                        aiOpsRequirements: params.aiOpsRequirements || prev.aiOpsRequirements,
                        systemGuardrails: params.systemGuardrails || prev.systemGuardrails
                    }));
                    toast.success("Execution Parameters Drafted ✨");
                }
            } else {
                toast.error("AI Generation Failed");
            }
        } catch (error) {
            console.error(error);
            toast.error("Enrichment error");
        } finally {
            setIsEnriching(null);
        }
    };

    // --- MAGIC FILL LOGIC ---
    const [magicFillStatus, setMagicFillStatus] = useState({
        valueProp: 'idle' as 'idle' | 'loading' | 'complete',
        workflow: 'idle' as 'idle' | 'loading' | 'complete',
        execution: 'idle' as 'idle' | 'loading' | 'complete',
        businessCase: 'idle' as 'idle' | 'loading' | 'complete'
    });
    const [isMagicFilling, setIsMagicFilling] = useState(false);

    const handleMagicFill = async () => {
        // 1. Validation: Require Title and Friction Statement (User Input)
        if (!data.projectName || !data.frictionStatement) {
            toast.error("Please fill in Title and Friction Statement first.");
            return;
        }

        setIsMagicFilling(true);
        toast.info("Magic Fill Started! Analyzing Opportunity...");

        // Local tracking for sequential data flow since state updates are async
        let currentWhyDoIt = data.whyDoIt;
        let currentWorkflowPhases = [...data.workflowPhases];
        let currentExecutionPlan = data.executionPlan;
        let currentExecutionParams = {
            definitionOfDone: data.definitionOfDone,
            keyDecisions: data.keyDecisions,
            changeManagement: data.changeManagement,
            trainingRequirements: data.trainingRequirements,
            aiOpsRequirements: data.aiOpsRequirements,
            systemGuardrails: data.systemGuardrails
        };

        try {
            // PHASE 0: VALUE PROPOSITION (CVP)
            setMagicFillStatus(prev => ({ ...prev, valueProp: 'loading' }));

            // Safe Mode: Only fill if empty
            if (!currentWhyDoIt || currentWhyDoIt.trim() === '') {
                const cvpResult = await agenticEnrichment(workshopId, 'VALUE_PROP', {
                    title: data.projectName,
                    description: data.frictionStatement, // Use Friction as input
                    currentData: { ...data, notes: data.notes } // Pass notes
                }) as any;

                if (cvpResult.success && cvpResult.data) {
                    // Format the object into the expected string structure for the builder
                    const cvpData = cvpResult.data;
                    const cvpString = `As a ${cvpData.role}, I want to ${cvpData.outcome}, with ${cvpData.solution}, so that ${cvpData.need}.`;

                    currentWhyDoIt = cvpString; // Capture for next steps

                    setData(prev => {
                        if (prev.whyDoIt) return prev; // Safety check again
                        return { ...prev, whyDoIt: cvpString };
                    });
                }
            }
            setMagicFillStatus(prev => ({ ...prev, valueProp: 'complete' }));

            // PHASE 1: WORKFLOW
            setMagicFillStatus(prev => ({ ...prev, workflow: 'loading' }));

            // Safe Mode: Only generate if empty
            if (data.workflowPhases.length === 0) {
                const wfResult = await agenticEnrichment(workshopId, 'WORKFLOW', {
                    title: data.projectName,
                    description: currentWhyDoIt, // Use the detailed CVP
                    currentData: { ...data, whyDoIt: currentWhyDoIt, notes: data.notes } // Ensure context has it
                }) as any;

                if (wfResult.success && wfResult.data) {
                    currentWorkflowPhases = wfResult.data;
                    setData(prev => {
                        if (prev.workflowPhases.length > 0) return prev;
                        return { ...prev, workflowPhases: wfResult.data };
                    });

                    // PHASE 1.5: AUTOMATIC CAPABILITY RECOMMENDATION
                    try {
                        const capsResult = await recommendCapabilities(currentWorkflowPhases);
                        if (capsResult.success && capsResult.data) {
                            setSuggestedCapabilities(capsResult.data);
                        }
                    } catch (e) {
                        console.error("Auto-capability recommendation failed", e);
                    }
                }
            }
            setMagicFillStatus(prev => ({ ...prev, workflow: 'complete' }));

            // PHASE 2: EXECUTION
            setMagicFillStatus(prev => ({ ...prev, execution: 'loading' }));

            // Prepare context with LATEST generated data
            const commonContext = {
                ...data,
                whyDoIt: currentWhyDoIt,
                workflowPhases: currentWorkflowPhases
            };

            const [narrativeResult, execParamsResult] = await Promise.all([
                agenticEnrichment(workshopId, 'EXECUTION', {
                    title: data.projectName,
                    description: currentWhyDoIt,
                    currentData: { ...commonContext, notes: data.notes }
                }),
                agenticEnrichment(workshopId, 'EXECUTION_PARAMS', {
                    title: data.projectName,
                    description: currentWhyDoIt,
                    currentData: { ...commonContext, notes: data.notes }
                })
            ]) as any[];

            setData(prev => {
                let next = { ...prev };
                if (!next.executionPlan && narrativeResult.success) {
                    next.executionPlan = narrativeResult.data;
                    currentExecutionPlan = narrativeResult.data;
                }
                if (execParamsResult.success && execParamsResult.data) {
                    const p = execParamsResult.data;
                    if (!next.definitionOfDone) next.definitionOfDone = p.definitionOfDone;
                    if (!next.keyDecisions) next.keyDecisions = p.keyDecisions;
                    if (!next.changeManagement) next.changeManagement = p.changeManagement;
                    if (!next.trainingRequirements) next.trainingRequirements = p.trainingRequirements;
                    if (!next.aiOpsRequirements) next.aiOpsRequirements = p.aiOpsRequirements;
                    if (!next.systemGuardrails) next.systemGuardrails = p.systemGuardrails;

                    // Update local tracking
                    currentExecutionParams = { ...p };
                }
                return next;
            });
            setMagicFillStatus(prev => ({ ...prev, execution: 'complete' }));

            // PHASE 3: BUSINESS CASE
            setMagicFillStatus(prev => ({ ...prev, businessCase: 'loading' }));

            // CRITICAL: Pass the FULLY populated local context so Business Case agent sees the T-Shirt inputs (workflow complexity, execution risks)
            const businessCaseContext = {
                ...commonContext,
                executionPlan: currentExecutionPlan,
                ...currentExecutionParams
            };

            const bcResult = await agenticEnrichment(workshopId, 'BUSINESS_CASE', {
                title: data.projectName,
                description: currentWhyDoIt,
                currentData: { ...businessCaseContext, notes: data.notes }
            }) as any;

            if (bcResult.success && bcResult.data) {
                setData(prev => {
                    let next = { ...prev };
                    if (!next.businessCase) {
                        next.businessCase = bcResult.data;
                    }
                    if (bcResult.params) {
                        const p = bcResult.params;
                        // Always override if we have AI suggestions and the field is empty/default
                        if (!next.tShirtSize) next.tShirtSize = p.tShirtSize;

                        // For numbers, we check undefined because 0 is a valid number, but undefined means "active user hasn't touched it"
                        if (next.benefitRevenue === undefined) next.benefitRevenue = p.benefitRevenue;
                        if (next.benefitCostAvoidance === undefined) next.benefitCostAvoidance = p.benefitCostAvoidance;
                        if (next.benefitEfficiency === undefined) next.benefitEfficiency = p.benefitEfficiency;
                        if (next.benefitEstCost === undefined) next.benefitEstCost = p.benefitEstCost;

                        // For sliders (initial value is often 3/defaults), we might want to overwrite if the user hasn't explicitly set them.
                        // But since we can't track "touched" easily here, let's just update them. The user can adjust after.
                        next.vrcc = {
                            ...next.vrcc,
                            value: p.scoreValue ?? next.vrcc.value,
                            riskFinal: p.scoreRisk ?? next.vrcc.riskFinal,
                            capability: p.scoreCapability ?? next.vrcc.capability,
                            complexity: p.scoreComplexity ?? next.vrcc.complexity
                        };

                        next.dfvAssessment = {
                            desirability: {
                                score: p.dfvDesirability ?? next.dfvAssessment.desirability.score,
                                justification: p.dfvDesirabilityNote ?? next.dfvAssessment.desirability.justification
                            },
                            feasibility: {
                                score: p.dfvFeasibility ?? next.dfvAssessment.feasibility.score,
                                justification: p.dfvFeasibilityNote ?? next.dfvAssessment.feasibility.justification
                            },
                            viability: {
                                score: p.dfvViability ?? next.dfvAssessment.viability.score,
                                justification: p.dfvViabilityNote ?? next.dfvAssessment.viability.justification
                            }
                        };
                    }
                    return next;
                });
            }
            setMagicFillStatus(prev => ({ ...prev, businessCase: 'complete' }));
            toast.success("Magic Fill Complete! 🚀");

        } catch (error) {
            console.error("Magic Fill Error", error);
            toast.error("Something went wrong during Magic Fill");
        } finally {
            setIsMagicFilling(false);
            setTimeout(() => {
                setMagicFillStatus({ valueProp: 'idle', workflow: 'idle', execution: 'idle', businessCase: 'idle' });
            }, 3000);
        }
    };

    const handleSmartSelect = (opp: { id: string }) => {
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
                    description: opp.description, // [NEW] Description
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
            // setGlobalCompleteness(avgCompleteness); // Unused

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
    // NOTE: Autosave ONLY runs for EXISTING opportunities (has ID)
    // NEW opportunities are created exclusively via blur/Enter handler
    useEffect(() => {
        // Skip autosave if this is a new opportunity (no ID yet)
        // Creation is handled by blur handler to avoid race conditions
        if (!opportunityIdRef.current) {
            return;
        }

        const timer = setTimeout(async () => {
            if (data.projectName) {
                await performSave(data);
            }
        }, 1500);

        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data]);

    const performSave = async (currentData: OpportunityState) => {
        // Guard: Prevent concurrent saves (blur + autosave race condition)
        if (isSavingRef.current) {
            console.log('[AutoSave] Skipped - save already in progress');
            return;
        }

        // Read current opportunityId from REF (not stale closure state)
        const currentOpportunityId = opportunityIdRef.current;

        isSavingRef.current = true;
        setSaveStatus('saving');
        try {
            // Format data for DB (join strategicHorizon)
            const payload = {
                ...currentData,
                strategicHorizon: currentData.strategicHorizon.join(',')
            };

            // Call server action with current opportunityId (if any)
            const result = await saveOpportunity(workshopId, payload, currentOpportunityId);

            if (result.success) {
                // If we didn't have an ID, we do now.
                if (!currentOpportunityId) {
                    setOpportunityId(result.id);
                    opportunityIdRef.current = result.id; // Update ref immediately too
                }
                setSaveStatus('saved');
                fetchOpportunities(); // Refresh list to match
            } else {
                // Silently ignore validation errors during autosave (expected while typing)
                // Only show error for actual save failures (network/database errors)
                if (result.error && result.error.includes('Validation failed')) {
                    setSaveStatus('idle'); // Don't show error for validation failures
                } else {
                    setSaveStatus('error'); // Show error for actual save failures
                }
            }
        } catch (e) {
            console.error("Autosave failed", e);
            setSaveStatus('error');
        } finally {
            isSavingRef.current = false;
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
                description: selected.description || '', // [NEW] Description
                notes: selected.notes || '', // [NEW] Facilitator Notes
                frictionStatement: selected.frictionStatement || '',
                strategicHorizon: selected.strategicHorizon ? selected.strategicHorizon.split(',').map((s: string) => s.trim()) : [],
                whyDoIt: selected.whyDoIt || '',
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
                benefitTimeframe: selected.benefitTimeframe || 'Annually',
                benefitRevenue: selected.benefitRevenue || 0,
                benefitCostAvoidance: selected.benefitCostAvoidance || 0,
                benefitEfficiency: selected.benefitEfficiency || 0,
                benefitEstCost: selected.benefitEstCost || 0,
                // New Fields
                techAlignment: selected.techAlignment || '',
                strategyAlignment: selected.strategyAlignment || '',
                businessCase: selected.businessCase || '',
                executionPlan: selected.executionPlan || '',
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

        // Check if this opportunity exists in Ideation (has a home to go back to)
        const hasIdeationOrigin = opportunityToDelete.showInIdeation === true;

        try {
            if (hasIdeationOrigin) {
                // DEMOTE: Remove from Capture but keep in Ideation
                await demoteFromCapture({
                    workshopId,
                    opportunityIds: [opportunityToDelete.id]
                });
                toast.success(`"${opportunityToDelete.projectName}" returned to Ideation`);
            } else {
                // DELETE: Permanently remove (Capture-only item)
                await deleteOpportunity({ opportunityId: opportunityToDelete.id, workshopId });
                toast.success(`"${opportunityToDelete.projectName}" deleted`);
            }

            // Refresh list
            const updatedList = allOpportunities.filter(o => o.id !== opportunityToDelete.id);
            setAllOpportunities(updatedList);

            // If currently selected, reset
            if (opportunityId === opportunityToDelete.id) {
                handleAddOpportunity();
            }
            setOpportunityToDelete(null);
        } catch (error) {
            console.error("Action failed", error);
            toast.error("Failed to process opportunity");
        } finally {
            setIsDeletingOpportunity(false);
        }
    };

    // -- App Handlers --


    const handleInputChange = (field: keyof OpportunityState, value: unknown) => {
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

    const handleDragEnd = (event: DragEndEvent) => {
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

    const updatePhase = (id: string, field: keyof WorkflowPhase, val: unknown) => {
        setSaveStatus('idle');
        setData(prev => ({
            ...prev,
            workflowPhases: prev.workflowPhases.map(p => p.id === id ? { ...p, [field]: val } : p)
        }));
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


    // --- AI Execution Handler ---
    // 1. Trigger
    const handleRecommendClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const hasContent =
            data.definitionOfDone || data.keyDecisions ||
            data.changeManagement || data.trainingRequirements ||
            data.aiOpsRequirements || data.systemGuardrails;

        if (hasContent) {
            setShowOverwriteModal(true);
        } else {
            executeDraft();
        }
    };

    // 2. Execution
    const executeDraft = async () => {
        setShowOverwriteModal(false);
        setIsDraftingExec(true);
        try {
            const res = await draftExecutionPlan({
                name: data.projectName,
                friction: data.frictionStatement,
                strategy: data.strategicHorizon.join(', '),
                size: data.tShirtSize,
                revenue: data.benefitRevenue,
                costAvoidance: data.benefitCostAvoidance,
                phases: data.workflowPhases
            });

            if (res.success && res.data) {
                // A. FORMATTING FIX: Ensure bullet points have breathing room
                const formattedData = Object.entries(res.data).reduce((acc: Partial<OpportunityState>, [key, val]) => {
                    if (typeof val === 'string') {
                        // Replace "• " with "\n• " to create vertical space, trimming start to avoid huge top gaps
                        // @ts-expect-error - Dynamic key assignment
                        acc[key] = val.replace(/•/g, '\n•').replace(/^\n/, '');
                    } else {
                        // @ts-expect-error - Dynamic key assignment
                        acc[key] = val;
                    }
                    return acc;
                }, {});

                // B. UPDATE LOCAL STATE (Visual)
                // We use a functional update to be safe, but we also need the object for saving.
                // Since 'data' is in closure, we merge it for the save payload.
                const updatedOpp = { ...data, ...formattedData };

                setData(prev => ({
                    ...prev,
                    ...formattedData
                }));

                // C. PERSISTENCE FIX: Save to Database Immediately
                await performSave(updatedOpp);
            }
        } catch (error) {
            console.error(error);
            alert("AI Draft failed. Please try again.");
        } finally {
            setIsDraftingExec(false);
        }
    };



    return (
        <div className="min-h-screen bg-background text-foreground font-sans flex flex-col relative">

            {/* Confirmation Modal (Opportunity) - Conditional Demote vs Delete */}
            <ConfirmModal
                isOpen={!!opportunityToDelete}
                title={opportunityToDelete?.showInIdeation
                    ? "Remove from Capture?"
                    : "Delete Opportunity?"}
                description={opportunityToDelete?.showInIdeation
                    ? `"${opportunityToDelete?.projectName || 'this item'}" will be removed from Capture but will remain available in Ideation.`
                    : `Are you sure you want to permanently delete "${opportunityToDelete?.projectName || 'this item'}"? This action cannot be undone.`}
                onClose={() => setOpportunityToDelete(null)}
                onConfirm={confirmDeleteOpportunity}
                isLoading={isDeletingOpportunity}
                variant={opportunityToDelete?.showInIdeation ? 'demote' : 'danger'}
                confirmLabel={opportunityToDelete?.showInIdeation
                    ? 'Yes, Remove from Capture'
                    : 'Yes, Delete Permanently'}
            />

            <ConfirmModal
                isOpen={showOverwriteModal}
                variant="warning"
                title="Overwrite Execution Plan?"
                description="You have already entered content in the Execution Strategy fields. Using AI Recommendation will overwrite your current notes with a new draft. This action cannot be undone."
                confirmLabel="Yes, Overwrite"
                onClose={() => setShowOverwriteModal(false)}
                onConfirm={executeDraft}
                isLoading={isDraftingExec}
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
                            <p className="text-secondary mb-6">Are you sure you want to delete this phase? This action cannot be undone.</p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setDeleteModalId(null)}
                                    className="px-4 py-2 rounded text-secondary hover:bg-surface-subtle font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDeletePhase}
                                    className="px-4 py-2 rounded text-sm font-bold bg-status-risk text-white hover:bg-destructive"
                                >
                                    Delete
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- HEADER SECTION --- */}
            <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border px-8 py-5 flex justify-between items-center sticky top-0 z-30">
                <div className="flex items-baseline gap-3">
                    {/* DYNAMIC TITLE */}
                    <h1 className="flex items-baseline gap-3">
                        {data.projectName ? (
                            <span className="text-2xl font-black text-foreground tracking-tight animate-in fade-in">
                                {data.projectName}
                            </span>
                        ) : (
                            <span className="text-2xl font-black text-muted-foreground/50 tracking-tight italic">
                                New Opportunity
                            </span>
                        )}
                    </h1>
                </div>

                <div className="flex items-center gap-4">
                    {/* Autosave Indicator */}
                    <div className="text-xs font-medium text-muted-foreground w-20 text-right">
                        {saveStatus === 'saving' && <span className="animate-pulse">Saving...</span>}
                        {saveStatus === 'saved' && <span className="text-status-safe">Saved</span>}
                        {saveStatus === 'error' && <span className="text-status-risk">Error</span>}
                    </div>

                    {/* Completeness Ring */}
                    <div className={`h-9 w-9 rounded-full border-4 flex items-center justify-center transition-all duration-300 ${isComplete || isGlobalReady
                        ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-200'
                        : 'bg-transparent border-input text-success'
                        }`}>
                        {isComplete || isGlobalReady ? (
                            <Check className="w-5 h-5 text-white" strokeWidth={3} />
                        ) : (
                            <span className="text-xs font-bold">
                                {Math.round(isGlobalReady ? 100 : completeness)}%
                            </span>
                        )}
                    </div>
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
                <div className="bg-background/50 backdrop-blur-xl border border-border rounded-2xl shadow-xl p-8 flex flex-col h-full">
                    {/* Tabs Header */}
                    <div className="flex space-x-6 border-b border-border mb-6 pb-2">
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
                                    className={`pb-2 text-xs font-bold tracking-widest transition-colors relative flex items-center gap-2 ${activeTab === tab.id ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    {tab.id === 'A' && magicFillStatus.valueProp === 'loading' && <Spinner size="sm" className="text-intelligence" />}
                                    {tab.id === 'B' && magicFillStatus.workflow === 'loading' && <Spinner size="sm" className="text-intelligence" />}
                                    {tab.id === 'C' && magicFillStatus.execution === 'loading' && <Spinner size="sm" className="text-intelligence" />}
                                    {tab.id === 'D' && magicFillStatus.businessCase === 'loading' && <Spinner size="sm" className="text-intelligence" />}

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
                                        {/* Magic Fill Banner */}
                                        <div className="flex justify-between items-center bg-primary/10 p-4 rounded-xl border border-primary/20 mb-2">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                                                    <Sparkles size={16} className="animate-pulse" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-foreground">Magic Fill</div>
                                                    <div className="text-xs text-muted-foreground font-medium">Auto-generate Value Prop, Workflow, Execution, and Value Case from your description.</div>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ai"
                                                size="sm"
                                                onClick={handleMagicFill}
                                                disabled={isMagicFilling}
                                                className="gap-2 text-xs font-bold"
                                            >
                                                {isMagicFilling ? <Spinner size="sm" /> : <Sparkles className="w-3 h-3" />}
                                                {isMagicFilling ? "Analysing..." : "Start Magic Fill"}
                                            </Button>
                                        </div>

                                        <div>
                                            <label htmlFor="projectName" className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Opportunity Name</label>
                                            <input
                                                id="projectName"
                                                name="projectName"
                                                type="text"
                                                value={data.projectName}
                                                onChange={(e) => handleInputChange('projectName', e.target.value)}
                                                onBlur={() => {
                                                    // Auto-create on blur if new opportunity with 3+ char name
                                                    // Use ref (not state) to get current value
                                                    if (!opportunityIdRef.current && data.projectName.trim().length >= 3) {
                                                        performSave(data);
                                                    }
                                                }}
                                                onKeyDown={(e) => {
                                                    // Also create on Enter key for keyboard users
                                                    if (e.key === 'Enter' && !opportunityIdRef.current && data.projectName.trim().length >= 3) {
                                                        e.preventDefault();
                                                        performSave(data);
                                                    }
                                                }}
                                                className="w-full bg-input border border-input rounded-lg p-3 focus:ring-2 focus:ring-inset focus:ring-ring outline-none transition-all"
                                                placeholder="e.g. Invoice Reconciliation Bot"
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="frictionStatement" className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Friction / Problem</label>
                                            <SmartTextarea
                                                id="frictionStatement"
                                                name="frictionStatement"
                                                value={data.frictionStatement}
                                                onValueChange={(val) => handleInputChange('frictionStatement', val)}
                                                markdown
                                                placeholder="What is the problem?"
                                                minHeight="6rem"
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="description" className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Proposed Solution</label>
                                            <SmartTextarea
                                                id="description"
                                                name="description"
                                                value={data.description}
                                                onValueChange={(val) => handleInputChange('description', val)}
                                                markdown
                                                className="min-h-[100px]"
                                                placeholder="Describe the proposed solution..."
                                                minHeight="100px"
                                            />
                                        </div>

                                        {/* AI Analysis Fields */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                                                    Strategy Alignment
                                                </label>
                                                <SmartTextarea
                                                    value={data.strategyAlignment || ''}
                                                    onValueChange={(val) => handleInputChange('strategyAlignment', val)}
                                                    markdown
                                                    placeholder="Strategic relevance..."
                                                    minHeight="6rem"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                                                    Tech Alignment
                                                </label>
                                                <SmartTextarea
                                                    value={data.techAlignment || ''}
                                                    onValueChange={(val) => handleInputChange('techAlignment', val)}
                                                    markdown
                                                    placeholder="Technical fit..."
                                                    minHeight="6rem"
                                                />
                                            </div>
                                        </div>


                                        <div className="mb-6">
                                            <h3 id="strategic-horizon-label" className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Strategic Horizon</h3>
                                            <div role="group" aria-labelledby="strategic-horizon-label" className="flex gap-2 flex-wrap">
                                                {HORIZONS.map((h) => (
                                                    <button
                                                        key={h.id}
                                                        onClick={() => toggleHorizon(h.id)}
                                                        className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${data.strategicHorizon.includes(h.id)
                                                            ? `${h.color} border-transparent shadow-md`
                                                            : 'bg-muted border-border text-muted-foreground hover:border-ring/50'}`}
                                                    >
                                                        {h.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            {/* Header with Magic Button for CVP */}
                                            <div className="flex justify-between items-end mb-2">
                                                <h3 id="cvp-label" className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                                    Customer Value Proposition
                                                </h3>
                                                <Button
                                                    variant="ai"
                                                    size="sm"
                                                    onClick={(e: React.MouseEvent) => handleEnrichment('VALUE_PROP', e)}
                                                    disabled={isEnriching === 'VALUE_PROP'}
                                                    className="gap-2 text-xs font-bold"
                                                >
                                                    {isEnriching === 'VALUE_PROP' ? <Spinner size="sm" /> : <Sparkles size={12} />}
                                                    {isEnriching === 'VALUE_PROP' ? "Drafting..." : "Generate CVP"}
                                                </Button>
                                            </div>

                                            <div role="group" aria-labelledby="cvp-label">
                                                <ValuePropBuilder
                                                    value={data.whyDoIt}
                                                    onChange={(val) => handleInputChange('whyDoIt', val)}
                                                />
                                            </div>

                                            {/* Context & Notes */}
                                            <div className="pt-4 border-t border-border/50 mt-4">
                                                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                                                    Context & Notes
                                                </label>
                                                <SmartTextarea
                                                    value={data.notes || ''}
                                                    onValueChange={(val) => handleInputChange('notes', val)}
                                                    markdown
                                                    placeholder="Add facilitator notes, context, or key constraints..."
                                                    minHeight="6rem"
                                                />
                                            </div>
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
                                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                                Workflow Definition (Phase Cards)
                                            </h3>

                                            <div className="flex items-center gap-2">
                                                {/* Magic Workflow Button */}
                                                <button
                                                    onClick={(e) => handleEnrichment('WORKFLOW', e)}
                                                    disabled={isEnriching === 'WORKFLOW'}
                                                    className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-full shadow-md hover:shadow-lg hover:bg-primary/90 transition-all disabled:opacity-50"
                                                >
                                                    {isEnriching === 'WORKFLOW' ? <Spinner size="sm" /> : <Sparkles size={12} />}
                                                    Suggest Workflow
                                                </button>

                                                {/* VIEW TOGGLE (Replaces old Add Button) */}
                                                <button
                                                    onClick={() => setIsZoomedOut(!isZoomedOut)}
                                                    className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors bg-muted/50 hover:bg-muted px-3 py-1.5 rounded border border-input"
                                                >
                                                    {isZoomedOut ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
                                                    {isZoomedOut ? "Zoom In (Detail)" : "Zoom Out (Overview)"}
                                                </button>
                                            </div>
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
                                                    items={data.workflowPhases.map((p) => p.id)}
                                                    strategy={horizontalListSortingStrategy}
                                                >
                                                    {data.workflowPhases.map((phase) => (
                                                        <SortablePhaseCard key={phase.id} id={phase.id}>
                                                            <div
                                                                onClick={() => {
                                                                    if (isZoomedOut) setIsZoomedOut(false);
                                                                }}
                                                                // STYLING: Semantic "Post-it" / Card Style (Theme Dependent)
                                                                className={`bg-card-phase border border-card-phase-border rounded-md shadow-md flex flex-col gap-3 group hover:rotate-1 hover:scale-[1.01] transition-all duration-300 origin-top cursor-grab active:cursor-grabbing select-none text-card-foreground
                                                                    ${isZoomedOut
                                                                        ? 'w-[150px] h-[150px] p-3 justify-center items-center text-center cursor-pointer hover:shadow-lg hover:border-primary/50' // OVERVIEW STYLE
                                                                        : 'w-[320px] p-4' // DETAIL STYLE
                                                                    }`}
                                                            >

                                                                {/* HEADER (Title) */}
                                                                <div className={`w-full ${isZoomedOut ? 'flex items-center justify-center h-full' : 'border-b border-primary/10 pb-2 mb-1 flex justify-between items-start'}`}>
                                                                    {isZoomedOut ? (
                                                                        <div className="font-kalam font-bold text-card-foreground text-sm leading-tight line-clamp-4 select-none">
                                                                            {phase.name || "Untitled Phase"}
                                                                        </div>
                                                                    ) : (
                                                                        <>
                                                                            <TitleTextarea
                                                                                value={phase.name}
                                                                                onChange={(val) => updatePhase(phase.id, 'name', val)}
                                                                                className="font-bold text-card-foreground text-lg bg-transparent border-none focus:ring-0 outline-none w-full placeholder-muted-foreground/50 resize-none overflow-hidden"
                                                                                placeholder="Phase Name..."
                                                                            />
                                                                            <button
                                                                                onPointerDown={(e) => e.stopPropagation()}
                                                                                onClick={() => requestDeletePhase(phase.id)}
                                                                                className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
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
                                                                        id={`phase-inputs-${phase.id}`}
                                                                        name={`phase-inputs-${phase.id}`}
                                                                        value={phase.inputs || ''}
                                                                        onValueChange={(val) => updatePhase(phase.id, 'inputs', val)}
                                                                        placeholder="• List items..."
                                                                    />
                                                                    <SmartTextarea
                                                                        label="Actions Taken"
                                                                        id={`phase-actions-${phase.id}`}
                                                                        name={`phase-actions-${phase.id}`}
                                                                        value={phase.actions || ''}
                                                                        onValueChange={(val) => updatePhase(phase.id, 'actions', val)}
                                                                        placeholder="• List items..."
                                                                    />
                                                                    <SmartTextarea
                                                                        label="Artifact / Output"
                                                                        id={`phase-outputs-${phase.id}`}
                                                                        name={`phase-outputs-${phase.id}`}
                                                                        value={phase.outputs || ''}
                                                                        onValueChange={(val) => updatePhase(phase.id, 'outputs', val)}
                                                                        placeholder="• List items..."
                                                                    />

                                                                    {/* Autonomy Footer */}
                                                                    <div className="pt-3 mt-auto" onPointerDown={(e) => e.stopPropagation()}>
                                                                        <div className="flex flex-col gap-2">
                                                                            <div className="flex gap-1 justify-between bg-muted/50 p-1 rounded-full">
                                                                                {['L1', 'L2', 'L3', 'L4', 'L5'].map((level) => (
                                                                                    <button
                                                                                        key={level}
                                                                                        onClick={() => updatePhase(phase.id, 'autonomy', level as WorkflowPhase['autonomy'])}
                                                                                        className={`w-8 h-6 flex items-center justify-center text-[9px] font-bold rounded-full transition-all ${phase.autonomy === level
                                                                                            ? 'bg-primary text-primary-foreground shadow-sm scale-110'
                                                                                            : 'text-muted-foreground hover:bg-muted'
                                                                                            }`}
                                                                                    >
                                                                                        {level}
                                                                                    </button>
                                                                                ))}
                                                                            </div>
                                                                            <div className="text-xs text-center text-muted-foreground font-medium h-4">
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
                                                className={`shrink-0 rounded-lg border-2 border-dashed border-input hover:border-primary/50 bg-muted/30 hover:bg-muted/50 flex flex-col items-center justify-center gap-3 text-muted-foreground hover:text-primary transition-all group
                                                    ${isZoomedOut
                                                        ? 'w-[150px] h-[150px]' // Small Square
                                                        : 'w-[320px] h-[420px]' // Full Size
                                                    }`}
                                            >
                                                <div className="w-12 h-12 rounded-full bg-card border border-input group-hover:border-primary/50 flex items-center justify-center shadow-sm">
                                                    <Plus size={24} />
                                                </div>
                                                <span className="font-semibold text-sm">{isZoomedOut ? "Add" : "Add Next Phase"}</span>
                                            </button>

                                        </div>
                                    </div>

                                    {/* --- CAPABILITY MANAGER --- */}
                                    <div className="mt-8 pt-8 border-t border-border">
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
                                        {/* Systems & Capabilities Sync - REMOVED (Duplicate of Tab B) */}


                                        {/* 3x2 Grid with AI Header */}
                                        <div className="space-y-6">

                                            {/* Header with Recommend Button */}
                                            <div className="flex justify-between items-end border-b border-input pb-4">
                                                <div>
                                                    <h2 className="text-lg font-bold text-foreground">Execution Strategy</h2>
                                                    <p className="text-sm text-muted-foreground">Define how this solution will be built, governed, and adopted.</p>
                                                </div>

                                                {/* AI Button */}
                                                <button
                                                    onClick={(e) => handleEnrichment('EXECUTION', e)}
                                                    disabled={isEnriching === 'EXECUTION'}
                                                    className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-full shadow-md hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {isEnriching === 'EXECUTION' ? <Spinner size="sm" /> : <Sparkles size={12} />}
                                                    {isEnriching === 'EXECUTION' ? "Drafting..." : "Draft Execution Plan"}
                                                </button>
                                            </div>

                                            {/* Execution Plan Narrative */}
                                            <div className="bg-muted/30 p-4 rounded-xl border border-input">
                                                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Execution Plan (Narrative)</h3>
                                                <SmartTextarea
                                                    id="executionPlan"
                                                    name="executionPlan"
                                                    value={data.executionPlan || ''}
                                                    onValueChange={(val) => handleInputChange('executionPlan', val)}
                                                    markdown
                                                    placeholder="Use AI to draft a plan or write your own..."
                                                    minHeight="12rem"
                                                />
                                            </div>

                                            {/* Execution Parameters Header with AI Button */}
                                            <div className="flex justify-between items-end border-b border-input pb-4 mt-6">
                                                <div>
                                                    <h3 className="text-md font-bold text-foreground">Execution Parameters</h3>
                                                    <p className="text-xs text-muted-foreground">Define success criteria, decisions, and operational requirements.</p>
                                                </div>
                                                <button
                                                    onClick={(e) => handleEnrichment('EXECUTION_PARAMS', e)}
                                                    disabled={isEnriching === 'EXECUTION_PARAMS'}
                                                    className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-full shadow-md hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {isEnriching === 'EXECUTION_PARAMS' ? <Spinner size="sm" /> : <Sparkles size={12} />}
                                                    {isEnriching === 'EXECUTION_PARAMS' ? "Drafting..." : "Draft Execution Parameters"}
                                                </button>
                                            </div>

                                            {/* The 6-Box Grid */}
                                            <div className="grid grid-cols-2 gap-6">
                                                {[
                                                    { label: 'Success Metrics / Definition of Done', field: 'definitionOfDone', placeholder: '• 90% Accuracy...' },
                                                    { label: 'Key Decisions (Build vs Buy)', field: 'keyDecisions', placeholder: '• Use open source model...' },
                                                    { label: 'Change Management', field: 'changeManagement', placeholder: '• Update SOPs...' },
                                                    { label: 'Training Requirements', field: 'trainingRequirements', placeholder: '• Workshop for underwriters...' },
                                                    { label: 'AI Ops / Infrastructure', field: 'aiOpsRequirements', placeholder: '• GPU Instances...' },
                                                    { label: 'System Guardrails', field: 'systemGuardrails', placeholder: '• Human review for >$1M...' },
                                                ].map((item) => (
                                                    <div key={item.field} className="p-4 bg-muted/30 rounded-xl border border-input hover:border-primary/50 transition-colors focus-within:ring-2 focus-within:ring-ring/20 h-full min-h-[160px]">
                                                        <SmartTextarea
                                                            label={item.label}
                                                            id={item.field}
                                                            name={item.field}
                                                            value={data[item.field as keyof OpportunityState] as string || ''}
                                                            onValueChange={(val) => handleInputChange(item.field as keyof OpportunityState, val)}
                                                            bulletList="manual"
                                                            placeholder={item.placeholder}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'D' && (
                                <motion.div key="D" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }}>
                                    <div className="space-y-6">

                                        {/* Header with Magic Button for Business Case */}
                                        <div className="flex justify-between items-end border-b border-input pb-2">
                                            <h3 className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">Business Case & Value</h3>
                                            <button
                                                onClick={(e) => handleEnrichment('BUSINESS_CASE', e)}
                                                disabled={isEnriching === 'BUSINESS_CASE'}
                                                className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-full shadow-md hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50"
                                            >
                                                {isEnriching === 'BUSINESS_CASE' ? <Spinner size="sm" /> : <Sparkles size={12} />}
                                                {isEnriching === 'BUSINESS_CASE' ? "Authoring..." : "Draft Business Case"}
                                            </button>
                                        </div>

                                        {/* Business Case Narrative */}
                                        <div className="bg-muted/30 p-4 rounded-xl border border-input">
                                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Business Case Narrative</h3>
                                            <SmartTextarea
                                                id="businessCase"
                                                name="businessCase"
                                                value={data.businessCase || ''}
                                                onValueChange={(val) => handleInputChange('businessCase', val)}
                                                markdown
                                                placeholder="Executive Summary, ROI, and Strategic Value..."
                                                minHeight="12rem"
                                            />
                                        </div>

                                        {/* 2-Column Grid: T-Shirt Size | Estimated Benefit */}
                                        <div className="grid grid-cols-2 gap-8 mb-6">
                                            {/* Left Column: T-Shirt Size */}
                                            {/* --- T-SHIRT SIZE SELECTOR (Clean, Centered, Scaled) --- */}
                                            <div className="flex flex-col h-full min-h-[160px]">
                                                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">
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
                                                                            className={isSelected ? 'text-primary' : 'text-muted-foreground'}
                                                                            width={iconSize}
                                                                            height={iconSize}
                                                                        >
                                                                            <path d="M20.38 3.55a.8.8 0 0 0-.46-.17h-.06l-4.5.56a6.23 6.23 0 0 1-6.72 0l-4.5-.56h-.06a.8.8 0 0 0-.46.17L.55 6.27a.8.8 0 0 0-.21 1l2.4 4.8a.8.8 0 0 0 1.25.17l1-1V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8.73l1 1a.8.8 0 0 0 1.25-.17l2.4-4.8a.8.8 0 0 0-.21-1z" />
                                                                        </svg>
                                                                    </div>

                                                                    {/* Label */}
                                                                    <span className={`text-xs font-bold uppercase tracking-wider ${isSelected ? 'text-primary' : 'text-muted-foreground/60 group-hover:text-muted-foreground'}`}>
                                                                        {size}
                                                                    </span>

                                                                    {/* Active Dot (Subtle Indicator) */}
                                                                    <div className={`w-1.5 h-1.5 rounded-full mt-1 transition-colors ${isSelected ? 'bg-primary' : 'bg-transparent'}`} />
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right Column: Estimated Benefit */}
                                            <div>
                                                <h3 className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Estimated Benefit</h3>

                                                {/* Timeframe Toggle */}
                                                <div className="flex gap-1 mb-4 bg-muted/50 rounded-full p-1 w-fit">
                                                    {['Monthly', 'Annually'].map((tf) => (
                                                        <button
                                                            key={tf}
                                                            onClick={() => handleInputChange('benefitTimeframe', tf)}
                                                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${data.benefitTimeframe === tf
                                                                ? 'bg-primary text-primary-foreground shadow-md'
                                                                : 'text-muted-foreground hover:text-foreground'
                                                                }`}
                                                        >
                                                            {tf}
                                                        </button>
                                                    ))}
                                                </div>

                                                {/* Stacked Benefit Inputs */}
                                                <div className="space-y-3">
                                                    <div>
                                                        <label htmlFor="benefitRevenue" className="block text-xs uppercase font-bold text-muted-foreground mb-1">Rev. Uplift ($)</label>
                                                        <CurrencyInput
                                                            id="benefitRevenue"
                                                            name="benefitRevenue"
                                                            value={data.benefitRevenue}
                                                            onChange={(val) => handleInputChange('benefitRevenue', val)}
                                                            className="w-full bg-input border border-input rounded p-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                                                            placeholder="0"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label htmlFor="benefitCostAvoidance" className="block text-xs uppercase font-bold text-muted-foreground mb-1">Cost Avoid. ($)</label>
                                                        <CurrencyInput
                                                            id="benefitCostAvoidance"
                                                            name="benefitCostAvoidance"
                                                            value={data.benefitCostAvoidance}
                                                            onChange={(val) => handleInputChange('benefitCostAvoidance', val)}
                                                            className="w-full bg-input border border-input rounded p-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                                                            placeholder="0"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label htmlFor="benefitEfficiency" className="block text-xs uppercase font-bold text-muted-foreground mb-1">Hrs Saved</label>
                                                        <CurrencyInput
                                                            id="benefitEfficiency"
                                                            name="benefitEfficiency"
                                                            value={data.benefitEfficiency}
                                                            onChange={(val) => handleInputChange('benefitEfficiency', val)}
                                                            prefix=""
                                                            suffix="hrs"
                                                            className="w-full bg-input border border-input rounded p-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                                                            placeholder="0"
                                                        />
                                                    </div>
                                                    <div className="pt-2 border-t border-input mt-2">
                                                        <label htmlFor="benefitEstCost" className="block text-xs uppercase font-bold text-muted-foreground mb-1">Est. Implementation Cost ($)</label>
                                                        <CurrencyInput
                                                            id="benefitEstCost"
                                                            name="benefitEstCost"
                                                            value={data.benefitEstCost}
                                                            onChange={(val) => handleInputChange('benefitEstCost', val)}
                                                            className="w-full bg-input border border-input rounded p-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                                                            placeholder="One-time cost..."
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* VRCC Sliders - UNCHANGED */}
                                        <div className="space-y-2">
                                            <h3 className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">VRCC Scores</h3>
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

            </main >
        </div >
    );
}
