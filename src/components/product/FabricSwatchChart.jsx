import { useState } from 'react';
import { FABRIC_INFOGRAPHICS } from '../../data/products';
import { validateSafeImageUrl } from '../../utils/security';

/** Tappable colour chart for the selected fabric. Choosing a shade sets the colour. */
export default function FabricSwatchChart({ fabric, chosenColor, onChooseColor, customImages }) {
    const [imageFailed, setImageFailed] = useState({});
    const chart = fabric ? FABRIC_INFOGRAPHICS[fabric] : null;
    const customImage = fabric ? validateSafeImageUrl(customImages?.[fabric]) : '';
    const imageUrl = customImage || (chart?.image && !imageFailed[fabric] ? chart.image : '');

    if (!chart && !imageUrl) return null;

    return (
        <div className="rounded-2xl overflow-hidden border border-stone-200 bg-white">
            {imageUrl && (
                <img
                    src={imageUrl}
                    alt={`${fabric} fabric colours`}
                    loading="lazy"
                    onError={() => setImageFailed((prev) => ({ ...prev, [fabric]: true }))}
                    className="w-full max-h-72 object-contain bg-stone-50 border-b border-stone-200"
                />
            )}

            {chart && (
                <>
                    <div className="grid grid-cols-3">
                        {chart.swatches.map((sw) => {
                            const shade = `${fabric} - ${sw.name}`;
                            const selected = chosenColor === sw.name || chosenColor === shade;
                            return (
                                <button
                                    key={sw.name}
                                    type="button"
                                    aria-pressed={selected}
                                    onClick={() => onChooseColor(shade)}
                                    title={`Select ${shade}`}
                                    style={{
                                        backgroundColor: sw.hex,
                                        backgroundImage: chart.textureStyle,
                                        backgroundSize: chart.textureSize,
                                    }}
                                    className={`${
                                        sw.span === 3 ? 'col-span-3' : 'col-span-1'
                                    } h-14 flex items-center justify-center border border-black/10 cursor-pointer transition hover:brightness-110`}
                                >
                                    <span
                                        className={`text-xs font-bold px-2 py-0.5 rounded ${
                                            sw.textDark ? 'text-[#1C1B18] bg-white/70' : 'text-white bg-black/35'
                                        } ${selected ? 'ring-2 ring-white' : ''}`}
                                    >
                                        {sw.name}
                                        {selected ? ' ✓' : ''}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                    <p className="px-3 py-2 text-xs text-stone-600 text-center border-t border-stone-200">
                        <strong className="text-[#1C1B18]">{chart.title}</strong> · tap a shade to select it
                    </p>
                </>
            )}
        </div>
    );
}
