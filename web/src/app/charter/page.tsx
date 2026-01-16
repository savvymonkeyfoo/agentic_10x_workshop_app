'use client';

import React, { useEffect, useState } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { CharterPDF } from '@/components/charter/CharterPDF';
import { getCharterData } from '@/app/actions/get-charter';
import { Button } from '@/components/ui/button';

// Note: In real app, we fetch server side and pass as props. 
// For simplicity in this iteration, we'll fetch on mount or use a server action.
// Let's assume we pass data from a Server Component wrapper, but for this file, 
// I'll implement it as a Client Component that fetches via action to keep PDF logic clean.

export default function CharterPage() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const result = await getCharterData();
                setData(result);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    if (loading) return <div className="p-10 text-brand-navy">Generating Charter...</div>;
    if (!data) return <div className="p-10 text-status-risk">Error loading charter data.</div>;

    return (
        <div className="min-h-screen bg-[var(--bg-core)] p-8 flex flex-col items-center">

            <header className="w-full max-w-4xl flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-brand-navy">Project Charter</h1>
                    <p className="text-slate-500 text-sm">Review & Export</p>
                </div>

                <PDFDownloadLink document={<CharterPDF data={data} />} fileName={`Charter-${data.id}.pdf`}>
                    {({ loading: pdfLoading }) => (
                        <Button size="lg" className="shadow-lg hover:shadow-xl transition-all gap-2">
                            {pdfLoading ? 'Preparing PDF...' : 'Export PDF'}
                            {!pdfLoading && (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                            )}
                        </Button>
                    )}
                </PDFDownloadLink>
            </header>

            {/* Preview Card (Screen View) */}
            <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl border border-slate-100 p-10 space-y-8">

                <div className="flex justify-between items-start border-b border-slate-100 pb-6">
                    <div>
                        <h2 className="text-3xl font-bold text-brand-navy mb-2">{data.projectName}</h2>
                        <div className="flex gap-3">
                            <div className="px-3 py-1 bg-brand-cyan/10 text-brand-cyan text-xs font-bold rounded-full">{data.id}</div>
                            <div className="px-3 py-1 bg-brand-navy/10 text-brand-navy text-xs font-bold rounded-full uppercase">{data.tShirtSize} SIZE</div>
                        </div>
                    </div>
                    <div className="px-4 py-2 bg-brand-navy text-white text-xs font-bold rounded-lg tracking-widest">
                        {data.strategicHorizon}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-10">
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold uppercase text-slate-400">Context</h3>
                        <div>
                            <label className="text-xs text-slate-500">The Problem</label>
                            <p className="text-brand-navy font-medium leading-relaxed">{data.frictionStatement}</p>
                        </div>
                        <div>
                            <label className="text-xs text-slate-500">The Why</label>
                            <p className="text-brand-navy font-medium leading-relaxed">{data.whyDoIt}</p>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                        <h3 className="text-xs font-bold uppercase text-slate-400">Agent Directive</h3>
                        <div className="grid grid-cols-1 gap-3">
                            <div>
                                <label className="text-[10px] text-slate-400 uppercase">Trigger</label>
                                <div className="text-sm font-semibold text-brand-navy">{data.agentDirective.trigger}</div>
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-400 uppercase">Action</label>
                                <div className="text-sm font-semibold text-brand-navy">{data.agentDirective.action}</div>
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-400 uppercase">Guardrail</label>
                                <div className="text-sm font-semibold text-brand-navy">{data.agentDirective.guardrail}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t border-slate-100 grid grid-cols-3 gap-6 text-center">
                    <div>
                        <div className="text-xs text-slate-400 uppercase mb-1">Cost Reduction</div>
                        <div className="text-xl font-bold text-brand-blue">${data.financials.costReduction?.toLocaleString() ?? 0}</div>
                    </div>
                    <div>
                        <div className="text-xs text-slate-400 uppercase mb-1">Revenue Uplift</div>
                        <div className="text-xl font-bold text-brand-blue">${data.financials.revenue?.toLocaleString() ?? 0}</div>
                    </div>
                    <div>
                        <div className="text-xs text-slate-400 uppercase mb-1">Efficiency</div>
                        <div className="text-xl font-bold text-brand-blue">{data.financials.hoursSaved ?? 0} hrs/wk</div>
                    </div>
                </div>

            </div>

        </div>
    );
}
