'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <h2 className="text-3xl font-bold text-brand-navy dark:text-white mb-4">
                Something went wrong!
            </h2>
            <p className="text-secondary dark:text-disabled mb-8 max-w-md">
                We apologize for the inconvenience. An unexpected error has occurred.
            </p>
            <div className="flex gap-4">
                <button
                    onClick={reset}
                    className="px-6 py-2 bg-brand-blue text-white font-bold rounded-xl hover:opacity-90 transition-opacity"
                >
                    Try again
                </button>
                <Link
                    href="/"
                    className="px-6 py-2 border border-border dark:border-border rounded-xl hover:bg-surface-hover dark:hover:bg-surface-hover transition-colors text-brand-navy dark:text-white"
                >
                    Go Home
                </Link>
            </div>
        </div>
    );
}
