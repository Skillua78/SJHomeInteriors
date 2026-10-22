import { useState, useEffect, useRef } from 'react';
import { User, Lock, Mail, Phone, LogOut, CheckCircle2, ShieldAlert, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../utils/api';

// Set your Google Cloud OAuth 2.0 Web Client ID here (or leave empty until generated)
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export default function AuthPage({
    currentUser,
    onLogin,
    onLogout,
    onBackToShop,
    onOpenAdmin,
}) {
    const [mode, setMode] = useState('login'); // 'login' | 'register'
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const googleBtnRef = useRef(null);

    // Initialize Google Identity Services button
    useEffect(() => {
        if (!currentUser && window.google && GOOGLE_CLIENT_ID && googleBtnRef.current) {
            try {
                window.google.accounts.id.initialize({
                    client_id: GOOGLE_CLIENT_ID,
                    callback: handleGoogleResponse,
                });
                window.google.accounts.id.renderButton(googleBtnRef.current, {
                    theme: 'outline',
                    size: 'large',
                    width: '100%',
                    shape: 'pill',
                    text: mode === 'login' ? 'signin_with' : 'signup_with',
                });
            } catch (err) {
                console.error('Google Identity error:', err);
            }
        }
    }, [mode, currentUser]);

    const handleGoogleResponse = async (response) => {
        setLoading(true);
        setError('');
        try {
            const data = await api.googleAuth(response.credential);
            if (data.error) {
                setError(data.error);
            } else if (data.user) {
                if (data.user.role === 'admin' && data.user.token) {
                    localStorage.setItem('sj_admin_api_key', data.user.token);
                }
                onLogin(data.user);
            }
        } catch {
            setError('Failed to complete Google Sign-In. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (mode === 'register') {
                const data = await api.register(name, email, phone, password);
                if (data.error) {
                    setError(data.error);
                } else if (data.user) {
                    onLogin(data.user);
                }
            } else {
                const data = await api.login(email, password);
                if (data.error) {
                    setError(data.error);
                } else if (data.user) {
                    if (data.user.role === 'admin' && data.user.token) {
                        localStorage.setItem('sj_admin_api_key', data.user.token);
                    }
                    onLogin(data.user);
                }
            }
        } catch {
            setError('Connection to authentication service failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (currentUser) {
        const isAdmin = currentUser.role === 'admin';
        return (
            <div className="max-w-xl mx-auto px-4 py-16">
                <div className="bg-white rounded-3xl p-8 border border-stone-200 shadow-lg text-center space-y-5">
                    <div className="w-16 h-16 rounded-full bg-[#FAF8F5] border border-stone-200 text-[#9A7B56] flex items-center justify-center mx-auto">
                        {isAdmin ? <ShieldAlert className="w-8 h-8 text-amber-700" /> : <User className="w-8 h-8" />}
                    </div>
                    <div>
                        <span className="text-xs font-bold uppercase tracking-widest text-[#9A7B56]">
                            {isAdmin ? 'Showroom Administration' : 'SJ Home Interiors Customer'}
                        </span>
                        <h1 className="font-serif text-3xl font-bold mt-1">
                            Welcome, {currentUser.name}
                        </h1>
                        <p className="text-xs text-stone-500 mt-1">{currentUser.email}</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-stone-200 text-left text-xs space-y-2">
                        <div className="flex justify-between">
                            <span className="text-stone-500">Account Type:</span>
                            <span className="font-semibold text-emerald-700 flex items-center gap-1 uppercase">
                                <CheckCircle2 className="w-3.5 h-3.5" /> {currentUser.role}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3 pt-2">
                        {isAdmin && (
                            <button
                                type="button"
                                onClick={onOpenAdmin}
                                className="flex-1 py-3.5 rounded-full bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold cursor-pointer shadow-sm transition"
                            >
                                Open Admin Dashboard
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onBackToShop}
                            className="flex-1 py-3.5 rounded-full bg-[#1C1B18] text-white text-xs font-semibold cursor-pointer transition hover:bg-stone-800"
                        >
                            Browse Catalog
                        </button>
                        <button
                            type="button"
                            onClick={onLogout}
                            className="px-6 py-3.5 rounded-full border border-stone-200 text-xs font-semibold text-red-700 hover:bg-red-50 inline-flex items-center gap-1.5 cursor-pointer transition"
                        >
                            <LogOut className="w-3.5 h-3.5" /> Sign Out
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto px-4 py-16">
            <div className="bg-white rounded-3xl p-8 border border-stone-200 shadow-xl">
                {/* Mode Switcher: Only Sign In and Register */}
                <div className="grid grid-cols-2 p-1 rounded-full bg-[#FAF8F5] border border-stone-200 mb-6">
                    <button
                        type="button"
                        onClick={() => { setMode('login'); setError(''); }}
                        className={`py-2 rounded-full text-xs font-semibold transition cursor-pointer ${mode === 'login' ? 'bg-[#1C1B18] text-white' : 'text-stone-600'
                            }`}
                    >
                        Sign In
                    </button>
                    <button
                        type="button"
                        onClick={() => { setMode('register'); setError(''); }}
                        className={`py-2 rounded-full text-xs font-semibold transition cursor-pointer ${mode === 'register' ? 'bg-[#1C1B18] text-white' : 'text-stone-600'
                            }`}
                    >
                        Register
                    </button>
                </div>

                <h1 className="font-serif text-3xl font-bold text-center mb-2">
                    {mode === 'login' ? 'Sign In to Your Account' : 'Create an Account'}
                </h1>
                <p className="text-xs text-stone-500 text-center mb-6">
                    {mode === 'login'
                        ? 'Sign in to access your saved orders and showroom services.'
                        : 'Register for faster checkout and Maltby order updates.'}
                </p>

                {error && (
                    <div role="alert" className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Google Identity Services Container */}
                {GOOGLE_CLIENT_ID ? (
                    <div className="mb-5">
                        <div ref={googleBtnRef} className="w-full flex justify-center" />
                        <div className="relative my-5">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-stone-200" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white px-2 text-stone-400 font-semibold">Or continue with email</span>
                            </div>
                        </div>
                    </div>
                ) : null}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === 'register' && (
                        <div>
                            <label htmlFor="auth-name" className="block text-xs font-semibold text-stone-700 mb-1">
                                Full Name *
                            </label>
                            <div className="relative">
                                <input
                                    id="auth-name"
                                    required
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. David Miller"
                                    className="w-full pl-9 pr-4 py-3 rounded-xl border border-stone-200 text-xs focus:outline-none focus:border-[#9A7B56]"
                                />
                                <User className="w-4 h-4 text-stone-400 absolute left-3 top-3.5" aria-hidden="true" />
                            </div>
                        </div>
                    )}

                    <div>
                        <label htmlFor="auth-email" className="block text-xs font-semibold text-stone-700 mb-1">
                            Email Address *
                        </label>
                        <div className="relative">
                            <input
                                id="auth-email"
                                required
                                type="email"
                                autoComplete="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.co.uk"
                                className="w-full pl-9 pr-4 py-3 rounded-xl border border-stone-200 text-xs focus:outline-none focus:border-[#9A7B56]"
                            />
                            <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3.5" aria-hidden="true" />
                        </div>
                    </div>

                    {mode === 'register' && (
                        <div>
                            <label htmlFor="auth-phone" className="block text-xs font-semibold text-stone-700 mb-1">
                                Mobile Number (Optional)
                            </label>
                            <div className="relative">
                                <input
                                    id="auth-phone"
                                    type="tel"
                                    autoComplete="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="07830 141250"
                                    className="w-full pl-9 pr-4 py-3 rounded-xl border border-stone-200 text-xs focus:outline-none focus:border-[#9A7B56]"
                                />
                                <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-3.5" aria-hidden="true" />
                            </div>
                        </div>
                    )}

                    <div>
                        <label htmlFor="auth-password" className="block text-xs font-semibold text-stone-700 mb-1">
                            Password * {mode === 'register' && '(Minimum 8 characters)'}
                        </label>
                        <div className="relative">
                            <input
                                id="auth-password"
                                required
                                type="password"
                                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••••"
                                className="w-full pl-9 pr-4 py-3 rounded-xl border border-stone-200 text-xs focus:outline-none focus:border-[#9A7B56]"
                            />
                            <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3.5" aria-hidden="true" />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 rounded-full bg-[#1C1B18] hover:bg-[#9A7B56] text-white text-xs font-semibold uppercase tracking-wider transition cursor-pointer mt-2 disabled:bg-stone-300 flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        {mode === 'login' ? 'Sign In' : 'Create Customer Account'}
                    </button>
                </form>
            </div>
        </div>
    );
}