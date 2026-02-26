"use client";

import React, { useState } from 'react';
import { deleteWorkshop } from '@/app/actions/delete-workshop';
import { Button } from '@/components/ui/button';

interface DeleteConfirmationModalProps {
    workshopId: string;
    clientName: string;
    onClose: () => void;
}

export function DeleteConfirmationModal({ workshopId, clientName, onClose }: DeleteConfirmationModalProps) {
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async () => {
        setDeleting(true);
        const result = await deleteWorkshop(workshopId);

        if (result.success) {
            onClose();
        } else {
            console.error("Delete Error:", result.error);
            alert(`Failed to delete workshop: ${result.error}`);
            setDeleting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <div className="bg-card rounded-2xl shadow-2xl p-8 max-w-sm w-full border border-destructive/20">
                <div className="text-destructive mb-4 flex justify-center">
                    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </div>

                <h2 className="text-xl font-bold text-center text-foreground mb-2">Delete Workshop?</h2>
                <p className="text-center text-muted-foreground mb-6">
                    Are you sure you want to delete <span className="font-bold text-foreground">{clientName}</span>? This action cannot be undone.
                </p>

                <div className="flex gap-3">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="flex-1 text-muted-foreground font-bold hover:bg-muted"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={deleting}
                        className="flex-1 shadow-lg hover:shadow-red-500/30 transition-all font-bold"
                    >
                        {deleting ? 'Deleting...' : 'Delete'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
