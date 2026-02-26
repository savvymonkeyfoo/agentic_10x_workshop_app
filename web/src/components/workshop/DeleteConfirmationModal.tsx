"use client";

import React, { useState } from 'react';
import { deleteWorkshop } from '@/app/actions/delete-workshop';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

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
        <ConfirmModal
            isOpen={true}
            variant="danger"
            title="Delete Workshop?"
            description={`Are you sure you want to delete ${clientName}? This action cannot be undone.`}
            confirmLabel="Delete"
            onClose={onClose}
            onConfirm={handleDelete}
            isLoading={deleting}
        />
    );
}
