import { useState } from 'react';
import {
    X,
    Plus,
    Minus,
    Copy,
    RotateCcw,
    Upload,
    Check,
    Trash2,
    Edit3,
    MessageSquare,
    Package,
    CheckCircle2,
    ShieldAlert,
} from 'lucide-react';
import { CATEGORY_TAXONOMY } from '../data/products';
import { sanitizeText, validateImageFile, validateSafeImageUrl } from '../utils/security';

export default function StockManagerModal({
    isOpen,
    onClose,
    currentUser,
    products,
    onUpdateStock,
    onAddNewProduct,
    onUpdateProduct,
    onDeleteProduct,
    onResetCatalog,
    reviews,
    onToggleVerifyReview,
    onRespondToReview,
    onDeleteReview,
}) {
    const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'reviews'
    const [copied, setCopied] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [replyDrafts, setReplyDrafts] = useState({});
    const [formError, setFormError] = useState('');

    const categoryKeys = Object.keys(CATEGORY_TAXONOMY);

    const [prodForm, setProdForm] = useState({
        name: '',
        price: '',
        category: 'Sofas',
        subcategory: CATEGORY_TAXONOMY['Sofas'][0],
        stock: 5,
        badge: 'New Arrival',
        delivery: '2–10 days',
        colors: 'Grey, Beige, Charcoal',
        image: '',
        dimensions: 'Length: 220 cm, Depth: 92 cm, Height: 85 cm',
        features: 'Solid hardwood frame, High-density foam cushions',
        isPopular: false,
        isTrending: false,
    });

    // Strict RBAC guard: never render if not open or user is not an authenticated admin
    if (!isOpen || currentUser?.role !== 'admin') return null;

    const handleCategoryChange = (newCat) => {
        const firstSub = CATEGORY_TAXONOMY[newCat]?.[0] || '';
        setProdForm((prev) => ({ ...prev, category: newCat, subcategory: firstSub }));
    };

    const handleImageFile = (e) => {
        setFormError('');
        const file = e.target.files?.[0];
        if (!file) return;
        const check = validateImageFile(file);
        if (!check.valid) {
            setFormError(check.error);
            return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
            const safeUrl = validateSafeImageUrl(ev.target.result);
            if (safeUrl) setProdForm((prev) => ({ ...prev, image: safeUrl }));
        };
        reader.readAsDataURL(file);
    };

    const handleSaveProduct = (e) => {
        e.preventDefault();
        setFormError('');

        const cleanName = sanitizeText(prodForm.name, 120);
        const parsedPrice = parseFloat(prodForm.price);

        if (!cleanName || Number.isNaN(parsedPrice) || parsedPrice < 0) {
            setFormError('Please provide a valid product name and non-negative price.');
            return;
        }

        const safeImg =
            validateSafeImageUrl(prodForm.image) ||
            'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1000&q=85';

        const payload = {
            id:
                editingId ||
                `${cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString().slice(-4)}`,
            name: cleanName,
            price: parsedPrice,
            category: prodForm.category,
            subcategory: prodForm.subcategory,
            badge: sanitizeText(prodForm.badge || 'In Showroom', 40),
            stock: Math.max(0, parseInt(prodForm.stock, 10) || 0),
            isPopular: Boolean(prodForm.isPopular),
            isTrending: Boolean(prodForm.isTrending),
            delivery: sanitizeText(prodForm.delivery || '2–10 days', 40),
            colors: prodForm.colors
                .split(',')
                .map((c) => sanitizeText(c, 30))
                .filter(Boolean),
            image: safeImg,
            dimensions: prodForm.dimensions
                .split(',')
                .map((d) => sanitizeText(d, 100))
                .filter(Boolean),
            features: prodForm.features
                .split(',')
                .map((f) => sanitizeText(f, 120))
                .filter(Boolean),
        };

        if (editingId) {
            onUpdateProduct(payload);
            setEditingId(null);
        } else {
            onAddNewProduct(payload);
        }

        setProdForm({
            name: '',
            price: '',
            category: 'Sofas',
            subcategory: CATEGORY_TAXONOMY['Sofas'][0],
            stock: 5,
            badge: 'New Arrival',
            delivery: '2–10 days',
            colors: 'Grey, Beige, Charcoal',
            image: '',
            dimensions: 'Length: 220 cm, Depth: 92 cm, Height: 85 cm',
            features: 'Solid hardwood frame, High-density foam cushions',
            isPopular: false,
            isTrending: false,
        });
    };

    const startEditProduct = (p) => {
        setEditingId(p.id);
        setProdForm({
            name: p.name,
            price: String(p.price),
            category: p.category || 'Sofas',
            subcategory: p.subcategory || CATEGORY_TAXONOMY[p.category]?.[0] || '',
            stock: p.stock,
            badge: p.badge || '',
            delivery: p.delivery || '2–10 days',
            colors: (p.colors || []).join(', '),
            image: p.image || '',
            dimensions: (p.dimensions || []).join(', '),
            features: (p.features || []).join(', '),
            isPopular: Boolean(p.isPopular),
            isTrending: Boolean(p.isTrending),
        });
    };

    const copyProductsCode = () => {
        const codeString = `export const initialProducts = ${JSON.stringify(products, null, 2)};`;
        navigator.clipboard.writeText(codeString);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
    };

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label="SJ Home Interiors Admin Dashboard"
            className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4"
        >
            <div className="bg-white rounded-3xl max-w-6xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-stone-200">
                {/* Top Header */}
                <div className="p-6 border-b border-stone-200 flex flex-wrap items-center justify-between gap-4 bg-[#1C1B18] text-white">
                    <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 flex items-center gap-1">
                            <ShieldAlert className="w-3.5 h-3.5" /> Restricted Admin Dashboard ({currentUser.email})
                        </span>
                        <h2 className="font-serif text-2xl font-bold mt-0.5">
                            Catalog Database & Customer Review Moderation
                        </h2>
                    </div>

                    {/* Tab Switcher */}
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setActiveTab('inventory')}
                            className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition ${activeTab === 'inventory'
                                    ? 'bg-[#9A7B56] text-white'
                                    : 'bg-white/10 text-stone-300 hover:bg-white/20'
                                }`}
                        >
                            <Package className="w-3.5 h-3.5" /> Products & Stock ({products.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('reviews')}
                            className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition ${activeTab === 'reviews'
                                    ? 'bg-[#9A7B56] text-white'
                                    : 'bg-white/10 text-stone-300 hover:bg-white/20'
                                }`}
                        >
                            <MessageSquare className="w-3.5 h-3.5" /> Moderate Reviews ({reviews.length})
                        </button>

                        <button
                            type="button"
                            onClick={copyProductsCode}
                            className="px-3.5 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                        >
                            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            {copied ? 'Copied JSON!' : 'Export JSON'}
                        </button>
                        <button
                            type="button"
                            onClick={onResetCatalog}
                            className="px-3 py-2 rounded-full bg-white/10 hover:bg-white/20 text-xs flex items-center gap-1 cursor-pointer"
                            title="Reset catalog to default products.js"
                        >
                            <RotateCcw className="w-3.5 h-3.5" /> Reset
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close Admin Dashboard"
                            className="p-2 rounded-full hover:bg-white/10 cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* TAB 1: INVENTORY & PRODUCT CRUD */}
                {activeTab === 'inventory' && (
                    <div className="p-6 overflow-y-auto custom-scrollbar grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Add / Edit Form */}
                        <form
                            onSubmit={handleSaveProduct}
                            className="lg:col-span-5 space-y-3 bg-[#FAF8F5] p-5 rounded-2xl border border-stone-200"
                        >
                            <div className="flex items-center justify-between">
                                <h3 className="font-serif text-xl font-bold text-[#1C1B18]">
                                    {editingId ? 'Edit Furniture Item' : '+ Add New Furniture Item'}
                                </h3>
                                {editingId && (
                                    <button
                                        type="button"
                                        onClick={() => setEditingId(null)}
                                        className="text-xs text-red-700 hover:underline cursor-pointer"
                                    >
                                        Cancel Edit
                                    </button>
                                )}
                            </div>

                            {formError && (
                                <p className="text-xs text-red-700 bg-red-50 p-2.5 rounded-xl border border-red-200">
                                    {formError}
                                </p>
                            )}

                            <div>
                                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                                    Product Title *
                                </label>
                                <input
                                    required
                                    type="text"
                                    value={prodForm.name}
                                    onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                                    placeholder="e.g. Chatsworth Oak Dining Table"
                                    className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2.5">
                                <div>
                                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                                        Department Category *
                                    </label>
                                    <select
                                        value={prodForm.category}
                                        onChange={(e) => handleCategoryChange(e.target.value)}
                                        className="w-full px-2.5 py-2 rounded-xl bg-white border border-stone-200 text-xs"
                                    >
                                        {categoryKeys.map((cat) => (
                                            <option key={cat} value={cat}>
                                                {cat}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                                        Subcategory *
                                    </label>
                                    <select
                                        value={prodForm.subcategory}
                                        onChange={(e) => setProdForm({ ...prodForm, subcategory: e.target.value })}
                                        className="w-full px-2.5 py-2 rounded-xl bg-white border border-stone-200 text-xs"
                                    >
                                        {(CATEGORY_TAXONOMY[prodForm.category] || []).map((sub) => (
                                            <option key={sub} value={sub}>
                                                {sub}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2.5">
                                <div>
                                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                                        Price (£) *
                                    </label>
                                    <input
                                        required
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={prodForm.price}
                                        onChange={(e) => setProdForm({ ...prodForm, price: e.target.value })}
                                        placeholder="499.00"
                                        className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                                        Stock Count *
                                    </label>
                                    <input
                                        required
                                        type="number"
                                        min="0"
                                        value={prodForm.stock}
                                        onChange={(e) => setProdForm({ ...prodForm, stock: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                                        Badge
                                    </label>
                                    <input
                                        type="text"
                                        value={prodForm.badge}
                                        onChange={(e) => setProdForm({ ...prodForm, badge: e.target.value })}
                                        placeholder="New Arrival"
                                        className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                                    HTTPS Image URL or Upload File (Max 2MB)
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={prodForm.image}
                                        onChange={(e) => setProdForm({ ...prodForm, image: e.target.value })}
                                        placeholder="https://images.unsplash.com/..."
                                        className="flex-1 px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs"
                                    />
                                    <label className="px-3 py-2 rounded-xl bg-white border border-stone-200 hover:border-[#9A7B56] text-xs font-semibold cursor-pointer flex items-center gap-1">
                                        <Upload className="w-3.5 h-3.5 text-[#9A7B56]" /> File
                                        <input
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp"
                                            onChange={handleImageFile}
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2.5">
                                <div>
                                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                                        Finishes (comma separated)
                                    </label>
                                    <input
                                        type="text"
                                        value={prodForm.colors}
                                        onChange={(e) => setProdForm({ ...prodForm, colors: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                                        Delivery Estimate
                                    </label>
                                    <input
                                        type="text"
                                        value={prodForm.delivery}
                                        onChange={(e) => setProdForm({ ...prodForm, delivery: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                                    Dimensions (comma separated)
                                </label>
                                <input
                                    type="text"
                                    value={prodForm.dimensions}
                                    onChange={(e) => setProdForm({ ...prodForm, dimensions: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs"
                                />
                            </div>

                            <div className="flex items-center gap-4 pt-1">
                                <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={prodForm.isPopular}
                                        onChange={(e) => setProdForm({ ...prodForm, isPopular: e.target.checked })}
                                    />
                                    Popular Product
                                </label>
                                <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={prodForm.isTrending}
                                        onChange={(e) => setProdForm({ ...prodForm, isTrending: e.target.checked })}
                                    />
                                    Trending Now
                                </label>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-3 rounded-full bg-[#1C1B18] hover:bg-[#9A7B56] text-white text-xs font-semibold transition cursor-pointer"
                            >
                                {editingId ? 'Save Product Changes' : '+ Add Product to Database'}
                            </button>
                        </form>

                        {/* Right: Live Inventory List */}
                        <div className="lg:col-span-7 space-y-3">
                            <h3 className="font-serif text-xl font-bold text-[#1C1B18]">
                                Database Inventory ({products.length} Items)
                            </h3>
                            <div className="space-y-2.5 max-h-[62vh] overflow-y-auto pr-1 custom-scrollbar">
                                {products.map((p) => (
                                    <div
                                        key={p.id}
                                        className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-white border border-stone-200"
                                    >
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={validateSafeImageUrl(p.image)}
                                                alt={p.name}
                                                className="w-12 h-12 rounded-xl object-cover"
                                            />
                                            <div>
                                                <span className="text-[10px] font-bold uppercase text-[#9A7B56]">
                                                    {p.category} {p.subcategory ? `• ${p.subcategory}` : ''} &bull; £{p.price}
                                                </span>
                                                <h4 className="text-xs font-bold text-[#1C1B18]">{p.name}</h4>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                            <button
                                                type="button"
                                                aria-label={`Decrease stock for ${p.name}`}
                                                onClick={() => onUpdateStock(p.id, Math.max(0, p.stock - 1))}
                                                className="w-7 h-7 rounded-full border border-stone-300 flex items-center justify-center hover:border-[#9A7B56] cursor-pointer"
                                            >
                                                <Minus className="w-3 h-3" />
                                            </button>
                                            <input
                                                type="number"
                                                min="0"
                                                aria-label={`Stock quantity for ${p.name}`}
                                                value={p.stock}
                                                onChange={(e) =>
                                                    onUpdateStock(p.id, Math.max(0, parseInt(e.target.value, 10) || 0))
                                                }
                                                className="w-14 text-center py-1 rounded-lg border border-stone-200 text-xs font-bold"
                                            />
                                            <button
                                                type="button"
                                                aria-label={`Increase stock for ${p.name}`}
                                                onClick={() => onUpdateStock(p.id, p.stock + 1)}
                                                className="w-7 h-7 rounded-full border border-stone-300 flex items-center justify-center hover:border-[#9A7B56] cursor-pointer"
                                            >
                                                <Plus className="w-3 h-3" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => startEditProduct(p)}
                                                className="p-1.5 text-stone-500 hover:text-[#9A7B56] cursor-pointer ml-1"
                                                title="Edit item"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => onDeleteProduct(p.id)}
                                                className="p-1.5 text-stone-400 hover:text-red-600 cursor-pointer"
                                                title="Delete item"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 2: CUSTOMER REVIEW MODERATION & RESPONSES */}
                {activeTab === 'reviews' && (
                    <div className="p-6 overflow-y-auto custom-scrollbar space-y-4 max-h-[75vh]">
                        <h3 className="font-serif text-xl font-bold text-[#1C1B18]">
                            Customer Reviews Moderation ({reviews.length})
                        </h3>
                        {reviews.length === 0 ? (
                            <p className="text-xs text-stone-500">No customer reviews submitted yet.</p>
                        ) : (
                            reviews.map((rev) => {
                                const draftValue =
                                    replyDrafts[rev.id] !== undefined
                                        ? replyDrafts[rev.id]
                                        : rev.adminResponse || '';

                                return (
                                    <div
                                        key={rev.id}
                                        className="p-5 rounded-2xl bg-[#FAF8F5] border border-stone-200 space-y-3"
                                    >
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div>
                                                <strong className="text-sm text-[#1C1B18]">{rev.author}</strong>
                                                {rev.location && (
                                                    <span className="text-xs text-stone-500"> ({rev.location})</span>
                                                )}
                                                <span className="text-xs text-amber-600 font-bold ml-2">
                                                    ★ {rev.rating}/5
                                                </span>
                                                {rev.productName && (
                                                    <span className="text-xs text-[#9A7B56] font-semibold ml-2">
                                                        &bull; {rev.productName}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => onToggleVerifyReview(rev.id)}
                                                    className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 cursor-pointer transition ${rev.verified
                                                            ? 'bg-emerald-700 text-white'
                                                            : 'bg-white border border-stone-300 text-stone-700 hover:border-emerald-600'
                                                        }`}
                                                >
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    {rev.verified ? 'Verified Buyer' : 'Mark as Verified'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => onDeleteReview(rev.id)}
                                                    className="px-3 py-1.5 rounded-full bg-red-100 hover:bg-red-200 text-red-800 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" /> Delete Review
                                                </button>
                                            </div>
                                        </div>

                                        <p className="text-xs text-stone-700 bg-white p-3 rounded-xl border border-stone-200/80">
                                            "{rev.comment}"
                                        </p>

                                        {/* Official Admin Reply Box */}
                                        <div className="flex flex-col sm:flex-row gap-2 pt-1">
                                            <input
                                                type="text"
                                                maxLength={500}
                                                value={draftValue}
                                                onChange={(e) =>
                                                    setReplyDrafts({ ...replyDrafts, [rev.id]: e.target.value })
                                                }
                                                placeholder="Write an official SJ Home Interiors response to this customer..."
                                                className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-stone-200 text-xs"
                                            />
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    onRespondToReview(rev.id, sanitizeText(draftValue, 500))
                                                }
                                                className="px-4 py-2 rounded-xl bg-[#1C1B18] hover:bg-[#9A7B56] text-white text-xs font-semibold cursor-pointer"
                                            >
                                                Save Official Reply
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}