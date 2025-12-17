import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font, Svg, Path } from '@react-pdf/renderer';

// Type definitions for PDF data
interface WorkflowStep {
    phase?: string;
    name?: string;
    label?: string;
}

interface PDFData {
    projectName?: string;
    frictionStatement?: string;
    strategicHorizon?: string;
    whyDoIt?: string;
    valueProposition?: string;
    strategicRationale?: string;
    efficiencyDisplay?: string;
    workflowSteps?: (string | WorkflowStep)[];
    definitionOfDone?: string;
    keyDecisions?: string;
    keyRisks?: string;
    capabilitiesMissing?: string[];
    capabilitiesExisting?: string[];
}

interface ChartImages {
    radar?: string | null;
    matrix?: string | null;
    dfv?: string | null;
}

// 1. Register Professional Fonts (Roboto)
Font.register({
    family: 'Roboto',
    fonts: [
        { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 400 },
        { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf', fontWeight: 500 },
        { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 700 },
        { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-black-webfont.ttf', fontWeight: 900 },
        { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-italic-webfont.ttf', fontStyle: 'italic' },
    ],
});

// 2. Define Strict Layout Styles
const styles = StyleSheet.create({
    page: { flexDirection: 'row', backgroundColor: '#F8FAFC', padding: 25, fontFamily: 'Roboto' },

    // --- SIDEBAR (Left) ---
    sidebar: { width: '28%', paddingRight: 15, borderRightWidth: 1, borderRightColor: '#E2E8F0', borderStyle: 'solid' },

    // Title: Adjusted line height and size to prevent "CO-PI- LOT" hyphenation issues
    title: { fontSize: 22, fontWeight: 900, textTransform: 'uppercase', color: '#0F172A', lineHeight: 1.1, marginBottom: 15 },

    // Headers
    sectionLabel: { fontSize: 9, color: '#94A3B8', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 6, letterSpacing: 0.5, marginTop: 15 },

    // Body Text
    bodyText: { fontSize: 9, color: '#334155', lineHeight: 1.5 },
    italicText: { fontSize: 9, color: '#334155', lineHeight: 1.5, fontStyle: 'italic', fontFamily: 'Roboto' },

    // --- MAIN CONTENT (Right) ---
    mainContent: { width: '72%', paddingLeft: 15, display: 'flex', flexDirection: 'column' },

    // Row 1: Charts (Strict Height Constraint)
    rowCharts: { flexDirection: 'row', gap: 10, height: 130, marginBottom: 15 },

    // Card Container
    card: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 4, padding: 6, borderWidth: 1, borderColor: '#E2E8F0', borderStyle: 'solid', display: 'flex', flexDirection: 'column' },

    // Chart Header
    cardHeader: { fontSize: 7, color: '#64748B', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4 },

    // CRITICAL FIX: Image Containment
    // This ensures the 4x scale image shrinks to fit the box perfectly
    chartImageContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    chartImage: { width: '100%', height: '100%', objectFit: 'contain' },

    // Efficiency Score
    efficiencyBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    efficiencyValue: { fontSize: 32, fontWeight: 900, color: '#F97316' },

    // Row 2: Workflow (Yellow Stickies)
    workflowSection: { marginBottom: 15, padding: 8, backgroundColor: '#F8FAFC', borderRadius: 4 },
    workflowRow: { flexDirection: 'row', gap: 12, justifyContent: 'center', flexWrap: 'wrap' },
    postIt: {
        width: 80, height: 50, backgroundColor: '#FEF08A', padding: 4, borderRadius: 2,
        alignItems: 'center', justifyContent: 'center', display: 'flex'
    },
    postItText: { fontSize: 8, fontWeight: 'bold', color: '#854D0E', textAlign: 'center' },

    // Row 3: Details (Bento Box)
    detailsRow: { flexDirection: 'row', gap: 10, flex: 1 }, // Take remaining height
    detailCard: { flex: 1, borderRadius: 4, padding: 8, borderWidth: 1, borderStyle: 'solid' },

    // Header with Icon
    detailHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 4 },
    detailTitle: { fontSize: 8, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 0 },

    // Lists
    bulletRow: { flexDirection: 'row', marginBottom: 6 },
    bullet: { width: 3, height: 3, backgroundColor: '#64748B', borderRadius: 50, marginRight: 6, marginTop: 4 },

    // Pills (Capabilities)
    pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 8 },
    pill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderStyle: 'solid' },
    pillText: { fontSize: 6, fontWeight: 'bold', textTransform: 'uppercase' },
    subHeader: { fontSize: 7, fontWeight: 'bold', marginBottom: 4, marginTop: 6 },
});

