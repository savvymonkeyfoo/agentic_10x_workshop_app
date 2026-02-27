"use client";

import React from 'react';

interface TitleTextareaProps {
    value: string;
    onChange: (val: string) => void;
    placeholder: string;
    className?: string;
}

/**
 * Simple auto-growing textarea for titles
 * No bullet points, just resizes based on content
 */
export function TitleTextarea({
    value,
    onChange,
    placeholder,
    className
}: TitleTextareaProps) {
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    // Auto-resize on every value change
    React.useLayoutEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [value]);

    return (
        <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={
                className ||
                "w-full bg-transparent text-2xl font-black uppercase leading-tight resize-none overflow-hidden outline-none border-none focus:ring-0 placeholder-muted-foreground/30 text-foreground"
            }
            placeholder={placeholder}
            rows={1}
        />
    );
}
