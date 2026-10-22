import { Search, ShoppingBag, User, ShieldAlert, MapPin } from 'lucide-react';
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
    const isAdmin = currentUser?.role === 'admin';

    const handleCategoryNav = (cat) => {
        onNavigate('home');
        onSelectCategory(cat);
        setTimeout(() => {
            document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
        }, 50);
    };

    return (
        <header className="sticky top-0 z-40 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-stone-200/80">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
                {/* Brand Logo */}
                <button
                    type="button"
                    onClick={() => onNavigate('home')}
                    aria-label="SJ Home Interiors Home"
                    className="cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-[#9A7B56] rounded-lg"
                >
                    <Logo variant="dark" />
                </button>

                {/* Navigation Links */}
                <nav aria-label="Main Navigation" className="hidden xl:flex items-center space-x-5 text-xs font-semibold uppercase tracking-wider text-stone-700">
                    <button
                        type="button"
                        onClick={() => handleCategoryNav('All')}
                        className="cursor-pointer hover:text-[#9A7B56] transition"
                    >
                        All
                    </button>
                    <button
                        type="button"
                        onClick={() => handleCategoryNav('Sofas')}
                        className="cursor-pointer hover:text-[#9A7B56] transition"
                    >
                        Sofas
                    </button>
                    <button
                        type="button"
                        onClick={() => handleCategoryNav('Beds')}
                        className="cursor-pointer hover:text-[#9A7B56] transition"
                    >
                        Beds
                    </button>
                    <button
                        type="button"
                        onClick={() => handleCategoryNav('Tables')}
                        className="cursor-pointer hover:text-[#9A7B56] transition"
                    >
                        Tables
                    </button>
                    <button
                        type="button"
                        onClick={() => handleCategoryNav('Chairs')}
                        className="cursor-pointer hover:text-[#9A7B56] transition"
                    >
                        Chairs
                    </button>
                    <button
                        type="button"
                        onClick={() => handleCategoryNav('Wardrobes')}
                        className="cursor-pointer hover:text-[#9A7B56] transition"
                    >
                        Wardrobes
                    </button>
                    <button
                        type="button"
                        onClick={() => handleCategoryNav('Cabinets')}
                        className="cursor-pointer hover:text-[#9A7B56] transition"
                    >
                        Cabinets
                    </button>
                    <button
                        type="button"
                        onClick={() => onNavigate('contact')}
                        className={`cursor-pointer hover:text-[#9A7B56] transition flex items-center gap-1 ${currentPage === 'contact' ? 'text-[#9A7B56]' : ''
                            }`}
                    >
                        <MapPin className="w-3.5 h-3.5" aria-hidden="true" /> Maltby Shop
                    </button>
                </nav>

                {/* Search, Admin Gate, Account & Basket Controls */}
                <div className="flex items-center space-x-2.5">
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
                            className="pl-9 pr-4 py-2 text-xs bg-white border border-stone-200 rounded-full focus:outline-none focus:border-[#9A7B56] w-44 lg:w-56 transition"
                        />
                        <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" aria-hidden="true" />
                    </div>

                    {/* RBAC: Admin Dashboard Button ONLY rendered when logged in as Admin */}
                    {isAdmin && (
                        <button
                            type="button"
                            onClick={onOpenStockManager}
                            className="p-2.5 rounded-full bg-amber-700 hover:bg-amber-800 text-white transition cursor-pointer flex items-center gap-1.5 px-3.5 text-xs font-semibold shadow-xs"
                        >
                            <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Admin Panel</span>
                        </button>
                    )}

                    {/* Login / Account Button */}
                    <button
                        type="button"
                        onClick={() => onNavigate('auth')}
                        className={`p-2.5 rounded-full border transition cursor-pointer flex items-center gap-1.5 px-3.5 text-xs font-semibold ${currentPage === 'auth'
                                ? 'bg-[#9A7B56] text-white border-[#9A7B56]'
                                : 'bg-white border-stone-200 text-stone-700 hover:border-[#9A7B56]'
                            }`}
                    >
                        <User className="w-3.5 h-3.5" aria-hidden="true" />
                        <span className="hidden sm:inline">
                            {currentUser ? `${currentUser.name.split(' ')[0]}${isAdmin ? ' (Admin)' : ''}` : 'Account'}
                        </span>
                    </button>

                    {/* Slide-out Basket Trigger */}
                    <button
                        type="button"
                        onClick={onOpenCart}
                        aria-label={`Open shopping basket with ${cartCount} items`}
                        className="relative p-2.5 rounded-full bg-[#1C1B18] text-white hover:bg-[#9A7B56] transition flex items-center gap-2 px-4 cursor-pointer"
                    >
                        <ShoppingBag className="w-4 h-4" aria-hidden="true" />
                        <span className="text-xs font-semibold">{cartCount}</span>
                    </button>
                </div>
            </div>
        </header>
    );
}