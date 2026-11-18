import { Plus, Minus } from 'lucide-react';

/** Quantity control with 44px tap targets. */
export default function QtyStepper({ value, onDecrease, onIncrease, max, itemName }) {
    const buttonClass =
        'w-11 h-11 flex items-center justify-center rounded-full text-stone-600 hover:text-ink hover:bg-white transition disabled:opacity-30';
    return (
        <div className="inline-flex items-center rounded-full border border-stone-300 bg-cream">
            <button
                type="button"
                onClick={onDecrease}
                aria-label={value <= 1 ? `Remove ${itemName}` : `Decrease quantity of ${itemName}`}
                className={buttonClass}
            >
                <Minus className="w-4 h-4" aria-hidden="true" />
            </button>
            <span className="w-7 text-center text-sm font-bold tabular-nums" aria-live="polite">
                <span className="sr-only">Quantity </span>
                {value}
            </span>
            <button
                type="button"
                onClick={onIncrease}
                disabled={max !== undefined && value >= max}
                aria-label={`Increase quantity of ${itemName}`}
                className={buttonClass}
            >
                <Plus className="w-4 h-4" aria-hidden="true" />
            </button>
        </div>
    );
}
