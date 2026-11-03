import { useState, useEffect } from 'react';
import { ArrowRight, MapPin, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { validateSafeImageUrl } from '../utils/security';

export default function Hero({ onNavigate, siteSettings }) {
    const [currentSlide, setCurrentSlide] = useState(0);

    const rawSlides =
        Array.isArray(siteSettings?.heroImages) && siteSettings.heroImages.length > 0
            ? siteSettings.heroImages
            : [
                'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1600&q=85',
            ];

    const slides = rawSlides.map((u) => validateSafeImageUrl(u)).filter(Boolean);
    if (slides.length === 0) {
        slides.push(
            'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1600&q=85'
        );
    }

    // Auto-advance slideshow every 5.5 seconds if multiple images exist
    useEffect(() => {
        if (slides.length <= 1) return;
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 5500);
        return () => clearInterval(timer);
    }, [slides.length]);

    const badgeText =
        siteSettings?.heroBadge || 'Maltby Showroom • Quality Furniture, Affordable Prices';
    const titleText =
        siteSettings?.heroTitle || 'Quality Sofas, Beds & Dining at Prices You’ll Love';
    const subtitleText =
        siteSettings?.heroSubtitle ||
        'Why pay inflated high-street retail markups? We supply durable, British-built sofas, ottoman beds, and dining sets at honest, affordable showroom prices—complete with fast local delivery.';
    return (
        <section className="relative overflow-hidden bg-[#1C1B18] text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                    {/* Left Column: Editable Main Page Text */}
                    <div className="lg:col-span-6 space-y-6 text-left">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-[#D4B895] text-xs font-semibold tracking-wide">
                            <Sparkles className="w-3.5 h-3.5 shrink-0" />
                            <span>{badgeText}</span>
                        </div>

                        <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight text-white">
                            {titleText}
                        </h1>

                        <p className="text-sm sm:text-base text-stone-300 leading-relaxed max-w-xl">
                            {subtitleText}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() =>
                                    document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' })
                                }
                                className="px-7 py-4 rounded-full bg-[#9A7B56] hover:bg-[#866947] text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition cursor-pointer shadow-lg"
                            >
                                Explore Collection <ArrowRight className="w-4 h-4" />
                            </button>

                            <button
                                type="button"
                                onClick={() => onNavigate('contact')}
                                className="px-6 py-4 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition cursor-pointer"
                            >
                                <MapPin className="w-4 h-4 text-[#D4B895]" /> Visit Showroom
                            </button>
                        </div>
                    </div>

                    {/* Right Column: Interactive Showroom & Furniture Slideshow */}
                    <div className="lg:col-span-6">
                        <div className="relative aspect-[4/3] rounded-3xl overflow-hidden border border-white/15 shadow-2xl bg-stone-900 group select-none">
                            <img
                                src={slides[currentSlide % slides.length]}
                                alt={`SJ Home Interiors Showcase ${currentSlide + 1}`}
                                className="w-full h-full object-cover transition-all duration-700"
                            />

                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

                            {slides.length > 1 && (
                                <>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
                                        }
                                        aria-label="Previous slideshow image"
                                        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/55 hover:bg-black/80 text-white flex items-center justify-center transition cursor-pointer"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
                                        aria-label="Next slideshow image"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/55 hover:bg-black/80 text-white flex items-center justify-center transition cursor-pointer"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>

                                    {/* Slide Dots */}
                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/50 backdrop-blur-xs px-3 py-1.5 rounded-full">
                                        {slides.map((_, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => setCurrentSlide(idx)}
                                                aria-label={`Go to slide ${idx + 1}`}
                                                className={`h-2 rounded-full transition-all cursor-pointer ${idx === currentSlide % slides.length
                                                    ? 'w-6 bg-[#D4B895]'
                                                    : 'w-2 bg-white/50 hover:bg-white/80'
                                                    }`}
                                            />
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