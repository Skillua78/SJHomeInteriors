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
    ZoomIn,
    ZoomOut,
    RotateCcw,
    Sparkles,
    Eye,
} from 'lucide-react';
import { resolveColorHex } from './ProductCard';
import { FABRIC_INFOGRAPHICS } from '../data/products';
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

    // Magnifying Glass Zoom & Pan State
    const [zoomLevel, setZoomLevel] = useState(1); // 1 = Full View, 1.75 = Medium Zoom, 2.5 = Deep Zoom
    const [panOrigin, setPanOrigin] = useState({ x: 50, y: 50 });

    // Toggle to view the Fabric Infographic Chart
    const [showFabricChart, setShowFabricChart] = useState(true);
    const [customChartImgError, setCustomChartImgError] = useState({});

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
            setZoomLevel(1);
            setPanOrigin({ x: 50, y: 50 });
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

    // Magnifying Glass Handlers
    const handleZoomIn = () => {
        setZoomLevel((prev) => (prev === 1 ? 1.75 : prev === 1.75 ? 2.5 : 1));
    };

    const handleZoomOut = () => {
        setZoomLevel((prev) => (prev === 2.5 ? 1.75 : 1));
    };

    const handleResetZoom = () => {
        setZoomLevel(1);
        setPanOrigin({ x: 50, y: 50 });
    };

    const handleImageMouseMove = (e) => {
        if (zoomLevel <= 1) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
        const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
        setPanOrigin({ x, y });
    };

    // Active Fabric Infographic Lookup
    const activeFabricChart = chosenFabric ? FABRIC_INFOGRAPHICS[chosenFabric] : null;
    const customAdminFabricImg =
        chosenFabric && siteSettings?.customFabricImages?.[chosenFabric]
            ? validateSafeImageUrl(siteSettings.customFabricImages[chosenFabric])
            : null;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label={`${product.name} specifications`}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="relative bg-white rounded-t-3xl sm:rounded-3xl max-w-5xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-stone-200 custom-scrollbar"
            >
                {/* Sticky Top-Right Bar */}
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
                    {/* Left Column: Full-View Image Viewer + Magnifying Glass Zoom */}
                    <div className="md:col-span-6 bg-[#F4F1EA] flex flex-col justify-between relative border-b md:border-b-0 md:border-r border-stone-200">
                        <div
                            onMouseMove={handleImageMouseMove}
                            onClick={handleZoomIn}
                            title={
                                zoomLevel === 1
                                    ? 'Click magnifying glass or image to zoom in'
                                    : 'Move cursor to inspect details, click to change zoom'
                            }
                            className={`relative min-h-[300px] sm:min-h-[420px] md:h-full flex items-center justify-center overflow-hidden p-4 select-none ${zoomLevel > 1 ? 'cursor-zoom-out' : 'cursor-zoom-in'
                                }`}
                        >
                            {/* FULL VIEW UNDISTORTED IMAGE (object-contain) */}
                            <img
                                src={gallery[activeImgIdx % gallery.length]}
                                alt={`${product.name} - photo ${activeImgIdx + 1}`}
                                style={{
                                    transform: `scale(${zoomLevel})`,
                                    transformOrigin: `${panOrigin.x}% ${panOrigin.y}%`,
                                }}
                                className="max-w-full max-h-[380px] sm:max-h-[480px] w-auto h-auto object-contain transition-transform duration-200 rounded-xl shadow-xs"
                            />

                            {product.badge && zoomLevel === 1 && (
                                <span className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-semibold bg-[#1C1B18] text-white shadow-xs">
                                    {product.badge}
                                </span>
                            )}

                            {/* Magnifying Glass Zoom Controls */}
                            <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute bottom-3.5 right-3.5 z-20 flex items-center gap-1.5 bg-[#1C1B18]/85 backdrop-blur-xs text-white px-2.5 py-1.5 rounded-full shadow-lg"
                            >
                                <button
                                    type="button"
                                    onClick={handleZoomOut}
                                    disabled={zoomLevel <= 1}
                                    aria-label="Zoom out"
                                    title="Zoom Out"
                                    className="p-1 hover:text-[#D4B895] disabled:opacity-35 cursor-pointer disabled:cursor-not-allowed"
                                >
                                    <ZoomOut className="w-4 h-4" />
                                </button>
                                <span className="text-[11px] font-bold px-1 min-w-[36px] text-center">
                                    {Math.round(zoomLevel * 100)}%
                                </span>
                                <button
                                    type="button"
                                    onClick={handleZoomIn}
                                    aria-label="Zoom in"
                                    title="Magnify / Zoom In"
                                    className="p-1 hover:text-[#D4B895] cursor-pointer"
                                >
                                    <ZoomIn className="w-4 h-4" />
                                </button>
                                {zoomLevel > 1 && (
                                    <button
                                        type="button"
                                        onClick={handleResetZoom}
                                        aria-label="Reset zoom to full view"
                                        title="Reset to Full View (100%)"
                                        className="p-1 hover:text-[#D4B895] border-l border-white/20 pl-1.5 cursor-pointer"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>

                            {gallery.length > 1 && (
                                <>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleResetZoom();
                                            setActiveImgIdx((prev) => (prev - 1 + gallery.length) % gallery.length);
                                        }}
                                        aria-label="Previous image"
                                        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center cursor-pointer"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleResetZoom();
                                            setActiveImgIdx((prev) => (prev + 1) % gallery.length);
                                        }}
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
                            <div className="p-3 bg-white border-t border-stone-200 flex items-center gap-2 overflow-x-auto custom-scrollbar">
                                {gallery.map((imgUrl, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => {
                                            handleResetZoom();
                                            setActiveImgIdx(idx);
                                        }}
                                        aria-label={`Select photo ${idx + 1}`}
                                        className={`w-16 h-14 rounded-xl overflow-hidden border-2 bg-stone-100 shrink-0 transition cursor-pointer ${idx === activeImgIdx
                                                ? 'border-[#9A7B56] scale-105'
                                                : 'border-transparent opacity-70 hover:opacity-100'
                                            }`}
                                    >
                                        <img src={imgUrl} alt="" className="w-full h-full object-contain" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Specifications, Fabric Infographics & Options */}
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

                            {/* Dynamic Live Price & Value Badge */}
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
                                        {totalDelta > 0
                                            ? `+ £${totalDelta.toFixed(0)} options`
                                            : `- £${Math.abs(totalDelta).toFixed(0)}`})
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
                                        Selected Colour / Finish:{' '}
                                        <strong className="text-[#9A7B56]">{chosenColor}</strong>
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

                            {/* 2. Fabric Selector + Interactive Fabric Colour Swatch Infographic */}
                            {fabrics.length > 0 && (
                                <div className="space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold text-stone-700">
                                            Fabric Type: <strong className="text-[#9A7B56]">{chosenFabric}</strong>
                                        </span>
                                        {activeFabricChart && (
                                            <button
                                                type="button"
                                                onClick={() => setShowFabricChart(!showFabricChart)}
                                                className="text-[11px] font-bold text-[#9A7B56] hover:underline flex items-center gap-1 cursor-pointer"
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                                {showFabricChart ? 'Hide Fabric Swatch Chart' : 'View Fabric Swatch Chart'}
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap gap-1.5">
                                        {fabrics.map((fab) => (
                                            <button
                                                key={fab}
                                                type="button"
                                                onClick={() => {
                                                    setChosenFabric(fab);
                                                    setShowFabricChart(true);
                                                }}
                                                className={`px-3 py-1.5 rounded-xl text-xs border cursor-pointer transition ${chosenFabric === fab
                                                        ? 'border-[#1C1B18] bg-[#1C1B18] text-white font-semibold shadow-xs'
                                                        : 'border-stone-200 bg-white text-stone-700 hover:border-[#9A7B56]'
                                                    }`}
                                            >
                                                {fab}
                                                {formatDeltaBadge('fabrics', fab)}
                                            </button>
                                        ))}
                                    </div>

                                    {/* INTERACTIVE FABRIC INFOGRAPHIC CARD (Displays when a Fabric is clicked) */}
                                    {showFabricChart && (activeFabricChart || customAdminFabricImg) && (
                                        <div className="rounded-2xl overflow-hidden border-2 border-stone-200 bg-white shadow-md">
                                            {/* If Admin uploaded a custom infographic image or placed it in /public/fabrics/ */}
                                            {(customAdminFabricImg ||
                                                (activeFabricChart?.image && !customChartImgError[chosenFabric])) && (
                                                    <div className="bg-stone-50 border-b border-stone-200">
                                                        <img
                                                            src={customAdminFabricImg || activeFabricChart.image}
                                                            alt={`${chosenFabric} Fabric Colours Infographic`}
                                                            onError={() =>
                                                                setCustomChartImgError((prev) => ({
                                                                    ...prev,
                                                                    [chosenFabric]: true,
                                                                }))
                                                            }
                                                            className="w-full max-h-72 object-contain mx-auto"
                                                        />
                                                    </div>
                                                )}

                                            {/* Built-In Interactive Textured Swatch Grid (Matches Wool, Spice Velvet & Naples Charts) */}
                                            {activeFabricChart && (
                                                <div>
                                                    <div className="grid grid-cols-3">
                                                        {activeFabricChart.swatches.map((sw) => {
                                                            const fullShadeName = `${chosenFabric} - ${sw.name}`;
                                                            const isShadeSelected =
                                                                chosenColor === sw.name || chosenColor === fullShadeName;
                                                            const colSpanClass =
                                                                sw.span === 3
                                                                    ? 'col-span-3'
                                                                    : sw.span === 1.5
                                                                        ? 'col-span-3 sm:col-span-1'
                                                                        : 'col-span-1';

                                                            return (
                                                                <button
                                                                    key={sw.name}
                                                                    type="button"
                                                                    onClick={() => setChosenColor(fullShadeName)}
                                                                    title={`Select ${fullShadeName}`}
                                                                    style={{
                                                                        backgroundColor: sw.hex,
                                                                        backgroundImage: activeFabricChart.textureStyle,
                                                                        backgroundSize: activeFabricChart.textureSize,
                                                                    }}
                                                                    className={`${colSpanClass} h-14 sm:h-16 relative flex items-center justify-center border border-black/10 group cursor-pointer transition hover:brightness-110`}
                                                                >
                                                                    <span
                                                                        className={`text-xs sm:text-sm font-extrabold tracking-tight drop-shadow-xs px-2 py-0.5 rounded ${sw.textDark
                                                                                ? 'text-[#1C1B18] bg-white/60'
                                                                                : 'text-white bg-black/25'
                                                                            } ${isShadeSelected
                                                                                ? 'ring-2 ring-white scale-105'
                                                                                : ''
                                                                            }`}
                                                                    >
                                                                        {sw.name}
                                                                        {isShadeSelected ? ' ✓' : ''}
                                                                    </span>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>

                                                    {/* Infographic Footer matching the uploaded swatch chart layout */}
                                                    <div className="p-3.5 text-center bg-white border-t border-stone-200">
                                                        <h5 className="font-sans text-base sm:text-lg font-extrabold text-[#1C1B18] leading-tight">
                                                            {activeFabricChart.title}
                                                        </h5>
                                                        <p className="text-[11px] text-stone-500 mt-0.5">
                                                            {activeFabricChart.subtitle} &bull;{' '}
                                                            <strong className="text-[#9A7B56]">
                                                                Tap any shade above to select it
                                                            </strong>
                                                        </p>

                                                        {fabrics.length > 1 && (
                                                            <div className="mt-2.5 pt-2 border-t border-stone-100">
                                                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#1C1B18] block mb-1">
                                                                    Other Fabrics Options
                                                                </span>
                                                                <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-[11px] text-stone-600">
                                                                    {fabrics
                                                                        .filter((f) => f !== chosenFabric)
                                                                        .map((otherFab) => (
                                                                            <button
                                                                                key={otherFab}
                                                                                type="button"
                                                                                onClick={() => setChosenFabric(otherFab)}
                                                                                className="hover:text-[#9A7B56] hover:underline font-medium cursor-pointer"
                                                                            >
                                                                                {otherFab}
                                                                            </button>
                                                                        ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* 3. Size Selector */}
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