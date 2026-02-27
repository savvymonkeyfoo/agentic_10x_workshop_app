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
            <div className="p-4 border-b border-border">
                <h2 className="text-xs font-bold uppercase tracking-wider text-secondary mb-1">Projects</h2>
                <div className="text-xs text-tertiary">Select to view canvas</div>
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
                                    : "hover:bg-surface-hover text-primary border border-transparent"
                            )}
                        >
                            <div className="shrink-0 mt-0.5">
                                {isComplete ? (
                                    <CheckCircle2 size={16} className="text-success" />
                                ) : (
                                    <CircleDashed size={16} className="text-tertiary" />
                                )}
                            </div>

                            <div className="flex flex-col overflow-hidden">
                                <span className={cn(
                                    "font-medium whitespace-normal line-clamp-2 leading-tight",
                                    isComplete ? "text-primary" : "text-tertiary italic"
                                )}>
                                    {opp.projectName || "Untitled Project"}
                                </span>
                                {!isComplete && (
                                    <span className="text-[9px] uppercase font-bold text-warning mt-1">Incomplete</span>
                                )}
                            </div>
                        </Link>
                    );
                })}

                {opportunities.length === 0 && (
                    <div className="text-center p-4 text-tertiary text-xs text-balance">
                        No opportunities found. Go to &apos;Input&apos; to create one.
                    </div>
                )}
            </div>
        </div>
    );
}
