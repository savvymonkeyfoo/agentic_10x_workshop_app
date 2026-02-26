'use client';
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';

interface ActionModalProps {
    isOpen: boolean;
    title: string;
    description: string;
    confirmLabel?: string;
    onClose: () => void;
    onConfirm: () => void;
    isLoading?: boolean;
}

export function ActionConfirmationModal({
    isOpen,
    title,
    description,
    confirmLabel = "Continue",
    onClose,
    onConfirm,
    isLoading
}: ActionModalProps) {

    const [mounted, setMounted] = React.useState(false);
    const [isVisible, setIsVisible] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    React.useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
        } else {
            const timer = setTimeout(() => setIsVisible(false), 200);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!mounted || !isVisible) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                onClick={onClose}
                className={`absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity duration-200 ${
                    isOpen ? 'opacity-100' : 'opacity-0'
                }`}
            />

            {/* Modal Content */}
            <div
                className={`bg-card rounded-2xl shadow-2xl w-full max-w-md p-6 relative z-10 overflow-hidden border border-border transition-all duration-200 ${
                    isOpen
                        ? 'opacity-100 scale-100 translate-y-0'
                        : 'opacity-0 scale-95 translate-y-2'
                }`}
            >
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <AlertCircle className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-foreground">{title}</h3>
                        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                            {description}
                        </p>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        disabled={isLoading}
                        className="text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="default"
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="gap-2 shadow-sm"
                    >
                        {isLoading ? 'Processing...' : confirmLabel}
                    </Button>
                </div>
            </div>
        </div>,
        document.body
    );
}