// --- ICONS (Matches Screen Colors) ---
const IconCheck = () => <Svg width="12" height="12" viewBox="0 0 24 24"><Path d="M20 6L9 17L4 12" stroke="#16A34A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" /></Svg>;
const IconBrain = () => <Svg width="12" height="12" viewBox="0 0 24 24"><Path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-4.04z" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" /></Svg>;
const IconPulse = () => <Svg width="12" height="12" viewBox="0 0 24 24"><Path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" /></Svg>;
const IconLayers = () => <Svg width="12" height="12" viewBox="0 0 24 24"><Path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" /></Svg>;

export const StrategyMapDocument = ({ data, chartImages }: { data: PDFData, chartImages: ChartImages }) => (
    <Document>
        <Page size="A3" orientation="landscape" style={styles.page}>

            {/* --- SIDEBAR --- */}
            <View style={styles.sidebar}>
                <Text style={styles.title}>{data.projectName}</Text>

                <Text style={styles.sectionLabel}>The Friction</Text>
                <Text style={styles.bodyText}>{data.frictionStatement || '—'}</Text>

                {/* Show Horizon if data exists */}
                {data.strategicHorizon && (
                    <>
                        <Text style={styles.sectionLabel}>Strategic Horizon</Text>
                        <View style={styles.pillRow}>
                            {data.strategicHorizon.split(',').map((item: string, i: number) => (
                                <View key={i} style={[styles.pill, { backgroundColor: '#F1F5F9', borderColor: '#E2E8F0' }]}>
                                    <Text style={[styles.pillText, { color: '#475569' }]}>{item.trim()}</Text>
                                </View>
                            ))}
                        </View>
                    </>
                )}

                <Text style={styles.sectionLabel}>Value Proposition</Text>
                <Text style={styles.italicText}>{data.whyDoIt || data.valueProposition || '—'}</Text>

                <Text style={styles.sectionLabel}>Strategic Rationale</Text>
                <Text style={styles.bodyText}>{data.strategicRationale || '—'}</Text>
            </View>

            {/* --- MAIN CONTENT --- */}
            <View style={styles.mainContent}>

                {/* ROW 1: CHARTS */}
                <View style={styles.rowCharts}>
                    {/* Radar */}
                    <View style={styles.card}>
                        <Text style={styles.cardHeader}>Strategic Fit</Text>
                        <View style={styles.chartImageContainer}>
                            {/* eslint-disable-next-line jsx-a11y/alt-text */}
                            {chartImages.radar && <Image src={chartImages.radar} style={styles.chartImage} />}
                        </View>
                    </View>
                    {/* Matrix */}
                    <View style={styles.card}>
                        <Text style={styles.cardHeader}>Prioritisation</Text>
                        <View style={styles.chartImageContainer}>
                            {/* eslint-disable-next-line jsx-a11y/alt-text */}
                            {chartImages.matrix && <Image src={chartImages.matrix} style={styles.chartImage} />}
                        </View>
                    </View>
                    {/* DFV */}
                    <View style={styles.card}>
                        <Text style={styles.cardHeader}>DFV Score</Text>
                        <View style={styles.chartImageContainer}>
                            {/* eslint-disable-next-line jsx-a11y/alt-text */}
                            {chartImages.dfv && <Image src={chartImages.dfv} style={styles.chartImage} />}
                        </View>
                    </View>
                    {/* Efficiency */}
                    <View style={[styles.card, { flex: 0.6 }]}>
                        <Text style={styles.cardHeader}>Efficiency</Text>
                        <View style={styles.efficiencyBox}>
                            <Text style={styles.efficiencyValue}>{data.efficiencyDisplay || '0.0x'}</Text>
                        </View>
                    </View>
                </View>

                {/* ROW 2: WORKFLOW */}
                <View style={styles.workflowSection}>
                    <Text style={[styles.cardHeader, { textAlign: 'center', marginBottom: 6 }]}>The Workflow Engine</Text>
                    <View style={styles.workflowRow}>
                        {data.workflowSteps && data.workflowSteps.length > 0 ? (
                            data.workflowSteps.map((step: string | WorkflowStep, i: number) => {
                                // Force string conversion to ensure label appears
                                const label = typeof step === 'string' ? step : (step.phase || step.name || step.label || JSON.stringify(step));
                                return (
                                    <View key={i} style={[styles.postIt, { transform: i % 2 === 0 ? 'rotate(-1deg)' : 'rotate(1deg)' }]}>
                                        <Text style={styles.postItText}>{label}</Text>
                                    </View>
                                );
                            })
                        ) : (
                            <Text style={{ fontSize: 9, color: '#94A3B8', fontStyle: 'italic', textAlign: 'center' }}>No workflow defined</Text>
                        )}
                    </View>
                </View>

                {/* ROW 3: BENTO DETAILS */}
                <View style={styles.detailsRow}>

                    {/* DoD (Green) */}
                    <View style={[styles.detailCard, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
                        <View style={styles.detailHeaderRow}>
                            <IconCheck />
                            <Text style={[styles.detailTitle, { color: '#166534' }]}>Definition of Done</Text>
                        </View>
                        {(data.definitionOfDone || '').split('\n').map((line: string, i: number) => line.trim() && (
                            <View key={i} style={styles.bulletRow}>
                                <View style={styles.bullet} />
                                <Text style={[styles.bodyText, { flex: 1 }]}>{line}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Decisions (Amber) */}
                    <View style={[styles.detailCard, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
                        <View style={styles.detailHeaderRow}>
                            <IconBrain />
                            <Text style={[styles.detailTitle, { color: '#92400E' }]}>Key Decisions</Text>
                        </View>
                        {(data.keyDecisions || '').split('\n').map((line: string, i: number) => line.trim() && (
                            <View key={i} style={styles.bulletRow}>
                                <View style={styles.bullet} />
                                <Text style={[styles.bodyText, { flex: 1 }]}>{line}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Risks (Red) */}
                    <View style={[styles.detailCard, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
                        <View style={styles.detailHeaderRow}>
                            <IconPulse />
                            <Text style={[styles.detailTitle, { color: '#991B1B' }]}>Key Risks</Text>
                        </View>
                        {(data.keyRisks || '').split('\n').map((line: string, i: number) => line.trim() && (
                            <View key={i} style={styles.bulletRow}>
                                <View style={styles.bullet} />
                                <Text style={[styles.bodyText, { flex: 1 }]}>{line}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Capabilities (Blue) */}
                    <View style={[styles.detailCard, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
                        <View style={styles.detailHeaderRow}>
                            <IconLayers />
                            <Text style={[styles.detailTitle, { color: '#1E40AF' }]}>Capabilities</Text>
                        </View>

                        {/* Missing */}
                        <Text style={[styles.subHeader, { color: '#EA580C' }]}>MISSING (GAP)</Text>
                        <View style={styles.pillRow}>
                            {data.capabilitiesMissing?.map((cap: string, i: number) => (
                                <View key={i} style={[styles.pill, { backgroundColor: '#FFF7ED', borderColor: '#FED7AA' }]}>
                                    <Text style={[styles.pillText, { color: '#C2410C' }]}>{cap}</Text>
                                </View>
                            ))}
                        </View>

                        {/* Existing */}
                        <Text style={[styles.subHeader, { color: '#059669' }]}>EXISTING</Text>
                        <View style={styles.pillRow}>
                            {data.capabilitiesExisting?.map((cap: string, i: number) => (
                                <View key={i} style={[styles.pill, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
                                    <Text style={[styles.pillText, { color: '#047857' }]}>{cap}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                </View>

            </View>

            {/* Footer with Timestamp */}
            <Text style={{ position: 'absolute', bottom: 10, right: 30, fontSize: 8, color: '#CBD5E1' }}>Generated by 10x Agentic Workshop • {new Date().toLocaleTimeString()}</Text>
        </Page>
    </Document>
);
