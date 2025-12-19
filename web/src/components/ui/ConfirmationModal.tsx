import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isLoading?: boolean;
}

export function ConfirmationModal({
    isOpen, onClose, onConfirm, title, description,
    confirmLabel = "Yes, Overwrite",
    cancelLabel = "Cancel",
    isLoading
}: ConfirmationModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 transform transition-all scale-100">

                <div className="flex gap-4">
                    {/* Icon Container */}
                    <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                            <AlertCircle className="w-6 h-6 text-purple-600" />
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                            {title}
                        </h3>
                        <p className="text-sm text-gray-500 leading-relaxed mb-6">
                            {description}
                        </p>

                        {/* Actions */}
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={onClose}
                                disabled={isLoading}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                            >
                                {cancelLabel}
                            </button>
                            <button
                                onClick={onConfirm}
                                disabled={isLoading}
                                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 shadow-sm"
                            >
                                {isLoading ? 'Processing...' : confirmLabel}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
