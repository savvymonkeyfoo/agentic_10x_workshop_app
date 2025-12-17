import React from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const DfvChartSmall = ({ data }: { data: any }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getScore = (val: any) => {
        if (typeof val === 'object' && val !== null && 'score' in val) return Number(val.score) || 0;
        return Number(val) || 0;
    };

    // Default scores 
    const d = getScore(data.scoreDesirability);
    const f = getScore(data.scoreFeasibility);
    const v = getScore(data.scoreViability);

    return (
        <div className="flex h-full w-full flex-col justify-between">
            {/* 1. CHART AREA - Force it to take available space */}
            <div className="flex flex-1 items-center justify-center overflow-hidden">
                {/* ViewBox 0 0 140 130 matches the 'Good' Business Case proportions */}
                <svg viewBox="0 0 140 130" className="h-full w-auto max-h-[90px]">
                    {/* Desirability (Top Center) - Rose */}
                    <circle cx="70" cy="45" r="30" fill="#f43f5e" className="opacity-80 mix-blend-multiply" />
                    <text x="70" y="42" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">{d}</text>
                    {/* Feasibility (Bottom Left) - Emerald */}
                    <circle cx="50" cy="80" r="30" fill="#10b981" className="opacity-80 mix-blend-multiply" />
                    <text x="48" y="85" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">{f}</text>
                    {/* Viability (Bottom Right) - Amber */}
                    <circle cx="90" cy="80" r="30" fill="#f59e0b" className="opacity-80 mix-blend-multiply" />
                    <text x="92" y="85" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">{v}</text>
                </svg>
            </div>
            {/* 2. LEGEND - Simple Row at Bottom */}
            <div className="mt-1 flex w-full items-center justify-center gap-3">
                <div className="flex items-center gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                    <span className="text-[9px] font-bold text-gray-500 uppercase">Desirability</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[9px] font-bold text-gray-500 uppercase">Feasibility</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    <span className="text-[9px] font-bold text-gray-500 uppercase">Viability</span>
                </div>
            </div>
        </div>
    );
};
