import { useState } from 'react';
import { User, Lock, Mail, Phone, LogOut, CheckCircle2 } from 'lucide-react';

export default function AuthPage({ currentUser, onLogin, onLogout, onBackToShop }) {
    const [mode, setMode] = useState('login'); // 'login' or 'register'
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        const profile = {
            name: mode === 'register' ? name : email.split('@')[0] || 'Customer',
            email,
            phone: phone || '07830 141250',
            joined: new Date().toLocaleDateString('en-GB'),
        };
        onLogin(profile);
    };

    if (currentUser) {
        return (
            <div className="max-w-xl mx-auto px-4 py-16">
                <div className="bg-white rounded-3xl p-8 border border-stone-200 shadow-lg text-center space-y-5">
                    <div className="w-16 h-16 rounded-full bg-[#FAF8F5] border border-stone-200 text-[#9A7B56] flex items-center justify-center mx-auto">
                        <User className="w-8 h-8" />
                    </div>
                    <div>
                        <span className="text-xs font-bold uppercase tracking-widest text-[#9A7B56]">
                            SJ Home Interiors Member
                        </span>
                        <h1 className="font-serif text-3xl font-bold mt-1">
                            Welcome, {currentUser.name}
                        </h1>
                        <p className="text-xs text-stone-500 mt-1">{currentUser.email}</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-stone-200 text-left text-xs space-y-2">
                        <div className="flex justify-between">
                            <span className="text-stone-500">Account Status:</span>
                            <span className="font-semibold text-emerald-700 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Active Customer
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-stone-500">Saved Contact:</span>
                            <span className="font-semibold">{currentUser.phone}</span>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={onBackToShop}
                            className="flex-1 py-3.5 rounded-full bg-[#1C1B18] text-white text-xs font-semibold cursor-pointer"
                        >
                            Browse Catalog
                        </button>
                        <button
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
                <div className="grid grid-cols-2 p-1 rounded-full bg-[#FAF8F5] border border-stone-200 mb-6">
                    <button
                        type="button"
                        onClick={() => setMode('login')}
                        className={`py-2.5 rounded-full text-xs font-semibold transition cursor-pointer ${mode === 'login' ? 'bg-[#1C1B18] text-white' : 'text-stone-600'
                            }`}
                    >
                        Sign In
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('register')}
                        className={`py-2.5 rounded-full text-xs font-semibold transition cursor-pointer ${mode === 'register' ? 'bg-[#1C1B18] text-white' : 'text-stone-600'
                            }`}
                    >
                        Create Account
                    </button>
                </div>

                <h1 className="font-serif text-3xl font-bold text-center mb-2">
                    {mode === 'login' ? 'Welcome Back' : 'Create Your Account'}
                </h1>
                <p className="text-xs text-stone-500 text-center mb-6">
                    {mode === 'login'
                        ? 'Sign in to manage your basket, delivery preferences, and orders.'
                        : 'Register for faster checkout and Maltby showroom updates.'}
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === 'register' && (
                        <div>
                            <label className="block text-xs font-semibold text-stone-700 mb-1">
                                Full Name *
                            </label>
                            <div className="relative">
                                <input
                                    required
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Your full name"
                                    className="w-full pl-9 pr-4 py-3 rounded-xl border border-stone-200 text-xs"
                                />
                                <User className="w-4 h-4 text-stone-400 absolute left-3 top-3.5" />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">
                            Email Address *
                        </label>
                        <div className="relative">
                            <input
                                required
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.co.uk"
                                className="w-full pl-9 pr-4 py-3 rounded-xl border border-stone-200 text-xs"
                            />
                            <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3.5" />
                        </div>
                    </div>

                    {mode === 'register' && (
                        <div>
                            <label className="block text-xs font-semibold text-stone-700 mb-1">
                                Mobile Number
                            </label>
                            <div className="relative">
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="07830 141250"
                                    className="w-full pl-9 pr-4 py-3 rounded-xl border border-stone-200 text-xs"
                                />
                                <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-3.5" />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">
                            Password *
                        </label>
                        <div className="relative">
                            <input
                                required
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full pl-9 pr-4 py-3 rounded-xl border border-stone-200 text-xs"
                            />
                            <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3.5" />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full py-4 rounded-full bg-[#9A7B56] hover:bg-[#7D6242] text-white text-xs font-semibold uppercase tracking-wider transition cursor-pointer mt-2"
                    >
                        {mode === 'login' ? 'Sign In to Account' : 'Create Account'}
                    </button>
                </form>
            </div>
        </div>
    );
}