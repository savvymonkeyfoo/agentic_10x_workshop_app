'use client';

import { saveOpportunity } from '@/app/actions/save-opportunity';
import React, { useState, useMemo, useEffect } from 'react';
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
import { MOCK_IDEA_CARDS } from '@/mocks/research-data';
import { Button } from '@/components/ui/button';
import { LayoutGrid, ArrowLeft, Briefcase, X } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { WorkshopPageShell } from '@/components/layouts/WorkshopPageShell';
import { cn } from '@/lib/utils';

// --- HELPER: ID Normalization ---
const safeId = (id: string | number | undefined) => String(id || '');

const LENSES = [
    { id: 'VIEW_ALL', label: 'View All' },
    { id: 'INFINITE_CAPACITY', label: 'Infinite Capacity' },
    { id: 'THEORY_OF_CONSTRAINTS', label: 'Constraints' },
    { id: 'OODA_LOOP', label: 'OODA Loop' }
] as const;

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
function CanvasBoard({ items, activeLens, selectedIds, onSelect }: any) {
    const { setNodeRef } = useDroppable({ id: 'canvas-droppable' });
    
    return (
        <div 
            ref={setNodeRef} 
            className="relative w-full h-full min-screen overflow-auto bg-slate-50/50"
            style={{
                backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)',
                backgroundSize: '24px 24px'
            }}
        >
            <div className="relative w-[2400px] h-[1600px]">
                {items.map((card: any) => (
                    <DraggableCard
                        key={card.id}
                        id={safeId(card.id)}
                        x={card.x}
                        y={card.y}
                        rotation={card.rotation}
                        isDimmed={activeLens !== 'VIEW_ALL' && !selectedIds.has(safeId(card.id))}
                    >
                        <IdeaCard
                            {...card}
                            rotation={card.rotation}
                            isSelected={selectedIds.has(safeId(card.id))}
                            onSelect={() => onSelect(safeId(card.id))}
                        />
                    </DraggableCard>
                ))}
            </div>
        </div>
    );
}

