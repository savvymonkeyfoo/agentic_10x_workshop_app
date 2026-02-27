"use client";

import React, { useState } from 'react';

interface DFVDimension {
    score: number; // 1-5
    justification: string;
}

export interface DFVAssessment {
    desirability: DFVDimension;
    feasibility: DFVDimension;
    viability: DFVDimension;
}

interface StarRatingInputProps {
    label: string;
    dimension: DFVDimension;
    onChange: (update: DFVDimension) => void;
    color: string; // Tailwind color class
}

const StarIcon = ({ filled, onClick }: { filled: boolean; onClick: () => void }) => (
    <button
        onClick={onClick}
        className="focus:outline-none transition-transform duration-150 hover:scale-125 active:scale-90"
    >
        <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill={filled ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="2"
            className={`transition-colors ${filled ? 'text-primary' : 'text-muted hover:text-muted-foreground'}`}
        >
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
        </svg>
    </button>
);

export function StarRatingInput({ label, dimension, onChange, color }: StarRatingInputProps) {
    const [showJustification, setShowJustification] = useState(!!dimension.justification);

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <span className={`text-xs font-bold uppercase tracking-wider ${color}`}>{label}</span>
                <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <StarIcon
                            key={star}
                            filled={star <= dimension.score}
                            onClick={() => onChange({ ...dimension, score: star })}
                        />
                    ))}
                </div>
            </div>

            {/* Justification Toggle */}
            <button
                onClick={() => setShowJustification(!showJustification)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
                <span>{showJustification ? '▼' : '▶'}</span>
                <span>Add justification (optional)</span>
            </button>

            {/* Expandable Justification */}
            <div
                className={`overflow-hidden transition-all duration-200 ${
                    showJustification ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'
                }`}
            >
                <textarea
                    value={dimension.justification}
                    onChange={(e) => onChange({ ...dimension, justification: e.target.value })}
                    placeholder="Why this score?"
                    className="w-full bg-input/50 border border-input rounded-lg p-2 text-xs outline-none focus:ring-2 focus:ring-ring resize-none h-16 text-foreground placeholder:text-muted-foreground"
                />
            </div>
        </div>
    );
}

// Complete DFV Assessment Component
interface DFVAssessmentInputProps {
    value: DFVAssessment;
    onChange: (assessment: DFVAssessment) => void;
}

export function DFVAssessmentInput({ value, onChange }: DFVAssessmentInputProps) {
    return (
        <div className="space-y-4">
            <h3 className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">DFV Assessment</h3>
            <div className="space-y-4 bg-muted/30 rounded-xl p-4 border border-border/50">
                <StarRatingInput
                    label="Desirability"
                    dimension={value.desirability}
                    onChange={(d) => onChange({ ...value, desirability: d })}
                    color="text-rose-500"
                />
                <StarRatingInput
                    label="Feasibility"
                    dimension={value.feasibility}
                    onChange={(f) => onChange({ ...value, feasibility: f })}
                    color="text-emerald-500"
                />
                <StarRatingInput
                    label="Viability"
                    dimension={value.viability}
                    onChange={(v) => onChange({ ...value, viability: v })}
                    color="text-warning"
                />
            </div>
        </div>
    );
}

// Default DFV Assessment
export const DEFAULT_DFV_ASSESSMENT: DFVAssessment = {
    desirability: { score: 0, justification: '' },
    feasibility: { score: 0, justification: '' },
    viability: { score: 0, justification: '' },
};
