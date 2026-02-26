import React from 'react';

interface WorkflowPhase {
    name?: string;
    [key: string]: unknown;
}

export function StaticWorkflow({ phases }: { phases: WorkflowPhase[] }) {
    const list = Array.isArray(phases) ? phases : [];
    if (list.length === 0) return null;

    return (
        <div className="w-full flex flex-wrap gap-4 justify-center content-center h-full p-2">
            {list.map((phase, index) => (
                <div key={index} className="w-[140px] h-[80px] bg-warning-subtle shadow-md border-t border-warning p-3 flex items-center justify-center text-center transform hover:scale-105 transition-transform rotate-1 first:-rotate-1 last:rotate-2">
                    <span className="text-sm font-bold text-primary leading-tight font-sans">
                        {phase.name}
                    </span>
                </div>
            ))}
        </div>
    );
}
