interface ArtDirectorData {
    projectName?: string | null;
    systemGuardrails?: string | null;
    frictionStatement?: string | null;
    strategicRationale?: string | null;
    whyDoIt?: string | null;
}

export function useArtDirector(data: ArtDirectorData) {
    const titleLen = data.projectName?.length || 0;
    const riskLen = data.systemGuardrails?.length || 0;
    const frictionLen = data.frictionStatement?.length || 0;
    const rationaleLen = data.strategicRationale?.length || 0;
    const valuePropLen = data.whyDoIt?.length || 0;

    return {
        titleClass: titleLen > 30 ? "text-4xl leading-tight" : "text-6xl leading-none",
        sectionHeaderClass: "text-xs font-bold text-tertiary uppercase tracking-widest mb-2 border-b border-muted pb-1",

        riskContentClass: riskLen > 400 ? "text-[10px] leading-snug" : riskLen > 200 ? "text-xs leading-relaxed" : "text-sm leading-relaxed",

        frictionClass: frictionLen > 200 ? "text-sm leading-snug" : "text-xl leading-relaxed text-primary",

        rationaleClass: rationaleLen > 300 ? "text-sm leading-snug" : "text-base leading-7 text-secondary text-justify",

        showValueProp: valuePropLen > 0,
        valuePropClass: valuePropLen > 150 ? "text-xs leading-relaxed text-brand-navy font-medium" : "text-sm leading-relaxed text-brand-navy font-medium"
    };
}

export function cleanText(text: string | null | undefined) {
    if (!text) return "";
    // Fix "As a As a" stutter
    return text.replace(/^(As a\s+)+/i, "As a ");
}
