import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

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
    confirmLabel = "Yes, Continue",
    cancelLabel = "Cancel",
    isLoading
}: ConfirmationModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader className="gap-2">
                    <div className="flex items-center gap-2 text-amber-600">
                        <AlertTriangle className="h-5 w-5" />
                        <DialogTitle>{title}</DialogTitle>
                    </div>
                    <DialogDescription className="pt-2">
                        {description}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={onClose} disabled={isLoading}>
                        {cancelLabel}
                    </Button>
                    <Button onClick={onConfirm} disabled={isLoading} className="bg-purple-600 hover:bg-purple-700">
                        {isLoading ? 'Processing...' : confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
