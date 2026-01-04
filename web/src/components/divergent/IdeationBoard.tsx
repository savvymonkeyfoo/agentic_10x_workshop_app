'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    DndContext,
    DragEndEvent,
    useDraggable,
    useDroppable,
    MouseSensor,
    useSensor,
    useSensors,
    pointerWithin
} from '@dnd-kit/core';
import { IdeaCard } from '@/components/workshop/IdeaCard';
import { Button } from '@/components/ui/button';
import { LayoutGrid, ArrowLeft, RefreshCw, Layers } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter, useSearchParams } from 'next/navigation';
import { WorkshopPageShell } from '@/components/layouts/WorkshopPageShell';
import { cn } from '@/lib/utils';
import { UnifiedOpportunity } from '@/types/opportunity';
import { initializeIdeationBoard, updateBoardPosition } from '@/app/actions/ideation-actions';
import { getWorkshopIntelligence, updateOpportunity } from '@/app/actions/context-engine';
import { OpportunityModal } from '@/components/workshop/OpportunityModal';

// --- COMPONENTS ---

// 1. Draggable Wrapper
function DraggableCard({
    id,
    x,
    y,
    children,
    disabled = false
}: {
    id: string;
    x?: number;
    y?: number;
    children: React.ReactNode;
    disabled?: boolean;
}) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: id,
        disabled
    });

    const style: React.CSSProperties = {
        position: 'absolute',
        left: x,
        top: y,
        zIndex: isDragging ? 5000 : 10,
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        cursor: isDragging ? 'grabbing' : 'grab',
        touchAction: 'none',
        width: '320px',
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={cn(
                "transition-shadow duration-200 ease-in-out",
                isDragging ? "shadow-2xl ring-2 ring-indigo-400 rotate-1" : ""
            )}
        >
            {children}
        </div>
    );
}

// 2. The Canvas (Droppable Area)
function CanvasBoard({ children }: { children: React.ReactNode }) {
    const { setNodeRef } = useDroppable({ id: 'canvas-board' });

    return (
        <div
            ref={setNodeRef}
            className="relative w-full h-full bg-slate-50 overflow-hidden"
            style={{
                backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
                backgroundSize: '24px 24px'
            }}
        >
            {children}
        </div>
    );
}

// --- MAIN COMPONENT ---

