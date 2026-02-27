"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { WorkshopModal } from './WorkshopModal';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';

interface WorkshopCardProps {
    workshop: {
        id: string;
        clientName: string;
        clientLogoUrl: string | null;
        workshopDate: Date;
        createdAt: Date;
        _count: {
            opportunities: number;
        };
    };
}

export function WorkshopCard({ workshop }: WorkshopCardProps) {
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    // Format display date: "10 Dec 2025"
    const displayDate = new Date(workshop.workshopDate).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });

    return (
        <>
            <div className="group relative block bg-card dark:bg-card rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all border border-border overflow-hidden">
                <Link href={`/workshop/${workshop.id}/ideation`} className="absolute inset-0 z-0"></Link>

                <div className="absolute top-0 left-0 w-2 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>

                {/* Edit/Delete Actions (Top Right) */}
                <div className="absolute top-4 right-4 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => { e.preventDefault(); setIsEditOpen(true); }}
                        className="shadow-sm hover:text-primary"
                        title="Edit"
                    >
                        <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => { e.preventDefault(); setIsDeleteOpen(true); }}
                        className="shadow-sm hover:text-destructive"
                        title="Delete"
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>

                <div className="relative pointer-events-none"> {/* Content wrapper */}
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex-1 flex gap-3 items-center">
                            {/* Logo or Default Icon */}
                            {workshop.clientLogoUrl ? (
                                <div className="w-10 h-10 rounded-lg border border-border bg-card p-1 overflow-hidden relative">
                                    <Image src={workshop.clientLogoUrl} alt={`${workshop.clientName} logo`} fill className="object-contain" sizes="40px" />
                                </div>
                            ) : (
                                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                </div>
                            )}
                            <div>
                                <h2 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors leading-tight">
                                    {workshop.clientName}
                                </h2>
                                <span className="text-xs text-muted-foreground">
                                    {displayDate}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-muted-foreground text-sm mt-4 pl-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <span>{workshop._count.opportunities} Opportunities</span>
                    </div>
                </div>
            </div>

            {/* Modals outside pointer-events-none */}
            {isEditOpen && (
                <WorkshopModal
                    onClose={() => setIsEditOpen(false)}
                    workshopToEdit={{
                        id: workshop.id,
                        clientName: workshop.clientName,
                        clientLogoUrl: workshop.clientLogoUrl,
                        workshopDate: workshop.workshopDate
                    }}
                />
            )}

            {isDeleteOpen && (
                <DeleteConfirmationModal
                    workshopId={workshop.id}
                    clientName={workshop.clientName}
                    onClose={() => setIsDeleteOpen(false)}
                />
            )}
        </>
    );
}
