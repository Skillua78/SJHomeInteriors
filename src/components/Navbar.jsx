import { Search, ShoppingBag, User, SlidersHorizontal, Phone, MapPin } from 'lucide-react';
import Logo from './Logo';
import { SHOP_INFO } from '../data/products';

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
                    onClick={() => onNavigate('home')}
                    className="cursor-pointer text-left focus:outline-none"
                >
                    <Logo variant="dark" />
                </button>

                {/* Navigation Links */}
                <nav className="hidden xl:flex items-center space-x-6 text-xs font-semibold uppercase tracking-wider text-stone-700">
                    <button
                        onClick={() => handleCategoryNav('All')}
                        className={`cursor-pointer hover:text-[#9A7B56] transition ${currentPage === 'home' ? 'text-[#9A7B56]' : ''
                            }`}
                    >
                        All Furniture
                    </button>
                    <button
                        onClick={() => handleCategoryNav('Popular')}
                        className="cursor-pointer hover:text-[#9A7B56] transition"
                    >
                        Popular
                    </button>
                    <button
                        onClick={() => handleCategoryNav('U-Shape')}
                        className="cursor-pointer hover:text-[#9A7B56] transition"
                    >
                        Sofas
                    </button>
                    <button
                        onClick={() => handleCategoryNav('Bedroom')}
                        className="cursor-pointer hover:text-[#9A7B56] transition"
                    >
                        Bedroom
                    </button>
                    <button
                        onClick={() => handleCategoryNav('Dining Room')}
                        className="cursor-pointer hover:text-[#9A7B56] transition"
                    >
                        Dining & Living
                    </button>
                    <button
                        onClick={() => {
                            onNavigate('home');
                            setTimeout(() => {
                                document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' });
                            }, 50);
                        }}
                        className="cursor-pointer hover:text-[#9A7B56] transition"
                    >
                        Reviews
                    </button>
                    <button
                        onClick={() => onNavigate('contact')}
                        className={`cursor-pointer hover:text-[#9A7B56] transition flex items-center gap-1 ${currentPage === 'contact' ? 'text-[#9A7B56]' : ''
                            }`}
                    >
                        <MapPin className="w-3.5 h-3.5" /> Visit Maltby Shop
                    </button>
                </nav>

                {/* Search, Account, Stock Manager & Cart Controls */}
                <div className="flex items-center space-x-2.5">
                    <div className="relative hidden md:block">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                if (currentPage !== 'home') onNavigate('home');
                            }}
                            placeholder="Search sofas, beds, dining..."
                            className="pl-9 pr-4 py-2 text-xs bg-white border border-stone-200 rounded-full focus:outline-none focus:border-[#9A7B56] w-44 lg:w-56 transition"
                        />
                        <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                    </div>

                    {/* Dev Stock & Product Manager Button */}
                    <button
                        onClick={onOpenStockManager}
                        title="Developer Inventory & Product Manager"
                        className="p-2.5 rounded-full bg-stone-200/80 hover:bg-[#9A7B56] hover:text-white text-stone-700 transition cursor-pointer flex items-center gap-1.5 px-3 text-xs font-semibold"
                    >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Stock / Dev</span>
                    </button>

                    {/* Login / Account Button */}
                    <button
                        onClick={() => onNavigate('auth')}
                        className={`p-2.5 rounded-full border transition cursor-pointer flex items-center gap-1.5 px-3.5 text-xs font-semibold ${currentPage === 'auth'
                                ? 'bg-[#9A7B56] text-white border-[#9A7B56]'
                                : 'bg-white border-stone-200 text-stone-700 hover:border-[#9A7B56]'
                            }`}
                    >
                        <User className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">
                            {currentUser ? currentUser.name.split(' ')[0] : 'Account'}
                        </span>
                    </button>

                    {/* Slide-out Basket Trigger */}
                    <button
                        onClick={onOpenCart}
                        className="relative p-2.5 rounded-full bg-[#1C1B18] text-white hover:bg-[#9A7B56] transition flex items-center gap-2 px-4 cursor-pointer"
                    >
                        <ShoppingBag className="w-4 h-4" />
                        <span className="text-xs font-semibold">{cartCount}</span>
                    </button>
                </div>
            </div>
        </header>
    );
}