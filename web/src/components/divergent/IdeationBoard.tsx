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
import { LayoutGrid, ArrowLeft, RefreshCw, Layers, Plus, Sparkles, MousePointer2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter, useSearchParams } from 'next/navigation';
import { WorkshopPageShell } from '@/components/layouts/WorkshopPageShell';
import { cn } from '@/lib/utils';
import { UnifiedOpportunity } from '@/types/opportunity';
import { createWorkshopOpportunity, initializeIdeationBoard, updateBoardPosition } from '@/app/actions/ideation';
import { enrichOpportunity, getWorkshopIntelligence, updateOpportunity, deleteIdeationOpportunity } from '@/app/actions/context-engine';
import { promoteToCapture } from '@/app/actions/promotion';
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
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        zIndex: isDragging ? 100 : 1,
        touchAction: 'none',
        width: '300px' // Enforce consistent width for grid alignment
    };

    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
            {children}
        </div>
    );
}

// 2. Infinite Canvas Background
function CanvasBoard({ children }: { children: React.ReactNode }) {
    const { setNodeRef } = useDroppable({
        id: 'canvas-board',
    });

    return (
        <div
            ref={setNodeRef}
            className="w-[3000px] h-[3000px] bg-slate-50 relative overflow-hidden"
            style={{
                backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
                backgroundSize: '20px 20px',
            }}
        >
            {children}
        </div>
    );
}

// --- MAIN COMPONENT ---

interface IdeationBoardProps {
    workshopId: string;
}

