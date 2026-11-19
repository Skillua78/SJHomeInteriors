import { useEffect, useMemo, useState } from 'react';
import { X, Check, Package, Edit3, Loader2, ShieldCheck, RotateCcw, MessageCircle } from 'lucide-react';
import { validateSafeImageUrl } from '../../utils/security';
import { resolveColorHex } from '../../utils/colors';
import { optionsFromVariations } from '../../utils/catalogModel';
import { fetchProductDetail } from '../../hooks/useCatalog';
import { priceSelection, toPence, fromPence, formatGBP } from '../../../shared/pricing.js';
import ProductGallery from './ProductGallery';
import OptionGroup from './OptionGroup';
import FabricSwatchChart from './FabricSwatchChart';
import DimensionsBox from './DimensionsBox';
import PaymentBadges from '../ui/PaymentBadges';
import { useDialog, useTransitionState } from '../../hooks/useDialog';
import ProductReviews from '../ProductReviews';
import SimilarProducts from '../SimilarProducts';
import TrustBar from '../TrustBar';
import StarRating from '../ui/StarRating';
import { whatsAppLink, productEnquiryMessage } from '../../utils/storefront';

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
    onOpenProduct,
}) {
    // Keep showing the last product while the closing animation plays.
    const isOpen = Boolean(modalData?.product);
    const { mounted, state } = useTransitionState(isOpen, 300);
    const panelRef = useDialog(isOpen, onClose);
    const [lastData, setLastData] = useState(modalData);
    if (modalData && modalData !== lastData) setLastData(modalData);
    const data = modalData || (mounted ? lastData : null);

    const summary = data?.product || null;
    const [detail, setDetail] = useState(null);
    const [loadError, setLoadError] = useState('');
    const [selections, setSelections] = useState({});
    const [expanded, setExpanded] = useState(false);
    const [addError, setAddError] = useState('');
    const [galleryJump, setGalleryJump] = useState(null);

    useEffect(() => {
        if (!summary) return undefined;
        let cancelled = false;
        setDetail(null);
        setLoadError('');
        setAddError('');
        setExpanded(false);
        setSelections({ color: data.initialColor || summary.colors?.[0] || '' });

        fetchProductDetail(summary.id)
            .then((full) => {
                if (cancelled) return;
                if (!full) {
                    setLoadError('This product is no longer available.');
                    return;
                }
                const v = full.variations || {};
                setDetail(full);
                const startColour = data.initialColor || full.colors?.[0] || '';
                const tagged = (v.photoColors || []).findIndex((c) => c && c === startColour);
                setGalleryJump(tagged > 0 ? { index: tagged, key: `start-${full.id}-${startColour}` } : null);
                setSelections({
                    color: data.initialColor || full.colors?.[0] || '',
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [summary, data?.initialColor]);

    // Only use loaded detail while it belongs to the product being shown; otherwise the
    // view would keep rendering (and refuse to close) from the previous product's data.
    const activeDetail = summary && detail?.id === summary.id ? detail : null;
    const product = summary ? activeDetail || summary : null;
    const variations = activeDetail?.variations || EMPTY_VARIATIONS;

    const priced = useMemo(() => {
        if (!mounted || !product) return null;
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

    /**
     * Colour chosen: show the first photo tagged with that colour in the admin. Photos
     * that were never tagged fall back to matching the colour name in the image link.
     */
    const photoColors = variations.photoColors || [];
    const photoIndexForColour = (colour) => {
        if (!colour) return -1;
        const tagged = photoColors.findIndex((c) => c === colour);
        if (tagged !== -1) return tagged;
        const needle = colour.toLowerCase().replace(/\s+/g, '-');
        return gallery.findIndex((url) => decodeURIComponent(url).toLowerCase().replace(/\s+/g, '-').includes(needle));
    };
    const chooseColour = (colour) => {
        setSelection('color', colour);
        const index = photoIndexForColour(colour);
        if (index !== -1) setGalleryJump({ index, key: `${colour}-${Date.now()}` });
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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div
                data-state={state}
                onClick={onClose}
                aria-hidden="true"
                className="overlay-fade absolute inset-0 bg-ink/70 backdrop-blur-xs"
            />
            <div
                ref={panelRef}
                data-dialog-panel
                data-state={state}
                role="dialog"
                aria-modal="true"
                aria-labelledby="product-modal-title"
                tabIndex={-1}
                className="dialog-pop relative bg-white rounded-t-3xl sm:rounded-3xl max-w-5xl w-full h-[94dvh] sm:h-auto sm:max-h-[92vh] flex flex-col overflow-hidden shadow-2xl outline-none"
            >
                <div className="absolute top-3 right-3 z-30 flex gap-2">
                    {isAdmin && onEditProduct && (
                        <button
                            type="button"
                            onClick={() => {
                                onClose();
                                onEditProduct(product);
                            }}
                            className="px-4 h-11 rounded-full bg-amber-700 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg transition"
                        >
                            <Edit3 className="w-3.5 h-3.5" aria-hidden="true" /> Edit
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close product details"
                        className="press w-11 h-11 rounded-full bg-ink/90 hover:bg-bronze-strong text-white flex items-center justify-center shadow-lg"
                    >
                        <X className="w-5 h-5" aria-hidden="true" />
                    </button>
                </div>

                {/* Phones: one scrolling column. Desktop: photos stay put while details scroll. */}
                <div className="flex-1 min-h-0 overflow-y-auto md:overflow-hidden md:grid md:grid-cols-2 custom-scrollbar">
                    <div className="h-[42dvh] md:h-auto md:min-h-[520px] border-b md:border-b-0 md:border-r border-stone-200">
                        <ProductGallery
                            images={gallery}
                            alt={product.name}
                            badge={available ? product.badge : 'Pre-order'}
                            jumpTo={galleryJump}
                        />
                    </div>

                    <div className="md:overflow-y-auto custom-scrollbar p-5 sm:p-7 md:pt-14 space-y-5">
                        <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-bronze-deep">
                                {product.category}
                                {product.subcategory ? ` · ${product.subcategory}` : ''}
                            </span>
                            <h2
                                id="product-modal-title"
                                className="font-serif text-[1.75rem] sm:text-4xl font-semibold text-ink mt-1 pr-12 md:pr-0 leading-[1.1]"
                            >
                                {product.name}
                            </h2>
                            {summary?.rating && (
                                <StarRating
                                    value={summary.rating.average}
                                    count={summary.rating.count}
                                    size="md"
                                    className="mt-2"
                                />
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                            <span className="text-3xl sm:text-4xl font-bold text-ink tabular-nums tracking-tight">
                                {formatGBP(unitPrice)}
                            </span>
                            {wasPrice && (
                                <>
                                    <span className="text-base text-stone-500 line-through tabular-nums">
                                        <span className="sr-only">Was </span>
                                        {formatGBP(wasPrice)}
                                    </span>
                                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-800 border border-red-200">
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

                        {loadError && (
                            <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
                                {loadError}
                            </p>
                        )}

                        {product.colors?.length > 0 && (
                            <fieldset>
                                <legend className="text-sm font-semibold text-stone-700 mb-2">
                                    Colour: <span className="text-bronze-deep">{selections.color}</span>
                                </legend>
                                <div className="flex flex-wrap gap-2">
                                    {product.colors.map((color) => (
                                        <button
                                            key={color}
                                            type="button"
                                            aria-pressed={selections.color === color}
                                            onClick={() => chooseColour(color)}
                                            className={`min-h-11 pl-2.5 pr-4 rounded-full text-sm border flex items-center gap-2 transition ${
                                                selections.color === color
                                                    ? 'border-ink bg-ink text-white font-semibold'
                                                    : 'border-stone-300 bg-white text-stone-700 hover:border-bronze'
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
                                <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-ink mb-1.5">
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
                                        className="mt-1 min-h-11 text-sm font-semibold text-bronze-deep hover:underline underline-offset-4"
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
                                <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-ink mb-2">
                                    Key features
                                </h3>
                                <ul className="space-y-1.5 text-sm text-stone-700">
                                    {activeDetail.features.map((feature, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                            <Check className="w-4 h-4 text-bronze shrink-0 mt-0.5" aria-hidden="true" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Reassurance before the buy decision */}
                        <div className="rounded-2xl border border-stone-200 p-4 space-y-4">
                            <TrustBar siteSettings={siteSettings} variant="compact" />
                            <ul className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-stone-700 pt-3 border-t border-stone-100">
                                <li className="flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-bronze shrink-0" aria-hidden="true" />
                                    Secure checkout
                                </li>
                                <li className="flex items-center gap-2">
                                    <RotateCcw className="w-4 h-4 text-bronze shrink-0" aria-hidden="true" />
                                    14-day returns online
                                </li>
                            </ul>
                            <PaymentBadges paymentOptions={siteSettings?.paymentOptions} />
                            <a
                                href={whatsAppLink(siteSettings, productEnquiryMessage(product, selections, unitPrice))}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="min-h-11 w-full rounded-full border border-[#1F8F4E] text-[#17703D] hover:bg-[#1F8F4E] hover:text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                            >
                                <MessageCircle className="w-4 h-4" aria-hidden="true" />
                                Ask about this on WhatsApp
                            </a>
                        </div>

                        <ProductReviews product={product} />

                        {onOpenProduct && (
                            <SimilarProducts
                                product={product}
                                onSelect={(next) => {
                                    // Show the chosen product from the top.
                                    panelRef.current
                                        ?.querySelectorAll('[class*="overflow-y-auto"]')
                                        .forEach((el) => el.scrollTo({ top: 0 }));
                                    onOpenProduct(next);
                                }}
                            />
                        )}
                    </div>
                </div>

                {/* Always-visible purchase bar */}
                <div className="shrink-0 border-t border-stone-200 bg-white px-4 sm:px-7 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex items-center gap-4 shadow-[0_-8px_24px_-16px_rgba(28,27,24,0.35)]">
                    <div className="min-w-0">
                        <p className="text-xl font-bold text-ink leading-tight tabular-nums">{formatGBP(unitPrice)}</p>
                        <p className="text-xs text-stone-500 truncate">
                            Free local delivery · assembly optional
                        </p>
                    </div>
                    <div className="flex-1 shrink-0 flex flex-col items-end">
                        {addError && (
                            <p role="alert" className="text-xs text-red-700 mb-1 text-right">
                                {addError}
                            </p>
                        )}
                        <button
                            type="button"
                            onClick={handleAdd}
                            disabled={waitingForOptions || Boolean(loadError)}
                            className="press w-full sm:w-auto sm:min-w-[260px] min-h-14 px-6 sm:px-8 whitespace-nowrap rounded-full bg-ink hover:bg-bronze-strong disabled:bg-stone-300 text-white font-semibold text-base shadow-md"
                        >
                            {available ? 'Add to basket' : 'Pre-order'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
