"use client";

import React from 'react';
import { SpiderChart } from '@/components/ui/SpiderChart';
import { MiniMatrix } from '@/components/ui/MiniMatrix';
import { motion, AnimatePresence } from 'framer-motion';
import { calculateEfficiencyRatio } from '@/lib/logic/efficiency';

interface StrategicProfileProps {
    data: {
        value: number;
        capability: number;
        complexity: number;
        riskFinal: number;
    }
}

export function StrategicProfile({ data }: StrategicProfileProps) {
    // No state needed anymore - simultaneous display

    const efficiency = calculateEfficiencyRatio(data.value);

    let efficiencyColor = "text-slate-400"; // Default Grey (1.7x - 2.5x)
    if (efficiency >= 10.0) efficiencyColor = "text-yellow-500 drop-shadow-md"; // Gold (10x)
    else if (efficiency >= 4.0) efficiencyColor = "text-brand-blue"; // Blue (4.0x - 7.0x)

    return (
        <div className="glass-panel p-8 flex flex-col items-center relative overflow-hidden h-full">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-radial from-brand-cyan/5 to-transparent pointer-events-none" />

            {/* Header */}
            <div className="w-full flex justify-between items-center mb-4 z-10">
                <h2 className="text-lg font-bold text-brand-navy dark:text-white">Strategic Profile</h2>
            </div>

            {/* Stacked Chart Area */}
            <div className="w-full flex-1 flex flex-col gap-6 overflow-hidden">

                {/* 1. Scale/Shape Analysis (Kite) */}
                <div className="flex-1 min-h-[30vh] relative">
                    <SpiderChart
                        data={{
                            value: data.value,
                            capability: data.capability,
                            complexity: data.complexity,
                            risk: data.riskFinal
                        }}
                    />
                </div>

                {/* 2. Portfolio Position (Matrix) */}
                <div className="flex-1 min-h-[30vh] relative">
                    <MiniMatrix complexity={data.complexity} value={data.value} />
                </div>

            </div>

            {/* Efficiency Ratio Footer */}
            <div className="w-full flex flex-col items-end mt-4 z-10 gap-1">
                <div className="text-right">
                    <div className="text-xs text-slate-400 uppercase tracking-widest">Efficiency Ratio</div>
                    <div className={`text-3xl font-bold transition-colors duration-300 ${efficiencyColor}`}>
                        {efficiency.toFixed(1)}x
                    </div>
                </div>
                <p className="text-[10px] text-slate-400 text-right max-w-[150px] leading-tight opacity-70">
                    Projected ROI Multiplier based on Business Value.
                </p>
            </div>
        </div>
    );
}
