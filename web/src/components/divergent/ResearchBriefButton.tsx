'use client';

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Brain, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResearchBriefButtonProps {
    onClick: () => void;
    isDisabled: boolean;
    isLoading: boolean;
    dossierCount: number;
    backlogCount: number;
}

export function ResearchBriefButton({
    onClick,
    isDisabled,
    isLoading,
    dossierCount,
    backlogCount
}: ResearchBriefButtonProps) {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <span tabIndex={0} className={cn("inline-block w-64", isDisabled && "cursor-not-allowed")}>
                        <Button
                            size="lg"
                            className={cn(
                                "w-full font-bold text-white shadow-lg transition-all duration-300",
                                "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500",
                                !isDisabled && "hover:-translate-y-0.5 hover:shadow-xl",
                                isDisabled && "opacity-50 grayscale"
                            )}
                            disabled={isDisabled || isLoading}
                            onClick={onClick}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Consulting...
                                </>
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
            </Tooltip>
        </TooltipProvider>
    );
}
