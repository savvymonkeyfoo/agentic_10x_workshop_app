'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import {
    SCORING_DIMENSIONS,
    calculateAverageScore,
    getTierFromScore,
    getAllQuestionIds
} from '@/lib/scoring-constants';
import { SpeedometerGauge } from './SpeedometerGauge';
import { Brain, CheckCircle2, ChevronLeft } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

interface ScorecardModalProps {
    cardTitle: string;
    initialScores?: Record<string, number>;
    onSave: (scores: Record<string, number>, averageScore: number, tier: string) => void;
    onClose: () => void;
}

// Pastel color config for 3-step selections
const STEP_STYLES = {
    left: {
        active: 'bg-muted text-foreground border border-border shadow-sm',
        inactive: 'text-muted-foreground hover:text-foreground'
    },
    mid: {
        active: 'bg-info/10 text-info border border-info shadow-sm',
        inactive: 'text-muted-foreground hover:text-foreground'
    },
    right: {
        active: 'bg-warning/10 text-warning border border-warning shadow-sm',
        inactive: 'text-muted-foreground hover:text-foreground'
    }
};

interface Question {
    id: string;
    label: string;
    left: string;
    mid: string;
    right: string;
    leftExplainer: string;
    midExplainer: string;
    rightExplainer: string;
}

// 3-Step Picker Component with Pastel Colors
function ThreeStepPicker({
    value,
    onChange,
    question
}: {
    value: number;
    onChange: (val: number) => void;
    question: Question;
}) {
    const steps = [
        { value: 0, label: question.left, explainer: question.leftExplainer, styleKey: 'left' as const },
        { value: 50, label: question.mid, explainer: question.midExplainer, styleKey: 'mid' as const },
        { value: 100, label: question.right, explainer: question.rightExplainer, styleKey: 'right' as const }
    ];

    // Find active step
    const activeIndex = value <= 25 ? 0 : value <= 75 ? 1 : 2;
    const activeExplainer = steps[activeIndex].explainer;

    return (
        <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">{question.label}</p>

            {/* Toggle Track with Pastel Colors */}
            <div className="flex items-center gap-1 bg-muted/50 rounded-full p-1">
                {steps.map((step, idx) => (
                    <button
                        key={step.value}
                        onClick={() => onChange(step.value)}
                        className={cn(
                            "flex-1 py-2 px-3 rounded-full text-xs font-bold transition-all duration-200",
                            activeIndex === idx
                                ? STEP_STYLES[step.styleKey].active
                                : STEP_STYLES[step.styleKey].inactive
                        )}
                    >
                        {step.label}
                    </button>
                ))}
            </div>

            {/* Explainer Text */}
            <p className="text-xs text-muted-foreground italic pl-1 min-h-[2rem]">
                💡 {activeExplainer}
            </p>
        </div>
    );
}

export function ScorecardModal({ cardTitle, initialScores, onSave, onClose }: ScorecardModalProps) {
    // Initialize all scores to 50 (middle) if not provided
    const [scores, setScores] = useState<Record<string, number>>(() => {
        const allIds = getAllQuestionIds();
        const defaults: Record<string, number> = {};
        allIds.forEach(id => {
            defaults[id] = initialScores?.[id] ?? 50;
        });
        return defaults;
    });

    // Auto-save status
    const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');

    // Calculate live score and tier
    const averageScore = useMemo(() => calculateAverageScore(scores), [scores]);
    const projectedTier = useMemo(() => getTierFromScore(averageScore), [averageScore]);

    // Dynamic header background based on tier
    const headerBg = useMemo(() => {
        if (projectedTier === 'STRATEGIC_BET') return 'bg-warning-subtle0/10';
        if (projectedTier === 'TABLE_STAKES') return 'bg-info-subtle0/10';
        return 'bg-muted/30';
    }, [projectedTier]);

    // Auto-Save Effect with debounce
    useEffect(() => {
        setSaveStatus('saving');
        const timer = setTimeout(() => {
            onSave(scores, averageScore, projectedTier);
            setSaveStatus('saved');
        }, 1000); // 1-second debounce

        return () => clearTimeout(timer);
    }, [scores, averageScore, projectedTier, onSave]);

    const handleSliderChange = (questionId: string, value: number) => {
        setScores(prev => ({
            ...prev,
            [questionId]: value
        }));
    };

    return (
        <div className="flex flex-col h-full max-h-[85vh]">
            {/* Header with Back Button + Speedometer */}
            <div className={cn("pb-4 border-b border-border transition-colors duration-500 rounded-t-lg -m-6 mb-0 p-6", headerBg)}>
                <div className="flex items-center gap-4">
                    {/* Back Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 -ml-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full flex-shrink-0"
                        onClick={onClose}
                        title="Back to Idea Details"
                    >
                        <ChevronLeft size={20} />
                    </Button>

                    {/* Title & Status */}
                    <div className="flex-1 flex justify-between items-start">
                        <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2">
                                <div className="bg-intelligence-subtle0/10 p-1 rounded-md text-intelligence">
                                    <Brain size={16} />
                                </div>
                                <h2 className="text-lg font-bold text-foreground leading-none">Strategic Assessment</h2>
                            </div>
                            {/* Auto-Save Indicator */}
                            <div className="flex items-center gap-2 text-xs text-muted-foreground pl-8">
                                <span className="truncate max-w-[200px]">{cardTitle}</span>
                                <span className="text-border">|</span>
                                {saveStatus === 'saving' ? (
                                    <span className="flex items-center gap-1 text-muted-foreground">
                                        <Spinner size="sm" /> Saving...
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 text-success font-medium">
                                        <CheckCircle2 className="w-3 h-3" /> Auto-saved
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Gauge (Top Right) - Scaled down */}
                        <div className="transform scale-75 origin-top-right -mr-4 -mt-2">
                            <SpeedometerGauge score={averageScore} size={140} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Scrollable Assessment Categories */}
            <div className="flex-1 overflow-y-auto py-4">
                <Accordion type="multiple" defaultValue={SCORING_DIMENSIONS.map(d => d.id)} className="space-y-3">
                    {SCORING_DIMENSIONS.map((dimension) => (
                        <AccordionItem
                            key={dimension.id}
                            value={dimension.id}
                            className="border border-border rounded-lg px-4 bg-card"
                        >
                            <AccordionTrigger className="py-3 hover:no-underline">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-foreground">{dimension.category}</span>
                                    <Badge variant="outline" className="text-xs bg-muted/50 text-muted-foreground">
                                        {dimension.questions.length} factors
                                    </Badge>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="pb-4 space-y-6">
                                {dimension.questions.map((question) => (
                                    <ThreeStepPicker
                                        key={question.id}
                                        value={scores[question.id]}
                                        onChange={(val) => handleSliderChange(question.id, val)}
                                        question={question}
                                    />
                                ))}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </div>
    );
}
