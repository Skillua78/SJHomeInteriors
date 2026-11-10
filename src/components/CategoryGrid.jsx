import { ArrowUpRight } from 'lucide-react';
import { validateSafeImageUrl } from '../utils/security';

const DEFAULT_CATEGORY_IMAGES = {
    Sofas: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
    Beds: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80',
    Tables: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=800&q=80',
    Chairs: 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?auto=format&fit=crop&w=800&q=80',
    Wardrobes: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80',
    Cabinets: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80',
    Outdoor: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80',
};
const FALLBACK = DEFAULT_CATEGORY_IMAGES.Sofas;

// Full class names so Tailwind can see them; the grid adapts to how many categories exist.
const LG_COLUMNS = {
    1: 'lg:grid-cols-2',
    2: 'lg:grid-cols-2',
    3: 'lg:grid-cols-3',
    4: 'lg:grid-cols-4',
    5: 'lg:grid-cols-5',
};

/** Category tiles. `categories` comes from the catalogue facets: [{ name, count, image }]. */
export default function CategoryGrid({ categories = [], onSelectCategory }) {
    if (categories.length === 0) return null;

    const few = categories.length <= 4;

    return (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 border-b border-stone-200/80">
            <div className="mb-6 sm:mb-8">
                <span className="text-xs font-bold uppercase tracking-widest text-[#9A7B56]">
                    Browse by department
                </span>
                <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#1C1B18] mt-1">
                    Shop our collections
                </h2>
            </div>

            <div
                className={`grid grid-cols-2 sm:grid-cols-3 ${
                    LG_COLUMNS[categories.length] || 'lg:grid-cols-6'
                } gap-3 sm:gap-4`}
            >
                {categories.map((cat) => (
                    <button
                        key={cat.name}
                        type="button"
                        onClick={() => onSelectCategory(cat.name)}
                        className={`group relative ${
                            few ? 'aspect-[4/3]' : 'aspect-[4/5]'
                        } rounded-2xl overflow-hidden bg-stone-900 text-left cursor-pointer shadow-xs hover:shadow-xl transition`}
                    >
                        <img
                            src={
                                validateSafeImageUrl(cat.image) ||
                                DEFAULT_CATEGORY_IMAGES[cat.name] ||
                                FALLBACK
                            }
                            alt=""
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover opacity-85 group-hover:scale-110 transition duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <div className="absolute bottom-3.5 left-3.5 right-3.5 flex items-end justify-between text-white">
                            <div>
                                <span className="block font-serif text-xl font-bold leading-tight">
                                    {cat.name}
                                </span>
                                <span className="text-xs text-stone-200 font-medium">
                                    {cat.count} {cat.count === 1 ? 'item' : 'items'}
                                </span>
                            </div>
                            <span className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center group-hover:bg-[#9A7B56] transition">
                                <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                            </span>
                        </div>
                    </button>
                ))}
            </div>
        </section>
    );
}
