'use client';

import { Asset } from '@prisma/client';
import { Trash2, FileText, UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
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

    // Local state for SSE updates without page refresh
    const [items, setItems] = useState<Asset[]>(assets);

    // Sync props to state if props change (e.g. initial load or parent refresh)
    useEffect(() => {
        setItems(assets);
    }, [assets]);

    // Server-Sent Events: Real-time Status Updates
    useEffect(() => {
        const processingItems = items.filter(a => a.status === 'PROCESSING');
        if (processingItems.length === 0) return;

        let eventSource: EventSource | null = null;
        let timeoutId: NodeJS.Timeout | null = null;

        try {
            // Connect to SSE endpoint
            eventSource = new EventSource(`/api/assets/status-stream?workshopId=${workshopId}`);

            // Handle incoming updates
            eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    if (data.type === 'initial' || data.type === 'update') {
                        const updatedAssets = data.assets;

                        // Update local state with new statuses
                        setItems(prev => prev.map(asset => {
                            const updated = updatedAssets.find((u: Asset) => u.id === asset.id);
                            if (updated && updated.status !== asset.status) {
                                if (updated.status === 'READY') {
                                    toast.success(`${asset.name} is ready!`);
                                    router.refresh();
                                }
                                return { ...asset, status: updated.status };
                            }
                            return asset;
                        }));
                    }
                } catch (error) {
                    console.error('SSE parse error:', error);
                }
            };

            eventSource.onerror = () => {
                eventSource?.close();
                console.log('SSE connection closed');
            };

            // Timeout after 2 minutes
            timeoutId = setTimeout(() => {
                setItems(prev => prev.map(a =>
                    a.status === 'PROCESSING' ? { ...a, status: 'ERROR' } : a
                ));
                toast.error("Processing timed out. Please try again.");
                eventSource?.close();
            }, 120000);

        } catch (error) {
            console.error('SSE connection error:', error);
        }

        return () => {
            eventSource?.close();
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [items, workshopId, router]);

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
            <h3 className="text-lg font-semibold text-primary">{title}</h3>

            {/* Drop Zone */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                    border-2 border-dashed rounded-xl p-6 transition-all duration-200
                    flex flex-col items-center justify-center text-center cursor-pointer
                    ${isDragging
                        ? 'border-intelligence bg-intelligence-subtle scale-[1.01]'
                        : 'border-muted hover:border-intelligence hover:bg-surface-subtle'
                    }
                `}
            >
                <div className="p-3 bg-card rounded-full shadow-sm mb-3">
                    {isUploading ? (
                        <Spinner size="md" className="text-intelligence" />
                    ) : (
                        <UploadCloud className={`w-6 h-6 ${isDragging ? 'text-intelligence' : 'text-tertiary'}`} />
                    )}
                </div>
                <p className="text-sm font-medium text-primary">
                    {isUploading ? 'Uploading...' : 'Drag & drop files here'}
                </p>
                <p className="text-xs text-tertiary mt-1">PDF, JSON, Markdown, or Text</p>
            </div>

            {/* Asset Table */}
            <div className="flex-1 bg-card rounded-xl border border-border overflow-hidden flex flex-col">
                {items.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-tertiary p-8">
                        <p className="text-sm">No assets registered</p>
                    </div>
                ) : (
                    <div className="overflow-y-auto">
                        <table className="w-full text-sm text-left table-fixed">
                            <thead className="text-xs text-secondary uppercase bg-surface-subtle border-b border-muted sticky top-0">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Name</th>
                                    <th className="px-4 py-3 font-medium w-32">Status</th>
                                    <th className="px-4 py-3 font-medium w-16 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {items.map((asset) => (
                                    <tr key={asset.id} className="group hover:bg-surface-hover transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center space-x-3 w-full">
                                                <FileText className="w-4 h-4 text-tertiary flex-shrink-0" />
                                                <span className="font-medium text-primary truncate flex-1 min-w-0" title={asset.name}>
                                                    {asset.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {asset.status === 'READY' ? (
                                                <div className="flex items-center space-x-1.5 text-success">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-success" />
                                                    <span className="text-xs font-medium">Ready</span>
                                                </div>
                                            ) : asset.status === 'PROCESSING' ? (
                                                <div className="flex items-center space-x-2 text-intelligence">
                                                    <Spinner size="sm" />
                                                    <span className="text-xs font-medium">Processing...</span>
                                                </div>
                                            ) : (
                                                <span className="text-xs font-medium text-destructive">Error</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(asset.id)}
                                                className="opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                                                title="Delete Asset"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
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
