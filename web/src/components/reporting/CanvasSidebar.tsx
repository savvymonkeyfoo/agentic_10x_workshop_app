"use client";

import React from 'react';
import Link from 'next/link';
import { useSearchParams, useParams } from 'next/navigation';
import { CheckCircle2, CircleDashed } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarOpportunity {
    id: string;
    projectName: string;
    updatedAt: Date;
    canvasLastGeneratedAt: Date | null;
    scoreValue: number | null;
    frictionStatement: string | null;
}

interface CanvasSidebarProps {
    opportunities: SidebarOpportunity[];
}

export function CanvasSidebar({ opportunities }: CanvasSidebarProps) {
    const params = useParams();
    const searchParams = useSearchParams();
    const workshopId = params.id as string;
    const activeId = searchParams.get('opportunityId');

    return (
        <div className="w-full h-full flex flex-col">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Projects</h2>
                <div className="text-xs text-slate-400">Select to view canvas</div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {opportunities.map(opp => {
                    const isActive = activeId === opp.id;
                    const isComplete = (opp.scoreValue || 0) > 0 && (opp.frictionStatement || '').length > 0;

                    return (
                        <Link
                            key={opp.id}
                            href={`/workshop/${workshopId}/reporting?opportunityId=${opp.id}`}
                            className={cn(
                                "flex items-start gap-3 p-3 rounded-lg text-sm transition-all group",
                                isActive
                                    ? "bg-brand-blue/10 text-brand-blue border border-brand-blue/20"
                                    : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-transparent"
                            )}
                        >
                            <div className="shrink-0 mt-0.5">
                                {isComplete ? (
                                    <CheckCircle2 size={16} className="text-green-500" />
                                ) : (
                                    <CircleDashed size={16} className="text-gray-400" />
                                )}
                            </div>

                            <div className="flex flex-col overflow-hidden">
                                <span className={cn(
                                    "font-medium whitespace-normal line-clamp-2 leading-tight",
                                    isComplete ? "text-gray-700 dark:text-gray-200" : "text-gray-400 italic"
                                )}>
                                    {opp.projectName || "Untitled Project"}
                                </span>
                                {!isComplete && (
                                    <span className="text-[9px] uppercase font-bold text-amber-500 mt-1">Incomplete</span>
                                )}
                            </div>
                        </Link>
                    );
                })}

                {opportunities.length === 0 && (
                    <div className="text-center p-4 text-slate-400 text-xs text-balance">
                        No opportunities found. Go to &apos;Input&apos; to create one.
                    </div>
                )}
            </div>
        </div>
    );
}
