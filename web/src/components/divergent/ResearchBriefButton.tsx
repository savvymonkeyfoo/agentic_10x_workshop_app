'use client';

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Brain, Sparkles, Loader2, FileSearch, GitCompare, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export type PipelineStep = 'idle' | 'auditing' | 'analysing' | 'architecting';

interface ResearchBriefButtonProps {
    onClick: () => void;
    isDisabled: boolean;
    isLoading: boolean;
    dossierCount: number;
    backlogCount: number;
}

const STEP_CONFIG: Record<PipelineStep, { icon: React.ReactNode; text: string; description: string }> = {
    idle: { icon: null, text: '', description: '' },
    auditing: {
        icon: <FileSearch className="mr-2 h-5 w-5 animate-pulse" />,
        text: 'Extracting Enterprise DNA...',
        description: 'Technical Audit in progress'
    },
    analysing: {
        icon: <GitCompare className="mr-2 h-5 w-5 animate-pulse" />,
        text: 'Stress-Testing Strategy...',
        description: 'Identifying strategic gaps'
    },
    architecting: {
        icon: <FileText className="mr-2 h-5 w-5 animate-pulse" />,
        text: 'Architecting Strategic Briefs...',
        description: 'Generating research mandates'
    },
};

// Step progression timing (approximate LLM call duration)
const STEP_DURATION_MS = 6000;

export function ResearchBriefButton({
    onClick,
    isDisabled,
    isLoading,
    dossierCount,
    backlogCount
}: ResearchBriefButtonProps) {
    const [currentStep, setCurrentStep] = useState<PipelineStep>('idle');

    // Progress through pipeline steps when loading
    useEffect(() => {
        if (!isLoading) {
            setCurrentStep('idle');
            return;
        }

        setCurrentStep('auditing');

        const timer1 = setTimeout(() => setCurrentStep('analysing'), STEP_DURATION_MS);
        const timer2 = setTimeout(() => setCurrentStep('architecting'), STEP_DURATION_MS * 2);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
        };
    }, [isLoading]);

    const stepInfo = STEP_CONFIG[currentStep];

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <span tabIndex={0} className={cn("inline-block w-80", isDisabled && "cursor-not-allowed")}>
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
                                    Generate Strategic Research Briefs
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
                        <p>Upload and index at least one <strong>Dossier</strong> and one <strong>Backlog</strong> to unlock Strategic Research.</p>
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
                    <TooltipContent side="bottom" className="max-w-xs text-center p-3">
                        <p className="font-semibold text-indigo-600 mb-2">Supreme Scout Pipeline</p>
                        <div className="text-xs space-y-1.5">
                            <div className={cn(
                                "flex items-center gap-2 px-2 py-1 rounded",
                                currentStep === 'auditing' ? "bg-indigo-50 text-indigo-700 font-medium" : "text-muted-foreground"
                            )}>
                                <span className="w-4">1.</span>
                                <span>Technical Audit</span>
                                {(currentStep === 'analysing' || currentStep === 'architecting') &&
                                    <span className="ml-auto text-green-500">✓</span>}
                            </div>
                            <div className={cn(
                                "flex items-center gap-2 px-2 py-1 rounded",
                                currentStep === 'analysing' ? "bg-indigo-50 text-indigo-700 font-medium" : "text-muted-foreground"
                            )}>
                                <span className="w-4">2.</span>
                                <span>Strategic Gap Analysis</span>
                                {currentStep === 'architecting' &&
                                    <span className="ml-auto text-green-500">✓</span>}
                            </div>
                            <div className={cn(
                                "flex items-center gap-2 px-2 py-1 rounded",
                                currentStep === 'architecting' ? "bg-indigo-50 text-indigo-700 font-medium" : "text-muted-foreground"
                            )}>
                                <span className="w-4">3.</span>
                                <span>Research Brief Generation</span>
                            </div>
                        </div>
                    </TooltipContent>
                )}
            </Tooltip>
        </TooltipProvider>
    );
}
