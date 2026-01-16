export type ThemeConfig = {
    value: string;
    label: string;
    description: string;
}

export const themes: ThemeConfig[] = [
    {
        value: "capgemini",
        label: "Capgemini",
        description: "Corporate, trustworthy navy and cyan."
    },
    {
        value: "anthropic",
        label: "Warm",
        description: "Paper-like tones with serif typography."
    },
    {
        value: "linear",
        label: "Modern",
        description: "High contrast technical dark mode."
    }
]
