import React from 'react';

export function StaticWorkflow({ phases }: { phases: any[] }) {
    const list = Array.isArray(phases) ? phases : [];
    if (list.length === 0) return null;

    return (
        <div className="w-full flex flex-wrap gap-4 justify-center content-center h-full p-2">
            {list.map((phase, index) => (
                <div key={index} className="w-[140px] h-[80px] bg-[#fff9c4] shadow-md border-t border-yellow-200 p-3 flex items-center justify-center text-center transform hover:scale-105 transition-transform rotate-1 first:-rotate-1 last:rotate-2">
                    <span className="text-sm font-bold text-slate-800 leading-tight font-sans">
                        {phase.name}
                    </span>
                </div>
            ))}
        </div>
    );
}
