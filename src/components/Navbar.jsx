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
    notificationCount = 0,
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

    const navCategories = ['All', ...availableCategories];

    return (
        <header className="sticky top-0 z-40 bg-cream/95 backdrop-blur-md border-b border-stone-200/80">
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-[4.5rem] flex items-center justify-between gap-3 sm:gap-6">
                <div className="flex items-center gap-2 min-w-0 flex-1 lg:flex-none">
                    <button
                        type="button"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label="Toggle navigation menu"
                        aria-expanded={mobileMenuOpen}
                        className="lg:hidden shrink-0 w-11 h-11 flex items-center justify-center rounded-xl border border-stone-200 bg-white text-ink hover:border-bronze transition"
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
                        className="cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-bronze rounded-lg min-w-0"
                    >
                        <Logo variant="dark" />
                    </button>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    <div className="relative hidden md:block lg:w-80 xl:w-96">
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
                            className="pl-9 pr-4 py-2.5 text-sm bg-white border border-stone-300 rounded-full focus:outline-none focus:border-bronze focus:ring-2 focus:ring-bronze/20 w-48 lg:w-full transition"
                        />
                        <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" aria-hidden="true" />
                    </div>

                    {isAdmin && (
                        <button
                            type="button"
                            onClick={onOpenStockManager}
                            aria-label={
                                notificationCount > 0
                                    ? `Open admin dashboard, ${notificationCount} new notifications`
                                    : 'Open admin dashboard'
                            }
                            className="press relative h-11 rounded-full bg-amber-700 hover:bg-amber-800 text-white transition cursor-pointer flex items-center gap-1.5 px-3 text-xs font-semibold whitespace-nowrap"
                        >
                            <ShieldAlert className="w-4 h-4" aria-hidden="true" />
                            <span className="hidden sm:inline">Admin</span>
                            {notificationCount > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-red-600 text-white text-[11px] font-bold flex items-center justify-center ring-2 ring-cream">
                                    {notificationCount > 99 ? '99+' : notificationCount}
                                </span>
                            )}
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={() => {
                            setMobileMenuOpen(false);
                            onNavigate('auth');
                        }}
                        aria-label={currentUser ? 'Your account' : 'Sign in or register'}
                        className={`press h-11 min-w-11 justify-center rounded-full border transition cursor-pointer flex items-center gap-1.5 px-3 text-xs font-semibold whitespace-nowrap ${
                            currentPage === 'auth'
                                ? 'bg-bronze-strong text-white border-bronze'
                                : 'bg-white border-stone-300 text-stone-700 hover:border-bronze'
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
                        className="press h-11 min-w-11 justify-center rounded-full bg-ink text-white hover:bg-bronze-strong transition flex items-center gap-2 px-3.5 cursor-pointer whitespace-nowrap"
                    >
                        <ShoppingBag className="w-4 h-4" aria-hidden="true" />
                        <span className="hidden lg:inline text-xs font-semibold">Basket</span>
                        <span className="text-xs font-bold bg-white/20 rounded-full min-w-5 h-5 px-1.5 flex items-center justify-center">
                            {cartCount}
                        </span>
                    </button>
                </div>
            </div>

            {/* Desktop category bar: its own row, scrolls sideways if there are many departments */}
            <nav
                aria-label="Main navigation"
                className="hidden lg:block border-t border-stone-200/70 bg-white/60"
            >
                <div className="max-w-7xl mx-auto px-8 h-11 flex items-center gap-x-7 overflow-x-auto text-xs font-semibold uppercase tracking-wider text-stone-700 whitespace-nowrap">
                    {navCategories.map((cat) => (
                        <button
                            key={cat}
                            type="button"
                            onClick={() => handleCategoryNav(cat)}
                            className="h-11 flex items-center hover:text-bronze-deep transition-colors shrink-0"
                        >
                            {cat === 'All' ? 'All furniture' : cat}
                        </button>
                    ))}
                    <button
                        type="button"
                        onClick={() => onNavigate('contact')}
                        className={`h-11 hover:text-bronze-deep transition-colors flex items-center gap-1 shrink-0 ml-auto ${
                            currentPage === 'contact' ? 'text-bronze-deep' : ''
                        }`}
                    >
                        <MapPin className="w-3.5 h-3.5" aria-hidden="true" /> Visit our showroom
                    </button>
                </div>
            </nav>

            {mobileMenuOpen && (
                <div className="lg:hidden bg-white border-b border-stone-200 px-4 pt-3 pb-5 space-y-4 shadow-lg">
                    <div className="relative md:hidden">
                        <input
                            type="search"
                            maxLength={80}
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            aria-label="Search furniture"
                            placeholder="Search sofas, beds, tables…"
                            className="w-full pl-10 pr-4 py-3 text-base bg-cream border border-stone-300 rounded-full focus:outline-none focus:border-bronze"
                        />
                        <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-4" aria-hidden="true" />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm font-semibold">
                        <button
                            type="button"
                            onClick={() => handleCategoryNav('All')}
                            className="p-3 rounded-xl bg-cream hover:bg-ink hover:text-white text-left transition cursor-pointer"
                        >
                            All collections
                        </button>
                        {availableCategories.map((cat) => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => handleCategoryNav(cat)}
                                className="p-3 rounded-xl bg-cream hover:bg-ink hover:text-white text-left transition cursor-pointer"
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
                        className="pt-3 border-t border-stone-100 w-full text-left text-sm font-semibold text-bronze-deep flex items-center gap-1.5 cursor-pointer"
                    >
                        <MapPin className="w-4 h-4" aria-hidden="true" /> Visit our High Street, Maltby
                        showroom
                    </button>
                </div>
            )}
        </header>
    );
}
