"use client";

import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { updateOpportunity } from '@/app/actions/update-opportunity';
import { cn } from '@/lib/utils';
import { SmartList } from './SmartList';

interface EditableTextProps {
    id: string;
    field: string;
    value: string | null;
    className?: string;
    placeholder?: string;
    isList?: boolean;
}

export function EditableText({ id, field, value: initialValue, className, placeholder, isList }: EditableTextProps) {
    const [value, setValue] = useState(initialValue || '');
    const [isSaving, setIsSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const adjustHeight = () => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    };

    useEffect(() => {
        if (isEditing) {
            adjustHeight();
        }
    }, [value, isEditing]);

    useEffect(() => {
        setValue(initialValue || '');
    }, [initialValue]);

    const handleBlur = async () => {
        setIsEditing(false);
        if (value !== (initialValue || '')) {
            setIsSaving(true);
            await updateOpportunity(id, { [field]: value });
            setIsSaving(false);
        }
    };

    // View Mode
    if (!isEditing) {
        return (
            <div
                onClick={() => setIsEditing(true)}
                className={cn(
                    "w-full cursor-text rounded px-1 -mx-1 border border-transparent hover:bg-yellow-50 hover:border-yellow-200 transition-colors min-h-[1.5em] relative",
                    className,
                    !value && "text-slate-400 italic opacity-50"
                )}
            >
                {value ? (
                    isList ? <SmartList content={value} /> : (
                        <article className="prose prose-sm prose-slate max-w-none prose-headings:font-bold prose-headings:text-slate-800 prose-h2:text-base prose-h2:mt-3 prose-h2:mb-1 prose-h3:text-sm prose-h3:mt-2 prose-h3:mb-1 prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 prose-strong:text-slate-700">
                            <ReactMarkdown>{value}</ReactMarkdown>
                        </article>
                    )
                ) : (
                    placeholder || "Click to edit..."
                )}
                {isSaving && (
                    <div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-sm" title="Saving..." />
                )}
            </div>
        );
    }

    // Edit Mode
    return (
        <div className="relative group w-full">
            <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onBlur={handleBlur}
                autoFocus
                className={cn(
                    "w-full bg-white outline-none resize-none overflow-hidden rounded px-1 -mx-1 ring-1 ring-brand-blue/30 border-brand-blue/20 shadow-sm text-slate-900",
                    className
                )}
                rows={1}
                placeholder={placeholder || "Click to edit..."}
                style={{ minHeight: '1.5em' }}
            />
        </div>
    );
}
