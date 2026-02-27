'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import {
    SCORING_DIMENSIONS,
    calculateAverageScore,
    getTierFromScore,
    getAllQuestionIds,
    LENS_DEFINITIONS
} from '@/lib/scoring-constants';
import { X, Check, Brain, Sparkles, Wand2, Info, Zap, AlertTriangle, Infinity, RefreshCw, Split } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { SpeedometerGauge } from '../workshop/SpeedometerGauge';
import { motion, AnimatePresence } from 'framer-motion';

// --- TYPES ---
interface Suggestion {
    id: string;
    targetField: 'title' | 'description' | 'friction' | 'techStack';
    draftText: string;
    rationale: string;
    lensId: string | 'general';
    type: 'ai'; // Removed 'human' type
}

interface IdeaFocusViewProps {
    item: any;
    onClose: () => void;
    onUpdate: (id: string, updates: Partial<any>) => void;
    initialLens?: string;
}

// --- CONSTANTS ---
const STEP_STYLES = {
    left: { active: 'bg-muted text-foreground border-border shadow-sm', inactive: 'text-muted-foreground hover:text-foreground' },
    mid: { active: 'bg-info/10 text-info border-info shadow-sm', inactive: 'text-muted-foreground hover:text-foreground' },
    right: { active: 'bg-warning/10 text-warning border-warning shadow-sm', inactive: 'text-muted-foreground hover:text-foreground' }
};

const GENERAL_SUGGESTION_ID = 'general_improvements';

// --- SUB-COMPONENTS ---
function ThreeStepPicker({ value, onChange, question }: any) {
    const steps = [
        { value: 0, label: question.left, explainer: question.leftExplainer, styleKey: 'left' as const },
        { value: 50, label: question.mid, explainer: question.midExplainer, styleKey: 'mid' as const },
        { value: 100, label: question.right, explainer: question.rightExplainer, styleKey: 'right' as const }
    ];
    const activeIndex = value <= 25 ? 0 : value <= 75 ? 1 : 2;

    return (
        <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">{question.label}</p>
            <div className="flex items-center gap-1 bg-muted/50 rounded-full p-1">
                {steps.map((step, idx) => (
                    <button
                        key={step.value}
                        onClick={() => onChange(step.value)}
                        className={cn(
                            "flex-1 py-2 px-3 rounded-full text-xs font-bold transition-all duration-200",
                            activeIndex === idx ? STEP_STYLES[step.styleKey].active : STEP_STYLES[step.styleKey].inactive
                        )}
                    >
                        {step.label}
                    </button>
                ))}
            </div>
            <p className="text-xs text-muted-foreground italic pl-1 min-h-[2rem]">💡 {steps[activeIndex].explainer}</p>
        </div>
    );
}

function SyncIndicator({ status }: { status: 'idle' | 'saving' | 'saved' }) {
    if (status === 'saving') {
        return <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-tight text-primary fade-in"><Spinner size="sm" /> Saving changes...</div>;
    }
    return <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-tight text-muted-foreground fade-in"><Check size={12} className="text-emerald-500" /> Changes saved</div>;
}

