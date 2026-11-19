import { Trash2 } from 'lucide-react';
import QtyStepper from '../ui/QtyStepper';
import { validateSafeImageUrl } from '../../utils/security';
import { formatGBP } from '../../../shared/pricing.js';
import { MAX_QTY_PER_LINE } from '../../utils/catalogModel';

export default function BasketLines({ cart, onUpdateQty, onRemoveItem }) {
    return (
        <ul className="space-y-3">
            {cart.map((item) => (
                <li
                    key={item.key}
                    className="p-4 rounded-2xl bg-white border border-stone-200 flex gap-4"
                >
                    <img
                        src={validateSafeImageUrl(item.image) || undefined}
                        alt=""
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover bg-stone-100 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <p className="font-serif text-lg font-semibold text-ink leading-snug">
                                    {item.name}
                                </p>
                                {item.label && item.label !== 'Standard' && (
                                    <p className="text-xs text-stone-500 mt-0.5">{item.label}</p>
                                )}
                            </div>
                            <p className="text-base font-bold text-ink shrink-0 tabular-nums">
                                {formatGBP(item.unitPrice * item.qty)}
                            </p>
                        </div>

                        <div className="flex items-center justify-between gap-3 mt-3">
                            <QtyStepper
                                value={item.qty}
                                max={MAX_QTY_PER_LINE}
                                itemName={item.name}
                                onDecrease={() => onUpdateQty(item.key, -1)}
                                onIncrease={() => onUpdateQty(item.key, 1)}
                            />

                            <div className="flex items-center gap-1">
                                {item.qty > 1 && (
                                    <span className="text-xs text-stone-500">
                                        {formatGBP(item.unitPrice)} each
                                    </span>
                                )}
                                <button
                                    type="button"
                                    onClick={() => onRemoveItem(item.key)}
                                    aria-label={`Remove ${item.name} from basket`}
                                    className="w-11 h-11 rounded-full flex items-center justify-center text-stone-400 hover:text-red-700 hover:bg-stone-100 transition"
                                >
                                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                                </button>
                            </div>
                        </div>
                    </div>
                </li>
            ))}
        </ul>
    );
}
