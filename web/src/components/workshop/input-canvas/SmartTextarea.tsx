"use client";

import React from 'react';

interface SmartTextareaProps {
    value: string;
    onChange: (val: string) => void;
    placeholder: string;
    label: string;
    className?: string;
    id?: string;
    name?: string;
}

/**
 * Auto-growing textarea with smart bullet point handling
 * Automatically inserts bullets on Enter key
 */
export function SmartTextarea({
    value,
    onChange,
    placeholder,
    label,
    className,
    id,
    name
}: SmartTextareaProps) {
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    // Auto-resize on every value change
    React.useLayoutEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [value]);

    // Smart bullet logic
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const target = e.target as HTMLTextAreaElement;
            const start = target.selectionStart;
            const end = target.selectionEnd;

            // Insert newline + bullet
            const newValue = value.substring(0, start) + "\n• " + value.substring(end);
            onChange(newValue);

            // Restore cursor position after state update
            setTimeout(() => {
                if (textareaRef.current) {
                    textareaRef.current.selectionStart = start + 3;
                    textareaRef.current.selectionEnd = start + 3;
                }
            }, 0);
        }
    };

    return (
        <div className="flex flex-col gap-1" onPointerDown={(e) => e.stopPropagation()}>
            <label htmlFor={id} className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                {label}
            </label>
            <textarea
                id={id}
                name={name}
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                    if (!value) onChange('• ');
                }}
                className={
                    className ||
                    "w-full text-sm leading-relaxed bg-input border border-input rounded-lg p-3 focus:ring-2 focus:ring-inset focus:ring-ring outline-none resize-none overflow-hidden min-h-[40px] placeholder-muted-foreground/40 text-foreground font-medium transition-all"
                }
                placeholder={placeholder}
                rows={1}
            />
        </div>
    );
}
