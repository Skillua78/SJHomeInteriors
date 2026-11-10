import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { api, isApiUnavailable } from './utils/api';
import { useCatalog } from './hooks/useCatalog';
import { useCart } from './hooks/useCart';
import AnnouncementBar from './components/AnnouncementBar';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ValueBar from './components/ValueBar';
import CategoryGrid from './components/CategoryGrid';
import ProductCard from './components/ProductCard';
import ProductModal from './components/product/ProductModal';
import CartDrawer from './components/CartDrawer';
import BasketPage from './components/checkout/BasketPage';
import OrderStatusPage from './components/checkout/OrderStatusPage';
import ContactPage from './components/ContactPage';
import AuthPage from './components/AuthPage';
import ReviewsSection from './components/ReviewsSection';
import FeedbackBar from './components/FeedbackBar';
import CookieBanner from './components/CookieBanner';
import LegalModals from './components/LegalModals';
import Footer from './components/Footer';

// The admin dashboard is only downloaded when an administrator opens it.
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard'));

// Shown until /api/settings responds (and when running without the API).
const DEFAULT_SETTINGS = {
    phone: '07830 141250',
    email: 'info@sjhomeinteriors.co.uk',
    address: 'High Street, Maltby, Rotherham, S66 8JE',
    openingHours: 'Mon–Sat: 10:00 AM – 5:00 PM | Sun: 11:00 AM – 4:00 PM',
    facebookUrl: '',
    whatsappNumber: '',
    announcementText: 'Unbeatable Showroom Value • High-Quality Furniture at Affordable Direct Prices',
    heroBadge: 'Maltby Showroom • Quality Furniture, Affordable Prices',
    heroTitle: 'Quality Sofas, Beds & Dining at Prices You’ll Love',
    heroSubtitle:
        'Why pay inflated high-street retail markups? We supply durable, British-built sofas, ottoman beds, and dining sets at honest, affordable showroom prices—complete with fast local delivery.',
    heroImages: [
        'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1600&q=85',
        'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1600&q=85',
        'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1600&q=85',
    ],
    catalogSubtitle: 'Showroom & Online Collection',
    catalogTitle: 'Explore Our Furniture',
    showAssemblyHighlight: true,
    assemblyTitle: 'Two-Person Delivery & Assembly',
    assemblySubtitle: 'Standard charge £50 per item',
    defaultDeliveryFee: 50,
    customCategories: {},
    customColors: {},
    paymentEnabled: true,
    paymentOptions: { card: false, klarna: false, cod: true, showroom: true, bacs: false },
};

/** Read (and then remove) the query string Stripe Checkout sends the customer back with. */
function readCheckoutReturn() {
    const params = new URLSearchParams(window.location.search);
    const outcome = params.get('checkout');
    if (!outcome) return null;
    const result = { outcome, sessionId: params.get('session_id') || '' };
    window.history.replaceState({}, '', window.location.pathname);
    return result;
}

