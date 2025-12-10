"use client";

import React, { useState } from 'react';
import { WorkshopModal } from './WorkshopModal';

export function NewWorkshopButton() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="px-6 py-3 bg-brand-blue text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Workshop
            </button>

            {isOpen && <WorkshopModal onClose={() => setIsOpen(false)} />}
        </>
    );
}
