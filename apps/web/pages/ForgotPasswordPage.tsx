import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { client } from '@/src/api/client';
import { toast } from 'react-hot-toast';

type Step = 'request' | 'reset';

export const ForgotPasswordPage: React.FC = () => {
    const [step, setStep] = useState<Step>('request');
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const navigate = useNavigate();

    const handleRequestCode = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;
        setIsSubmitting(true);
        try {
            await client.post('/auth/forgot-password', { email });
            toast.success('Nếu email tồn tại, mã đặt lại mật khẩu đã được gửi.');
            setStep('reset');
        } catch (error: any) {
            console.error('Forgot password request failed', error);
            toast.error(error?.response?.data?.message || 'Không thể gửi mã. Vui lòng thử lại.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code.trim() || code.length !== 6 || !newPassword.trim()) {
            return;
        }
        setIsSubmitting(true);
        try {
            await client.post('/auth/reset-password', {
                email,
                code,
                newPassword,
            });
            toast.success('Đặt lại mật khẩu thành công! Bạn có thể đăng nhập.');
            navigate('/login');
        } catch (error: any) {
            console.error('Reset password failed', error);
            toast.error(error?.response?.data?.message || 'OTP không hợp lệ hoặc đã hết hạn.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.25),_transparent_45%),_radial-gradient(circle_at_bottom,_rgba(248,113,113,0.25),_transparent_40%)] blur-3xl opacity-50" />
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
                                Quên mật khẩu
                            </h1>
                            <p className="text-base text-slate-300 sm:text-lg">
                                {step === 'request'
                                    ? 'Nhập email để nhận mã đặt lại mật khẩu.'
                                    : 'Nhập mã OTP và mật khẩu mới để hoàn tất.'}
                            </p>
                        </div>
                    </div>

                    <div className="relative flex flex-col rounded-3xl border border-white/10 bg-slate-900/85 p-8 shadow-lg shadow-black/30">
                        {step === 'request' ? (
                            <>
                                <div className="mb-8 space-y-2 text-center">
                                    <h2 className="text-3xl font-bold tracking-tight text-white">Quên mật khẩu</h2>
                                    <p className="text-sm text-slate-400">
                                        Chúng tôi sẽ gửi mã OTP 6 chữ số đến email của bạn.
                                    </p>
                                </div>
                                <form onSubmit={handleRequestCode} className="space-y-5">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-200">Email</label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-white outline-none transition focus:border-[#4ADE80] focus:ring-2 focus:ring-[#4ADE80]/30"
                                            placeholder="you@example.com"
                                            required
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full rounded-2xl bg-gradient-to-r from-[#4ADE80] via-[#22c55e] to-[#16a34a] py-3 text-base font-semibold text-slate-900 shadow-lg shadow-emerald-500/40 transition hover:opacity-95 disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? 'Đang gửi...' : 'Gửi mã đặt lại mật khẩu'}
                                    </button>
                                </form>
                                <div className="mt-8 text-center text-sm text-slate-400">
                                    Nhớ mật khẩu rồi?{' '}
                                    <Link to="/login" className="font-semibold text-[#FF6B9D] hover:text-white">
                                        Đăng nhập
                                    </Link>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="mb-8 space-y-2 text-center">
                                    <h2 className="text-3xl font-bold tracking-tight text-white">Đặt lại mật khẩu</h2>
                                    <p className="text-sm text-slate-400">
                                        Mã OTP đã gửi tới{' '}
                                        <span className="font-semibold text-[#4ADE80]">{email}</span>
                                    </p>
                                </div>
                                <form onSubmit={handleResetPassword} className="space-y-5">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-200">Mã OTP</label>
                                        <input
                                            type="text"
                                            value={code}
                                            onChange={(e) =>
                                                setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                                            }
                                            className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-center text-2xl font-bold tracking-widest text-white outline-none transition focus:border-[#4ADE80] focus:ring-2 focus:ring-[#4ADE80]/30"
                                            placeholder="000000"
                                            maxLength={6}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-200">Mật khẩu mới</label>
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-white outline-none transition focus:border-[#4ADE80] focus:ring-2 focus:ring-[#4ADE80]/30"
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || code.length !== 6}
                                        className="w-full rounded-2xl bg-gradient-to-r from-[#4ADE80] via-[#22c55e] to-[#16a34a] py-3 text-base font-semibold text-slate-900 shadow-lg shadow-emerald-500/40 transition hover:opacity-95 disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? 'Đang xử lý...' : 'Xác nhận đặt lại mật khẩu'}
                                    </button>
                                </form>
                                <div className="mt-8 text-center text-sm text-slate-400">
                                    Không nhận được mã?{' '}
                                    <button
                                        type="button"
                                        disabled={isSubmitting}
                                        onClick={handleRequestCode}
                                        className="font-semibold text-[#4ADE80] hover:text-white disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        Gửi lại mã
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



