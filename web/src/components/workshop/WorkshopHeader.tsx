"use client";

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface WorkshopHeaderProps {
    clientName: string;
    clientLogoUrl: string | null;
}

export function WorkshopHeader({ clientName, clientLogoUrl }: WorkshopHeaderProps) {
    const [mounted, setMounted] = useState(false);
    const [portalElement, setPortalElement] = useState<HTMLElement | null>(null);

    useEffect(() => {
        setMounted(true);
        const el = document.getElementById('workshop-header-portal');
        if (el) {
            setPortalElement(el);
        }
    }, []);

    if (!mounted || !portalElement) return null;

    return createPortal(
        <div className="flex items-center gap-3 animate-fade-in pr-4 border-r border-slate-200 dark:border-slate-700 mr-4 h-8">
            {clientLogoUrl ? (
                <div className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-600 bg-white overflow-hidden">
                    <img src={clientLogoUrl} alt="Logo" className="w-full h-full object-contain" />
                </div>
            ) : (
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400">
                    <span className="text-xs font-bold">{clientName.substring(0, 2).toUpperCase()}</span>
                </div>
            )}
            <span className="font-semibold text-brand-navy dark:text-white hidden sm:block">
                {clientName}
            </span>
        </div>,
        portalElement
    );
}
