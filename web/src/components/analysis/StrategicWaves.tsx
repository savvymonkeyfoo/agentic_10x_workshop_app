'use client';
import React, { useState } from 'react';
import { DndContext, useDraggable, useDroppable, DragOverlay, DragEndEvent } from '@dnd-kit/core';
import { updateProjectWave } from '@/app/actions/update-wave';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

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
        <div id={`card-${project.id}`} ref={setNodeRef} style={style} {...listeners} {...attributes} className="bg-card dark:bg-card p-3 rounded shadow-sm border border-border hover:shadow-md cursor-grab active:cursor-grabbing mb-3 group relative z-10">
            <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-foreground text-sm leading-tight">{project.name || project.projectName}</span>
                <span className="text-xs font-mono bg-muted px-1 rounded text-muted-foreground shrink-0 ml-2">{project.tShirtSize || '-'}</span>
            </div>
            <div className="text-xs text-muted-foreground">Val: {project.scoreValue}/5 • Cplx: {project.scoreComplexity}/5</div>
        </div>
    );
};

// --- 2. Droppable Column ---
const DroppableColumn = ({ rank, title, projects, color, bg }: DroppableColumnProps) => {
    const { setNodeRef } = useDroppable({ id: rank.toString() });
    return (
        <div ref={setNodeRef} className={`flex flex-col h-full rounded-lg border-t-4 ${color} ${bg} p-3 transition-colors`}>
            <h3 className="text-xs font-bold tracking-widest text-muted-foreground mb-4 uppercase">{title}</h3>
            <div className="flex-1 overflow-y-auto min-h-[100px] scrollbar-thin scrollbar-thumb-border">
                {projects.map((p: ProjectNode) => <DraggableCard key={p.id} project={p} />)}
            </div>
        </div>
    );
};

// --- 3. Main Component ---
// --- 4. Helper for Curve Connections ---
const getWaveCurve = (start: { x: number, y: number }, end: { x: number, y: number }) => {
    // Standard Bezier Curve S-Shape
    const distX = Math.abs(end.x - start.x);
    // Control points at 50% distance horizontally
    const c1x = start.x + distX * 0.5;
    const c1y = start.y;
    const c2x = end.x - distX * 0.5;
    const c2y = end.y;
    return `M ${start.x} ${start.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${end.x} ${end.y}`;
};

