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
                    stroke="#e2e8f0"
                    strokeWidth="16"
                    strokeLinecap="round"
                />

                {/* Arc Background - Blue zone (40-75) */}
                <path
                    d="M 56.8 36.8 A 80 80 0 0 1 143.2 36.8"
                    fill="none"
                    stroke="#bfdbfe"
                    strokeWidth="16"
                    strokeLinecap="round"
                />

                {/* Arc Background - Gold zone (75-100) */}
                <path
                    d="M 143.2 36.8 A 80 80 0 0 1 180 100"
                    fill="none"
                    stroke="#fde68a"
                    strokeWidth="16"
                    strokeLinecap="round"
                />

                {/* Zone Labels - Properly positioned */}
                <text x="25" y="80" className="text-[9px] font-bold" fill="#64748b">AUTO</text>
                <text x="100" y="18" textAnchor="middle" className="text-[9px] font-bold" fill="#3b82f6">TABLE STAKES</text>
                <text x="175" y="80" textAnchor="end" className="text-[9px] font-bold" fill="#d97706">BIG BET</text>

                {/* Center Point */}
                <circle cx="100" cy="100" r="8" fill="white" stroke="#1e293b" strokeWidth="2" />

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