// --- MAIN COMPONENT ---
export function IdeationBoard({ workshopId }: { workshopId: string }) {
    const router = useRouter();
    const [items, setItems] = useState(() =>
        MOCK_IDEA_CARDS.map(card => ({
            ...card,
            x: card.xPosition || 100,
            y: card.yPosition || 100,
            rotation: 0
        }))
    );

    useEffect(() => {
        setItems(prevItems => prevItems.map(item => ({
            ...item,
            x: item.xPosition || Math.random() * 800 + 100,
            y: item.yPosition || Math.random() * 400 + 100,
            rotation: (Math.random() - 0.5) * 4
        })));
    }, []);
    
    const [portfolio, setPortfolio] = useState<{
        strategic: any[];
        tableStakes: any[];
        agenticAuto: any[];
    }>({
        strategic: [],
        tableStakes: [],
        agenticAuto: []
    });

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [activeId, setActiveId] = useState<string | null>(null);
    const [activeLens, setActiveLens] = useState<string>('VIEW_ALL');
    const [isPortfolioOpen, setIsPortfolioOpen] = useState(false);

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
        let sidebarCard: any = null;
        
        if (!canvasItem) {
            (Object.keys(portfolio) as Array<keyof typeof portfolio>).forEach(key => {
                const found = portfolio[key].find(i => safeId(i.id) === activeIdStr);
                if (found) {
                    sourceCategory = key;
                    sidebarCard = found;
                }
            });
        }

        if (overIdStr && ['zone-strategic', 'zone-table-stakes', 'zone-agentic'].includes(overIdStr)) {
            const targetCategory = overIdStr === 'zone-strategic' ? 'strategic' :
                                   overIdStr === 'zone-table-stakes' ? 'tableStakes' : 'agenticAuto';
            
            if (canvasItem) {
                setPortfolio(prev => ({
                    ...prev,
                    [targetCategory]: [...prev[targetCategory], canvasItem]
                }));
                setItems(prev => prev.filter(i => safeId(i.id) !== activeIdStr));
                if (!isPortfolioOpen) setIsPortfolioOpen(true);
                toast.success("Added to Portfolio");
            } else if (sourceCategory && sidebarCard) {
                setPortfolio(prev => {
                    const newSourceList = prev[sourceCategory!].filter(i => safeId(i.id) !== activeIdStr);
                    const newTargetList = sourceCategory === targetCategory 
                        ? [...newSourceList, sidebarCard] 
                        : [...prev[targetCategory], sidebarCard];
                    return { ...prev, [sourceCategory!]: newSourceList, [targetCategory]: newTargetList };
                });
            }
            return;
        }

        const isDroppedOnCanvas = overIdStr === 'canvas-droppable' || (!overIdStr && sourceCategory);

        if (!canvasItem && sourceCategory && sidebarCard && isDroppedOnCanvas) {
            const newX = Math.max(100, 400 + delta.x); 
            const newY = Math.max(100, 300 + delta.y);

            setItems(prev => [...prev, { ...sidebarCard, x: newX, y: newY, rotation: 0 }]);
            setPortfolio(prev => ({
                ...prev,
                [sourceCategory!]: prev[sourceCategory!].filter(i => safeId(i.id) !== activeIdStr)
            }));
            toast.info("Restored to Board");
            return;
        }

        if (canvasItem) {
            setItems(prev => prev.map(item => {
                if (safeId(item.id) === activeIdStr) {
                    return { ...item, x: item.x + delta.x, y: item.y + delta.y };
                }
                return item;
            }));
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
                    {LENSES.map((lens) => (
                        <button
                            key={lens.id}
                            onClick={() => setActiveLens(lens.id)}
                            className={cn(
                                "px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200",
                                activeLens === lens.id ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200" : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/50"
                            )}
                        >
                            {lens.label}
                        </button>
                    ))}
                </div>

                <div className="h-6 w-px bg-slate-200 mx-2" />

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
                    selectedIds={selectedIds} 
                    onSelect={(id: string) => {
                        setSelectedIds(prev => {
                            const newSet = new Set(prev);
                            newSet.has(id) ? newSet.delete(id) : newSet.add(id);
                            return newSet;
                        });
                    }}
                />

                {/* 2. PORTFOLIO DRAWER */}
                <div 
                    className={cn(
                        "absolute top-0 h-full w-[420px] bg-white border-l border-slate-200 shadow-2xl z-40 flex flex-col transition-all duration-300 ease-in-out",
                        isPortfolioOpen ? "right-0" : "-right-[420px]"
                    )}
                >
                    <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/80 backdrop-blur">
                        <div className="flex flex-col">
                            <h2 className="font-black text-slate-800 text-lg">Portfolio Selection</h2>
                            <p className="text-xs text-slate-500">Drag high-potential ideas here.</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setIsPortfolioOpen(false)}><X size={16} /></Button>
                    </div>

                    <div className={cn(
                        "flex-1 p-5 space-y-12 overflow-y-auto",
                        activeId && "overflow-visible" 
                    )}>
                        <SidebarZone id="zone-strategic" title="🌟 Strategic Bets" color="text-amber-600" items={portfolio.strategic} emptyLabel="Drop Gold Card Here" activeId={activeId} />
                        <SidebarZone id="zone-table-stakes" title="🛡️ Table Stakes" color="text-blue-600" items={portfolio.tableStakes} emptyLabel="Drop Blue Card Here" activeId={activeId} />
                        <SidebarZone id="zone-agentic" title="🤖 Agentic Auto" color="text-slate-600" items={portfolio.agenticAuto} emptyLabel="Drop Grey Card Here" activeId={activeId} />
                        
                        {/* FINAL ACTION BUTTON */}
                        <div className="pt-6 pb-12 w-full flex justify-center">
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
        </WorkshopPageShell>
    );
}