"use client";

import React from 'react';

interface DFVDimensionScore {
    score: number;
    justification?: string;
}

interface DFVAssessmentData {
    desirability: DFVDimensionScore | number;
    feasibility: DFVDimensionScore | number;
    viability: DFVDimensionScore | number;
}

interface DFVChartProps {
    scores: DFVAssessmentData | null | undefined;
    className?: string;
    showLegend?: boolean;
}

export function DFVChart({ scores, className = '', showLegend = true }: DFVChartProps) {
    // Extract numeric scores from either {score: n} or raw number
    const getScore = (field: DFVDimensionScore | number | undefined | null): number => {
        if (!field) return 1;
        if (typeof field === 'object' && field?.score !== undefined) return Number(field.score) || 1;
        if (typeof field === 'number') return field;
        return 1;
    };

    const desScore = getScore(scores?.desirability);
    const feasScore = getScore(scores?.feasibility);
    const viaScore = getScore(scores?.viability);

    // Scale factor: score (1-5) maps to opacity (0.2 - 1) and size (35-50)
    const getOpacity = (score: number) => 0.3 + (score / 5) * 0.5;
    const getRadius = (score: number) => 25 + (score / 5) * 10;

    // Circle positions for overlapping Venn
    const circles = [
        { key: 'D', label: 'Desirability', score: desScore, cx: 50, cy: 35, color: '#F43F5E' }, // Rose
        { key: 'F', label: 'Feasibility', score: feasScore, cx: 35, cy: 65, color: '#10B981' },  // Emerald
        { key: 'V', label: 'Viability', score: viaScore, cx: 65, cy: 65, color: '#F59E0B' },    // Amber
    ];

    return (
        <div className={`w-full h-full flex flex-col ${className}`}>
            {/* Venn Diagram */}
            <div className="flex-1 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                    {/* Render circles with blend mode for overlapping effect */}
                    {circles.map((c) => (
                        <g key={c.key}>
                            <circle
                                cx={c.cx}
                                cy={c.cy}
                                r={getRadius(c.score)}
                                fill={c.color}
                                opacity={getOpacity(c.score)}
                                className="transition-all duration-300"
                                style={{ mixBlendMode: 'multiply' }}
                            />
                            {/* Score label */}
                            <text
                                x={c.cx}
                                y={c.cy}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                className="text-[12px] font-bold"
                                fill="white"
                                style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                            >
                                {c.score}
                            </text>
                        </g>
                    ))}

                    {/* Center sweet spot */}
                    <circle
                        cx="50"
                        cy="55"
                        r="6"
                        fill="none"
                        stroke="#1BB1E7"
                        strokeWidth="1.5"
                        strokeDasharray="2 2"
                        opacity="0.7"
                    />
                </svg>
            </div>

            {/* Legend */}
            {showLegend && (
                <div className="flex justify-center gap-3 mt-1">
                    {circles.map((c) => (
                        <div key={c.key} className="flex items-center gap-1">
                            <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: c.color }}
                            />
                            <span className="text-[8px] font-bold text-slate-500">
                                {c.label}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
