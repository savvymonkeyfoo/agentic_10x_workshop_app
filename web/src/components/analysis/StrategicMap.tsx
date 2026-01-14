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
    const paddingSide = 80;
    const paddingBottom = 60;
    const paddingTop = 160;

    const effectiveWidth = width - (paddingSide * 2);
    const effectiveHeight = height - (paddingTop + paddingBottom);
    const minDistance = 140;

    // 1. Map Scores to Pixel Coordinates
    const solved = nodes.map(node => {
        const impact = (node.benefitRevenue || 0) + (node.benefitCostAvoidance || 0);
        const logValue = impact > 0 ? Math.log10(impact) : 0;
        const radius = impact === 0 ? 30 : Math.max(30, Math.min(80, (logValue * 11)));

        return {
            ...node,
            x: (node.scoreComplexity / 5) * effectiveWidth + paddingSide,
            y: (1 - (node.scoreValue / 5)) * effectiveHeight + paddingTop,
            r: radius,
            impactLabel: impact > 1000000 ? `$${(impact / 1000000).toFixed(1)}M` : `$${(impact / 1000).toFixed(0)}k`
        };
    });

    // 2. Physics Nudge (Bubbles)
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

    // 3. Boundary Clamping (Bubbles)
    const minX = paddingSide;
    const maxX = width - paddingSide;
    const minY = paddingTop;
    const maxY = height - paddingBottom;

    solved.forEach(node => {
        node.x = Math.max(minX, Math.min(maxX, node.x));
        node.y = Math.max(minY, Math.min(maxY, node.y));
    });

    return solved;
};

const resolveLabelCollisions = (nodes: Opportunity[], width: number) => {
    // Card Dimensions (approximate for collision)
    const CARD_W = 240;
    const CARD_H = 100;

    // Initialize Card Positions
    nodes.forEach(node => {
        if (node.x !== undefined && node.y !== undefined && node.r !== undefined) {
            node.cardX = node.x;
            node.cardY = node.y - node.r - 20; // Default: 20px above bubble
        }
    });

    // Iterative Collision Resolution for Cards
    const iterations = 10;
    for (let k = 0; k < iterations; k++) {
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const a = nodes[i];
                const b = nodes[j];

                if (a.cardX === undefined || a.cardY === undefined || b.cardX === undefined || b.cardY === undefined) continue;

                // AABB Collision Detection
                const aCy = a.cardY - (CARD_H / 2);
                const bCy = b.cardY - (CARD_H / 2);
                const subX = Math.abs(a.cardX - b.cardX);
                const subY = Math.abs(aCy - bCy);

                if (subX < CARD_W + 10 && subY < CARD_H + 10) {
                    // Overlap detected. Push apart.
                    const overlapX = (CARD_W + 10) - subX;
                    const overlapY = (CARD_H + 10) - subY;

                    // Prefer vertical stacking if horiz overlap is large
                    if (overlapY < overlapX) {
                        const sign = aCy < bCy ? -1 : 1;
                        a.cardY += sign * overlapY * -0.5;
                        b.cardY += sign * overlapY * 0.5;
                    } else {
                        const sign = a.cardX < b.cardX ? -1 : 1;
                        a.cardX += sign * overlapX * -0.5;
                        b.cardX += sign * overlapX * 0.5;
                    }
                }
            }
        }

        // Clamp Cards to screen
        nodes.forEach(node => {
            if (node.cardX !== undefined && node.cardY !== undefined) {
                const margin = CARD_W / 2 + 10;
                node.cardX = Math.max(margin, Math.min(width - margin, node.cardX));
                node.cardY = Math.max(CARD_H, node.cardY);
            }
        });
    }

    return nodes;
};



