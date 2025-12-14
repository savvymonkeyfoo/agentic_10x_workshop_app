"use client";

import React from 'react';
import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, BarChart3, FileText } from 'lucide-react';

interface WorkshopHeaderProps {
    clientName: string;
    clientLogoUrl: string | null;
}

export function WorkshopHeader({ clientName, clientLogoUrl }: WorkshopHeaderProps) {
    const params = useParams();
    const pathname = usePathname();
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

    // Simplified: Return directly, no Portal
    // This ensures it renders in the Layout inheritance tree, not dependent on a DOM node existence
    return (
        <div className="flex items-center justify-between w-full px-8 py-2 bg-white/50 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 sticky top-20 z-40">
            <div className="flex items-center">
                {/* Client Info */}
                <div className="flex items-center gap-3 pr-4 border-r border-slate-200 dark:border-slate-700 mr-4 h-8">
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
            </div>
        </div>
    );
}
