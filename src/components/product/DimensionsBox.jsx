import { Ruler } from 'lucide-react';

/** Dimensions for the chosen size (falling back to the product's defaults). */
export default function DimensionsBox({ variations, chosenSize, legacyDimensions = [] }) {
    const structured = variations?.structuredDimensions || {};
    const forSize = (chosenSize && structured.bySize?.[chosenSize]) || {};
    const fallback = structured.default || {};

    const dim = {
        Length: forSize.length || fallback.length || '',
        Width: forSize.width || fallback.width || '',
        'Depth / height': forSize.depth || fallback.depth || '',
    };
    const note = forSize.custom || fallback.custom || '';
    const cells = Object.entries(dim).filter(([, value]) => value);

    if (cells.length === 0 && !note && legacyDimensions.length === 0) return null;

    return (
        <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-stone-200/80 space-y-2.5">
            <h4 className="font-sans text-xs font-bold uppercase tracking-wider text-[#1C1B18] flex items-center gap-1.5">
                <Ruler className="w-4 h-4 text-[#9A7B56]" aria-hidden="true" />
                Dimensions{chosenSize ? ` · ${chosenSize}` : ''}
            </h4>

            {cells.length > 0 && (
                <dl className="grid grid-cols-3 gap-2 text-center">
                    {cells.map(([label, value]) => (
                        <div key={label} className="p-2 rounded-xl bg-white border border-stone-200/80">
                            <dt className="text-[10px] uppercase text-stone-500 font-bold">{label}</dt>
                            <dd className="text-sm font-bold text-[#1C1B18]">{value}</dd>
                        </div>
                    ))}
                </dl>
            )}

            {note && (
                <p className="text-sm text-stone-700 bg-white p-2.5 rounded-xl border border-stone-200/60">
                    {note}
                </p>
            )}

            {cells.length === 0 && !note && (
                <ul className="space-y-1 text-sm text-stone-700 list-disc pl-5">
                    {legacyDimensions.map((line, i) => (
                        <li key={i}>{line}</li>
                    ))}
                </ul>
            )}
        </div>
    );
}
