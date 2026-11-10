/** One row of selectable option chips (size, fabric, mattress, lift…). */
export default function OptionGroup({ label, options, value, onChange, deltas = {}, action }) {
    if (!options || options.length === 0) return null;

    const deltaText = (name) => {
        const d = Number(deltas[name]) || 0;
        if (d === 0) return '';
        const amount = Number.isInteger(Math.abs(d)) ? Math.abs(d).toFixed(0) : Math.abs(d).toFixed(2);
        return d > 0 ? ` (+£${amount})` : ` (−£${amount})`;
    };

    return (
        <fieldset>
            <div className="flex items-center justify-between gap-3 mb-2">
                <legend className="text-sm font-semibold text-stone-700">
                    {label}: <span className="text-[#7D6242]">{value}</span>
                </legend>
                {action}
            </div>
            <div className="flex flex-wrap gap-2">
                {options.map((name) => {
                    const selected = value === name;
                    return (
                        <button
                            key={name}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => onChange(name)}
                            className={`px-3.5 py-2 rounded-xl text-sm border cursor-pointer transition ${
                                selected
                                    ? 'border-[#1C1B18] bg-[#1C1B18] text-white font-semibold'
                                    : 'border-stone-300 bg-white text-stone-700 hover:border-[#9A7B56]'
                            }`}
                        >
                            {name}
                            {deltaText(name)}
                        </button>
                    );
                })}
            </div>
        </fieldset>
    );
}
