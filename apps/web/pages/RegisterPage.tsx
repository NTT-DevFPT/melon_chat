import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const highlights = [
    { title: 'Zero-setup groups', detail: 'Spin up focused rooms in one tap.' },
    { title: 'Status presence', detail: 'See who is vibing, busy or on mobile.' },
    { title: 'Media-ready', detail: 'Drop photos, files + voice notes easily.' }
];

export const RegisterPage: React.FC = () => {
    const [formData, setFormData] = useState({
        fullName: '',
        username: '',
        email: '',
        password: ''
    });
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await register(formData);
            navigate('/login');
        } catch (error) {
            // handled upstream
        }
    };

    return (
        <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(74,222,128,0.2),_transparent_45%),_radial-gradient(circle_at_bottom,_rgba(59,130,246,0.25),_transparent_40%)] blur-3xl opacity-50" />
            <div className="watermelon-seeds">
                {[...Array(15)].map((_, i) => (
                    <div key={i} className="seed" />
                ))}
            </div>
            <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-12">
                <div className="grid w-full max-w-6xl gap-12 rounded-3xl border border-white/5 bg-white/5 p-8 backdrop-blur-3xl shadow-[0_20px_120px_rgba(15,23,42,0.7)] lg:grid-cols-[0.9fr_1.1fr]">
                    <div className="space-y-8">
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/70">
                            <span className="text-sm">✨</span> brand new
                        </div>
                        <div className="space-y-5">
                            <h1 className="text-4xl font-black leading-tight text-white sm:text-5xl">
                                Create a vibrant space for your team chats.
                            </h1>
                            <p className="text-base text-slate-300 sm:text-lg">
                                Craft a playful profile, invite teammates and collaborate through DMs, groups
                                and live calling—all wrapped with our watermelon aesthetic.
                            </p>
                        </div>
                        <ul className="grid gap-4">
                            {highlights.map(item => (
                                <li key={item.title} className="flex items-start gap-4 rounded-2xl border border-white/10 bg-black/20 p-4 shadow-inner shadow-black/40">
                                    <span className="mt-1 text-emerald-300">●</span>
                                    <div>
                                        <p className="font-semibold">{item.title}</p>
                                        <p className="text-sm text-slate-300">{item.detail}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                        <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-[#4ADE80]/30 via-[#2DD4BF]/30 to-[#0EA5E9]/30 p-6 text-slate-50 shadow-lg shadow-emerald-600/30">
                            <p className="text-sm uppercase tracking-[0.3em] text-white/60">Beta highlight</p>
                            <p className="mt-3 text-2xl font-semibold">
                                Unlock AI-powered summaries for long conversations right after you join.
                            </p>
                        </div>
                    </div>

                    <div className="relative flex flex-col rounded-3xl border border-white/10 bg-slate-900/85 p-8 shadow-lg shadow-black/30">
                        <div className="mb-8 space-y-2 text-center">
                            <h2 className="text-3xl font-bold tracking-tight text-white">Create your account</h2>
                            <p className="text-sm text-slate-400">It only takes a minute to personalize your Melon avatar.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-200">Full name</label>
                                <input
                                    type="text"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-white outline-none transition focus:border-[#4ADE80] focus:ring-2 focus:ring-[#4ADE80]/30"
                                    placeholder="Nguyen Van A"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-200">Username</label>
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-white outline-none transition focus:border-[#4ADE80] focus:ring-2 focus:ring-[#4ADE80]/30"
                                    placeholder="melonkid"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-200">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-white outline-none transition focus:border-[#4ADE80] focus:ring-2 focus:ring-[#4ADE80]/30"
                                    placeholder="hello@melon.chat"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-200">Password</label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-white outline-none transition focus:border-[#4ADE80] focus:ring-2 focus:ring-[#4ADE80]/30"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full rounded-2xl bg-gradient-to-r from-[#4ADE80] via-[#2DD4BF] to-[#0EA5E9] py-3 text-base font-semibold text-slate-900 shadow-lg shadow-emerald-500/40 transition hover:opacity-95"
                            >
                                Create account
                            </button>
                        </form>

                        <div className="mt-8 text-center text-sm text-slate-400">
                            Already have an account?{' '}
                            <Link to="/login" className="font-semibold text-[#FF6B9D] hover:text-white">
                                Login here
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
