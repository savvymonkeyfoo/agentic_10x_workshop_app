'use client';

import { saveOpportunity } from '@/app/actions/save-opportunity';
import React, { useState, useMemo } from 'react';
import {
    DndContext,
    DragEndEvent,
    useDraggable,
    MouseSensor,
    useSensor,
    useSensors
} from '@dnd-kit/core';
import { IdeaCard } from '@/components/workshop/IdeaCard';
import { IdeaCardDetail } from '@/components/workshop/IdeaCardDetail';
import { MOCK_IDEA_CARDS } from '@/mocks/research-data';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Wand2, LayoutGrid, CheckCircle2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { WorkshopPageShell } from '@/components/layouts/WorkshopPageShell';

// Draggable card wrapper for free-form positioning
function DraggableCard({
    id,
    x,
    y,
    rotation,
    children
}: {
    id: string;
    x: number;
    y: number;
    rotation: number;
    children: React.ReactNode
}) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });

    const style: React.CSSProperties = {
        position: 'absolute',
        left: x,
        top: y,
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        zIndex: isDragging ? 1000 : 1,
        opacity: 1,
        cursor: isDragging ? 'grabbing' : 'grab',
        touchAction: 'none'
    };

    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
            {children}
        </div>
    );
}

export function IdeationBoard({ workshopId }: { workshopId: string }) {
    // State: Card positions and data
    const [items, setItems] = useState(() =>
        MOCK_IDEA_CARDS.map(card => ({
            ...card,
            x: card.xPosition || 100,
            y: card.yPosition || 100,
            rotation: card.rotation || 0 // Use deterministic rotation from mock data
        }))
    );
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [activeId, setActiveId] = useState<string | null>(null);
    const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

    const router = useRouter();

    // DnD Sensors - only mouse/touch, no keyboard for free-form
    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 5 // Small distance to distinguish click from drag
            }
        })
    );

    // Handle drag end - update position
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, delta } = event;

        setItems(prev => prev.map(item => {
            if (item.id === active.id) {
                return {
                    ...item,
                    x: item.x + delta.x,
                    y: item.y + delta.y
                };
            }
            return item;
        }));

        setActiveId(null);

        // TODO: Call server action to persist position
        // updateCardPosition(active.id as string, newX, newY);
    };

    const handleDragStart = (event: { active: { id: string | number } }) => {
        setActiveId(event.active.id as string);
    };

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const handleMerge = () => {
        toast.promise(
            new Promise((resolve) => setTimeout(resolve, 2000)),
            {
                loading: 'Agent merging concepts...',
                success: 'Ideas merged successfully!',
                error: 'Failed to merge'
            }
        );
        setTimeout(() => setSelectedIds(new Set()), 2000);
    };

    const handlePromote = async () => {
        const selectedCards = items.filter(i => selectedIds.has(i.id));
        if (selectedCards.length === 0) return;

        toast.promise(
            (async () => {
                for (const card of selectedCards) {
                    let horizon = "GROWTH";
                    if (card.tier === "STRATEGIC_BET") horizon = "STRATEGY";
                    if (card.tier === "TABLE_STAKES") horizon = "OPS";

                    let whyDoIt = "";
                    if (card.source === "MARKET_SIGNAL") {
                        whyDoIt = "Verified External Opportunity: " + card.description.substring(0, 50) + "...";
                    }

                    const opportunityData = {
                        projectName: card.title,
                        frictionStatement: card.description,
                        strategicHorizon: horizon,
                        whyDoIt: whyDoIt,
                        vrcc: { value: 3, capability: 3, complexity: 3, riskFinal: 0, riskAI: 0 }
                    };

                    await saveOpportunity(workshopId, opportunityData);
                    setItems(prev => prev.map(i => i.id === card.id ? { ...i, status: 'PROMOTED' } : i));
                }
            })(),
            {
                loading: `Promoting ${selectedCards.length} ideas to Pipeline...`,
                success: 'Promotion Complete! Check Capture page.',
                error: 'Failed to promote ideas.'
            }
        );

        setSelectedIds(new Set());
    };

    // Get active item for drag overlay
    const activeItem = useMemo(() => items.find(i => i.id === activeId), [items, activeId]);

    // Header component for WorkshopPageShell
    const header = (
        <div className="px-8 py-5 flex justify-between items-center">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.push(`/workshop/${workshopId}/research?stage=3`)}>
                    <ArrowLeft className="h-4 w-4 text-slate-600" />
                </Button>
                <div className="h-10 w-10 bg-brand-blue rounded-lg flex items-center justify-center text-white">
                    <LayoutGrid size={20} />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">Ideation Sandbox</h1>
                    <p className="text-xs text-slate-500 flex gap-2">
                        <span>{items.length} Ideas</span>
                        <span className="text-slate-300">|</span>
                        <span>{selectedIds.size} Selected</span>
                    </p>
                </div>
            </div>

            <div className="flex gap-3">
                {selectedIds.size >= 2 && (
                    <Button onClick={handleMerge} className="animate-in fade-in slide-in-from-bottom-2 bg-brand-blue text-white">
                        <Wand2 className="mr-2 h-4 w-4" /> Merge {selectedIds.size} Cards
                    </Button>
                )}
                {selectedIds.size > 0 && (
                    <Button onClick={handlePromote} variant="outline" className="border-emerald-500 text-emerald-700 bg-emerald-50 hover:bg-emerald-100">
                        <CheckCircle2 className="mr-2 h-4 w-4" /> Promote to Pipeline
                    </Button>
                )}
            </div>
        </div>
    );

    return (
        <>
            <WorkshopPageShell header={header} className="p-0 overflow-hidden">
                {/* Infinite Canvas Container */}
                <div
                    className="relative w-full h-full min-h-[800px] overflow-auto"
                    style={{
                        backgroundImage: 'radial-gradient(circle, #e2e8f0 1px, transparent 1px)',
                        backgroundSize: '24px 24px'
                    }}
                >
                    {/* Canvas Area - Large scrollable surface */}
                    <div className="relative w-[2400px] h-[1600px]">
                        <DndContext
                            id="ideation-canvas"
                            sensors={sensors}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                        >
                            {/* Render cards with absolute positioning */}
                            {items.map((card) => (
                                <DraggableCard
                                    key={card.id}
                                    id={card.id}
                                    x={card.x}
                                    y={card.y}
                                    rotation={card.rotation}
                                >
                                    <IdeaCard
                                        {...card}
                                        rotation={card.rotation}
                                        isSelected={selectedIds.has(card.id)}
                                        onSelect={() => toggleSelection(card.id)}
                                        onExpand={() => setExpandedCardId(card.id)}
                                    />
                                </DraggableCard>
                            ))}

                            {/* Direct manipulation - no overlay needed */}
                        </DndContext>
                    </div>
                </div>
            </WorkshopPageShell>

            {/* Expansion Modal */}
            <Dialog open={!!expandedCardId} onOpenChange={(open) => !open && setExpandedCardId(null)}>
                <DialogContent
                    className="max-w-3xl max-h-[90vh]"
                    onInteractOutside={(e) => {
                        // Prevent closing on backdrop click to force use of Back button
                        e.preventDefault();
                    }}
                >
                    <DialogTitle className="sr-only">Edit Idea Card</DialogTitle>
                    <DialogDescription className="sr-only">
                        Edit the details of this idea card including title, tier, source, and description.
                    </DialogDescription>
                    {expandedCardId && (() => {
                        const card = items.find(i => i.id === expandedCardId);
                        if (!card) return null;
                        return (
                            <IdeaCardDetail
                                card={card}
                                onClose={() => setExpandedCardId(null)}
                                onSave={(updates) => {
                                    // Auto-save updates the items but does NOT close the modal
                                    setItems(prev => prev.map(item =>
                                        item.id === expandedCardId
                                            ? { ...item, ...updates }
                                            : item
                                    ));
                                    // No toast or modal close - auto-save is silent
                                }}
                            />
                        );
                    })()}
                </DialogContent>
            </Dialog>
        </>
    );
}
