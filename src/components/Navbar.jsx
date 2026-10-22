import { useState } from 'react';
import {
    Search,
    ShoppingBag,
    User,
    ShieldAlert,
    MapPin,
    Menu,
    X,
} from 'lucide-react';
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

    return (
        <header className="sticky top-0 z-40 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-stone-200/80">
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
                {/* Left: Mobile Menu Button + Brand Logo */}
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label="Toggle navigation menu"
                        aria-expanded={mobileMenuOpen}
                        className="xl:hidden p-2 rounded-xl border border-stone-200 bg-white text-stone-700 hover:border-[#9A7B56] cursor-pointer"
                    >
                        {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setMobileMenuOpen(false);
                            onNavigate('home');
                        }}
                        aria-label="SJ Home Interiors Home"
                        className="cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-[#9A7B56] rounded-lg"
                    >
                        <Logo variant="dark" />
                    </button>
                </div>

                {/* Desktop Navigation Links */}
                <nav
                    aria-label="Main Navigation"
                    className="hidden xl:flex items-center space-x-5 text-xs font-semibold uppercase tracking-wider text-stone-700"
                >
                    {['All', 'Sofas', 'Beds', 'Tables', 'Chairs', 'Wardrobes', 'Cabinets'].map(
                        (cat) => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => handleCategoryNav(cat)}
                                className="cursor-pointer hover:text-[#9A7B56] transition"
                            >
                                {cat}
                            </button>
                        )
                    )}
                    <button
                        type="button"
                        onClick={() => onNavigate('contact')}
                        className={`cursor-pointer hover:text-[#9A7B56] transition flex items-center gap-1 ${currentPage === 'contact' ? 'text-[#9A7B56]' : ''
                            }`}
                    >
                        <MapPin className="w-3.5 h-3.5" aria-hidden="true" /> Maltby Shop
                    </button>
                </nav>

                {/* Right Controls: Search, Admin, Account & Basket */}
                <div className="flex items-center space-x-1.5 sm:space-x-2.5">
                    <div className="relative hidden md:block">
                        <label htmlFor="site-search" className="sr-only">
                            Search furniture catalog
                        </label>
                        <input
                            id="site-search"
                            type="search"
                            maxLength={80}
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                if (currentPage !== 'home') onNavigate('home');
                            }}
                            placeholder="Search sofas, wardrobes, tables..."
                            className="pl-9 pr-4 py-2 text-xs bg-white border border-stone-200 rounded-full focus:outline-none focus:border-[#9A7B56] w-40 lg:w-56 transition"
                        />
                        <Search
                            className="w-4 h-4 text-stone-400 absolute left-3 top-2.5"
                            aria-hidden="true"
                        />
                    </div>

                    {isAdmin && (
                        <button
                            type="button"
                            onClick={onOpenStockManager}
                            className="p-2.5 rounded-full bg-amber-700 hover:bg-amber-800 text-white transition cursor-pointer flex items-center gap-1.5 px-3 text-xs font-semibold shadow-xs"
                        >
                            <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" />
                            <span className="hidden sm:inline">Admin</span>
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={() => {
                            setMobileMenuOpen(false);
                            onNavigate('auth');
                        }}
                        className={`p-2.5 rounded-full border transition cursor-pointer flex items-center gap-1.5 px-3 text-xs font-semibold ${currentPage === 'auth'
                                ? 'bg-[#9A7B56] text-white border-[#9A7B56]'
                                : 'bg-white border-stone-200 text-stone-700 hover:border-[#9A7B56]'
                            }`}
                    >
                        <User className="w-3.5 h-3.5" aria-hidden="true" />
                        <span className="hidden sm:inline">
                            {currentUser
                                ? `${currentUser.name.split(' ')[0]}${isAdmin ? ' (Admin)' : ''}`
                                : 'Account'}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={onOpenCart}
                        aria-label={`Open shopping basket with ${cartCount} items`}
                        className="relative p-2.5 rounded-full bg-[#1C1B18] text-white hover:bg-[#9A7B56] transition flex items-center gap-1.5 px-3.5 cursor-pointer"
                    >
                        <ShoppingBag className="w-4 h-4" aria-hidden="true" />
                        <span className="text-xs font-semibold">{cartCount}</span>
                    </button>
                </div>
            </div>

            {/* Mobile & Tablet Slide-Down Navigation Menu */}
            {mobileMenuOpen && (
                <div className="xl:hidden bg-white border-b border-stone-200 px-4 pt-3 pb-5 space-y-4 shadow-lg">
                    {/* Mobile Search Input */}
                    <div className="relative md:hidden">
                        <input
                            type="search"
                            maxLength={80}
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                if (currentPage !== 'home') onNavigate('home');
                            }}
                            placeholder="Search sofas, beds, wardrobes, tables..."
                            className="w-full pl-9 pr-4 py-2.5 text-xs bg-[#FAF8F5] border border-stone-200 rounded-full focus:outline-none focus:border-[#9A7B56]"
                        />
                        <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                    </div>

                    {/* Mobile Category Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-semibold">
                        {[
                            { id: 'All', label: 'All Furniture' },
                            { id: 'Popular', label: '★ Popular' },
                            { id: 'Trending', label: '🔥 Trending' },
                            { id: 'Sofas', label: 'Sofas' },
                            { id: 'Beds', label: 'Beds & Mattresses' },
                            { id: 'Tables', label: 'Tables' },
                            { id: 'Chairs', label: 'Chairs' },
                            { id: 'Wardrobes', label: 'Wardrobes' },
                            { id: 'Cabinets', label: 'Cabinets & TV Units' },
                            { id: 'Outdoor', label: 'Outdoor' },
                        ].map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => handleCategoryNav(item.id)}
                                className="p-2.5 rounded-xl bg-[#FAF8F5] hover:bg-[#1C1B18] hover:text-white text-left transition cursor-pointer"
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>

                    <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                setMobileMenuOpen(false);
                                onNavigate('contact');
                            }}
                            className="text-xs font-semibold text-[#9A7B56] flex items-center gap-1 cursor-pointer"
                        >
                            <MapPin className="w-4 h-4" /> Visit High Street, Maltby Showroom &rarr;
                        </button>
                    </div>
                </div>
            )}
        </header>
    );
}