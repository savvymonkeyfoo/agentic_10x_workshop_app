import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <h2 className="text-4xl font-bold text-brand-navy dark:text-white mb-4">
                404
            </h2>
            <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-6">
                Page Not Found
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md">
                The page you are looking for does not exist or has been moved.
            </p>
            <Link
                href="/"
                className="px-6 py-3 bg-brand-blue text-white font-bold rounded-xl hover:opacity-90 transition-opacity"
            >
                Return Home
            </Link>
        </div>
    );
}
