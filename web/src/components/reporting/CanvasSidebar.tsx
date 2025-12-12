"use client";

import React from 'react';
import Link from 'next/link';
import { useSearchParams, useParams } from 'next/navigation';
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming cn exists, or I'll use clsx standard

interface SidebarOpportunity {
    id: string;
    projectName: string;
    updatedAt: Date;
    canvasLastGeneratedAt: Date | null;
}

interface CanvasSidebarProps {
    opportunities: SidebarOpportunity[];
}

export function CanvasSidebar({ opportunities }: CanvasSidebarProps) {
    const params = useParams();
    const searchParams = useSearchParams();
    const workshopId = params.id as string;
    const activeId = searchParams.get('opportunityId');

    const getStatus = (opp: SidebarOpportunity) => {
        if (!opp.canvasLastGeneratedAt) return 'NOT_GENERATED';
        if (new Date(opp.updatedAt) > new Date(opp.canvasLastGeneratedAt)) return 'OUTDATED';
        return 'SYNCED';
    };

    return (
        <div className="w-full h-full flex flex-col">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Projects</h2>
                <div className="text-xs text-slate-400">Select to view strategy</div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {opportunities.map(opp => {
                    const status = getStatus(opp);
                    const isActive = activeId === opp.id;

                    return (
                        <Link
                            key={opp.id}
                            href={`/workshop/${workshopId}/reporting?opportunityId=${opp.id}`}
                            className={cn(
                                "flex items-center gap-3 p-3 rounded-lg text-sm transition-all group",
                                isActive
                                    ? "bg-brand-blue/10 text-brand-blue border border-brand-blue/20"
                                    : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-transparent"
                            )}
                        >
                            <div className="shrink-0">
                                {status === 'SYNCED' && <CheckCircle2 size={14} className="text-green-500" />}
                                {status === 'OUTDATED' && <AlertCircle size={14} className="text-amber-500" />}
                                {status === 'NOT_GENERATED' && <Circle size={14} className="text-slate-300" />}
                            </div>

                            <span className="font-medium truncate">{opp.projectName || "Untitled Project"}</span>
                        </Link>
                    );
                })}

                {opportunities.length === 0 && (
                    <div className="text-center p-4 text-slate-400 text-xs text-balance">
                        No opportunities found. Go to 'Input' to create one.
                    </div>
                )}
            </div>
        </div>
    );
}
