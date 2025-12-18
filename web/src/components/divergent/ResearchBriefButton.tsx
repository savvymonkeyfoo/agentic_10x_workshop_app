'use client';

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Brain, Sparkles, Loader2, Search, Shield, FileSearch } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export type PipelineStep = 'idle' | 'auditing' | 'detecting' | 'architecting';

interface ResearchBriefButtonProps {
    onClick: () => void;
    isDisabled: boolean;
    isLoading: boolean;
    dossierCount: number;
    backlogCount: number;
}

const STEP_MESSAGES: Record<PipelineStep, { icon: React.ReactNode; text: string }> = {
    idle: { icon: null, text: '' },
    auditing: {
        icon: <FileSearch className="mr-2 h-5 w-5 animate-pulse" />,
        text: 'Auditing Enterprise DNA...'
    },
    detecting: {
        icon: <Search className="mr-2 h-5 w-5 animate-pulse" />,
        text: 'Detecting Strategic Blind Spots...'
    },
    architecting: {
        icon: <Shield className="mr-2 h-5 w-5 animate-pulse" />,
        text: 'Architecting Research Mandate...'
    },
};

// Simulated step progression for UI feedback
const STEP_DURATION_MS = 5000;

export function ResearchBriefButton({
    onClick,
    isDisabled,
    isLoading,
    dossierCount,
    backlogCount
}: ResearchBriefButtonProps) {
    const [currentStep, setCurrentStep] = useState<PipelineStep>('idle');

    // Simulate step progression when loading
    useEffect(() => {
        if (!isLoading) {
            setCurrentStep('idle');
            return;
        }

        // Step through the pipeline phases
        setCurrentStep('auditing');

        const timer1 = setTimeout(() => setCurrentStep('detecting'), STEP_DURATION_MS);
        const timer2 = setTimeout(() => setCurrentStep('architecting'), STEP_DURATION_MS * 2);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
        };
    }, [isLoading]);

    const stepInfo = STEP_MESSAGES[currentStep];

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <span tabIndex={0} className={cn("inline-block w-72", isDisabled && "cursor-not-allowed")}>
                        <Button
                            size="lg"
                            className={cn(
                                "w-full font-bold text-white shadow-lg transition-all duration-300",
                                "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500",
                                !isDisabled && "hover:-translate-y-0.5 hover:shadow-xl",
                                isDisabled && "opacity-50 grayscale",
                                isLoading && "animate-pulse"
                            )}
                            disabled={isDisabled || isLoading}
                            onClick={onClick}
                        >
                            {isLoading ? (
                                <div className="flex items-center">
                                    {stepInfo.icon || <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                                    <span className="text-sm">{stepInfo.text}</span>
                                </div>
                            ) : (
                                <>
                                    Generate Research Brief
                                    <div className="relative ml-2">
                                        <Brain className="h-5 w-5" />
                                        <Sparkles className="h-3 w-3 absolute -top-1 -right-1 text-yellow-300 animate-pulse" />
                                    </div>
                                </>
                            )}
                        </Button>
                    </span>
                </TooltipTrigger>
                {isDisabled && (
                    <TooltipContent side="bottom" className="max-w-xs text-center">
                        <p>Upload and index at least one <strong>Dossier</strong> and one <strong>Backlog</strong> to unlock AI Research.</p>
                        <div className="text-xs text-muted-foreground mt-1 flex justify-center gap-2">
                            <span className={dossierCount > 0 ? "text-green-500" : "text-red-400"}>
                                Dossier: {dossierCount}
                            </span>
                            <span className={backlogCount > 0 ? "text-green-500" : "text-red-400"}>
                                Backlog: {backlogCount}
                            </span>
                        </div>
                    </TooltipContent>
                )}
                {isLoading && (
                    <TooltipContent side="bottom" className="max-w-xs text-center">
                        <p className="font-semibold text-indigo-600">Supreme Scout Pipeline</p>
                        <div className="text-xs text-muted-foreground mt-2 space-y-1">
                            <div className={cn("flex items-center gap-2", currentStep === 'auditing' && "text-indigo-600 font-medium")}>
                                <span className={currentStep === 'auditing' ? "animate-pulse" : ""}>1.</span>
                                Technical Audit
                                {currentStep !== 'auditing' && currentStep !== 'idle' && <span className="text-green-500">✓</span>}
                            </div>
                            <div className={cn("flex items-center gap-2", currentStep === 'detecting' && "text-indigo-600 font-medium")}>
                                <span className={currentStep === 'detecting' ? "animate-pulse" : ""}>2.</span>
                                Gap Detection
                                {currentStep === 'architecting' && <span className="text-green-500">✓</span>}
                            </div>
                            <div className={cn("flex items-center gap-2", currentStep === 'architecting' && "text-indigo-600 font-medium")}>
                                <span className={currentStep === 'architecting' ? "animate-pulse" : ""}>3.</span>
                                Mandate Architect
                            </div>
                        </div>
                    </TooltipContent>
                )}
            </Tooltip>
        </TooltipProvider>
    );
}
