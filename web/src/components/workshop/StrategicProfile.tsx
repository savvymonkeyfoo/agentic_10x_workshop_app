"use client";

import React from 'react';
import { SpiderChart } from '@/components/shared/SpiderChart';
import { MiniMatrix } from '@/components/ui/MiniMatrix';
import { VennDiagram } from '@/components/ui/VennDiagram';
import { DFVAssessment, DEFAULT_DFV_ASSESSMENT } from '@/components/ui/DFVAssessmentInput';
import { calculateEfficiencyRatio } from '@/lib/logic/efficiency';

interface StrategicProfileProps {
    data: {
        value: number;
        capability: number;
        complexity: number;
        riskFinal: number;
    };
    dfvAssessment?: DFVAssessment;
}

export function StrategicProfile({ data, dfvAssessment = DEFAULT_DFV_ASSESSMENT }: StrategicProfileProps) {
    const efficiency = calculateEfficiencyRatio(data.value);

    let efficiencyColor = "text-muted-foreground"; // Default Grey (1.7x - 2.5x)
    if (efficiency >= 10.0) efficiencyColor = "text-warning drop-shadow-md"; // Gold (10x)
    else if (efficiency >= 4.0) efficiencyColor = "text-primary"; // Blue (4.0x - 7.0x)

    return (
        <div className="bg-card/30 backdrop-blur p-8 flex flex-col items-center relative overflow-hidden h-full rounded-xl border border-border">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-radial from-primary/5 to-transparent pointer-events-none" />

            {/* Header */}
            <div className="w-full flex justify-between items-center mb-4 z-10">
                <h2 className="text-lg font-bold text-foreground">Strategic Profile</h2>
            </div>

            {/* Stacked Chart Area */}
            <div className="w-full flex-1 flex flex-col gap-4 overflow-hidden">

                {/* 1. Scale/Shape Analysis (Kite) */}
                <div className="flex-1 min-h-[25vh] relative">
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
                <div className="flex-1 min-h-[20vh] relative">
                    <MiniMatrix complexity={data.complexity} value={data.value} />
                </div>

                {/* 3. DFV Assessment (Venn) */}
                <div className="flex-1 min-h-[20vh] relative">
                    <VennDiagram data={dfvAssessment} />
                </div>

            </div>

            {/* Efficiency Ratio Footer */}
            <div className="w-full flex flex-col items-end mt-4 z-10 gap-1">
                <div className="text-right">
                    <div className="text-xs text-muted-foreground uppercase tracking-widest">Efficiency Ratio</div>
                    <div className={`text-3xl font-bold transition-colors duration-300 ${efficiencyColor}`}>
                        {efficiency.toFixed(1)}x
                    </div>
                </div>
                <p className="text-[10px] text-muted-foreground text-right max-w-[150px] leading-tight opacity-70">
                    Projected ROI Multiplier based on Business Value.
                </p>
            </div>
        </div>
    );
}
