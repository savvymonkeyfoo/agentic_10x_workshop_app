'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

// --- Types ---
interface Opportunity {
    id: string;
    name: string;
    x: number; // scoreComplexity (0-5)
    y: number; // scoreValue (0-5)
    z: number; // financial size
    risk: number;
    rank?: number;
    financialImpact?: number;
}

interface StrategicMapProps {
    nodes: Opportunity[];
}

// --- Physics Engine: Collision Detection ---
const resolveCollisions = (nodes: any[], width: number, height: number) => {
    const padding = 120;
    const minDistance = 120;

    // Map scores to pixel coordinates
    let solved = nodes.map(node => ({
        ...node,
        px: ((node.x || 3) / 5) * (width - padding * 2) + padding,
        py: (1 - ((node.y || 3) / 5)) * (height - padding * 2) + padding,
        radius: Math.max(35, Math.min(60, 30 + (node.financialImpact || 0) / 50000))
    }));

    // Simple Iterative Nudge (Prevents stacking)
    for (let iteration = 0; iteration < 10; iteration++) {
        for (let i = 0; i < solved.length; i++) {
            for (let j = i + 1; j < solved.length; j++) {
                const a = solved[i];
                const b = solved[j];
                const dx = a.px - b.px;
                const dy = a.py - b.py;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < minDistance) {
                    const angle = Math.atan2(dy, dx);
                    const nudge = (minDistance - dist) / 2;
                    a.px += Math.cos(angle) * nudge;
                    a.py += Math.sin(angle) * nudge;
                    b.px -= Math.cos(angle) * nudge;
                    b.py -= Math.sin(angle) * nudge;
                }
            }
        }
    }

    // Clamp to bounds
    solved = solved.map(node => ({
        ...node,
        px: Math.max(padding, Math.min(width - padding, node.px)),
        py: Math.max(padding, Math.min(height - padding, node.py))
    }));

    return solved;
};

