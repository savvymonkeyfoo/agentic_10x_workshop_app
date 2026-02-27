'use client';

import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Brain, CheckCircle2 } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { ScorecardModal } from './ScorecardModal';
import { getTierFromScore } from '@/lib/scoring-constants';

interface IdeaCardDetailProps {
    card: {
        id: string;
        title: string;
        description: string;
        tier: string;
        source: string;
        strategicCluster?: string;
        status?: string;
        score?: number | null;
        scorecardData?: Record<string, number>;
    };
    onSave?: (updates: Partial<IdeaCardDetailProps['card']>) => void;
    onClose?: () => void;
}

// Source options for dropdown
const SOURCE_OPTIONS = [
    { value: 'MARKET_SIGNAL', label: 'Market Signal' },
    { value: 'CLIENT_BACKLOG', label: 'Client Backlog' },
    { value: 'WORKSHOP_GENERATED', label: 'Workshop Generated' }
];

// Cluster options
const CLUSTER_OPTIONS = [
    { value: 'Customer Experience', label: 'Customer Experience' },
    { value: 'Operational Efficiency', label: 'Operational Efficiency' },
    { value: 'Logistics Optimization', label: 'Logistics Optimization' },
    { value: 'Risk Management', label: 'Risk Management' }
];

// Tier display config
const TIER_DISPLAY = {
    UNSCORED: { label: '❓ Needs Scoring', class: 'bg-card text-secondary border-border' },
    AGENTIC_AUTO: { label: '🤖 Agentic Auto', class: 'bg-surface-hover text-primary border-border' },
    TABLE_STAKES: { label: '🛡️ Table Stakes', class: 'bg-info-subtle text-info border-info' },
    STRATEGIC_BET: { label: '🌟 Strategic Bet', class: 'bg-warning-subtle text-warning border-warning' }
} as const;

export function IdeaCardDetail({ card, onSave, onClose: _onClose }: IdeaCardDetailProps) {
    // Local state for editing
    const [title, setTitle] = useState(card.title);
    const [description, setDescription] = useState(card.description);
    const [source, setSource] = useState(card.source);
    const [cluster, setCluster] = useState(card.strategicCluster || '');
    const [score, setScore] = useState<number | null>(card.score ?? null);
    const [scorecardData, setScorecardData] = useState<Record<string, number>>(card.scorecardData || {});
    const [showScorecard, setShowScorecard] = useState(false);

    // Auto-save status
    const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');

    // Derive tier from score (auto-tiering)
    const effectiveTier = score !== null && score > 0 ? getTierFromScore(score) : 'UNSCORED';
    const tierDisplay = TIER_DISPLAY[effectiveTier as keyof typeof TIER_DISPLAY] || TIER_DISPLAY.UNSCORED;

    // Auto-Save Effect with debounce
    useEffect(() => {
        setSaveStatus('saving');
        const timer = setTimeout(() => {
            onSave?.({
                title,
                description,
                tier: effectiveTier,
                source,
                strategicCluster: cluster || undefined,
                score,
                scorecardData
            });
            setSaveStatus('saved');
        }, 1000); // 1-second debounce

        return () => clearTimeout(timer);
    }, [title, description, source, cluster, score, scorecardData, effectiveTier, onSave]);

    // Auto-save callback - does NOT close the modal
    const handleScorecardAutoSave = (scores: Record<string, number>, avgScore: number, _tier: string) => {
        setScorecardData(scores);
        setScore(avgScore);
        // Do NOT close modal here - auto-save keeps modal open
    };

    // Explicit close - when user clicks outside or presses Escape
    const handleScorecardClose = () => {
        setShowScorecard(false);
    };

    // Show scorecard modal if open
    if (showScorecard) {
        return (
            <ScorecardModal
                cardTitle={title}
                initialScores={scorecardData}
                onSave={handleScorecardAutoSave}
                onClose={handleScorecardClose}
            />
        );
    }

    return (
        <div className="flex flex-col h-full max-h-[80vh]">
            {/* Header - Badge + Auto-Save Indicator */}
            <div className="flex items-center justify-between pb-4 border-b border-border">
                <Badge variant="outline" className="text-xs bg-intelligence-subtle text-intelligence border-intelligence">
                    Editing Idea
                </Badge>

                {/* Auto-Save Status */}
                {saveStatus === 'saving' ? (
                    <div className="flex items-center gap-1 text-xs text-tertiary">
                        <Spinner size="sm" /> Saving...
                    </div>
                ) : (
                    <div className="flex items-center gap-1 text-xs text-success font-medium">
                        <CheckCircle2 className="w-3 h-3" /> Auto-saved
                    </div>
                )}
            </div>

            {/* Scrollable Content - Reordered: Title -> Description -> Meta -> Tier */}
            <div className="flex-1 overflow-y-auto py-6 space-y-6">
                {/* Title Input */}
                <div className="space-y-2">
                    <Label htmlFor="title" className="text-xs font-bold uppercase tracking-wider text-secondary">
                        Idea Title
                    </Label>
                    <Input
                        id="title"
                        value={title}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                        className="text-lg font-bold"
                        placeholder="Enter a compelling title..."
                    />
                </div>

                {/* Description - Moved up */}
                <div className="space-y-2">
                    <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-secondary">
                        Description
                    </Label>
                    <Textarea
                        id="description"
                        value={description}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                        className="min-h-[120px] resize-none"
                        placeholder="Describe the opportunity in detail..."
                    />
                    <p className="text-xs text-tertiary">
                        {description.split(' ').filter(Boolean).length} words
                    </p>
                </div>

                {/* Meta Row: Source, Cluster */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-secondary">
                            Source
                        </Label>
                        <Select value={source} onValueChange={setSource}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {SOURCE_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-secondary">
                            Strategic Cluster
                        </Label>
                        <Select value={cluster} onValueChange={setCluster}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select cluster..." />
                            </SelectTrigger>
                            <SelectContent>
                                {CLUSTER_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Auto-Tier Display & Scorecard Trigger - Moved to bottom, no score text */}
                <div className="bg-surface-subtle rounded-lg p-4 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-secondary mb-1">Current Tier</p>
                        <Badge variant="outline" className={`text-sm font-bold px-3 py-1 ${tierDisplay.class}`}>
                            {tierDisplay.label}
                        </Badge>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => setShowScorecard(true)}
                        className="border-intelligence text-intelligence hover:bg-intelligence-subtle"
                    >
                        <Brain size={16} className="mr-2" />
                        {score ? 'Edit Assessment' : 'Run Assessment'}
                    </Button>
                </div>
            </div>

            {/* No footer - auto-save handles everything, click outside to close */}
        </div>
    );
}
