'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Dot, Plus } from 'lucide-react';

interface SmartBulletEditorProps {
    value: string;
    onChange: (value: string) => void;
    colorClass?: string; // e.g. "text-red-700"
    placeholder?: string;
}

export function SmartBulletEditor({ value, onChange, colorClass = "text-slate-700", placeholder }: SmartBulletEditorProps) {
    // Parse the raw markdown string into an array of items
    const parseValue = (val: string) => {
        if (!val) return [''];
        // Split by newline and strip leading bullet characters
        return val.split('\n').map(line => line.replace(/^[-*•]\s*/, ''));
    };

    const [items, setItems] = useState<string[]>(parseValue(value));

    // Sync external changes (if any) only if significantly different to avoid cursor jumps
    // In a real-time editor, this is tricky, but for this use case, we trust local state mostly.
    useEffect(() => {
        // Only reset if the incoming value is empty or totally different (hydration)
        if (value && items.length === 1 && items[0] === '' && value.length > 0) {
            setItems(parseValue(value));
        }
    }, [value]);

    const handleChange = (index: number, newValue: string) => {
        const newItems = [...items];
        newItems[index] = newValue;
        setItems(newItems);
        reconstruct(newItems);
    };

    const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const newItems = [...items];
            newItems.splice(index + 1, 0, ''); // Insert empty item after current
            setItems(newItems);
            reconstruct(newItems);
            // Focus logic would go here in a complex component, 
            // but React state update re-renders make simple auto-focus tricky.
            // For now, user clicks or tabs.
        }
        if (e.key === 'Backspace' && items[index] === '' && items.length > 1) {
            e.preventDefault();
            const newItems = [...items];
            newItems.splice(index, 1);
            setItems(newItems);
            reconstruct(newItems);
        }
    };

    // Join the array back into a markdown string: "- item\n- item"
    const reconstruct = (currentItems: string[]) => {
        const cleanString = currentItems
            .filter(i => i.trim() !== '') // Remove empty ghost lines on save
            .map(i => `- ${i}`)
            .join('\n');
        onChange(cleanString);
    };

    return (
        <div className="space-y-2">
            {items.map((item, index) => (
                <div key={index} className="flex items-start gap-2 group">
                    <div className={cn("mt-2.5", colorClass)}>
                        <Dot className="w-4 h-4" strokeWidth={8} />
                    </div>
                    <Textarea
                        rows={1}
                        className={cn(
                            "min-h-[32px] h-auto resize-none overflow-hidden py-1 px-0 shadow-none border-none focus-visible:ring-0 bg-transparent text-sm leading-relaxed selection:bg-slate-200",
                            colorClass
                        )}
                        value={item}
                        onChange={(e) => {
                            e.target.style.height = 'auto';
                            e.target.style.height = e.target.scrollHeight + 'px';
                            handleChange(index, e.target.value);
                        }}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        placeholder={index === 0 ? placeholder : "Next point..."}
                        style={{ height: 'auto' }} // Auto-grow hack
                        ref={(ref) => {
                            // Auto-resize on mount
                            if (ref) {
                                ref.style.height = 'auto';
                                ref.style.height = ref.scrollHeight + 'px';
                            }
                        }}
                    />
                </div>
            ))}

            {/* 'Add Item' Ghost Button */}
            <button
                onClick={() => {
                    const newItems = [...items, ''];
                    setItems(newItems);
                }}
                className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-600 ml-1.5 px-1 py-1 rounded hover:bg-slate-100 transition-colors"
            >
                <Plus className="w-3 h-3" /> Add Point
            </button>
        </div>
    );
}
