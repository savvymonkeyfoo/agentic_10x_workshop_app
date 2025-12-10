"use client";

import React from 'react';
import { DFVAssessment } from './DFVAssessmentInput';

interface VennDiagramProps {
    data: DFVAssessment;
}

export function VennDiagram({ data }: VennDiagramProps) {
    // Scale factor: score (1-5) maps to opacity (0.2 - 1) and size (40-60)
    const getOpacity = (score: number) => 0.2 + (score / 5) * 0.6;
    const getRadius = (score: number) => 35 + (score / 5) * 15;

    // Circle positions for overlapping Venn
    const circles = [
        { key: 'D', label: 'D', score: data.desirability.score, cx: 70, cy: 50, color: '#F43F5E' }, // Rose
        { key: 'F', label: 'F', score: data.feasibility.score, cx: 50, cy: 85, color: '#10B981' },  // Emerald
        { key: 'V', label: 'V', score: data.viability.score, cx: 90, cy: 85, color: '#F59E0B' },    // Amber
    ];

    return (
        <div className="w-full h-full bg-white/50 dark:bg-black/20 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col">
            {/* Header */}
            <div className="px-4 py-2 border-b border-slate-200/50 dark:border-slate-700/50">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">DFV Assessment</h3>
            </div>

            {/* Venn Diagram */}
            <div className="flex-1 flex items-center justify-center p-4">
                <svg viewBox="0 0 140 130" className="w-full h-full max-w-[200px]">
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
                                className="text-[14px] font-bold fill-white"
                                style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                            >
                                {c.score}
                            </text>
                        </g>
                    ))}

                    {/* Center sweet spot */}
                    <circle
                        cx="70"
                        cy="73"
                        r="8"
                        fill="none"
                        stroke="#1BB1E7"
                        strokeWidth="2"
                        strokeDasharray="3 2"
                        opacity="0.7"
                    />
                </svg>
            </div>

            {/* Legend */}
            <div className="px-4 py-2 border-t border-slate-200/50 dark:border-slate-700/50 flex justify-around">
                {circles.map((c) => (
                    <div key={c.key} className="flex items-center gap-1">
                        <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: c.color, opacity: getOpacity(c.score) }}
                        />
                        <span className="text-[9px] font-bold text-slate-500">
                            {c.label === 'D' ? 'Desirability' : c.label === 'F' ? 'Feasibility' : 'Viability'}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
