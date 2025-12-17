import React from 'react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';

// Register a standard font (optional, using Helvetica by default is fine for MVP)
// Font.register({ family: 'Inter', src: '...' });

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF', // Print Mode: White Background
        padding: 40,
        fontFamily: 'Helvetica',
    },
    header: {
        marginBottom: 20,
        borderBottomWidth: 2,
        borderBottomColor: '#002D40', // Brand Navy
        paddingBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    title: {
        fontSize: 24,
        color: '#002D40',
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    subtitle: {
        fontSize: 10,
        color: '#0070AD', // Brand Blue
        marginTop: 4,
    },
    section: {
        marginBottom: 15,
        padding: 10,
        backgroundColor: '#F8FAFC', // Very light grey for sections
        borderRadius: 4,
    },
    sectionTitle: {
        fontSize: 12,
        color: '#475569',
        fontWeight: 'heavy', // Not valid in simple CSS but close enough for react-pdf standard fonts
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    row: {
        flexDirection: 'row',
        gap: 15,
        marginBottom: 10,
    },
    col: {
        flex: 1,
    },
    label: {
        fontSize: 8,
        color: '#64748B',
        marginBottom: 2,
        textTransform: 'uppercase',
    },
    value: {
        fontSize: 10,
        color: '#002D40',
        lineHeight: 1.4,
    },
    valueLarge: {
        fontSize: 14,
        color: '#002D40',
        fontWeight: 'bold',
    },
    tag: {
        backgroundColor: '#002D40',
        color: 'white',
        padding: '4 8',
        borderRadius: 10,
        fontSize: 8,
        alignSelf: 'flex-start',
    },
    priorityBand: {
        position: 'absolute',
        top: 40,
        right: 40,
        backgroundColor: '#0070AD',
        color: 'white',
        padding: '10 20',
        borderRadius: 4,
    },
    priorityText: {
        fontSize: 16,
        fontWeight: 'bold',
    }
});

interface CharterData {
    projectName: string;
    id: string;
    frictionStatement: string;
    whyDoIt: string;
    strategicHorizon: string;
    agentDirective: {
        trigger: string;
        action: string;
        guardrail: string;
    };
    financials: {
        revenue: number | null;
        costReduction: number | null;
        hoursSaved: number | null;
    };
    tShirtSize: string;
    vrcc: {
        value: number;
        complexity: number;
    };
}

export const CharterPDF = ({ data }: { data: CharterData }) => (
    <Document>
        <Page size="A4" style={styles.page}>

            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>{data.projectName}</Text>
                    <Text style={styles.subtitle}>{data.id} | {data.tShirtSize} SIZE</Text>
                </View>
                <View style={styles.tag}>
                    <Text>{data.strategicHorizon}</Text>
                </View>
            </View>

            {/* Priority Badge */}
            {/* <View style={styles.priorityBand}>
        <Text style={styles.priorityText}>PRIORITY #1</Text>
      </View> */}

            {/* Section 1: The Why */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Strategic Context</Text>
                <View style={{ marginBottom: 10 }}>
                    <Text style={styles.label}>Friction Statement</Text>
                    <Text style={styles.value}>{data.frictionStatement}</Text>
                </View>
                <View>
                    <Text style={styles.label}>Why Do It?</Text>
                    <Text style={styles.value}>{data.whyDoIt}</Text>
                </View>
            </View>

            {/* Section 2: Agent Directive */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Agent Directive</Text>
                <View style={styles.row}>
                    <View style={styles.col}>
                        <Text style={styles.label}>Trigger</Text>
                        <Text style={styles.value}>{data.agentDirective.trigger}</Text>
                    </View>
                    <View style={styles.col}>
                        <Text style={styles.label}>Action</Text>
                        <Text style={styles.value}>{data.agentDirective.action}</Text>
                    </View>
                    <View style={styles.col}>
                        <Text style={styles.label}>Guardrail</Text>
                        <Text style={styles.value}>{data.agentDirective.guardrail}</Text>
                    </View>
                </View>
            </View>

            {/* Section 3: Business Case (Financials) */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Business Case (Estimated)</Text>
                <View style={styles.row}>
                    {data.financials.costReduction && (
                        <View style={styles.col}>
                            <Text style={styles.label}>Cost Reduction</Text>
                            <Text style={styles.valueLarge}>${data.financials.costReduction.toLocaleString()}</Text>
                        </View>
                    )}
                    {data.financials.revenue && (
                        <View style={styles.col}>
                            <Text style={styles.label}>Annual Revenue</Text>
                            <Text style={styles.valueLarge}>${data.financials.revenue.toLocaleString()}</Text>
                        </View>
                    )}
                    {data.financials.hoursSaved && (
                        <View style={styles.col}>
                            <Text style={styles.label}>Hours Returned/Week</Text>
                            <Text style={styles.valueLarge}>{data.financials.hoursSaved} hrs</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Section 4: VRCC Score */}
            <View style={{ marginTop: 20, flexDirection: 'row', justifyContent: 'flex-end', gap: 20 }}>
                <View>
                    <Text style={styles.label}>Business Value</Text>
                    <Text style={styles.valueLarge}>{data.vrcc.value}/5</Text>
                </View>
                <View>
                    <Text style={styles.label}>Complexity</Text>
                    <Text style={styles.valueLarge}>{data.vrcc.complexity}/5</Text>
                </View>
            </View>

            {/* Footer */}
            <View style={{ position: 'absolute', bottom: 40, left: 40, right: 40, borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 10 }}>
                <Text style={{ fontSize: 8, color: '#94A3B8', textAlign: 'center' }}>
                    Generated by Agentic 10x Protocol | Capgemini
                </Text>
            </View>

        </Page>
    </Document>
);
