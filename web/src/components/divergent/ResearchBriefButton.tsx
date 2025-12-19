'use client';

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Brain, Sparkles, Loader2, FileSearch, GitCompare, FileText, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';

export type PipelineStep = 'idle' | 'auditing' | 'analysing' | 'architecting';
export type ThinkingLevel = 'minimal' | 'low' | 'medium' | 'high';

interface ResearchBriefButtonProps {
    onClick: () => void;
    isDisabled: boolean;
    isLoading: boolean;
    dossierCount: number;
    backlogCount: number;
    thinkingLevel?: ThinkingLevel;
}

const STEP_CONFIG: Record<PipelineStep, { icon: React.ReactNode; text: string; description: string }> = {
    idle: { icon: null, text: '', description: '' },
    auditing: {
        icon: <FileSearch className="mr-2 h-5 w-5 animate-pulse" />,
        text: 'Extracting Enterprise DNA...',
        description: 'Gemini 3 Flash analyzing documents'
    },
    analysing: {
        icon: <GitCompare className="mr-2 h-5 w-5 animate-pulse" />,
        text: 'Stress-Testing Strategy...',
        description: 'Gemini 3 Pro Deep Think active'
    },
    architecting: {
        icon: <FileText className="mr-2 h-5 w-5 animate-pulse" />,
        text: 'Architecting Strategic Briefs...',
        description: 'Generating research mandates'
    },
};

const THINKING_LABELS: Record<ThinkingLevel, { label: string; color: string }> = {
    minimal: { label: 'Fast', color: 'text-yellow-500' },
    low: { label: 'Standard', color: 'text-blue-400' },
    medium: { label: 'Deep', color: 'text-indigo-500' },
    high: { label: 'Maximum', color: 'text-purple-500' },
};

// Step progression timing (approximate LLM call duration)
const STEP_DURATION_MS = 8000; // Increased for Gemini 3 Pro Deep Think

export function ResearchBriefButton({
    onClick,
    isDisabled,
    isLoading,
    dossierCount,
    backlogCount,
    thinkingLevel = 'high'
}: ResearchBriefButtonProps) {
    const [currentStep, setCurrentStep] = useState<PipelineStep>('idle');
    const [showWarning, setShowWarning] = useState(false);

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
    const thinkingInfo = THINKING_LABELS[thinkingLevel];

    const startGeneration = () => {
        onClick();
    };

    const handleGenerateClick = () => {
        if (isDisabled || isLoading) return;

        // Guardrail: If briefs exist, warn user before overwriting
        if (dossierCount > 0) {
            setShowWarning(true);
            return;
        }

        // Proceed if no data
        startGeneration();
    };

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
                            onClick={handleGenerateClick}
                        >
                            {isLoading ? (
                                <div className="flex items-center">
                                    {stepInfo.icon || <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                                    <div className="flex flex-col items-start">
                                        <span className="text-sm">{stepInfo.text}</span>
                                        {currentStep === 'architecting' && (
                                            <span className="text-xs opacity-75 flex items-center gap-1">
                                                <Zap className="h-3 w-3" />
                                                Thinking: {thinkingInfo.label}
                                            </span>
                                        )}
                                    </div>
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
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <Brain className="h-4 w-4 text-indigo-600" />
                            <span className="font-semibold text-indigo-600">Gemini 3 Supreme Scout</span>
                        </div>
                        <div className="text-xs space-y-1.5">
                            <div className={cn(
                                "flex items-center gap-2 px-2 py-1 rounded",
                                currentStep === 'auditing' ? "bg-indigo-50 text-indigo-700 font-medium" : "text-muted-foreground"
                            )}>
                                <span className="w-4">1.</span>
                                <span>Technical Audit</span>
                                <span className="ml-auto text-xs opacity-60">Flash</span>
                                {(currentStep === 'analysing' || currentStep === 'architecting') &&
                                    <span className="text-green-500">✓</span>}
                            </div>
                            <div className={cn(
                                "flex items-center gap-2 px-2 py-1 rounded",
                                currentStep === 'analysing' ? "bg-indigo-50 text-indigo-700 font-medium" : "text-muted-foreground"
                            )}>
                                <span className="w-4">2.</span>
                                <span>Strategic Gap Analysis</span>
                                <span className="ml-auto text-xs opacity-60">Pro</span>
                                {currentStep === 'architecting' &&
                                    <span className="text-green-500">✓</span>}
                            </div>
                            <div className={cn(
                                "flex items-center gap-2 px-2 py-1 rounded",
                                currentStep === 'architecting' ? "bg-indigo-50 text-indigo-700 font-medium" : "text-muted-foreground"
                            )}>
                                <span className="w-4">3.</span>
                                <span>Research Brief Generation</span>
                                <span className="ml-auto text-xs opacity-60">Pro</span>
                            </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-center gap-1.5 text-xs">
                            <Zap className={cn("h-3 w-3", thinkingInfo.color)} />
                            <span className="text-muted-foreground">Thinking:</span>
                            <span className={cn("font-medium", thinkingInfo.color)}>{thinkingInfo.label}</span>
                        </div>
                    </TooltipContent>
                )}
            </Tooltip>
        </TooltipProvider>
    );
}
