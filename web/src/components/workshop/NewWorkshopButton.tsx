"use client";

import React, { useState } from 'react';
import { WorkshopModal } from './WorkshopModal';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export function NewWorkshopButton() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <Button
                onClick={() => setIsOpen(true)}
                size="lg"
                className="shadow-lg hover:shadow-xl"
            >
                <Plus className="w-5 h-5" />
                New Workshop
            </Button>

            {isOpen && <WorkshopModal onClose={() => setIsOpen(false)} />}
        </>
    );
}
