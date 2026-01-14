'use client';

import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

interface MarkdownTextareaProps {
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    className?: string;
    id?: string;
    name?: string;
    minHeight?: string;
}

/**
 * A textarea that displays rendered markdown when not focused,
 * and switches to an editable textarea when the user clicks to edit.
 */
export function MarkdownTextarea({
    value,
    onChange,
    placeholder = '',
    className = '',
    id,
    name,
    minHeight = '6rem'
}: MarkdownTextareaProps) {
    const [isEditing, setIsEditing] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-focus the textarea when editing starts
    useEffect(() => {
        if (isEditing && textareaRef.current) {
            textareaRef.current.focus();
            // Place cursor at the end
            const len = textareaRef.current.value.length;
            textareaRef.current.setSelectionRange(len, len);
        }
    }, [isEditing]);

    const hasContent = value && value.trim().length > 0;

    if (isEditing) {
        return (
            <textarea
                ref={textareaRef}
                id={id}
                name={name}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onBlur={() => setIsEditing(false)}
                placeholder={placeholder}
                className={cn(
                    'w-full bg-white/50 dark:bg-black/20 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm resize-none focus:ring-2 focus:ring-brand-cyan outline-none transition-all',
                    className
                )}
                style={{ minHeight }}
            />
        );
    }

    return (
        <div
            onClick={() => setIsEditing(true)}
            className={cn(
                'w-full bg-white/50 dark:bg-black/20 border border-slate-200 dark:border-slate-700 rounded-lg p-3 cursor-text hover:border-blue-300 transition-all',
                !hasContent && 'text-slate-400',
                className
            )}
            style={{ minHeight }}
        >
            {hasContent ? (
                <article className="prose prose-sm prose-slate max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 prose-headings:my-1 prose-headings:font-bold prose-strong:text-slate-800">
                    <ReactMarkdown>{value}</ReactMarkdown>
                </article>
            ) : (
                <span className="text-sm">{placeholder}</span>
            )}
        </div>
    );
}
