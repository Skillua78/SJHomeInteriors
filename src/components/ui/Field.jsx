/**
 * Labelled text input. 16px text on phones stops iOS zooming the page on focus.
 */
export default function Field({ id, label, error, className = '', hint, ...inputProps }) {
    return (
        <div className={className}>
            <label htmlFor={id} className="block text-xs font-semibold text-stone-700 mb-1">
                {label}
            </label>
            <input
                id={id}
                aria-invalid={error ? 'true' : undefined}
                {...inputProps}
                className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-base sm:text-sm text-[#1C1B18] placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#9A7B56]/30 focus:border-[#9A7B56] ${
                    error ? 'border-red-400' : 'border-stone-300'
                }`}
            />
            {hint && <p className="text-[11px] text-stone-500 mt-1">{hint}</p>}
        </div>
    );
}
