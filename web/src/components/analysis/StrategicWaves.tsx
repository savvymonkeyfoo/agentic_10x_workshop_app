'use client';
import React, { useState } from 'react';
import { DndContext, useDraggable, useDroppable, DragOverlay, DragEndEvent } from '@dnd-kit/core';
import { updateProjectWave } from '@/app/actions/update-wave';
import { useRouter } from 'next/navigation';

// Type definitions
interface ProjectNode {
    id: string;
    name?: string;
    projectName?: string;
    tShirtSize?: string;
    scoreValue?: number;
    scoreComplexity?: number;
    rank?: number;
    sequenceRank?: number;
}

interface DroppableColumnProps {
    rank: number;
    title: string;
    projects: ProjectNode[];
    color: string;
    bg: string;
}

// --- 1. Draggable Card ---
const DraggableCard = ({ project }: { project: ProjectNode }) => {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: project.id, data: { project } });
    const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;

    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="bg-white dark:bg-slate-700 p-3 rounded shadow-sm border border-slate-200 dark:border-slate-600 hover:shadow-md cursor-grab active:cursor-grabbing mb-3 group relative z-10">
            <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-tight">{project.name || project.projectName}</span>
                <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded text-slate-500 dark:text-slate-400 shrink-0 ml-2">{project.tShirtSize || '-'}</span>
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">Val: {project.scoreValue}/5 • Cplx: {project.scoreComplexity}/5</div>
        </div>
    );
};

// --- 2. Droppable Column ---
const DroppableColumn = ({ rank, title, projects, color, bg }: DroppableColumnProps) => {
    const { setNodeRef } = useDroppable({ id: rank.toString() });
    return (
        <div ref={setNodeRef} className={`flex flex-col h-full rounded-lg border-t-4 ${color} ${bg} p-3 transition-colors`}>
            <h3 className="text-xs font-bold tracking-widest text-slate-500 dark:text-slate-400 mb-4 uppercase">{title}</h3>
            <div className="flex-1 overflow-y-auto min-h-[100px] scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-600">
                {projects.map((p: ProjectNode) => <DraggableCard key={p.id} project={p} />)}
            </div>
        </div>
    );
};

// --- 3. Main Component ---
export default function StrategicWaves({ nodes, workshopId, edges = [] }: { nodes: ProjectNode[], workshopId: string, edges?: { from: string, to: string }[] }) {
    const router = useRouter();
    const [activeId, setActiveId] = useState<string | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [pendingMove, setPendingMove] = useState<{ id: string, newRank: number } | null>(null);
    const [reason, setReason] = useState("");

    // Headers configuration
    const columns = [
        { rank: 1, title: "WAVE 1: MOBILISE", color: "border-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/10" },
        { rank: 2, title: "WAVE 2: SCALE", color: "border-blue-500", bg: "bg-blue-50 dark:bg-blue-900/10" },
        { rank: 3, title: "WAVE 3: OPTIMISE", color: "border-violet-500", bg: "bg-violet-50 dark:bg-violet-900/10" },
        { rank: 4, title: "WAVE 4: DEFER", color: "border-slate-300", bg: "bg-slate-50 dark:bg-slate-800/50" },
    ];

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);
        if (over && active.id !== over.id) {
            const newRank = parseInt(over.id as string);
            // Only trigger if rank actually changed
            // Support both property names for compatibility
            const currentProject = nodes.find(o => o.id === active.id);
            const currentRank = currentProject?.rank || currentProject?.sequenceRank || 4;

            if (currentProject && currentRank !== newRank) {
                setPendingMove({ id: active.id as string, newRank });
                setModalOpen(true); // <--- TRIGGER MODAL
            }
        }
    };

    const handleSave = async () => {
        if (!pendingMove) return;
        await updateProjectWave(pendingMove.id, pendingMove.newRank, reason, workshopId);
        setModalOpen(false);
        setReason("");
        setPendingMove(null);
        router.refresh(); // Refresh to update Matrix colors and Lists
    };

    return (
        <div className="w-full h-[600px] relative p-4 mt-16">
            <DndContext onDragStart={(e) => setActiveId(e.active.id as string)} onDragEnd={handleDragEnd}>
                <div className="grid grid-cols-4 gap-4 h-full relative z-10">
                    {columns.map(col => (
                        <DroppableColumn
                            key={col.rank}
                            {...col}
                            // Filter logic adapted for 'nodes' structure where 'rank' is the property
                            projects={nodes.filter(o => (o.rank || o.sequenceRank || 4) === col.rank)}
                        />
                    ))}
                </div>

                {/* Drag Overlay (Visual feedback) */}
                <DragOverlay>
                    {activeId ? (
                        <div className="bg-white dark:bg-slate-700 p-3 rounded shadow-xl border border-blue-500 rotate-3 cursor-grabbing w-[200px]">
                            <span className="font-bold text-sm text-slate-800 dark:text-slate-100">Moving Project...</span>
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>

            {/* --- OVERRIDE MODAL --- */}
            {modalOpen && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm rounded-xl">
                    <div className="bg-white dark:bg-slate-800 w-[400px] p-6 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-700 animate-in zoom-in-95">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">Recommendation Override</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">You are moving a project against the AI recommendation. Please document the reason for the Board.</p>
                        <textarea
                            className="w-full h-24 border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 rounded p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none mb-4 resize-none"
                            placeholder="e.g. 'Board mandated immediate start despite risk...'"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            autoFocus
                        />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors">Cancel</button>
                            <button onClick={handleSave} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-sm transition-colors">Save Override</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
