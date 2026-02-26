'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [warning, setWarning] = useState('');
    const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setWarning('');

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            if (res.ok) {
                router.push('/');
                router.refresh(); // Refresh to update middleware state
            } else {
                const data = await res.json();

                // Handle rate limiting (429)
                if (res.status === 429) {
                    setError(data.error || 'Too many login attempts');
                    if (data.details) {
                        setWarning(data.details);
                    }
                    setRemainingAttempts(0);
                }
                // Handle failed login (401)
                else if (res.status === 401) {
                    setError(data.error || 'Invalid credentials');
                    if (data.warning) {
                        setWarning(data.warning);
                    }
                    setRemainingAttempts(data.remainingAttempts ?? null);
                }
                // Handle other errors
                else {
                    setError(data.error || 'Login failed');
                }
            }
        } catch {
            setError('Connection failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-100">
            <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-sm border border-slate-700">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                        Workshop Access
                    </h1>
                    <p className="text-slate-400 text-sm mt-2">Enter credentials to continue</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Username"
                            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-600 mb-4"
                        />
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-600"
                        />
                    </div>

                    {/* Error message (red) */}
                    {error && (
                        <div className="text-red-400 text-sm text-center font-medium bg-red-900/20 py-3 px-4 rounded-lg border border-red-800/30">
                            {error}
                        </div>
                    )}

                    {/* Warning message (yellow/orange) */}
                    {warning && (
                        <div className="text-orange-400 text-sm text-center font-medium bg-orange-900/20 py-3 px-4 rounded-lg border border-orange-800/30">
                            ⚠️ {warning}
                        </div>
                    )}

                    {/* Remaining attempts indicator */}
                    {remainingAttempts !== null && remainingAttempts > 0 && remainingAttempts <= 2 && (
                        <div className="text-center text-xs text-slate-400">
                            {remainingAttempts} {remainingAttempts === 1 ? 'attempt' : 'attempts'} remaining
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-3 rounded-lg font-semibold text-white transition-all shadow-lg
                        ${loading
                                ? 'bg-slate-600 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-500 hover:shadow-blue-500/20'
                            }`}
                    >
                        {loading ? 'Verifying...' : 'Login'}
                    </button>
                </form>

                <div className="mt-8 text-center text-xs text-slate-600">
                    Agentic 10x Protocol
                </div>
            </div>
        </div>
    );
}
