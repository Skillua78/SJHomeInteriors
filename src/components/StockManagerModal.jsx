import { useState, useMemo, useEffect, useRef } from 'react';
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
    Ruler,
    Layers,
    Palette,
} from 'lucide-react';
import { CATEGORY_TAXONOMY, colorMap, VARIATION_PRESETS } from '../data/products';
import { resolveColorHex } from './ProductCard';
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
    selectedColors: [],
    imageInput: '',
    images: [],
    fabrics: [],
    sizes: [],
    mattresses: [],
    liftOptions: [],
    structuredDimensions: {
        default: { length: '', width: '', depth: '', custom: '' },
        bySize: {},
    },
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
    initialEditProduct,
    onClearInitialEdit,
}) {
    const [activeTab, setActiveTab] = useState('inventory');
    const [copied, setCopied] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [replyDrafts, setReplyDrafts] = useState({});
    const [formError, setFormError] = useState('');
    const [prodForm, setProdForm] = useState(EMPTY_FORM);

    // Colour & Finish Autocomplete states
    const [colorQuery, setColorQuery] = useState('');
    const [customColorHex, setCustomColorHex] = useState('#8C8C8C');

    // Custom Category & Subcategory creator inputs
    const [showNewCatInput, setShowNewCatInput] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [showNewSubInput, setShowNewSubInput] = useState(false);
    const [newSubcategoryName, setNewSubcategoryName] = useState('');

    // Custom Variation inputs
    const [customFabricInput, setCustomFabricInput] = useState('');
    const [customSizeInput, setCustomSizeInput] = useState('');
    const [customMattressInput, setCustomMattressInput] = useState('');
    const [customLiftInput, setCustomLiftInput] = useState('');

    // Active Dimension Size Tab ('default' or a selected size like '4ft6', '5ft')
    const [activeDimSizeKey, setActiveDimSizeKey] = useState('default');

    // Inventory Search & Filter States
    const [invSearch, setInvSearch] = useState('');
    const [invCategoryFilter, setInvCategoryFilter] = useState('All');
    const [invStockFilter, setInvStockFilter] = useState('All');

    // Site Settings State
    const [settingsForm, setSettingsForm] = useState(siteSettings || {});
    const [heroUrlInput, setHeroUrlInput] = useState('');
    const [settingsSavedMsg, setSettingsSavedMsg] = useState('');

    const formRef = useRef(null);

    useEffect(() => {
        if (siteSettings) {
            setSettingsForm(siteSettings);
        }
    }, [siteSettings]);

    // Combined Taxonomy (Built-in + Admin Custom Categories + Categories on Existing Products)
    const mergedTaxonomy = useMemo(() => {
        const map = { ...CATEGORY_TAXONOMY };
        const customCats = siteSettings?.customCategories || {};
        Object.keys(customCats).forEach((cat) => {
            const existing = map[cat] || [];
            map[cat] = Array.from(new Set([...existing, ...(customCats[cat] || [])]));
        });
        products.forEach((p) => {
            if (p.category) {
                if (!map[p.category]) map[p.category] = [];
                if (p.subcategory && !map[p.category].includes(p.subcategory)) {
                    map[p.category] = [...map[p.category], p.subcategory];
                }
            }
        });
        return map;
    }, [siteSettings, products]);

    const categoryKeys = Object.keys(mergedTaxonomy);

    // Combined Colour Swatch Dictionary
    const allColorNames = useMemo(() => {
        const custom = siteSettings?.customColors || {};
        return Array.from(new Set([...Object.keys(colorMap), ...Object.keys(custom)]));
    }, [siteSettings]);

    // Autocomplete Suggestions as Admin Types (e.g. "bl" -> Black, Blue, Navy Blue, Blush Pink)
    const matchingColorSuggestions = useMemo(() => {
        const q = colorQuery.trim().toLowerCase();
        if (!q) return allColorNames;
        // Prioritize prefix matches (starts with "bl") then substring matches
        const startsWith = allColorNames.filter((c) => c.toLowerCase().startsWith(q));
        const includes = allColorNames.filter(
            (c) => !c.toLowerCase().startsWith(q) && c.toLowerCase().includes(q)
        );
        return [...startsWith, ...includes];
    }, [colorQuery, allColorNames]);

    // Load product for editing when triggered from ProductCard or SpecModal
    const populateFormForEdit = (p) => {
        setActiveTab('inventory');
        setEditingId(p.id);
        const existingGallery =
            Array.isArray(p.images) && p.images.length > 0
                ? p.images
                : p.image
                    ? [p.image]
                    : [];

        const v = p.variations || {};
        const existingStructDims = v.structuredDimensions || {
            default: {
                length: '',
                width: '',
                depth: '',
                custom: (p.dimensions || []).join(', '),
            },
            bySize: {},
        };

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
            selectedColors: Array.isArray(p.colors) ? p.colors : [],
            imageInput: '',
            images: existingGallery,
            fabrics: Array.isArray(v.fabrics) ? v.fabrics : [],
            sizes: Array.isArray(v.sizes) ? v.sizes : [],
            mattresses: Array.isArray(v.mattresses) ? v.mattresses : [],
            liftOptions: Array.isArray(v.liftOptions) ? v.liftOptions : [],
            structuredDimensions: {
                default: {
                    length: existingStructDims.default?.length || '',
                    width: existingStructDims.default?.width || '',
                    depth: existingStructDims.default?.depth || '',
                    custom: existingStructDims.default?.custom || '',
                },
                bySize: existingStructDims.bySize || {},
            },
            features: (p.features || []).join(', '),
            isPopular: Boolean(p.isPopular),
            isTrending: Boolean(p.isTrending),
        });
        setActiveDimSizeKey('default');
        setTimeout(() => {
            formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 80);
    };

    useEffect(() => {
        if (isOpen && initialEditProduct) {
            populateFormForEdit(initialEditProduct);
            if (onClearInitialEdit) onClearInitialEdit();
        }
    }, [isOpen, initialEditProduct]);

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

    // Toggle colour selection
    const toggleColorSelection = (colorName) => {
        setProdForm((prev) => {
            const exists = prev.selectedColors.includes(colorName);
            return {
                ...prev,
                selectedColors: exists
                    ? prev.selectedColors.filter((c) => c !== colorName)
                    : [...prev.selectedColors, colorName],
            };
        });
    };

    // Add custom typed colour/finish (and save custom hex swatch if new)
    const handleAddCustomColor = async () => {
        const clean = sanitizeText(colorQuery.trim(), 35);
        if (!clean) return;

        // Check if there's an exact case-insensitive match in known colours
        const existingMatch = allColorNames.find(
            (c) => c.toLowerCase() === clean.toLowerCase()
        );
        const finalName = existingMatch || clean;

        if (!prodForm.selectedColors.includes(finalName)) {
            setProdForm((prev) => ({
                ...prev,
                selectedColors: [...prev.selectedColors, finalName],
            }));
        }

        // If brand new custom colour, save its hex swatch into siteSettings
        if (!existingMatch && onSaveSiteSettings) {
            const updatedSettings = {
                ...siteSettings,
                customColors: {
                    ...(siteSettings?.customColors || {}),
                    [finalName]: customColorHex,
                },
            };
            setSettingsForm(updatedSettings);
            await onSaveSiteSettings(updatedSettings);
        }

        setColorQuery('');
    };

    // Toggle variation item in array ('fabrics' | 'sizes' | 'mattresses' | 'liftOptions')
    const toggleVariationItem = (field, value) => {
        setProdForm((prev) => {
            const list = prev[field] || [];
            const exists = list.includes(value);
            return {
                ...prev,
                [field]: exists ? list.filter((x) => x !== value) : [...list, value],
            };
        });
    };

    const addCustomVariationItem = (field, rawInput, clearInputFn) => {
        const clean = sanitizeText(rawInput.trim(), 50);
        if (!clean) return;
        setProdForm((prev) => {
            const list = prev[field] || [];
            if (list.includes(clean)) return prev;
            return { ...prev, [field]: [...list, clean] };
        });
        clearInputFn('');
    };

    // Update structured dimension field for either 'default' or a specific size
    const updateStructuredDimension = (sizeKey, dimField, value) => {
        setProdForm((prev) => {
            const currentStruct = prev.structuredDimensions || { default: {}, bySize: {} };
            if (sizeKey === 'default') {
                return {
                    ...prev,
                    structuredDimensions: {
                        ...currentStruct,
                        default: {
                            ...(currentStruct.default || {}),
                            [dimField]: value,
                        },
                    },
                };
            }
            return {
                ...prev,
                structuredDimensions: {
                    ...currentStruct,
                    bySize: {
                        ...(currentStruct.bySize || {}),
                        [sizeKey]: {
                            ...(currentStruct.bySize?.[sizeKey] || {}),
                            [dimField]: value,
                        },
                    },
                },
            };
        });
    };

    // Add New Custom Category
    const handleAddCustomCategory = async () => {
        const cleanCat = sanitizeText(newCategoryName.trim(), 40);
        if (!cleanCat) return;
        const updatedCustomCats = {
            ...(siteSettings?.customCategories || {}),
            [cleanCat]: siteSettings?.customCategories?.[cleanCat] || [],
        };
        const nextSettings = { ...siteSettings, customCategories: updatedCustomCats };
        setSettingsForm(nextSettings);
        if (onSaveSiteSettings) await onSaveSiteSettings(nextSettings);
        setProdForm((prev) => ({ ...prev, category: cleanCat, subcategory: '' }));
        setNewCategoryName('');
        setShowNewCatInput(false);
    };

    // Add New Custom Subcategory
    const handleAddCustomSubcategory = async () => {
        const cleanSub = sanitizeText(newSubcategoryName.trim(), 40);
        if (!cleanSub || !prodForm.category) return;
        const currentSubs = mergedTaxonomy[prodForm.category] || [];
        const updatedCustomCats = {
            ...(siteSettings?.customCategories || {}),
            [prodForm.category]: Array.from(new Set([...currentSubs, cleanSub])),
        };
        const nextSettings = { ...siteSettings, customCategories: updatedCustomCats };
        setSettingsForm(nextSettings);
        if (onSaveSiteSettings) await onSaveSiteSettings(nextSettings);
        setProdForm((prev) => ({ ...prev, subcategory: cleanSub }));
        setNewSubcategoryName('');
        setShowNewSubInput(false);
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
            setFormError('Please select or add a department category.');
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

        // Also build a readable summary array in product.dimensions for backward compatibility
        const defDim = prodForm.structuredDimensions?.default || {};
        const summaryDims = [];
        if (defDim.length || defDim.width || defDim.depth) {
            summaryDims.push(
                [
                    defDim.length ? `Length: ${defDim.length}` : '',
                    defDim.width ? `Width: ${defDim.width}` : '',
                    defDim.depth ? `Depth: ${defDim.depth}` : '',
                ]
                    .filter(Boolean)
                    .join(' | ')
            );
        }
        if (defDim.custom) summaryDims.push(defDim.custom);

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
            colors: prodForm.selectedColors,
            image: finalGallery[0],
            images: finalGallery,
            dimensions: summaryDims,
            features: prodForm.features
                .split(',')
                .map((f) => sanitizeText(f, 120))
                .filter(Boolean),
            variations: {
                fabrics: prodForm.fabrics,
                sizes: prodForm.sizes,
                mattresses: prodForm.mattresses,
                liftOptions: prodForm.liftOptions,
                structuredDimensions: prodForm.structuredDimensions,
            },
        };

        if (editingId) {
            onUpdateProduct(payload);
            setEditingId(null);
        } else {
            onAddNewProduct(payload);
        }

        setProdForm(EMPTY_FORM);
        setActiveDimSizeKey('default');
    };

    // Hero Slideshow Handlers
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
        setSettingsSavedMsg('Site, Assembly & Payment Settings saved to Cloudflare D1!');
        setTimeout(() => setSettingsSavedMsg(''), 4000);
    };

    const copyProductsCode = () => {
        const codeString = `export const initialProducts = ${JSON.stringify(products, null, 2)};`;
        navigator.clipboard.writeText(codeString);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
    };

    const currentDimValues =
        activeDimSizeKey === 'default'
            ? prodForm.structuredDimensions?.default || {}
            : prodForm.structuredDimensions?.bySize?.[activeDimSizeKey] || {};

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label="SJ Home Interiors Admin Dashboard"
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-t-3xl sm:rounded-3xl max-w-6xl w-full max-h-[94vh] flex flex-col overflow-hidden shadow-2xl border border-stone-200"
            >
                {/* Sticky Top Header */}
                <div className="sticky top-0 z-30 p-4 sm:p-5 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3 bg-[#1C1B18] text-white">
                    <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 flex items-center gap-1">
                            <ShieldAlert className="w-3.5 h-3.5" /> Admin Dashboard ({currentUser.email})
                        </span>
                        <h2 className="font-serif text-xl sm:text-2xl font-bold mt-0.5">
                            Storefront, Variations & Inventory Control
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
                            className="w-9 h-9 rounded-full bg-white/10 hover:bg-red-600 text-white flex items-center justify-center cursor-pointer transition"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* TAB 1: INVENTORY & PRODUCT CRUD */}
                {activeTab === 'inventory' && (
                    <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
                        {/* Left 6 Cols: Add / Edit Form */}
                        <form
                            ref={formRef}
                            onSubmit={handleSaveProduct}
                            className="lg:col-span-6 space-y-4 bg-[#FAF8F5] p-4 sm:p-5 rounded-2xl border border-stone-200"
                        >
                            <div className="flex items-center justify-between">
                                <h3 className="font-serif text-xl font-bold text-[#1C1B18]">
                                    {editingId ? `Editing: ${prodForm.name}` : '+ Add New Furniture Item'}
                                </h3>
                                {editingId && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditingId(null);
                                            setProdForm(EMPTY_FORM);
                                        }}
                                        className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold hover:bg-red-200 cursor-pointer"
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
                                    placeholder="e.g. Kensington Wingback Ottoman Bed"
                                    className="w-full px-3 py-2.5 rounded-xl bg-white border border-stone-200 text-xs placeholder:text-stone-400"
                                />
                            </div>

                            {/* Category & Subcategory with "+ Custom" Creator */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="text-[11px] font-semibold text-stone-700">
                                            Department Category *
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setShowNewCatInput(!showNewCatInput)}
                                            className="text-[10px] font-bold text-[#9A7B56] hover:underline cursor-pointer"
                                        >
                                            {showNewCatInput ? 'Cancel' : '+ New Category'}
                                        </button>
                                    </div>
                                    {showNewCatInput ? (
                                        <div className="flex gap-1.5">
                                            <input
                                                type="text"
                                                value={newCategoryName}
                                                onChange={(e) => setNewCategoryName(e.target.value)}
                                                placeholder="e.g. Mirrors"
                                                className="flex-1 px-2.5 py-2 rounded-xl bg-white border border-stone-200 text-xs"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleAddCustomCategory}
                                                className="px-3 py-2 rounded-xl bg-[#1C1B18] text-white text-xs font-semibold cursor-pointer"
                                            >
                                                Add
                                            </button>
                                        </div>
                                    ) : (
                                        <select
                                            required
                                            value={prodForm.category}
                                            onChange={(e) =>
                                                setProdForm({ ...prodForm, category: e.target.value, subcategory: '' })
                                            }
                                            className="w-full px-2.5 py-2.5 rounded-xl bg-white border border-stone-200 text-xs text-stone-700"
                                        >
                                            <option value="">Select category...</option>
                                            {categoryKeys.map((cat) => (
                                                <option key={cat} value={cat}>
                                                    {cat}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="text-[11px] font-semibold text-stone-700">
                                            Subcategory (Optional)
                                        </label>
                                        {prodForm.category && (
                                            <button
                                                type="button"
                                                onClick={() => setShowNewSubInput(!showNewSubInput)}
                                                className="text-[10px] font-bold text-[#9A7B56] hover:underline cursor-pointer"
                                            >
                                                {showNewSubInput ? 'Cancel' : '+ New Subcategory'}
                                            </button>
                                        )}
                                    </div>
                                    {showNewSubInput ? (
                                        <div className="flex gap-1.5">
                                            <input
                                                type="text"
                                                value={newSubcategoryName}
                                                onChange={(e) => setNewSubcategoryName(e.target.value)}
                                                placeholder="e.g. Velvet Beds"
                                                className="flex-1 px-2.5 py-2 rounded-xl bg-white border border-stone-200 text-xs"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleAddCustomSubcategory}
                                                className="px-3 py-2 rounded-xl bg-[#1C1B18] text-white text-xs font-semibold cursor-pointer"
                                            >
                                                Add
                                            </button>
                                        </div>
                                    ) : (
                                        <select
                                            value={prodForm.subcategory}
                                            onChange={(e) =>
                                                setProdForm({ ...prodForm, subcategory: e.target.value })
                                            }
                                            disabled={!prodForm.category}
                                            className="w-full px-2.5 py-2.5 rounded-xl bg-white border border-stone-200 text-xs text-stone-700 disabled:bg-stone-100"
                                        >
                                            <option value="">Select subcategory...</option>
                                            {(mergedTaxonomy[prodForm.category] || []).map((sub) => (
                                                <option key={sub} value={sub}>
                                                    {sub}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            </div>

                            {/* Price, Previous Price, Stock */}
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
                                        placeholder="e.g. 649.00"
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
                                        placeholder="e.g. 899.00 (Optional)"
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
                                    rows={2}
                                    value={prodForm.description}
                                    onChange={(e) =>
                                        setProdForm({ ...prodForm, description: e.target.value })
                                    }
                                    placeholder="Describe the craftsmanship, upholstery feel, comfort, and room styling..."
                                    className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs placeholder:text-stone-400"
                                />
                            </div>

                            {/* INTERACTIVE COLOUR & FINISH SELECTOR WITH AUTOCOMPLETE & SWATCH CIRCLES */}
                            <div className="p-3.5 rounded-xl bg-white border border-stone-200 space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-[11px] font-bold text-[#1C1B18] flex items-center gap-1.5">
                                        <Palette className="w-3.5 h-3.5 text-[#9A7B56]" />
                                        Colours & Finishes ({prodForm.selectedColors.length} selected)
                                    </label>
                                </div>

                                {/* Selected Colour Pills */}
                                {prodForm.selectedColors.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 pb-2 border-b border-stone-100">
                                        {prodForm.selectedColors.map((col) => (
                                            <span
                                                key={col}
                                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1C1B18] text-white text-[11px] font-semibold"
                                            >
                                                <span
                                                    className="w-3 h-3 rounded-full border border-white/40"
                                                    style={{
                                                        backgroundColor: resolveColorHex(col, siteSettings?.customColors),
                                                    }}
                                                />
                                                {col}
                                                <button
                                                    type="button"
                                                    onClick={() => toggleColorSelection(col)}
                                                    className="hover:text-red-300 cursor-pointer"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Autocomplete Input + Custom Swatch Colour Picker */}
                                <div className="flex flex-wrap items-center gap-2">
                                    <input
                                        type="text"
                                        value={colorQuery}
                                        onChange={(e) => setColorQuery(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                if (matchingColorSuggestions.length > 0 && colorQuery.trim()) {
                                                    toggleColorSelection(matchingColorSuggestions[0]);
                                                    setColorQuery('');
                                                } else {
                                                    handleAddCustomColor();
                                                }
                                            }
                                        }}
                                        placeholder="Type to filter or add (e.g. 'bl' -> Black, Blue)..."
                                        className="flex-1 min-w-[170px] px-3 py-2 rounded-xl bg-[#FAF8F5] border border-stone-200 text-xs placeholder:text-stone-400"
                                    />
                                    <input
                                        type="color"
                                        value={customColorHex}
                                        onChange={(e) => setCustomColorHex(e.target.value)}
                                        title="Pick swatch circle colour for custom finish"
                                        className="w-8 h-8 rounded-lg border border-stone-200 cursor-pointer bg-white p-0.5"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddCustomColor}
                                        className="px-3 py-2 rounded-xl bg-[#1C1B18] hover:bg-[#9A7B56] text-white text-xs font-semibold cursor-pointer"
                                    >
                                        + Add Custom
                                    </button>
                                </div>

                                {/* Clickable Colour Swatch Suggestions (Filters live as you type) */}
                                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1 custom-scrollbar">
                                    {matchingColorSuggestions.map((colorName) => {
                                        const isSelected = prodForm.selectedColors.includes(colorName);
                                        return (
                                            <button
                                                key={colorName}
                                                type="button"
                                                onClick={() => toggleColorSelection(colorName)}
                                                className={`px-2.5 py-1 rounded-full text-[11px] border flex items-center gap-1.5 cursor-pointer transition ${isSelected
                                                        ? 'border-[#9A7B56] bg-[#9A7B56]/15 text-[#1C1B18] font-bold'
                                                        : 'border-stone-200 bg-[#FAF8F5] text-stone-700 hover:border-[#9A7B56]'
                                                    }`}
                                            >
                                                <span
                                                    className="w-3 h-3 rounded-full border border-stone-400 shrink-0"
                                                    style={{
                                                        backgroundColor: resolveColorHex(colorName, siteSettings?.customColors),
                                                    }}
                                                />
                                                <span>{colorName}</span>
                                                {isSelected && <Check className="w-3 h-3 text-[#9A7B56]" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* AVAILABLE VARIATIONS BUILDER (Fabrics, Sizes, Mattresses, Lift Options) */}
                            <div className="p-3.5 rounded-xl bg-white border border-stone-200 space-y-3.5">
                                <label className="text-[11px] font-bold text-[#1C1B18] flex items-center gap-1.5">
                                    <Layers className="w-3.5 h-3.5 text-[#9A7B56]" />
                                    Available Variations (Click to toggle or add custom)
                                </label>

                                {/* 1. Fabrics */}
                                <div className="space-y-1.5">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
                                        Fabrics ({prodForm.fabrics.length} selected)
                                    </span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {Array.from(
                                            new Set([...VARIATION_PRESETS.fabrics, ...prodForm.fabrics])
                                        ).map((fab) => {
                                            const active = prodForm.fabrics.includes(fab);
                                            return (
                                                <button
                                                    key={fab}
                                                    type="button"
                                                    onClick={() => toggleVariationItem('fabrics', fab)}
                                                    className={`px-2.5 py-1 rounded-lg text-[11px] border cursor-pointer transition ${active
                                                            ? 'bg-[#1C1B18] text-white border-[#1C1B18] font-semibold'
                                                            : 'bg-[#FAF8F5] text-stone-700 border-stone-200 hover:border-[#9A7B56]'
                                                        }`}
                                                >
                                                    {fab}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <div className="flex gap-1.5 pt-1">
                                        <input
                                            type="text"
                                            value={customFabricInput}
                                            onChange={(e) => setCustomFabricInput(e.target.value)}
                                            placeholder="Add custom fabric (e.g. Bouclé, Chenille)..."
                                            className="flex-1 px-2.5 py-1.5 rounded-lg bg-[#FAF8F5] border border-stone-200 text-xs"
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                addCustomVariationItem('fabrics', customFabricInput, setCustomFabricInput)
                                            }
                                            className="px-2.5 py-1.5 rounded-lg bg-stone-800 text-white text-[11px] font-semibold cursor-pointer"
                                        >
                                            + Add
                                        </button>
                                    </div>
                                </div>

                                {/* 2. Sizes */}
                                <div className="space-y-1.5 pt-2 border-t border-stone-100">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
                                        Sizes ({prodForm.sizes.length} selected)
                                    </span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {Array.from(new Set([...VARIATION_PRESETS.sizes, ...prodForm.sizes])).map(
                                            (sz) => {
                                                const active = prodForm.sizes.includes(sz);
                                                return (
                                                    <button
                                                        key={sz}
                                                        type="button"
                                                        onClick={() => toggleVariationItem('sizes', sz)}
                                                        className={`px-2.5 py-1 rounded-lg text-[11px] border cursor-pointer transition ${active
                                                                ? 'bg-[#9A7B56] text-white border-[#9A7B56] font-bold'
                                                                : 'bg-[#FAF8F5] text-stone-700 border-stone-200 hover:border-[#9A7B56]'
                                                            }`}
                                                    >
                                                        {sz}
                                                    </button>
                                                );
                                            }
                                        )}
                                    </div>
                                    <div className="flex gap-1.5 pt-1">
                                        <input
                                            type="text"
                                            value={customSizeInput}
                                            onChange={(e) => setCustomSizeInput(e.target.value)}
                                            placeholder="Add custom size (e.g. 2ft6 Small Single, 3-Seater)..."
                                            className="flex-1 px-2.5 py-1.5 rounded-lg bg-[#FAF8F5] border border-stone-200 text-xs"
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                addCustomVariationItem('sizes', customSizeInput, setCustomSizeInput)
                                            }
                                            className="px-2.5 py-1.5 rounded-lg bg-stone-800 text-white text-[11px] font-semibold cursor-pointer"
                                        >
                                            + Add
                                        </button>
                                    </div>
                                </div>

                                {/* 3. Mattress Options */}
                                <div className="space-y-1.5 pt-2 border-t border-stone-100">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
                                        Mattress Options ({prodForm.mattresses.length} selected)
                                    </span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {Array.from(
                                            new Set([...VARIATION_PRESETS.mattresses, ...prodForm.mattresses])
                                        ).map((mat) => {
                                            const active = prodForm.mattresses.includes(mat);
                                            return (
                                                <button
                                                    key={mat}
                                                    type="button"
                                                    onClick={() => toggleVariationItem('mattresses', mat)}
                                                    className={`px-2.5 py-1 rounded-lg text-[11px] border cursor-pointer transition ${active
                                                            ? 'bg-[#1C1B18] text-white border-[#1C1B18] font-semibold'
                                                            : 'bg-[#FAF8F5] text-stone-700 border-stone-200 hover:border-[#9A7B56]'
                                                        }`}
                                                >
                                                    {mat}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <div className="flex gap-1.5 pt-1">
                                        <input
                                            type="text"
                                            value={customMattressInput}
                                            onChange={(e) => setCustomMattressInput(e.target.value)}
                                            placeholder="Add custom mattress option..."
                                            className="flex-1 px-2.5 py-1.5 rounded-lg bg-[#FAF8F5] border border-stone-200 text-xs"
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                addCustomVariationItem(
                                                    'mattresses',
                                                    customMattressInput,
                                                    setCustomMattressInput
                                                )
                                            }
                                            className="px-2.5 py-1.5 rounded-lg bg-stone-800 text-white text-[11px] font-semibold cursor-pointer"
                                        >
                                            + Add
                                        </button>
                                    </div>
                                </div>

                                {/* 4. Lift Options */}
                                <div className="space-y-1.5 pt-2 border-t border-stone-100">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
                                        Lift Options ({prodForm.liftOptions.length} selected)
                                    </span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {Array.from(
                                            new Set([...VARIATION_PRESETS.liftOptions, ...prodForm.liftOptions])
                                        ).map((lift) => {
                                            const active = prodForm.liftOptions.includes(lift);
                                            return (
                                                <button
                                                    key={lift}
                                                    type="button"
                                                    onClick={() => toggleVariationItem('liftOptions', lift)}
                                                    className={`px-2.5 py-1 rounded-lg text-[11px] border cursor-pointer transition ${active
                                                            ? 'bg-[#1C1B18] text-white border-[#1C1B18] font-semibold'
                                                            : 'bg-[#FAF8F5] text-stone-700 border-stone-200 hover:border-[#9A7B56]'
                                                        }`}
                                                >
                                                    {lift}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <div className="flex gap-1.5 pt-1">
                                        <input
                                            type="text"
                                            value={customLiftInput}
                                            onChange={(e) => setCustomLiftInput(e.target.value)}
                                            placeholder="Add custom lift/storage option..."
                                            className="flex-1 px-2.5 py-1.5 rounded-lg bg-[#FAF8F5] border border-stone-200 text-xs"
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                addCustomVariationItem('liftOptions', customLiftInput, setCustomLiftInput)
                                            }
                                            className="px-2.5 py-1.5 rounded-lg bg-stone-800 text-white text-[11px] font-semibold cursor-pointer"
                                        >
                                            + Add
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* SPLIT DIMENSIONS (Length, Width, Depth + Custom) WITH PER-SIZE TABS */}
                            <div className="p-3.5 rounded-xl bg-white border border-stone-200 space-y-3">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <label className="text-[11px] font-bold text-[#1C1B18] flex items-center gap-1.5">
                                        <Ruler className="w-3.5 h-3.5 text-[#9A7B56]" />
                                        Dimensions (Length, Width, Depth & Custom)
                                    </label>
                                    {prodForm.sizes.length > 0 && (
                                        <span className="text-[10px] text-stone-500">
                                            Click a size below to set size-specific dimensions:
                                        </span>
                                    )}
                                </div>

                                {/* Size Switcher Tabs for Dynamic Dimensions */}
                                {prodForm.sizes.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 pb-1">
                                        <button
                                            type="button"
                                            onClick={() => setActiveDimSizeKey('default')}
                                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer ${activeDimSizeKey === 'default'
                                                    ? 'bg-[#1C1B18] text-white'
                                                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                                                }`}
                                        >
                                            Default / Base
                                        </button>
                                        {prodForm.sizes.map((sz) => (
                                            <button
                                                key={sz}
                                                type="button"
                                                onClick={() => setActiveDimSizeKey(sz)}
                                                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer ${activeDimSizeKey === sz
                                                        ? 'bg-[#9A7B56] text-white'
                                                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                                                    }`}
                                            >
                                                Size: {sz}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                <div className="grid grid-cols-3 gap-2">
                                    <div>
                                        <label className="block text-[10px] font-semibold text-stone-600 mb-1">
                                            Length ({activeDimSizeKey})
                                        </label>
                                        <input
                                            type="text"
                                            value={currentDimValues.length || ''}
                                            onChange={(e) =>
                                                updateStructuredDimension(activeDimSizeKey, 'length', e.target.value)
                                            }
                                            placeholder="e.g. 215 cm"
                                            className="w-full px-2.5 py-2 rounded-xl bg-[#FAF8F5] border border-stone-200 text-xs"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-semibold text-stone-600 mb-1">
                                            Width ({activeDimSizeKey})
                                        </label>
                                        <input
                                            type="text"
                                            value={currentDimValues.width || ''}
                                            onChange={(e) =>
                                                updateStructuredDimension(activeDimSizeKey, 'width', e.target.value)
                                            }
                                            placeholder="e.g. 163 cm"
                                            className="w-full px-2.5 py-2 rounded-xl bg-[#FAF8F5] border border-stone-200 text-xs"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-semibold text-stone-600 mb-1">
                                            Depth / Height ({activeDimSizeKey})
                                        </label>
                                        <input
                                            type="text"
                                            value={currentDimValues.depth || ''}
                                            onChange={(e) =>
                                                updateStructuredDimension(activeDimSizeKey, 'depth', e.target.value)
                                            }
                                            placeholder="e.g. 120 cm"
                                            className="w-full px-2.5 py-2 rounded-xl bg-[#FAF8F5] border border-stone-200 text-xs"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-semibold text-stone-600 mb-1">
                                        Custom Dimension Details ({activeDimSizeKey})
                                    </label>
                                    <input
                                        type="text"
                                        value={currentDimValues.custom || ''}
                                        onChange={(e) =>
                                            updateStructuredDimension(activeDimSizeKey, 'custom', e.target.value)
                                        }
                                        placeholder="e.g. Sleeping Area: 263 cm x 117 cm | Seat Height: 45 cm"
                                        className="w-full px-2.5 py-2 rounded-xl bg-[#FAF8F5] border border-stone-200 text-xs"
                                    />
                                </div>
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
                                        className="flex-1 min-w-[150px] px-3 py-2 rounded-xl bg-[#FAF8F5] border border-stone-200 text-xs"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddImageUrl}
                                        className="px-3 py-2 rounded-xl bg-[#1C1B18] text-white text-xs font-semibold cursor-pointer hover:bg-[#9A7B56]"
                                    >
                                        + Add URL
                                    </button>
                                    <label className="px-3 py-2 rounded-xl bg-[#FAF8F5] border border-stone-200 hover:border-[#9A7B56] text-xs font-semibold cursor-pointer flex items-center gap-1">
                                        <Upload className="w-3.5 h-3.5 text-[#9A7B56]" /> Upload
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
                                                <img src={imgSrc} alt="" className="w-full h-full object-cover" />
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

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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
                                        className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs"
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
                                        className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs"
                                    />
                                </div>
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
                                    className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs"
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

                        {/* Right 6 Cols: Searchable & Filterable Inventory List */}
                        <div className="lg:col-span-6 space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <h3 className="font-serif text-xl font-bold text-[#1C1B18]">
                                    Database Inventory ({filteredInventory.length} of {products.length})
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

                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-[#FAF8F5] p-3 rounded-2xl border border-stone-200">
                                <div className="sm:col-span-6 relative">
                                    <input
                                        type="search"
                                        value={invSearch}
                                        onChange={(e) => setInvSearch(e.target.value)}
                                        placeholder="Search by title, category, ID..."
                                        className="w-full pl-8 pr-3 py-2 rounded-xl bg-white border border-stone-200 text-xs"
                                    />
                                    <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
                                </div>

                                <div className="sm:col-span-3">
                                    <select
                                        value={invCategoryFilter}
                                        onChange={(e) => setInvCategoryFilter(e.target.value)}
                                        className="w-full px-2 py-2 rounded-xl bg-white border border-stone-200 text-xs text-stone-700"
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
                                        className="w-full px-2 py-2 rounded-xl bg-white border border-stone-200 text-xs text-stone-700"
                                    >
                                        <option value="All">All Stock</option>
                                        <option value="in_stock">In Stock (&gt;0)</option>
                                        <option value="out_of_stock">Out (0)</option>
                                        <option value="hidden">Hidden</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2.5 max-h-[68vh] overflow-y-auto pr-1 custom-scrollbar">
                                {filteredInventory.map((p) => {
                                    const isStockHidden =
                                        p.stock === null || p.stock === undefined || p.stock === '';

                                    return (
                                        <div
                                            key={p.id}
                                            className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl border transition ${editingId === p.id
                                                    ? 'bg-amber-50/70 border-amber-400'
                                                    : 'bg-white border-stone-200'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={validateSafeImageUrl(p.image)}
                                                    alt={p.name}
                                                    className="w-12 h-12 rounded-xl object-cover shrink-0"
                                                />
                                                <div>
                                                    <span className="text-[10px] font-bold uppercase text-[#9A7B56]">
                                                        {p.category} {p.subcategory ? `• ${p.subcategory}` : ''} &bull; £
                                                        {p.price}
                                                    </span>
                                                    <h4 className="text-xs font-bold text-[#1C1B18]">{p.name}</h4>
                                                    <span className="text-[10px] text-stone-400">
                                                        {p.colors?.length || 0} finishes &bull;{' '}
                                                        {isStockHidden ? 'Stock Hidden' : `${p.stock} in stock`}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                                <button
                                                    type="button"
                                                    onClick={() => onUpdateStock(p.id, isStockHidden ? 5 : null)}
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
                                                    className="w-14 text-center py-1 rounded-lg border border-stone-200 text-xs font-bold"
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
                                                    onClick={() => populateFormForEdit(p)}
                                                    className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-[11px] font-semibold flex items-center gap-1 cursor-pointer ml-1"
                                                >
                                                    <Edit3 className="w-3.5 h-3.5" /> Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => onDeleteProduct(p.id)}
                                                    className="p-1.5 text-stone-400 hover:text-red-600 cursor-pointer"
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

                {/* TAB 2: SITE, ASSEMBLY BANNER, SLIDESHOW & PAYMENT SETTINGS */}
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
                            {/* Section A: Payment & Assembly Banner Control */}
                            <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-stone-200 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-serif text-xl font-bold text-[#1C1B18]">
                                            1. Payment & Assembly Highlight
                                        </h3>
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
                                                : 'Maintenance Mode'}
                                        </span>
                                    </label>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                                        Maintenance Mode Message
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
                                        className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs"
                                    />
                                </div>

                                {/* Editable / Removable "Two-Person Room Assembly Included Free" */}
                                <div className="p-3.5 rounded-xl bg-white border border-stone-200 space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-[#1C1B18]">
                                            "Two-Person Room Assembly" Feature Badge
                                        </span>
                                        <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={settingsForm.showAssemblyHighlight !== false}
                                                onChange={(e) =>
                                                    setSettingsForm({
                                                        ...settingsForm,
                                                        showAssemblyHighlight: e.target.checked,
                                                    })
                                                }
                                            />
                                            <span>Show on Site</span>
                                        </label>
                                    </div>

                                    {settingsForm.showAssemblyHighlight !== false && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            <div>
                                                <label className="block text-[10px] font-semibold text-stone-500 mb-0.5">
                                                    Badge Title
                                                </label>
                                                <input
                                                    type="text"
                                                    value={settingsForm.assemblyTitle ?? 'Two-Person Room Assembly'}
                                                    onChange={(e) =>
                                                        setSettingsForm({
                                                            ...settingsForm,
                                                            assemblyTitle: e.target.value,
                                                        })
                                                    }
                                                    placeholder="e.g. Two-Person Room Delivery"
                                                    className="w-full px-2.5 py-2 rounded-lg bg-[#FAF8F5] border border-stone-200 text-xs"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-semibold text-stone-500 mb-0.5">
                                                    Badge Subtitle
                                                </label>
                                                <input
                                                    type="text"
                                                    value={settingsForm.assemblySubtitle ?? 'Included Free'}
                                                    onChange={(e) =>
                                                        setSettingsForm({
                                                            ...settingsForm,
                                                            assemblySubtitle: e.target.value,
                                                        })
                                                    }
                                                    placeholder="e.g. Included Free or Available on Request"
                                                    className="w-full px-2.5 py-2 rounded-lg bg-[#FAF8F5] border border-stone-200 text-xs"
                                                />
                                            </div>
                                        </div>
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
                                        className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                    <div>
                                        <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                                            Facebook Page Link
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
                                            WhatsApp Number or Link
                                        </label>
                                        <input
                                            type="text"
                                            value={settingsForm.whatsappNumber || ''}
                                            onChange={(e) =>
                                                setSettingsForm({ ...settingsForm, whatsappNumber: e.target.value })
                                            }
                                            placeholder="e.g. 07830141250"
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
                                        className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs"
                                    />
                                </div>
                            </div>

                            {/* Section D: Main Page Slideshow Images */}
                            <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-stone-200 space-y-3.5">
                                <h3 className="font-serif text-xl font-bold text-[#1C1B18]">
                                    4. Main Page Slideshow Pictures
                                </h3>

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
                                        className="px-3.5 py-2 rounded-xl bg-[#1C1B18] text-white text-xs font-semibold cursor-pointer"
                                    >
                                        + Add URL
                                    </button>
                                    <label className="px-3.5 py-2 rounded-xl bg-white border border-stone-200 text-xs font-semibold cursor-pointer flex items-center gap-1">
                                        <Upload className="w-3.5 h-3.5 text-[#9A7B56]" /> Upload
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
                                            <img src={imgUrl} alt="" className="w-full h-full object-cover" />
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
                                <Save className="w-4 h-4" /> Save All Site Settings
                            </button>
                        </div>
                    </form>
                )}

                {/* TAB 3: REVIEWS */}
                {activeTab === 'reviews' && (
                    <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar space-y-4 max-h-[75vh]">
                        <h3 className="font-serif text-xl font-bold text-[#1C1B18]">
                            Customer Reviews Moderation ({reviews.length})
                        </h3>
                        {reviews.map((rev) => {
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
                                            <span className="text-xs text-amber-600 font-bold ml-2">
                                                ★ {rev.rating}/5
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => onToggleVerifyReview(rev.id)}
                                                className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 cursor-pointer ${rev.verified
                                                        ? 'bg-emerald-700 text-white'
                                                        : 'bg-white border border-stone-300 text-stone-700'
                                                    }`}
                                            >
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                {rev.verified ? 'Verified Buyer' : 'Mark as Verified'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => onDeleteReview(rev.id)}
                                                className="px-3 py-1.5 rounded-full bg-red-100 text-red-800 text-xs font-semibold flex items-center gap-1 cursor-pointer"
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
                                            value={draftValue}
                                            onChange={(e) =>
                                                setReplyDrafts({ ...replyDrafts, [rev.id]: e.target.value })
                                            }
                                            placeholder="Write an official SJ Home Interiors response..."
                                            className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-stone-200 text-xs"
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                onRespondToReview(rev.id, sanitizeText(draftValue, 500))
                                            }
                                            className="px-4 py-2 rounded-xl bg-[#1C1B18] text-white text-xs font-semibold cursor-pointer"
                                        >
                                            Save Official Reply
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}