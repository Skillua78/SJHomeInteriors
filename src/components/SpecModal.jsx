import { useState, useEffect } from 'react';
import {
    X,
    Ruler,
    Check,
    Package,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { colorMap } from '../data/products';
import { validateSafeImageUrl } from '../utils/security';

export default function SpecModal({ modalData, onClose, onAddToCart }) {
    const [chosenColor, setChosenColor] = useState('');
    const [activeImgIdx, setActiveImgIdx] = useState(0);

    useEffect(() => {
        if (modalData?.product) {
            setChosenColor(
                modalData.initialColor || modalData.product.colors?.[0] || 'Standard'
            );
            setActiveImgIdx(0);
        }
    }, [modalData]);

    if (!modalData?.product) return null;

    const { product } = modalData;

    const rawGallery =
        Array.isArray(product.images) && product.images.length > 0
            ? product.images
            : product.image
                ? [product.image]
                : [];

    const gallery = rawGallery
        .map((u) => validateSafeImageUrl(u))
        .filter(Boolean);

    if (gallery.length === 0) {
        gallery.push(
            'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1000&q=85'
        );
    }

    const hasStockTracking =
        product.stock !== null &&
        product.stock !== undefined &&
        product.stock !== '';
    const numericStock = hasStockTracking ? Number(product.stock) : null;
    const isAvailable = !hasStockTracking || numericStock > 0;

    const hasPreviousPrice =
        product.previousPrice !== null &&
        product.previousPrice !== undefined &&
        Number(product.previousPrice) > Number(product.price);

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label={`${product.name} specifications`}
            className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
            <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-stone-200">
                <div className="grid grid-cols-1 md:grid-cols-12">
                    {/* Left Column: Multi-Image Gallery */}
                    <div className="md:col-span-6 bg-stone-100 flex flex-col justify-between relative">
                        <div className="relative aspect-[4/3] md:aspect-auto md:h-full min-h-[260px] overflow-hidden">
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
                                            setActiveImgIdx(
                                                (prev) => (prev - 1 + gallery.length) % gallery.length
                                            )
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

                        {/* Scrollable Thumbnail Strip */}
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
                                        <img
                                            src={imgUrl}
                                            alt=""
                                            className="w-full h-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Specifications & Description */}
                    <div className="md:col-span-6 p-5 sm:p-8 flex flex-col justify-between max-h-[85vh] overflow-y-auto custom-scrollbar">
                        <div>
                            <div className="flex justify-between items-start gap-2">
                                <div>
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#9A7B56]">
                                        {product.category}{' '}
                                        {product.subcategory ? `• ${product.subcategory}` : ''}
                                    </span>
                                    <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#1C1B18] mt-0.5">
                                        {product.name}
                                    </h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    aria-label="Close specifications modal"
                                    className="p-2 rounded-full hover:bg-stone-100 text-stone-500 cursor-pointer shrink-0"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Price & Optional Stock Badge */}
                            <div className="mt-3 flex flex-wrap items-baseline gap-3">
                                {hasPreviousPrice && (
                                    <span className="text-base font-medium text-stone-400 line-through">
                                        £{Number(product.previousPrice).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                                    </span>
                                )}
                                <span className="text-2xl font-bold text-[#9A7B56]">
                                    £{Number(product.price).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                                </span>

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

                            {/* Product Description */}
                            {product.description && (
                                <div className="mt-4 text-xs text-stone-600 leading-relaxed whitespace-pre-line">
                                    {product.description}
                                </div>
                            )}

                            {/* Colour Selector */}
                            {product.colors?.length > 0 && (
                                <div className="mt-4">
                                    <span className="text-xs font-semibold text-stone-700 block mb-2">
                                        Select Finish:{' '}
                                        <span className="text-[#9A7B56]">{chosenColor}</span>
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
                                                    className="w-3 h-3 rounded-full border border-white/30"
                                                    style={{ backgroundColor: colorMap[color] || '#ccc' }}
                                                />
                                                {color}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Dimensions Box */}
                            {product.dimensions?.length > 0 && (
                                <div className="mt-5 p-4 rounded-2xl bg-[#FAF8F5] border border-stone-200/80">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#1C1B18] flex items-center gap-1.5 mb-2">
                                        <Ruler className="w-4 h-4 text-[#9A7B56]" /> Dimensions
                                    </h4>
                                    <ul className="space-y-1 text-xs text-stone-700">
                                        {product.dimensions.map((dim, i) => (
                                            <li key={i}>&bull; {dim}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Features List */}
                            {product.features?.length > 0 && (
                                <div className="mt-5">
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
                                    onAddToCart(product, chosenColor);
                                    onClose();
                                }}
                                className="w-full py-3.5 px-6 rounded-full bg-[#1C1B18] hover:bg-[#9A7B56] text-white font-semibold text-xs uppercase tracking-wider transition cursor-pointer"
                            >
                                {isAvailable
                                    ? `Add (${chosenColor}) to Basket`
                                    : `Pre-Order (${chosenColor})`}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}