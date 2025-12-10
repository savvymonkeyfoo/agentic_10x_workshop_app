"use client";

import React, { useRef } from 'react';

interface SmartListTextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
    value: string;
    onValueChange: (value: string) => void;
}

export function SmartListTextarea({ value, onValueChange, className, ...props }: SmartListTextareaProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleFocus = () => {
        if (!value || value.trim() === '') {
            onValueChange("• ");
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const textarea = e.currentTarget;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;

            const newValue = value.substring(0, start) + "\n• " + value.substring(end);
            onValueChange(newValue);

            // Restore cursor position
            requestAnimationFrame(() => {
                if (textareaRef.current) {
                    textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 3;
                }
            });
        }
    };

    return (
        <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onValueChange(e.target.value)}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            className={className}
            {...props}
        />
    );
}
