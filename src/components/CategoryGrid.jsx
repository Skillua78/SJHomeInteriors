import { ArrowUpRight } from 'lucide-react';

const DEFAULT_CATEGORY_IMAGES = {
    Sofas: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
    Beds: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80',
    Tables: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=800&q=80',
    Chairs: 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?auto=format&fit=crop&w=800&q=80',
    Wardrobes: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80',
    Cabinets: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80',
    Outdoor: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80',
};

export default function CategoryGrid({ onSelectCategory, products = [] }) {
    // Group products by category so only categories with >= 1 item appear
    const categoryStats = [];
    const seen = new Set();

    products.forEach((p) => {
        const cat = (p.category || '').trim();
        if (!cat) return;
        if (!seen.has(cat)) {
            seen.add(cat);
            const matching = products.filter((item) => item.category === cat);
            categoryStats.push({
                id: cat,
                title: cat,
                count: matching.length,
                image:
                    matching[0]?.image ||
                    DEFAULT_CATEGORY_IMAGES[cat] ||
                    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
            });
        }
    });

    if (categoryStats.length === 0) return null;

    return (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-b border-stone-200/80">
            <div className="flex items-end justify-between mb-8">
                <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-[#9A7B56]">
                        Browse by Room & Department
                    </span>
                    <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#1C1B18] mt-1">
                        Curated Collections
                    </h2>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {categoryStats.map((cat) => (
                    <button
                        key={cat.id}
                        type="button"
                        onClick={() => onSelectCategory(cat.id)}
                        className="group relative aspect-[4/5] rounded-2xl overflow-hidden bg-stone-900 text-left cursor-pointer shadow-xs hover:shadow-xl transition"
                    >
                        <img
                            src={cat.image}
                            alt={cat.title}
                            loading="lazy"
                            className="w-full h-full object-cover opacity-85 group-hover:scale-110 transition duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <div className="absolute bottom-3.5 left-3.5 right-3.5 flex items-end justify-between text-white">
                            <div>
                                <h3 className="font-serif text-lg font-bold leading-tight">{cat.title}</h3>
                                <span className="text-[10px] text-stone-300 font-medium">
                                    {cat.count} {cat.count === 1 ? 'Item' : 'Items'}
                                </span>
                            </div>
                            <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center group-hover:bg-[#9A7B56] transition">
                                <ArrowUpRight className="w-4 h-4" />
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </section>
    );
}