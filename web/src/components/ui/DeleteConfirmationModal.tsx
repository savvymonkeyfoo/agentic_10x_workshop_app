import React from 'react';
import { AlertTriangle, ArrowLeftCircle } from 'lucide-react';

interface DeleteModalProps {
    isOpen: boolean;
    title: string;
    description: string;
    onClose: () => void;
    onConfirm: () => void;
    isDeleting?: boolean;
    confirmLabel?: string;  // Custom button label
    variant?: 'delete' | 'demote';  // Visual variant
}

export function DeleteConfirmationModal({
    isOpen,
    title,
    description,
    onClose,
    onConfirm,
    isDeleting,
    confirmLabel = 'Yes, Delete Opportunity',
    variant = 'delete'
}: DeleteModalProps) {
    if (!isOpen) return null;

    const isDemote = variant === 'demote';
    const iconBgColor = isDemote ? 'bg-amber-50' : 'bg-red-50';
    const iconColor = isDemote ? 'text-amber-600' : 'text-red-600';
    const buttonColor = isDemote ? 'bg-amber-500 hover:bg-amber-600' : 'bg-red-600 hover:bg-red-700';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card rounded-xl shadow-2xl border border-border w-full max-w-md p-6 animate-in zoom-in-95 duration-200 mx-4">

                <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-full ${iconBgColor} flex items-center justify-center shrink-0`}>
                        {isDemote ? (
                            <ArrowLeftCircle className={`w-5 h-5 ${iconColor}`} />
                        ) : (
                            <AlertTriangle className={`w-5 h-5 ${iconColor}`} />
                        )}
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-foreground">{title}</h3>
                        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                            {description}
                        </p>
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                    <button
                        onClick={onClose}
                        disabled={isDeleting}
                        className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className={`px-4 py-2 text-sm font-semibold text-primary-foreground ${buttonColor} rounded-lg shadow-sm transition-colors flex items-center gap-2`}
                    >
                        {isDeleting ? 'Processing...' : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