export default function StrategicMap({ nodes }: StrategicMapProps) {
    const width = 1200;
    const height = 700;

    // Process Data & Solve Collisions
    const processedData = useMemo(() => {
        const resolved = resolveCollisions(nodes, width, height);
        return resolved.sort((a, b) => (a.rank || 99) - (b.rank || 99));
    }, [nodes]);

    // Generate Path String (1 -> 2 -> 3...)
    const pathData = processedData
        .filter(d => d.rank && d.rank < 90)
        .map((d, i) => (i === 0 ? `M ${d.px} ${d.py}` : `L ${d.px} ${d.py}`))
        .join(' ');

    const formatCurrency = (val: number) => {
        if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
        if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
        return val > 0 ? `$${val}` : '';
    };

    return (
        <div className="h-full w-full flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 relative overflow-hidden">
            {/* Header */}
            <header className="relative z-10 p-6 flex justify-between items-start border-b border-slate-200/50">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Strategy Journey Map</h1>
                    <p className="text-sm text-slate-500 mt-1">Follow the numbered path for recommended execution order</p>
                </div>
                <div className="flex gap-4 text-xs items-center">
                    <div className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow"></span>
                        <span className="text-slate-600">#1</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow"></span>
                        <span className="text-slate-600">#2</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-violet-500 border-2 border-white shadow"></span>
                        <span className="text-slate-600">#3</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-slate-500 border-2 border-white shadow"></span>
                        <span className="text-slate-600">#4+</span>
                    </div>
                    <div className="flex items-center gap-2 border-l border-slate-300 pl-3">
                        <div className="w-8 border-t-2 border-dashed border-slate-400"></div>
                        <span className="text-slate-600">Path</span>
                    </div>
                </div>
            </header>

            {/* SVG Canvas */}
            <main className="flex-1 relative">
                <svg
                    viewBox={`0 0 ${width} ${height}`}
                    className="w-full h-full"
                    preserveAspectRatio="xMidYMid meet"
                >
                    {/* Definitions */}
                    <defs>
                        <filter id="card-shadow" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="0" dy="4" stdDeviation="8" floodOpacity="0.12" />
                        </filter>
                        <linearGradient id="bubble-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="100%" stopColor="#6366f1" />
                        </linearGradient>
                    </defs>

                    {/* LAYER 0: Quadrant Labels */}
                    <text x={width * 0.25} y={80} textAnchor="middle" fill="#cbd5e1" fontSize="28" fontWeight="700">QUICK WIN</text>
                    <text x={width * 0.75} y={80} textAnchor="middle" fill="#cbd5e1" fontSize="28" fontWeight="700">STRATEGIC</text>
                    <text x={width * 0.25} y={height - 40} textAnchor="middle" fill="#cbd5e1" fontSize="28" fontWeight="700">INCREMENTAL</text>
                    <text x={width * 0.75} y={height - 40} textAnchor="middle" fill="#fecaca" fontSize="28" fontWeight="700">DEPRIORITIZE</text>

                    {/* LAYER 1: Grid Lines */}
                    <g opacity="0.15">
                        <line x1={width / 2} y1="0" x2={width / 2} y2={height} stroke="#64748b" strokeWidth="2" strokeDasharray="8 8" />
                        <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="#64748b" strokeWidth="2" strokeDasharray="8 8" />
                    </g>

                    {/* LAYER 2: Journey Path */}
                    {pathData && (
                        <motion.path
                            d={pathData}
                            fill="none"
                            stroke="#94a3b8"
                            strokeWidth="3"
                            strokeDasharray="10 8"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 1.5, delay: 0.5 }}
                        />
                    )}

                    {/* LAYER 3: Bubbles */}
                    {processedData.map((node, i) => (
                        <motion.g key={node.id}>
                            <motion.circle
                                cx={node.px}
                                cy={node.py}
                                fill={
                                    node.rank === 1 ? '#10b981' :
                                        node.rank === 2 ? '#3b82f6' :
                                            node.rank === 3 ? '#8b5cf6' :
                                                node.rank ? '#64748b' :
                                                    '#cbd5e1'
                                }
                                stroke="white"
                                strokeWidth="4"
                                initial={{ r: 0 }}
                                animate={{ r: node.radius }}
                                transition={{ delay: i * 0.1, type: 'spring', stiffness: 200 }}
                                className="cursor-pointer"
                            />
                            {node.rank && (
                                <motion.text
                                    x={node.px}
                                    y={node.py + 8}
                                    textAnchor="middle"
                                    fill="white"
                                    fontWeight="800"
                                    fontSize="22"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.3 + i * 0.1 }}
                                >
                                    {node.rank}
                                </motion.text>
                            )}
                        </motion.g>
                    ))}

                    {/* LAYER 4: Callout Cards */}
                    {processedData.map((node, i) => (
                        <motion.g
                            key={`card-${node.id}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8 + i * 0.1 }}
                        >
                            {/* Stem Line */}
                            <line
                                x1={node.px}
                                y1={node.py - node.radius - 5}
                                x2={node.px}
                                y2={node.py - node.radius - 50}
                                stroke="#94a3b8"
                                strokeWidth="2"
                                strokeDasharray="4 3"
                            />
                            <circle cx={node.px} cy={node.py - node.radius - 5} r={4} fill="#94a3b8" />

                            {/* Card Body */}
                            <rect
                                x={node.px - 110}
                                y={node.py - node.radius - 110}
                                width="220"
                                height="55"
                                rx="10"
                                fill="white"
                                stroke="#e2e8f0"
                                strokeWidth="1"
                                filter="url(#card-shadow)"
                            />

                            {/* Project Name */}
                            <text
                                x={node.px}
                                y={node.py - node.radius - 80}
                                textAnchor="middle"
                                fill="#1e293b"
                                fontWeight="700"
                                fontSize="13"
                            >
                                {node.name.length > 28 ? node.name.substring(0, 26) + '...' : node.name}
                            </text>

                            {/* Stats Line */}
                            <text
                                x={node.px}
                                y={node.py - node.radius - 62}
                                textAnchor="middle"
                                fill="#64748b"
                                fontWeight="500"
                                fontSize="11"
                            >
                                Value: {node.y}/5 • Complexity: {node.x}/5
                                {node.financialImpact ? ` • ${formatCurrency(node.financialImpact)}` : ''}
                            </text>
                        </motion.g>
                    ))}

                    {/* Axis Labels */}
                    <text x={width / 2} y={height - 10} textAnchor="middle" fill="#64748b" fontSize="12" fontWeight="600">
                        COMPLEXITY / EFFORT →
                    </text>
                    <text x={20} y={height / 2} textAnchor="middle" fill="#64748b" fontSize="12" fontWeight="600" transform={`rotate(-90, 20, ${height / 2})`}>
                        BUSINESS VALUE →
                    </text>
                </svg>
            </main>

            {/* Footer */}
            <footer className="relative z-20 p-4 bg-white/70 dark:bg-slate-900/70 border-t border-slate-200/50 backdrop-blur-sm">
                <div className="flex justify-between items-center text-xs text-slate-500">
                    <span>{nodes.length} opportunities | {processedData.filter(n => n.rank).length} in sequence | Bubble size = Financial Impact</span>
                    <a href="/" className="font-bold text-blue-600 hover:underline">← Back to Dashboard</a>
                </div>
            </footer>
        </div>
    );
}
