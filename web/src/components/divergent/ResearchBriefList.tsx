import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from 'react-markdown';

interface ResearchBriefListProps {
    briefs: string[];
}

function CopyButton({ content }: { content: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 bg-white/50 hover:bg-white text-slate-400 hover:text-indigo-600 transition-all ml-2"
            onClick={handleCopy}
        >
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
        </Button>
    );
}

export function ResearchBriefList({ briefs }: ResearchBriefListProps) {
    if (!briefs?.length) return null;

    return (
        <div className="flex flex-col gap-6 w-full h-full overflow-y-auto pr-2">
            {briefs.map((brief, index) => (
                <div
                    key={index}
                    className="relative bg-white border border-slate-200 rounded-xl shadow-sm p-8 hover:shadow-md transition-all group"
                >
                    {/* Header Actions */}
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <CopyButton content={brief} />
                    </div>

                    {/* Markdown Content */}
                    <article className="prose prose-slate max-w-none prose-headings:font-bold prose-h2:text-lg prose-h3:text-base prose-p:text-slate-600 prose-li:text-slate-600">
                        <ReactMarkdown>{brief}</ReactMarkdown>
                    </article>
                </div>
            ))}
        </div>
    );
}
