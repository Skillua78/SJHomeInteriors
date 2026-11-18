import { X, Trash2, ArrowRight, ShoppingBag, Truck, RotateCcw } from 'lucide-react';
import { validateSafeImageUrl } from '../utils/security';
import { cartTotals, MAX_QTY_PER_LINE } from '../utils/catalogModel';
import { formatGBP } from '../../shared/pricing.js';
import { useDialog, useTransitionState } from '../hooks/useDialog';
import QtyStepper from './ui/QtyStepper';
import PaymentBadges from './ui/PaymentBadges';

export default function CartDrawer({
    isOpen,
    onClose,
    cart,
    onUpdateQty,
    onRemoveItem,
    onGoToBasketPage,
    siteSettings,
}) {
    const { mounted, state } = useTransitionState(isOpen, 320);
    const panelRef = useDialog(isOpen, onClose);

    if (!mounted) return null;

    const totals = cartTotals(cart);
    const itemCount = cart.reduce((sum, item) => sum + item.qty, 0);
    const freeMiles = Number(siteSettings?.freeDeliveryMiles ?? 10);

    return (
        <div className="fixed inset-0 z-50">
            <div
                data-state={state}
                onClick={onClose}
                aria-hidden="true"
                className="overlay-fade absolute inset-0 bg-ink/55 backdrop-blur-xs"
            />
            <div
                ref={panelRef}
                data-dialog-panel
                data-state={state}
                role="dialog"
                aria-modal="true"
                aria-labelledby="cart-drawer-title"
                tabIndex={-1}
                className="drawer-right absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl flex flex-col outline-none"
            >
                <div className="flex items-center justify-between pl-5 pr-3 py-3 border-b border-stone-200">
                    <h2 id="cart-drawer-title" className="font-serif text-2xl font-bold">
                        Your basket
                        {itemCount > 0 && (
                            <span className="ml-2 font-sans text-sm font-semibold text-stone-500">
                                ({itemCount} {itemCount === 1 ? 'item' : 'items'})
                            </span>
                        )}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close basket"
                        className="w-11 h-11 rounded-full hover:bg-stone-100 flex items-center justify-center transition"
                    >
                        <X className="w-5 h-5" aria-hidden="true" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-5 py-4 space-y-3 custom-scrollbar">
                    {cart.length === 0 ? (
                        <div className="text-center py-16 text-stone-500 space-y-4">
                            <ShoppingBag className="w-10 h-10 mx-auto text-stone-300" aria-hidden="true" />
                            <p className="text-base">Your basket is empty.</p>
                            <button
                                type="button"
                                onClick={onClose}
                                className="press min-h-11 px-6 rounded-full bg-ink hover:bg-bronze-strong text-white text-sm font-semibold"
                            >
                                Browse furniture
                            </button>
                        </div>
                    ) : (
                        cart.map((item) => (
                            <div
                                key={item.key}
                                className="flex gap-3 p-3 rounded-2xl bg-cream border border-stone-200/70"
                            >
                                <img
                                    src={validateSafeImageUrl(item.image) || undefined}
                                    alt=""
                                    className="w-20 h-20 rounded-xl object-cover bg-stone-200 shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-1">
                                        <p className="text-sm font-bold text-ink leading-snug pt-1">{item.name}</p>
                                        <button
                                            type="button"
                                            onClick={() => onRemoveItem(item.key)}
                                            aria-label={`Remove ${item.name}`}
                                            className="-mt-1.5 -mr-1.5 w-11 h-11 shrink-0 rounded-full flex items-center justify-center text-stone-400 hover:text-red-700 hover:bg-white transition"
                                        >
                                            <Trash2 className="w-4 h-4" aria-hidden="true" />
                                        </button>
                                    </div>
                                    {item.label && item.label !== 'Standard' && (
                                        <p className="text-xs text-stone-600 -mt-1">{item.label}</p>
                                    )}
                                    <div className="flex items-center justify-between gap-2 mt-2">
                                        <QtyStepper
                                            value={item.qty}
                                            max={MAX_QTY_PER_LINE}
                                            itemName={item.name}
                                            onDecrease={() => onUpdateQty(item.key, -1)}
                                            onIncrease={() => onUpdateQty(item.key, 1)}
                                        />
                                        <span className="text-base font-bold text-ink tabular-nums">
                                            {formatGBP(item.unitPrice * item.qty)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {cart.length > 0 && (
                    <div className="px-4 sm:px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-stone-200 space-y-3 bg-white">
                        <div className="flex justify-between items-baseline">
                            <span className="text-sm font-semibold text-stone-700">Subtotal</span>
                            <span className="text-2xl font-bold text-ink tabular-nums">
                                {formatGBP(totals.subtotal)}
                            </span>
                        </div>
                        <ul className="grid grid-cols-2 gap-2 text-xs text-stone-600">
                            <li className="flex items-center gap-1.5">
                                <Truck className="w-4 h-4 text-bronze shrink-0" aria-hidden="true" />
                                Free delivery within {freeMiles} miles
                            </li>
                            <li className="flex items-center gap-1.5">
                                <RotateCcw className="w-4 h-4 text-bronze shrink-0" aria-hidden="true" />
                                14-day returns online
                            </li>
                        </ul>

                        <button
                            type="button"
                            onClick={onGoToBasketPage}
                            className="press w-full min-h-14 rounded-full bg-ink hover:bg-bronze-strong text-white font-semibold text-base shadow-lg flex items-center justify-center gap-2"
                        >
                            Checkout securely <ArrowRight className="w-4 h-4" aria-hidden="true" />
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full min-h-11 rounded-full text-sm font-semibold text-stone-700 hover:bg-stone-100 transition"
                        >
                            Continue shopping
                        </button>
                        <PaymentBadges paymentOptions={siteSettings?.paymentOptions} className="pt-1" />
                    </div>
                )}
            </div>
        </div>
    );
}
