import React from 'react';

export function SmartList({ content, className }: { content: string, className?: string }) {
    if (!content) return null;

    // Split by newlines to preserve structure
    const lines = content.split('\n');

    // Check if it looks like a list (bullet points)
    const hasBullets = lines.some(l => l.trim().match(/^•|-|\d+\./));

    if (!hasBullets) {
        return <div className={`whitespace-pre-wrap ${className}`}>{content}</div>;
    }

    return (
        <div className={`flex flex-col gap-2 ${className}`}>
            {lines.map((line, i) => {
                const trimmed = line.trim();
                if (!trimmed) return null;

                // Detect bullet char
                const match = trimmed.match(/^([•\-\*]|\d+\.)\s*(.*)/);

                if (match) {
                    const bullet = match[1];
                    const text = match[2];
                    return (
                        <div key={i} className="flex gap-2 items-start text-left">
                            <span className="text-tertiary font-bold shrink-0 select-none w-4 text-center mt-[2px]">{bullet.replace(/\d+\./, '•')}</span> {/* Normalized bullet to • unless we want numbers. Let's stick to • for clean look */}
                            <span className="flex-1 min-w-0">{text}</span>
                        </div>
                    );
                } else {
                    // Continuation line or non-bullet
                    return <div key={i} className="pl-6">{trimmed}</div>;
                }
            })}
        </div>
    );
}
