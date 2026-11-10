import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';

const ZOOM_STEPS = [1, 1.75, 2.5];

/** Photo viewer with click-to-zoom, keyboard-friendly arrows and thumbnails. */
export default function ProductGallery({ images, alt, badge }) {
    const [index, setIndex] = useState(0);
    const [zoom, setZoom] = useState(1);
    const [origin, setOrigin] = useState({ x: 50, y: 50 });

    // Start again from the first photo when a different gallery is shown.
    const galleryKey = images.join('|');
    useEffect(() => {
        setIndex(0);
        setZoom(1);
    }, [galleryKey]);

    const current = images[index % images.length];
    const many = images.length > 1;

    const show = (next) => {
        setZoom(1);
        setOrigin({ x: 50, y: 50 });
        setIndex((next + images.length) % images.length);
    };

    const cycleZoom = () => setZoom((z) => ZOOM_STEPS[(ZOOM_STEPS.indexOf(z) + 1) % ZOOM_STEPS.length]);

    const handleMove = (e) => {
        if (zoom <= 1) return;
        const rect = e.currentTarget.getBoundingClientRect();
        setOrigin({
            x: Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)),
            y: Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100)),
        });
    };

    return (
        <div className="flex flex-col h-full bg-[#F4F1EA]">
            <div
                onMouseMove={handleMove}
                onClick={cycleZoom}
                className={`relative flex-1 min-h-[260px] sm:min-h-[360px] flex items-center justify-center overflow-hidden select-none ${
                    zoom > 1 ? 'cursor-zoom-out' : 'cursor-zoom-in'
                }`}
            >
                <img
                    src={current}
                    alt={`${alt} - photo ${index + 1} of ${images.length}`}
                    style={{ transform: `scale(${zoom})`, transformOrigin: `${origin.x}% ${origin.y}%` }}
                    className="max-w-full max-h-full w-auto h-auto object-contain transition-transform duration-200"
                />

                {badge && zoom === 1 && (
                    <span className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-semibold bg-[#1C1B18] text-white">
                        {badge}
                    </span>
                )}

                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        cycleZoom();
                    }}
                    aria-label={zoom > 1 ? 'Zoom out' : 'Zoom in'}
                    className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-[#1C1B18]/85 hover:bg-[#1C1B18] text-white flex items-center justify-center shadow-lg cursor-pointer"
                >
                    {zoom === ZOOM_STEPS[ZOOM_STEPS.length - 1] ? (
                        <ZoomOut className="w-4 h-4" />
                    ) : (
                        <ZoomIn className="w-4 h-4" />
                    )}
                </button>

                {many && (
                    <>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                show(index - 1);
                            }}
                            aria-label="Previous photo"
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center cursor-pointer"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                show(index + 1);
                            }}
                            aria-label="Next photo"
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center cursor-pointer"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </>
                )}
            </div>

            {many && (
                <div className="p-3 bg-white border-t border-stone-200 flex items-center gap-2 overflow-x-auto custom-scrollbar shrink-0">
                    {images.map((url, idx) => (
                        <button
                            key={url}
                            type="button"
                            onClick={() => show(idx)}
                            aria-label={`Show photo ${idx + 1}`}
                            aria-current={idx === index}
                            className={`w-16 h-14 rounded-xl overflow-hidden border-2 bg-stone-100 shrink-0 transition cursor-pointer ${
                                idx === index
                                    ? 'border-[#9A7B56]'
                                    : 'border-transparent opacity-70 hover:opacity-100'
                            }`}
                        >
                            <img src={url} alt="" loading="lazy" className="w-full h-full object-cover" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
