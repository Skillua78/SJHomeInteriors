import { useState } from 'react';
import { User, Lock, Mail, Phone, LogOut, CheckCircle2, ShieldAlert, AlertCircle } from 'lucide-react';
import { sanitizeText, sha256Hex, validatePasswordStrength } from '../utils/security';

export default function AuthPage({
    currentUser,
    onLogin,
    onLogout,
    onBackToShop,
    onOpenAdmin,
}) {
    const [mode, setMode] = useState('login'); // 'login' | 'register' | 'admin-setup'
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    // Read optional environment config (from .env.local) or locally initialized admin hash
    const envAdminEmail = (import.meta.env.VITE_ADMIN_EMAIL || '').toLowerCase().trim();
    const envAdminHash = (import.meta.env.VITE_ADMIN_PASSWORD_HASH || '').toLowerCase().trim();
    const storedAdminConfig = JSON.parse(localStorage.getItem('sj_admin_auth_meta') || 'null');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const cleanEmail = sanitizeText(email, 100).toLowerCase();
        const cleanName = sanitizeText(name, 60);
        const cleanPhone = sanitizeText(phone, 30);

        if (mode === 'register') {
            const pwError = validatePasswordStrength(password);
            if (pwError) {
                setError(pwError);
                return;
            }
        }

        const inputHash = await sha256Hex(password);

        // Check if Admin Setup mode is being initialized locally
        if (mode === 'admin-setup') {
            const pwError = validatePasswordStrength(password);
            if (pwError) {
                setError(pwError);
                return;
            }
            const adminMeta = { email: cleanEmail, passwordHash: inputHash };
            localStorage.setItem('sj_admin_auth_meta', JSON.stringify(adminMeta));
            onLogin({
                name: cleanName || 'Showroom Admin',
                email: cleanEmail,
                phone: cleanPhone,
                role: 'admin',
                joined: new Date().toLocaleDateString('en-GB'),
            });
            return;
        }

        // Verify Admin Credentials (against .env.local or initialized local admin hash)
        const targetAdminEmail = envAdminEmail || storedAdminConfig?.email;
        const targetAdminHash = envAdminHash || storedAdminConfig?.passwordHash;

        if (targetAdminEmail && cleanEmail === targetAdminEmail) {
            if (targetAdminHash && inputHash === targetAdminHash) {
                onLogin({
                    name: 'Showroom Admin',
                    email: cleanEmail,
                    phone: cleanPhone || '07830 141250',
                    role: 'admin',
                    joined: new Date().toLocaleDateString('en-GB'),
                });
                return;
            } else {
                setError('Invalid administrator password.');
                return;
            }
        }

        // Standard Customer Account Session
        onLogin({
            name: mode === 'register' ? cleanName : cleanEmail.split('@')[0] || 'Customer',
            email: cleanEmail,
            phone: cleanPhone,
            role: 'customer',
            joined: new Date().toLocaleDateString('en-GB'),
        });
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
                            {isAdmin ? 'Administrator Account' : 'SJ Home Interiors Customer'}
                        </span>
                        <h1 className="font-serif text-3xl font-bold mt-1">
                            Welcome, {currentUser.name}
                        </h1>
                        <p className="text-xs text-stone-500 mt-1">{currentUser.email}</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-stone-200 text-left text-xs space-y-2">
                        <div className="flex justify-between">
                            <span className="text-stone-500">Access Role:</span>
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
                                className="flex-1 py-3.5 rounded-full bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold cursor-pointer"
                            >
                                Open Admin Dashboard
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onBackToShop}
                            className="flex-1 py-3.5 rounded-full bg-[#1C1B18] text-white text-xs font-semibold cursor-pointer"
                        >
                            Browse Catalog
                        </button>
                        <button
                            type="button"
                            onClick={onLogout}
                            className="px-6 py-3.5 rounded-full border border-stone-200 text-xs font-semibold text-red-700 hover:bg-red-50 inline-flex items-center gap-1.5 cursor-pointer"
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
                {/* Mode Switcher */}
                <div className="grid grid-cols-3 p-1 rounded-full bg-[#FAF8F5] border border-stone-200 mb-6">
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
                    <button
                        type="button"
                        onClick={() => { setMode('admin-setup'); setError(''); }}
                        className={`py-2 rounded-full text-xs font-semibold transition cursor-pointer ${mode === 'admin-setup' ? 'bg-amber-700 text-white' : 'text-stone-600'
                            }`}
                    >
                        Admin Setup
                    </button>
                </div>

                <h1 className="font-serif text-3xl font-bold text-center mb-2">
                    {mode === 'login'
                        ? 'Sign In'
                        : mode === 'register'
                            ? 'Create Customer Account'
                            : 'Configure Admin Account'}
                </h1>
                <p className="text-xs text-stone-500 text-center mb-6">
                    {mode === 'admin-setup'
                        ? 'Set your local administrator email and password (stored as a SHA-256 digest) to unlock the Stock & Review Moderation Dashboard.'
                        : 'Manage your basket and delivery preferences.'}
                </p>

                {error && (
                    <div role="alert" className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {(mode === 'register' || mode === 'admin-setup') && (
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
                                    placeholder="Your full name"
                                    className="w-full pl-9 pr-4 py-3 rounded-xl border border-stone-200 text-xs"
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
                                className="w-full pl-9 pr-4 py-3 rounded-xl border border-stone-200 text-xs"
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
                                    className="w-full pl-9 pr-4 py-3 rounded-xl border border-stone-200 text-xs"
                                />
                                <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-3.5" aria-hidden="true" />
                            </div>
                        </div>
                    )}

                    <div>
                        <label htmlFor="auth-password" className="block text-xs font-semibold text-stone-700 mb-1">
                            Password * {(mode === 'register' || mode === 'admin-setup') && '(Min 10 chars, upper, lower & number)'}
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
                                className="w-full pl-9 pr-4 py-3 rounded-xl border border-stone-200 text-xs"
                            />
                            <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3.5" aria-hidden="true" />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full py-4 rounded-full bg-[#9A7B56] hover:bg-[#7D6242] text-white text-xs font-semibold uppercase tracking-wider transition cursor-pointer mt-2"
                    >
                        {mode === 'login'
                            ? 'Sign In'
                            : mode === 'register'
                                ? 'Create Account'
                                : 'Save Admin Credentials & Sign In'}
                    </button>
                </form>
            </div>
        </div>
    );
}