import { departmentCards } from '../data/products';

export default function CategoryGrid({ onSelectCategory }) {
    return (
        <section id="categories" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
                <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-[#9A7B56]">
                        Curated Spaces
                    </span>
                    <h2 className="font-serif text-3xl sm:text-4xl font-bold mt-1">
                        Shop by Department
                    </h2>
                </div>
                <p className="text-sm text-stone-600 max-w-md mt-2 md:mt-0">
                    From statement U-shape corner units to complete bedroom and dining suites.
                </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                {departmentCards.map((dept, idx) => (
                    <a
                        key={idx}
                        href="#catalog"
                        onClick={() => onSelectCategory(dept.categoryFilter)}
                        className="group relative rounded-2xl overflow-hidden aspect-[4/5] bg-stone-900"
                    >
                        <img
                            src={dept.image}
                            alt={dept.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500 opacity-80"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4">
                            <span className="text-white font-serif text-lg font-semibold">
                                {dept.title}
                            </span>
                            <span className="text-[11px] text-stone-300 group-hover:text-[#9A7B56] transition">
                                {dept.subtitle} &rarr;
                            </span>
                        </div>
                    </a>
                ))}
            </div>
        </section>
    );
}