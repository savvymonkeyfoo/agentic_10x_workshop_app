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
    // Computed for layout
    x?: number;
    y?: number;
    r?: number;
    impactLabel?: string;
    cardX?: number;
    cardY?: number;
}

const resolveCollisions = (nodes: Opportunity[], width: number, height: number) => {
    // CONFIG:
    const paddingSide = 100;
    const paddingBottom = 80;
    const paddingTop = 160;

    const effectiveWidth = width - (paddingSide * 2);
    const effectiveHeight = height - (paddingTop + paddingBottom);

    // Card Dimensions
    const CARD_W = 180;
    const CARD_H = 80;
    const PADDING = 20;

    // 1. Map Scores to Pixel Coordinates
    const solved = nodes.map(node => {
        const impact = (node.benefitRevenue || 0) + (node.benefitCostAvoidance || 0);
        return {
            ...node,
            x: (node.scoreComplexity / 5) * effectiveWidth + paddingSide,
            y: (1 - (node.scoreValue / 5)) * effectiveHeight + paddingTop,
            impactLabel: impact > 1000000 ? `$${(impact / 1000000).toFixed(1)}M` : `$${(impact / 1000).toFixed(0)}k`
        };
    });

    // 2. Card Collision (Rectangle Physics)
    const iterations = 50;
    for (let k = 0; k < iterations; k++) {
        const alpha = 1 - (k / iterations);

        for (let i = 0; i < solved.length; i++) {
            for (let j = i + 1; j < solved.length; j++) {
                const a = solved[i];
                const b = solved[j];

                const dx = a.x - b.x;
                const dy = a.y - b.y;
                const distX = Math.abs(dx);
                const distY = Math.abs(dy);

                const minW = CARD_W + PADDING;
                const minH = CARD_H + PADDING;

                if (distX < minW && distY < minH) {
                    const overlapX = minW - distX;
                    const overlapY = minH - distY;

                    if (overlapX < overlapY) {
                        const nudge = overlapX * 0.5 * alpha;
                        if (dx === 0) {
                            a.x += nudge;
                            b.x -= nudge;
                        } else {
                            const sign = dx > 0 ? 1 : -1;
                            a.x += sign * nudge;
                            b.x -= sign * nudge;
                        }
                    } else {
                        const nudge = overlapY * 0.5 * alpha;
                        if (dy === 0) {
                            a.y += nudge;
                            b.y -= nudge;
                        } else {
                            const sign = dy > 0 ? 1 : -1;
                            a.y += sign * nudge;
                            b.y -= sign * nudge;
                        }
                    }
                }
            }
        }

        // 3. Boundary Clamping
        const minX = paddingSide + (CARD_W / 2);
        const maxX = width - paddingSide - (CARD_W / 2);
        const minY = paddingTop + (CARD_H / 2);
        const maxY = height - paddingBottom - (CARD_H / 2);

        solved.forEach(node => {
            node.x = Math.max(minX, Math.min(maxX, node.x));
            node.y = Math.max(minY, Math.min(maxY, node.y));
        });
    }

    return solved;
};


export default function StrategicMap({ opportunities, edges: _edges = [] }: { opportunities: Opportunity[], edges?: { from: string, to: string }[] }) {
    const width = 1000;
    const height = 750;
    const CARD_W = 180;
    const CARD_H = 80;

    const processedData = useMemo(() => {
        const valid = opportunities.filter(o => o.scoreValue !== null);
        // We only do ONE pass now (Grid mapping + Rectangle Physics)
        return resolveCollisions(valid, width, height).sort((a, b) => (a.sequenceRank || 99) - (b.sequenceRank || 99));
    }, [opportunities]);

    const getCardColor = (rank: number | null) => {
        // Wave 1: Green, Wave 2: Blue
        // Based on previous design: Rank 1 = Green, Rank 2 = Blue
        if (rank === 1) return 'bg-emerald-500 border-emerald-600';
        if (rank === 2) return 'bg-info-subtle border-info';
        if (rank === 3) return 'bg-violet-500 border-violet-600';
        return 'bg-surface-subtle border-muted';
    };

    return (
        <div className="w-full h-full bg-muted/20 rounded-xl border border-border relative shadow-inner overflow-visible">

            {/* --- SVG LAYER (Lines & Grid) --- */}
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-h-[600px] absolute inset-0 overflow-visible pointer-events-none text-muted-foreground">
                {/* Defines for Arrowhead */}
                <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="currentColor" />
                    </marker>
                </defs>

                {/* Grid */}
                <g opacity="0.1" className="text-foreground">
                    {[0.5].map(p => <line key={`v-${p}`} x1={width * p} y1="0" x2={width * p} y2={height} stroke="currentColor" strokeWidth="2" strokeDasharray="5 5" />)}
                    {[0.5].map(p => <line key={`h-${p}`} x1="0" y1={height * p} x2={width} y2={height * p} stroke="currentColor" strokeWidth="2" strokeDasharray="5 5" />)}
                </g>

                {/* Quadrant Labels */}
                <text x="30" y="40" fill="currentColor" fontSize="12" fontWeight="700" letterSpacing="1" textAnchor="start">QUICK WINS</text>
                <text x="30" y="55" fill="currentColor" fontSize="10" opacity="0.8" textAnchor="start">High Val, Low Cplx</text>

                <text x={width - 30} y="40" fill="currentColor" fontSize="12" fontWeight="700" letterSpacing="1" textAnchor="end">MAJOR PROJECTS</text>
                <text x={width - 30} y="55" fill="currentColor" fontSize="10" opacity="0.8" textAnchor="end">High Val, High Cplx</text>

                <text x="30" y={height - 40} fill="currentColor" fontSize="12" fontWeight="700" letterSpacing="1" textAnchor="start">TACTICAL</text>
                <text x="30" y={height - 25} fill="currentColor" fontSize="10" opacity="0.8" textAnchor="start">Low Val, Low Cplx</text>

                <text x={width - 30} y={height - 40} fill="currentColor" fontSize="12" fontWeight="700" letterSpacing="1" textAnchor="end">DEPRIORITISE</text>
                <text x={width - 30} y={height - 25} fill="currentColor" fontSize="10" opacity="0.8" textAnchor="end">Low Val, High Cplx</text>

                {/* Strategy Dependency Edge Paths - REMOVED per user request */}
                {/* {edges.map((edge, i) => ...)} */}
            </svg>

            {/* --- CARD LAYER --- */}
            {processedData.map((node, i) => {
                const { x, y } = node;
                if (x === undefined || y === undefined) return null;

                return (
                    <motion.div
                        key={node.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1, left: x, top: y }}
                        transition={{ delay: i * 0.05 }}
                        className={`absolute z-10 flex flex-col justify-between p-3 rounded-lg shadow-md border ${getCardColor(node.sequenceRank)} text-white cursor-pointer hover:scale-105 hover:z-20 transition-all`}
                        style={{
                            transform: 'translate(-50%, -50%)', // Center on coordinate
                            width: `${CARD_W}px`,
                            height: `${CARD_H}px`
                        }}
                    >
                        {/* Header: Rank Circle + Title */}
                        <div className="flex items-start gap-2">
                            {node.sequenceRank && (
                                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs ring-1 ring-white/30">
                                    {node.sequenceRank}
                                </div>
                            )}
                            <span className="text-[11px] font-semibold leading-tight line-clamp-2 drop-shadow-sm">
                                {node.projectName}
                            </span>
                        </div>

                        {/* Footer: Value */}
                        <div className="text-[10px] font-mono text-white/80 text-right mt-1 border-t border-white/20 pt-1">
                            {node.impactLabel} Impact
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}
