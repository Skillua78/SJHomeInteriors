import { Truck, ShieldCheck, Store, PoundSterling } from 'lucide-react';

export default function ValueBar({ siteSettings }) {
    const showAssembly = siteSettings?.showAssemblyHighlight !== false;
    const assemblyTitle = siteSettings?.assemblyTitle || 'Two-Person Delivery & Assembly';
    const assemblySubtitle =
        siteSettings?.assemblySubtitle ||
        `Standard charge £${Number(siteSettings?.defaultDeliveryFee ?? 50)} per item`;

    const items = [
        { icon: PoundSterling, title: 'Affordable Direct Prices', sub: 'No High-Street Markups' },
        { icon: ShieldCheck, title: 'Built-to-Last Quality', sub: 'Solid Frames & Durable Fabrics' },
        { icon: Store, title: 'Maltby High Street Showroom', sub: 'Try Before You Buy' },
        ...(showAssembly && assemblyTitle.trim()
            ? [{ icon: Truck, title: assemblyTitle, sub: assemblySubtitle }]
            : []),
    ];

    return (
        <section aria-label="Why shop with us" className="bg-white border-b border-stone-200/80">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
                <ul
                    className={`grid grid-cols-1 sm:grid-cols-2 ${
                        items.length === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'
                    } gap-3`}
                >
                    {items.map((item) => {
                        const Icon = item.icon;
                        return (
                            <li
                                key={item.title}
                                className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-[#FAF8F5] border border-stone-200/60"
                            >
                                <div className="p-2.5 rounded-xl bg-[#1C1B18] text-[#D4B895] shrink-0">
                                    <Icon className="w-5 h-5" aria-hidden="true" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-[#1C1B18] leading-snug">{item.title}</p>
                                    {item.sub && (
                                        <p className="text-xs font-medium text-[#7D6242] mt-0.5">{item.sub}</p>
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </section>
    );
}
