'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, BrainCircuit, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

// Define the shape of the card data expected by the modal
export type OpportunityCardData = {
    title: string;
    description: string;
    friction?: string;
    techAlignment?: string;
    source?: string;
    provenance?: string;
    status: string;
    horizon: string;
    category: string;
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
                    <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{card.horizon}</Badge>
                        <Badge className={cn(
                            "text-white",
                            card.category === 'MOONSHOT' ? "bg-purple-600" : "bg-blue-600"
                        )}>
                            {card.category}
                        </Badge>
                    </div>
                    <DialogTitle className="text-2xl font-black text-slate-900">
                        {card.title}
                    </DialogTitle>
                    <DialogDescription className="text-lg text-slate-600 mt-2">
                        {card.description}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-4 my-6">
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                        <h4 className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-2">
                            <AlertTriangle className="w-3 h-3" /> Friction Point
                        </h4>
                        <p className="text-sm text-slate-700 font-medium">
                            {card.friction || "Resolves operational bottlenecks."}
                        </p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <h4 className="text-xs font-bold text-blue-400 uppercase mb-2 flex items-center gap-2">
                            <BrainCircuit className="w-3 h-3" /> Tech Alignment
                        </h4>
                        <p className="text-sm text-blue-800 font-medium">
                            {card.techAlignment || "Leverages existing architecture."}
                        </p>
                    </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
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
