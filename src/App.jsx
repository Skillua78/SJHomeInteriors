import { useState, useMemo, useEffect } from 'react';
import {
    initialProducts,
    initialReviews,
    categories,
    CATEGORY_TAXONOMY,
} from './data/products';
import { api } from './utils/api';
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
    const [currentPage, setCurrentPage] = useState('home');
    const [activeCategory, setActiveCategory] = useState('All');
    const [activeSubcategory, setActiveSubcategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('featured');
    const [modalData, setModalData] = useState(null);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isStockManagerOpen, setIsStockManagerOpen] = useState(false);
    const [activeLegalDoc, setActiveLegalDoc] = useState(null);

    // Products state (defaults to initial, updates immediately when D1 responds)
    const [products, setProducts] = useState(initialProducts);

    // Reviews state
    const [reviews, setReviews] = useState(initialReviews);

    // Shopping Basket state (kept in local storage for buyer privacy)
    const [cart, setCart] = useState(() => {
        try {
            const saved = localStorage.getItem('sj_cart_v3');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem('sj_cart_v3', JSON.stringify(cart));
    }, [cart]);

    // Authenticated user state
    const [currentUser, setCurrentUser] = useState(() => {
        try {
            const saved = localStorage.getItem('sj_user_v3');
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    });

    // Fetch live global data from Cloudflare D1 on page load
    useEffect(() => {
        let isMounted = true;

        async function loadCloudflareData() {
            const [remoteProducts, remoteReviews] = await Promise.all([
                api.getProducts(),
                api.getReviews(),
            ]);

            if (isMounted) {
                if (remoteProducts && Array.isArray(remoteProducts) && remoteProducts.length > 0) {
                    setProducts(remoteProducts);
                }
                if (remoteReviews && Array.isArray(remoteReviews) && remoteReviews.length > 0) {
                    setReviews(remoteReviews);
                }
            }
        }

        loadCloudflareData();
        return () => {
            isMounted = false;
        };
    }, []);

    const handleLogin = (userObj) => {
        setCurrentUser(userObj);
        localStorage.setItem('sj_user_v3', JSON.stringify(userObj));
    };

    const handleLogout = () => {
        setCurrentUser(null);
        setIsStockManagerOpen(false);
        localStorage.removeItem('sj_user_v3');
    };

    const handleSelectCategory = (cat) => {
        setActiveCategory(cat);
        setActiveSubcategory('All');
    };

    // Filtered Products
    const filteredProducts = useMemo(() => {
        const q = searchQuery.toLowerCase();
        let list = products.filter((p) => {
            let matchesCategory = false;
            if (activeCategory === 'All') matchesCategory = true;
            else if (activeCategory === 'Popular') matchesCategory = Boolean(p.isPopular);
            else if (activeCategory === 'Trending') matchesCategory = Boolean(p.isTrending);
            else matchesCategory = p.category === activeCategory;

            const matchesSub =
                activeSubcategory === 'All' || p.subcategory === activeSubcategory;

            const matchesSearch =
                p.name.toLowerCase().includes(q) ||
                (p.category || '').toLowerCase().includes(q) ||
                (p.subcategory || '').toLowerCase().includes(q) ||
                (p.features || []).join(' ').toLowerCase().includes(q);

            return matchesCategory && matchesSub && matchesSearch;
        });

        if (sortBy === 'low') list = [...list].sort((a, b) => a.price - b.price);
        if (sortBy === 'high') list = [...list].sort((a, b) => b.price - a.price);
        return list;
    }, [products, activeCategory, activeSubcategory, searchQuery, sortBy]);

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
            if (newQty <= 0) return updated.filter((_, i) => i !== index);
            updated[index].qty = newQty;
            return updated;
        });
    };

    const handleRemoveFromCart = (index) => {
        setCart((prev) => prev.filter((_, idx) => idx !== index));
    };

    // Complete Order: Deduct locally and submit atomic transaction to D1
    const handleCompleteOrder = async (orderSnapshot) => {
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
        await api.submitOrder(orderSnapshot);
    };

    // Admin D1 Mutations
    const requireAdmin = () => currentUser?.role === 'admin';

    const handleUpdateStock = async (productId, newStock) => {
        if (!requireAdmin()) return;
        setProducts((prev) =>
            prev.map((p) => (p.id === productId ? { ...p, stock: newStock } : p))
        );
        await api.updateStock(productId, newStock);
    };

    const handleAddNewProduct = async (newProduct) => {
        if (!requireAdmin()) return;
        setProducts((prev) => [newProduct, ...prev]);
        await api.addProduct(newProduct);
    };

    const handleUpdateProduct = async (updatedProduct) => {
        if (!requireAdmin()) return;
        setProducts((prev) =>
            prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
        );
        await api.updateProduct(updatedProduct);
    };

    const handleDeleteProduct = async (productId) => {
        if (!requireAdmin()) return;
        setProducts((prev) => prev.filter((p) => p.id !== productId));
        await api.deleteProduct(productId);
    };

    const handleResetCatalog = () => {
        if (!requireAdmin()) return;
        setProducts(initialProducts);
    };

    // Admin Review Moderation Handlers
    const handleAddReview = async (newRev) => {
        setReviews((prev) => [newRev, ...prev]);
        await api.submitReview(newRev);
    };

    const handleToggleVerifyReview = async (reviewId) => {
        if (!requireAdmin()) return;
        const current = reviews.find((r) => r.id === reviewId);
        setReviews((prev) =>
            prev.map((r) => (r.id === reviewId ? { ...r, verified: !r.verified } : r))
        );
        if (current) {
            await api.toggleVerifyReview(reviewId, current.verified);
        }
    };

    const handleRespondToReview = async (reviewId, responseText) => {
        if (!requireAdmin()) return;
        setReviews((prev) =>
            prev.map((r) =>
                r.id === reviewId ? { ...r, adminResponse: responseText } : r
            )
        );
        await api.respondToReview(reviewId, responseText);
    };

    const handleDeleteReview = async (reviewId) => {
        if (!requireAdmin()) return;
        setReviews((prev) => prev.filter((r) => r.id !== reviewId));
        await api.deleteReview(reviewId);
    };

    const availableSubcategories = CATEGORY_TAXONOMY[activeCategory] || [];
    const totalCartItems = cart.reduce((sum, item) => sum + item.qty, 0);

    return (
        <div className="min-h-screen flex flex-col">
            <AnnouncementBar onNavigate={setCurrentPage} />

            <Navbar
                currentPage={currentPage}
                onNavigate={setCurrentPage}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onSelectCategory={handleSelectCategory}
                cartCount={totalCartItems}
                onOpenCart={() => setIsCartOpen(true)}
                onOpenStockManager={() => {
                    if (requireAdmin()) setIsStockManagerOpen(true);
                }}
                currentUser={currentUser}
            />

            <main className="flex-1">
                {currentPage === 'home' && (
                    <>
                        <Hero onNavigate={setCurrentPage} />
                        <ValueBar />
                        <CategoryGrid
                            onSelectCategory={(cat) => {
                                handleSelectCategory(cat);
                                document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                        />

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

                                <div className="flex items-center gap-3">
                                    <label htmlFor="sort-select" className="sr-only">
                                        Sort products
                                    </label>
                                    <select
                                        id="sort-select"
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

                            <div className="flex flex-wrap items-center gap-2 mt-6">
                                {categories.map((cat) => (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => handleSelectCategory(cat.id)}
                                        className={`px-4 py-2 rounded-full text-xs font-semibold transition cursor-pointer ${activeCategory === cat.id
                                                ? 'bg-[#1C1B18] text-white shadow-xs'
                                                : 'bg-white border border-stone-200 text-stone-700 hover:border-[#9A7B56]'
                                            }`}
                                    >
                                        {cat.label}
                                    </button>
                                ))}
                            </div>

                            {availableSubcategories.length > 0 && (
                                <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-stone-200/60">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mr-1">
                                        {activeCategory} Subcategories:
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setActiveSubcategory('All')}
                                        className={`px-3 py-1 rounded-full text-[11px] font-semibold cursor-pointer ${activeSubcategory === 'All'
                                                ? 'bg-[#9A7B56] text-white'
                                                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                                            }`}
                                    >
                                        All {activeCategory}
                                    </button>
                                    {availableSubcategories.map((sub) => (
                                        <button
                                            key={sub}
                                            type="button"
                                            onClick={() => setActiveSubcategory(sub)}
                                            className={`px-3 py-1 rounded-full text-[11px] font-semibold cursor-pointer ${activeSubcategory === sub
                                                    ? 'bg-[#9A7B56] text-white'
                                                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                                                }`}
                                        >
                                            {sub}
                                        </button>
                                    ))}
                                </div>
                            )}

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

                        <ReviewsSection
                            reviews={reviews}
                            onAddReview={handleAddReview}
                            products={products}
                            currentUser={currentUser}
                            onOpenAdmin={() => {
                                if (requireAdmin()) setIsStockManagerOpen(true);
                            }}
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
                        onOpenAdmin={() => {
                            if (requireAdmin()) setIsStockManagerOpen(true);
                        }}
                    />
                )}
            </main>

            <FeedbackBar />

            <Footer
                onSelectCategory={handleSelectCategory}
                onNavigate={(page) => {
                    setCurrentPage(page);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onOpenLegal={setActiveLegalDoc}
                onOpenStockManager={() => {
                    if (requireAdmin()) setIsStockManagerOpen(true);
                }}
                currentUser={currentUser}
            />

            <SpecModal
                modalData={modalData}
                onClose={() => setModalData(null)}
                onAddToCart={handleAddToCart}
            />

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

            <StockManagerModal
                isOpen={isStockManagerOpen}
                onClose={() => setIsStockManagerOpen(false)}
                currentUser={currentUser}
                products={products}
                onUpdateStock={handleUpdateStock}
                onAddNewProduct={handleAddNewProduct}
                onUpdateProduct={handleUpdateProduct}
                onDeleteProduct={handleDeleteProduct}
                onResetCatalog={handleResetCatalog}
                reviews={reviews}
                onToggleVerifyReview={handleToggleVerifyReview}
                onRespondToReview={handleRespondToReview}
                onDeleteReview={handleDeleteReview}
            />

            <LegalModals activeDoc={activeLegalDoc} onClose={() => setActiveLegalDoc(null)} />
            <CookieBanner onOpenLegal={setActiveLegalDoc} />
        </div>
    );
}