'use client';

import React from 'react';

interface WorkshopPageShellProps {
    /** The header content (title, actions, breadcrumbs) */
    header: React.ReactNode;
    /** The main content (tabs, forms, etc.) */
    children: React.ReactNode;
    /** Optional additional classes for the glass-panel */
    className?: string;
}

/**
 * WorkshopPageShell - The Single Source of Truth for Workshop Page Layouts
 * 
 * Provides the standardized layout structure used across all workshop pages:
 * - Full-viewport background with gradient
 * - Sticky header with blur effect
 * - Fluid-width main container
 * - Glass-panel card with min-height
 * 
 * Usage:
 * ```tsx
 * <WorkshopPageShell header={<MyHeader />}>
 *   <TabsContent />
 * </WorkshopPageShell>
 * ```
 */
export function WorkshopPageShell({ header, children, className }: WorkshopPageShellProps) {
    return (
        <div className="min-h-screen bg-background text-foreground font-sans flex flex-col relative">
            {/* 1. Global Header Injection - Sticky with blur */}
            <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border">
                {header}
            </div>

            {/* 2. The Standardized "Fluid" Container */}
            <main className="grid gap-6 flex-1 pb-8 pt-8 px-8 w-full">
                {/* 3. The Standardized "Glass Card" */}
                <div className={`bg-card/50 backdrop-blur-xl border border-border rounded-2xl shadow-xl p-8 flex flex-col h-full min-h-[calc(100vh-140px)] ${className || ''}`}>
                    {children}
                </div>
            </main>
        </div>
    );
}
