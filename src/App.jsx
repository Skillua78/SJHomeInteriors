import { useState, useMemo, useEffect } from 'react';
import { products, categories } from './data/products';
import AnnouncementBar from './components/AnnouncementBar';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ValueBar from './components/ValueBar';
import CategoryGrid from './components/CategoryGrid';
import ProductCard from './components/ProductCard';
import SpecModal from './components/SpecModal';
import CartDrawer from './components/CartDrawer';
import Footer from './components/Footer';

export default function App() {
    const [activeCategory, setActiveCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('featured');
    const [modalData, setModalData] = useState(null);
    const [isCartOpen, setIsCartOpen] = useState(false);

    const [cart, setCart] = useState(() => {
        const saved = localStorage.getItem('sj_interiors_cart');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('sj_interiors_cart', JSON.stringify(cart));
    }, [cart]);

    const filteredProducts = useMemo(() => {
        const q = searchQuery.toLowerCase();
        let list = products.filter((p) => {
            const matchesCategory =
                activeCategory === 'All' ||
                p.category === activeCategory ||
                p.secondaryCategory === activeCategory;
            const matchesSearch =
                p.name.toLowerCase().includes(q) ||
                p.features.join(' ').toLowerCase().includes(q);
            return matchesCategory && matchesSearch;
        });

        if (sortBy === 'low') list = [...list].sort((a, b) => a.price - b.price);
        if (sortBy === 'high') list = [...list].sort((a, b) => b.price - a.price);
        return list;
    }, [activeCategory, searchQuery, sortBy]);

    const handleAddToCart = (product, selectedColor) => {
        setCart((prev) => [
            ...prev,
            { ...product, selectedColor: selectedColor || product.colors[0] },
        ]);
        setIsCartOpen(true);
    };

    const handleRemoveFromCart = (index) => {
        setCart((prev) => prev.filter((_, idx) => idx !== index));
    };

    return (
        <div className="min-h-screen flex flex-col">
            <AnnouncementBar />

            <Navbar
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onSelectCategory={setActiveCategory}
                cartCount={cart.length}
                onOpenCart={() => setIsCartOpen(true)}
            />

            <main className="flex-1">
                <Hero />
                <ValueBar />
                <CategoryGrid onSelectCategory={setActiveCategory} />

                {/* Product Catalog Section */}
                <section id="catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-8 border-b border-stone-200">
                        <div>
                            <span className="text-xs font-bold uppercase tracking-widest text-[#9A7B56]">
                                Showroom Bestsellers
                            </span>
                            <h2 className="font-serif text-3xl sm:text-4xl font-bold mt-1">
                                Featured Sofa Collection
                            </h2>
                        </div>

                        {/* Category Filter Pills & Sort Dropdown */}
                        <div className="flex flex-wrap items-center gap-2">
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveCategory(cat.id)}
                                    className={`px-4 py-2 rounded-full text-xs font-semibold transition cursor-pointer ${activeCategory === cat.id
                                            ? 'bg-[#1C1B18] text-white'
                                            : 'bg-white border border-stone-200 text-stone-700 hover:border-[#9A7B56]'
                                        }`}
                                >
                                    {cat.label}
                                </button>
                            ))}

                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="ml-auto sm:ml-2 px-3.5 py-2 rounded-full text-xs font-medium bg-white border border-stone-200 text-stone-700 focus:outline-none focus:border-[#9A7B56]"
                            >
                                <option value="featured">Sort: Featured</option>
                                <option value="low">Price: Low to High</option>
                                <option value="high">Price: High to Low</option>
                            </select>
                        </div>
                    </div>

                    {/* Product Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-10">
                        {filteredProducts.map((product) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                onOpenModal={(prod, color) =>
                                    setModalData({ product: prod, initialColor: color })
                                }
                                onAddToCart={handleAddToCart}
                            />
                        ))}
                    </div>
                </section>
            </main>

            <Footer onSelectCategory={setActiveCategory} />

            <SpecModal
                modalData={modalData}
                onClose={() => setModalData(null)}
                onAddToCart={handleAddToCart}
            />

            <CartDrawer
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
                cart={cart}
                onRemoveItem={handleRemoveFromCart}
            />
        </div>
    );
}