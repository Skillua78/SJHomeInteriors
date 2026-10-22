import { useState, useMemo, useEffect } from 'react';
import { initialProducts, initialReviews, categories } from './data/products';
import AnnouncementBar from './components/AnnouncementBar';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ValueBar from './components/ValueBar';
import CategoryGrid from './components/CategoryGrid';
import ProductCard from './components/ProductCard';
import SpecModal from './components/SpecModal';
import CartDrawer from './components/CartDrawer';
import BasketPage from './components/BasketPage';
import ContactPage from './components/ContactPage';
import AuthPage from './components/AuthPage';
import ReviewsSection from './components/ReviewsSection';
import StockManagerModal from './components/StockManagerModal';
import FeedbackBar from './components/FeedbackBar';
import CookieBanner from './components/CookieBanner';
import LegalModals from './components/LegalModals';
import Footer from './components/Footer';

export default function App() {
    const [currentPage, setCurrentPage] = useState('home'); // 'home' | 'basket' | 'contact' | 'auth'
    const [activeCategory, setActiveCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('featured');
    const [modalData, setModalData] = useState(null);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isStockManagerOpen, setIsStockManagerOpen] = useState(false);
    const [activeLegalDoc, setActiveLegalDoc] = useState(null);

    // Live Products & Stock State (persisted in localStorage)
    const [products, setProducts] = useState(() => {
        const saved = localStorage.getItem('sj_products_v2');
        return saved ? JSON.parse(saved) : initialProducts;
    });

    useEffect(() => {
        localStorage.setItem('sj_products_v2', JSON.stringify(products));
    }, [products]);

    // Customer Reviews State
    const [reviews, setReviews] = useState(() => {
        const saved = localStorage.getItem('sj_reviews_v2');
        return saved ? JSON.parse(saved) : initialReviews;
    });

    useEffect(() => {
        localStorage.setItem('sj_reviews_v2', JSON.stringify(reviews));
    }, [reviews]);

    // Shopping Basket State
    const [cart, setCart] = useState(() => {
        const saved = localStorage.getItem('sj_cart_v2');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('sj_cart_v2', JSON.stringify(cart));
    }, [cart]);

    // Logged-In User State
    const [currentUser, setCurrentUser] = useState(() => {
        const saved = localStorage.getItem('sj_user_v2');
        return saved ? JSON.parse(saved) : null;
    });

    const handleLogin = (userObj) => {
        setCurrentUser(userObj);
        localStorage.setItem('sj_user_v2', JSON.stringify(userObj));
    };

    const handleLogout = () => {
        setCurrentUser(null);
        localStorage.removeItem('sj_user_v2');
    };

    // Filtered Catalog Products
    const filteredProducts = useMemo(() => {
        const q = searchQuery.toLowerCase();
        let list = products.filter((p) => {
            let matchesCategory = false;
            if (activeCategory === 'All') matchesCategory = true;
            else if (activeCategory === 'Popular') matchesCategory = p.isPopular;
            else if (activeCategory === 'Trending') matchesCategory = p.isTrending;
            else {
                matchesCategory =
                    p.category === activeCategory || p.secondaryCategory === activeCategory;
            }

            const matchesSearch =
                p.name.toLowerCase().includes(q) ||
                p.category.toLowerCase().includes(q) ||
                p.features.join(' ').toLowerCase().includes(q);
            return matchesCategory && matchesSearch;
        });

        if (sortBy === 'low') list = [...list].sort((a, b) => a.price - b.price);
        if (sortBy === 'high') list = [...list].sort((a, b) => b.price - a.price);
        return list;
    }, [products, activeCategory, searchQuery, sortBy]);

    // Cart Handlers
    const handleAddToCart = (product, selectedColor) => {
        const color = selectedColor || product.colors[0];
        setCart((prev) => {
            const existingIndex = prev.findIndex(
                (item) => item.id === product.id && item.selectedColor === color
            );
            if (existingIndex > -1) {
                const updated = [...prev];
                updated[existingIndex].qty += 1;
                return updated;
            }
            return [...prev, { ...product, selectedColor: color, qty: 1 }];
        });
        setIsCartOpen(true);
    };

    const handleUpdateCartQty = (index, delta) => {
        setCart((prev) => {
            const updated = [...prev];
            const newQty = updated[index].qty + delta;
            if (newQty <= 0) {
                return updated.filter((_, i) => i !== index);
            }
            updated[index].qty = newQty;
            return updated;
        });
    };

    const handleRemoveFromCart = (index) => {
        setCart((prev) => prev.filter((_, idx) => idx !== index));
    };

    // Deduct stock when checkout is completed on BasketPage
    const handleCompleteOrder = (orderSnapshot) => {
        setProducts((prevProducts) =>
            prevProducts.map((prod) => {
                const boughtQty = orderSnapshot.items
                    .filter((i) => i.id === prod.id)
                    .reduce((s, i) => s + i.qty, 0);
                if (boughtQty > 0) {
                    return { ...prod, stock: Math.max(0, prod.stock - boughtQty) };
                }
                return prod;
            })
        );
        setCart([]);
    };

    // Stock & Dev Manager Handlers
    const handleUpdateStock = (productId, newStock) => {
        setProducts((prev) =>
            prev.map((p) => (p.id === productId ? { ...p, stock: newStock } : p))
        );
    };

    const handleAddNewProduct = (newProduct) => {
        setProducts((prev) => [newProduct, ...prev]);
    };

    const handleDeleteProduct = (productId) => {
        setProducts((prev) => prev.filter((p) => p.id !== productId));
    };

    const handleResetCatalog = () => {
        localStorage.removeItem('sj_products_v2');
        setProducts(initialProducts);
    };

    const totalCartItems = cart.reduce((sum, item) => sum + item.qty, 0);

    return (
        <div className="min-h-screen flex flex-col">
            <AnnouncementBar onNavigate={setCurrentPage} />

            <Navbar
                currentPage={currentPage}
                onNavigate={setCurrentPage}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onSelectCategory={setActiveCategory}
                cartCount={totalCartItems}
                onOpenCart={() => setIsCartOpen(true)}
                onOpenStockManager={() => setIsStockManagerOpen(true)}
                currentUser={currentUser}
            />

            <main className="flex-1">
                {currentPage === 'home' && (
                    <>
                        <Hero onNavigate={setCurrentPage} />
                        <ValueBar />
                        <CategoryGrid
                            onSelectCategory={(cat) => {
                                setActiveCategory(cat);
                                document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                        />

                        {/* Main Product Catalog Section */}
                        <section id="catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-8 border-b border-stone-200">
                                <div>
                                    <span className="text-xs font-bold uppercase tracking-widest text-[#9A7B56]">
                                        Showroom & Online Collection
                                    </span>
                                    <h2 className="font-serif text-3xl sm:text-4xl font-bold mt-1">
                                        Explore Our Furniture
                                    </h2>
                                </div>

                                {/* Sort Dropdown */}
                                <div className="flex items-center gap-3">
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="px-4 py-2.5 rounded-full text-xs font-semibold bg-white border border-stone-200 text-stone-700 focus:outline-none focus:border-[#9A7B56]"
                                    >
                                        <option value="featured">Sort: Featured</option>
                                        <option value="low">Price: Low to High</option>
                                        <option value="high">Price: High to Low</option>
                                    </select>
                                </div>
                            </div>

                            {/* Filter Pills */}
                            <div className="flex flex-wrap items-center gap-2 mt-6">
                                {categories.map((cat) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setActiveCategory(cat.id)}
                                        className={`px-4 py-2 rounded-full text-xs font-semibold transition cursor-pointer ${activeCategory === cat.id
                                                ? 'bg-[#1C1B18] text-white shadow-xs'
                                                : 'bg-white border border-stone-200 text-stone-700 hover:border-[#9A7B56]'
                                            }`}
                                    >
                                        {cat.label}
                                    </button>
                                ))}
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

                        {/* Customer Reviews with Image Upload */}
                        <ReviewsSection
                            reviews={reviews}
                            onAddReview={(newRev) => setReviews((prev) => [newRev, ...prev])}
                            products={products}
                        />
                    </>
                )}

                {currentPage === 'basket' && (
                    <BasketPage
                        cart={cart}
                        onUpdateQty={handleUpdateCartQty}
                        onRemoveItem={handleRemoveFromCart}
                        onCompleteOrder={handleCompleteOrder}
                        onBackToShop={() => setCurrentPage('home')}
                    />
                )}

                {currentPage === 'contact' && <ContactPage />}

                {currentPage === 'auth' && (
                    <AuthPage
                        currentUser={currentUser}
                        onLogin={handleLogin}
                        onLogout={handleLogout}
                        onBackToShop={() => setCurrentPage('home')}
                    />
                )}
            </main>

            {/* Leave Feedback Bar */}
            <FeedbackBar />

            {/* Footer */}
            <Footer
                onSelectCategory={setActiveCategory}
                onNavigate={(page) => {
                    setCurrentPage(page);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onOpenLegal={setActiveLegalDoc}
                onOpenStockManager={() => setIsStockManagerOpen(true)}
            />

            {/* Quick View Modal */}
            <SpecModal
                modalData={modalData}
                onClose={() => setModalData(null)}
                onAddToCart={handleAddToCart}
            />

            {/* Slide-out Basket Preview Drawer */}
            <CartDrawer
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
                cart={cart}
                onUpdateQty={handleUpdateCartQty}
                onRemoveItem={handleRemoveFromCart}
                onGoToBasketPage={() => {
                    setIsCartOpen(false);
                    setCurrentPage('basket');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
            />

            {/* Developer Stock & Product Manager Modal */}
            <StockManagerModal
                isOpen={isStockManagerOpen}
                onClose={() => setIsStockManagerOpen(false)}
                products={products}
                onUpdateStock={handleUpdateStock}
                onAddNewProduct={handleAddNewProduct}
                onDeleteProduct={handleDeleteProduct}
                onResetCatalog={handleResetCatalog}
            />

            {/* Legal Modals & Cookie Banner */}
            <LegalModals activeDoc={activeLegalDoc} onClose={() => setActiveLegalDoc(null)} />
            <CookieBanner onOpenLegal={setActiveLegalDoc} />
        </div>
    );
}