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
import { LayoutGrid, ArrowLeft, RefreshCw, Layers, Plus, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter, useSearchParams } from 'next/navigation';
import { WorkshopPageShell } from '@/components/layouts/WorkshopPageShell';
import { cn } from '@/lib/utils';
import { UnifiedOpportunity } from '@/types/opportunity';
import { createWorkshopOpportunity, initializeIdeationBoard, updateBoardPosition } from '@/app/actions/ideation';
import { enrichOpportunity, getWorkshopIntelligence, updateOpportunity, deleteOpportunity } from '@/app/actions/context-engine';
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
        await deleteOpportunity(workshopId, card.originalId);
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
                                >
                                    <IdeaCard
                                        card={{
                                            ...item,
                                            id: item.originalId,
                                            // Legacy / Unified Mapping
                                            source: item.source,
                                            // @ts-ignore
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