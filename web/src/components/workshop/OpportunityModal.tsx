'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Sparkles, Target, ShieldCheck, CheckCircle, Zap, Trash2, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SmartBulletEditor } from "@/components/ui/smart-bullet-editor";

export type OpportunityCardData = {
    title: string;
    description: string; // The "Problem Statement"
    proposedSolution?: string; // The "Proposed Solution"
    friction?: string;
    techAlignment?: string;
    strategyAlignment?: string;
    source?: string;
    provenance?: string;
    originalId: string;
};

interface OpportunityModalProps {
    card: OpportunityCardData | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (updatedCard: OpportunityCardData) => void;
    onEnrich?: (title: string, description: string) => Promise<{ success: boolean; data?: any }>;
    onDelete?: (card: OpportunityCardData) => void;
}

export function OpportunityModal({ card, isOpen, onClose, onSave, onEnrich, onDelete }: OpportunityModalProps) {
    const [localCard, setLocalCard] = useState<OpportunityCardData | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isEnriching, setIsEnriching] = useState(false);

    // NEW: View State for Deletion
    const [isDeleteConfirm, setIsDeleteConfirm] = useState(false);

    // Refs for auto-growing standard textareas
    const titleRef = useRef<HTMLTextAreaElement>(null);
    const probRef = useRef<HTMLTextAreaElement>(null);
    const solRef = useRef<HTMLTextAreaElement>(null);

    // 1. SYNC STATE
    useEffect(() => {
        if (card) {
            const cleanDescription = (card.description || '').replace(/\*\*/g, '');
            setLocalCard({ ...card, description: cleanDescription });
            // Reset delete view on open
            setIsDeleteConfirm(false);
        }
    }, [card, isOpen]);

    // 2. ROBUST AUTO-RESIZE LOGIC
    const adjustHeight = (el: HTMLTextAreaElement | null) => {
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = `${el.scrollHeight}px`;
    };

    // 3. FORCE RESIZE ON OPEN & CHANGE
    useEffect(() => {
        if (isOpen && localCard && !isDeleteConfirm) {
            const timer = setTimeout(() => {
                adjustHeight(titleRef.current);
                adjustHeight(probRef.current);
                adjustHeight(solRef.current);
            }, 10);
            return () => clearTimeout(timer);
        }
    }, [isOpen, localCard?.title, localCard?.description, localCard?.proposedSolution, isDeleteConfirm]);

    if (!localCard) return null;

    const handleChange = (field: keyof OpportunityCardData, value: string) => {
        const updated = { ...localCard, [field]: value };
        setLocalCard(updated);

        setIsSaving(true);
        const timer = setTimeout(() => {
            onSave(updated);
            setIsSaving(false);
        }, 800);
        return () => clearTimeout(timer);
    };

    const handleManualSave = () => {
        onSave(localCard);
        onClose();
    };

    const handleEnrich = async () => {
        if (!onEnrich) return;
        setIsEnriching(true);
        try {
            const result = await onEnrich(localCard.title, localCard.description);
            if (result.success && result.data) {
                const updated = {
                    ...localCard,
                    proposedSolution: result.data.proposedSolution || localCard.proposedSolution,
                    friction: result.data.friction,
                    techAlignment: result.data.techAlignment,
                    strategyAlignment: result.data.strategyAlignment
                };
                setLocalCard(updated);
                onSave(updated);
            }
        } finally {
            setIsEnriching(false);
        }
    };

    const isMarketSignal = localCard.source === 'MARKET_SIGNAL';
    const isWorkshop = localCard.source === 'WORKSHOP_GENERATED';

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">

                {/* --- VIEW 1: DELETE CONFIRMATION --- */}
                {isDeleteConfirm ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6 shadow-sm">
                            <AlertTriangle className="w-8 h-8 text-red-600" strokeWidth={2.5} />
                        </div>

                        <h3 className="text-2xl font-bold text-slate-900 mb-2">Delete Opportunity?</h3>

                        <p className="text-slate-500 max-w-md mx-auto mb-8 leading-relaxed">
                            Are you sure you want to delete <span className="font-bold text-slate-800">"{localCard.title}"</span>?
                            <br />
                            This action cannot be undone and will remove it from all analysis views.
                        </p>

                        <div className="flex gap-4 w-full max-w-xs">
                            <button
                                onClick={() => setIsDeleteConfirm(false)}
                                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => onDelete && onDelete(localCard)}
                                className="flex-1 px-4 py-3 rounded-xl bg-red-600 font-bold text-white shadow-lg shadow-red-200 hover:bg-red-700 hover:shadow-xl transition-all flex items-center justify-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" /> Yes, Delete
                            </button>
                        </div>
                    </div>
                ) : (

                    /* --- VIEW 2: EDIT FORM (Default) --- */
                    <>
                        <DialogHeader>
                            <DialogTitle className="sr-only">Edit Opportunity</DialogTitle>

                            {/* SOURCE BADGE */}
                            <div className="flex items-center justify-between mb-2">
                                <Badge variant="outline" className={cn(
                                    "px-3 py-1 text-xs font-bold tracking-wide border",
                                    isMarketSignal
                                        ? "bg-purple-100 text-purple-700 border-purple-200"
                                        : isWorkshop
                                            ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                            : "bg-slate-100 text-slate-700 border-slate-200"
                                )}>
                                    {isMarketSignal
                                        ? <><Zap className="w-3 h-3 mr-2" /> Market Signal</>
                                        : isWorkshop
                                            ? <><CheckCircle className="w-3 h-3 mr-2" /> Workshop Idea</>
                                            : <><CheckCircle className="w-3 h-3 mr-2" /> Backlog Item</>
                                    }
                                </Badge>
                                <div className="flex items-center gap-2">
                                    {isSaving && <span className="text-xs text-slate-400 animate-pulse">Saving...</span>}
                                    {isEnriching && <span className="text-xs text-emerald-600 animate-pulse font-bold">✨ Enriching...</span>}
                                </div>
                            </div>

                            <div className="space-y-3 pb-2">
                                {/* H1 TITLE */}
                                <Textarea
                                    ref={titleRef}
                                    rows={1}
                                    className="!text-4xl md:!text-4xl font-black tracking-tight text-slate-900 border-none hover:bg-slate-50 focus:bg-slate-50 focus:ring-0 px-0 shadow-none resize-none overflow-hidden leading-[1.1] min-h-[50px] placeholder:text-slate-300"
                                    placeholder="Opportunity Title"
                                    value={localCard.title}
                                    onChange={(e) => handleChange('title', e.target.value)}
                                />

                                {/* PROBLEM STATEMENT (Legacy Description) */}
                                <div className="space-y-1">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Problem Statement</Label>
                                    <Textarea
                                        ref={probRef}
                                        rows={1}
                                        className="text-base text-slate-600 leading-relaxed border-none hover:bg-slate-50 focus:bg-slate-50 focus:ring-0 px-0 shadow-none min-h-[60px] max-h-[12rem] resize-y overflow-y-auto"
                                        placeholder="Describe the problem..."
                                        value={localCard.description || ''}
                                        onChange={(e) => handleChange('description', e.target.value)}
                                    />
                                </div>

                                {/* PROPOSED SOLUTION (New Field) */}
                                <div className="space-y-1">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Proposed Solution</Label>
                                    <Textarea
                                        ref={solRef}
                                        rows={1}
                                        className="text-base text-slate-600 leading-relaxed border-none hover:bg-slate-50 focus:bg-slate-50 focus:ring-0 px-0 shadow-none min-h-[60px] max-h-[12rem] resize-y overflow-y-auto"
                                        placeholder="Describe the proposed solution..."
                                        value={localCard.proposedSolution || ''}
                                        onChange={(e) => handleChange('proposedSolution', e.target.value)}
                                    />
                                </div>

                                {/* ENRICH BUTTON */}
                                {onEnrich && (isWorkshop || (!localCard.friction && !localCard.techAlignment)) && (
                                    <button
                                        onClick={handleEnrich}
                                        disabled={isEnriching}
                                        className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-full transition-colors w-fit"
                                    >
                                        <Sparkles className="w-3 h-3" />
                                        {isEnriching ? "Analyzing Context..." : "Enrich with AI"}
                                    </button>
                                )}
                            </div>
                        </DialogHeader>

                        <div className="space-y-6 mt-2">
                            {/* 1. FRICTION (RED) */}
                            <div className="bg-red-50/50 p-4 rounded-xl border border-red-100/50 hover:border-red-200 transition-colors group">
                                <Label className="text-xs font-bold text-red-700 uppercase mb-3 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4" /> Operational Friction
                                </Label>
                                <SmartBulletEditor
                                    value={localCard.friction || ""}
                                    onChange={(val) => handleChange('friction', val)}
                                    colorClass="text-red-900/80"
                                    placeholder="Add friction point..."
                                />
                            </div>

                            {/* 2. TECH (BLUE) */}
                            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/50 hover:border-blue-200 transition-colors group">
                                <Label className="text-xs font-bold text-blue-700 uppercase mb-3 flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4" /> Technical DNA
                                </Label>
                                <SmartBulletEditor
                                    value={localCard.techAlignment || ""}
                                    onChange={(val) => handleChange('techAlignment', val)}
                                    colorClass="text-blue-900/80"
                                    placeholder="Add tech detail..."
                                />
                            </div>

                            {/* 3. STRATEGY (AMBER) */}
                            <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100/50 hover:border-amber-200 transition-colors group">
                                <Label className="text-xs font-bold text-amber-700 uppercase mb-3 flex items-center gap-2">
                                    <Target className="w-4 h-4" /> Strategy Alignment
                                </Label>
                                <SmartBulletEditor
                                    value={localCard.strategyAlignment || ""}
                                    onChange={(val) => handleChange('strategyAlignment', val)}
                                    colorClass="text-amber-900/80"
                                    placeholder="Add strategic goal..."
                                />
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                            <div className="flex items-center gap-4">
                                {/* DELETE TRIGGER */}
                                {onDelete && (
                                    <button
                                        onClick={() => setIsDeleteConfirm(true)}
                                        className="flex items-center gap-1 text-red-400 hover:text-red-600 transition-colors group/delete"
                                    >
                                        <Trash2 className="w-4 h-4 group-hover/delete:scale-110 transition-transform" />
                                        <span className="font-bold">Delete</span>
                                    </button>
                                )}
                                <span className="font-mono bg-slate-50 px-2 py-1 rounded border border-slate-100">
                                    ID: {localCard.originalId || 'UNKNOWN_ID'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-3 h-3 text-purple-400" />
                                <span className="italic">
                                    {localCard.provenance || "AI Generated via Deep-Chain"}
                                </span>
                            </div>
                        </div>

                        {localCard.originalId === 'draft' && (
                            <div className="sticky bottom-0 bg-white p-4 border-t flex justify-end">
                                <button
                                    onClick={handleManualSave}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-6 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                                >
                                    <CheckCircle className="w-4 h-4" /> Create Opportunity
                                </button>
                            </div>
                        )}
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
