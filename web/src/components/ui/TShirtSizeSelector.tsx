"use client";

import React from 'react';
import { motion } from 'framer-motion';

type TShirtSize = 'XS' | 'S' | 'M' | 'L' | 'XL';

interface TShirtSizeSelectorProps {
    value: TShirtSize;
    onChange: (size: TShirtSize) => void;
}

const SIZES: { size: TShirtSize; scale: number }[] = [
    { size: 'XS', scale: 0.6 },
    { size: 'S', scale: 0.75 },
    { size: 'M', scale: 0.9 },
    { size: 'L', scale: 1.05 },
    { size: 'XL', scale: 1.2 },
];

// T-Shirt SVG Icon Component
const TShirtIcon = ({ size, isActive, scale }: { size: string; isActive: boolean; scale: number }) => (
    <svg
        width={40 * scale}
        height={44 * scale}
        viewBox="0 0 40 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transition-all duration-200"
    >
        {/* T-Shirt Shape */}
        <path
            d="M10 4L3 10L6 14L10 12V40H30V12L34 14L37 10L30 4H26C26 6.20914 23.3137 8 20 8C16.6863 8 14 6.20914 14 4H10Z"
            fill={isActive ? 'hsl(var(--primary))' : 'hsl(var(--muted))'}
            stroke={isActive ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'}
            strokeWidth="2"
            strokeLinejoin="round"
            className="transition-colors duration-200"
        />
        {/* Size Label on Chest */}
        <text
            x="20"
            y="26"
            textAnchor="middle"
            dominantBaseline="middle"
            className={`font-bold text-[10px] transition-colors duration-200 ${isActive ? 'fill-primary-foreground' : 'fill-muted-foreground'}`}
            style={{ fontSize: 10 / scale }}
        >
            {size}
        </text>
    </svg>
);

export function TShirtSizeSelector({ value, onChange }: TShirtSizeSelectorProps) {
    return (
        <div className="flex items-end gap-2">
            {SIZES.map(({ size, scale }) => (
                <motion.button
                    key={size}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onChange(size)}
                    className={`relative cursor-pointer transition-all duration-200 ${value === size
                        ? 'drop-shadow-lg'
                        : 'opacity-70 hover:opacity-100'
                        }`}
                    title={`Size ${size}`}
                >
                    <TShirtIcon size={size} isActive={value === size} scale={scale} />
                </motion.button>
            ))}
        </div>
    );
}