export default function StrategicMap({ opportunities }: { opportunities: Opportunity[] }) {
    const width = 1000;
    const height = 750;

    const processedData = useMemo(() => {
        const valid = opportunities.filter(o => o.scoreValue !== null);
        const resolved = resolveCollisions(valid, width, height);
        // Second pass: Labels
        return resolveLabelCollisions(resolved, width).sort((a, b) => (a.sequenceRank || 99) - (b.sequenceRank || 99));
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
        <div className="w-full h-full bg-slate-50/50 rounded-xl border border-slate-200 relative shadow-inner overflow-visible">

            {/* --- HTML OVERLAY LAYER --- */}
            {processedData.map((node, i) => {
                const { x, y, r, cardX, cardY } = node;
                if (x === undefined || y === undefined || r === undefined || cardX === undefined || cardY === undefined) return null;

                // Determine if we need a leader line
                // Simple heuristic: if card moved more than 30px from default, show line
                const defaultY = y - r - 20;
                const distMoved = Math.hypot(cardX - x, cardY - defaultY);
                const showLeader = distMoved > 10;

                // Smart Anchor styling
                // If clamping pushed it left/right, text align might need adjustment? 
                // For now, keep it centered since we position the center point explicitly.

                return (
                    <React.Fragment key={`card-group-${node.id}`}>
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0, left: cardX, top: cardY }}
                            transition={{ delay: 0.3 + (i * 0.1) }}
                            className="absolute z-50 flex flex-col pointer-events-none"
                            style={{
                                transform: 'translate(-50%, -100%)', // Anchor at bottom-center
                                width: '240px',
                                alignItems: 'center'
                            }}
                        >
                            <div className="bg-white rounded-lg shadow-xl border border-slate-200 p-3 w-full h-auto text-center relative">
                                <div className="text-slate-800 font-bold text-xs leading-snug line-clamp-4">
                                    {node.projectName}
                                </div>
                                <div className="text-[10px] text-slate-500 mt-2 font-mono border-t border-slate-100 pt-1">
                                    {node.impactLabel} Impact
                                </div>
                                {/* Beak (only if NO leader line) */}
                                {!showLeader && (
                                    <div className="absolute left-1/2 -ml-[6px] -bottom-[6px] w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-white filter drop-shadow-sm"></div>
                                )}
                            </div>
                        </motion.div>
                    </React.Fragment>
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

                {/* Leader Lines (SVG) */}
                {processedData.map((node) => {
                    const { x, y, r, cardX, cardY } = node;
                    if (x === undefined || y === undefined || r === undefined || cardX === undefined || cardY === undefined) return null;

                    const defaultY = y - r - 20;
                    const distMoved = Math.hypot(cardX - x, cardY - defaultY);
                    if (distMoved <= 10) return null;

                    return (
                        <line
                            key={`leader-${node.id}`}
                            x1={x} y1={y - r} // Top of bubble
                            x2={cardX} y2={cardY} // Bottom of card (anchor point)
                            stroke="#cbd5e1"
                            strokeWidth="2"
                            strokeDasharray="4 2"
                        />
                    )
                })}

                {/* Bubbles */}
                {processedData.map((node, i) => {
                    const { x, y, r, cardX, cardY } = node;
                    if (x === undefined || y === undefined || r === undefined) return null;

                    return (
                        <g key={node.id}>
                            {/* Only draw vertical stem if NOT using leader line (simple heuristic, or just always draw stem inside bubble?) */}
                            {/* Actually, the stem line (line x1) in original code went from center to top of bubble. 
                            Let's keep it but maybe it's redundant with leader line? 
                            The original line command: <line x1={node.x} y1={node.y} x2={node.x} y2={node.y - node.r - 20} ... />
                            This was the "stem". If we have a leader line, we replace this stem with the angular leader line.
                        */}
                            {(cardX !== undefined && cardY !== undefined && Math.hypot(cardX - x, cardY - (y - r - 20)) <= 10) && (
                                <line x1={x} y1={y} x2={x} y2={y - r - 20} stroke="#cbd5e1" strokeWidth="2" />
                            )}

                            <motion.circle
                                initial={{ r: 0 }} animate={{ r: r }} transition={{ delay: i * 0.1 }}
                                cx={x} cy={y}
                                fill={getBubbleColor(node.sequenceRank)}
                                stroke="white" strokeWidth="3"
                                className="cursor-pointer hover:opacity-90"
                            />
                            {node.sequenceRank && (
                                <text x={x} y={y + 7} textAnchor="middle" fill="white" fontWeight="800" fontSize="20">
                                    {node.sequenceRank}
                                </text>
                            )}
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}
