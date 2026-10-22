import { Search, ShoppingBag } from 'lucide-react';

export default function Navbar({
    searchQuery,
    setSearchQuery,
    onSelectCategory,
    cartCount,
    onOpenCart,
}) {
    return (
        <header className="sticky top-0 z-40 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-stone-200/80">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                {/* Brand Logo */}
                <a href="#" className="flex flex-col">
                    <span className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#1C1B18] leading-none">
                        SJ HOME INTERIORS
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.25em] text-[#9A7B56] font-semibold mt-1">
                        Bespoke Living &bull; UK Showroom
                    </span>
                </a>

                {/* Navigation Links */}
                <nav className="hidden lg:flex items-center space-x-8 text-sm font-medium text-stone-700">
                    <a
                        href="#catalog"
                        onClick={() => onSelectCategory('All')}
                        className="hover:text-[#9A7B56] transition"
                    >
                        All Collections
                    </a>
                    <a
                        href="#catalog"
                        onClick={() => onSelectCategory('U-Shape')}
                        className="hover:text-[#9A7B56] transition"
                    >
                        U-Shape Sofas
                    </a>
                    <a
                        href="#catalog"
                        onClick={() => onSelectCategory('Sofa Bed')}
                        className="hover:text-[#9A7B56] transition"
                    >
                        Sofa Beds
                    </a>
                    <a
                        href="#catalog"
                        onClick={() => onSelectCategory('Corner')}
                        className="hover:text-[#9A7B56] transition"
                    >
                        Corner & Recliners
                    </a>
                    <a href="#categories" className="hover:text-[#9A7B56] transition">
                        Shop by Room
                    </a>
                    <a href="#delivery" className="hover:text-[#9A7B56] transition">
                        White-Glove Delivery
                    </a>
                </nav>

                {/* Search & Cart Controls */}
                <div className="flex items-center space-x-3">
                    <div className="relative hidden sm:block">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search Luna, Palermo, Corner..."
                            className="pl-9 pr-4 py-2 text-xs bg-white border border-stone-200 rounded-full focus:outline-none focus:border-[#9A7B56] w-48 lg:w-60 transition"
                        />
                        <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                    </div>

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