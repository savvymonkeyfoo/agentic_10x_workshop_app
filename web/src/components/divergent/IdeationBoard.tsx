'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
    DndContext,
    DragEndEvent,
    useDraggable,
    useDroppable,
    MouseSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    pointerWithin
} from '@dnd-kit/core';
import { IdeaCard } from '@/components/workshop/IdeaCard';
import { MOCK_IDEA_CARDS, MOCK_FEASIBILITY } from '@/mocks/research-data';
import { Button } from '@/components/ui/button';
import { LayoutGrid, ArrowLeft, Briefcase, X, Plus, Sparkles, Info } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { WorkshopPageShell } from '@/components/layouts/WorkshopPageShell';
import { cn } from '@/lib/utils';
import { IdeaFocusView } from './IdeaFocusView';
import { LENS_DEFINITIONS } from '@/lib/scoring-constants';

// --- HELPER: ID Normalization ---
const safeId = (id: string | number | undefined) => String(id || '');

const ALL_LENSES = [{ id: 'VIEW_ALL', label: 'View All', color: 'slate' }, ...LENS_DEFINITIONS];

// --- COMPONENTS ---

// 1. Unified Draggable Card Wrapper (Direct Manipulation)
function DraggableCard({
    id,
    x,
    y,
    rotation,
    isDimmed,
    children,
    isSidebarItem = false
}: {
    id: string;
    x?: number;
    y?: number;
    rotation?: number;
    isDimmed?: boolean;
    children: React.ReactNode;
    isSidebarItem?: boolean;
}) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: safeId(id),
        data: { origin: isSidebarItem ? 'SIDEBAR' : 'CANVAS' }
    });

    const style: React.CSSProperties = {
        position: isSidebarItem ? 'relative' : 'absolute',
        left: isSidebarItem ? undefined : x,
        top: isSidebarItem ? undefined : y,
        zIndex: isDragging ? 5000 : 1,
        // DIRECT ACTION: Move the actual card directly
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : (rotation ? `rotate(${rotation}deg)` : undefined),
        opacity: 1,
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
                "transition-opacity duration-200 ease-in-out",
                isDragging ? "shadow-2xl z-[5000]" : "",
                isDimmed ? "opacity-30 grayscale blur-[0.5px]" : "opacity-100",
                isSidebarItem && "mb-6 last:mb-0"
            )}
        >
            {children}
        </div>
    );
}

// 2. Droppable Sidebar Zone (Persistent Targets)
function SidebarZone({ id, title, color, items, emptyLabel, activeId }: { id: string, title: string, color: string, items: any[], emptyLabel: string, activeId: string | null }) {
    const { setNodeRef, isOver } = useDroppable({ id });

    return (
        <div className="flex flex-col flex-1 min-h-[160px]">
            <h3 className={cn("text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2", color)}>
                {title}
                <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[9px]">{items.length}</span>
            </h3>
            <div
                ref={setNodeRef}
                className={cn(
                    "flex-1 rounded-xl transition-all duration-200 border-2 p-4 flex flex-col items-center gap-4",
                    isOver ? "bg-indigo-50 border-indigo-300 border-dashed" : "border-transparent bg-slate-50/50",
                    activeId ? "overflow-visible" : "overflow-hidden"
                )}
            >
                <div className="w-full flex flex-col items-center">
                    {/* Render Existing Cards */}
                    {items.map(item => (
                        <DraggableCard
                            key={item.id}
                            id={item.id}
                            isSidebarItem
                        >
                            <IdeaCard {...item} isSelected={false} rotation={0} />
                        </DraggableCard>
                    ))}

                    {/* PERSISTENT DROP TARGET BOX */}
                    <div className={cn(
                        "w-[320px] h-32 flex items-center justify-center text-slate-400 text-[10px] uppercase tracking-wider font-bold text-center border-2 border-dashed rounded-lg transition-all duration-200",
                        isOver ? "border-indigo-400 bg-indigo-100/50 scale-105 text-indigo-600" : "border-slate-200 bg-white/40",
                        items.length > 0 && "mt-2"
                    )}>
                        {items.length === 0 ? emptyLabel : "Drop Next Card Here"}
                    </div>
                </div>
            </div>
        </div>
    );
}

