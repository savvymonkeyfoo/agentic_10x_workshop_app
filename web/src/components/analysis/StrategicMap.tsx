'use client';
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface Opportunity {
    id: string;
    projectName: string;
    scoreValue: number;
    scoreComplexity: number;
    sequenceRank: number | null;
    benefitRevenue: number;
    benefitCostAvoidance: number;
}

const resolveCollisions = (nodes: Opportunity[], width: number, height: number) => {
    // CONFIG:
    const paddingSide = 80;
    const paddingBottom = 60;
    const paddingTop = 160; // Dedicated "Airspace" for cards at the top

    const effectiveWidth = width - (paddingSide * 2);
    const effectiveHeight = height - (paddingTop + paddingBottom);
    const minDistance = 140;

    // 1. Map Scores to Pixel Coordinates
    const solved = nodes.map(node => {
        const impact = (node.benefitRevenue || 0) + (node.benefitCostAvoidance || 0);
        // Log Scale for Radius: 30px to 80px
        const logValue = impact > 0 ? Math.log10(impact) : 0;
        const radius = impact === 0 ? 30 : Math.max(30, Math.min(80, (logValue * 11)));

        return {
            ...node,
            // X Mapping
            x: (node.scoreComplexity / 5) * effectiveWidth + paddingSide,
            // Y Mapping (Inverted + Top Offset)
            y: (1 - (node.scoreValue / 5)) * effectiveHeight + paddingTop,
            r: radius,
            impactLabel: impact > 1000000 ? `$${(impact / 1000000).toFixed(1)}M` : `$${(impact / 1000).toFixed(0)}k`
        };
    });

    // 2. Physics Nudge
    for (let i = 0; i < solved.length; i++) {
        for (let j = i + 1; j < solved.length; j++) {
            const a = solved[i];
            const b = solved[j];
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < minDistance) {
                const angle = Math.atan2(dy, dx);
                const nudge = (minDistance - dist) / 2;
                a.x += Math.cos(angle) * nudge;
                a.y += Math.sin(angle) * nudge;
                b.x -= Math.cos(angle) * nudge;
                b.y -= Math.sin(angle) * nudge;
            }
        }
    }
    return solved;
};

export default function StrategicMap({ opportunities }: { opportunities: Opportunity[] }) {
    const width = 1000;
    const height = 750; // Increased Height for breathing room

    const processedData = useMemo(() => {
        const valid = opportunities.filter(o => o.scoreValue !== null);
        const resolved = resolveCollisions(valid, width, height);
        return resolved.sort((a, b) => (a.sequenceRank || 99) - (b.sequenceRank || 99));
    }, [opportunities]);

    const pathData = processedData
        .filter(d => d.sequenceRank && d.sequenceRank < 90)
        .map((d, i) => (i === 0 ? `M ${d.x} ${d.y}` : `L ${d.x} ${d.y}`))
        .join(' ');

    const getBubbleColor = (rank: number | null) => {
        if (rank === 1) return '#10b981';
        if (rank === 2) return '#3b82f6';
        if (rank === 3) return '#8b5cf6';
        return '#64748b';
    };

    return (
        // CONTAINER: overflow-visible allowed, but we rely on internal padding now.
        <div className="w-full h-full bg-slate-50/50 rounded-xl border border-slate-200 relative shadow-inner overflow-visible">

            {/* --- HTML OVERLAY LAYER --- */}
            {processedData.map((node, i) => {
                // Smart Anchoring Logic
                const isFarLeft = node.x < 200;
                const isFarRight = node.x > 800;

                // Default: Center (-50%). Left: (0%). Right: (-100%)
                let xTranslate = '-50%';
                let textAlign = 'text-center';
                let beakPos = 'left-1/2 -ml-[6px]'; // Center beak

                if (isFarLeft) {
                    xTranslate = '-10%'; // Slight offset from exact edge
                    textAlign = 'text-left';
                    beakPos = 'left-[10%]';
                } else if (isFarRight) {
                    xTranslate = '-90%';
                    textAlign = 'text-right';
                    beakPos = 'left-[90%]';
                }

                return (
                    <motion.div
                        key={`card-${node.id}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + (i * 0.1) }}
                        className="absolute z-50 flex flex-col pointer-events-none"
                        style={{
                            left: node.x,
                            top: node.y - node.r - 20,
                            transform: `translate(${xTranslate}, -100%)`,
                            width: '240px',
                            alignItems: isFarLeft ? 'flex-start' : (isFarRight ? 'flex-end' : 'center')
                        }}
                    >
                        <div className={`bg-white rounded-lg shadow-xl border border-slate-200 p-3 w-full h-auto ${textAlign}`}>
                            <div className="text-slate-800 font-bold text-xs leading-snug line-clamp-4">
                                {node.projectName}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-2 font-mono border-t border-slate-100 pt-1">
                                {node.impactLabel} Impact
                            </div>
                        </div>

                        {/* Smart Beak: Position changes based on anchor */}
                        <div className={`w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-white filter drop-shadow-sm -mt-[1px] relative ${beakPos}`}></div>
                    </motion.div>
                );
            })}

            {/* --- SVG LAYER --- */}
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-h-[600px] absolute inset-0 overflow-visible">
                <defs>
                    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                        <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.1" />
                    </filter>
                </defs>

                {/* Grid */}
                <g opacity="0.1">
                    {[0.5].map(p => <line key={`v-${p}`} x1={width * p} y1="0" x2={width * p} y2={height} stroke="black" strokeWidth="2" strokeDasharray="5 5" />)}
                    {[0.5].map(p => <line key={`h-${p}`} x1="0" y1={height * p} x2={width} y2={height * p} stroke="black" strokeWidth="2" strokeDasharray="5 5" />)}
                </g>

                {/* Quadrant Labels */}
                <text x="30" y="40" fill="#94a3b8" fontSize="12" fontWeight="700" letterSpacing="1" textAnchor="start">QUICK WINS</text>
                <text x={width - 30} y="40" fill="#94a3b8" fontSize="12" fontWeight="700" letterSpacing="1" textAnchor="end">MAJOR PROJECTS</text>
                <text x="30" y={height - 30} fill="#94a3b8" fontSize="12" fontWeight="700" letterSpacing="1" textAnchor="start">FILL-INS</text>
                <text x={width - 30} y={height - 30} fill="#94a3b8" fontSize="12" fontWeight="700" letterSpacing="1" textAnchor="end">DEPRIORITISE</text>

                {/* Path */}
                <path d={pathData} fill="none" stroke="#94a3b8" strokeWidth="2" strokeDasharray="6 6" />

                {/* Bubbles */}
                {processedData.map((node, i) => (
                    <g key={node.id}>
                        <line x1={node.x} y1={node.y} x2={node.x} y2={node.y - node.r - 20} stroke="#cbd5e1" strokeWidth="2" />
                        <motion.circle
                            initial={{ r: 0 }} animate={{ r: node.r }} transition={{ delay: i * 0.1 }}
                            cx={node.x} cy={node.y}
                            fill={getBubbleColor(node.sequenceRank)}
                            stroke="white" strokeWidth="3"
                            className="cursor-pointer hover:opacity-90"
                        />
                        {node.sequenceRank && (
                            <text x={node.x} y={node.y + 7} textAnchor="middle" fill="white" fontWeight="800" fontSize="20">
                                {node.sequenceRank}
                            </text>
                        )}
                    </g>
                ))}
            </svg>
        </div>
    );
}