export default function App() {
    const [checkoutReturn] = useState(readCheckoutReturn);
    const [currentPage, setCurrentPage] = useState(() => {
        if (checkoutReturn?.outcome === 'success' && checkoutReturn.sessionId) return 'order';
        if (checkoutReturn?.outcome === 'cancelled') return 'basket';
        return 'home';
    });

    const [activeCategory, setActiveCategory] = useState('All');
    const [activeSubcategory, setActiveSubcategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('featured');

    const [modalData, setModalData] = useState(null);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isAdminOpen, setIsAdminOpen] = useState(false);
    const [adminLoaded, setAdminLoaded] = useState(false); // stays mounted so a half-filled form survives closing
    const [adminEditTarget, setAdminEditTarget] = useState(null);
    const [activeLegalDoc, setActiveLegalDoc] = useState(null);

    const [siteSettings, setSiteSettings] = useState(DEFAULT_SETTINGS);
    const [currentUser, setCurrentUser] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [reviewStats, setReviewStats] = useState(null);

    const catalog = useCatalog({
        category: activeCategory,
        subcategory: activeSubcategory,
        search: searchQuery,
        sort: sortBy,
    });
    const { cart, count: cartCount, addItem, updateQty, removeItem, clear: clearCart, repriceFromQuote } =
        useCart();

    const isAdmin = currentUser?.role === 'admin';

    const loadReviews = useCallback(async () => {
        try {
            const data = await api.getReviews();
            setReviews(data.items || []);
            setReviewStats(data.stats || null);
        } catch {
            // Reviews are optional; the section simply shows its empty state.
        }
    }, []);

    // Session, settings and reviews are independent: load them in parallel.
    useEffect(() => {
        let active = true;
        api.me()
            .then((data) => active && setCurrentUser(data.user))
            .catch(() => {});
        api.getSettings()
            .then((data) => active && setSiteSettings((prev) => ({ ...prev, ...data })))
            .catch((err) => {
                if (!isApiUnavailable(err)) console.warn('Settings unavailable:', err.message);
            });
        loadReviews();
        return () => {
            active = false;
        };
    }, [loadReviews]);

    // Admins also see unpublished reviews, so reload when the signed-in user changes.
    useEffect(() => {
        if (currentUser) loadReviews();
    }, [currentUser, loadReviews]);

    /* ----- navigation ----- */

    const navigate = useCallback((page) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0 });
    }, []);

    const handleSelectCategory = (category) => {
        setActiveCategory(category);
        setActiveSubcategory('All');
    };

    const scrollToCatalog = () =>
        document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });

    const categoryNames = useMemo(
        () => catalog.facets.categories.map((c) => c.name),
        [catalog.facets]
    );

    const categoryPills = useMemo(() => {
        const pills = [{ id: 'All', label: 'All' }];
        if (catalog.facets.popular > 0) pills.push({ id: 'Popular', label: 'Popular' });
        if (catalog.facets.trending > 0) pills.push({ id: 'Trending', label: 'Trending' });
        catalog.facets.categories.forEach((c) => pills.push({ id: c.name, label: c.name }));
        return pills;
    }, [catalog.facets]);

    const subcategories = useMemo(
        () => catalog.facets.categories.find((c) => c.name === activeCategory)?.subcategories || [],
        [catalog.facets, activeCategory]
    );

    /* ----- basket ----- */

    const handleAddToCart = (product, selections) => {
        const result = addItem(product, selections);
        if (result.ok) setIsCartOpen(true);
        return result;
    };

    /* ----- session ----- */

    const handleLogout = async () => {
        try {
            await api.logout();
        } catch {
            // Even if the request fails, drop the local view of the session.
        }
        setCurrentUser(null);
        setIsAdminOpen(false);
        setAdminLoaded(false);
    };

    const openAdmin = () => {
        if (!isAdmin) return;
        setAdminLoaded(true);
        setIsAdminOpen(true);
    };

    const handleEditProduct = (product) => {
        if (!isAdmin) return;
        setAdminEditTarget(product);
        setAdminLoaded(true);
        setIsAdminOpen(true);
    };

    /** Saves settings and adopts the server's validated copy. Throws on failure. */
    const handleSaveSiteSettings = useCallback(async (next) => {
        const { settings } = await api.updateSettings(next);
        setSiteSettings((prev) => ({ ...prev, ...settings }));
    }, []);

    /* ----- reviews ----- */

    const handleAddReview = async (review) => {
        try {
            await api.submitReview(review);
            return { ok: true };
        } catch (err) {
            return { ok: false, error: err.message };
        }
    };

    const reviewAction = async (action) => {
        try {
            await action();
        } catch (err) {
            window.alert(err.message);
        }
        loadReviews();
    };

    const handleToggleVerifyReview = (id) => {
        const review = reviews.find((r) => r.id === id);
        if (review) reviewAction(() => api.setReviewVerified(id, !review.verified));
    };

    const { refresh: refreshCatalog } = catalog;
    const handlePaid = useCallback(() => {
        clearCart();
        refreshCatalog();
    }, [clearCart, refreshCatalog]);

    return (
        <div className="min-h-screen flex flex-col">
            <a
                href="#main"
                className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:px-4 focus:py-2 focus:rounded-full focus:bg-white focus:text-[#1C1B18] focus:shadow-lg"
            >
                Skip to content
            </a>

            <AnnouncementBar onNavigate={navigate} siteSettings={siteSettings} />

            <Navbar
                currentPage={currentPage}
                onNavigate={navigate}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onSelectCategory={handleSelectCategory}
                cartCount={cartCount}
                onOpenCart={() => setIsCartOpen(true)}
                onOpenStockManager={openAdmin}
                currentUser={currentUser}
                availableCategories={categoryNames}
            />

            <main id="main" className="flex-1">
                {currentPage === 'home' && (
                    <>
                        <Hero onNavigate={navigate} siteSettings={siteSettings} />
                        <ValueBar siteSettings={siteSettings} />
                        <CategoryGrid
                            categories={catalog.facets.categories}
                            onSelectCategory={(cat) => {
                                handleSelectCategory(cat);
                                scrollToCatalog();
                            }}
                        />

                        <section
                            id="catalog"
                            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 scroll-mt-24"
                        >
                            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-stone-200">
                                <div>
                                    <span className="text-xs font-bold uppercase tracking-widest text-[#9A7B56]">
                                        {siteSettings.catalogSubtitle || 'Showroom & Online Collection'}
                                    </span>
                                    <h2 className="font-serif text-3xl sm:text-4xl font-bold mt-1">
                                        {siteSettings.catalogTitle || 'Explore Our Furniture'}
                                    </h2>
                                </div>

                                <div className="flex items-center gap-3">
                                    {!catalog.loading && (
                                        <span className="text-sm text-stone-500 whitespace-nowrap" role="status">
                                            {catalog.total} {catalog.total === 1 ? 'item' : 'items'}
                                        </span>
                                    )}
                                    <label htmlFor="sort-select" className="sr-only">
                                        Sort products
                                    </label>
                                    <select
                                        id="sort-select"
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="px-4 py-2.5 rounded-full text-sm font-semibold bg-white border border-stone-300 text-stone-700 focus:outline-none focus:border-[#9A7B56]"
                                    >
                                        <option value="featured">Newest first</option>
                                        <option value="low">Price: low to high</option>
                                        <option value="high">Price: high to low</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 mt-5 overflow-x-auto pb-2 sm:flex-wrap sm:overflow-visible">
                                {categoryPills.map((pill) => (
                                    <button
                                        key={pill.id}
                                        type="button"
                                        aria-pressed={activeCategory === pill.id}
                                        onClick={() => handleSelectCategory(pill.id)}
                                        className={`px-4 py-2.5 rounded-full text-sm font-semibold transition cursor-pointer shrink-0 ${
                                            activeCategory === pill.id
                                                ? 'bg-[#1C1B18] text-white'
                                                : 'bg-white border border-stone-300 text-stone-700 hover:border-[#9A7B56]'
                                        }`}
                                    >
                                        {pill.label}
                                    </button>
                                ))}
                            </div>

                            {subcategories.length > 0 && (
                                <div className="flex items-center gap-2 mt-2 overflow-x-auto pb-1 sm:flex-wrap">
                                    {[{ name: 'All' }, ...subcategories].map((sub) => (
                                        <button
                                            key={sub.name}
                                            type="button"
                                            aria-pressed={activeSubcategory === sub.name}
                                            onClick={() => setActiveSubcategory(sub.name)}
                                            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer shrink-0 ${
                                                activeSubcategory === sub.name
                                                    ? 'bg-[#9A7B56] text-white'
                                                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                                            }`}
                                        >
                                            {sub.name === 'All' ? `All ${activeCategory}` : sub.name}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {searchQuery.trim() && (
                                <p className="mt-4 text-sm text-stone-600">
                                    Results for “{searchQuery.trim()}” ·{' '}
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery('')}
                                        className="font-semibold text-[#7D6242] underline cursor-pointer"
                                    >
                                        clear search
                                    </button>
                                </p>
                            )}

                            {catalog.error && (
                                <div
                                    role="alert"
                                    className="mt-8 p-5 rounded-2xl bg-red-50 border border-red-200 text-sm text-red-800 flex flex-wrap items-center justify-between gap-3"
                                >
                                    <span>{catalog.error}</span>
                                    <button
                                        type="button"
                                        onClick={catalog.refresh}
                                        className="px-4 py-2 rounded-full bg-[#1C1B18] text-white text-xs font-semibold cursor-pointer"
                                    >
                                        Try again
                                    </button>
                                </div>
                            )}

                            {catalog.loading ? (
                                <div
                                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8"
                                    aria-busy="true"
                                    aria-label="Loading products"
                                >
                                    {[0, 1, 2].map((i) => (
                                        <div
                                            key={i}
                                            className="rounded-3xl border border-stone-200 bg-white overflow-hidden animate-pulse"
                                        >
                                            <div className="aspect-[4/3] bg-stone-200" />
                                            <div className="p-5 space-y-3">
                                                <div className="h-3 w-1/3 bg-stone-200 rounded" />
                                                <div className="h-5 w-3/4 bg-stone-200 rounded" />
                                                <div className="h-8 w-1/2 bg-stone-200 rounded" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                                        {catalog.items.map((product) => (
                                            <ProductCard
                                                key={product.id}
                                                product={product}
                                                onOpenModal={(prod, color) =>
                                                    setModalData({ product: prod, initialColor: color })
                                                }
                                                onAddToCart={handleAddToCart}
                                                isAdmin={isAdmin}
                                                onEditProduct={handleEditProduct}
                                                customColors={siteSettings.customColors}
                                            />
                                        ))}
                                    </div>

                                    {catalog.items.length === 0 && !catalog.error && (
                                        <div className="mt-8 p-10 text-center bg-white rounded-3xl border border-stone-200 space-y-3">
                                            <p className="text-base text-stone-700">
                                                We could not find anything matching that.
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSearchQuery('');
                                                    handleSelectCategory('All');
                                                }}
                                                className="px-6 py-2.5 rounded-full bg-[#1C1B18] text-white text-sm font-semibold cursor-pointer"
                                            >
                                                Show all furniture
                                            </button>
                                        </div>
                                    )}

                                    {catalog.hasMore && (
                                        <div className="mt-10 text-center">
                                            <button
                                                type="button"
                                                onClick={catalog.loadMore}
                                                disabled={catalog.loadingMore}
                                                className="px-8 py-3.5 rounded-full border border-[#1C1B18] text-[#1C1B18] hover:bg-[#1C1B18] hover:text-white text-sm font-semibold transition cursor-pointer inline-flex items-center gap-2"
                                            >
                                                {catalog.loadingMore && (
                                                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                                                )}
                                                Show more ({catalog.items.length} of {catalog.total})
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </section>

                        <ReviewsSection
                            reviews={reviews}
                            stats={reviewStats}
                            onAddReview={handleAddReview}
                            products={catalog.items}
                            currentUser={currentUser}
                            onOpenAdmin={openAdmin}
                        />
                    </>
                )}

                {currentPage === 'basket' && (
                    <BasketPage
                        cart={cart}
                        onUpdateQty={updateQty}
                        onRemoveItem={removeItem}
                        onClearCart={clearCart}
                        onRepriceCart={repriceFromQuote}
                        onOrderPlaced={catalog.refresh}
                        onBackToShop={() => navigate('home')}
                        onNavigate={navigate}
                        onOpenLegal={setActiveLegalDoc}
                        siteSettings={siteSettings}
                        currentUser={currentUser}
                        notice={
                            checkoutReturn?.outcome === 'cancelled'
                                ? 'Your payment was cancelled and nothing has been charged. Your basket is still here when you are ready.'
                                : ''
                        }
                    />
                )}

                {currentPage === 'order' && (
                    <OrderStatusPage
                        sessionId={checkoutReturn?.sessionId}
                        onPaid={handlePaid}
                        onBackToShop={() => navigate('home')}
                        onBackToBasket={() => navigate('basket')}
                    />
                )}

                {currentPage === 'contact' && <ContactPage siteSettings={siteSettings} />}

                {currentPage === 'auth' && (
                    <AuthPage
                        currentUser={currentUser}
                        onLogin={setCurrentUser}
                        onLogout={handleLogout}
                        onBackToShop={() => navigate('home')}
                        onOpenAdmin={openAdmin}
                    />
                )}
            </main>

            <FeedbackBar />

            <Footer
                onSelectCategory={handleSelectCategory}
                onNavigate={navigate}
                onOpenLegal={setActiveLegalDoc}
                onOpenStockManager={openAdmin}
                currentUser={currentUser}
                siteSettings={siteSettings}
                availableCategories={categoryNames}
            />

            <ProductModal
                modalData={modalData}
                onClose={() => setModalData(null)}
                onAddToCart={handleAddToCart}
                isAdmin={isAdmin}
                onEditProduct={handleEditProduct}
                siteSettings={siteSettings}
            />

            <CartDrawer
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
                cart={cart}
                onUpdateQty={updateQty}
                onRemoveItem={removeItem}
                onGoToBasketPage={() => {
                    setIsCartOpen(false);
                    navigate('basket');
                }}
            />

            {isAdmin && adminLoaded && (
                <Suspense fallback={null}>
            <AdminDashboard
                isOpen={isAdminOpen}
                onClose={() => setIsAdminOpen(false)}
                currentUser={currentUser}
                siteSettings={siteSettings}
                onSaveSiteSettings={handleSaveSiteSettings}
                facets={catalog.facets}
                onCatalogChanged={catalog.refresh}
                reviews={reviews}
                onToggleVerifyReview={handleToggleVerifyReview}
                onRespondToReview={(id, text) => reviewAction(() => api.respondToReview(id, text))}
                onDeleteReview={(id) => reviewAction(() => api.deleteReview(id))}
                initialEditProduct={adminEditTarget}
                onClearInitialEdit={() => setAdminEditTarget(null)}
            />
                </Suspense>
            )}

            <LegalModals activeDoc={activeLegalDoc} onClose={() => setActiveLegalDoc(null)} />
            <CookieBanner onOpenLegal={setActiveLegalDoc} />
        </div>
    );
}