// 3. Canvas Droppable Component (Context Isolation)
function CanvasBoard({ items, activeLens, selectedIds, recommendedMap, onSelect, onFocus, onDelete }: any) {
    const { setNodeRef } = useDroppable({ id: 'canvas-droppable' });

    return (
        <div ref={setNodeRef} className="relative w-full h-full bg-slate-50/50" style={{ backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
            <div className="relative w-[2400px] h-[1600px]">
                {items.map((card: any) => {
                    // THE X-RAY LOGIC: If a lens is active, only cards WITH that lens tag stay bright
                    const cardLenses = card.lenses || [];
                    const isVisibleInLens = activeLens === 'VIEW_ALL' || cardLenses.includes(activeLens);
                    const recommendationReason = recommendedMap?.[safeId(card.id)];
                    const isRecommended = !!recommendationReason;

                    return (
                        <DraggableCard
                            key={card.id}
                            id={safeId(card.id)}
                            x={card.x}
                            y={card.y}
                            rotation={card.rotation}
                            isDimmed={!isVisibleInLens} // Apply Gray/Fade if it doesn't match the lens
                        >
                            <IdeaCard
                                {...card}
                                rotation={card.rotation}
                                isSelected={selectedIds.has(safeId(card.id))}
                                isRecommended={isRecommended}
                                recommendationReason={recommendationReason}
                                onSelect={() => onSelect(safeId(card.id))}
                                onExpand={() => onFocus(safeId(card.id))}
                                onDelete={() => onDelete(safeId(card.id))}
                            />
                        </DraggableCard>
                    );
                })}
            </div>
        </div>
    );
}

// --- MAIN COMPONENT ---
import { IdeaCard as IdeaCardType } from '@prisma/client';

// --- TYPES ---
export type BoardItem = IdeaCardType & {
    x: number;
    y: number;
    rotation: number;
    lenses: string[];
};

import { updateIdeaCard, createIdeaCard, deleteIdeaCard } from '@/app/actions/ideation';

// Custom Hook for Debounced Updates
function useDebouncedUpdate(callback: (id: string, updates: any) => void, delay: number) {
    // Basic implementation or use library if available. implementing simple one.
    const timeouts = useRef<Record<string, NodeJS.Timeout>>({});

    const scheduleUpdate = (id: string, updates: any) => {
        if (timeouts.current[id]) clearTimeout(timeouts.current[id]);
        timeouts.current[id] = setTimeout(() => callback(id, updates), delay);
    };

    return scheduleUpdate;
}

// --- MAIN COMPONENT ---
export function IdeationBoard({ workshopId, initialIdeaCards }: { workshopId: string, initialIdeaCards: IdeaCardType[] }) {
    const router = useRouter();

    // Map Prisma IdeaCards to Board Items
    const [items, setItems] = useState<BoardItem[]>(() =>
        initialIdeaCards.map(card => ({
            ...card,
            x: card.xPosition || 400,
            y: card.yPosition || 300,
            rotation: 0,
            lenses: [] // Default empty lenses
        }))
    );

    const [portfolio, setPortfolio] = useState<{
        strategic: BoardItem[];
        tableStakes: BoardItem[];
        agenticAuto: BoardItem[];
    }>({
        strategic: [],
        tableStakes: [],
        agenticAuto: []
    });

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [activeId, setActiveId] = useState<string | null>(null);
    const [activeLens, setActiveLens] = useState<string>('VIEW_ALL');
    const [isPortfolioOpen, setIsPortfolioOpen] = useState(false);
    const [activeFocusId, setActiveFocusId] = useState<string | null>(null);

    // --- AUTO-SAVE LOGIC ---
    const saveToDb = async (id: string, updates: any) => {
        // If it's a temp card, we wait? Or we should have created it already?
        // Let's assume handleAddNew creates it on server.
        // If id starts with "card-", checking if it's the creating one.
        // Actually, handleAddNew below will now create on server.
        if (!id.startsWith('temp-')) { // Changed from 'card-' to 'temp-' to match new tempId prefix
            await updateIdeaCard(id, { ...updates, workshopId });
        }
    };
    const scheduleSave = useDebouncedUpdate(saveToDb, 800);

    const focusedItem = useMemo(() => {
        if (!activeFocusId) return null;
        return items.find(i => safeId(i.id) === activeFocusId) ||
            Object.values(portfolio).flat().find(i => safeId(i.id) === activeFocusId) ||
            null;
    }, [activeFocusId, items, portfolio]);

    const closeFocus = () => setActiveFocusId(null);

    // Update handler for FocusView
    const handleUpdateItem = (id: string, updates: any) => {
        // 1. Update Canvas Items
        setItems(prev => prev.map(i => safeId(i.id) === id ? { ...i, ...updates } : i));

        // 2. Update Portfolio Items
        setPortfolio(prev => {
            const newPortfolio = { ...prev };
            Object.keys(newPortfolio).forEach(key => {
                const k = key as keyof typeof portfolio;
                newPortfolio[k] = newPortfolio[k].map(
                    i => safeId(i.id) === id ? { ...i, ...updates } : i
                );
            });
            return newPortfolio;
        });

        // 3. Schedule Server Save
        scheduleSave(id, updates);
    };

    // --- DELETE WORKFLOW ---
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);

    const handleInitialDelete = (id: string) => {
        setItemToDelete(id);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;

        // Optimistic UI Update
        setItems(prev => prev.filter(item => item.id !== itemToDelete));
        setPortfolio(prev => {
            const next = { ...prev };
            Object.keys(next).forEach(key => {
                const k = key as keyof typeof portfolio;
                next[k] = next[k].filter(i => safeId(i.id) !== itemToDelete);
            });
            return next;
        });

        const idToDelete = itemToDelete;
        setItemToDelete(null);
        toast.success("Idea deleting...");

        // Server Action
        const result = await deleteIdeaCard(idToDelete);
        if (!result.success) {
            toast.error("Failed to delete idea");
            router.refresh(); // Revert
        } else {
            toast.dismiss();
            toast.success("Idea permanently deleted");
        }
    };

    // --- MERGE WORKFLOW ---
    const [isMergeMode, setIsMergeMode] = useState(false);
    const [mergeSelection, setMergeSelection] = useState<string[]>([]);
    // --- BLUEPRINT INTELLIGENCE ---
    const [recommendedMap, setRecommendedMap] = useState<Record<string, string>>({});

    const handleGenerateBlueprint = () => {
        const newRecommendations: Record<string, string> = {};

        items.forEach(item => {
            const feasibility = MOCK_FEASIBILITY.find(f => f.name === item.title);
            const isReady = feasibility?.status === 'READY';

            // 1. Agentic Auto (70% Focus) - Immediate ROI
            if (item.tier === 'AGENTIC_AUTO' && isReady) {
                newRecommendations[safeId(item.id)] = "Drives immediate productivity to fund the rest of your portfolio (High ROI, Ready now).";
            }
            // 2. Table Stakes (20% Focus) - Parity
            else if (item.tier === 'TABLE_STAKES' && (item.source === 'CLIENT_BACKLOG' || item.source === 'MARKET_SIGNAL')) {
                newRecommendations[safeId(item.id)] = "Maintains operational parity with market signals and current backlog.";
            }
            // 3. Strategic Bets (10% Focus) - Moat
            else if (item.tier === 'STRATEGIC_BET' && (item.lenses?.includes('infinite_capacity') || item.lenses?.includes('ooda_loop'))) {
                newRecommendations[safeId(item.id)] = "Builds a unique competitive moat for 2026 and beyond.";
            }
        });

        if (Object.keys(newRecommendations).length === 0) {
            toast.info("No matching blueprint found", { description: "Try adding more ideas or adjusting tiers." });
            return;
        }

        setRecommendedMap(newRecommendations);
        if (!isPortfolioOpen) setIsPortfolioOpen(true);
        toast.success("AI Blueprint Generated", { description: `Identified ${Object.keys(newRecommendations).length} strategic opportunities.` });
    };

    const toggleMergeMode = () => {
        if (isMergeMode && mergeSelection.length === 2) {
            handleMergeNow();
        } else {
            setIsMergeMode(!isMergeMode);
            setMergeSelection([]); // Reset selection on toggle
        }
    };

    const handleMergeNow = () => {
        if (mergeSelection.length !== 2) return;

        const [id1, id2] = mergeSelection;
        const item1 = items.find(i => safeId(i.id) === id1) || Object.values(portfolio).flat().find(i => safeId(i.id) === id1);
        const item2 = items.find(i => safeId(i.id) === id2) || Object.values(portfolio).flat().find(i => safeId(i.id) === id2);

        if (!item1 || !item2) {
            toast.error("Could not find source items");
            return;
        }

        const newId = `card-merged-${Date.now()}`;
        const newX = (item1.x + item2.x) / 2; // Midpoint
        const newY = (item1.y + item2.y) / 2;

        const newItem = {
            ...item1, // Inherit base props from first
            id: newId,
            title: `Syn: ${item1.title} + ${item2.title}`, // Temp Title
            source: 'MERGED', // Trigger Re-analysis
            description: `Combined insight from: ${item1.title} and ${item2.title}.`,
            tier: 'UNSCORED',
            x: newX,
            y: newY,
            rotation: 0,
            lineage: [
                { id: safeId(item1.id), title: item1.title, source: item1.source },
                { id: safeId(item2.id), title: item2.title, source: item2.source }
            ], // Track lineage
            lenses: Array.from(new Set([...(item1.lenses || []), ...(item2.lenses || [])])) // Merge lenses
        };

        // Remove old, Add new
        setItems(prev => [
            ...prev.filter(i => i.id !== id1 && i.id !== id2),
            newItem
        ]);

        // Clear Portfolio if needed (simple filter out)
        setPortfolio(prev => {
            const next = { ...prev };
            Object.keys(next).forEach(key => {
                next[key as keyof typeof portfolio] = next[key as keyof typeof portfolio].filter(i => i.id !== id1 && i.id !== id2);
            });
            return next;
        });

        setIsMergeMode(false);
        setMergeSelection([]);
        setActiveFocusId(newId); // Focus on new item
        toast.success("Ideas Merged Successfully");
    };

    // --- NEW IDEA GENERATOR ---
    const handleAddNew = () => {
        const newId = `card-${Date.now()}`;
        // Create a temporary local item. In real app, might want to create on server first or properly optimistically add.
        const newItem: BoardItem = {
            id: newId,
            workshopId, // Added
            title: '',
            description: '',
            source: 'WORKSHOP_GENERATED',
            tier: 'UNSCORED',
            status: 'ACTIVE',
            x: 400,
            y: 300,
            rotation: 0,
            lenses: [],
            // Prisma fields defaults
            xPosition: 400,
            yPosition: 300,
            simulationResult: null,
            genealogyMetadata: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        setItems(prev => [...prev, newItem]);
        setActiveFocusId(newId);
    };

    const sensors = useSensors(useSensor(MouseSensor, { activationConstraint: { distance: 5 } }));

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(safeId(event.active.id));
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over, delta } = event;
        setActiveId(null);

        const activeIdStr = safeId(active.id);
        const overIdStr = over ? String(over.id) : null;

        const canvasItem = items.find(i => safeId(i.id) === activeIdStr);

        let sourceCategory: keyof typeof portfolio | null = null;
        let sidebarCard: BoardItem | undefined = undefined;

        if (!canvasItem) {
            (Object.keys(portfolio) as Array<keyof typeof portfolio>).forEach(key => {
                const found = portfolio[key].find(i => safeId(i.id) === activeIdStr);
                if (found) {
                    sourceCategory = key;
                    sidebarCard = found;
                }
            });
        }

        // 1. DROP INTO PORTFOLIO ZONES
        if (overIdStr && ['zone-strategic', 'zone-table-stakes', 'zone-agentic'].includes(overIdStr)) {
            const targetCategory = overIdStr === 'zone-strategic' ? 'strategic' :
                overIdStr === 'zone-table-stakes' ? 'tableStakes' : 'agenticAuto';

            const newTier = overIdStr === 'zone-strategic' ? 'STRATEGIC_BET' :
                overIdStr === 'zone-table-stakes' ? 'TABLE_STAKES' : 'AGENTIC_AUTO';

            if (canvasItem) {
                // Remove from Canvas, Add to Portfolio
                setPortfolio(prev => ({
                    ...prev,
                    [targetCategory]: [...prev[targetCategory], { ...canvasItem, tier: newTier }]
                }));
                setItems(prev => prev.filter(i => safeId(i.id) !== activeIdStr));

                // DB UPDATE
                updateIdeaCard(activeIdStr, { tier: newTier, workshopId });

                if (!isPortfolioOpen) setIsPortfolioOpen(true);
                toast.success("Added to Portfolio");
            } else if (sourceCategory && sidebarCard) {
                // Move within Portfolio
                setPortfolio(prev => {
                    const newSourceList = prev[sourceCategory!].filter(i => safeId(i.id) !== activeIdStr);
                    const newTargetList = sourceCategory === targetCategory
                        ? [...newSourceList, sidebarCard!]
                        : [...prev[targetCategory], { ...sidebarCard!, tier: newTier }];
                    return { ...prev, [sourceCategory!]: newSourceList, [targetCategory]: newTargetList };
                });

                // DB UPDATE
                if (sourceCategory !== targetCategory) {
                    updateIdeaCard(activeIdStr, { tier: newTier, workshopId });
                }
            }
            return;
        }

        const isDroppedOnCanvas = overIdStr === 'canvas-droppable' || (!overIdStr && sourceCategory);

        // 2. RESTORE FROM PORTFOLIO TO CANVAS
        if (!canvasItem && sourceCategory && sidebarCard && isDroppedOnCanvas) {
            const dropX = 400 + delta.x;
            const dropY = 300 + delta.y;

            if (sidebarCard) {
                const restoredItem: BoardItem = {
                    ...(sidebarCard as BoardItem),
                    x: dropX,
                    y: dropY,
                    rotation: 0,
                    tier: 'UNSCORED'
                };

                setItems(prev => [...prev, restoredItem]);
                setPortfolio(prev => ({
                    ...prev,
                    [sourceCategory!]: prev[sourceCategory!].filter(i => safeId(i.id) !== activeIdStr)
                }));

                // DB UPDATE
                updateIdeaCard(activeIdStr, {
                    tier: 'UNSCORED',
                    xPosition: dropX,
                    yPosition: dropY,
                    workshopId
                });

                toast.info("Restored to Board");
            }
            return;
        }

        // 3. MOVE ON CANVAS
        if (canvasItem) {
            const newX = canvasItem.x + delta.x;
            const newY = canvasItem.y + delta.y;

            setItems(prev => prev.map(item => {
                if (safeId(item.id) === activeIdStr) {
                    return { ...item, x: newX, y: newY };
                }
                return item;
            }));

            // DB UPDATE - DEBOUNCED? 
            // Drag end is final, so we can save immediately (no debounce needed for single drag end)
            updateIdeaCard(activeIdStr, { xPosition: newX, yPosition: newY, workshopId });
        }
    };

    const handleExport = () => {
        if (Object.values(portfolio).flat().length === 0) {
            toast.error("Portfolio is empty", { description: "Add at least one idea to a strategic category." });
            return;
        }
        // REDIRECT TO INPUT PAGE
        router.push(`/workshop/${workshopId}/input`);
    };

    const header = (
        <div className="w-full px-8 py-4 flex justify-between items-center bg-white/80 backdrop-blur-md border-b border-slate-200">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.push(`/workshop/${workshopId}/research?stage=3`)}>
                    <ArrowLeft className="h-4 w-4 text-slate-600" />
                </Button>
                <div className="h-10 w-10 bg-brand-blue rounded-lg flex items-center justify-center text-white shadow-sm">
                    <LayoutGrid size={20} />
                </div>
                <div>
                    <h1 className="text-xl font-black text-slate-800 tracking-tight">Ideation Sandbox</h1>
                    <p className="text-xs text-slate-500 flex gap-2">
                        <span>{items.length} Ideas</span>
                        <span className="text-slate-300">|</span>
                        <span>{Object.values(portfolio).flat().length} Shortlisted</span>
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="hidden md:flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                    {ALL_LENSES.map((lens) => (
                        <button
                            key={lens.id}
                            onClick={() => setActiveLens(lens.id)}
                            className={cn(
                                "px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all duration-200",
                                activeLens === lens.id
                                    ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                                    : "text-slate-400 hover:text-slate-700 hover:bg-slate-200/50"
                            )}
                        >
                            {lens.label}
                        </button>
                    ))}
                </div>

                <div className="h-6 w-px bg-slate-200 mx-2" />

                {/* ACTION BUTTONS */}
                {/* MERGE BUTTON */}
                <Button
                    variant={isMergeMode ? "secondary" : "ghost"}
                    onClick={toggleMergeMode}
                    className={cn(
                        "gap-2 border-slate-200 mr-2 transition-all",
                        isMergeMode ? "bg-indigo-100 text-indigo-700 ring-2 ring-indigo-200 border-transparent" : "text-slate-500 hover:text-indigo-600"
                    )}
                >
                    <div className="flex items-center gap-2">
                        {/* Icon: Workflow/Merge */}
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m8 17 9-11-9 11Z" /><path d="m8 6 9 11-9-11Z" /></svg>
                        <span className="font-bold">
                            {!isMergeMode ? "Merge Ideas" :
                                mergeSelection.length === 0 ? "Select Items" :
                                    mergeSelection.length === 1 ? "Select 1 More" :
                                        "Merge Now (2)"}
                        </span>
                    </div>
                </Button>

                <Button
                    variant="outline"
                    onClick={handleAddNew}
                    className="gap-2 border-slate-200 mr-2"
                >
                    <Plus size={16} className="text-slate-600" />
                    <span className="hidden lg:inline font-semibold text-slate-600">Add New</span>
                </Button>

                <Button
                    variant={isPortfolioOpen ? "secondary" : "outline"}
                    onClick={() => setIsPortfolioOpen(!isPortfolioOpen)}
                    className={cn("gap-2 border-slate-200", isPortfolioOpen && "bg-slate-100 ring-2 ring-slate-200 border-transparent")}
                >
                    <Briefcase size={16} className={Object.values(portfolio).flat().length > 0 ? "text-brand-blue" : "text-slate-400"} />
                    <span className="hidden lg:inline font-semibold">Portfolio</span>
                    {Object.values(portfolio).flat().length > 0 && (
                        <span className="bg-brand-blue text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                            {Object.values(portfolio).flat().length}
                        </span>
                    )}
                </Button>
            </div>
        </div>
    );

    return (
        <WorkshopPageShell header={header} className="p-0 overflow-hidden relative">
            <DndContext
                id="ideation-board-dnd"
                sensors={sensors}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                collisionDetection={pointerWithin}
            >
                <CanvasBoard
                    items={items}
                    activeLens={activeLens}
                    selectedIds={isMergeMode ? new Set(mergeSelection) : selectedIds} // VISUAL FEEDBACK: Use mergeSelection in merge mode
                    recommendedMap={recommendedMap}
                    onSelect={(id: string) => {
                        setSelectedIds(prev => {
                            const newSet = new Set(prev);
                            newSet.has(id) ? newSet.delete(id) : newSet.add(id);
                            return newSet;
                        });
                    }}
                    onFocus={(id: string) => {
                        if (isMergeMode) {
                            // INTERCEPT CLICK FOR SELECTION
                            setMergeSelection(prev => {
                                if (prev.includes(id)) return prev.filter(i => i !== id);
                                if (prev.length < 2) return [...prev, id];
                                return [prev[0], id]; // Replace 2nd if full? Or just limit?
                                // Prompt says: "Two Selected: Merge Now". Limit to 2 makes sense.
                            });
                        } else {
                            setActiveFocusId(id);
                        }
                    }}
                    onDelete={handleInitialDelete} // PASSED DELETE HANDLER
                />

                {/* 2. PORTFOLIO DRAWER */}
                <div
                    className={cn(
                        "absolute top-0 h-full w-[420px] bg-white border-l border-slate-200 shadow-2xl z-40 flex flex-col transition-all duration-300 ease-in-out",
                        isPortfolioOpen ? "right-0" : "-right-[420px]"
                    )}
                >
                    <div className="p-5 border-b border-slate-100 flex flex-col gap-4 bg-slate-50/80 backdrop-blur">
                        <div className="flex justify-between items-start">
                            <div className="flex flex-col">
                                <h2 className="font-black text-slate-800 text-lg">Portfolio Selection</h2>
                                <p className="text-xs text-slate-500">Drag high-potential ideas here.</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setIsPortfolioOpen(false)}><X size={16} /></Button>
                        </div>


                    </div>

                    <div className={cn(
                        "flex-1 p-5 space-y-8 overflow-y-auto",
                        activeId && "overflow-visible"
                    )}>
                        {/* STRATEGIC RATIONALE BLOCK */}
                        {Object.keys(recommendedMap).length > 0 && (
                            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl animate-in fade-in slide-in-from-top-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="bg-white p-1 rounded-md text-indigo-600 shadow-sm">
                                        <Sparkles size={14} />
                                    </div>
                                    <h4 className="text-xs font-black uppercase tracking-wider text-indigo-800">Strategic Rationale</h4>
                                </div>
                                <p className="text-xs text-indigo-700 leading-relaxed font-medium">
                                    This 70/20/10 mix optimizes for <span className="font-bold">Immediate Productivity</span> (Agentic Auto) while securing <span className="font-bold">Market Moats</span> (Strategic Bets).
                                </p>
                            </div>
                        )}

                        <div className="space-y-12">
                            <SidebarZone id="zone-strategic" title="🌟 Strategic Bets" color="text-amber-600" items={portfolio.strategic} emptyLabel="Drop Gold Card Here" activeId={activeId} />
                            <SidebarZone id="zone-table-stakes" title="🛡️ Table Stakes" color="text-blue-600" items={portfolio.tableStakes} emptyLabel="Drop Blue Card Here" activeId={activeId} />
                            <SidebarZone id="zone-agentic" title="🤖 Agentic Auto" color="text-slate-600" items={portfolio.agenticAuto} emptyLabel="Drop Grey Card Here" activeId={activeId} />
                        </div>

                        {/* FINAL ACTION BUTTONS */}
                        <div className="pt-6 pb-12 w-full flex flex-col items-center gap-4">
                            <Button
                                onClick={handleGenerateBlueprint}
                                className="w-[320px] h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black rounded-xl shadow-xl shadow-blue-200 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 text-lg"
                            >
                                Generate AI Blueprint <Sparkles size={20} className="fill-current" />
                            </Button>

                            <Button
                                onClick={handleExport}
                                className="w-[320px] h-14 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black rounded-xl shadow-xl shadow-indigo-200 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 text-lg"
                            >
                                Opportunity Capture <LayoutGrid className="h-5 w-5 fill-current" />
                            </Button>
                        </div>
                    </div>
                </div>
            </DndContext>

            {/* FOCUS OVERLAY (Rendered OUTSIDE DndContext to avoid conflict, or inside? Outside is safer context-wise but inside needed if we want drag? No drag needed here) */}
            {/* Placing it absolute on top */}
            {focusedItem && (
                <IdeaFocusView
                    item={focusedItem}
                    onClose={closeFocus}
                    onUpdate={handleUpdateItem}
                    initialLens={activeLens !== 'VIEW_ALL' ? activeLens : undefined}
                />
            )}

            {/* DELETE CONFIRMATION DIALOG */}
            {itemToDelete && (
                <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-start justify-center pt-[100px] p-4 animate-in fade-in duration-200" onClick={() => setItemToDelete(null)}>
                    <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 border border-slate-100 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center mb-2">
                                <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-black text-lg text-slate-900">Delete this idea?</h3>
                                <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                                    Are you sure you want to delete this idea? This action is permanent and cannot be undone.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3 w-full pt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => setItemToDelete(null)}
                                    className="w-full font-bold border-slate-200 text-slate-600 hover:bg-slate-50"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={confirmDelete}
                                    className="w-full font-bold bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-200"
                                >
                                    Delete Forever
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </WorkshopPageShell>
    );
}