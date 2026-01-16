import React from 'react';

interface WorkshopCardProps {
    title: string;
    children: React.ReactNode;
    className?: string; // For height or flex adjustments
    noPadding?: boolean; // Option to remove content padding if needed
}

export const WorkshopCard = ({ title, children, className = '', noPadding = false }: WorkshopCardProps) => {
    return (
        <div className={`relative flex flex-col rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md ${className}`}>
            {/* Standardized Top-Left Header */}
            <div className="px-3 pt-3 pb-0">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{title}</span>
            </div>

            {/* Content Area */}
            <div className={`flex flex-1 flex-col ${noPadding ? '' : 'p-3'}`}>
                {children}
            </div>
        </div>
    );
};
