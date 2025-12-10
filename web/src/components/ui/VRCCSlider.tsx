"use client";

import React, { useRef, useEffect, useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';

interface VRCCSliderProps {
    label: string;
    value: number; // 1-5
    onChange?: (val: number) => void;
    disabled?: boolean;
}

const RUBRICS: Record<string, Record<number, string>> = {
    'Value': {
        1: 'Minor Admin Save (<$10k)',
        2: 'Local Efficiency',
        3: 'Significant Efficiency (>$50k)',
        4: 'Revenue Enabler',
        5: 'Transformational / New Revenue Model'
    },
    'Risk': {
        1: 'Read-Only / Public Data (Safe)',
        2: 'Internal Data / No PII',
        3: 'Human-in-the-Loop Required',
        4: 'Financial/PII Impact',
        5: 'Fully Autonomous / External (High Risk)'
    },
    'Capability': {
        1: 'Greenfield / Missing (No Data, No Infra)',
        2: 'Ad-Hoc (Unstructured Data, No Observability)',
        3: 'Foundational (APIs Available, Basic Logging)',
        4: 'Agent-Ready (MCP Connected, Structured Ops)',
        5: 'Optimised (Full AIOps / Observability Suite)'
    },
    'Complexity': {
        1: 'Simple Prompt / No Code',
        2: 'Low Code / Single Integration',
        3: 'Multiple Integrations',
        4: 'New Infrastructure Required',
        5: 'R&D / Custom Model Training'
    }
};

export function VRCCSlider({ label, value, onChange, disabled = false }: VRCCSliderProps) {
    const constraintsRef = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(0);

    // Map 1-5 value to pixel position
    // We'll calculate this dynamically based on container width

    useEffect(() => {
        if (constraintsRef.current) {
            setWidth(constraintsRef.current.offsetWidth);
        }
    }, []);

    // Helper: Percentage for value (1..5) -> 0..100%
    const getPercent = (val: number) => ((val - 1) / 4) * 100;

    // Get current rubric text
    // We try to match the label exactly, or default to empty if not found.
    // The InputCanvas passes "Value", "Risk", "Capability", "Complexity" labels exactly.
    const rubricText = RUBRICS[label]?.[value] || '';

    return (
        <div className="w-full mb-6">
            <div className="flex justify-between mb-2 items-baseline">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span>
                <div className="text-right">
                    <span className="text-sm font-bold text-brand-navy">{value} / 5</span>
                </div>
            </div>

            {/* Track Container */}
            <div className="relative h-4 rounded-full bg-slate-200" ref={constraintsRef}>

                {/* Fill Gradient */}
                <div
                    className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-brand-blue to-brand-cyan"
                    style={{ width: `${getPercent(value)}%` }}
                />



                {/* User Thumb (Interactive) */}
                {!disabled && (
                    <input
                        type="range"
                        min="1"
                        max="5"
                        step="1"
                        value={value}
                        onChange={(e) => onChange && onChange(parseInt(e.target.value))}
                        className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer z-20"
                    />
                )}

                {/* Visual Thumb for User */}
                <div
                    className="absolute top-1/2 -ml-3 w-6 h-6 rounded-full bg-white shadow-md border border-slate-200 pointer-events-none z-10"
                    style={{
                        left: `${getPercent(value)}%`,
                        transform: 'translateY(-50%)'
                    }}
                />

            </div>

            {/* Rubric Label (Dynamic) */}
            <div className="mt-2 text-center h-4">
                <span key={value} className="text-xs font-medium text-brand-blue animate-in fade-in slide-in-from-top-1 duration-200 block">
                    {rubricText}
                </span>
            </div>

            {/* Ticks */}
            <div className="flex justify-between mt-1 px-1">
                {[1, 2, 3, 4, 5].map(tick => (
                    <div key={tick} className="flex flex-col items-center">
                        <div className="h-1 w-px bg-slate-300 mb-1"></div>
                        <span className="text-[10px] text-slate-400">{tick}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
