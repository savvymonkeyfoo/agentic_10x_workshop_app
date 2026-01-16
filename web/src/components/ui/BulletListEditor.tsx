'use client';
import React, { useState, useEffect, useRef } from 'react';

interface BulletListEditorProps {
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    label?: string;
    id?: string;
    name?: string;
}

export function BulletListEditor({ value, onChange, placeholder, label, id, name }: BulletListEditorProps) {
    // ... (existing parse logic)
    const parse = (str: string) => {
        if (!str) return [''];
        return str.split('\n').map(line => line.replace(/^[•\s*-]+/, ''));
    };

    const [items, setItems] = useState<string[]>(parse(value));
    const inputsRef = useRef<(HTMLTextAreaElement | null)[]>([]);
    const isInternalUpdate = useRef(false);

    // ... (existing useEffects and handlers)
    // Sync with external updates
    useEffect(() => {
        if (isInternalUpdate.current) {
            isInternalUpdate.current = false;
            return;
        }
        const currentStr = items.map(i => `• ${i}`).join('\n');
        if (value !== currentStr) {
            setItems(parse(value));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally sync only on external value changes
    }, [value]);

    const handleChange = (index: number, newVal: string) => {
        const newItems = [...items];
        newItems[index] = newVal;
        setItems(newItems);
        isInternalUpdate.current = true;
        propagateChange(newItems);
        autoResize(index);
    };

    const propagateChange = (currentItems: string[]) => {
        const str = currentItems.map(i => `• ${i}`).join('\n');
        onChange(str);
    };

    const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const newItems = [...items];
            newItems.splice(index + 1, 0, ''); // Insert empty item after
            setItems(newItems);
            isInternalUpdate.current = true;
            propagateChange(newItems);
            // Focus next tick
            setTimeout(() => {
                const el = inputsRef.current[index + 1];
                if (el) {
                    el.focus();
                    autoResize(index + 1);
                }
            }, 0);
        }
        if (e.key === 'Backspace' && items[index] === '' && items.length > 1) {
            e.preventDefault();
            const newItems = [...items];
            newItems.splice(index, 1);
            setItems(newItems);
            isInternalUpdate.current = true;
            propagateChange(newItems);
            setTimeout(() => {
                const target = inputsRef.current[index - 1];
                if (target) {
                    target.focus();
                    target.setSelectionRange(target.value.length, target.value.length);
                }
            }, 0);
        }
    };

    const autoResize = (index: number) => {
        const el = inputsRef.current[index];
        if (el) {
            el.style.height = 'auto'; // Reset
            el.style.height = el.scrollHeight + 'px';
        }
    };

    // Auto-resize all on mount/update
    useEffect(() => {
        items.forEach((_, i) => autoResize(i));
    }, [items]);

    return (
        <div className="flex flex-col gap-1 w-full">
            {label && (
                <label htmlFor={id} className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
                    {label}
                </label>
            )}
            <div className="flex flex-col gap-2">
                {items.map((item, i) => (
                    <div key={i} className="flex gap-2 items-start group w-full">
                        {/* The Bullet - Fixed Width, preventing wrap under */}
                        <span className="text-muted-foreground font-bold mt-[4px] select-none text-sm">•</span>

                        {/* The Input - Flex Grow */}
                        <textarea
                            id={id ? (i === 0 ? id : `${id}-${i}`) : undefined}
                            name={name}
                            ref={el => { inputsRef.current[i] = el; }}
                            value={item}
                            onChange={(e) => handleChange(i, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, i)}
                            rows={1}
                            placeholder={i === 0 ? placeholder : ''}
                            className="flex-1 bg-transparent border-none outline-none text-sm text-foreground leading-relaxed resize-none overflow-hidden placeholder:text-muted-foreground/50 p-0 m-0 font-sans"
                            style={{ minHeight: '24px' }}
                        />
                    </div>
                ))}
            </div>

            {/* Clickable area at bottom to add new item if list is empty (fallback) */}
            {items.length === 0 && (
                <div onClick={() => handleChange(0, '')} className="h-8 cursor-text w-full" />
            )}
        </div>
    );
}
