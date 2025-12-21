'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, BrainCircuit, Sparkles, Target } from "lucide-react";
import { cn } from "@/lib/utils";

// UPDATED: Strategic Analysis Data Shape
export type OpportunityCardData = {
    title: string;
    description: string;
    friction?: string;
    techAlignment?: string;
    strategyAlignment?: string; // NEW
    source?: string;
    provenance?: string;
    originalId: string;
};

interface OpportunityModalProps {
    card: OpportunityCardData | null;
    isOpen: boolean;
    onClose: () => void;
}

export function OpportunityModal({ card, isOpen, onClose }: OpportunityModalProps) {
    if (!card) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    {/* Source Badge only - Horizon/Category removed */}
                    <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-slate-500 border-slate-300">
                            {card.source || "Opportunity"}
                        </Badge>
                    </div>
                    <DialogTitle className="text-2xl font-black text-slate-900">
                        {card.title}
                    </DialogTitle>
                    <DialogDescription className="text-lg text-slate-600 mt-2">
                        {card.description}
                    </DialogDescription>
                </DialogHeader>

                {/* THE STRATEGIC TRIAD */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
                    {/* 1. Friction */}
                    <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                        <h4 className="text-xs font-bold text-red-700 uppercase mb-2 flex items-center gap-2">
                            <AlertTriangle className="w-3 h-3" /> Friction
                        </h4>
                        <p className="text-sm text-red-900 font-medium leading-relaxed">
                            {card.friction || "Resolves operational bottlenecks."}
                        </p>
                    </div>

                    {/* 2. Tech Alignment */}
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <h4 className="text-xs font-bold text-blue-700 uppercase mb-2 flex items-center gap-2">
                            <BrainCircuit className="w-3 h-3" /> Tech DNA
                        </h4>
                        <p className="text-sm text-blue-900 font-medium leading-relaxed">
                            {card.techAlignment || "Leverages existing architecture."}
                        </p>
                    </div>

                    {/* 3. Strategy Alignment (NEW) */}
                    <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                        <h4 className="text-xs font-bold text-amber-700 uppercase mb-2 flex items-center gap-2">
                            <Target className="w-3 h-3" /> Strategy
                        </h4>
                        <p className="text-sm text-amber-900 font-medium leading-relaxed">
                            {card.strategyAlignment || "Aligns with core business goals."}
                        </p>
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                    <span className="font-mono bg-slate-100 px-2 py-1 rounded">
                        ID: {card.originalId?.slice(0, 8) || 'N/A'}
                    </span>
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-3 h-3 text-purple-400" />
                        <span className="italic">
                            {card.provenance || "AI Generated via Deep-Chain"}
                        </span>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
