import { useState, useMemo, useEffect } from 'react';
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
    Settings,
    Search,
    Save,
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
    siteSettings,
    onSaveSiteSettings,
}) {
    const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'reviews' | 'settings'
    const [copied, setCopied] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [replyDrafts, setReplyDrafts] = useState({});
    const [formError, setFormError] = useState('');
    const [prodForm, setProdForm] = useState(EMPTY_FORM);

    // Admin Database Inventory Search & Filter States
    const [invSearch, setInvSearch] = useState('');
    const [invCategoryFilter, setInvCategoryFilter] = useState('All');
    const [invStockFilter, setInvStockFilter] = useState('All'); // 'All' | 'in_stock' | 'out_of_stock' | 'hidden'

    // Site & Payment Settings Form State
    const [settingsForm, setSettingsForm] = useState(siteSettings || {});
    const [heroUrlInput, setHeroUrlInput] = useState('');
    const [settingsSavedMsg, setSettingsSavedMsg] = useState('');

    useEffect(() => {
        if (siteSettings) {
            setSettingsForm(siteSettings);
        }
    }, [siteSettings]);

    const categoryKeys = Object.keys(CATEGORY_TAXONOMY);

    // Filtered Admin Inventory List
    const filteredInventory = useMemo(() => {
        const q = invSearch.trim().toLowerCase();
        return products.filter((p) => {
            const matchesQuery =
                !q ||
                p.name.toLowerCase().includes(q) ||
                (p.id || '').toLowerCase().includes(q) ||
                (p.subcategory || '').toLowerCase().includes(q) ||
                (p.description || '').toLowerCase().includes(q);

            const matchesCat =
                invCategoryFilter === 'All' || p.category === invCategoryFilter;

            const isHidden = p.stock === null || p.stock === undefined || p.stock === '';
            let matchesStock = true;
            if (invStockFilter === 'hidden') matchesStock = isHidden;
            else if (invStockFilter === 'in_stock') matchesStock = !isHidden && Number(p.stock) > 0;
            else if (invStockFilter === 'out_of_stock')
                matchesStock = !isHidden && Number(p.stock) === 0;

            return matchesQuery && matchesCat && matchesStock;
        });
    }, [products, invSearch, invCategoryFilter, invStockFilter]);

    if (!isOpen || currentUser?.role !== 'admin') return null;

    const handleCategoryChange = (newCat) => {
        setProdForm((prev) => ({
            ...prev,
            category: newCat,
            subcategory: '',
        }));
    };

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

        const rawPrev = prodForm.previousPrice.toString().trim();
        const parsedPrevPrice =
            rawPrev !== '' && !Number.isNaN(parseFloat(rawPrev)) && parseFloat(rawPrev) > 0
                ? parseFloat(rawPrev)
                : null;

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

    // Hero Slideshow Image Handlers
    const handleAddHeroSlideUrl = () => {
        const safeUrl = validateSafeImageUrl(heroUrlInput);
        if (!safeUrl) return;
        setSettingsForm((prev) => ({
            ...prev,
            heroImages: [...(prev.heroImages || []), safeUrl],
        }));
        setHeroUrlInput('');
    };

    const handleUploadHeroSlide = (e) => {
        const files = Array.from(e.target.files || []);
        files.forEach((file) => {
            const check = validateImageFile(file);
            if (!check.valid) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                const safeUrl = validateSafeImageUrl(ev.target.result);
                if (safeUrl) {
                    setSettingsForm((prev) => ({
                        ...prev,
                        heroImages: [...(prev.heroImages || []), safeUrl],
                    }));
                }
            };
            reader.readAsDataURL(file);
        });
        e.target.value = '';
    };

    const handleRemoveHeroSlide = (idx) => {
        setSettingsForm((prev) => ({
            ...prev,
            heroImages: (prev.heroImages || []).filter((_, i) => i !== idx),
        }));
    };

    const handleSaveSettingsSubmit = async (e) => {
        e.preventDefault();
        await onSaveSiteSettings(settingsForm);
        setSettingsSavedMsg('Site & Payment Settings saved to Cloudflare D1!');
        setTimeout(() => setSettingsSavedMsg(''), 4000);
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
                            Storefront, Inventory & Payment Control
                        </h2>
                    </div>

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
                            onClick={() => setActiveTab('settings')}
                            className={`px-3.5 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition ${activeTab === 'settings'
                                    ? 'bg-[#9A7B56] text-white'
                                    : 'bg-white/10 text-stone-300 hover:bg-white/20'
                                }`}
                        >
                            <Settings className="w-3.5 h-3.5" /> Site & Payment Settings
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

                        <button
                            type="button"
                            onClick={onUndoLastAction}
                            disabled={!canUndo}
                            title={canUndo ? `Undo: ${lastActionLabel}` : 'No recent action to undo'}
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

                {/* TAB 1: INVENTORY & PRODUCT CRUD WITH SEARCH & FILTERS */}
                {activeTab === 'inventory' && (
                    <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
                        {/* Left: Add / Edit Product Form */}
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

                                {prodForm.images.length > 0 && (
                                    <div className="flex items-center gap-2 overflow-x-auto pt-2 pb-1">
                                        {prodForm.images.map((imgSrc, idx) => (
                                            <div
                                                key={idx}
                                                className="relative w-16 h-16 rounded-xl overflow-hidden border border-stone-200 shrink-0"
                                            >
                                                <img
                                                    src={imgSrc}
                                                    alt={`Preview ${idx + 1}`}
                                                    className="w-full h-full object-cover"
                                                />
                                                <span className="absolute bottom-0.5 left-1 px-1 rounded bg-black/70 text-[9px] text-white font-bold">
                                                    {idx === 0 ? 'Main' : `#${idx + 1}`}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveGalleryImage(idx)}
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

                        {/* Right: Searchable & Filterable Database Inventory List */}
                        <div className="lg:col-span-7 space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <h3 className="font-serif text-xl font-bold text-[#1C1B18]">
                                    Database Inventory ({filteredInventory.length} of {products.length} Items)
                                </h3>
                                {(invSearch || invCategoryFilter !== 'All' || invStockFilter !== 'All') && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setInvSearch('');
                                            setInvCategoryFilter('All');
                                            setInvStockFilter('All');
                                        }}
                                        className="text-xs font-semibold text-[#9A7B56] hover:underline cursor-pointer"
                                    >
                                        Reset Filters
                                    </button>
                                )}
                            </div>

                            {/* Search & Filter Bar */}
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-[#FAF8F5] p-3 rounded-2xl border border-stone-200">
                                <div className="sm:col-span-6 relative">
                                    <input
                                        type="search"
                                        value={invSearch}
                                        onChange={(e) => setInvSearch(e.target.value)}
                                        placeholder="Search inventory by title, subcategory, ID..."
                                        className="w-full pl-8 pr-3 py-2 rounded-xl bg-white border border-stone-200 text-xs focus:outline-none focus:border-[#9A7B56]"
                                    />
                                    <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
                                </div>

                                <div className="sm:col-span-3">
                                    <select
                                        value={invCategoryFilter}
                                        onChange={(e) => setInvCategoryFilter(e.target.value)}
                                        aria-label="Filter inventory by category"
                                        className="w-full px-2.5 py-2 rounded-xl bg-white border border-stone-200 text-xs text-stone-700"
                                    >
                                        <option value="All">All Categories</option>
                                        {categoryKeys.map((cat) => (
                                            <option key={cat} value={cat}>
                                                {cat}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="sm:col-span-3">
                                    <select
                                        value={invStockFilter}
                                        onChange={(e) => setInvStockFilter(e.target.value)}
                                        aria-label="Filter inventory by stock status"
                                        className="w-full px-2.5 py-2 rounded-xl bg-white border border-stone-200 text-xs text-stone-700"
                                    >
                                        <option value="All">All Stock States</option>
                                        <option value="in_stock">In Stock (&gt;0)</option>
                                        <option value="out_of_stock">Out of Stock (0)</option>
                                        <option value="hidden">Stock Hidden</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
                                {filteredInventory.length === 0 ? (
                                    <div className="p-8 text-center rounded-2xl bg-[#FAF8F5] border border-stone-200 text-xs text-stone-500">
                                        No products match your current search or filter criteria.
                                    </div>
                                ) : (
                                    filteredInventory.map((p) => {
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
                                                            {p.images?.length || 1} photo(s) &bull;{' '}
                                                            {isStockHidden ? 'Stock Hidden' : `${p.stock} in stock`}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                                    <button
                                                        type="button"
                                                        onClick={() => onUpdateStock(p.id, isStockHidden ? 5 : null)}
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
                                                        onClick={() =>
                                                            onUpdateStock(p.id, Math.max(0, (Number(p.stock) || 0) - 1))
                                                        }
                                                        className="w-7 h-7 rounded-full border border-stone-300 flex items-center justify-center hover:border-[#9A7B56] cursor-pointer"
                                                    >
                                                        <Minus className="w-3 h-3" />
                                                    </button>

                                                    <input
                                                        type="number"
                                                        min="0"
                                                        placeholder="—"
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
                                                        onClick={() => onUpdateStock(p.id, (Number(p.stock) || 0) + 1)}
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
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 2: SITE, HERO SLIDESHOW, SOCIAL LINKS & PAYMENT SETTINGS */}
                {activeTab === 'settings' && (
                    <form
                        onSubmit={handleSaveSettingsSubmit}
                        className="p-4 sm:p-6 overflow-y-auto custom-scrollbar space-y-6 max-h-[78vh]"
                    >
                        {settingsSavedMsg && (
                            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                                <span>{settingsSavedMsg}</span>
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Section A: Payment & Maintenance Mode Control */}
                            <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-stone-200 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-serif text-xl font-bold text-[#1C1B18]">
                                            1. Payment & Checkout Control
                                        </h3>
                                        <p className="text-[11px] text-stone-500">
                                            Enable or disable checkout on the basket page.
                                        </p>
                                    </div>

                                    <label className="inline-flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={settingsForm.paymentEnabled !== false}
                                            onChange={(e) =>
                                                setSettingsForm({
                                                    ...settingsForm,
                                                    paymentEnabled: e.target.checked,
                                                })
                                            }
                                            className="w-4 h-4 accent-emerald-700"
                                        />
                                        <span
                                            className={`text-xs font-bold px-2.5 py-1 rounded-full ${settingsForm.paymentEnabled !== false
                                                    ? 'bg-emerald-100 text-emerald-800'
                                                    : 'bg-amber-100 text-amber-800'
                                                }`}
                                        >
                                            {settingsForm.paymentEnabled !== false
                                                ? 'Payments Enabled'
                                                : 'Maintenance Mode (Disabled)'}
                                        </span>
                                    </label>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                                        Maintenance Mode Message (Shown when payments are disabled)
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={settingsForm.paymentMaintenanceMessage || ''}
                                        onChange={(e) =>
                                            setSettingsForm({
                                                ...settingsForm,
                                                paymentMaintenanceMessage: e.target.value,
                                            })
                                        }
                                        placeholder="Payment section currently under maintenance. Please contact us here."
                                        className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs"
                                    />
                                </div>

                                <div className="space-y-2 pt-2 border-t border-stone-200 text-xs">
                                    <span className="font-semibold text-stone-700 block">
                                        Accepted Checkout Options (When Enabled):
                                    </span>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={settingsForm.allowCashOnDelivery !== false}
                                            onChange={(e) =>
                                                setSettingsForm({
                                                    ...settingsForm,
                                                    allowCashOnDelivery: e.target.checked,
                                                })
                                            }
                                        />
                                        <span>Pay on Delivery (Cash or Card Terminal)</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={settingsForm.allowShowroomPayment !== false}
                                            onChange={(e) =>
                                                setSettingsForm({
                                                    ...settingsForm,
                                                    allowShowroomPayment: e.target.checked,
                                                })
                                            }
                                        />
                                        <span>Reserve Online & Pay in Maltby Showroom</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={Boolean(settingsForm.allowBankTransfer)}
                                            onChange={(e) =>
                                                setSettingsForm({
                                                    ...settingsForm,
                                                    allowBankTransfer: e.target.checked,
                                                })
                                            }
                                        />
                                        <span>Direct Bank Transfer (BACS)</span>
                                    </label>

                                    {settingsForm.allowBankTransfer && (
                                        <textarea
                                            rows={2}
                                            value={settingsForm.bankTransferInstructions || ''}
                                            onChange={(e) =>
                                                setSettingsForm({
                                                    ...settingsForm,
                                                    bankTransferInstructions: e.target.value,
                                                })
                                            }
                                            placeholder="Enter Account Name, Sort Code, and Account Number..."
                                            className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs mt-1"
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Section B: Contact Info, Facebook & WhatsApp */}
                            <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-stone-200 space-y-3.5">
                                <h3 className="font-serif text-xl font-bold text-[#1C1B18]">
                                    2. Showroom Contact & Social Links
                                </h3>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                                            Showroom Phone Number
                                        </label>
                                        <input
                                            type="text"
                                            value={settingsForm.phone || ''}
                                            onChange={(e) =>
                                                setSettingsForm({ ...settingsForm, phone: e.target.value })
                                            }
                                            placeholder="e.g. 07830 141250"
                                            className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                                            Showroom Email Address
                                        </label>
                                        <input
                                            type="email"
                                            value={settingsForm.email || ''}
                                            onChange={(e) =>
                                                setSettingsForm({ ...settingsForm, email: e.target.value })
                                            }
                                            placeholder="e.g. info@sjhomeinteriors.co.uk"
                                            className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                                        Showroom Physical Address
                                    </label>
                                    <input
                                        type="text"
                                        value={settingsForm.address || ''}
                                        onChange={(e) =>
                                            setSettingsForm({ ...settingsForm, address: e.target.value })
                                        }
                                        placeholder="High Street, Maltby, Rotherham, S66 8JE"
                                        className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                                        Opening Hours
                                    </label>
                                    <input
                                        type="text"
                                        value={settingsForm.openingHours || ''}
                                        onChange={(e) =>
                                            setSettingsForm({ ...settingsForm, openingHours: e.target.value })
                                        }
                                        placeholder="Mon–Sat: 10:00 AM – 5:00 PM | Sun: Closed"
                                        className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                    <div>
                                        <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                                            Facebook Page Link (Appears if filled)
                                        </label>
                                        <input
                                            type="url"
                                            value={settingsForm.facebookUrl || ''}
                                            onChange={(e) =>
                                                setSettingsForm({ ...settingsForm, facebookUrl: e.target.value })
                                            }
                                            placeholder="https://facebook.com/..."
                                            className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                                            WhatsApp Number or Link (Appears if filled)
                                        </label>
                                        <input
                                            type="text"
                                            value={settingsForm.whatsappNumber || ''}
                                            onChange={(e) =>
                                                setSettingsForm({ ...settingsForm, whatsappNumber: e.target.value })
                                            }
                                            placeholder="e.g. 07830141250 or https://wa.me/..."
                                            className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section C: Main Page Text */}
                            <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-stone-200 space-y-3.5">
                                <h3 className="font-serif text-xl font-bold text-[#1C1B18]">
                                    3. Main Page Text & Headings
                                </h3>

                                <div>
                                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                                        Top Announcement Bar Text
                                    </label>
                                    <input
                                        type="text"
                                        value={settingsForm.announcementText || ''}
                                        onChange={(e) =>
                                            setSettingsForm({ ...settingsForm, announcementText: e.target.value })
                                        }
                                        placeholder="Visit Our Maltby Showroom • Fast Local Delivery"
                                        className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                                        Hero Small Badge Text
                                    </label>
                                    <input
                                        type="text"
                                        value={settingsForm.heroBadge || ''}
                                        onChange={(e) =>
                                            setSettingsForm({ ...settingsForm, heroBadge: e.target.value })
                                        }
                                        placeholder="Maltby Showroom & Online Collection"
                                        className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                                        Main Hero Headline
                                    </label>
                                    <input
                                        type="text"
                                        value={settingsForm.heroTitle || ''}
                                        onChange={(e) =>
                                            setSettingsForm({ ...settingsForm, heroTitle: e.target.value })
                                        }
                                        placeholder="Luxury Sofas, Beds & Timeless Living"
                                        className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                                        Main Hero Description Paragraph
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={settingsForm.heroSubtitle || ''}
                                        onChange={(e) =>
                                            setSettingsForm({ ...settingsForm, heroSubtitle: e.target.value })
                                        }
                                        placeholder="Handcrafted comfort tailored for British homes..."
                                        className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs"
                                    />
                                </div>
                            </div>

                            {/* Section D: Main Page Hero Slideshow Images */}
                            <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-stone-200 space-y-3.5">
                                <h3 className="font-serif text-xl font-bold text-[#1C1B18]">
                                    4. Main Page Slideshow Pictures
                                </h3>
                                <p className="text-[11px] text-stone-500">
                                    Add multiple pictures of your showroom or furniture to create an interactive
                                    slideshow at the top of the home page.
                                </p>

                                <div className="flex flex-wrap gap-2">
                                    <input
                                        type="text"
                                        value={heroUrlInput}
                                        onChange={(e) => setHeroUrlInput(e.target.value)}
                                        placeholder="Paste https:// image URL..."
                                        className="flex-1 min-w-[160px] px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddHeroSlideUrl}
                                        className="px-3.5 py-2 rounded-xl bg-[#1C1B18] text-white text-xs font-semibold cursor-pointer hover:bg-[#9A7B56]"
                                    >
                                        + Add Slide URL
                                    </button>
                                    <label className="px-3.5 py-2 rounded-xl bg-white border border-stone-200 hover:border-[#9A7B56] text-xs font-semibold cursor-pointer flex items-center gap-1">
                                        <Upload className="w-3.5 h-3.5 text-[#9A7B56]" /> Upload Slide Photos
                                        <input
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp"
                                            multiple
                                            onChange={handleUploadHeroSlide}
                                            className="hidden"
                                        />
                                    </label>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                                    {(settingsForm.heroImages || []).map((imgUrl, idx) => (
                                        <div
                                            key={idx}
                                            className="relative aspect-[4/3] rounded-xl overflow-hidden border border-stone-200 bg-stone-100"
                                        >
                                            <img
                                                src={imgUrl}
                                                alt={`Slide ${idx + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                            <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded bg-black/70 text-[10px] text-white font-bold">
                                                Slide #{idx + 1}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveHeroSlide(idx)}
                                                className="absolute top-1.5 right-1.5 p-1 rounded-full bg-red-600 text-white cursor-pointer"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                type="submit"
                                className="px-8 py-4 rounded-full bg-[#1C1B18] hover:bg-[#9A7B56] text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition cursor-pointer shadow-lg"
                            >
                                <Save className="w-4 h-4" /> Save All Site & Payment Settings
                            </button>
                        </div>
                    </form>
                )}

                {/* TAB 3: CUSTOMER REVIEW MODERATION */}
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