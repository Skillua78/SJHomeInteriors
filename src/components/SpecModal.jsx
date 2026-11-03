import { useState, useEffect } from 'react';
import {
    X,
    Ruler,
    Check,
    Package,
    ChevronLeft,
    ChevronRight,
    Edit3,
    Truck,
} from 'lucide-react';
import { resolveColorHex } from './ProductCard';
import { validateSafeImageUrl } from '../utils/security';

export default function SpecModal({
    modalData,
    onClose,
    onAddToCart,
    isAdmin,
    onEditProduct,
    siteSettings,
}) {
    const [chosenColor, setChosenColor] = useState('');
    const [chosenFabric, setChosenFabric] = useState('');
    const [chosenSize, setChosenSize] = useState('');
    const [chosenMattress, setChosenMattress] = useState('');
    const [chosenLift, setChosenLift] = useState('');
    const [activeImgIdx, setActiveImgIdx] = useState(0);

    useEffect(() => {
        if (modalData?.product) {
            const p = modalData.product;
            const v = p.variations || {};
            setChosenColor(modalData.initialColor || p.colors?.[0] || '');
            setChosenFabric(v.fabrics?.[0] || '');
            setChosenSize(v.sizes?.[0] || '');
            setChosenMattress(v.mattresses?.[0] || '');
            setChosenLift(v.liftOptions?.[0] || '');
            setActiveImgIdx(0);
        }
    }, [modalData]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (modalData?.product) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [modalData, onClose]);

    if (!modalData?.product) return null;

    const { product } = modalData;
    const v = product.variations || {};
    const fabrics = Array.isArray(v.fabrics) ? v.fabrics : [];
    const sizes = Array.isArray(v.sizes) ? v.sizes : [];
    const mattresses = Array.isArray(v.mattresses) ? v.mattresses : [];
    const liftOptions = Array.isArray(v.liftOptions) ? v.liftOptions : [];
    const deltas = v.priceDeltas || {};

    // Calculate price adjustments
    const getDelta = (group, key) => {
        if (!key || !deltas[group]) return 0;
        const val = parseFloat(deltas[group][key]);
        return Number.isNaN(val) ? 0 : val;
    };

    const totalDelta =
        getDelta('fabrics', chosenFabric) +
        getDelta('sizes', chosenSize) +
        getDelta('mattresses', chosenMattress) +
        getDelta('liftOptions', chosenLift);

    const finalPrice = Math.max(0, Number(product.price) + totalDelta);
    const finalPreviousPrice =
        product.previousPrice !== null &&
            product.previousPrice !== undefined &&
            Number(product.previousPrice) > Number(product.price)
            ? Math.max(0, Number(product.previousPrice) + totalDelta)
            : null;

    const formatDeltaBadge = (group, key) => {
        const d = getDelta(group, key);
        if (d === 0) return '';
        return d > 0 ? ` (+£${d.toFixed(0)})` : ` (-£${Math.abs(d).toFixed(0)})`;
    };

    // Resolve dynamic dimensions based on chosenSize
    const structuredDims = v.structuredDimensions || {};
    const sizeSpecificDim =
        chosenSize && structuredDims.bySize && structuredDims.bySize[chosenSize]
            ? structuredDims.bySize[chosenSize]
            : null;
    const defaultDim = structuredDims.default || {};

    const activeDim = {
        length: sizeSpecificDim?.length || defaultDim.length || '',
        width: sizeSpecificDim?.width || defaultDim.width || '',
        depth: sizeSpecificDim?.depth || defaultDim.depth || '',
        custom: sizeSpecificDim?.custom || defaultDim.custom || '',
    };

    const hasStructuredDims =
        Boolean(activeDim.length) ||
        Boolean(activeDim.width) ||
        Boolean(activeDim.depth) ||
        Boolean(activeDim.custom);

    const showGlobalAssembly = siteSettings?.showAssemblyHighlight !== false;
    const assemblyTitle =
        v.assemblyText !== undefined
            ? v.assemblyText
            : showGlobalAssembly
                ? `${siteSettings?.assemblyTitle || 'Two-Person Room Assembly'} — ${siteSettings?.assemblySubtitle || 'Included Free'
                }`
                : '';

    const rawGallery =
        Array.isArray(product.images) && product.images.length > 0
            ? product.images
            : product.image
                ? [product.image]
                : [];

    const gallery = rawGallery.map((u) => validateSafeImageUrl(u)).filter(Boolean);
    if (gallery.length === 0) {
        gallery.push(
            'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1000&q=85'
        );
    }

    const hasStockTracking =
        product.stock !== null && product.stock !== undefined && product.stock !== '';
    const numericStock = hasStockTracking ? Number(product.stock) : null;
    const isAvailable = !hasStockTracking || numericStock > 0;

    const buildSelectedVariantLabel = () => {
        const parts = [];
        if (chosenColor) parts.push(chosenColor);
        if (chosenFabric) parts.push(`Fabric: ${chosenFabric}`);
        if (chosenSize) parts.push(`Size: ${chosenSize}`);
        if (chosenMattress) parts.push(`Mattress: ${chosenMattress}`);
        if (chosenLift) parts.push(`Lift: ${chosenLift}`);
        return parts.join(' • ') || 'Standard';
    };

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label={`${product.name} specifications`}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="relative bg-white rounded-t-3xl sm:rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-stone-200 custom-scrollbar"
            >
                {/* Sticky Top-Right Controls */}
                <div className="sticky top-3 right-3 z-30 flex justify-end gap-2 px-4 pt-3 pointer-events-none">
                    {isAdmin && onEditProduct && (
                        <button
                            type="button"
                            onClick={() => {
                                onClose();
                                onEditProduct(product);
                            }}
                            className="pointer-events-auto px-3.5 py-2 rounded-full bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg cursor-pointer transition"
                        >
                            <Edit3 className="w-3.5 h-3.5" /> Edit Item
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close product modal"
                        className="pointer-events-auto w-10 h-10 rounded-full bg-[#1C1B18]/90 hover:bg-[#9A7B56] text-white flex items-center justify-center shadow-lg cursor-pointer transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 -mt-12">
                    {/* Left Column: Multi-Image Gallery */}
                    <div className="md:col-span-6 bg-stone-100 flex flex-col justify-between relative">
                        <div className="relative aspect-[4/3] md:aspect-auto md:h-full min-h-[280px] overflow-hidden">
                            <img
                                src={gallery[activeImgIdx % gallery.length]}
                                alt={`${product.name} - photo ${activeImgIdx + 1}`}
                                className="w-full h-full object-cover"
                            />

                            {product.badge && (
                                <span className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-semibold bg-[#1C1B18] text-white shadow-xs">
                                    {product.badge}
                                </span>
                            )}

                            {gallery.length > 1 && (
                                <>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setActiveImgIdx((prev) => (prev - 1 + gallery.length) % gallery.length)
                                        }
                                        aria-label="Previous image"
                                        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center cursor-pointer"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setActiveImgIdx((prev) => (prev + 1) % gallery.length)
                                        }
                                        aria-label="Next image"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center cursor-pointer"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </>
                            )}
                        </div>

                        {gallery.length > 1 && (
                            <div className="p-3 bg-white/95 border-t border-stone-200 flex items-center gap-2 overflow-x-auto custom-scrollbar">
                                {gallery.map((imgUrl, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => setActiveImgIdx(idx)}
                                        aria-label={`Select photo ${idx + 1}`}
                                        className={`w-16 h-14 rounded-xl overflow-hidden border-2 shrink-0 transition cursor-pointer ${idx === activeImgIdx
                                                ? 'border-[#9A7B56] scale-105'
                                                : 'border-transparent opacity-70 hover:opacity-100'
                                            }`}
                                    >
                                        <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Specifications, Variations & Live Price */}
                    <div className="md:col-span-6 p-5 sm:p-8 pt-12 md:pt-14 flex flex-col justify-between">
                        <div className="space-y-4">
                            <div>
                                <span className="text-[11px] font-bold uppercase tracking-wider text-[#9A7B56]">
                                    {product.category} {product.subcategory ? `• ${product.subcategory}` : ''}
                                </span>
                                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#1C1B18] mt-0.5 pr-10">
                                    {product.name}
                                </h3>
                            </div>

                            {/* Dynamic Live Price & Optional Stock Badge */}
                            <div className="flex flex-wrap items-baseline gap-3">
                                {finalPreviousPrice && (
                                    <span className="text-base font-medium text-stone-400 line-through">
                                        £{finalPreviousPrice.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                                    </span>
                                )}
                                <span className="text-2xl font-bold text-[#9A7B56]">
                                    £{finalPrice.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                                </span>
                                {totalDelta !== 0 && (
                                    <span className="text-[11px] font-semibold text-stone-500">
                                        (Base £{Number(product.price).toFixed(0)}{' '}
                                        {totalDelta > 0 ? `+ £${totalDelta.toFixed(0)} options` : `- £${Math.abs(totalDelta).toFixed(0)}`})
                                    </span>
                                )}

                                {hasStockTracking && (
                                    <span
                                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 ${numericStock > 0
                                                ? 'bg-emerald-100 text-emerald-800'
                                                : 'bg-amber-100 text-amber-800'
                                            }`}
                                    >
                                        <Package className="w-3.5 h-3.5" />
                                        {numericStock > 0
                                            ? `${numericStock} Available in Stock`
                                            : 'Out of Stock / Pre-Order'}
                                    </span>
                                )}
                            </div>

                            {assemblyTitle && (
                                <div className="px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-stone-200/90 text-xs font-semibold text-[#1C1B18] flex items-center gap-2">
                                    <Truck className="w-4 h-4 text-[#9A7B56] shrink-0" />
                                    <span>{assemblyTitle}</span>
                                </div>
                            )}

                            {product.description && (
                                <div className="text-xs text-stone-600 leading-relaxed whitespace-pre-line">
                                    {product.description}
                                </div>
                            )}

                            {/* 1. Finish / Colour Selector */}
                            {product.colors?.length > 0 && (
                                <div>
                                    <span className="text-xs font-semibold text-stone-700 block mb-1.5">
                                        Colour / Finish: <strong className="text-[#9A7B56]">{chosenColor}</strong>
                                    </span>
                                    <div className="flex flex-wrap items-center gap-2">
                                        {product.colors.map((color) => (
                                            <button
                                                key={color}
                                                type="button"
                                                onClick={() => setChosenColor(color)}
                                                className={`px-3 py-1.5 rounded-full text-xs border flex items-center gap-1.5 cursor-pointer transition ${chosenColor === color
                                                        ? 'border-[#1C1B18] bg-[#1C1B18] text-white font-semibold'
                                                        : 'border-stone-200 bg-white text-stone-700 hover:border-[#9A7B56]'
                                                    }`}
                                            >
                                                <span
                                                    className="w-3.5 h-3.5 rounded-full border border-stone-300"
                                                    style={{
                                                        backgroundColor: resolveColorHex(color, siteSettings?.customColors),
                                                    }}
                                                />
                                                {color}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* 2. Fabric Selector */}
                            {fabrics.length > 0 && (
                                <div>
                                    <span className="text-xs font-semibold text-stone-700 block mb-1.5">
                                        Fabric Option: <strong className="text-[#9A7B56]">{chosenFabric}</strong>
                                    </span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {fabrics.map((fab) => (
                                            <button
                                                key={fab}
                                                type="button"
                                                onClick={() => setChosenFabric(fab)}
                                                className={`px-3 py-1.5 rounded-xl text-xs border cursor-pointer transition ${chosenFabric === fab
                                                        ? 'border-[#1C1B18] bg-[#1C1B18] text-white font-semibold'
                                                        : 'border-stone-200 bg-white text-stone-700 hover:border-[#9A7B56]'
                                                    }`}
                                            >
                                                {fab}
                                                {formatDeltaBadge('fabrics', fab)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* 3. Size Selector (Updates Dimensions & Price Dynamically) */}
                            {sizes.length > 0 && (
                                <div>
                                    <span className="text-xs font-semibold text-stone-700 block mb-1.5">
                                        Size (ft/in &amp; cm): <strong className="text-[#9A7B56]">{chosenSize}</strong>
                                    </span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {sizes.map((sz) => (
                                            <button
                                                key={sz}
                                                type="button"
                                                onClick={() => setChosenSize(sz)}
                                                className={`px-3 py-1.5 rounded-xl text-xs border cursor-pointer transition ${chosenSize === sz
                                                        ? 'border-[#9A7B56] bg-[#9A7B56] text-white font-bold shadow-xs'
                                                        : 'border-stone-200 bg-white text-stone-700 hover:border-[#9A7B56]'
                                                    }`}
                                            >
                                                {sz}
                                                {formatDeltaBadge('sizes', sz)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* 4. Mattress Options */}
                            {mattresses.length > 0 && (
                                <div>
                                    <span className="text-xs font-semibold text-stone-700 block mb-1.5">
                                        Mattress Option: <strong className="text-[#9A7B56]">{chosenMattress}</strong>
                                    </span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {mattresses.map((mat) => (
                                            <button
                                                key={mat}
                                                type="button"
                                                onClick={() => setChosenMattress(mat)}
                                                className={`px-3 py-1.5 rounded-xl text-xs border cursor-pointer transition ${chosenMattress === mat
                                                        ? 'border-[#1C1B18] bg-[#1C1B18] text-white font-semibold'
                                                        : 'border-stone-200 bg-white text-stone-700 hover:border-[#9A7B56]'
                                                    }`}
                                            >
                                                {mat}
                                                {formatDeltaBadge('mattresses', mat)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* 5. Lift Options */}
                            {liftOptions.length > 0 && (
                                <div>
                                    <span className="text-xs font-semibold text-stone-700 block mb-1.5">
                                        Lift Storage Option: <strong className="text-[#9A7B56]">{chosenLift}</strong>
                                    </span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {liftOptions.map((lift) => (
                                            <button
                                                key={lift}
                                                type="button"
                                                onClick={() => setChosenLift(lift)}
                                                className={`px-3 py-1.5 rounded-xl text-xs border cursor-pointer transition ${chosenLift === lift
                                                        ? 'border-[#1C1B18] bg-[#1C1B18] text-white font-semibold'
                                                        : 'border-stone-200 bg-white text-stone-700 hover:border-[#9A7B56]'
                                                    }`}
                                            >
                                                {lift}
                                                {formatDeltaBadge('liftOptions', lift)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Structured Dimensions Box */}
                            {(hasStructuredDims || product.dimensions?.length > 0) && (
                                <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-stone-200/80 space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#1C1B18] flex items-center gap-1.5">
                                            <Ruler className="w-4 h-4 text-[#9A7B56]" /> Dimensions
                                            {chosenSize ? ` — ${chosenSize}` : ''}
                                        </h4>
                                    </div>

                                    {hasStructuredDims && (
                                        <div className="grid grid-cols-3 gap-2 text-center">
                                            {activeDim.length && (
                                                <div className="p-2 rounded-xl bg-white border border-stone-200/80">
                                                    <span className="text-[10px] uppercase text-stone-400 font-bold block">
                                                        Length
                                                    </span>
                                                    <span className="text-xs font-bold text-[#1C1B18]">
                                                        {activeDim.length}
                                                    </span>
                                                </div>
                                            )}
                                            {activeDim.width && (
                                                <div className="p-2 rounded-xl bg-white border border-stone-200/80">
                                                    <span className="text-[10px] uppercase text-stone-400 font-bold block">
                                                        Width
                                                    </span>
                                                    <span className="text-xs font-bold text-[#1C1B18]">
                                                        {activeDim.width}
                                                    </span>
                                                </div>
                                            )}
                                            {activeDim.depth && (
                                                <div className="p-2 rounded-xl bg-white border border-stone-200/80">
                                                    <span className="text-[10px] uppercase text-stone-400 font-bold block">
                                                        Depth / Height
                                                    </span>
                                                    <span className="text-xs font-bold text-[#1C1B18]">
                                                        {activeDim.depth}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {activeDim.custom && (
                                        <p className="text-xs text-stone-700 bg-white p-2.5 rounded-xl border border-stone-200/60">
                                            {activeDim.custom}
                                        </p>
                                    )}

                                    {!hasStructuredDims && product.dimensions?.length > 0 && (
                                        <ul className="space-y-1 text-xs text-stone-700">
                                            {product.dimensions.map((dim, i) => (
                                                <li key={i}>&bull; {dim}</li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            )}

                            {/* Key Specifications List */}
                            {product.features?.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#1C1B18] mb-2">
                                        Key Specifications
                                    </h4>
                                    <ul className="space-y-1.5 text-xs text-stone-600">
                                        {product.features.map((feat, i) => (
                                            <li key={i} className="flex items-start gap-1.5">
                                                <Check className="w-3.5 h-3.5 text-[#9A7B56] shrink-0 mt-0.5" />
                                                <span>{feat}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 pt-4 border-t border-stone-200">
                            <button
                                type="button"
                                onClick={() => {
                                    onAddToCart(
                                        { ...product, price: finalPrice },
                                        buildSelectedVariantLabel()
                                    );
                                    onClose();
                                }}
                                className="w-full py-3.5 px-6 rounded-full bg-[#1C1B18] hover:bg-[#9A7B56] text-white font-semibold text-xs uppercase tracking-wider transition cursor-pointer"
                            >
                                {isAvailable
                                    ? `Add to Basket — £${finalPrice.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`
                                    : `Pre-Order — £${finalPrice.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}