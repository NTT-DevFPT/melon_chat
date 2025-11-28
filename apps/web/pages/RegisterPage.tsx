import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { client } from '@/src/api/client';
import { toast } from 'react-hot-toast';

export const RegisterPage: React.FC = () => {
    const [formData, setFormData] = useState({
        fullName: '',
        username: '',
        email: '',
        password: ''
    });
    const [step, setStep] = useState<'register' | 'verify'>('register');
    const [otpCode, setOtpCode] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await register(formData);
            setStep('verify');
        } catch (error) {
            // handled upstream
        }
    };

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!otpCode.trim() || otpCode.length !== 6) {
            return;
        }
        setIsVerifying(true);
        try {
            await client.post('/auth/verify-email', {
                email: formData.email,
                code: otpCode
            });
            toast.success('Email verified successfully! You can now login.');
            navigate('/login');
        } catch (error: any) {
            console.error('OTP verification failed', error);
            toast.error(error.response?.data?.message || 'Invalid OTP code. Please try again.');
        } finally {
            setIsVerifying(false);
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
                <div className="grid w-full max-w-6xl gap-12 rounded-3xl border border-white/5 bg-white/5 p-8 backdrop-blur-3xl shadow-[0_20px_120px_rgba(15,23,42,0.7)] lg:grid-cols-[1.15fr_0.85fr]">
                    <div className="flex flex-col justify-center space-y-8">
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/70">
                            <span className="text-sm">🍉</span> MELON.CHAT
                        </div>
                        <div className="space-y-6">
                            <h1 className="text-4xl font-black leading-tight text-white sm:text-5xl">
                                Join Melon Chat
                            </h1>
                            <p className="text-base text-slate-300 sm:text-lg">
                                Create your account to start chatting with friends.
                            </p>
                        </div>
                    </div>

                    <div className="relative flex flex-col rounded-3xl border border-white/10 bg-slate-900/85 p-8 shadow-lg shadow-black/30">
                        {step === 'register' ? (
                            <>
                                <div className="mb-8 space-y-2 text-center">
                                    <h2 className="text-3xl font-bold tracking-tight text-white">Create your account</h2>
                                    <p className="text-sm text-slate-400">It only takes a minute to personalize your Melon avatar.</p>
                                </div>

                                <form onSubmit={handleRegister} className="space-y-5">
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
                            </>
                        ) : (
                            <>
                                <div className="mb-8 space-y-2 text-center">
                                    <h2 className="text-3xl font-bold tracking-tight text-white">Verify your email</h2>
                                    <p className="text-sm text-slate-400">
                                        We've sent a 6-digit code to <span className="font-semibold text-[#4ADE80]">{formData.email}</span>
                                    </p>
                                </div>

                                <form onSubmit={handleVerifyOTP} className="space-y-5">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-200">Enter OTP Code</label>
                                        <input
                                            type="text"
                                            value={otpCode}
                                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-center text-2xl font-bold tracking-widest text-white outline-none transition focus:border-[#4ADE80] focus:ring-2 focus:ring-[#4ADE80]/30"
                                            placeholder="000000"
                                            maxLength={6}
                                            required
                                            autoFocus
                                        />
                                        <p className="text-xs text-slate-400 text-center">
                                            Check your email for the verification code
                                        </p>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={otpCode.length !== 6 || isVerifying}
                                        className="w-full rounded-2xl bg-gradient-to-r from-[#4ADE80] via-[#2DD4BF] to-[#0EA5E9] py-3 text-base font-semibold text-slate-900 shadow-lg shadow-emerald-500/40 transition hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isVerifying ? 'Verifying...' : 'Verify & Continue'}
                                    </button>
                                </form>

                                <div className="mt-6 text-center text-sm text-slate-400">
                                    Didn't receive the code?{' '}
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            try {
                                                await register(formData);
                                                toast.success('Verification code resent!');
                                            } catch (error) {
                                                // handled upstream
                                            }
                                        }}
                                        className="font-semibold text-[#4ADE80] hover:text-white transition-colors"
                                    >
                                        Resend code
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
