"use client";
import React from 'react';

interface MatrixChartProps {
    x: number; // Complexity (0-5)
    y: number; // Value (0-5)
    className?: string;
}

export function MatrixChart({ x, y, className = '' }: MatrixChartProps) {
    // Enforce 0-5 Scale. 5 = 100%.
    // Clamp between 5% and 95% to keep dot inside box.
    const left = Math.min(95, Math.max(5, (x / 5) * 100));
    const bottom = Math.min(95, Math.max(5, (y / 5) * 100));

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
            <span className="absolute top-1 left-2 text-[6px] font-bold text-slate-300 uppercase">Quick Win</span>
            <span className="absolute top-1 right-2 text-[6px] font-bold text-slate-300 uppercase">Major Bet</span>
            <span className="absolute bottom-1 left-2 text-[6px] font-bold text-slate-300 uppercase">Fill-In</span>
            <span className="absolute bottom-1 right-2 text-[6px] font-bold text-slate-300 uppercase">Deprioritize</span>
            {/* The Dot */}
            <div
                className="absolute w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg transform -translate-x-1/2 translate-y-1/2 transition-all duration-500"
                style={{ left: `${left}%`, bottom: `${bottom}%` }}
            />
        </div>
    );
}
