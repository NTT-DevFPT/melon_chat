import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await login({ username, password });
            navigate('/');
        } catch (error) {
            // handled by context toast
        }
    };

    return (
        <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,107,157,0.28),_transparent_45%),_radial-gradient(circle_at_bottom,_rgba(74,222,128,0.2),_transparent_40%)] blur-3xl opacity-50" />
            <div className="watermelon-seeds">
                {[...Array(15)].map((_, i) => (
                    <div key={i} className="seed" />
                ))}
            </div>
            <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-12">
                <div className="grid w-full max-w-6xl gap-12 rounded-3xl border border-white/5 bg-white/5 p-8 backdrop-blur-3xl shadow-[0_20px_120px_rgba(15,23,42,0.7)] lg:grid-cols-[1.15fr_0.85fr]">
                    <div className="flex flex-col justify-center space-y-8">
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/70">
                            <span className="text-sm">🍉</span> MELON.CHAT
                        </div>
                        <div className="space-y-6">
                            <h1 className="text-4xl font-black leading-tight text-white sm:text-5xl">
                                Welcome back
                            </h1>
                            <p className="text-base text-slate-300 sm:text-lg">
                                Sign in to continue the conversation.
                            </p>
                        </div>
                    </div>

                    <div className="relative flex flex-col rounded-3xl border border-white/10 bg-slate-900/80 p-8 shadow-lg shadow-black/30">
                        <div className="mb-8 space-y-2 text-center">
                            <h2 className="text-3xl font-bold tracking-tight text-white">Welcome back</h2>
                            <p className="text-sm text-slate-400">Sign in to continue the conversation.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-200">Username</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-white outline-none transition focus:border-[#FF6B9D] focus:ring-2 focus:ring-[#FF6B9D]/30"
                                    placeholder="Enter your username"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-200">Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-white outline-none transition focus:border-[#FF6B9D] focus:ring-2 focus:ring-[#FF6B9D]/30"
                                    placeholder="Enter your password"
                                    required
                                />
                            </div>

                            <div className="flex items-center justify-between text-xs text-slate-400">
                                <label className="flex items-center gap-2">
                                    <input type="checkbox" className="rounded border-slate-600 bg-transparent text-[#FF6B9D] focus:ring-[#FF6B9D]" />
                                    Remember me
                                </label>
                                <button type="button" className="text-[#FF6B9D] hover:text-white transition-colors">Forgot password?</button>
                            </div>

                            <button
                                type="submit"
                                className="w-full rounded-2xl bg-gradient-to-r from-[#FF6B9D] via-[#FF8E53] to-[#FF6B9D] py-3 text-base font-semibold text-white shadow-lg shadow-[#FF6B9D]/40 transition hover:opacity-95"
                            >
                                Login to dashboard
                            </button>
                        </form>

                        <div className="mt-8 text-center text-sm text-slate-400">
                            Don't have an account?{' '}
                            <Link to="/register" className="font-semibold text-[#4ADE80] hover:text-white">
                                Register here
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
