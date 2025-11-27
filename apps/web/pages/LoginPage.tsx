import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

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
            // Error handled in AuthContext
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden">
            {/* Background Seeds */}
            <div className="watermelon-seeds">
                {[...Array(15)].map((_, i) => (
                    <div key={i} className="seed" />
                ))}
            </div>

            <div className="bg-slate-900/80 backdrop-blur-md p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-800 z-10">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B9D] to-[#4ADE80] mb-2">
                        Melon Chat 🍉
                    </h1>
                    <p className="text-slate-400">Welcome back! Please login to continue.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#FF6B9D] transition-all"
                            placeholder="Enter your username"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#FF6B9D] transition-all"
                            placeholder="Enter your password"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-[#FF6B9D] to-[#FF8E53] text-white font-bold py-3 rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-[#FF6B9D]/20"
                    >
                        Login
                    </button>
                </form>

                <div className="mt-6 text-center text-slate-400">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-[#4ADE80] hover:underline font-medium">
                        Register here
                    </Link>
                </div>
            </div>
        </div>
    );
};
