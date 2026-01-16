'use client';
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
    React.useEffect(() => setMounted(true), []);

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="bg-card rounded-2xl shadow-2xl w-full max-w-md p-6 relative z-10 overflow-hidden border border-border"
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
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
