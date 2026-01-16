"use client";

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { createWorkshop } from '@/app/actions/create-workshop';
import { updateWorkshop } from '@/app/actions/update-workshop';

interface WorkshopData {
    id: string;
    clientName: string;
    clientLogoUrl: string | null;
    workshopDate: Date;
}

interface WorkshopModalProps {
    onClose: () => void;
    workshopToEdit?: WorkshopData | null;
}

import { toast } from 'sonner';

export function WorkshopModal({ onClose, workshopToEdit }: WorkshopModalProps) {
    const isEditMode = !!workshopToEdit;

    // Format date to YYYY-MM-DD for input
    const formatDateForInput = (date: Date) => {
        return date.toISOString().split('T')[0];
    };

    const [clientName, setClientName] = useState(workshopToEdit?.clientName || '');
    const [logoUrl, setLogoUrl] = useState<string | null>(workshopToEdit?.clientLogoUrl || null);
    const [workshopDate, setWorkshopDate] = useState(
        workshopToEdit?.workshopDate
            ? formatDateForInput(new Date(workshopToEdit.workshopDate))
            : formatDateForInput(new Date())
    );

    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Reset state if modal opens with different props (though usually unmounted)
    useEffect(() => {
        if (workshopToEdit) {
            setClientName(workshopToEdit.clientName);
            setLogoUrl(workshopToEdit.clientLogoUrl);
            setWorkshopDate(formatDateForInput(new Date(workshopToEdit.workshopDate)));
        }
    }, [workshopToEdit]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!['image/jpeg', 'image/png'].includes(file.type)) {
            toast.error('Only JPG and PNG files are allowed.');
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            if (!res.ok) throw new Error('Upload failed');

            const data = await res.json();
            setLogoUrl(data.url);
            toast.success('Logo uploaded successfully');
        } catch (err) {
            console.error(err);
            toast.error('Failed to upload logo.');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!clientName) return;

        setSubmitting(true);
        try {
            const formData = new FormData();

            if (isEditMode) {
                formData.append('id', workshopToEdit.id);
            }

            formData.append('clientName', clientName);
            formData.append('workshopDate', workshopDate);
            if (logoUrl) {
                formData.append('clientLogoUrl', logoUrl);
            }

            if (isEditMode) {
                await updateWorkshop(formData);
                toast.success('Workshop updated successfully');
                onClose();
            } else {
                await createWorkshop(formData);
                toast.success('Workshop created successfully');
            }

        } catch (err: unknown) {
            // Ignore redirect errors
            const errorObj = err as { message?: string; digest?: string };
            if (errorObj.message && (errorObj.message.includes('NEXT_REDIRECT') || errorObj.digest?.includes('NEXT_REDIRECT'))) {
                return;
            }

            console.error("Submission Error:", err);
            const message = err instanceof Error ? err.message : 'Unknown error';
            toast.error(`Failed to ${isEditMode ? 'update' : 'create'} workshop: ${message}`);
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-md w-full border border-slate-100 dark:border-slate-700">
                <h2 className="text-2xl font-bold text-brand-navy dark:text-white mb-6">
                    {isEditMode ? 'Edit Workshop' : 'Create New Workshop'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Client Name */}
                    <div>
                        <label className="block text-sm font-bold text-slate-500 mb-2">Client Name</label>
                        <input
                            type="text"
                            required
                            value={clientName}
                            onChange={(e) => setClientName(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-brand-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
                            placeholder="e.g. Acme Corp"
                        />
                    </div>

                    {/* Workshop Date */}
                    <div>
                        <label className="block text-sm font-bold text-slate-500 mb-2">Workshop Date</label>
                        <input
                            type="date"
                            required
                            value={workshopDate}
                            onChange={(e) => setWorkshopDate(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-brand-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-blue [color-scheme:light] dark:[color-scheme:dark]"
                        />
                    </div>

                    {/* Logo Upload */}
                    <div>
                        <label className="block text-sm font-bold text-slate-500 mb-2">Client Logo (Optional)</label>
                        <div className="flex items-center gap-4">
                            {logoUrl ? (
                                <div className="w-16 h-16 rounded-xl border border-slate-200 overflow-hidden relative">
                                    <Image src={logoUrl} alt="Logo Preview" fill className="object-contain" sizes="64px" />
                                    <button
                                        type="button"
                                        onClick={() => setLogoUrl(null)}
                                        className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-bl-lg text-xs z-10"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ) : (
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-brand-blue hover:bg-brand-blue/5 transition-colors"
                                >
                                    <span className="text-2xl text-slate-400">+</span>
                                </div>
                            )}

                            <div className="flex-1">
                                <p className="text-xs text-slate-400 mb-2">JPG or PNG. Max 200px (auto-resized).</p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".jpg, .jpeg, .png"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                {uploading && <span className="text-xs text-brand-blue animate-pulse">Uploading...</span>}
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-slate-500 font-semibold hover:text-brand-navy transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={uploading || submitting || !clientName}
                            className="px-6 py-2 bg-brand-blue text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Save Changes' : 'Create Workshop')}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}
