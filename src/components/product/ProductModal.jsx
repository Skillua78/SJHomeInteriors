import { useEffect, useMemo, useState } from 'react';
import { X, Check, Package, Edit3, Truck, Loader2 } from 'lucide-react';
import { validateSafeImageUrl } from '../../utils/security';
import { resolveColorHex } from '../../utils/colors';
import { optionsFromVariations } from '../../utils/catalogModel';
import { fetchProductDetail } from '../../hooks/useCatalog';
import { priceSelection, toPence, fromPence, formatGBP } from '../../../shared/pricing.js';
import ProductGallery from './ProductGallery';
import OptionGroup from './OptionGroup';
import FabricSwatchChart from './FabricSwatchChart';
import DimensionsBox from './DimensionsBox';

const FALLBACK_IMAGE =
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1000&q=85';
const DESCRIPTION_PREVIEW = 320;
const EMPTY_VARIATIONS = {};

/**
 * Product quick-view. Opens instantly with the summary the catalogue already
 * has, then loads the full gallery and options for that one product.
 */
export default function ProductModal({
    modalData,
    onClose,
    onAddToCart,
    isAdmin,
    onEditProduct,
    siteSettings,
}) {
    const summary = modalData?.product || null;
    const [detail, setDetail] = useState(null);
    const [loadError, setLoadError] = useState('');
    const [selections, setSelections] = useState({});
    const [expanded, setExpanded] = useState(false);
    const [addError, setAddError] = useState('');

    useEffect(() => {
        if (!summary) return undefined;
        let cancelled = false;
        setDetail(null);
        setLoadError('');
        setAddError('');
        setExpanded(false);
        setSelections({ color: modalData.initialColor || summary.colors?.[0] || '' });

        fetchProductDetail(summary.id)
            .then((full) => {
                if (cancelled) return;
                if (!full) {
                    setLoadError('This product is no longer available.');
                    return;
                }
                const v = full.variations || {};
                setDetail(full);
                setSelections({
                    color: modalData.initialColor || full.colors?.[0] || '',
                    fabric: v.fabrics?.[0] || '',
                    size: v.sizes?.[0] || '',
                    mattress: v.mattresses?.[0] || '',
                    lift: v.liftOptions?.[0] || '',
                });
            })
            .catch((err) => {
                if (!cancelled) setLoadError(err.message || 'Could not load this product.');
            });

        return () => {
            cancelled = true;
        };
    }, [summary, modalData?.initialColor]);

    useEffect(() => {
        if (!summary) return undefined;
        const onKey = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            window.removeEventListener('keydown', onKey);
            document.body.style.overflow = previousOverflow;
        };
    }, [summary, onClose]);

    // Only use loaded detail while it belongs to the product being shown; otherwise the
    // view would keep rendering (and refuse to close) from the previous product's data.
    const activeDetail = summary && detail?.id === summary.id ? detail : null;
    const product = summary ? activeDetail || summary : null;
    const variations = activeDetail?.variations || EMPTY_VARIATIONS;

    const priced = useMemo(() => {
        if (!product) return null;
        return priceSelection(toPence(product.price), optionsFromVariations(variations), selections);
    }, [product, variations, selections]);

    if (!product) return null;

    const waitingForOptions = !activeDetail && summary.hasOptions && !loadError;
    const unitPrice = priced?.ok ? fromPence(priced.unitPence) : Number(product.price);
    const optionsDelta = unitPrice - Number(product.price);
    const wasPrice =
        product.previousPrice && Number(product.previousPrice) > Number(product.price)
            ? Number(product.previousPrice) + optionsDelta
            : null;

    const tracked = product.stock !== null && product.stock !== undefined;
    const stock = tracked ? Number(product.stock) : null;
    const available = !tracked || stock > 0;

    const gallery = (activeDetail?.images?.length ? activeDetail.images : [product.image])
        .map(validateSafeImageUrl)
        .filter(Boolean);
    if (gallery.length === 0) gallery.push(FALLBACK_IMAGE);

    const description = product.description || '';
    const longDescription = description.length > DESCRIPTION_PREVIEW;
    const shownDescription =
        longDescription && !expanded ? `${description.slice(0, DESCRIPTION_PREVIEW).trimEnd()}…` : description;

    const setSelection = (key, value) => {
        setSelections((prev) => ({ ...prev, [key]: value }));
        setAddError('');
    };

    const handleAdd = () => {
        const result = onAddToCart(product, selections);
        if (result?.ok === false) {
            setAddError(result.error);
            return;
        }
        onClose();
    };

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label={product.name}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="relative bg-white rounded-t-3xl sm:rounded-3xl max-w-5xl w-full h-[94dvh] sm:h-auto sm:max-h-[92vh] flex flex-col overflow-hidden shadow-2xl"
            >
                <div className="absolute top-3 right-3 z-30 flex gap-2">
                    {isAdmin && onEditProduct && (
                        <button
                            type="button"
                            onClick={() => {
                                onClose();
                                onEditProduct(product);
                            }}
                            className="px-3.5 h-10 rounded-full bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg cursor-pointer transition"
                        >
                            <Edit3 className="w-3.5 h-3.5" aria-hidden="true" /> Edit
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="w-10 h-10 rounded-full bg-[#1C1B18]/90 hover:bg-[#9A7B56] text-white flex items-center justify-center shadow-lg cursor-pointer transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Phones: one scrolling column. Desktop: photos stay put while details scroll. */}
                <div className="flex-1 min-h-0 overflow-y-auto md:overflow-hidden md:grid md:grid-cols-2 custom-scrollbar">
                    <div className="h-[42dvh] md:h-auto md:min-h-[520px] border-b md:border-b-0 md:border-r border-stone-200">
                        <ProductGallery
                            images={gallery}
                            alt={product.name}
                            badge={available ? product.badge : 'Pre-order'}
                        />
                    </div>

                    <div className="md:overflow-y-auto custom-scrollbar p-5 sm:p-7 md:pt-14 space-y-5">
                        <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-[#9A7B56]">
                                {product.category}
                                {product.subcategory ? ` · ${product.subcategory}` : ''}
                            </span>
                            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1C1B18] mt-1 pr-12 md:pr-0 leading-tight">
                                {product.name}
                            </h2>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                            <span className="text-3xl font-bold text-[#1C1B18]">{formatGBP(unitPrice)}</span>
                            {wasPrice && (
                                <>
                                    <span className="text-base text-stone-400 line-through">
                                        <span className="sr-only">Was </span>
                                        {formatGBP(wasPrice)}
                                    </span>
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-700 text-white">
                                        Save {formatGBP(wasPrice - unitPrice)}
                                    </span>
                                </>
                            )}
                            {tracked && (
                                <span
                                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 ${
                                        stock > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                    }`}
                                >
                                    <Package className="w-3.5 h-3.5" aria-hidden="true" />
                                    {stock > 0 ? `${stock} in stock` : 'Available to pre-order'}
                                </span>
                            )}
                        </div>

                        <div className="px-4 py-3 rounded-xl bg-[#FAF8F5] border border-stone-200 text-sm text-stone-700 flex items-start gap-2.5">
                            <Truck className="w-4 h-4 text-[#9A7B56] shrink-0 mt-0.5" aria-hidden="true" />
                            <span>
                                <strong className="text-[#1C1B18]">
                                    Estimated delivery &amp; assembly
                                    {product.delivery ? `: ${product.delivery}` : ''}
                                </strong>
                                <span className="block text-xs text-stone-500 mt-0.5">
                                    One delivery &amp; assembly charge per order, shown in your basket.
                                    Collect from our Maltby showroom at no charge.
                                </span>
                            </span>
                        </div>

                        {loadError && (
                            <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
                                {loadError}
                            </p>
                        )}

                        {product.colors?.length > 0 && (
                            <fieldset>
                                <legend className="text-sm font-semibold text-stone-700 mb-2">
                                    Colour: <span className="text-[#7D6242]">{selections.color}</span>
                                </legend>
                                <div className="flex flex-wrap gap-2">
                                    {product.colors.map((color) => (
                                        <button
                                            key={color}
                                            type="button"
                                            aria-pressed={selections.color === color}
                                            onClick={() => setSelection('color', color)}
                                            className={`pl-2 pr-3.5 py-2 rounded-full text-sm border flex items-center gap-2 cursor-pointer transition ${
                                                selections.color === color
                                                    ? 'border-[#1C1B18] bg-[#1C1B18] text-white font-semibold'
                                                    : 'border-stone-300 bg-white text-stone-700 hover:border-[#9A7B56]'
                                            }`}
                                        >
                                            <span
                                                className="w-5 h-5 rounded-full border border-stone-300"
                                                style={{
                                                    backgroundColor: resolveColorHex(color, siteSettings?.customColors),
                                                }}
                                            />
                                            {color}
                                        </button>
                                    ))}
                                </div>
                            </fieldset>
                        )}

                        {waitingForOptions && (
                            <p className="text-sm text-stone-500 flex items-center gap-2" role="status">
                                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Loading sizes and
                                options…
                            </p>
                        )}

                        <OptionGroup
                            label="Size"
                            options={variations.sizes}
                            value={selections.size}
                            onChange={(v) => setSelection('size', v)}
                            deltas={variations.priceDeltas?.sizes}
                        />

                        {variations.fabrics?.length > 0 && (
                            <div className="space-y-3">
                                <OptionGroup
                                    label="Fabric"
                                    options={variations.fabrics}
                                    value={selections.fabric}
                                    onChange={(v) => setSelection('fabric', v)}
                                    deltas={variations.priceDeltas?.fabrics}
                                />
                                <FabricSwatchChart
                                    fabric={selections.fabric}
                                    chosenColor={selections.color}
                                    onChooseColor={(shade) => setSelection('color', shade)}
                                    customImages={siteSettings?.customFabricImages}
                                />
                            </div>
                        )}

                        <OptionGroup
                            label="Mattress"
                            options={variations.mattresses}
                            value={selections.mattress}
                            onChange={(v) => setSelection('mattress', v)}
                            deltas={variations.priceDeltas?.mattresses}
                        />
                        <OptionGroup
                            label="Storage lift"
                            options={variations.liftOptions}
                            value={selections.lift}
                            onChange={(v) => setSelection('lift', v)}
                            deltas={variations.priceDeltas?.liftOptions}
                        />

                        {description && (
                            <div>
                                <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-[#1C1B18] mb-1.5">
                                    About this piece
                                </h3>
                                <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-line">
                                    {shownDescription}
                                </p>
                                {longDescription && (
                                    <button
                                        type="button"
                                        onClick={() => setExpanded(!expanded)}
                                        aria-expanded={expanded}
                                        className="mt-1.5 text-sm font-semibold text-[#7D6242] hover:underline cursor-pointer"
                                    >
                                        {expanded ? 'Show less' : 'Read full description'}
                                    </button>
                                )}
                            </div>
                        )}

                        <DimensionsBox
                            variations={variations}
                            chosenSize={selections.size}
                            legacyDimensions={activeDetail?.dimensions}
                        />

                        {activeDetail?.features?.length > 0 && (
                            <div>
                                <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-[#1C1B18] mb-2">
                                    Key features
                                </h3>
                                <ul className="space-y-1.5 text-sm text-stone-700">
                                    {activeDetail.features.map((feature, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                            <Check className="w-4 h-4 text-[#9A7B56] shrink-0 mt-0.5" aria-hidden="true" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>

                {/* Always-visible purchase bar */}
                <div className="shrink-0 border-t border-stone-200 bg-white px-5 sm:px-7 py-3.5 flex items-center gap-4">
                    <div className="min-w-0">
                        <p className="text-xl font-bold text-[#1C1B18] leading-tight">{formatGBP(unitPrice)}</p>
                        <p className="text-xs text-stone-500 truncate">
                            Delivery &amp; assembly added once per order
                        </p>
                    </div>
                    <div className="flex-1 flex flex-col items-end">
                        {addError && (
                            <p role="alert" className="text-xs text-red-700 mb-1 text-right">
                                {addError}
                            </p>
                        )}
                        <button
                            type="button"
                            onClick={handleAdd}
                            disabled={waitingForOptions || Boolean(loadError)}
                            className="w-full sm:w-auto sm:min-w-[240px] py-3.5 px-8 rounded-full bg-[#1C1B18] hover:bg-[#9A7B56] disabled:bg-stone-300 text-white font-semibold text-sm transition cursor-pointer disabled:cursor-not-allowed"
                        >
                            {available ? 'Add to basket' : 'Pre-order'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
