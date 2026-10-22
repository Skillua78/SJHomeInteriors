import { ArrowRight } from 'lucide-react';

export default function Hero() {
    return (
        <section className="relative overflow-hidden bg-[#1C1B18] text-white">
            <div className="absolute inset-0 opacity-45">
                <img
                    src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=2000&q=85"
                    alt="SJ Home Interiors Showroom"
                    className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#1C1B18] via-[#1C1B18]/80 to-transparent" />
            </div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
                <div className="max-w-2xl">
                    <span className="inline-block px-3.5 py-1 rounded-full bg-[#9A7B56]/20 border border-[#9A7B56]/40 text-[#9A7B56] text-xs uppercase tracking-widest font-semibold mb-6">
                        New Showroom Collection
                    </span>
                    <h1 className="font-serif text-4xl sm:text-6xl font-semibold leading-[1.1] mb-6">
                        Crafted for Comfort. <br />
                        <span className="italic font-normal text-stone-300">
                            Designed for Living.
                        </span>
                    </h1>
                    <p className="text-stone-300 text-base sm:text-lg mb-8 leading-relaxed max-w-xl">
                        Explore our signature range of deep-filled U-shape sofas, luxury
                        pull-out sofa beds, and electric corner recliners. Delivered and
                        assembled in your room of choice within 2–10 days.
                    </p>
                    <div className="flex flex-wrap gap-4">
                        <a
                            href="#catalog"
                            className="px-7 py-4 bg-[#9A7B56] hover:bg-[#7D6242] text-white font-semibold text-sm rounded-full transition shadow-lg inline-flex items-center gap-2"
                        >
                            Explore Popular Models <ArrowRight className="w-4 h-4" />
                        </a>
                        <a
                            href="#categories"
                            className="px-7 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-semibold text-sm rounded-full border border-white/20 transition"
                        >
                            Browse by Room
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}