// --- MAIN COMPONENT ---
export function IdeaFocusView({ item, onClose, onUpdate, initialLens }: IdeaFocusViewProps) {
    const modalRef = useRef<HTMLDivElement>(null);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('saved');

    // Unified local state
    const [localData, setLocalData] = useState({
        title: item.title || '',
        description: item.description || '', // Core card text
        frictionPoint: item.frictionPoint || '', // Problem statement
        techStack: item.techStack || '',
        scores: item.scores || Object.fromEntries(getAllQuestionIds().map(id => [id, 50])),
        lenses: item.lenses || [] as string[]
    });

    // Overwrite Confirmation State
    const [pendingSuggestion, setPendingSuggestion] = useState<Suggestion | null>(null);

    // Auto-Save Effect
    useEffect(() => {
        const hasChanged = JSON.stringify(localData) !== JSON.stringify({
            title: item.title,
            description: item.description,
            frictionPoint: item.frictionPoint,
            techStack: item.techStack,
            scores: item.scores,
            lenses: item.lenses
        });

        if (hasChanged) {
            setSaveStatus('saving');
            const timer = setTimeout(() => {
                // AUTO-TIER SYNC: Calculate derived props before saving
                const avgScore = calculateAverageScore(localData.scores);
                const computedTier = getTierFromScore(avgScore);

                onUpdate(item.id, {
                    ...localData,
                    score: avgScore,
                    tier: computedTier
                });
                setSaveStatus('saved');
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [localData, item.id, item.title, item.description, item.frictionPoint, item.techStack, item.scores, item.lenses, onUpdate]);

    // Auto-Analysis for Merged Items
    const hasAutoAnalyzed = useRef(false);
    useEffect(() => {
        if (item.source === 'MERGED' && !hasAutoAnalyzed.current) {
            hasAutoAnalyzed.current = true;
            handleReanalyse();
        }
    }, [item.source]);

    const averageScore = useMemo(() => calculateAverageScore(localData.scores), [localData.scores]);
    const projectedTier = useMemo(() => getTierFromScore(averageScore), [averageScore]);

    const tierColor = {
        STRATEGIC_BET: "bg-warning-subtle text-warning border-warning",
        TABLE_STAKES: "bg-info-subtle text-info border-info",
        AGENTIC_AUTO: "bg-muted text-foreground border-border"
    }[projectedTier] || "bg-muted text-foreground";

    // Dummy Recommendations (AI Only)
    const [suggestions, setSuggestions] = useState<Suggestion[]>([
        { id: 's1', targetField: 'friction', draftText: "Manual fleet routing takes 4 hours daily.", rationale: "Clarify the bottleneck", lensId: 'general', type: 'ai' },
        { id: 's2', targetField: 'title', draftText: "Auto-Pilot Logistics", rationale: "Action-oriented naming", lensId: 'general', type: 'ai' },
        { id: 's3', targetField: 'techStack', draftText: "Integrates with existing ERP APIs.", rationale: "System leverage strategy", lensId: 'infinite_capacity', type: 'ai' },
        { id: 's4', targetField: 'description', draftText: "A fully automated routing system that optimizes delivery paths in real-time.", rationale: "Clearer value proposition", lensId: 'general', type: 'ai' },
    ]);

    const defaultAccordions = useMemo(() => {
        const defaults = [GENERAL_SUGGESTION_ID];
        if (initialLens && initialLens !== 'VIEW_ALL' && LENS_DEFINITIONS.some(l => l.id === initialLens)) {
            defaults.push(initialLens);
        }
        return defaults;
    }, [initialLens]);

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
            onClose();
        }
    };

    const toggleLens = (lensId: string) => {
        setLocalData(prev => {
            const currentLenses = prev.lenses || [];
            if (currentLenses.includes(lensId)) {
                return { ...prev, lenses: currentLenses.filter((id: string) => id !== lensId) };
            } else {
                return { ...prev, lenses: [...currentLenses, lensId] };
            }
        });
    };

    // --- Suggestion Handling ---
    const initiateApplySuggestion = (suggestion: Suggestion) => {
        let currentContent = '';
        if (suggestion.targetField === 'title') currentContent = localData.title;
        else if (suggestion.targetField === 'description') currentContent = localData.description;
        else if (suggestion.targetField === 'friction') currentContent = localData.frictionPoint;
        else if (suggestion.targetField === 'techStack') currentContent = localData.techStack;

        if (currentContent && currentContent.trim().length > 0) {
            setPendingSuggestion(suggestion);
        } else {
            confirmApplySuggestion(suggestion);
        }
    };

    const confirmApplySuggestion = (suggestion: Suggestion) => {
        let newData = { ...localData };
        if (suggestion.targetField === 'title') newData.title = suggestion.draftText;
        if (suggestion.targetField === 'description') newData.description = suggestion.draftText;
        if (suggestion.targetField === 'friction') newData.frictionPoint = suggestion.draftText;
        if (suggestion.targetField === 'techStack') newData.techStack = suggestion.draftText;

        setLocalData(newData);
        setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
        setPendingSuggestion(null);
    };

    const renderIcon = (iconName: string, size: number, className?: string) => {
        if (iconName === 'Infinity') return <Infinity size={size} className={className} />;
        if (iconName === 'AlertTriangle') return <AlertTriangle size={size} className={className} />;
        if (iconName === 'RefreshCw') return <RefreshCw size={size} className={className} />;
        if (iconName === 'Sparkles') return <Sparkles size={size} className={className} />;
        return <Sparkles size={size} className={className} />;
    };

    // --- INTELLIGENCE ACTIONS ---
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const handleReanalyse = () => {
        setIsAnalyzing(true);
        // Simulate AI Analysis Delay
        setTimeout(() => {
            const newSuggestions: Suggestion[] = [
                {
                    id: `ai-${Date.now()}-1`,
                    targetField: 'friction',
                    draftText: localData.description.toLowerCase().includes('logistics')
                        ? "Current manual routing accounts for 15% of daily opex."
                        : "Manual data entry creates a 24h delay in reporting.",
                    rationale: "Problem Quantification",
                    lensId: 'infinite_capacity',
                    type: 'ai'
                },
                {
                    id: `ai-${Date.now()}-2`,
                    targetField: 'techStack',
                    draftText: "Leverage existing SQL warehouse using dbt for transform layer.",
                    rationale: "Architecture Alignment",
                    lensId: 'ooda_loop',
                    type: 'ai'
                },
                {
                    id: `ai-${Date.now()}-3`,
                    targetField: 'description',
                    draftText: localData.title ? `${localData.title} driven by predictive models.` : "AI-driven optimizations for core workflow.",
                    rationale: "Value Clarification",
                    lensId: 'general',
                    type: 'ai'
                }
            ];

            // Refresh suggestions: Keep Human/Other, Replace AI ones? Or just append.
            // For "Live" feel, let's keep it simple and just set these as the new active suggestions
            setSuggestions(newSuggestions);
            setIsAnalyzing(false);
        }, 1500);
    };

    return (
        <div
            className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-md flex items-start justify-center pt-[20px] pb-6 animate-in fade-in duration-300"
            onClick={handleBackdropClick}
        >
            <div
                ref={modalRef}
                className="bg-card w-full max-w-7xl h-full rounded-[32px] shadow-2xl flex relative overflow-hidden animate-in zoom-in-95 duration-300 border border-border"
            >
                {/* --- ABSOLUTE CLOSE BUTTON --- */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="absolute top-8 right-8 z-50 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground h-10 w-10"
                >
                    <X size={20} />
                </Button>

                {/* --- LEFT: WORKSPACE (70%) --- */}
                <div className="flex-1 flex flex-col overflow-hidden bg-card relative">
                    <div className="flex-1 overflow-y-auto px-16 py-12 space-y-10 custom-scrollbar">

                        {/* HERO SECTION */}
                        <div className="space-y-4 pt-4">
                            <div className="flex items-center gap-3">
                                <Badge className={cn("px-2 py-0.5 text-[9px] font-black uppercase tracking-widest border shadow-sm", tierColor)}>
                                    {projectedTier.replace('_', ' ')}
                                </Badge>
                                <div className="flex items-center gap-2 border-l border-border pl-3">
                                    {LENS_DEFINITIONS.map(lens => (
                                        <button
                                            key={lens.id}
                                            onClick={() => toggleLens(lens.id)}
                                            className={cn(
                                                "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border transition-all",
                                                localData.lenses?.includes(lens.id)
                                                    ? `bg-${lens.color}-100 text-${lens.color}-700 border-${lens.color}-200`
                                                    : "bg-muted text-muted-foreground border-border hover:border-foreground/20"
                                            )}
                                        >
                                            {lens.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 1. HEADER section */}
                            <div>
                                <div className="mb-8">
                                    {/* TITLE INPUT - AUTO FOCUS */}
                                    <input
                                        autoFocus
                                        type="text"
                                        value={localData.title}
                                        onChange={(e) => setLocalData({ ...localData, title: e.target.value })}
                                        className="text-5xl font-black text-foreground w-full border-none focus:ring-0 p-0 placeholder:text-muted-foreground/30 tracking-tight bg-transparent"
                                        placeholder="Opportunity Name"
                                    />

                                    {/* NEW: LINEAGE INFO BLOCK */}
                                    {item.lineage && item.lineage.length > 0 && (
                                        <div className="mt-4 p-3 bg-muted/30 border border-border rounded-lg space-y-3 animate-in fade-in slide-in-from-top-2">
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <div className="bg-primary/10 p-1 rounded-md text-primary">
                                                    <Split className="h-3 w-3" />
                                                </div>
                                                <span className="font-bold text-foreground uppercase tracking-wide">Merged Insight</span>
                                                <span className="text-muted-foreground mx-1">|</span>
                                                <span>Synthesized from <strong>{item.lineage.length}</strong> parent ideas:</span>
                                            </div>

                                            <div className="pl-7 grid gap-2">
                                                {item.lineage.map((parent: any) => {
                                                    const sourceLabel = parent.source === 'MARKET_SIGNAL' ? 'Market Signal' :
                                                        parent.source === 'CLIENT_BACKLOG' ? 'Client Backlog' :
                                                            parent.source === 'WORKSHOP_GENERATED' ? 'Workshop' : parent.source;

                                                    const sourceColor = parent.source === 'MARKET_SIGNAL' ? 'bg-intelligence-subtle text-intelligence border-intelligence' :
                                                        parent.source === 'CLIENT_BACKLOG' ? 'bg-cyan-50 text-cyan-700 border-cyan-200' :
                                                            'bg-success-subtle text-success border-success';

                                                    return (
                                                        <div key={parent.id} className="flex items-center justify-between bg-card p-2 rounded border border-border shadow-sm">
                                                            <span className="text-xs font-semibold text-foreground truncate max-w-[200px]" title={parent.title}>{parent.title}</span>
                                                            <Badge variant="outline" className={cn("text-[8px] font-bold px-1.5 py-0 uppercase tracking-wide border", sourceColor)}>
                                                                {sourceLabel}
                                                            </Badge>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="pl-1 h-5 flex items-center">
                                    <SyncIndicator status={saveStatus} />
                                </div>
                            </div>

                        </div>

                        {/* FULL WIDTH DESCRIPTION (Card Body) */}
                        <div className="space-y-4">
                            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                Description
                            </label>
                            <textarea
                                value={localData.description}
                                onChange={(e) => setLocalData({ ...localData, description: e.target.value })}
                                // Visual Standard: bg-muted/50, rounded-2xl, shadow-inner
                                className="w-full min-h-[200px] p-5 text-xl font-medium text-foreground bg-muted/30 border border-border rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none shadow-inner placeholder:font-normal placeholder:text-muted-foreground/50"
                                placeholder="Describe the opportunity in detail..."
                            />
                        </div>

                        {/* HIGH-LEVEL EXPLORATION GRID (Friction & Tech) */}
                        <div className="grid grid-cols-2 gap-10">
                            <div className="space-y-4">
                                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                    <Info size={12} className="text-primary" /> Friction Point
                                </label>
                                <textarea
                                    value={localData.frictionPoint}
                                    onChange={(e) => setLocalData({ ...localData, frictionPoint: e.target.value })}
                                    className="w-full min-h-[160px] p-5 text-base text-foreground bg-muted/30 border border-border rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none shadow-inner"
                                    placeholder="What process bottleneck does this card eliminate?"
                                />
                            </div>
                            <div className="space-y-4">
                                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                    <Zap size={12} className="text-warning" /> Tech Alignment
                                </label>
                                <textarea
                                    value={localData.techStack}
                                    onChange={(e) => setLocalData({ ...localData, techStack: e.target.value })}
                                    className="w-full min-h-[160px] p-5 text-base text-foreground bg-muted/30 border border-border rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none shadow-inner"
                                    placeholder="How does this leverage existing strategy?"
                                />
                            </div>
                        </div>

                        {/* SCORECARD */}
                        <div className="bg-muted/30 rounded-[32px] border border-border/50 p-8 space-y-10">
                            <div className="flex items-center justify-between border-b border-border/50 pb-6">
                                <div className="space-y-1">
                                    <h3 className="text-xl font-black text-foreground flex items-center gap-3">
                                        <Brain className="text-primary" size={24} /> Strategic Assessment
                                    </h3>
                                    <p className="text-xs text-muted-foreground font-medium italic">Adjust the levels to calibrate portfolio priority</p>
                                </div>
                                <div className="scale-90 origin-right">
                                    <SpeedometerGauge score={averageScore} size={130} />
                                </div>
                            </div>

                            <Accordion type="multiple" defaultValue={['system', 'value', 'execution']} className="space-y-4">
                                {SCORING_DIMENSIONS.map((dimension) => (
                                    <AccordionItem key={dimension.id} value={dimension.id} className="border-none bg-card rounded-2xl shadow-sm px-6">
                                        <AccordionTrigger className="py-5 hover:no-underline border-b border-border/50">
                                            <span className="font-black text-sm uppercase tracking-widest text-foreground">{dimension.category}</span>
                                        </AccordionTrigger>
                                        <AccordionContent className="py-8 space-y-10">
                                            {dimension.questions.map((question) => (
                                                <ThreeStepPicker
                                                    key={question.id}
                                                    value={localData.scores[question.id] ?? 50}
                                                    onChange={(val: number) => setLocalData({
                                                        ...localData,
                                                        scores: { ...localData.scores, [question.id]: val }
                                                    })}
                                                    question={question}
                                                />
                                            ))}
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </div>
                    </div>
                </div>

                {/* --- RIGHT: INTELLIGENCE SIDEBAR (30%) --- */}
                <div className="w-[400px] bg-muted/30 flex flex-col border-l border-border pt-16">
                    <div className="px-8 pb-6 border-b border-border bg-muted/30">
                        <h3 className="font-black text-foreground flex items-center gap-2">
                            <Wand2 className="text-intelligence" size={20} /> Intelligence & Insights
                        </h3>
                        <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase tracking-tighter">Strategic Recommendations</p>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">


                        <Accordion type="multiple" defaultValue={defaultAccordions} className="space-y-0">

                            {/* 1. GENERAL IMPROVEMENTS SECTION */}
                            <AccordionItem value={GENERAL_SUGGESTION_ID} className="border-b border-border bg-card">
                                <AccordionTrigger className="px-8 py-4 hover:bg-muted/50 hover:no-underline">
                                    <div className="flex items-center gap-2">
                                        <Sparkles size={16} className="text-muted-foreground" />
                                        <span className="font-bold text-xs uppercase tracking-wide text-foreground">General Improvements</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-8 pb-6 bg-muted/30">
                                    <div className="space-y-4">
                                        <div className="space-y-3 mt-2">
                                            <AnimatePresence mode='popLayout'>
                                                {suggestions.filter(s => s.lensId === 'general').map(suggestion => (
                                                    <motion.div
                                                        layout
                                                        initial={{ opacity: 0, scale: 0.95 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                                                        key={suggestion.id}
                                                        className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-3"
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <Badge variant="outline" className="text-[9px] uppercase font-bold border-none px-1.5 bg-muted text-muted-foreground">
                                                                {suggestion.targetField}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-xs text-foreground font-medium leading-relaxed">"{suggestion.draftText}"</p>
                                                        <div className="flex gap-2 pt-2 border-t border-border/50">
                                                            <Button
                                                                size="sm"
                                                                className="flex-1 h-7 text-[10px] font-black bg-primary/10 text-primary hover:bg-primary/20"
                                                                onClick={() => initiateApplySuggestion(suggestion)}
                                                            >
                                                                <Check size={12} className="mr-1" /> Apply
                                                            </Button>
                                                            <Button size="sm" variant="ghost" className="h-7 text-[10px] text-muted-foreground font-bold" onClick={() => setSuggestions(s => s.filter(x => x.id !== suggestion.id))}>Dismiss</Button>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>
                                            {suggestions.filter(s => s.lensId === 'general').length === 0 && (
                                                <p className="text-[10px] text-muted-foreground italic text-center py-2">No active suggestions.</p>
                                            )}
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>

                            {/* 2. STRATEGIC LENSES SECTIONS */}
                            {LENS_DEFINITIONS.map((lens) => (
                                <AccordionItem key={lens.id} value={lens.id} className="border-b border-border bg-card">
                                    <AccordionTrigger className="px-8 py-4 hover:bg-muted/50 hover:no-underline">
                                        <div className="flex items-center gap-2">
                                            {renderIcon(lens.icon, 16, `text-${lens.color}-500`)}
                                            <span className="font-bold text-xs uppercase tracking-wide text-foreground">{lens.label}</span>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="px-8 pb-6 bg-muted/30">
                                        <div className="space-y-4">
                                            <div className="space-y-3 mt-2">
                                                <AnimatePresence mode='popLayout'>
                                                    {suggestions.filter(s => s.lensId === lens.id).map(suggestion => (
                                                        <motion.div
                                                            layout
                                                            initial={{ opacity: 0, scale: 0.95 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                                                            key={suggestion.id}
                                                            className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-3"
                                                        >
                                                            <Badge variant="outline" className="text-[9px] uppercase font-black border-none px-1.5 bg-muted text-muted-foreground">
                                                                {suggestion.rationale || 'Strategy'}
                                                            </Badge>
                                                            <p className="text-xs text-foreground font-medium leading-relaxed">"{suggestion.draftText}"</p>

                                                            {/* Actions */}
                                                            <div className="flex gap-2 pt-2 border-t border-border/50">
                                                                <Button
                                                                    size="sm"
                                                                    className="flex-1 h-7 text-[10px] font-black bg-primary/10 text-primary hover:bg-primary/20"
                                                                    onClick={() => initiateApplySuggestion(suggestion)}
                                                                >
                                                                    <Check size={12} className="mr-1" /> Apply
                                                                </Button>
                                                                <Button size="sm" variant="ghost" className="h-7 text-[10px] text-muted-foreground font-bold" onClick={() => setSuggestions(s => s.filter(x => x.id !== suggestion.id))}>Dismiss</Button>
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                </AnimatePresence>
                                                {suggestions.filter(s => s.lensId === lens.id).length === 0 && (
                                                    <p className="text-[10px] text-muted-foreground italic text-center py-2">No strategic insights generated.</p>
                                                )}
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>

                        {/* LIVE ANALYSE BUTTON */}
                        <div className="px-8 py-6">
                            <Button
                                onClick={handleReanalyse}
                                disabled={isAnalyzing}
                                className={cn(
                                    "w-full h-12 bg-card border-2 border-primary/20 text-primary hover:bg-primary/10 hover:border-primary/40 rounded-xl font-bold shadow-sm transition-all flex items-center justify-center gap-2",
                                    isAnalyzing && "opacity-80 cursor-wait"
                                )}
                            >
                                {isAnalyzing ? <Spinner size="sm" /> : <RefreshCw size={16} />}
                                {isAnalyzing ? "Analysing Idea..." : "Re-analyse"}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* --- OVERWRITE CONFIRMATION DIALOG --- */}
                <Dialog open={!!pendingSuggestion} onOpenChange={(open) => !open && setPendingSuggestion(null)}>
                    <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-warning">
                                <AlertTriangle size={20} /> Confirm Overwrite
                            </DialogTitle>
                            <DialogDescription className="font-medium text-muted-foreground pt-2">
                                This will overwrite your current content for <span className="font-bold text-foreground">{pendingSuggestion?.targetField}</span>.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="bg-muted p-3 rounded-lg text-xs text-muted-foreground italic border border-border">
                            "{pendingSuggestion?.draftText}"
                        </div>
                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button variant="outline" onClick={(e) => {
                                e.stopPropagation();
                                setPendingSuggestion(null);
                            }}>
                                Cancel
                            </Button>
                            <Button className="bg-warning hover:bg-warning text-white" onClick={(e) => {
                                e.stopPropagation();
                                if (pendingSuggestion) {
                                    confirmApplySuggestion(pendingSuggestion);
                                }
                            }}>
                                Yes, Overwrite
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}