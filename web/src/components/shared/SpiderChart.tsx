"use client";

import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface SpiderChartData {
    value: number;      // 1-5 (High is Good)
    capability: number; // 1-5 (High is Good)
    complexity: number; // 1-5 (Low is Good) -> Invert for Chart
    risk: number;       // 1-5 (Low is Good) -> Invert for Chart
}

interface SpiderChartProps {
    data: SpiderChartData;
    className?: string;
    width?: number;
    height?: number;
    showTooltip?: boolean;
}

export function SpiderChart({ data, className = '', width: _width, height: _height, showTooltip = true }: SpiderChartProps) {
    const getScore = (val: unknown): number => {
        if (typeof val === 'object' && val !== null && 'score' in val) return Number((val as { score: unknown }).score) || 0;
        return Number(val) || 0;
    };

    const safeData = {
        value: getScore(data.value),
        capability: getScore(data.capability),
        complexity: getScore(data.complexity),
        risk: getScore(data.risk)
    };

    // Check for "Virgin State" (All zeros or nulls)
    const isEmpty = !safeData.value && !safeData.capability && !safeData.complexity && !safeData.risk;

    // If empty, show a "Ghost" shape (e.g. all 3s) to hint at structure
    const displayData = isEmpty ? {
        value: 3,
        capability: 3,
        complexity: 3,
        risk: 3
    } : safeData;

    // QUALITATIVE HELPERS
    const getQualitative = (subject: string, val: number) => {
        if (subject.includes('Value')) return val >= 4 ? '(High Value)' : val <= 2 ? '(Low Value)' : '(Medium)';
        if (subject.includes('Capability')) return val >= 4 ? '(Mature)' : val <= 2 ? '(Missing)' : '(Developing)';
        if (subject.includes('Complexity')) return val >= 4 ? '(Hard)' : val <= 2 ? '(Easy)' : '(Moderate)';
        if (subject.includes('Risk')) return val >= 4 ? '(Risky)' : val <= 2 ? '(Safe)' : '(Moderate)';
        return '';
    };

    const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: { subject: string }; value: number }[] }) => {
        if (active && payload && payload.length) {
            const d = payload[0];
            const subject = d.payload.subject;
            const chartVal = d.value;

            const isInverted = subject.includes('Complexity') || subject.includes('Risk');
            const rawVal = isInverted ? 6 - chartVal : chartVal;

            if (isEmpty) return (
                <div className="bg-white/90 backdrop-blur-md p-2 rounded border border-muted text-xs shadow-xl">
                    <span className="text-tertiary italic">No Data</span>
                </div>
            );

            return (
                <div className="bg-white/90 backdrop-blur-md p-3 rounded-xl border border-muted text-xs shadow-xl">
                    <p className="font-bold text-brand-navy mb-1">{subject}</p>
                    <p className="text-secondary">
                        Score: <span className="font-bold">{rawVal}/5</span> <span className="text-tertiary">{getQualitative(subject, rawVal)}</span>
                    </p>
                </div>
            );
        }
        return null;
    };

    const chartData = [
        { subject: 'Value', A: displayData.value, fullMark: 5 },
        { subject: 'Risk', A: 6 - displayData.risk, fullMark: 5 },
        { subject: 'Capability', A: displayData.capability, fullMark: 5 },
        { subject: 'Complexity', A: 6 - displayData.complexity, fullMark: 5 },
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const renderTick = (props: any) => {
        const { payload, x, y, textAnchor } = props;
        const label = payload.value;
        let subLabel = "(Outer: High)";
        if (label === 'Complexity' || label === 'Risk') {
            subLabel = "(Outer: Safe/Easy)";
        }
        return (
            <g transform={`translate(${x},${y})`}>
                <text x={0} y={0} dy={0} textAnchor={textAnchor as "start" | "middle" | "end"} className="fill-slate-900 dark:fill-white" fontSize={10} fontWeight={600}>
                    {label}
                </text>
                <text x={0} y={12} dy={0} textAnchor={textAnchor as "start" | "middle" | "end"} className="fill-slate-500 dark:fill-slate-400" fontSize={8}>
                    {subLabel}
                </text>
            </g>
        );
    };

    return (
        <div className={`w-full h-full transition-opacity duration-500 ${isEmpty ? 'opacity-30' : 'opacity-100'} ${className}`}>
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                    <PolarGrid stroke="var(--glass-border)" />
                    <PolarAngleAxis dataKey="subject" tick={renderTick} />
                    <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} axisLine={false} />
                    <Radar
                        name="Project Profile"
                        dataKey="A"
                        stroke={isEmpty ? "var(--text-secondary)" : "var(--chart-stroke)"}
                        strokeWidth={isEmpty ? 1 : 3}
                        strokeDasharray={isEmpty ? "4 4" : undefined}
                        fill={isEmpty ? "transparent" : "var(--chart-fill)"}
                        fillOpacity={0.6}
                    />
                    {showTooltip && <Tooltip content={<CustomTooltip />} cursor={false} />}
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
}
