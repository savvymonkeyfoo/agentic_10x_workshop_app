"use client";

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, BarChart3, FileText } from 'lucide-react';

interface WorkshopHeaderProps {
    clientName: string;
    clientLogoUrl: string | null;
}

export function WorkshopHeader({ clientName, clientLogoUrl }: WorkshopHeaderProps) {
    // 1. All hooks at the top level
    const [mounted, setMounted] = useState(false);
    const [portalElement, setPortalElement] = useState<HTMLElement | null>(null);
    const params = useParams();
    const pathname = usePathname();

    useEffect(() => {
        setMounted(true);
        const el = document.getElementById('workshop-header-portal');
        if (el) {
            setPortalElement(el);
        }
    }, []);

    // 2. Conditional return only AFTER hooks
    if (!mounted || !portalElement) return null;

    const workshopId = params.id as string;

    const isActive = (path: string) => {
        if (path === 'input') return pathname === `/workshop/${workshopId}`;
        return pathname.includes(path);
    };

    const NAV_ITEMS = [
        { id: 'input', label: 'Capture', icon: LayoutDashboard, href: `/workshop/${workshopId}` },
        { id: 'analysis', label: 'Prioritise', icon: BarChart3, href: `/workshop/${workshopId}/analysis` },
        { id: 'reporting', label: 'Canvas', icon: FileText, href: `/workshop/${workshopId}/reporting` },
    ];

    return createPortal(
        <div className="flex items-center">
            {/* Client Info */}
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
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800/50 rounded-lg p-1 gap-1">
                {NAV_ITEMS.map(item => {
                    const active = isActive(item.id);
                    return (
                        <Link
                            key={item.id}
                            href={item.href}
                            className={`
                            flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all
                            ${active
                                    ? 'bg-white dark:bg-slate-700 text-brand-blue shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                                }
                        `}
                        >
                            <item.icon size={16} />
                            <span className="hidden lg:inline">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </div>,
        portalElement
    );
}
