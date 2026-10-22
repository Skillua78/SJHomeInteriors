import { useState } from 'react';
import {
    X,
    Plus,
    Minus,
    Copy,
    Undo2,
    Upload,
    Check,
    Trash2,
    Edit3,
    MessageSquare,
    Package,
    CheckCircle2,
    ShieldAlert,
    EyeOff,
} from 'lucide-react';
import { CATEGORY_TAXONOMY } from '../data/products';
import { sanitizeText, validateImageFile, validateSafeImageUrl } from '../utils/security';

const EMPTY_FORM = {
    name: '',
    price: '',
    previousPrice: '',
    description: '',
    category: '',
    subcategory: '',
    stock: '',
    badge: '',
    delivery: '',
    colors: '',
    imageInput: '',
    images: [],
    dimensions: '',
    features: '',
    isPopular: false,
    isTrending: false,
};

export default function StockManagerModal({
    isOpen,
    onClose,
    currentUser,
    products,
    onUpdateStock,
    onAddNewProduct,
    onUpdateProduct,
    onDeleteProduct,
    canUndo,
    lastActionLabel,
    onUndoLastAction,
    reviews,
    onToggleVerifyReview,
    onRespondToReview,
    onDeleteReview,
}) {
    const [activeTab, setActiveTab] = useState('inventory');
    const [copied, setCopied] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [replyDrafts, setReplyDrafts] = useState({});
    const [formError, setFormError] = useState('');
    const [prodForm, setProdForm] = useState(EMPTY_FORM);

    const categoryKeys = Object.keys(CATEGORY_TAXONOMY);

    if (!isOpen || currentUser?.role !== 'admin') return null;

    const handleCategoryChange = (newCat) => {
        setProdForm((prev) => ({
            ...prev,
            category: newCat,
            subcategory: '',
        }));
    };

    // Add an HTTPS image URL to the product's gallery list
    const handleAddImageUrl = () => {
        setFormError('');
        const safeUrl = validateSafeImageUrl(prodForm.imageInput);
        if (!safeUrl) {
            setFormError('Please enter a valid https:// image URL.');
            return;
        }
        if (prodForm.images.length >= 10) {
            setFormError('Maximum 10 photos per product.');
            return;
        }
        setProdForm((prev) => ({
            ...prev,
            images: [...prev.images, safeUrl],
            imageInput: '',
        }));
    };

    // Upload one or more local image files into the product's gallery list
    const handleImageFiles = (e) => {
        setFormError('');
        const files = Array.from(e.target.files || []);
        if (prodForm.images.length + files.length > 10) {
            setFormError('You can attach up to 10 photos per product.');
            return;
        }

        files.forEach((file) => {
            const check = validateImageFile(file);
            if (!check.valid) {
                setFormError(check.error);
                return;
            }
            const reader = new FileReader();
            reader.onload = (ev) => {
                const safeUrl = validateSafeImageUrl(ev.target.result);
                if (safeUrl) {
                    setProdForm((prev) => ({
                        ...prev,
                        images: [...prev.images, safeUrl],
                    }));
                }
            };
            reader.readAsDataURL(file);
        });
        e.target.value = '';
    };

    const handleRemoveGalleryImage = (idxToRemove) => {
        setProdForm((prev) => ({
            ...prev,
            images: prev.images.filter((_, idx) => idx !== idxToRemove),
        }));
    };

    const handleSaveProduct = (e) => {
        e.preventDefault();
        setFormError('');

        const cleanName = sanitizeText(prodForm.name, 120);
        const parsedPrice = parseFloat(prodForm.price);

        if (!cleanName || Number.isNaN(parsedPrice) || parsedPrice < 0) {
            setFormError('Please enter a valid product title and current price.');
            return;
        }
        if (!prodForm.category) {
            setFormError('Please select a department category.');
            return;
        }

        // Include any URL left typed in the input box if the admin didn't click "+ Add URL"
        let finalGallery = [...prodForm.images];
        if (prodForm.imageInput.trim()) {
            const pendingUrl = validateSafeImageUrl(prodForm.imageInput.trim());
            if (pendingUrl) finalGallery.push(pendingUrl);
        }

        if (finalGallery.length === 0) {
            finalGallery.push(
                'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1000&q=85'
            );
        }

        // Parse optional previousPrice
        const rawPrev = prodForm.previousPrice.toString().trim();
        const parsedPrevPrice =
            rawPrev !== '' && !Number.isNaN(parseFloat(rawPrev)) && parseFloat(rawPrev) > 0
                ? parseFloat(rawPrev)
                : null;

        // Parse optional stock (blank = null = hidden on card)
        const rawStock = prodForm.stock.toString().trim();
        const parsedStock =
            rawStock === '' || Number.isNaN(parseInt(rawStock, 10))
                ? null
                : Math.max(0, parseInt(rawStock, 10));

        const payload = {
            id:
                editingId ||
                `${cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString().slice(-4)}`,
            name: cleanName,
            price: parsedPrice,
            previousPrice: parsedPrevPrice,
            description: sanitizeText(prodForm.description, 2000),
            category: prodForm.category,
            subcategory: prodForm.subcategory || '',
            badge: sanitizeText(prodForm.badge, 40),
            stock: parsedStock,
            isPopular: Boolean(prodForm.isPopular),
            isTrending: Boolean(prodForm.isTrending),
            delivery: sanitizeText(prodForm.delivery, 40),
            colors: prodForm.colors
                .split(',')
                .map((c) => sanitizeText(c, 30))
                .filter(Boolean),
            image: finalGallery[0],
            images: finalGallery,
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

        setProdForm(EMPTY_FORM);
    };

    const startEditProduct = (p) => {
        setEditingId(p.id);
        const existingGallery =
            Array.isArray(p.images) && p.images.length > 0
                ? p.images
                : p.image
                    ? [p.image]
                    : [];

        setProdForm({
            name: p.name || '',
            price: p.price !== undefined && p.price !== null ? String(p.price) : '',
            previousPrice:
                p.previousPrice !== undefined && p.previousPrice !== null
                    ? String(p.previousPrice)
                    : '',
            description: p.description || '',
            category: p.category || '',
            subcategory: p.subcategory || '',
            stock: p.stock !== null && p.stock !== undefined ? String(p.stock) : '',
            badge: p.badge || '',
            delivery: p.delivery || '',
            colors: (p.colors || []).join(', '),
            imageInput: '',
            images: existingGallery,
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
            className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
            <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-6xl w-full max-h-[94vh] flex flex-col overflow-hidden shadow-2xl border border-stone-200">
                {/* Top Header */}
                <div className="p-4 sm:p-6 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3 bg-[#1C1B18] text-white">
                    <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 flex items-center gap-1">
                            <ShieldAlert className="w-3.5 h-3.5" /> Admin Dashboard ({currentUser.email})
                        </span>
                        <h2 className="font-serif text-xl sm:text-2xl font-bold mt-0.5">
                            Catalog Database & Review Moderation
                        </h2>
                    </div>

                    {/* Action & Tab Bar */}
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setActiveTab('inventory')}
                            className={`px-3.5 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition ${activeTab === 'inventory'
                                    ? 'bg-[#9A7B56] text-white'
                                    : 'bg-white/10 text-stone-300 hover:bg-white/20'
                                }`}
                        >
                            <Package className="w-3.5 h-3.5" /> Products ({products.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('reviews')}
                            className={`px-3.5 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition ${activeTab === 'reviews'
                                    ? 'bg-[#9A7B56] text-white'
                                    : 'bg-white/10 text-stone-300 hover:bg-white/20'
                                }`}
                        >
                            <MessageSquare className="w-3.5 h-3.5" /> Reviews ({reviews.length})
                        </button>

                        {/* Non-Destructive UNDO Button */}
                        <button
                            type="button"
                            onClick={onUndoLastAction}
                            disabled={!canUndo}
                            title={
                                canUndo
                                    ? `Undo: ${lastActionLabel}`
                                    : 'No recent action to undo'
                            }
                            className={`px-3.5 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 transition ${canUndo
                                    ? 'bg-amber-600 hover:bg-amber-500 text-white cursor-pointer'
                                    : 'bg-white/5 text-stone-500 cursor-not-allowed'
                                }`}
                        >
                            <Undo2 className="w-3.5 h-3.5" />
                            <span>Undo{canUndo && lastActionLabel ? `: ${lastActionLabel}` : ''}</span>
                        </button>

                        <button
                            type="button"
                            onClick={copyProductsCode}
                            className="px-3.5 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                        >
                            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            <span className="hidden sm:inline">{copied ? 'Copied!' : 'Export JSON'}</span>
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
                    <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
                        {/* Left: Add / Edit Form (All Empty Ghost Placeholders) */}
                        <form
                            onSubmit={handleSaveProduct}
                            className="lg:col-span-5 space-y-3.5 bg-[#FAF8F5] p-4 sm:p-5 rounded-2xl border border-stone-200"
                        >
                            <div className="flex items-center justify-between">
                                <h3 className="font-serif text-xl font-bold text-[#1C1B18]">
                                    {editingId ? 'Edit Furniture Item' : '+ Add New Furniture Item'}
                                </h3>
                                {editingId && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditingId(null);
                                            setProdForm(EMPTY_FORM);
                                        }}
                                        className="text-xs text-red-700 hover:underline cursor-pointer"
                                    >
                                        Cancel Edit
                                    </button>
                                )}
                            </div>

                            {formError && (
                                <div
                                    role="alert"
                                    className="text-xs text-red-700 bg-red-50 p-3 rounded-xl border border-red-200"
                                >
                                    {formError}
                                </div>
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
                                    className="w-full px-3 py-2.5 rounded-xl bg-white border border-stone-200 text-xs placeholder:text-stone-400"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                <div>
                                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                                        Department Category *
                                    </label>
                                    <select
                                        required
                                        value={prodForm.category}
                                        onChange={(e) => handleCategoryChange(e.target.value)}
                                        className="w-full px-2.5 py-2.5 rounded-xl bg-white border border-stone-200 text-xs text-stone-700"
                                    >
                                        <option value="">Select category...</option>
                                        {categoryKeys.map((cat) => (
                                            <option key={cat} value={cat}>
                                                {cat}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                                        Subcategory (Optional)
                                    </label>
                                    <select
                                        value={prodForm.subcategory}
                                        onChange={(e) =>
                                            setProdForm({ ...prodForm, subcategory: e.target.value })
                                        }
                                        disabled={!prodForm.category}
                                        className="w-full px-2.5 py-2.5 rounded-xl bg-white border border-stone-200 text-xs text-stone-700 disabled:bg-stone-100"
                                    >
                                        <option value="">Select subcategory...</option>
                                        {(CATEGORY_TAXONOMY[prodForm.category] || []).map((sub) => (
                                            <option key={sub} value={sub}>
                                                {sub}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Current Price, Previous Strikethrough Price & Optional Stock */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                <div>
                                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                                        Current Price (£) *
                                    </label>
                                    <input
                                        required
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={prodForm.price}
                                        onChange={(e) => setProdForm({ ...prodForm, price: e.target.value })}
                                        placeholder="e.g. 899.00"
                                        className="w-full px-3 py-2.5 rounded-xl bg-white border border-stone-200 text-xs placeholder:text-stone-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                                        Previous Price (£)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={prodForm.previousPrice}
                                        onChange={(e) =>
                                            setProdForm({ ...prodForm, previousPrice: e.target.value })
                                        }
                                        placeholder="e.g. 1199.00 (Optional)"
                                        className="w-full px-3 py-2.5 rounded-xl bg-white border border-stone-200 text-xs placeholder:text-stone-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                                        Stock (Optional)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={prodForm.stock}
                                        onChange={(e) => setProdForm({ ...prodForm, stock: e.target.value })}
                                        placeholder="Blank = hide, 0 = sold out"
                                        className="w-full px-3 py-2.5 rounded-xl bg-white border border-stone-200 text-xs placeholder:text-stone-400"
                                    />
                                </div>
                            </div>

                            {/* Product Description Textarea */}
                            <div>
                                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                                    Product Description (Optional)
                                </label>
                                <textarea
                                    rows={3}
                                    value={prodForm.description}
                                    onChange={(e) =>
                                        setProdForm({ ...prodForm, description: e.target.value })
                                    }
                                    placeholder="Describe the craftsmanship, upholstery feel, comfort, and room styling..."
                                    className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs placeholder:text-stone-400"
                                />
                            </div>

                            {/* Multi-Picture Gallery Section */}
                            <div className="p-3.5 rounded-xl bg-white border border-stone-200 space-y-2.5">
                                <label className="block text-[11px] font-semibold text-stone-700">
                                    Product Pictures (First photo is main cover &bull; Scrollable gallery)
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    <input
                                        type="text"
                                        value={prodForm.imageInput}
                                        onChange={(e) =>
                                            setProdForm({ ...prodForm, imageInput: e.target.value })
                                        }
                                        placeholder="Paste https:// image link..."
                                        className="flex-1 min-w-[160px] px-3 py-2 rounded-xl bg-[#FAF8F5] border border-stone-200 text-xs placeholder:text-stone-400"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddImageUrl}
                                        className="px-3 py-2 rounded-xl bg-[#1C1B18] text-white text-xs font-semibold cursor-pointer hover:bg-[#9A7B56]"
                                    >
                                        + Add URL
                                    </button>
                                    <label className="px-3 py-2 rounded-xl bg-[#FAF8F5] border border-stone-200 hover:border-[#9A7B56] text-xs font-semibold cursor-pointer flex items-center gap-1">
                                        <Upload className="w-3.5 h-3.5 text-[#9A7B56]" /> Upload Photos
                                        <input
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp"
                                            multiple
                                            onChange={handleImageFiles}
                                            className="hidden"
                                        />
                                    </label>
                                </div>

                                {/* Thumbnail Previews of Added Pictures */}
                                {prodForm.images.length > 0 && (
                                    <div className="flex items-center gap-2 overflow-x-auto pt-2 pb-1">
                                        {prodForm.images.map((imgSrc, idx) => (
                                            <div
                                                key={idx}
                                                className="relative w-16 h-16 rounded-xl overflow-hidden border border-stone-200 shrink-0 group"
                                            >
                                                <img
                                                    src={imgSrc}
                                                    alt={`Product preview ${idx + 1}`}
                                                    className="w-full h-full object-cover"
                                                />
                                                <span className="absolute bottom-0.5 left-1 px-1 rounded bg-black/70 text-[9px] text-white font-bold">
                                                    {idx === 0 ? 'Main' : `#${idx + 1}`}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveGalleryImage(idx)}
                                                    aria-label={`Remove image ${idx + 1}`}
                                                    className="absolute top-0.5 right-0.5 bg-red-600 text-white rounded-full p-0.5 cursor-pointer"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                <div>
                                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                                        Finishes / Colours
                                    </label>
                                    <input
                                        type="text"
                                        value={prodForm.colors}
                                        onChange={(e) => setProdForm({ ...prodForm, colors: e.target.value })}
                                        placeholder="e.g. Grey, Beige, Black"
                                        className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs placeholder:text-stone-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                                        Delivery Time
                                    </label>
                                    <input
                                        type="text"
                                        value={prodForm.delivery}
                                        onChange={(e) =>
                                            setProdForm({ ...prodForm, delivery: e.target.value })
                                        }
                                        placeholder="e.g. 2–10 days"
                                        className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs placeholder:text-stone-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                                        Corner Badge
                                    </label>
                                    <input
                                        type="text"
                                        value={prodForm.badge}
                                        onChange={(e) => setProdForm({ ...prodForm, badge: e.target.value })}
                                        placeholder="e.g. Bestseller"
                                        className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs placeholder:text-stone-400"
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
                                    onChange={(e) =>
                                        setProdForm({ ...prodForm, dimensions: e.target.value })
                                    }
                                    placeholder="e.g. Length: 240 cm, Depth: 95 cm, Height: 85 cm"
                                    className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs placeholder:text-stone-400"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                                    Key Features (comma separated)
                                </label>
                                <input
                                    type="text"
                                    value={prodForm.features}
                                    onChange={(e) =>
                                        setProdForm({ ...prodForm, features: e.target.value })
                                    }
                                    placeholder="e.g. Solid hardwood frame, High-density foam cushions"
                                    className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs placeholder:text-stone-400"
                                />
                            </div>

                            <div className="flex items-center gap-4 pt-1">
                                <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={prodForm.isPopular}
                                        onChange={(e) =>
                                            setProdForm({ ...prodForm, isPopular: e.target.checked })
                                        }
                                    />
                                    Popular Product
                                </label>
                                <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={prodForm.isTrending}
                                        onChange={(e) =>
                                            setProdForm({ ...prodForm, isTrending: e.target.checked })
                                        }
                                    />
                                    Trending Now
                                </label>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-3.5 rounded-full bg-[#1C1B18] hover:bg-[#9A7B56] text-white text-xs font-semibold transition cursor-pointer"
                            >
                                {editingId ? 'Save Product Changes' : '+ Add Product to Database'}
                            </button>
                        </form>

                        {/* Right: Live Inventory List */}
                        <div className="lg:col-span-7 space-y-3">
                            <h3 className="font-serif text-xl font-bold text-[#1C1B18]">
                                Database Inventory ({products.length} Items)
                            </h3>
                            <div className="space-y-2.5 max-h-[65vh] overflow-y-auto pr-1 custom-scrollbar">
                                {products.map((p) => {
                                    const isStockHidden =
                                        p.stock === null || p.stock === undefined || p.stock === '';

                                    return (
                                        <div
                                            key={p.id}
                                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white border border-stone-200"
                                        >
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={validateSafeImageUrl(p.image)}
                                                    alt={p.name}
                                                    className="w-12 h-12 rounded-xl object-cover shrink-0"
                                                />
                                                <div>
                                                    <span className="text-[10px] font-bold uppercase text-[#9A7B56]">
                                                        {p.category} {p.subcategory ? `• ${p.subcategory}` : ''} &bull;{' '}
                                                        {p.previousPrice ? (
                                                            <span className="line-through text-stone-400 mr-1">
                                                                £{p.previousPrice}
                                                            </span>
                                                        ) : null}
                                                        £{p.price}
                                                    </span>
                                                    <h4 className="text-xs font-bold text-[#1C1B18]">{p.name}</h4>
                                                    <span className="text-[10px] text-stone-400">
                                                        {(p.images?.length || 1)} photo(s) &bull;{' '}
                                                        {isStockHidden ? 'Stock Hidden' : `${p.stock} in stock`}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                                {/* Toggle Hide Stock vs Tracked Stock */}
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        onUpdateStock(p.id, isStockHidden ? 5 : null)
                                                    }
                                                    title={
                                                        isStockHidden
                                                            ? 'Click to enable stock counter'
                                                            : 'Click to clear & hide stock badge'
                                                    }
                                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border flex items-center gap-1 cursor-pointer ${isStockHidden
                                                            ? 'bg-stone-100 text-stone-600 border-stone-300'
                                                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                                        }`}
                                                >
                                                    <EyeOff className="w-3 h-3" />
                                                    {isStockHidden ? 'Hidden' : 'Hide'}
                                                </button>

                                                <button
                                                    type="button"
                                                    aria-label={`Decrease stock for ${p.name}`}
                                                    onClick={() =>
                                                        onUpdateStock(
                                                            p.id,
                                                            Math.max(0, (Number(p.stock) || 0) - 1)
                                                        )
                                                    }
                                                    className="w-7 h-7 rounded-full border border-stone-300 flex items-center justify-center hover:border-[#9A7B56] cursor-pointer"
                                                >
                                                    <Minus className="w-3 h-3" />
                                                </button>

                                                <input
                                                    type="number"
                                                    min="0"
                                                    placeholder="—"
                                                    aria-label={`Stock quantity for ${p.name}`}
                                                    value={isStockHidden ? '' : p.stock}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        onUpdateStock(
                                                            p.id,
                                                            val === '' ? null : Math.max(0, parseInt(val, 10) || 0)
                                                        );
                                                    }}
                                                    className="w-14 text-center py-1 rounded-lg border border-stone-200 text-xs font-bold placeholder:text-stone-400"
                                                />

                                                <button
                                                    type="button"
                                                    aria-label={`Increase stock for ${p.name}`}
                                                    onClick={() =>
                                                        onUpdateStock(p.id, (Number(p.stock) || 0) + 1)
                                                    }
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
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 2: CUSTOMER REVIEW MODERATION */}
                {activeTab === 'reviews' && (
                    <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar space-y-4 max-h-[75vh]">
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
                                        className="p-4 sm:p-5 rounded-2xl bg-[#FAF8F5] border border-stone-200 space-y-3"
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
                                                    <Trash2 className="w-3.5 h-3.5" /> Delete
                                                </button>
                                            </div>
                                        </div>

                                        <p className="text-xs text-stone-700 bg-white p-3 rounded-xl border border-stone-200/80">
                                            "{rev.comment}"
                                        </p>

                                        <div className="flex flex-col sm:flex-row gap-2 pt-1">
                                            <input
                                                type="text"
                                                maxLength={500}
                                                value={draftValue}
                                                onChange={(e) =>
                                                    setReplyDrafts({ ...replyDrafts, [rev.id]: e.target.value })
                                                }
                                                placeholder="Write an official SJ Home Interiors response..."
                                                className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-stone-200 text-xs placeholder:text-stone-400"
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