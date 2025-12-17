'use client';
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { DndContext, useDraggable, useDroppable, DragOverlay, DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { X, GripVertical, Plus, Sparkles, Loader2 } from 'lucide-react';
import { recommendCapabilities } from '@/app/actions/recommend-capabilities';
import { WorkflowPhase } from '@/types/workshop';

// Type definitions
interface AddCapModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (val: string) => void;
    title: string;
}

interface DropZoneProps {
    id: string;
    title: string;
    items: string[];
    colorClass: string;
    placeholder: string;
    onDelete?: (item: string) => void;
    onAdd?: () => void;
}

interface DragData {
    label: string;
    origin: string;
}

// --- 1. THE STANDARD BANK (30 Enterprise Items) ---
const STANDARD_CAPABILITIES = [
    "SAP (ERP)", "Salesforce (CRM)", "ServiceNow", "Workday (HRIS)", "Jira",
    "Microsoft 365", "Slack / Teams", "SharePoint", "Snowflake", "Databricks",
    "Oracle DB", "PostgreSQL", "AWS S3", "Kafka", "MuleSoft",
    "UiPath (RPA)", "Power Automate", "Azure OpenAI", "AWS Bedrock", "Python Runtime",
    "Docker/K8s", "Okta / AD", "Splunk", "Tableau / PowerBI", "Adobe Cloud",
    "Stripe", "Twilio", "DocuSign", "Genesys", "Legacy Mainframe"
];

// --- 2. SUB-COMPONENTS ---

// Simple Add Modal
const AddCapModal = ({ isOpen, onClose, onConfirm, title }: AddCapModalProps) => {
    const [val, setVal] = useState("");
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/20 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-xl border border-slate-200 p-4 w-[300px] animate-in zoom-in-95">
                <h4 className="text-sm font-bold text-slate-700 mb-3">{title}</h4>
                <input
                    autoFocus
                    className="w-full border border-slate-300 rounded p-2 text-sm outline-none focus:border-blue-500 mb-4"
                    placeholder="e.g. Custom Legacy API..."
                    value={val}
                    onChange={e => setVal(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === 'Enter' && val.trim()) { onConfirm(val); setVal(""); }
                        if (e.key === 'Escape') onClose();
                    }}
                />
                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded">Cancel</button>
                    <button
                        onClick={() => { if (val.trim()) { onConfirm(val); setVal(""); } }}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-sm"
                    >
                        Add Item
                    </button>
                </div>
            </div>
        </div>
    );
};

// The Draggable Chip
const CapChip = ({ id, label, color, onDelete }: { id: string, label: string, color: string, onDelete?: () => void }) => {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id, data: { label, origin: 'chip' } });

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className={`
        px-3 py-1.5 rounded-full text-xs font-bold shadow-sm border border-transparent 
        flex items-center gap-2 cursor-grab active:cursor-grabbing transition-all
        ${isDragging ? 'opacity-50 scale-105' : ''}
        ${color}
      `}
        >
            <GripVertical size={10} className="opacity-50" />
            {label}
            {onDelete && (
                <button
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={onDelete}
                    className="hover:bg-black/10 rounded-full p-0.5 transition-colors ml-1"
                >
                    <X size={12} />
                </button>
            )}
        </div>
    );
};

// The Drop Zone
const DropZone = ({ id, title, items, colorClass, placeholder, onDelete, onAdd }: DropZoneProps) => {
    const { setNodeRef, isOver } = useDroppable({ id });

    return (
        <div
            ref={setNodeRef}
            className={`
        flex-1 rounded-xl border-2 transition-all p-4 min-h-[120px] flex flex-col gap-3
        ${isOver ? 'border-blue-400 bg-blue-50/50 scale-[1.01]' : 'border-slate-200 bg-slate-50/30'}
      `}
        >
            <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">{title}</h4>
                <div className="flex items-center gap-2">
                    {/* Count Badge */}
                    <span className="text-[10px] bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full">{items.length}</span>
                    {/* Add Button */}
                    {onAdd && (
                        <button
                            onClick={onAdd}
                            className="text-[10px] font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-0.5 rounded flex items-center gap-1 transition-colors"
                        >
                            <Plus size={10} /> Add New
                        </button>
                    )}
                </div>
            </div>

            <div className="flex flex-wrap gap-2 content-start h-full">
                {items.length === 0 && !isOver && (
                    <div className="text-slate-300 text-xs italic w-full text-center mt-4 border-2 border-dashed border-slate-100 rounded-lg p-4">
                        {placeholder}
                    </div>
                )}
                {items.map((item: string) => (
                    <CapChip
                        key={item}
                        id={`${id}-${item}`} // Unique ID based on zone
                        label={item}
                        color={colorClass}
                        // We pass a delete handler if provided
                        onDelete={onDelete ? () => onDelete(item) : undefined}
                    />
                ))}
            </div>
        </div>
    );
};

// --- 3. MAIN MANAGER ---
// Union type to support both direct phases array or full context object
type WorkflowContextOrItems = WorkflowPhase[] | {
    name?: string;
    friction?: string;
    phases?: WorkflowPhase[];
    [key: string]: unknown;
};

