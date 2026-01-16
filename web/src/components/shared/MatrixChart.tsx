"use client";
import React from 'react';

interface MatrixChartProps {
    x: number; // Complexity (0-5)
    y: number; // Value (0-5)
    className?: string;
}

export function MatrixChart({ x, y, className = '' }: MatrixChartProps) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getScore = (val: any) => {
        if (typeof val === 'object' && val !== null && 'score' in val) return Number(val.score) || 0;
        return Number(val) || 0;
    };

    const valX = getScore(x);
    const valY = getScore(y);

    // Enforce 0-5 Scale. 5 = 100%.
    // Clamp between 5% and 95% to keep dot inside box.
    const left = Math.min(95, Math.max(5, (valX / 5) * 100));
    const bottom = Math.min(95, Math.max(5, (valY / 5) * 100));

    return (
        <div className={`w-full h-full relative border border-slate-200 bg-white rounded-lg ${className}`}>
            {/* Quadrants */}
            <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
                <div className="border-r border-b border-dashed border-slate-100" />
                <div className="border-b border-dashed border-slate-100" />
                <div className="border-r border-dashed border-slate-100" />
                <div />
            </div>
            {/* Labels */}
            {/* Labels */}
            <div className="absolute top-1 left-2 flex flex-col items-start">
                <span className="text-[7px] font-bold text-gray-900 uppercase">Quick Win</span>
                <span className="text-[6px] text-gray-500">High Val, Low Cplx</span>
            </div>
            <div className="absolute top-1 right-2 flex flex-col items-end">
                <span className="text-[7px] font-bold text-gray-900 uppercase">Major Project</span>
                <span className="text-[6px] text-gray-500">High Val, High Cplx</span>
            </div>
            <div className="absolute bottom-1 left-2 flex flex-col items-start">
                <span className="text-[7px] font-bold text-gray-900 uppercase">Tactical</span>
                <span className="text-[6px] text-gray-500">Low Val, Low Cplx</span>
            </div>
            <div className="absolute bottom-1 right-2 flex flex-col items-end">
                <span className="text-[7px] font-bold text-gray-900 uppercase">Deprioritise</span>
                <span className="text-[6px] text-gray-500">Low Val, High Cplx</span>
            </div>
            {/* The Dot */}
            <div
                className="absolute w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg transform -translate-x-1/2 translate-y-1/2 transition-all duration-500"
                style={{ left: `${left}%`, bottom: `${bottom}%` }}
            />
        </div>
    );
}
