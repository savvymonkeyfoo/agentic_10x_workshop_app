import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <h2 className="text-4xl font-bold text-brand-navy dark:text-white mb-4">
                404
            </h2>
            <h3 className="text-xl font-semibold text-primary dark:text-foreground mb-6">
                Page Not Found
            </h3>
            <p className="text-secondary dark:text-tertiary mb-8 max-w-md">
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
