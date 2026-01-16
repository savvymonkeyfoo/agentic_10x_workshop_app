'use client';

import React from 'react';

interface SpeedometerGaugeProps {
    score: number; // 0-100
    size?: number; // Width/height in pixels
}

export function SpeedometerGauge({ score, size = 200 }: SpeedometerGaugeProps) {
    // Clamp score between 0-100
    const clampedScore = Math.max(0, Math.min(100, score));

    // Convert score to needle rotation (0 = -90deg, 100 = 90deg)
    const needleRotation = (clampedScore / 100) * 180 - 90;

    // Determine current tier for needle color
    const getTierColor = () => {
        if (clampedScore >= 75) return '#f59e0b'; // amber-500
        if (clampedScore >= 40) return '#3b82f6'; // blue-500
        return '#64748b'; // slate-500
    };

    return (
        <div className="flex flex-col items-center">
            <svg
                width={size}
                height={size / 2 + 10}
                viewBox="0 0 200 110"
                className="overflow-visible"
            >
                {/* Arc Background - Grey zone (0-40) */}
                <path
                    d="M 20 100 A 80 80 0 0 1 56.8 36.8"
                    fill="none"
                    stroke="hsl(var(--muted))"
                    strokeWidth="16"
                    strokeLinecap="round"
                    className="opacity-50"
                />

                {/* Arc Background - Blue zone (40-75) */}
                <path
                    d="M 56.8 36.8 A 80 80 0 0 1 143.2 36.8"
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="16"
                    strokeLinecap="round"
                    className="opacity-30"
                />

                {/* Arc Background - Gold zone (75-100) */}
                <path
                    d="M 143.2 36.8 A 80 80 0 0 1 180 100"
                    fill="none"
                    stroke="hsl(var(--accent))" // Assuming accent is gold-ish or distinct, logic below handles needle
                    strokeWidth="16"
                    strokeLinecap="round"
                    className="opacity-50"
                />

                {/* Zone Labels - Properly positioned */}
                <text x="25" y="80" className="text-[9px] font-bold text-muted-foreground fill-current">AUTO</text>
                <text x="100" y="18" textAnchor="middle" className="text-[9px] font-bold text-primary fill-current">TABLE STAKES</text>
                <text x="175" y="80" textAnchor="end" className="text-[9px] font-bold text-amber-500 fill-current">BIG BET</text>

                {/* Center Point */}
                <circle cx="100" cy="100" r="8" className="fill-background stroke-foreground" strokeWidth="2" />

                {/* Needle */}
                <g
                    style={{
                        transformOrigin: '100px 100px',
                        transform: `rotate(${needleRotation}deg)`,
                        transition: 'transform 0.5s ease-out'
                    }}
                >
                    <polygon
                        points="100,35 96,100 104,100"
                        fill={getTierColor()}
                    />
                </g>

                {/* Center Cap */}
                <circle cx="100" cy="100" r="5" fill={getTierColor()} />
            </svg>
        </div>
    );
}
