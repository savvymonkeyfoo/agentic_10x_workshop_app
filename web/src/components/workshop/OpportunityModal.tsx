'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, BrainCircuit, Sparkles, Target, ShieldCheck, CheckCircle, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

// UPDATED: Strategic Analysis Data Shape
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
}

export function OpportunityModal({ card, isOpen, onClose, onSave }: OpportunityModalProps) {
    const [localCard, setLocalCard] = useState<OpportunityCardData | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Sync state when card opens
    useEffect(() => {
        setLocalCard(card);
    }, [card]);

    if (!localCard) return null;

    // AUTO-SAVE HANDLER (Debounced logic would be in parent, or we trigger here)
    const handleChange = (field: keyof OpportunityCardData, value: string) => {
        const updated = { ...localCard, [field]: value };
        setLocalCard(updated);

        // Trigger Save (Parent handles API call)
        setIsSaving(true);
        const timer = setTimeout(() => {
            onSave(updated);
            setIsSaving(false);
        }, 800); // 800ms debounce
        return () => clearTimeout(timer);
    };

    const isMarketSignal = localCard.source === 'MARKET_SIGNAL';

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    {/* READ-ONLY SOURCE BADGE */}
                    <div className="flex items-center justify-between mb-4">
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
                    </div>

                    {/* EDITABLE TITLE */}
                    <div className="space-y-4">
                        <Input
                            className="text-2xl font-black text-slate-900 border-transparent hover:border-slate-200 focus:border-slate-300 px-0 h-auto py-2 shadow-none"
                            value={localCard.title}
                            onChange={(e) => handleChange('title', e.target.value)}
                        />

                        {/* EDITABLE DESCRIPTION */}
                        <Textarea
                            className="text-sm text-slate-600 leading-relaxed border-transparent hover:border-slate-200 focus:border-slate-300 px-0 shadow-none resize-none min-h-[80px]"
                            value={localCard.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                        />
                    </div>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    {/* 1. Friction (Red) */}
                    <div className="bg-red-50/50 p-4 rounded-xl border border-red-100/50 hover:border-red-200 transition-colors group">
                        <Label className="text-xs font-bold text-red-700 uppercase mb-3 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" /> Operational Friction
                        </Label>
                        <Textarea
                            className="bg-transparent border-none focus-visible:ring-0 text-red-900/80 text-sm leading-relaxed min-h-[100px] p-0 shadow-none -ml-1"
                            value={localCard.friction || "- No friction identified."}
                            onChange={(e) => handleChange('friction', e.target.value)}
                        />
                    </div>

                    {/* 2. Tech (Blue) */}
                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/50 hover:border-blue-200 transition-colors group">
                        <Label className="text-xs font-bold text-blue-700 uppercase mb-3 flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4" /> Technical DNA
                        </Label>
                        <Textarea
                            className="bg-transparent border-none focus-visible:ring-0 text-blue-900/80 text-sm leading-relaxed min-h-[100px] p-0 shadow-none -ml-1"
                            value={localCard.techAlignment || "- No tech alignment identified."}
                            onChange={(e) => handleChange('techAlignment', e.target.value)}
                        />
                    </div>

                    {/* 3. Strategy (Amber) */}
                    <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100/50 hover:border-amber-200 transition-colors group">
                        <Label className="text-xs font-bold text-amber-700 uppercase mb-3 flex items-center gap-2">
                            <Target className="w-4 h-4" /> Strategy Alignment
                        </Label>
                        <Textarea
                            className="bg-transparent border-none focus-visible:ring-0 text-amber-900/80 text-sm leading-relaxed min-h-[100px] p-0 shadow-none -ml-1"
                            value={localCard.strategyAlignment || "- No strategy alignment identified."}
                            onChange={(e) => handleChange('strategyAlignment', e.target.value)}
                        />
                    </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                    <span className="font-mono bg-slate-50 px-2 py-1 rounded border border-slate-100">
                        ID: {localCard.originalId || 'UNKNOWN_ID'}
                    </span>
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-3 h-3 text-purple-400" />
                        <span className="italic">
                            {localCard.provenance || "AI Generated via Deep-Chain"}
                        </span>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
