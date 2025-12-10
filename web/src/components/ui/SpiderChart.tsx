"use client";

import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface SpiderChartProps {
    data: {
        value: number;      // 1-5 (High is Good)
        capability: number; // 1-5 (High is Good)
        complexity: number; // 1-5 (Low is Good) -> Invert for Chart
        risk: number;       // 1-5 (Low is Good) -> Invert for Chart
    }
}

export function SpiderChart({ data }: SpiderChartProps) {

    // LOGIC: The "Kite" Deformity
    // Value/Capability: 5 is Outer Edge (Good)
    // Risk/Complexity: 1 is Outer Edge (Good) which means 5 must be Center.
    // We need to normalize everything to "Goodness" scale for the visual "Kite" shape.
    // 
    // Let "Chart Score" be 0..5 where 5 is Outer Edge.
    // Value/Cap: Chart = Input
    // Risk/Comp: Chart = 6 - Input (See Design System 3.2: "5 -> center, 0 -> outer edge" wait. 
    // PRD 3.2 says: "Value/Capability Axis: 0 -> center, 5 -> outer edge."
    // "Risk/Cost Axis: 5 -> center, 0 -> outer edge."
    // So if Risk is 5 (Bad), it should be at Center (0 radius).
    // If Risk is 1 (Good), it should be at Outer Edge (5 radius).
    // Formula: ChartValue = 6 - Risk. (If Risk 5 -> 1... wait. If Risk 5 -> Center(0).
    // So Formula: ChartValue = 5 - Risk ?? 
    // Let's re-read carefully: "5 -> center (Radius 0?), 0 -> outer edge (Radius 5?)".
    // If Risk is 1 (Low Risk), it should be "Good" i.e. Outer Edge.
    // Risk 5 (High Risk) -> Center.
    // So we invert: ChartValue = 6 - Risk. (Risk 1 -> 5. Risk 5 -> 1).
    // The scale is 1-5.

    // Check for "Virgin State" (All zeros or nulls)
    const isEmpty = !data.value && !data.capability && !data.complexity && !data.risk;

    // If empty, show a "Ghost" shape (e.g. all 3s) to hint at structure
    const displayData = isEmpty ? {
        value: 3,
        capability: 3,
        complexity: 3, // Inverted logic below handles this, so inputting 3 results in mid-point
        risk: 3
    } : data;

    // QUALITATIVE HELPERS
    const getQualitative = (subject: string, val: number) => {
        // val is the raw 1-5 score, BUT for Risk/Comp we inverted it for the chart.
        // We must interpret the *original* meaning.

        // Wait. chartData uses 6 - val. 
        // We should pass the ORIGINAL data to the tooltip if possible, or recalculate.
        // Let's pass the raw data in the payload.

        if (subject.includes('Value')) return val >= 4 ? '(High Value)' : val <= 2 ? '(Low Value)' : '(Medium)';
        if (subject.includes('Capability')) return val >= 4 ? '(Mature)' : val <= 2 ? '(Missing)' : '(Developing)';

        // Risk/Complexity: Raw 5 is Bad. Raw 1 is Good.
        if (subject.includes('Complexity')) return val >= 4 ? '(Hard)' : val <= 2 ? '(Easy)' : '(Moderate)';
        if (subject.includes('Risk')) return val >= 4 ? '(Risky)' : val <= 2 ? '(Safe)' : '(Moderate)';

        return '';
    };

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0];
            const subject = data.payload.subject;
            const chartVal = data.value;

            // Revert the inversion for display
            const isInverted = subject.includes('Complexity') || subject.includes('Risk');
            const rawVal = isInverted ? 6 - chartVal : chartVal;

            // Handle Ghost Logic display (if 3 was placeholder)
            if (isEmpty) return (
                <div className="bg-white/90 backdrop-blur-md p-2 rounded border border-slate-200 text-xs shadow-xl">
                    <span className="text-slate-400 italic">No Data</span>
                </div>
            );

            return (
                <div className="bg-white/90 backdrop-blur-md p-3 rounded-xl border border-slate-200 text-xs shadow-xl">
                    <p className="font-bold text-brand-navy mb-1">{subject}</p>
                    <p className="text-slate-600">
                        Score: <span className="font-bold">{rawVal}/5</span> <span className="text-slate-400">{getQualitative(subject, rawVal)}</span>
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

    // Helper for custom tick
    const renderTick = (props: any) => {
        const { payload, x, y, textAnchor, stroke, radius } = props;

        // Split label logic
        // We want to add context. 
        let label = payload.value;
        let subLabel = "(Outer: High)";

        if (label === 'Complexity' || label === 'Risk') {
            subLabel = "(Outer: Safe/Easy)";
        }

        return (
            <g transform={`translate(${x},${y})`}>
                {/* Primary Label - Deep Navy (Ink) */}
                <text x={0} y={0} dy={0} textAnchor={textAnchor} className="fill-slate-900 dark:fill-white" fontSize={10} fontWeight={600}>
                    {label}
                </text>
                {/* Sub Label - Slate 500 */}
                <text x={0} y={12} dy={0} textAnchor={textAnchor} className="fill-slate-500 dark:fill-slate-400" fontSize={8}>
                    {subLabel}
                </text>
            </g>
        );
    };

    return (
        <div className={`w-full h-64 transition-opacity duration-500 ${isEmpty ? 'opacity-30' : 'opacity-100'}`}>
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
                    <Tooltip content={<CustomTooltip />} cursor={false} />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
}