export default function CapabilitiesManager({
    existingCaps,
    missingCaps,
    onUpdate,
    workflowContext
}: {
    existingCaps: string[],
    missingCaps: string[],
    onUpdate: (field: 'capabilitiesExisting' | 'capabilitiesMissing', newVal: string[]) => void,
    workflowContext?: WorkflowContextOrItems
}) {

    // Local state for the "Bank" (Filter out items already used)
    const usedCaps = new Set([...existingCaps, ...missingCaps]);
    const [bank, setBank] = useState(STANDARD_CAPABILITIES.filter(c => !usedCaps.has(c)));
    const [activeDrag, setActiveDrag] = useState<DragData | null>(null);
    const [mounted, setMounted] = useState(false);
    const [addingZone, setAddingZone] = useState<'existing' | 'missing' | null>(null);
    const [isRecommending, setIsRecommending] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleDragStart = (event: DragStartEvent) => {
        setActiveDrag(event.active.data.current as DragData);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveDrag(null);

        if (!over) return;

        // 1. Identify Players
        const sourceZone = (active.id as string).split('-')[0]; // "bank", "existing", "missing"
        const itemLabel = (active.data.current as DragData).label;
        const targetZone = over.id as string; // "bank", "existing", "missing"

        // 2. If dropping in the SAME zone, do nothing
        if (sourceZone === targetZone) return;

        // 3. REMOVE from Source
        // (We do this regardless of where it's going)
        if (sourceZone === 'bank') {
            setBank(prev => prev.filter(i => i !== itemLabel));
        } else if (sourceZone === 'existing') {
            // Filter out the item from existing caps
            onUpdate('capabilitiesExisting', existingCaps.filter(i => i !== itemLabel));
        } else if (sourceZone === 'missing') {
            // Filter out the item from missing caps
            onUpdate('capabilitiesMissing', missingCaps.filter(i => i !== itemLabel));
        }

        // 4. ADD to Target
        // (We do this regardless of where it came from)
        if (targetZone === 'existing') {
            // Prevent duplicates if something weird happens, though filter above handles it
            if (!existingCaps.includes(itemLabel)) {
                onUpdate('capabilitiesExisting', [...existingCaps, itemLabel]);
            }
        } else if (targetZone === 'missing') {
            if (!missingCaps.includes(itemLabel)) {
                onUpdate('capabilitiesMissing', [...missingCaps, itemLabel]);
            }
        } else if (targetZone === 'bank') {
            // Return to bank and resort
            setBank(prev => [...prev, itemLabel].sort());
        }
    };

    // Handle Manual Add
    const handleManualAdd = (newItem: string) => {
        if (addingZone === 'existing') {
            if (!existingCaps.includes(newItem)) {
                onUpdate('capabilitiesExisting', [...existingCaps, newItem]);
            }
        } else if (addingZone === 'missing') {
            if (!missingCaps.includes(newItem)) {
                onUpdate('capabilitiesMissing', [...missingCaps, newItem]);
            }
        }
        setAddingZone(null);
    };

    // Manual Delete Handler (Click X)
    const handleDelete = (zone: string, label: string) => {
        if (zone === 'existing') {
            onUpdate('capabilitiesExisting', existingCaps.filter(i => i !== label));
        } else {
            onUpdate('capabilitiesMissing', missingCaps.filter(i => i !== label));
        }
        setBank(prev => [...prev, label].sort());
    };

    // AI Recommendation Logic
    const handleAIRecommend = async () => {
        if (!workflowContext) return;
        setIsRecommending(true);
        try {
            const result = await recommendCapabilities(workflowContext);
            if (result.success && result.data) {
                const currentSafe = new Set(existingCaps);
                const currentGap = new Set(missingCaps);
                const currentBank = new Set(bank);

                const newItems = result.data.filter((item: string) => {
                    return !currentSafe.has(item) && !currentGap.has(item) && !currentBank.has(item);
                });

                if (newItems.length > 0) {
                    setBank(prev => [...newItems, ...prev]);
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsRecommending(false);
        }
    };

    return (
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="space-y-6">

                {/* TOP: The Active Zones */}
                <div className="grid grid-cols-2 gap-6">
                    <DropZone
                        id="existing"
                        title="Existing Capabilities (Safe)"
                        items={existingCaps}
                        colorClass="bg-emerald-100 text-emerald-800 border-emerald-200"
                        placeholder="Drag 'Safe' systems here..."
                        onDelete={(item: string) => handleDelete('existing', item)}
                        onAdd={() => setAddingZone('existing')}
                    />
                    <DropZone
                        id="missing"
                        title="Missing Capabilities (Gap)"
                        items={missingCaps}
                        colorClass="bg-amber-100 text-amber-800 border-amber-200"
                        placeholder="Drag 'Gap' systems here..."
                        onDelete={(item: string) => handleDelete('missing', item)}
                        onAdd={() => setAddingZone('missing')}
                    />
                </div>

                {/* BOTTOM: The Bank */}
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 transition-all">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Enterprise Capability Bank</h4>
                        <button
                            onClick={handleAIRecommend}
                            disabled={isRecommending || !workflowContext}
                            className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-bold rounded-full shadow-md hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isRecommending ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                            {isRecommending ? "Analysing..." : "Recommend"}
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2 min-h-[60px]">
                        {bank.map(cap => (
                            <CapChip key={cap} id={`bank-${cap}`} label={cap} color="bg-blue-500 text-white hover:bg-blue-600" />
                        ))}
                    </div>
                </div>

            </div>

            {/* Drag Overlay Portal */}
            {mounted && createPortal(
                <DragOverlay>
                    {activeDrag ? (
                        <div className="px-3 py-1.5 rounded-full text-xs font-bold shadow-2xl bg-blue-600 text-white border-2 border-white scale-110 flex items-center gap-2 cursor-grabbing z-[9999]">
                            <GripVertical size={10} /> {activeDrag.label}
                        </div>
                    ) : null}
                </DragOverlay>,
                document.body
            )}

            {/* Add Modal Portal */}
            {mounted && createPortal(
                <AddCapModal
                    isOpen={!!addingZone}
                    title={addingZone === 'existing' ? "Add Existing Capability" : "Add Missing Capability"}
                    onClose={() => setAddingZone(null)}
                    onConfirm={handleManualAdd}
                />,
                document.body
            )}

        </DndContext>
    );
}
