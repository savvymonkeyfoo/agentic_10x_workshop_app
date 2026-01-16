export type ThemeConfig = {
    value: string;
    label: string;
    description: string;
    color: string;
}

export const themes: ThemeConfig[] = [
    {
        value: "capgemini",
        label: "Default",
        description: "Capgemini Corporate",
        color: "bg-[#0070AD]"
    },
    {
        value: "claude",
        label: "Claude",
        description: "Digital Manuscript. Warm and literary.",
        color: "bg-[#D97757]"
    },
    {
        value: "linear",
        label: "Modern",
        description: "Linear High-Contrast",
        color: "bg-[#5E6AD2]"
    }
]