export function IdeationBoard({ workshopId }: { workshopId: string }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [items, setItems] = useState<UnifiedOpportunity[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCard, setSelectedCard] = useState<UnifiedOpportunity | null>(null);
    const [isSavingPosition, setIsSavingPosition] = useState(false);

    // Initialize & Fetch Logic
    const loadBoard = useCallback(async () => {
        setIsLoading(true);
        try {
            // 1. Ensure Defaults (Idempotent)
            const initResult = await initializeIdeationBoard(workshopId);
            if (!initResult.success) throw new Error("Failed to init board");

            // 2. Fetch Fresh Data (SSOT)
            const result = await getWorkshopIntelligence(workshopId);
            if (result.success) {
                setItems(result.opportunities as UnifiedOpportunity[]);
                if (initResult.migratedCount && initResult.migratedCount > 0) {
                    toast.success("Board Initialized", {
                        description: `Placed ${initResult.migratedCount} new items in Inbox.`
                    });
                }
            }
        } catch (error) {
            toast.error("Failed to load board");
        } finally {
            setIsLoading(false);
        }
    }, [workshopId]);

    // Initial Load
    useEffect(() => {
        loadBoard();
    }, [loadBoard]);

    // DND Sensors
    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 5 } })
    );

    // PERSISTENCE: Handle Drag End
    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, delta } = event;
        const id = active.id as string;

        // Find existing item
        const item = items.find(i => i.id === id || i.originalId === id);
        if (!item || !item.boardPosition) return;

        // Calculate New Coordinates
        const newX = item.boardPosition.x + delta.x;
        const newY = item.boardPosition.y + delta.y;

        // OPTIMISTIC UPDATE
        setItems(prev => prev.map(i => {
            if (i.id === id || i.originalId === id) {
                return {
                    ...i,
                    boardPosition: { x: newX, y: newY },
                    boardStatus: 'placed'
                };
            }
            return i;
        }));

        // SERVER SAVE (Debounced effectively by user interaction speed, 
        // strictly speaking we fire every drop. Acceptable for now.)
        setIsSavingPosition(true);
        try {
            await updateBoardPosition(workshopId, id, { x: newX, y: newY });
        } catch (err) {
            toast.error("Failed to save position");
            // Revert? For now, we trust the sync on next load.
        } finally {
            setIsSavingPosition(false);
        }
    };

    // Card Click -> Edit Modal
    const handleCardClick = (card: UnifiedOpportunity) => {
        setSelectedCard(card);
    };

    // Modal Save -> Refresh Local State
    const handleModalSave = async (updatedCard: any) => {
        // 1. SAVE: Persist text changes to DB
        await updateOpportunity(workshopId, updatedCard);

        // 2. REFRESH: Get latest state (merges updates)
        const result = await getWorkshopIntelligence(workshopId);
        if (result.success) {
            setItems(result.opportunities as UnifiedOpportunity[]);
        }
    };

    const header = (
        <div className="w-full px-8 py-4 flex justify-between items-center bg-white/80 backdrop-blur-md border-b border-slate-200 z-50 relative">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.push(`/workshop/${workshopId}/research`)}>
                    <ArrowLeft className="h-4 w-4 text-slate-600" />
                </Button>
                <div className="h-10 w-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-sm">
                    <LayoutGrid size={20} />
                </div>
                <div>
                    <h1 className="text-xl font-black text-slate-800 tracking-tight">Ideation Board</h1>
                    <p className="text-xs text-slate-500 flex gap-2">
                        {isLoading ? (
                            <span className="animate-pulse">Syncing...</span>
                        ) : (
                            <>
                                <span>{items.length} Opportunities</span>
                                <span className="text-slate-300">|</span>
                                <span className={cn(isSavingPosition ? "text-indigo-600" : "text-green-600")}>
                                    {isSavingPosition ? "Saving..." : "All Systems Go"}
                                </span>
                            </>
                        )}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={loadBoard} disabled={isLoading}>
                    <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                    Sync
                </Button>
            </div>
        </div>
    );

    return (
        <WorkshopPageShell header={header} className="p-0 overflow-hidden relative h-screen">
            <DndContext
                sensors={sensors}
                onDragEnd={handleDragEnd}
                collisionDetection={pointerWithin}
            >
                <CanvasBoard>
                    {items.map((item) => {
                        // SAFETY CHECK: Fallback if position missing (though API guarantees it)
                        // x: 50, y: 50 fallback just in case
                        const x = item.boardPosition?.x ?? 50;
                        const y = item.boardPosition?.y ?? 50;

                        return (
                            <DraggableCard
                                key={item.id || item.originalId}
                                id={item.id || item.originalId}
                                x={x}
                                y={y}
                            >
                                <IdeaCard
                                    card={{
                                        ...item,
                                        id: item.id || item.originalId,
                                        // Legacy / Unified Mapping
                                        source: item.source,
                                        tier: item.tier
                                    }}
                                    onClick={() => handleCardClick(item)}
                                />
                            </DraggableCard>
                        );
                    })}
                </CanvasBoard>
            </DndContext>

            {/* SHARED MODAL FOR EDITING */}
            <OpportunityModal
                isOpen={!!selectedCard}
                onClose={() => setSelectedCard(null)}
                // @ts-ignore - mismatch between Legacy/Unified types in modal props vs strict Unified
                // We know Unified is superset, so casting usually fine or ignoring.
                // Ideally OpportunityModal should accept UnifiedOpportunity.
                card={selectedCard as any}
                onSave={handleModalSave}
            />
        </WorkshopPageShell>
    );
}