// --- 5. Connection Overlay (Experimental) ---
const WavesConnectionOverlay = ({ edges, nodes }: { edges: { from: string, to: string }[], nodes: ProjectNode[] }) => {
    const [positions, setPositions] = React.useState<Record<string, { x: number, y: number, width: number, height: number }>>({});;

    // Simple measurement hook that runs after render
    React.useEffect(() => {
        const updatePositions = () => {
            const newPos: Record<string, { x: number, y: number, width: number, height: number }> = {};
            // We need to measure all current nodes
            nodes.forEach(node => {
                const el = document.getElementById(`card-${node.id}`);
                if (el) {
                    const rect = el.getBoundingClientRect();
                    // We need coordinates relative to the CONTAINER
                    const container = document.getElementById('waves-container');
                    if (container) {
                        const containerRect = container.getBoundingClientRect();
                        newPos[node.id] = {
                            x: rect.left - containerRect.left,
                            y: rect.top - containerRect.top,
                            width: rect.width,
                            height: rect.height
                        };
                    }
                }
            });
            setPositions(newPos);
        };

        // Wait for layout
        const timer = setTimeout(updatePositions, 100);

        return () => clearTimeout(timer);
    }, [nodes, edges]);

    const getTargetColor = (targetId: string) => {
        const target = nodes.find(n => n.id === targetId);
        const rank = target?.rank || target?.sequenceRank || 4;
        switch (rank) {
            case 1: return "#10b981"; // Emerald-500
            case 2: return "#3b82f6"; // Blue-500
            case 3: return "#8b5cf6"; // Violet-500
            case 4: return "#94a3b8"; // Slate-400
            default: return "#94a3b8";
        }
    };

    return (
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-50 overflow-visible">
            <defs>
                {/* Standard Grey Marker */}
                <marker id="wave-arrow-grey" markerWidth="6" markerHeight="4" refX="0" refY="2" orient="auto">
                    <polygon points="0 0, 6 2, 0 4" fill="#94a3b8" />
                </marker>
                {/* Wave 1 Emerald */}
                <marker id="wave-arrow-1" markerWidth="6" markerHeight="4" refX="0" refY="2" orient="auto">
                    <polygon points="0 0, 6 2, 0 4" fill="#10b981" />
                </marker>
                {/* Wave 2 Blue */}
                <marker id="wave-arrow-2" markerWidth="6" markerHeight="4" refX="0" refY="2" orient="auto">
                    <polygon points="0 0, 6 2, 0 4" fill="#3b82f6" />
                </marker>
                {/* Wave 3 Violet */}
                <marker id="wave-arrow-3" markerWidth="6" markerHeight="4" refX="0" refY="2" orient="auto">
                    <polygon points="0 0, 6 2, 0 4" fill="#8b5cf6" />
                </marker>
                {/* Wave 4 Slate */}
                <marker id="wave-arrow-4" markerWidth="6" markerHeight="4" refX="0" refY="2" orient="auto">
                    <polygon points="0 0, 6 2, 0 4" fill="#94a3b8" />
                </marker>
            </defs>
            {edges.map(edge => {
                const start = positions[edge.from];
                const end = positions[edge.to];
                if (!start || !end) return null;

                // Source: Right Edge Mid
                const sx = start.x + start.width;
                const sy = start.y + start.height / 2;

                // Target: Left Edge Mid (Offset by marker width to connect to Back of arrow)
                const ex = end.x - 6;
                const ey = end.y + end.height / 2;

                // Determine color based on TARGET rank
                const targetNode = nodes.find(n => n.id === edge.to);
                const rank = targetNode?.rank || targetNode?.sequenceRank || 4;
                const color = getTargetColor(edge.to);
                const markerId = `url(#wave-arrow-${rank})`;

                return (
                    <path
                        key={`w-${edge.from}-${edge.to}`}
                        d={getWaveCurve({ x: sx, y: sy }, { x: ex, y: ey })}
                        fill="none"
                        stroke={color}
                        strokeWidth="2"
                        markerEnd={markerId}
                        opacity="0.6"
                    />
                );
            })}
        </svg>
    )
}

// --- 3. Main Component ---
export default function StrategicWaves({ nodes, workshopId, edges = [] }: { nodes: ProjectNode[], workshopId: string, edges?: { from: string, to: string }[] }) {
    const router = useRouter();
    const [activeId, setActiveId] = useState<string | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [pendingMove, setPendingMove] = useState<{ id: string, newRank: number } | null>(null);
    const [reason, setReason] = useState("");

    // Headers configuration
    const columns = [
        { rank: 1, title: "WAVE 1: MOBILISE", color: "border-emerald-500", bg: "bg-emerald-500/10" },
        { rank: 2, title: "WAVE 2: SCALE", color: "border-info", bg: "bg-info-subtle/10" },
        { rank: 3, title: "WAVE 3: OPTIMISE", color: "border-violet-500", bg: "bg-violet-500/10" },
        { rank: 4, title: "WAVE 4: DEFER", color: "border-border", bg: "bg-muted/30" },
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
        <div id="waves-container" className="w-full h-[600px] relative p-4 mt-16">
            {/* SVG OVERLAY */}
            <WavesConnectionOverlay edges={edges} nodes={nodes} />

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
                        <div className="bg-card p-3 rounded shadow-xl border border-info rotate-3 cursor-grabbing w-[200px]">
                            <span className="font-bold text-sm text-foreground">Moving Project...</span>
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>

            {/* --- OVERRIDE MODAL --- */}
            {modalOpen && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-xl">
                    <div className="bg-card w-[400px] p-6 rounded-lg shadow-2xl border border-border animate-in zoom-in-95">
                        <h3 className="text-lg font-bold text-foreground mb-2">Recommendation Override</h3>
                        <p className="text-sm text-muted-foreground mb-4">You are moving a project against the AI recommendation. Please document the reason for the Board.</p>
                        <textarea
                            className="w-full h-24 border border-input bg-background/50 text-foreground rounded p-3 text-sm focus:ring-2 focus:ring-primary outline-none mb-4 resize-none"
                            placeholder="e.g. 'Board mandated immediate start despite risk...'"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            autoFocus
                        />
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" onClick={() => setModalOpen(false)} className="text-muted-foreground hover:bg-muted/50">Cancel</Button>
                            <Button variant="default" onClick={handleSave}>Save Override</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
