"use client";

import React from 'react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, ReferenceLine, Cell } from 'recharts';

interface MiniMatrixProps {
    complexity: number; // 0-5
    value: number;      // 0-5
}

export function MiniMatrix({ complexity, value }: MiniMatrixProps) {
    const data = [{ x: complexity, y: value, z: value }];

    // Virgin state check (all 0s)
    const isVirgin = complexity === 0 && value === 0;

    return (
        <div className="w-full h-full bg-white/50 dark:bg-black/20 rounded-xl border border-slate-200 dark:border-slate-700 relative overflow-hidden">
            {/* Background Labels */}
            <div className="absolute inset-0 pointer-events-none flex flex-col p-4">
                <div className="flex-1 flex justify-between items-start">
                    <div className="flex flex-col items-start">
                        <span className="text-[8px] uppercase font-bold text-slate-300">Quick Win</span>
                        <span className="text-[6px] text-slate-400">High Val, Low Cplx</span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[8px] uppercase font-bold text-slate-300">Major Project</span>
                        <span className="text-[6px] text-slate-400">High Val, High Cplx</span>
                    </div>
                </div>
                <div className="flex-1 flex justify-between items-end">
                    <div className="flex flex-col items-start">
                        <span className="text-[8px] uppercase font-bold text-slate-300">Tactical</span>
                        <span className="text-[6px] text-slate-400">Low Val, Low Cplx</span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[8px] uppercase font-bold text-slate-300">Deprioritise</span>
                        <span className="text-[6px] text-slate-400">Low Val, High Cplx</span>
                    </div>
                </div>
            </div>

            <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <XAxis type="number" dataKey="x" name="Complexity" domain={[1, 5]} hide padding={{ left: 10, right: 10 }} />
                    <YAxis type="number" dataKey="y" name="Value" domain={[1, 5]} hide padding={{ top: 10, bottom: 10 }} />
                    <ZAxis type="number" dataKey="z" range={[50, 400]} />

                    {/* Quadrant Lines */}
                    <ReferenceLine x={3} stroke="#1BB1E7" strokeDasharray="3 3" strokeOpacity={0.5} />
                    <ReferenceLine y={3} stroke="#1BB1E7" strokeDasharray="3 3" strokeOpacity={0.5} />

                    <Scatter name="Current Opportunity" data={data}>
                        <Cell fill={isVirgin ? 'transparent' : 'var(--brand-blue)'} stroke={isVirgin ? 'var(--text-secondary)' : 'none'} />
                    </Scatter>
                </ScatterChart>
            </ResponsiveContainer>

            {isVirgin && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-4 h-4 rounded-full border-2 border-dashed border-slate-400 opacity-50"></div>
                </div>
            )}
        </div>
    );
}
