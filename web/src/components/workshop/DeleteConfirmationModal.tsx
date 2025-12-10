"use client";

import React, { useState } from 'react';
import { deleteWorkshop } from '@/app/actions/delete-workshop';

interface DeleteConfirmationModalProps {
    workshopId: string;
    clientName: string;
    onClose: () => void;
}

export function DeleteConfirmationModal({ workshopId, clientName, onClose }: DeleteConfirmationModalProps) {
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await deleteWorkshop(workshopId);
            onClose();
        } catch (err: any) {
            console.error("Delete Error:", err);
            alert(`Failed to delete workshop: ${err.message}`);
            setDeleting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-sm w-full border border-status-risk">
                <div className="text-status-risk mb-4 flex justify-center">
                    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </div>

                <h2 className="text-xl font-bold text-center text-brand-navy dark:text-white mb-2">Delete Workshop?</h2>
                <p className="text-center text-slate-500 mb-6">
                    Are you sure you want to delete <span className="font-bold text-brand-navy dark:text-gray-300">{clientName}</span>? This action cannot be undone.
                </p>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="flex-1 py-3 bg-status-risk text-white font-bold rounded-xl shadow-lg hover:shadow-red-500/30 transition-all disabled:opacity-50"
                    >
                        {deleting ? 'Deleting...' : 'Delete'}
                    </button>
                </div>
            </div>
        </div>
    );
}
