import { useState, useEffect, useRef } from 'react';
import { ArrowRight, MapPin, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { validateSafeImageUrl } from '../utils/security';

const FALLBACK_SLIDE =
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1600&q=85';
const SLIDE_MS = 5500;

export default function Hero({ onNavigate, siteSettings, ready = true }) {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [paused, setPaused] = useState(false);
    // Only download a slide once it is about to be shown, not all of them on page load.
    const [loaded, setLoaded] = useState(() => new Set([0, 1]));

    const rawSlides =
        Array.isArray(siteSettings?.heroImages) && siteSettings.heroImages.length > 0
            ? siteSettings.heroImages
            : [FALLBACK_SLIDE];
    const slides = rawSlides.map((u) => validateSafeImageUrl(u)).filter(Boolean);
    if (slides.length === 0) slides.push(FALLBACK_SLIDE);
    const count = slides.length;
    const active = currentSlide % count;

    useEffect(() => {
        setLoaded((prev) => {
            const next = (active + 1) % count;
            if (prev.has(active) && prev.has(next)) return prev;
            return new Set([...prev, active, next]);
        });
    }, [active, count]);

    useEffect(() => {
        if (count <= 1 || paused) return undefined;
        if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
        const timer = setInterval(() => setCurrentSlide((prev) => (prev + 1) % count), SLIDE_MS);
        return () => clearInterval(timer);
    }, [count, paused]);

    const go = (delta) => setCurrentSlide((prev) => (prev + delta + count) % count);

    // Swipe between slides on phones.
    const touchStart = useRef(null);
    const onTouchStart = (e) => {
        touchStart.current = e.touches[0].clientX;
    };
    const onTouchEnd = (e) => {
        if (touchStart.current === null) return;
        const dx = e.changedTouches[0].clientX - touchStart.current;
        touchStart.current = null;
        if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
    };

    const badgeText = siteSettings?.heroBadge || 'Maltby Showroom • Quality Furniture, Affordable Prices';
    const titleText = siteSettings?.heroTitle || 'Quality Sofas, Beds & Dining at Prices You’ll Love';
    const subtitleText =
        siteSettings?.heroSubtitle ||
        'Why pay inflated high-street retail markups? We supply durable, British-built sofas, ottoman beds, and dining sets at honest, affordable showroom prices—complete with fast local delivery.';

    return (
        <section className="relative overflow-hidden bg-ink text-white">
            {/* Soft warm glow behind the headline */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-40 -left-40 w-[36rem] h-[36rem] rounded-full bg-bronze/20 blur-3xl"
            />
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 lg:py-20">
                <div
                    aria-busy={!ready}
                    className={`grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center transition-opacity duration-300 ${
                        ready ? 'opacity-100' : 'opacity-0'
                    }`}
                >
                    <div className="lg:col-span-6 space-y-5 sm:space-y-6 text-left">
                        <p className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-gold/30 text-gold text-xs font-semibold tracking-wide">
                            <Sparkles className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                            <span>{badgeText}</span>
                        </p>

                        <h1 className="font-serif text-[2.5rem] sm:text-5xl lg:text-[4rem] font-bold leading-[1.05] text-white text-balance">
                            {titleText}
                        </h1>

                        <p className="text-base sm:text-lg text-stone-300 leading-relaxed max-w-xl">
                            {subtitleText}
                        </p>

                        <div className="flex flex-col min-[420px]:flex-row min-[420px]:flex-wrap gap-3 pt-1">
                            <button
                                type="button"
                                onClick={() =>
                                    document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' })
                                }
                                className="press group/cta min-h-14 px-8 rounded-full bg-gold hover:bg-white text-ink text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-black/30"
                            >
                                Explore collection
                                <ArrowRight
                                    className="w-4 h-4 transition-transform group-hover/cta:translate-x-0.5"
                                    aria-hidden="true"
                                />
                            </button>

                            <button
                                type="button"
                                onClick={() => onNavigate('contact')}
                                className="press min-h-14 px-7 rounded-full bg-white/5 hover:bg-white/15 border border-white/25 text-white text-sm font-semibold uppercase tracking-wider flex items-center justify-center gap-2"
                            >
                                <MapPin className="w-4 h-4 text-gold" aria-hidden="true" /> Visit showroom
                            </button>
                        </div>
                    </div>

                    <div className="lg:col-span-6">
                        <div
                            className="relative rounded-3xl overflow-hidden shadow-2xl shadow-black/40 border border-white/10 aspect-[4/3] sm:aspect-[16/11] bg-ink-soft select-none"
                            onMouseEnter={() => setPaused(true)}
                            onMouseLeave={() => setPaused(false)}
                            onTouchStart={onTouchStart}
                            onTouchEnd={onTouchEnd}
                            aria-roledescription="carousel"
                            aria-label="Showroom photos"
                        >
                            {slides.map((imgUrl, idx) => {
                                const isActive = idx === active;
                                const panClass = idx % 2 === 0 ? 'animate-pan-right' : 'animate-pan-left';
                                if (!loaded.has(idx)) return null;
                                return (
                                    <img
                                        key={imgUrl + idx}
                                        src={imgUrl}
                                        alt={isActive ? `SJ Home Interiors showroom, photo ${idx + 1} of ${count}` : ''}
                                        aria-hidden={!isActive}
                                        decoding="async"
                                        fetchPriority={idx === 0 ? 'high' : 'low'}
                                        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
                                            isActive ? `opacity-100 z-10 ${panClass}` : 'opacity-0 z-0'
                                        }`}
                                    />
                                );
                            })}

                            <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/45 via-transparent to-transparent pointer-events-none" />

                            {count > 1 && (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => go(-1)}
                                        aria-label="Previous photo"
                                        className="press absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/45 hover:bg-black/75 backdrop-blur-sm text-white flex items-center justify-center z-20"
                                    >
                                        <ChevronLeft className="w-5 h-5" aria-hidden="true" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => go(1)}
                                        aria-label="Next photo"
                                        className="press absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/45 hover:bg-black/75 backdrop-blur-sm text-white flex items-center justify-center z-20"
                                    >
                                        <ChevronRight className="w-5 h-5" aria-hidden="true" />
                                    </button>

                                    {/* Phones: a simple counter. Larger screens: clickable dots. */}
                                    <span className="sm:hidden absolute bottom-3 left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded-full bg-black/55 text-xs font-semibold tabular-nums">
                                        {active + 1} / {count}
                                    </span>
                                    <div className="hidden sm:flex absolute bottom-2 left-1/2 -translate-x-1/2 items-center z-20 px-1 rounded-full bg-black/40 backdrop-blur-xs">
                                        {slides.map((_, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => setCurrentSlide(idx)}
                                                aria-label={`Show photo ${idx + 1}`}
                                                aria-current={idx === active}
                                                className="h-9 w-7 flex items-center justify-center"
                                            >
                                                <span
                                                    aria-hidden="true"
                                                    className={`h-2 rounded-full transition-all duration-300 ${
                                                        idx === active ? 'w-5 bg-gold' : 'w-2 bg-white/55'
                                                    }`}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
