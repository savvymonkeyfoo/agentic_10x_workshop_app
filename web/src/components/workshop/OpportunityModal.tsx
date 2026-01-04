'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Sparkles, Target, ShieldCheck, CheckCircle, Zap, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SmartBulletEditor } from "@/components/ui/smart-bullet-editor";

export type OpportunityCardData = {
    title: string;
    description: string;
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

    // Refs for auto-growing standard textareas
    const titleRef = useRef<HTMLTextAreaElement>(null);
    const descRef = useRef<HTMLTextAreaElement>(null);

    // 1. SYNC STATE
    useEffect(() => {
        if (card) {
            // SANITIZE: Strip markdown bolding (**) from description on load
            const cleanDescription = (card.description || '').replace(/\*\*/g, '');
            setLocalCard({ ...card, description: cleanDescription });
        }
    }, [card]);

    // 2. ROBUST AUTO-RESIZE LOGIC
    const adjustHeight = (el: HTMLTextAreaElement | null) => {
        if (!el) return;
        // Reset to auto to allow shrinkage, then set to scrollHeight
        el.style.height = 'auto';
        el.style.height = `${el.scrollHeight}px`;
    };

    // 3. FORCE RESIZE ON OPEN & CHANGE
    useEffect(() => {
        if (isOpen && localCard) {
            // Slight delay ensures DOM is painted before we measure height
            const timer = setTimeout(() => {
                adjustHeight(titleRef.current);
                adjustHeight(descRef.current);
            }, 10);
            return () => clearTimeout(timer);
        }
    }, [isOpen, localCard?.title, localCard?.description]);

    if (!localCard) return null;

    const handleChange = (field: keyof OpportunityCardData, value: string) => {
        const updated = { ...localCard, [field]: value };
        setLocalCard(updated);

        // AUTO-SAVE ONLY IF NOT DRAFT
        if (localCard?.originalId !== 'draft') {
            setIsSaving(true);
            const timer = setTimeout(() => {
                onSave(updated);
                setIsSaving(false);
            }, 800);
            return () => clearTimeout(timer);
        }
    };

    const handleManualSave = () => {
        if (localCard) onSave(localCard);
    };

    const handleEnrichClick = async () => {
        if (!onEnrich || !localCard) return;
        setIsEnriching(true);
        const result = await onEnrich(localCard.title, localCard.description);
        if (result.success && result.data) {
            setLocalCard(prev => prev ? ({ ...prev, ...result.data }) : null);
        }
        setIsEnriching(false);
    };

    const isMarketSignal = localCard.source === 'MARKET_SIGNAL';

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    {/* ACCESSIBILITY FIX */}
                    <DialogTitle className="sr-only">Edit Opportunity</DialogTitle>

                    {/* SOURCE BADGE */}
                    <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className={cn(
                            "px-3 py-1 text-xs font-bold tracking-wide border",
                            isMarketSignal
                                ? "bg-purple-100 text-purple-700 border-purple-200"
                                : "bg-slate-100 text-slate-700 border-slate-200"
                        )}>
                            {isMarketSignal
                                ? <><Zap className="w-3 h-3 mr-2" /> Market Signal</>
                                : <><CheckCircle className="w-3 h-3 mr-2" /> Backlog Item</>
                            }
                        </Badge>
                        {isSaving && <span className="text-xs text-slate-400 animate-pulse">Saving...</span>}
                        {localCard.originalId === 'draft' && onEnrich && (
                            <button
                                onClick={handleEnrichClick}
                                disabled={isEnriching || !localCard.title}
                                className="ml-auto flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold transition-all disabled:opacity-50"
                            >
                                {isEnriching ? <Sparkles className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                {isEnriching ? "Enriching..." : "Enrich with AI"}
                            </button>
                        )}
                    </div>

                    <div className="space-y-3 pb-2">
                        {/* H1 TITLE: Infinite Auto-Grow (No Scrollbar) */}
                        <Textarea
                            ref={titleRef}
                            rows={1}
                            className="!text-4xl md:!text-4xl font-black tracking-tight text-slate-900 border-none hover:bg-slate-50 focus:bg-slate-50 focus:ring-0 px-0 shadow-none resize-none overflow-hidden leading-[1.1] min-h-[50px] placeholder:text-slate-300"
                            placeholder="Opportunity Title"
                            value={localCard.title}
                            onChange={(e) => handleChange('title', e.target.value)}
                        />

                        {/* DESCRIPTION: Grow to max 8 lines, then scroll */}
                        <Textarea
                            ref={descRef}
                            rows={1}
                            className="text-base text-slate-600 leading-relaxed border-none hover:bg-slate-50 focus:bg-slate-50 focus:ring-0 px-0 shadow-none min-h-[60px] max-h-[12rem] resize-y overflow-y-auto"
                            placeholder="Add a description..."
                            value={localCard.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                        />
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
                        {/* DELETE BUTTON */}
                        {onDelete && (
                            <button
                                onClick={() => {
                                    if (confirm("Are you sure you want to delete this opportunity? This cannot be undone.")) {
                                        onDelete(localCard);
                                    }
                                }}
                                className="flex items-center gap-1 text-red-400 hover:text-red-600 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
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
            </DialogContent>
        </Dialog>
    );
}