export function IdeationBoard({ workshopId }: IdeationBoardProps) {
    const router = useRouter();
    const [opportunities, setOpportunities] = useState<UnifiedOpportunity[]>([]);
    const [selectedCard, setSelectedCard] = useState<UnifiedOpportunity | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // SELECTION MODE STATE
    const [isSelectMode, setIsSelectMode] = useState(false);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [isPromoting, setIsPromoting] = useState(false);

    // Sensors for DND
    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: { distance: 10 }, // Prevent accidental drags
        })
    );

    // 1. Load Data (Unified Store)
    useEffect(() => {
        const init = async () => {
            // First: Try to initialize board (assign positions if missing)
            const result = await initializeIdeationBoard(workshopId);
            if (result.success && result.opportunities) {
                // @ts-ignore
                setOpportunities(result.opportunities);
            } else {
                // Fallback: Just fetch raw if init fails
                const raw = await getWorkshopIntelligence(workshopId);
                // @ts-ignore
                if (raw.success) setOpportunities(raw.opportunities || []);
            }
        };
        init();
    }, [workshopId]);

    // 2. Handle Drag End
    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, delta } = event;
        const id = active.id as string;

        // Find current item
        const item = opportunities.find(o => (o.originalId === id || o.originalId === id));
        if (!item) return;

        // GRID FALLBACKS (Must match server logic for visual consistency)
        // If we dragged an item that didn't have a position yet, calculate where it WAS visually
        const index = opportunities.indexOf(item);
        const col = index % 3;
        const row = Math.floor(index / 3);
        const currentX = item.boardPosition?.x ?? (50 + (col * 320));
        const currentY = item.boardPosition?.y ?? (50 + (row * 220));

        const newX = currentX + delta.x;
        const newY = currentY + delta.y;

        // Optimistic Update
        setOpportunities(prev => prev.map(o => {
            if (o.originalId === id) {
                return { ...o, boardPosition: { x: newX, y: newY } };
            }
            return o;
        }));

        // Server Persist (Debounced ideally, but simple here)
        await updateBoardPosition(workshopId, id, { x: newX, y: newY });
    };

    // 3. Handle Modal Save
    const handleModalSave = async (updatedCard: any) => {
        if (updatedCard.originalId === 'draft') {
            // Create New
            const result = await createWorkshopOpportunity(workshopId, updatedCard);
            if (result.success && result.opportunity) {
                setOpportunities(prev => [...prev, result.opportunity]);
                setSelectedCard(null);
                toast.success("Card Created");
            }
        } else {
            // Update Existing (Optimistic)
            setOpportunities(prev => prev.map(o => o.originalId === updatedCard.originalId ? { ...o, ...updatedCard } : o));
            await updateOpportunity(workshopId, updatedCard);
        }
    };

    // 4. Handle Delete
    const handleDelete = async (card: any) => {
        if (!card.originalId || card.originalId === 'draft') {
            setSelectedCard(null);
            return;
        }
        // Optimistic Remove
        setOpportunities(prev => prev.filter(o => o.originalId !== card.originalId));
        setSelectedCard(null);
        toast.success("Card Deleted");

        // Server Delete
        await deleteIdeationOpportunity({ workshopId, originalId: card.originalId });
    };

    // 5. Handle Enrichment
    const handleEnrich = async (title: string, description: string) => {
        setSelectedCard(null);
        return await enrichOpportunity(workshopId, title, description);
    };

    const handleNewIdea = () => {
        setSelectedCard({
            id: 'draft',
            originalId: 'draft',
            title: '',
            description: '',
            source: 'WORKSHOP_GENERATED',
            friction: '',
            techAlignment: '',
            strategyAlignment: '',
        } as UnifiedOpportunity);
    };

    const handleCardClick = (item: UnifiedOpportunity) => {
        setSelectedCard(item);
    }

    // --- SELECTION LOGIC ---

    const toggleSelectionMode = () => {
        if (isSelectMode) {
            // Exit Mode -> Clear selection
            setIsSelectMode(false);
            setSelectedItems(new Set());
        } else {
            setIsSelectMode(true);
        }
    };

    const handleToggleItem = (id: string) => {
        const newSet = new Set(selectedItems);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedItems(newSet);
    };

    const handlePromoteSelection = async () => {
        if (selectedItems.size === 0) return;
        setIsPromoting(true);

        const selectedOpps = opportunities.filter(o => selectedItems.has(o.originalId));

        try {
            const result = await promoteToCapture(workshopId, selectedOpps);

            if (result.success && result.count > 0) {
                toast.success(`${result.count} Ideas Promoted! Redirecting...`, {
                    duration: 2000
                });

                // Optimistic Update
                setOpportunities(prev => prev.map(o => {
                    if (selectedOpps.some(s => s.originalId === o.originalId)) {
                        return { ...o, promotionStatus: 'PROMOTED' };
                    }
                    return o;
                }));

                // UX Cleanup
                setIsSelectMode(false);
                setSelectedItems(new Set());

                // AUTO-NAVIGATE (User Requested)
                router.push(`/workshop/${workshopId}/input`);

            } else if (result.count === 0) {
                toast.info("No new items were promoted (duplicates skipped).");
                setIsSelectMode(false);
                setSelectedItems(new Set());
            }
        } catch (error) {
            toast.error("Promotion failed. Please try again.");
            console.error(error);
        } finally {
            setIsPromoting(false);
        }
    };

    const handleTopBarAction = () => {
        if (isSelectMode) {
            // If items selected, treat 'Done' as Promote
            if (selectedItems.size > 0) {
                handlePromoteSelection();
            } else {
                // Zero items -> Just Cancel/Exit
                setIsSelectMode(false);
            }
        } else {
            // Enter Select Mode
            setIsSelectMode(true);
        }
    };

    return (
        <WorkshopPageShell
            header={
                <div className="px-8 py-4 flex justify-between items-center bg-white border-b border-slate-200 shadow-sm z-20 relative">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" onClick={() => router.push(`/workshop/${workshopId}/analysis`)}>
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Analysis
                        </Button>
                        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <LayoutGrid className="w-5 h-5 text-indigo-600" />
                            Ideation Whiteboard
                        </h1>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* SELECT MODE TOGGLE */}
                        <Button
                            variant={isSelectMode ? "secondary" : "ghost"}
                            className={cn(isSelectMode && "bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-200")}
                            onClick={handleTopBarAction}
                        >
                            {isSelectMode ? <Check className="w-4 h-4 mr-2" /> : <MousePointer2 className="w-4 h-4 mr-2" />}
                            {isSelectMode
                                ? (selectedItems.size > 0 ? `Promote Selected (${selectedItems.size})` : "Done Selecting")
                                : "Select Ideas"
                            }
                        </Button>

                        <div className="h-6 w-px bg-slate-200 mx-2" />

                        <Button onClick={handleNewIdea} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow-md transition-all">
                            <Plus className="w-4 h-4 mr-2" /> New Idea
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                            <RefreshCw className="w-4 h-4 mr-2" /> Sync Grid
                        </Button>
                    </div>
                </div>
            }
        >
            <div className="flex-1 overflow-auto relative bg-slate-100">
                <DndContext
                    sensors={sensors}
                    collisionDetection={pointerWithin}
                    onDragEnd={handleDragEnd}
                >
                    <CanvasBoard>
                        {opportunities.map((item, i) => {
                            // SAFETY NET: GRID LAYOUT
                            // If x/y missing, fallback to Grid (3 cols, 320px width, 220px height)
                            const col = i % 3;
                            const row = Math.floor(i / 3);

                            const x = item.boardPosition?.x ?? (50 + (col * 320));
                            const y = item.boardPosition?.y ?? (50 + (row * 220));

                            return (
                                <DraggableCard
                                    key={item.originalId}
                                    id={item.originalId}
                                    x={x}
                                    y={y}
                                    disabled={isSelectMode} // DISABLING DRAG IN SELECT MODE
                                >
                                    <IdeaCard
                                        card={{
                                            ...item,
                                            id: item.originalId,
                                            // Legacy / Unified Mapping
                                            source: item.source,
                                            // @ts-ignore
                                            tier: item.tier,
                                            promotionStatus: item.promotionStatus
                                        }}
                                        onClick={() => handleCardClick(item)}
                                        // SELECTION PROPS
                                        isSelectMode={isSelectMode}
                                        isSelected={selectedItems.has(item.originalId)}
                                        onToggleSelect={() => handleToggleItem(item.originalId)}
                                    />
                                </DraggableCard>
                            );
                        })}
                    </CanvasBoard>
                </DndContext>

                {/* FLOATING ACTION BAR */}
                {selectedItems.size > 0 && (
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
                        <div className="bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-6 border border-slate-700">
                            <div className="flex items-center gap-2">
                                <div className="bg-blue-500 text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                                    {selectedItems.size}
                                </div>
                                <span className="font-semibold text-sm">Ideas Selected</span>
                            </div>

                            <Button
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-500 text-white rounded-full px-6 font-bold shadow-lg shadow-blue-900/50"
                                onClick={handlePromoteSelection}
                                disabled={isPromoting}
                            >
                                {isPromoting ? "Promoting..." : "Promote to Capture 🚀"}
                            </Button>
                        </div>
                    </div>
                )}

                {/* SHARED MODAL FOR EDITING */}
                <OpportunityModal
                    isOpen={!!selectedCard}
                    onClose={() => setSelectedCard(null)}
                    // @ts-ignore
                    card={selectedCard as any}
                    onSave={handleModalSave}
                    onEnrich={handleEnrich}
                    onDelete={handleDelete}
                />
            </div>
        </WorkshopPageShell>
    );
}