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
        value: "nexus",
        label: "Nexus",
        description: "Swiss Modernism. Clean, neutral, and precise.",
        color: "bg-[#10A37F]"
    },
    {
        value: "aether",
        label: "Aether",
        description: "Fluid Spatiality. Glass, gradients, and flow.",
        color: "bg-gradient-to-br from-indigo-500 to-purple-500"
    },
    {
        value: "linear",
        label: "Modern",
        description: "Linear High-Contrast",
        color: "bg-[#5E6AD2]"
    }
]
