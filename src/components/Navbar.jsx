import { useState } from 'react';
import { Search, ShoppingBag, User, ShieldAlert, MapPin, Menu, X } from 'lucide-react';
import Logo from './Logo';

export default function Navbar({
    currentPage,
    onNavigate,
    searchQuery,
    setSearchQuery,
    onSelectCategory,
    cartCount,
    onOpenCart,
    onOpenStockManager,
    currentUser,
    availableCategories = [],
}) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const isAdmin = currentUser?.role === 'admin';

    const handleCategoryNav = (cat) => {
        setMobileMenuOpen(false);
        onNavigate('home');
        onSelectCategory(cat);
        setTimeout(() => {
            document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
        }, 50);
    };

    const handleSearch = (value) => {
        setSearchQuery(value);
        if (currentPage !== 'home') onNavigate('home');
    };

    // Keep the desktop bar on one line; every category is still in the catalogue filters.
    const navCategories = ['All', ...availableCategories.slice(0, 6)];

    return (
        <header className="sticky top-0 z-40 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-stone-200/80">
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
                <div className="flex items-center gap-2 min-w-0">
                    <button
                        type="button"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label="Toggle navigation menu"
                        aria-expanded={mobileMenuOpen}
                        className="xl:hidden p-2.5 rounded-xl border border-stone-200 bg-white text-stone-700 hover:border-[#9A7B56] cursor-pointer"
                    >
                        {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setMobileMenuOpen(false);
                            onNavigate('home');
                        }}
                        aria-label="SJ Home Interiors home"
                        className="cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9A7B56] rounded-lg min-w-0"
                    >
                        <Logo variant="dark" />
                    </button>
                </div>

                <nav
                    aria-label="Main navigation"
                    className="hidden xl:flex items-center gap-x-5 text-xs font-semibold uppercase tracking-wider text-stone-700 whitespace-nowrap"
                >
                    {navCategories.map((cat) => (
                        <button
                            key={cat}
                            type="button"
                            onClick={() => handleCategoryNav(cat)}
                            className="cursor-pointer hover:text-[#9A7B56] transition"
                        >
                            {cat}
                        </button>
                    ))}
                    <button
                        type="button"
                        onClick={() => onNavigate('contact')}
                        className={`cursor-pointer hover:text-[#9A7B56] transition flex items-center gap-1 ${
                            currentPage === 'contact' ? 'text-[#9A7B56]' : ''
                        }`}
                    >
                        <MapPin className="w-3.5 h-3.5" aria-hidden="true" /> Showroom
                    </button>
                </nav>

                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    <div className="relative hidden md:block">
                        <label htmlFor="site-search" className="sr-only">
                            Search furniture
                        </label>
                        <input
                            id="site-search"
                            type="search"
                            maxLength={80}
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            placeholder="Search sofas, beds, tables…"
                            className="pl-9 pr-4 py-2.5 text-sm bg-white border border-stone-300 rounded-full focus:outline-none focus:border-[#9A7B56] focus:ring-2 focus:ring-[#9A7B56]/20 w-44 lg:w-56 transition"
                        />
                        <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" aria-hidden="true" />
                    </div>

                    {isAdmin && (
                        <button
                            type="button"
                            onClick={onOpenStockManager}
                            aria-label="Open admin dashboard"
                            className="h-10 rounded-full bg-amber-700 hover:bg-amber-800 text-white transition cursor-pointer flex items-center gap-1.5 px-3 text-xs font-semibold whitespace-nowrap"
                        >
                            <ShieldAlert className="w-4 h-4" aria-hidden="true" />
                            <span className="hidden sm:inline">Admin</span>
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={() => {
                            setMobileMenuOpen(false);
                            onNavigate('auth');
                        }}
                        aria-label={currentUser ? 'Your account' : 'Sign in or register'}
                        className={`h-10 rounded-full border transition cursor-pointer flex items-center gap-1.5 px-3 text-xs font-semibold whitespace-nowrap ${
                            currentPage === 'auth'
                                ? 'bg-[#9A7B56] text-white border-[#9A7B56]'
                                : 'bg-white border-stone-300 text-stone-700 hover:border-[#9A7B56]'
                        }`}
                    >
                        <User className="w-4 h-4" aria-hidden="true" />
                        <span className="hidden sm:inline max-w-[6rem] truncate">
                            {currentUser ? (currentUser.name || 'Account').split(' ')[0] : 'Sign in'}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={onOpenCart}
                        aria-label={`Open basket, ${cartCount} ${cartCount === 1 ? 'item' : 'items'}`}
                        className="h-10 rounded-full bg-[#1C1B18] text-white hover:bg-[#9A7B56] transition flex items-center gap-2 px-3.5 cursor-pointer whitespace-nowrap"
                    >
                        <ShoppingBag className="w-4 h-4" aria-hidden="true" />
                        <span className="hidden lg:inline text-xs font-semibold">Basket</span>
                        <span className="text-xs font-bold bg-white/20 rounded-full min-w-5 h-5 px-1.5 flex items-center justify-center">
                            {cartCount}
                        </span>
                    </button>
                </div>
            </div>

            {mobileMenuOpen && (
                <div className="xl:hidden bg-white border-b border-stone-200 px-4 pt-3 pb-5 space-y-4 shadow-lg">
                    <div className="relative md:hidden">
                        <input
                            type="search"
                            maxLength={80}
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            aria-label="Search furniture"
                            placeholder="Search sofas, beds, tables…"
                            className="w-full pl-10 pr-4 py-3 text-base bg-[#FAF8F5] border border-stone-300 rounded-full focus:outline-none focus:border-[#9A7B56]"
                        />
                        <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-4" aria-hidden="true" />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm font-semibold">
                        <button
                            type="button"
                            onClick={() => handleCategoryNav('All')}
                            className="p-3 rounded-xl bg-[#FAF8F5] hover:bg-[#1C1B18] hover:text-white text-left transition cursor-pointer"
                        >
                            All collections
                        </button>
                        {availableCategories.map((cat) => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => handleCategoryNav(cat)}
                                className="p-3 rounded-xl bg-[#FAF8F5] hover:bg-[#1C1B18] hover:text-white text-left transition cursor-pointer"
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            setMobileMenuOpen(false);
                            onNavigate('contact');
                        }}
                        className="pt-3 border-t border-stone-100 w-full text-left text-sm font-semibold text-[#7D6242] flex items-center gap-1.5 cursor-pointer"
                    >
                        <MapPin className="w-4 h-4" aria-hidden="true" /> Visit our High Street, Maltby
                        showroom
                    </button>
                </div>
            )}
        </header>
    );
}
