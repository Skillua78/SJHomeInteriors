import { useState, useEffect, useRef } from 'react';
import { ArrowRight, MapPin, ChevronLeft, ChevronRight, Sofa, Store, BadgeCheck } from 'lucide-react';
import { validateSafeImageUrl } from '../utils/security';
import { DEFAULT_HOME_TEXT } from '../data/defaultSettings';

const FALLBACK_SLIDE =
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1600&q=85';
const SLIDE_MS = 5500;

const HIGHLIGHTS = [
    { icon: Sofa, text: 'Sofas, beds, dining & more' },
    { icon: BadgeCheck, text: 'Quality you can see and feel' },
    { icon: Store, text: 'Try before you buy in Maltby' },
];

/**
 * Full-width showroom slideshow with the headline over it. Each photo fades in and
 * slowly pans (animate-pan-left / animate-pan-right in index.css).
 */
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

    const badgeText = siteSettings?.heroBadge || DEFAULT_HOME_TEXT.heroBadge;
    const titleText = siteSettings?.heroTitle || DEFAULT_HOME_TEXT.heroTitle;
    const subtitleText = siteSettings?.heroSubtitle || DEFAULT_HOME_TEXT.heroSubtitle;

    return (
        <section
            className="relative isolate overflow-hidden bg-ink text-white flex flex-col sm:flex-row sm:min-h-[580px] lg:min-h-[640px]"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
        >
            {/* Slideshow: a photo above the text on phones, behind the text on larger screens */}
            <div className="relative h-56 min-[400px]:h-64 min-[480px]:h-80 -mb-px sm:mb-0 sm:absolute sm:inset-0 sm:h-auto -z-10 select-none overflow-hidden" aria-roledescription="carousel" aria-label="Showroom photos">
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
                                isActive ? `opacity-100 ${panClass}` : 'opacity-0'
                            }`}
                        />
                    );
                })}
                {/* Phones: a soft fade into the text below. Tablets: dark from the bottom. Desktop: dark from the left. */}
                <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/0 to-ink/0 sm:via-ink/80 sm:to-ink/5 lg:bg-gradient-to-r lg:from-ink/95 lg:via-ink/65 lg:to-ink/0" />
            </div>

            <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-1 pb-10 sm:pt-40 lg:py-24 flex items-end lg:items-center">
                <div
                    aria-busy={!ready}
                    className={`max-w-xl space-y-4 sm:space-y-6 transition-opacity duration-300 ${
                        ready ? 'opacity-100' : 'opacity-0'
                    }`}
                >
                    <p className="inline-flex items-center gap-2 text-gold text-xs sm:text-sm font-semibold tracking-wide">
                        <span className="w-6 h-px bg-gold" aria-hidden="true" />
                        {badgeText}
                    </p>

                    <h1 className="font-serif text-[2rem] sm:text-5xl lg:text-[3.5rem] font-extrabold leading-[1.05] tracking-tight text-white text-balance">
                        {titleText}
                    </h1>

                    <p className="text-[15px] sm:text-lg text-white/85 leading-relaxed">{subtitleText}</p>

                    <div className="flex flex-col min-[420px]:flex-row min-[420px]:flex-wrap gap-3 pt-1">
                        <button
                            type="button"
                            onClick={() => document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' })}
                            className="press group/cta min-h-14 px-8 rounded-xl bg-gold hover:bg-white text-ink text-base font-bold flex items-center justify-center gap-2 shadow-lg shadow-black/25"
                        >
                            Shop the range
                            <ArrowRight
                                className="w-4 h-4 transition-transform group-hover/cta:translate-x-0.5"
                                aria-hidden="true"
                            />
                        </button>
                        <button
                            type="button"
                            onClick={() => onNavigate('contact')}
                            className="press min-h-14 px-7 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/30 text-white text-base font-semibold flex items-center justify-center gap-2"
                        >
                            <MapPin className="w-4 h-4 text-gold" aria-hidden="true" /> Visit the showroom
                        </button>
                    </div>

                    <ul className="hidden sm:flex flex-wrap gap-x-6 gap-y-2 pt-2 text-sm text-white/85">
                        {HIGHLIGHTS.map(({ icon: Icon, text }) => (
                            <li key={text} className="flex items-center gap-2">
                                <Icon className="w-4 h-4 text-gold shrink-0" aria-hidden="true" />
                                {text}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {count > 1 && (
                <div className="absolute z-10 top-4 right-4 sm:top-auto sm:right-auto sm:bottom-5 sm:left-1/2 sm:-translate-x-1/2 flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => go(-1)}
                        aria-label="Previous photo"
                        className="press w-11 h-11 rounded-full bg-black/35 hover:bg-black/60 backdrop-blur-sm text-white flex items-center justify-center"
                    >
                        <ChevronLeft className="w-5 h-5" aria-hidden="true" />
                    </button>
                    {/* Phones: a counter. Larger screens: a dot for each photo. */}
                    <span className="sm:hidden px-2.5 py-1 rounded-full bg-black/45 text-xs font-semibold tabular-nums">
                        {active + 1} / {count}
                    </span>
                    <div className="hidden sm:flex items-center px-1 rounded-full bg-black/35 backdrop-blur-sm">
                        {slides.map((_, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => setCurrentSlide(idx)}
                                aria-label={`Show photo ${idx + 1}`}
                                aria-current={idx === active}
                                className="h-11 w-6 flex items-center justify-center"
                            >
                                <span
                                    aria-hidden="true"
                                    className={`h-1.5 rounded-full transition-all duration-300 ${
                                        idx === active ? 'w-5 bg-gold' : 'w-1.5 bg-white/60'
                                    }`}
                                />
                            </button>
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={() => go(1)}
                        aria-label="Next photo"
                        className="press w-11 h-11 rounded-full bg-black/35 hover:bg-black/60 backdrop-blur-sm text-white flex items-center justify-center"
                    >
                        <ChevronRight className="w-5 h-5" aria-hidden="true" />
                    </button>
                </div>
            )}
        </section>
    );
}
