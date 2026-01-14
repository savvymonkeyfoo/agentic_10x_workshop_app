'use client';

import { Asset } from '@prisma/client';
import { Loader2, Trash2, FileText, CheckCircle2, UploadCloud } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { deleteAsset } from '@/app/actions/delete-asset';

interface AssetRegistryProps {
    workshopId: string;
    type: 'DOSSIER' | 'BACKLOG' | 'MARKET_SIGNAL';
    title: string;
    assets: Asset[];
}

export function AssetRegistry({ workshopId, type, title, assets }: AssetRegistryProps) {
    const router = useRouter();
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Local state for polling updates without page refresh
    const [items, setItems] = useState<Asset[]>(assets);

    // Sync props to state if props change (e.g. initial load or parent refresh)
    useEffect(() => {
        setItems(assets);
    }, [assets]);

    // Polling Logic: Targeted Status Checks
    useEffect(() => {
        const indexingItems = items.filter(a => a.status === 'PROCESSING');
        if (indexingItems.length === 0) return;

        let attempts = 0;
        const maxAttempts = 40; // 2 minutes approx (3s interval)

        const interval = setInterval(async () => {
            attempts++;
            if (attempts > maxAttempts) {
                // Timeout logic: Mark hanging items as ERROR locally to stop spinning
                setItems(prev => prev.map(a =>
                    a.status === 'PROCESSING' ? { ...a, status: 'ERROR' } : a
                ));
                toast.error("Indexing timed out. Please try again.");
                clearInterval(interval);
                return;
            }

            // Check status for each indexing item
            await Promise.all(indexingItems.map(async (item) => {
                try {
                    const res = await fetch(`/api/assets/${item.id}/status`);
                    if (res.ok) {
                        const data = await res.json();
                        if (data.status !== 'PROCESSING') {
                            // Update local state if status changed
                            setItems(prev => prev.map(a =>
                                a.id === item.id ? { ...a, status: data.status } : a
                            ));
                            if (data.status === 'READY') {
                                toast.success(`${item.name} is ready!`);
                                router.refresh(); // Optional: Refresh to ensure full sync eventually
                            }
                        }
                    } else if (res.status === 404) {
                        // Removed?
                        setItems(prev => prev.filter(a => a.id !== item.id));
                    }
                } catch (e) {
                    console.error("Poll Error", e);
                }
            }));
        }, 3000);

        return () => clearInterval(interval);
    }, [items, router]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        if (files.length === 0) return;

        setIsUploading(true);
        const toastId = toast.loading(`Uploading ${files.length} file(s)...`);

        try {
            const newAssets: Asset[] = [];

            await Promise.all(files.map(async (file) => {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('workshopId', workshopId);
                formData.append('assetType', type);

                const res = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                });

                if (!res.ok) throw new Error(`Failed to upload ${file.name}`);

                const asset = await res.json();
                console.log("Asset Created:", asset.id);
                newAssets.push(asset);
            }));

            // Updates local state immediately to show 'INDEXING'
            setItems(prev => [...prev, ...newAssets]);

            toast.success('Upload complete', { id: toastId });
            router.refresh(); // Refresh to sync parent component state
        } catch (error) {
            console.error(error);
            toast.error('Upload failed', { id: toastId });
        } finally {
            setIsUploading(false);
        }
    }, [workshopId, type, router]);

    const handleDelete = async (assetId: string) => {
        const toastId = toast.loading('Deleting asset...');

        // Optimistic update
        setItems(prev => prev.filter(a => a.id !== assetId));

        const result = await deleteAsset(assetId);

        if (result.success) {
            toast.success('Asset deleted', { id: toastId });
            router.refresh();
        } else {
            toast.error(result.error || 'Failed to delete', { id: toastId });
            // Revert unnecessary if we trust server refresh, or could refetch
        }
    };


    return (
        <div className="flex flex-col space-y-4 h-full">
            <h3 className="text-lg font-semibold text-slate-800">{title}</h3>

            {/* Drop Zone */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                    border-2 border-dashed rounded-xl p-6 transition-all duration-200
                    flex flex-col items-center justify-center text-center cursor-pointer
                    ${isDragging
                        ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]'
                        : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                    }
                `}
            >
                <div className="p-3 bg-white rounded-full shadow-sm mb-3">
                    {isUploading ? (
                        <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                    ) : (
                        <UploadCloud className={`w-6 h-6 ${isDragging ? 'text-indigo-600' : 'text-slate-400'}`} />
                    )}
                </div>
                <p className="text-sm font-medium text-slate-700">
                    {isUploading ? 'Uploading...' : 'Drag & drop files here'}
                </p>
                <p className="text-xs text-slate-400 mt-1">PDF or Text support</p>
            </div>

            {/* Asset Table */}
            <div className="flex-1 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col">
                {items.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
                        <p className="text-sm">No assets registered</p>
                    </div>
                ) : (
                    <div className="overflow-y-auto">
                        <table className="w-full text-sm text-left table-fixed">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100 sticky top-0">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Name</th>
                                    <th className="px-4 py-3 font-medium w-32">Status</th>
                                    <th className="px-4 py-3 font-medium w-16 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {items.map((asset) => (
                                    <tr key={asset.id} className="group hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center space-x-3 w-full">
                                                <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                                <span className="font-medium text-slate-700 truncate flex-1 min-w-0" title={asset.name}>
                                                    {asset.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {asset.status === 'READY' ? (
                                                <div className="flex items-center space-x-1.5 text-emerald-600">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                    <span className="text-xs font-medium">Ready</span>
                                                </div>
                                            ) : asset.status === 'PROCESSING' ? (
                                                <div className="flex items-center space-x-2 text-indigo-600">
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                    <span className="text-xs font-medium">Processing...</span>
                                                </div>
                                            ) : (
                                                <span className="text-xs font-medium text-red-500">Error</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                onClick={() => handleDelete(asset.id)}
                                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                                                title="Delete Asset"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
