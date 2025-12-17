"use client";

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { LayoutDashboard, BarChart3, FileText, Lightbulb, BookOpen } from 'lucide-react';

interface WorkshopHeaderProps {
    clientName: string;
    clientLogoUrl: string | null;
}

export function WorkshopHeader({ clientName, clientLogoUrl }: WorkshopHeaderProps) {
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

    if (!mounted || !portalElement) return null;

    const workshopId = params.id as string;

    const isActive = (path: string) => {
        if (path === 'input') return pathname === `/workshop/${workshopId}` || pathname.includes('/input');
        return pathname.includes(path);
    };

    const NAV_ITEMS = [
        { id: 'research', label: 'Context', icon: BookOpen, href: `/workshop/${workshopId}/research` },
        { id: 'ideation', label: 'Ideation', icon: Lightbulb, href: `/workshop/${workshopId}/ideation` },
        { id: 'input', label: 'Capture', icon: LayoutDashboard, href: `/workshop/${workshopId}/input` },
        { id: 'analysis', label: 'Prioritise', icon: BarChart3, href: `/workshop/${workshopId}/analysis` },
        { id: 'reporting', label: 'Canvas', icon: FileText, href: `/workshop/${workshopId}/reporting` },
    ];

    return createPortal(
        <div className="flex items-center gap-4 animate-fade-in">
            {/* Workshop Badge */}
            <div className="flex items-center gap-2 pl-4 border-l border-slate-200 dark:border-slate-700">
                {clientLogoUrl ? (
                    <div className="w-7 h-7 rounded-full border border-slate-200 dark:border-slate-600 bg-white overflow-hidden flex items-center justify-center relative">
                        <Image src={clientLogoUrl} alt={`${clientName} logo`} fill className="object-contain" sizes="28px" />
                    </div>
                ) : (
                    <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 text-[10px] font-bold">
                        {clientName?.substring(0, 2).toUpperCase() || 'WK'}
                    </div>
                )}
                <span className="font-semibold text-brand-navy dark:text-white text-sm hidden md:block">
                    {clientName}
                </span>
            </div>

            {/* Vertical Divider */}
            <div className="h-5 w-px bg-slate-200 dark:bg-slate-700" />

            {/* Navigation Items (No container, individual buttons with icons) */}
            {NAV_ITEMS.map(item => {
                const active = isActive(item.id);
                return (
                    <Link
                        key={item.id}
                        href={item.href}
                        className={`
                            flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all
                            ${active
                                ? 'bg-slate-100 dark:bg-slate-800 text-brand-blue dark:text-brand-cyan'
                                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                            }
                        `}
                    >
                        <item.icon size={16} />
                        <span>{item.label}</span>
                    </Link>
                );
            })}
        </div>,
        portalElement
    );
}
