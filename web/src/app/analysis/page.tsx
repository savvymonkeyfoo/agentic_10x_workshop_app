import { redirect } from 'next/navigation';

// This is a legacy route - redirect to home page
// The actual analysis page is at /workshop/[id]/analysis
export default function LegacyAnalysisPage() {
    redirect('/');
}
