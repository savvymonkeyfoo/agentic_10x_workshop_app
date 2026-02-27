'use client';

import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Dot, Plus } from 'lucide-react';

interface SmartBulletEditorProps {
    value: string;
    onChange: (value: string) => void;
    colorClass?: string;
    placeholder?: string;
}

export function SmartBulletEditor({ value, onChange, colorClass = "text-foreground", placeholder }: SmartBulletEditorProps) {
    // Helper: Parse raw markdown into lines, stripping bullets AND formatting chars
    const parseValue = (val: string) => {
        if (!val) return [''];
        return val.split('\n').map(line =>
            line.replace(/^[-*•]\s*/, '') // Remove leading bullet
                .replace(/\*\*/g, '')      // Remove bold markers
                .replace(/__/g, '')        // Remove italic markers
        );
    };

    const [items, setItems] = useState<string[]>(parseValue(value));
    const textareaRefs = useRef<(HTMLTextAreaElement | null)[]>([]);

    // Sync with external updates (hydration only)
    useEffect(() => {
        if (value && items.length === 1 && items[0] === '' && value.length > 0) {
            setItems(parseValue(value));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: only sync on initial hydration
    }, [value]);

    // Force auto-grow on every render/update
    useLayoutEffect(() => {
        textareaRefs.current.forEach((ref) => {
            if (ref) {
                ref.style.height = 'auto';
                ref.style.height = ref.scrollHeight + 'px';
            }
        });
    }, [items]);

    const updateParent = (newItems: string[]) => {
        // Reconstruct Markdown: "- item"
        const cleanString = newItems
            .map(i => i) // Keep whitespace
            .filter(i => i.trim() !== '')
            .map(i => `- ${i}`) // Re-add standard bullet for DB
            .join('\n');
        onChange(cleanString);
    };

    const handleChange = (index: number, newValue: string) => {
        const newItems = [...items];
        newItems[index] = newValue;
        setItems(newItems);
        updateParent(newItems);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, index: number) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const cursor = e.currentTarget.selectionStart;
            const text = items[index];
            const firstPart = text.slice(0, cursor);
            const secondPart = text.slice(cursor);

            const newItems = [...items];
            newItems[index] = firstPart;
            newItems.splice(index + 1, 0, secondPart);

            setItems(newItems);
            updateParent(newItems);
        }

        if (e.key === 'Backspace' && e.currentTarget.selectionStart === 0 && index > 0) {
            e.preventDefault();
            const currentText = items[index];
            const prevText = items[index - 1];

            const newItems = [...items];
            newItems[index - 1] = prevText + currentText;
            newItems.splice(index, 1);

            setItems(newItems);
            updateParent(newItems);
        }
    };

    return (
        <div className="space-y-2 w-full">
            {items.map((item, index) => (
                <div key={index} className="flex items-start gap-2 group w-full">
                    <div className={cn("mt-1.5 shrink-0", colorClass)}>
                        <Dot className="w-6 h-6 -ml-1.5" strokeWidth={6} />
                    </div>
                    <Textarea
                        ref={(el) => { textareaRefs.current[index] = el; }}
                        rows={1}
                        className={cn(
                            "min-h-[24px] h-auto resize-none overflow-hidden py-1 px-0 shadow-none border-none focus-visible:ring-0 bg-transparent text-sm leading-relaxed w-full block",
                            colorClass
                        )}
                        value={item}
                        onChange={(e) => handleChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        placeholder={index === 0 ? placeholder : "..."}
                    />
                </div>
            ))}

            <button
                onClick={() => {
                    const newItems = [...items, ''];
                    setItems(newItems);
                }}
                className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground ml-1 px-2 py-1 rounded hover:bg-accent transition-colors"
            >
                <Plus className="w-3 h-3" /> Add Point
            </button>
        </div>
    );
}
